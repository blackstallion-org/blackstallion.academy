import { ANGLES, KP, KP_COUNT, VISIBLE_SCORE, type AngleId } from "./skeleton";
import type { Angles, GaitEstimate, GaitName, Sample, SessionSummary } from "./types";

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
const F_MIN = 0.4, F_MAX = 4.0, F_STEP = 0.02;
export const CANTER_GALLOP_HZ = 1.95;
/** Below this confidence a gait estimate is reported as "unclear" in summaries and reports. */
export const CONFIDENT = 0.45;

export const GAIT_LABEL: Record<GaitName, string> = { standing: "Standing", walk: "Walk", trot: "Trot", canter: "Canter", gallop: "Gallop", unclear: "Unclear" };

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

/** Gait decision from four uniformly sampled limb signals (position along the body axis / body length). */
export function classifyLimbs(limbs: LimbSignals, hz: number, extra: { coverage: number; visibleJoints: number; windowS: number }): GaitEstimate {
  const names = ["lf", "rf", "lh", "rh"] as const;
  const base = { windowS: extra.windowS, visibleJoints: extra.visibleJoints };
  const amp = names.map((n) => std(limbs[n]));
  if (Math.max(...amp) < 0.04) {
    return { ...base, gait: "standing", confidence: Math.min(1, 0.4 + extra.coverage * 0.5), strideHz: null, phases: null, note: "The legs are not moving relative to the body." };
  }
  // Dominant frequency: the peak of the summed, per-limb-normalised spectra.
  const specs = names.map((n) => spectrum(limbs[n], hz));
  const nf = specs[0].f.length;
  const sum = new Array<number>(nf).fill(0);
  specs.forEach((s) => { const tot = s.p.reduce((a, b) => a + b, 0) || 1; s.p.forEach((v, i) => { sum[i] += v / tot; }); });
  let pk = 0;
  for (let i = 1; i < nf; i++) if (sum[i] > sum[pk]) pk = i;
  const f0 = specs[0].f[pk];
  const concentration = sum.slice(Math.max(0, pk - 3), pk + 4).reduce((a, b) => a + b, 0) / 4;   // share of the (4-limb) energy near the peak
  // Limb agreement: how many limbs have their own peak within 15% of f0.
  let agree = 0;
  specs.forEach((s) => { let q = 0; for (let i = 1; i < s.p.length; i++) if (s.p[i] > s.p[q]) q = i; if (Math.abs(s.f[q] - f0) / f0 <= 0.15) agree++; });
  const ph = names.map((n) => dftAt(limbs[n], hz, f0).phase);
  const [lf, rf, lh, rh] = ph;
  const phases = { front: phaseGap(lf, rf), hind: phaseGap(lh, rh), diagA: phaseGap(lf, rh), diagB: phaseGap(rf, lh) };
  const { diagA, diagB } = phases;
  // Trot: both diagonal pairs move together (gap near 0), or, if the model swapped left and right, both gaps near 0.5.
  const trotLike = (diagA < 0.15 && diagB < 0.15) || (diagA > 0.35 && diagB > 0.35);
  // Walk: both diagonal gaps near a quarter cycle.
  const walkLike = Math.abs(diagA - 0.25) < 0.12 && Math.abs(diagB - 0.25) < 0.12;
  const alternating = phases.front > 0.34 && phases.hind > 0.34;
  let gait: GaitName;
  let note: string;
  if (alternating) {
    if (trotLike) { gait = "trot"; note = "Left and right legs alternate and the diagonal pairs move together."; }
    else if (walkLike) { gait = "walk"; note = "Left and right legs alternate, diagonals about a quarter-cycle apart."; }
    else return { ...base, gait: "unclear", confidence: 0, strideHz: f0, phases, note: "The legs alternate, but their timing fits neither a walk nor a trot clearly." };
  } else if (agree < 3 || extra.windowS * f0 < 3) {
    // An asymmetric gait is only claimed when at least three legs share the rhythm and about three strides were seen.
    return { ...base, gait: "unclear", confidence: 0, strideHz: f0, phases, note: "The legs do not alternate, but the rhythm is not steady enough to call a canter or gallop." };
  } else if (f0 < CANTER_GALLOP_HZ) { gait = "canter"; note = "Legs of a pair are not alternating (asymmetric gait), with a stride frequency in the canter range."; }
  else { gait = "gallop"; note = "Legs of a pair are not alternating (asymmetric gait), with a stride frequency in the gallop range."; }
  // Sanity against textbook stride-frequency ranges (strides per second). Far outside the range the label is withdrawn, not guessed.
  const range: Record<string, [number, number]> = { walk: [0.6, 1.4], trot: [1.0, 2.0], canter: [1.2, 2.1], gallop: [1.8, 3.2] };
  const [lo, hi] = range[gait];
  if (f0 < lo * 0.85 || f0 > hi * 1.15) {
    return { ...base, gait: "unclear", confidence: 0, strideHz: f0, phases, note: `The leg rhythm (${f0.toFixed(2)} strides/s) does not fit a ${gait}; the view or the tracking is probably too poor to tell.` };
  }
  const rangeOk = f0 >= lo && f0 <= hi ? 1 : 0.5;
  const confidence = Math.max(0, Math.min(1,
    0.30 * (agree / 4) + 0.25 * Math.min(1, concentration * 2.2) + 0.2 * extra.coverage + 0.1 * Math.min(1, extra.visibleJoints / 13) + 0.15 * rangeOk));
  return { ...base, gait, confidence, strideHz: f0, phases, note };
}

