import { ANGLES, KP, KP_COUNT, VISIBLE_SCORE, type AngleId } from "./skeleton";
import { poseSupported, SPECIES, speciesByKey, type SpeciesKey } from "./species";
import type { AnimalInfo, Angles, GaitEstimate, GaitName, Sample, SessionSummary } from "./types";

/**
 * Movement analysis from tracked keypoints. Everything here is signal processing on the model's output: nothing is assumed
 * about a horse beyond textbook stride-frequency ranges, and every result carries its own confidence.
 *
 * Gait method (side or three-quarter view, a few seconds of steady movement): each paw's position along the body axis
 * (neck -> croup), as a fraction of body length, is a roughly periodic signal at the stride frequency. The dominant frequency of
 * the four paw signals is the stride frequency; their phase offsets at that frequency tell the gaits apart:
 *   walk   diagonal legs about a quarter-cycle apart, left and right of one pair half a cycle apart
 *   trot   diagonal legs in step (or, if the model swaps left and right, lateral legs), left and right half a cycle apart
 *   canter / gallop   the legs of a pair are NOT half a cycle apart; below about 1.95 strides/s is read as canter, above as gallop.
 * This is an experimental estimate for coaching and curiosity. It is not a veterinary or lameness assessment.
 */

export const GAIT_WINDOW_S = 4;
export const MIN_WINDOW_S = 2;
const RESAMPLE_HZ = 30;
const F_MIN = 0.5, F_MAX = 4.8, F_STEP = 0.02;
/** A moving average this long is subtracted from every leg signal first: slow drift (a turning body, a panning camera) is not a stride. */
const DETREND_S = 1.4;
/** Frames whose neck-to-tail length is below this share of the window's typical length are foreshortened (the animal faces or leaves the camera). */
const FORESHORTEN = 0.55;
export const CANTER_GALLOP_HZ = 1.95;
/** Below this confidence a gait estimate is reported as "unclear" in summaries and reports. */
export const CONFIDENT = 0.45;

export const GAIT_LABEL: Record<GaitName, string> = { standing: "Stationary", walk: "Walk", trot: "Trot", canter: "Canter", gallop: "Gallop", run: "Run", moving: "Moving (type unclear)", unclear: "Unclear" };

type P = { x: number; y: number; s: number };
const point = (kp: number[], k: number): P => ({ x: kp[k * 3], y: kp[k * 3 + 1], s: kp[k * 3 + 2] });

export function visibleCount(kp: number[], min = VISIBLE_SCORE): number {
  if (kp.length < KP_COUNT * 3) return 0;
  let n = 0;
  for (let k = 0; k < KP_COUNT; k++) if (kp[k * 3 + 2] >= min) n++;
  return n;
}

/** Angle at b (degrees) between b->a and b->c; null when a point is not visible or coincides with b. */
export function angleAt(a: P, b: P, c: P, min = VISIBLE_SCORE): number | null {
  if (a.s < min || b.s < min || c.s < min) return null;
  const ux = a.x - b.x, uy = a.y - b.y, vx = c.x - b.x, vy = c.y - b.y;
  const nu = Math.hypot(ux, uy), nv = Math.hypot(vx, vy);
  if (nu < 1e-6 || nv < 1e-6) return null;
  const cos = Math.max(-1, Math.min(1, (ux * vx + uy * vy) / (nu * nv)));
  return (Math.acos(cos) * 180) / Math.PI;
}

export function anglesOf(kp: number[]): Angles {
  const out: Angles = {};
  if (kp.length < KP_COUNT * 3) return out;
  for (const a of ANGLES) {
    const v = angleAt(point(kp, a.a), point(kp, a.b), point(kp, a.c));
    if (v !== null) out[a.id] = v;
  }
  return out;
}

// ------------------------------------------------------------------ signal helpers

/** Linear interpolation of an irregular series (t ascending, NaN allowed = missing) onto a uniform grid. Gaps longer than maxGapS stay NaN. */
export function resample(t: number[], v: number[], t0: number, t1: number, hz = RESAMPLE_HZ, maxGapS = 0.35): number[] {
  const n = Math.max(0, Math.floor(((t1 - t0) / 1000) * hz));
  const out = new Array<number>(n).fill(NaN);
  const good: number[] = [];
  for (let i = 0; i < t.length; i++) if (Number.isFinite(v[i])) good.push(i);
  let j = 0;
  for (let i = 0; i < n; i++) {
    const tt = t0 + (i * 1000) / hz;
    while (j + 1 < good.length && t[good[j + 1]] <= tt) j++;
    const a = good[j], b = good[j + 1];
    if (a === undefined) continue;
    if (t[a] > tt) continue;
    if (b === undefined) { if (tt - t[a] <= maxGapS * 1000) out[i] = v[a]; continue; }
    if (t[b] - t[a] > maxGapS * 1000) { if (tt - t[a] <= (maxGapS * 1000) / 2) out[i] = v[a]; else if (t[b] - tt <= (maxGapS * 1000) / 2) out[i] = v[b]; continue; }
    out[i] = v[a] + ((v[b] - v[a]) * (tt - t[a])) / (t[b] - t[a]);
  }
  return out;
}

/** Fills short NaN runs by linear interpolation and returns the share of originally valid values. */
export function fillGaps(x: number[], maxRun = 9): number {
  let valid = 0;
  for (const v of x) if (Number.isFinite(v)) valid++;
  let i = 0;
  while (i < x.length) {
    if (Number.isFinite(x[i])) { i++; continue; }
    let j = i;
    while (j < x.length && !Number.isFinite(x[j])) j++;
    if (i > 0 && j < x.length && j - i <= maxRun) {
      for (let k = i; k < j; k++) x[k] = x[i - 1] + ((x[j] - x[i - 1]) * (k - i + 1)) / (j - i + 1);
    }
    i = j;
  }
  return x.length ? valid / x.length : 0;
}

function hann(n: number) { return (i: number) => 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / Math.max(1, n - 1)); }

/** Windowed DFT of a mean-removed signal at frequency f (Hz): power and phase in cycles. NaNs count as zero. */
export function dftAt(x: number[], hz: number, f: number): { power: number; phase: number } {
  const n = x.length;
  let mean = 0, c = 0;
  for (const v of x) if (Number.isFinite(v)) { mean += v; c++; }
  mean = c ? mean / c : 0;
  const w = hann(n);
  let re = 0, im = 0;
  for (let i = 0; i < n; i++) {
    const v = Number.isFinite(x[i]) ? x[i] - mean : 0;
    const a = (2 * Math.PI * f * i) / hz, wi = w(i);
    re += v * wi * Math.cos(a);
    im -= v * wi * Math.sin(a);
  }
  return { power: (re * re + im * im) / (n * n), phase: Math.atan2(im, re) / (2 * Math.PI) };
}

export function spectrum(x: number[], hz: number): { f: number[]; p: number[] } {
  const f: number[] = [], p: number[] = [];
  for (let q = F_MIN; q <= F_MAX + 1e-9; q += F_STEP) { f.push(q); p.push(dftAt(x, hz, q).power); }
  return { f, p };
}

/** Distance between two phases in cycles, folded to 0..0.5. */
export function phaseGap(a: number, b: number): number {
  let d = Math.abs(a - b) % 1;
  if (d > 0.5) d = 1 - d;
  return d;
}

export function std(x: number[]): number {
  let m = 0, c = 0;
  for (const v of x) if (Number.isFinite(v)) { m += v; c++; }
  if (!c) return 0;
  m /= c;
  let s = 0;
  for (const v of x) if (Number.isFinite(v)) s += (v - m) ** 2;
  return Math.sqrt(s / c);
}

// ------------------------------------------------------------------ gait

export type LimbSignals = { lf: number[]; rf: number[]; lh: number[]; rh: number[] };
export type ClassifyExtra = {
  coverage: number; visibleJoints: number; windowS: number;
  species?: SpeciesKey; signal?: "along" | "lift"; foreshortened?: number;
  /** Real frame rate of the source samples. A leg rhythm at more than 45% of this cannot be told from its alias, so it is not named. */
  sampleHz?: number;
};

/** Removes a centred moving average (NaNs ignored) so slow drift cannot masquerade as the lowest stride frequencies. */
export function detrend(x: number[], hz: number, seconds = DETREND_S): number[] {
  const half = Math.max(1, Math.round((seconds * hz) / 2));
  const out = new Array<number>(x.length).fill(NaN);
  const pre = [0], cnt = [0];
  for (let i = 0; i < x.length; i++) { const ok = Number.isFinite(x[i]); pre.push(pre[i] + (ok ? x[i] : 0)); cnt.push(cnt[i] + (ok ? 1 : 0)); }
  for (let i = 0; i < x.length; i++) {
    if (!Number.isFinite(x[i])) continue;
    const a = Math.max(0, i - half), b = Math.min(x.length, i + half + 1);
    const n = cnt[b] - cnt[a];
    out[i] = x[i] - (n ? (pre[b] - pre[a]) / n : 0);
  }
  return out;
}