/** Gait estimate for the samples ending at `endT` (ms). Needs MIN_WINDOW_S of tracked movement. */
export function estimateGait(samples: Sample[], endT: number, windowS = GAIT_WINDOW_S): GaitEstimate {
  const t0 = endT - windowS * 1000;
  const win = samples.filter((s) => s.t >= t0 && s.t <= endT && s.kp.length >= KP_COUNT * 3);
  const spanS = win.length ? (win[win.length - 1].t - win[0].t) / 1000 : 0;
  const unclear = (note: string, vis = 0): GaitEstimate => ({ gait: "unclear", confidence: 0, strideHz: null, phases: null, windowS: spanS, visibleJoints: vis, note });
  if (win.length < 8 || spanS < MIN_WINDOW_S) return unclear(`Needs about ${MIN_WINDOW_S} seconds of the horse in view.`);
  const body = win.map((s) => {
    const neck = point(s.kp, KP.neck), tail = point(s.kp, KP.tail_root);
    if (neck.s < VISIBLE_SCORE || tail.s < VISIBLE_SCORE) return null;
    const L = Math.hypot(tail.x - neck.x, tail.y - neck.y);
    if (L < 8) return null;
    return { cx: (neck.x + tail.x) / 2, cy: (neck.y + tail.y) / 2, ux: (tail.x - neck.x) / L, uy: (tail.y - neck.y) / L, L };
  });
  const times = win.map((s) => s.t);
  const paw = (k: number) => win.map((s, i) => {
    const b = body[i], p = point(s.kp, k);
    if (!b || p.s < 0.2) return NaN;
    return ((p.x - b.cx) * b.ux + (p.y - b.cy) * b.uy) / b.L;
  });
  const limbsRaw = { lf: paw(KP.left_front_paw), rf: paw(KP.right_front_paw), lh: paw(KP.left_hind_paw), rh: paw(KP.right_hind_paw) };
  const tStart = times[0], tEnd = times[times.length - 1];
  const limbs: LimbSignals = {
    lf: resample(times, limbsRaw.lf, tStart, tEnd), rf: resample(times, limbsRaw.rf, tStart, tEnd),
    lh: resample(times, limbsRaw.lh, tStart, tEnd), rh: resample(times, limbsRaw.rh, tStart, tEnd),
  };
  const coverages = [limbs.lf, limbs.rf, limbs.lh, limbs.rh].map((x) => fillGaps(x));
  const coverage = Math.min(...coverages);
  const meanVisible = win.reduce((a, s) => a + visibleCount(s.kp), 0) / win.length;
  if (coverage < 0.6) return unclear("The legs were hidden or too uncertain for a stretch of this window.", meanVisible);
  return classifyLimbs(limbs, RESAMPLE_HZ, { coverage, visibleJoints: meanVisible, windowS: spanS });
}