const unclearOf = (base: Pick<GaitEstimate, "windowS" | "visibleJoints">, reason: NonNullable<GaitEstimate["reason"]>, note: string, f0: number | null = null, phases: GaitEstimate["phases"] = null, extra: Partial<GaitEstimate> = {}): GaitEstimate =>
  ({ ...base, gait: "unclear", confidence: 0, strideHz: f0, phases, note, reason, ...extra });

/**
 * Gait decision from four uniformly sampled limb signals (position along the body axis / body length, or paw lift / leg length).
 * The species decides which names may be given and what stride frequencies are believable; a rhythm that is clear but fits no
 * name this species is allowed is reported as "moving" with its stride frequency, never as a guess.
 */
export function classifyLimbs(limbs: LimbSignals, hz: number, extra: ClassifyExtra): GaitEstimate {
  const sp = SPECIES[extra.species ?? "horse"];
  const names = ["lf", "rf", "lh", "rh"] as const;
  const base = { windowS: extra.windowS, visibleJoints: extra.visibleJoints };
  const tag: Partial<GaitEstimate> = { signal: extra.signal ?? "along", foreshortened: extra.foreshortened };
  const amp = names.map((n) => std(limbs[n]));
  const standThreshold = extra.signal === "lift" ? 0.05 : 0.04;
  if (Math.max(...amp) < standThreshold) {
    return { ...base, ...tag, gait: "standing", confidence: Math.min(1, 0.4 + extra.coverage * 0.5), strideHz: null, phases: null, note: "The legs are not moving relative to the body." };
  }
  const clean = names.map((n) => detrend(limbs[n], hz));
  const fMax = Math.min(F_MAX, extra.sampleHz ? 0.45 * extra.sampleHz : F_MAX);
  // Dominant frequency: the peak of the summed, per-limb-normalised spectra.
  const specs = clean.map((x) => { const f: number[] = [], p: number[] = []; for (let q = F_MIN; q <= fMax + 1e-9; q += F_STEP) { f.push(q); p.push(dftAt(x, hz, q).power); } return { f, p }; });
  const nf = specs[0].f.length;
  if (nf < 8) return unclearOf(base, "slow-frames", "Too few frames a second to follow the legs.", null, null, tag);
  const sum = new Array<number>(nf).fill(0);
  specs.forEach((s) => { const tot = s.p.reduce((a, b) => a + b, 0) || 1; s.p.forEach((v, i) => { sum[i] += v / tot; }); });
  let pk = 0;
  for (let i = 1; i < nf; i++) if (sum[i] > sum[pk]) pk = i;
  const f0 = specs[0].f[pk];
  // A peak on the edge of the searched band is the slope of something larger, not a rhythm.
  if (pk <= 1 || pk >= nf - 2) return unclearOf(base, "no-rhythm", "The legs move, but without a steady rhythm in this stretch.", null, null, tag);
  const concentration = sum.slice(Math.max(0, pk - 3), pk + 4).reduce((a, b) => a + b, 0) / 4;
  const sorted = [...sum].sort((a, b) => a - b);
  const peakiness = sum[pk] / Math.max(1e-9, sorted[Math.floor(nf / 2)]);
  let agree = 0;
  specs.forEach((s) => { let q = 0; for (let i = 1; i < s.p.length; i++) if (s.p[i] > s.p[q]) q = i; if (Math.abs(s.f[q] - f0) / f0 <= 0.15) agree++; });
  if (peakiness < 3 || agree < 3) return unclearOf(base, "no-rhythm", "The legs move, but the rhythm is not steady enough to name a gait.", f0, null, tag);
  if (extra.sampleHz && f0 > 0.45 * extra.sampleHz) return unclearOf(base, "slow-frames", `The leg rhythm (${f0.toFixed(1)} strides/s) is too fast for ${extra.sampleHz.toFixed(0)} frames a second.`, f0, null, tag);
  const ph = clean.map((x) => dftAt(x, hz, f0).phase);
  const [lf, rf, lh, rh] = ph;
  const phases = { front: phaseGap(lf, rf), hind: phaseGap(lh, rh), diagA: phaseGap(lf, rh), diagB: phaseGap(rf, lh) };
  const { diagA, diagB } = phases;
  // Trot: both diagonal pairs move together (gap near 0), or, if the model swapped left and right, both gaps near 0.5.
  const trotLike = (diagA < 0.15 && diagB < 0.15) || (diagA > 0.35 && diagB > 0.35);
  // Walk: both diagonal gaps near a quarter cycle.
  const walkLike = Math.abs(diagA - 0.25) < 0.12 && Math.abs(diagB - 0.25) < 0.12;
  const alternating = phases.front > 0.34 && phases.hind > 0.34;
  const allowed = (g: GaitName) => (sp.gaits as readonly string[]).includes(g);
  let gait: GaitName;
  let note: string;
  if (alternating && trotLike) { gait = "trot"; note = "Left and right legs alternate and the diagonal pairs move together."; }
  else if (alternating && walkLike) { gait = "walk"; note = "Left and right legs alternate, diagonals about a quarter-cycle apart."; }
  else if (alternating && sp.key !== "horse") { gait = "moving"; note = "Left and right legs alternate (a walk or trot)."; }
  else if (alternating) return unclearOf(base, "pattern", "The legs alternate, but their timing fits neither a walk nor a trot clearly.", f0, phases, tag);
  else if (extra.windowS * f0 < 3) return unclearOf(base, "short", "Fewer than three strides were seen, too few to name the movement.", f0, phases, tag);
  else if (sp.key === "horse") { gait = f0 < CANTER_GALLOP_HZ ? "canter" : "gallop"; note = `Legs of a pair are not alternating (asymmetric gait), with a stride frequency in the ${gait} range.`; }
  else { gait = "moving"; note = f0 >= sp.fastHz ? "Legs of a pair are not alternating and the stride rate is high (in the running range)." : "Legs of a pair are not alternating, at a moderate stride rate."; }
  // Sanity against textbook stride-frequency ranges (strides per second). Far outside the range the label is withdrawn, not guessed.
  const range = sp.strideHz[gait];
  if (range && (f0 < range[0] * 0.85 || f0 > range[1] * 1.15)) {
    return unclearOf(base, "range", `The leg rhythm (${f0.toFixed(2)} strides/s) does not fit a ${gait} for this species; the view or the tracking is probably too poor to tell.`, f0, phases, tag);
  }
  const rangeOk = !range || (f0 >= range[0] && f0 <= range[1]) ? 1 : 0.5;
  const view = 1 - Math.min(1, (extra.foreshortened ?? 0) * 1.5);
  let confidence = Math.max(0, Math.min(1,
    0.28 * (agree / 4) + 0.24 * Math.min(1, concentration * 2.2) + 0.18 * extra.coverage + 0.08 * Math.min(1, extra.visibleJoints / 13) + 0.12 * rangeOk + 0.10 * view));
  // Names this species is not cleared for fall back to "moving": the rhythm is real, the label is not claimed.
  if (gait !== "moving" && !allowed(gait)) { note = `${note} ${sp.label} gaits other than ${sp.gaits.filter((g) => g !== "standing").join(", ")} are not validated, so this is reported only as movement.`; gait = "moving"; confidence = Math.min(confidence, 0.9); }
  return { ...base, ...tag, gait, confidence, strideHz: f0, phases, note };
}

const median = (a: number[]) => { const s = a.filter(Number.isFinite).sort((x, y) => x - y); return s.length ? s[Math.floor(s.length / 2)] : NaN; };
const quantile = (a: number[], q: number) => { const s = a.filter(Number.isFinite).sort((x, y) => x - y); return s.length ? s[Math.min(s.length - 1, Math.floor(q * s.length))] : NaN; };

/**
 * Gait estimate for the samples of ONE animal ending at `endT` (ms). Needs MIN_WINDOW_S of tracked movement.
 *
 * Two readings of the same four legs are tried and the steadier one is used:
 *   "along": each paw's position along the neck-to-tail axis, as a fraction of the window's typical body length;
 *   "lift":  each paw's height below its own shoulder or hip, as a fraction of the window's typical leg length.
 * "along" needs a side or three-quarter view; "lift" still works when the animal comes towards or goes away from the camera.
 * Frames where the body is foreshortened are left out of "along" rather than dividing by a length near zero (the cause of the
 * earlier unstable readings on a horse circling a round pen).
 */
export function estimateGait(samples: Sample[], endT: number, windowS = GAIT_WINDOW_S, species: SpeciesKey = "horse"): GaitEstimate {
  const t0 = endT - windowS * 1000;
  const win = samples.filter((s) => s.t >= t0 && s.t <= endT && s.kp.length >= KP_COUNT * 3);
  const spanS = win.length ? (win[win.length - 1].t - win[0].t) / 1000 : 0;
  const name = SPECIES[species].label.toLowerCase();
  const short = (note: string, reason: NonNullable<GaitEstimate["reason"]>, vis = 0) => unclearOf({ windowS: spanS, visibleJoints: vis }, reason, note);
  if (win.length < 8 || spanS < MIN_WINDOW_S) return short(`Needs about ${MIN_WINDOW_S} seconds of the ${name} in view.`, "short");
  const times = win.map((s) => s.t);
  const dts = times.slice(1).map((t, i) => t - times[i]).filter((d) => d > 0);
  const sampleHz = dts.length ? 1000 / median(dts) : undefined;
  const meanVisible = win.reduce((a, s) => a + visibleCount(s.kp), 0) / win.length;

  // ---- reading 1: along the body
  const Ls = win.map((s) => {
    const n = point(s.kp, KP.neck), t = point(s.kp, KP.tail_root);
    return n.s < VISIBLE_SCORE || t.s < VISIBLE_SCORE ? NaN : Math.hypot(t.x - n.x, t.y - n.y);
  });
  const S = quantile(Ls, 0.75);
  const along = (k: number) => win.map((s, i) => {
    if (!Number.isFinite(Ls[i]) || Ls[i] < FORESHORTEN * S) return NaN;
    const n = point(s.kp, KP.neck), t = point(s.kp, KP.tail_root), p = point(s.kp, k);
    if (p.s < 0.2) return NaN;
    const ux = (t.x - n.x) / Ls[i], uy = (t.y - n.y) / Ls[i];
    return ((p.x - (n.x + t.x) / 2) * ux + (p.y - (n.y + t.y) / 2) * uy) / S;
  });
  const foreshortened = Ls.filter((L) => Number.isFinite(L) && L < FORESHORTEN * S).length / win.length;

  // ---- reading 2: lift of each paw under its own girdle point
  const legLen = (g: number, k: number) => median(win.map((s) => { const a = point(s.kp, g), b = point(s.kp, k); return a.s < VISIBLE_SCORE || b.s < 0.2 ? NaN : Math.hypot(b.x - a.x, b.y - a.y); }));
  const Lf = (legLen(KP.left_shoulder, KP.left_front_paw) + legLen(KP.right_shoulder, KP.right_front_paw)) / 2;
  const Lh = (legLen(KP.left_hip, KP.left_hind_paw) + legLen(KP.right_hip, KP.right_hind_paw)) / 2;
  const lift = (g: number, k: number, L: number) => win.map((s) => { const a = point(s.kp, g), b = point(s.kp, k); return a.s < VISIBLE_SCORE || b.s < 0.2 || !(L > 0) ? NaN : (b.y - a.y) / L; });

  const build = (raw: { lf: number[]; rf: number[]; lh: number[]; rh: number[] }) => {
    const limbs: LimbSignals = {
      lf: resample(times, raw.lf, times[0], times[times.length - 1]), rf: resample(times, raw.rf, times[0], times[times.length - 1]),
      lh: resample(times, raw.lh, times[0], times[times.length - 1]), rh: resample(times, raw.rh, times[0], times[times.length - 1]),
    };
    const coverage = Math.min(...[limbs.lf, limbs.rf, limbs.lh, limbs.rh].map((x) => fillGaps(x)));
    return { limbs, coverage };
  };
  const A = build({ lf: along(KP.left_front_paw), rf: along(KP.right_front_paw), lh: along(KP.left_hind_paw), rh: along(KP.right_hind_paw) });
  const V = build({ lf: lift(KP.left_shoulder, KP.left_front_paw, Lf), rf: lift(KP.right_shoulder, KP.right_front_paw, Lf), lh: lift(KP.left_hip, KP.left_hind_paw, Lh), rh: lift(KP.right_hip, KP.right_hind_paw, Lh) });

  const tries: GaitEstimate[] = [];
  for (const [r, signal] of [[A, "along"], [V, "lift"]] as const) {
    if (r.coverage < 0.6) continue;
    tries.push(classifyLimbs(r.limbs, RESAMPLE_HZ, { coverage: r.coverage, visibleJoints: meanVisible, windowS: spanS, species, signal, foreshortened, sampleHz }));
  }
  if (!tries.length) {
    return short(foreshortened > 0.4 ? "The animal is seen end-on for much of this stretch, so the legs cannot be followed along its body." : "The legs were hidden or too uncertain for a stretch of this window.", foreshortened > 0.4 ? "foreshortened" : "hidden", meanVisible);
  }
  // A movement label beats "unclear"; among labels the more confident wins; "standing" only counts when nothing else moved.
  const rank = (e: GaitEstimate) => (e.gait === "unclear" ? -1 : e.gait === "standing" ? 0.5 : 1 + e.confidence);
  const best = tries.sort((a, b) => rank(b) - rank(a))[0];
  // "Standing" from one reading is contradicted if the other reading sees strong rhythmic movement.
  if (best.gait === "standing" && tries.some((t) => t.gait !== "standing" && t.gait !== "unclear")) return tries.find((t) => t.gait !== "standing" && t.gait !== "unclear") as GaitEstimate;
  return best;
}