// ------------------------------------------------------------------ summary

function percentile(sorted: number[], p: number): number {
  if (!sorted.length) return 0;
  return sorted[Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length))];
}

/** Gait timeline: one estimate per second, each from the preceding window. */
export function gaitTimeline(samples: Sample[], stepS = 1): { t: number; est: GaitEstimate }[] {
  if (samples.length < 2) return [];
  const first = samples[0].t, last = samples[samples.length - 1].t;
  const out: { t: number; est: GaitEstimate }[] = [];
  for (let t = first + MIN_WINDOW_S * 1000; t <= last; t += stepS * 1000) out.push({ t, est: estimateGait(samples, t) });
  return out;
}

export function summarize(samples: Sample[], wallMs: number, timeline = gaitTimeline(samples)): SessionSummary {
  const frames = samples.length;
  const withHorse = samples.filter((s) => s.kp.length >= KP_COUNT * 3);
  const durationMs = frames ? samples[frames - 1].t - samples[0].t : 0;
  const lat = samples.map((s) => s.totalMs).sort((a, b) => a - b);
  const mean = (x: number[]) => (x.length ? x.reduce((a, b) => a + b, 0) / x.length : 0);
  const shares: Partial<Record<GaitName, number>> = {};
  const strides: { g: GaitName; f: number }[] = [];
  let weight = 0;
  for (const { est } of timeline) {
    const g: GaitName = est.confidence >= CONFIDENT ? est.gait : "unclear";
    shares[g] = (shares[g] ?? 0) + 1; weight++;
    if (g !== "unclear" && g !== "standing" && est.strideHz) strides.push({ g, f: est.strideHz });
  }

  for (const k of Object.keys(shares) as GaitName[]) shares[k] = (shares[k] ?? 0) / Math.max(1, weight);
  // A session-level gait is only named when it holds at least a quarter of the timeline and at least three confident windows.
  const confidentWindows = (g: GaitName) => timeline.filter((p) => p.est.confidence >= CONFIDENT && p.est.gait === g).length;
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
    gaitShares: shares, dominantGait: dominant,
    strideHzMedian: own.length ? own[Math.floor(own.length / 2)] : null,
    angleRanges: ranges,
  };
}

// ------------------------------------------------------------------ series for charts, CSV and reports

/** Paw position along the body axis (neck -> croup) as a fraction of body length, for each sample; NaN where not measurable. */
export function limbTrace(samples: Sample[]): { t: number; lf: number; rf: number; lh: number; rh: number }[] {
  return samples.map((s) => {
    const nan = { t: s.t, lf: NaN, rf: NaN, lh: NaN, rh: NaN };
    if (s.kp.length < KP_COUNT * 3) return nan;
    const neck = point(s.kp, KP.neck), tail = point(s.kp, KP.tail_root);
    if (neck.s < VISIBLE_SCORE || tail.s < VISIBLE_SCORE) return nan;
    const L = Math.hypot(tail.x - neck.x, tail.y - neck.y);
    if (L < 8) return nan;
    const ux = (tail.x - neck.x) / L, uy = (tail.y - neck.y) / L, cx = (neck.x + tail.x) / 2, cy = (neck.y + tail.y) / 2;
    const f = (k: number) => { const p = point(s.kp, k); return p.s < 0.2 ? NaN : ((p.x - cx) * ux + (p.y - cy) * uy) / L; };
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