// ------------------------------------------------------------------ summary

function percentile(sorted: number[], p: number): number {
  if (!sorted.length) return 0;
  return sorted[Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length))];
}

/** Gait timeline for one animal: one estimate per second, each from the preceding window. */
export function gaitTimeline(samples: Sample[], stepS = 1, species: SpeciesKey = "horse"): { t: number; est: GaitEstimate }[] {
  if (samples.length < 2) return [];
  const first = samples[0].t, last = samples[samples.length - 1].t;
  const out: { t: number; est: GaitEstimate }[] = [];
  for (let t = first + MIN_WINDOW_S * 1000; t <= last; t += stepS * 1000) out.push({ t, est: estimateGait(samples, t, GAIT_WINDOW_S, species) });
  return out;
}

/** Samples of one animal (older sessions have no IDs: everything is animal 1). Frames with no animal (ID 0) belong to nobody. */
export const samplesOf = (all: Sample[], id: number): Sample[] => all.filter((s) => (s.id ?? 1) === id);

/** Number of distinct frames in a flat sample list. */
export const frameCount = (all: Sample[]) => { let n = 0, last = NaN; for (const s of all) if (s.t !== last) { n++; last = s.t; } return n; };

export function summarize(samples: Sample[], wallMs: number, timeline?: { t: number; est: GaitEstimate }[], species: SpeciesKey = "horse", totalFrames?: number): SessionSummary {
  const tl = timeline ?? gaitTimeline(samples, 1, species);
  const frames = totalFrames ?? samples.length;
  const withHorse = samples.filter((s) => s.kp.length >= KP_COUNT * 3);
  const durationMs = samples.length ? samples[samples.length - 1].t - samples[0].t : 0;
  const lat = samples.map((s) => s.totalMs).sort((a, b) => a - b);
  const mean = (x: number[]) => (x.length ? x.reduce((a, b) => a + b, 0) / x.length : 0);
  const shares: Partial<Record<GaitName, number>> = {};
  const reasons: NonNullable<SessionSummary["unclearReasons"]> = {};
  const strides: { g: GaitName; f: number }[] = [];
  let weight = 0;
  for (const { est } of tl) {
    const confident = est.confidence >= CONFIDENT;
    const g: GaitName = confident ? est.gait : "unclear";
    shares[g] = (shares[g] ?? 0) + 1; weight++;
    if (!confident && est.reason) reasons[est.reason] = (reasons[est.reason] ?? 0) + 1;
    if (g !== "unclear" && g !== "standing" && est.strideHz) strides.push({ g, f: est.strideHz });
  }

  for (const k of Object.keys(shares) as GaitName[]) shares[k] = (shares[k] ?? 0) / Math.max(1, weight);
  // A session-level gait is only named when it holds at least a quarter of the timeline and at least three confident windows.
  const confidentWindows = (g: GaitName) => tl.filter((p) => p.est.confidence >= CONFIDENT && p.est.gait === g).length;
  const top = (Object.entries(shares).filter(([g]) => g !== "unclear").sort((a, b) => b[1] - a[1])[0] ?? null);
  const dominant: GaitName = top && top[1] >= 0.25 && confidentWindows(top[0] as GaitName) >= 3 ? (top[0] as GaitName) : "unclear";
  const ranges: SessionSummary["angleRanges"] = {};
  for (const a of ANGLES) {
    const vals = withHorse.map((s) => anglesOf(s.kp)[a.id as AngleId]).filter((v): v is number => v !== undefined);
    if (vals.length) ranges[a.id] = { min: Math.min(...vals), max: Math.max(...vals), mean: mean(vals) };
  }
  const own = strides.filter((x) => x.g === dominant).map((x) => x.f).sort((a, b) => a - b);
  return {
    durationMs, frames, framesWithHorse: withHorse.length,
    coveragePct: frames ? (withHorse.length / frames) * 100 : 0,
    meanDetScore: mean(withHorse.map((s) => s.det)),
    meanVisibleJoints: mean(withHorse.map((s) => visibleCount(s.kp))),
    meanFps: wallMs > 0 ? frames / (wallMs / 1000) : 0,
    meanLatencyMs: mean(lat), p95LatencyMs: percentile(lat, 95),
    gaitShares: shares, unclearReasons: reasons, dominantGait: dominant,
    strideHzMedian: own.length ? own[Math.floor(own.length / 2)] : null,
    angleRanges: ranges,
  };
}

// ------------------------------------------------------------------ animals of a session

/** Track IDs present in a flat sample list, in order of first appearance. */
export function trackIds(all: Sample[]): number[] {
  const seen: number[] = [];
  for (const s of all) { const id = s.id ?? 1; if (id > 0 && !seen.includes(id)) seen.push(id); }
  return seen;
}

/** The species a track was named as for most of its life; null when it never was (or the names were split). */
export function speciesOfSamples(ss: Sample[]): { key: SpeciesKey | null; share: number } {
  const c = new Map<string, number>();
  let named = 0;
  for (const s of ss) { const k = s.sp === undefined ? "horse" : s.sp; if (!k) continue; c.set(k, (c.get(k) ?? 0) + 1); named++; }
  let best = "", bc = 0;
  for (const [k, n] of c) if (n > bc) { best = k; bc = n; }
  const share = named ? bc / named : 0;
  const prof = speciesByKey(best);
  return !prof || share < 0.6 ? { key: null, share } : { key: prof.key, share };
}

/**
 * One AnimalInfo per tracked animal. The animal's own frames give its coverage; the whole session's frame count gives its presence.
 * `wallMs` is the time the whole analysis took, shared by all animals (they were analysed together).
 */
/** A track must live this many frames to be reported as an animal; shorter ones are detector flicker and are only counted. */
export const MIN_TRACK_FRAMES = 10;

/** At most this many animals are reported per session (the longest-lived ones); the rest are counted in `fleetingTracks`. */
export const MAX_REPORTED_ANIMALS = 8;

export function summarizeAnimals(all: Sample[], wallMs: number, minFrames = MIN_TRACK_FRAMES, maxAnimals = MAX_REPORTED_ANIMALS): AnimalInfo[] {
  const total = frameCount(all);
  const t0 = all.length ? all[0].t : 0;
  const frameTs = [...new Set(all.map((s) => s.t))].sort((a, b) => a - b);
  const lived = (id: number) => samplesOf(all, id).length;
  const keep = trackIds(all).filter((id) => lived(id) >= minFrames).sort((a, b) => lived(b) - lived(a)).slice(0, maxAnimals).sort((a, b) => a - b);
  return keep.map((id) => {
    const ss = samplesOf(all, id);
    const { key, share } = speciesOfSamples(ss);
    const first = ss[0].t, last = ss[ss.length - 1].t;
    const life = frameTs.filter((t) => t >= first && t <= last).length;
    const skeleton = ss.filter((s) => s.kp.length >= KP_COUNT * 3).length;
    const supported = poseSupported(key);
    const summary = summarize(supported ? ss : ss.map((s) => ({ ...s, kp: [] })), wallMs, supported ? undefined : [], key ?? "horse", life);
    summary.frames = life;
    summary.durationMs = last - first;
    summary.coveragePct = life ? (skeleton / life) * 100 : 0;
    return { id, species: key, label: key ? SPECIES[key].label : "Animal (species unsure)", speciesShare: share, supported, firstMs: first - t0, lastMs: last - t0, lifeFrames: life, skeletonFrames: skeleton, presencePct: total ? (life / total) * 100 : 0, summary };
  });
}

/** The animal a single-animal view (the live panels, the old summary) follows: the one with most skeleton frames, else the longest-lived. */
export function mainAnimal(animals: AnimalInfo[]): AnimalInfo | null {
  return [...animals].sort((a, b) => b.skeletonFrames - a.skeletonFrames || b.lifeFrames - a.lifeFrames)[0] ?? null;
}

/**
 * Body proportions from side-on frames only (neck-to-tail at least 55% of the animal's typical length), as medians:
 * body length in pixels, forelimb and hind-limb length as a fraction of body length (shoulder->elbow->paw, hip->knee->paw), and
 * the head-to-neck length as a fraction of body length. They are distances between generic AP-10K points, not bone lengths.
 */
export function proportions(samples: Sample[]): { frames: number; bodyPx: number; fore: number; hind: number; head: number } | null {
  const rows = samples.filter((x) => x.kp.length >= KP_COUNT * 3);
  const L = rows.map((r) => { const n = point(r.kp, KP.neck), t = point(r.kp, KP.tail_root); return n.s < VISIBLE_SCORE || t.s < VISIBLE_SCORE ? NaN : Math.hypot(t.x - n.x, t.y - n.y); });
  const S = quantile(L, 0.75);
  if (!(S > 8)) return null;
  const seg = (r: Sample, a: number, b: number) => { const p1 = point(r.kp, a), p2 = point(r.kp, b); return p1.s < VISIBLE_SCORE || p2.s < VISIBLE_SCORE ? NaN : Math.hypot(p2.x - p1.x, p2.y - p1.y); };
  const fore: number[] = [], hind: number[] = [], head: number[] = [], body: number[] = [];
  rows.forEach((r, i) => {
    if (!Number.isFinite(L[i]) || L[i] < FORESHORTEN * S) return;
    body.push(L[i]);
    for (const side of ["left", "right"] as const) {
      const f = seg(r, KP[`${side}_shoulder`], KP[`${side}_elbow`]) + seg(r, KP[`${side}_elbow`], KP[`${side}_front_paw`]);
      const h = seg(r, KP[`${side}_hip`], KP[`${side}_knee`]) + seg(r, KP[`${side}_knee`], KP[`${side}_hind_paw`]);
      if (Number.isFinite(f)) fore.push(f / L[i]);
      if (Number.isFinite(h)) hind.push(h / L[i]);
    }
    const hd = seg(r, KP.nose, KP.neck);
    if (Number.isFinite(hd)) head.push(hd / L[i]);
  });
  if (body.length < 10) return null;
  return { frames: body.length, bodyPx: median(body), fore: median(fore), hind: median(hind), head: median(head) };
}

// ------------------------------------------------------------------ series for charts, CSV and reports

/**
 * Paw position along the body axis (neck -> croup) as a fraction of the body's typical length around that moment (the 75th
 * percentile of neck-to-tail length within two seconds either side, so it does not blow up when the animal turns end-on);
 * NaN where the body is foreshortened or the point is not measurable.
 */
export function limbTrace(samples: Sample[]): { t: number; lf: number; rf: number; lh: number; rh: number }[] {
  const L = samples.map((s) => {
    if (s.kp.length < KP_COUNT * 3) return NaN;
    const n = point(s.kp, KP.neck), t = point(s.kp, KP.tail_root);
    return n.s < VISIBLE_SCORE || t.s < VISIBLE_SCORE ? NaN : Math.hypot(t.x - n.x, t.y - n.y);
  });
  let lo = 0, hi = 0;
  return samples.map((s, i) => {
    const nan = { t: s.t, lf: NaN, rf: NaN, lh: NaN, rh: NaN };
    if (!Number.isFinite(L[i])) return nan;
    while (samples[lo].t < s.t - 2000) lo++;
    while (hi < samples.length && samples[hi].t <= s.t + 2000) hi++;
    const S = quantile(L.slice(lo, hi), 0.75);
    if (!(S > 8) || L[i] < FORESHORTEN * S) return nan;
    const n = point(s.kp, KP.neck), t = point(s.kp, KP.tail_root);
    const ux = (t.x - n.x) / L[i], uy = (t.y - n.y) / L[i], cx = (n.x + t.x) / 2, cy = (n.y + t.y) / 2;
    const f = (k: number) => { const p = point(s.kp, k); return p.s < 0.2 ? NaN : ((p.x - cx) * ux + (p.y - cy) * uy) / S; };
    return { t: s.t, lf: f(KP.left_front_paw), rf: f(KP.right_front_paw), lh: f(KP.left_hind_paw), rh: f(KP.right_hind_paw) };
  });
}

export function angleTrace(samples: Sample[], id: AngleId): [number, number][] {
  return samples.map((s) => [s.t, anglesOf(s.kp)[id] ?? NaN] as [number, number]);
}

/** Most recent sample at or before time t (ms); null when none. Samples are in ascending order. */
export function sampleAt(samples: Sample[], t: number): Sample | null {
  let lo = 0, hi = samples.length - 1, best = -1;
  while (lo <= hi) { const mid = (lo + hi) >> 1; if (samples[mid].t <= t) { best = mid; lo = mid + 1; } else hi = mid - 1; }
  return best >= 0 ? samples[best] : null;
}
