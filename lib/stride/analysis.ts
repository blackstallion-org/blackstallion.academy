/**
 * Pure maths for "The Science of the Stride" (no three.js, no DOM): everything here works on arrays sampled from one cycle
 * of the playing animation. The rig (rig.ts) samples the animation; this file turns the samples into curves, footfalls and
 * a soft-seat response. Unit tests: tests/stride-analysis.test.mjs.
 *
 * A "cycle" is one stride (a complete walk cycle). Samples are evenly spaced in phase, sample i is phase i / N, and every
 * function treats the series as periodic (sample N is sample 0).
 */

const TAU = Math.PI * 2;

export const wrap01 = (v: number) => ((v % 1) + 1) % 1;
export const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

/** Linear interpolation of a periodic series at `phase` (0..1, wrapped). */
export function sampleCyclic(series: ArrayLike<number>, phase: number): number {
  const n = series.length;
  const x = wrap01(phase) * n;
  const i = Math.floor(x);
  const f = x - i;
  return series[i % n] * (1 - f) + series[(i + 1) % n] * f;
}

export function mean(series: ArrayLike<number>): number {
  let s = 0;
  for (let i = 0; i < series.length; i++) s += series[i];
  return s / series.length;
}

export function peakToPeak(series: ArrayLike<number>): number {
  let lo = Infinity;
  let hi = -Infinity;
  for (let i = 0; i < series.length; i++) {
    if (series[i] < lo) lo = series[i];
    if (series[i] > hi) hi = series[i];
  }
  return hi - lo;
}

/** Amplitude (half of peak to peak, for a pure tone) of harmonics 1..maxHarmonic of a periodic series. */
export function harmonicAmplitudes(series: ArrayLike<number>, maxHarmonic = 8): number[] {
  const n = series.length;
  const m = mean(series);
  const out: number[] = [];
  for (let k = 1; k <= maxHarmonic; k++) {
    let re = 0;
    let im = 0;
    for (let i = 0; i < n; i++) {
      const a = (TAU * k * i) / n;
      re += (series[i] - m) * Math.cos(a);
      im += (series[i] - m) * Math.sin(a);
    }
    out.push((2 * Math.hypot(re, im)) / n);
  }
  return out;
}

/** The harmonic (cycles per stride) that carries most of the movement. */
export function dominantHarmonic(series: ArrayLike<number>, maxHarmonic = 8): { harmonic: number; amplitude: number } {
  const amps = harmonicAmplitudes(series, maxHarmonic);
  let best = 0;
  for (let i = 1; i < amps.length; i++) if (amps[i] > amps[best]) best = i;
  return { harmonic: best + 1, amplitude: amps[best] };
}

/**
 * Steady-state response of a second-order low-pass (natural frequency `fnHz`, damping ratio `zeta`) to a periodic input whose
 * period is `periodSeconds`: the input is split into harmonics, each is scaled and delayed by the filter at its own frequency,
 * and the harmonics are added back. Exact for a periodic signal (no start-up transient, no dependence on how the cycle is
 * played), so the same phase always gives the same answer, forwards, backwards or scrubbed.
 */
export function periodicSecondOrder(series: ArrayLike<number>, periodSeconds: number, fnHz: number, zeta: number): Float64Array {
  const n = series.length;
  const out = new Float64Array(n);
  const m = mean(series);
  for (let i = 0; i < n; i++) out[i] = m;
  const f0 = 1 / periodSeconds;
  for (let k = 1; k < n / 2; k++) {
    let re = 0;
    let im = 0;
    for (let i = 0; i < n; i++) {
      const a = (TAU * k * i) / n;
      re += (series[i] - m) * Math.cos(a);
      im -= (series[i] - m) * Math.sin(a); // X_k = sum x e^{-j a}
    }
    // H(jw) = wn^2 / (wn^2 - w^2 + j 2 zeta wn w)
    const w = TAU * k * f0;
    const wn = TAU * fnHz;
    const dr = wn * wn - w * w;
    const di = 2 * zeta * wn * w;
    const den = dr * dr + di * di;
    const hr = (wn * wn * dr) / den;
    const hi = (-wn * wn * di) / den;
    const yr = re * hr - im * hi;
    const yi = re * hi + im * hr;
    for (let i = 0; i < n; i++) {
      const a = (TAU * k * i) / n;
      out[i] += (2 / n) * (yr * Math.cos(a) - yi * Math.sin(a));
    }
  }
  return out;
}

/** Gain and delay (seconds) of the same low-pass at a frequency, for the notes on the page. */
export function secondOrderResponse(freqHz: number, fnHz: number, zeta: number): { gain: number; delaySeconds: number } {
  const w = TAU * freqHz;
  const wn = TAU * fnHz;
  const dr = wn * wn - w * w;
  const di = 2 * zeta * wn * w;
  const gain = (wn * wn) / Math.hypot(dr, di);
  const lag = Math.atan2(di, dr);
  return { gain, delaySeconds: lag / w };
}

export type StanceOptions = {
  /** The distance the horse advances in one stride (m). */
  strideLength: number;
  /** Seconds one cycle takes (sets the ground speed, stride length over cycle time). */
  cycleSeconds: number;
  /** How far above its own planted height (m) a toe may be and still count as on the ground. */
  clearance: number;
  /** A toe still moving forward over the ground faster than this (m/s) has not landed yet. */
  approachMax: number;
  /** A toe that moves over the ground slower than this (m/s) is planted: the planted height is read from these samples. */
  plantedSpeed: number;
};

export type Stance = {
  /** One flag per sample: this hoof is on the ground. */
  mask: boolean[];
  /** Phase (0..1) of touchdown and of lift-off; stance runs from `touchdown` to `liftoff` (wrapping). */
  touchdown: number;
  liftoff: number;
  /** Share of the stride the hoof spends on the ground. */
  duty: number;
  /** The toe's own height (m) while planted: each hoof settles a little differently in the authored clip. */
  plantedHeight: number;
};

/**
 * Finds when a hoof is on the ground from its toe path alone. A hoof is planted where its toe barely moves over the ground (its
 * speed in the horse's frame plus the ground speed); the toe's height there is its own planted height. It is down from the moment
 * it is both close to that height and no longer arriving, until it rises clear of it. Height alone fails because the authored stance
 * hovers and sinks a few centimetres, and different hooves settle at different heights.
 */
export function detectStance(toeY: ArrayLike<number>, toeZ: ArrayLike<number>, o: StanceOptions): Stance {
  const n = toeY.length;
  const dt = o.cycleSeconds / n;
  const v = o.strideLength / o.cycleSeconds;
  const rel: number[] = new Array(n);
  for (let i = 0; i < n; i++) rel[i] = (toeZ[(i + 1) % n] - toeZ[(i + n - 1) % n]) / (2 * dt) + v;
  const planted: number[] = [];
  for (let i = 0; i < n; i++) if (Math.abs(rel[i]) < o.plantedSpeed) planted.push(toeY[i]);
  planted.sort((a, b) => a - b);
  let base = planted.length ? planted[Math.floor(planted.length / 2)] : Math.min(...Array.from(toeY)) + 0.01;
  if (!Number.isFinite(base)) base = 0;
  const mask: boolean[] = new Array(n);
  for (let i = 0; i < n; i++) mask[i] = toeY[i] < base + o.clearance && rel[i] < o.approachMax;
  // the longest run is the stance; any shorter run (a hoof hovering near the ground in the swing) is ignored
  let bestStart = -1;
  let bestLen = 0;
  for (let i = 0; i < n; i++) {
    if (!mask[i] || mask[(i + n - 1) % n]) continue;
    let len = 0;
    while (mask[(i + len) % n] && len < n) len++;
    if (len > bestLen) {
      bestLen = len;
      bestStart = i;
    }
  }
  const clean: boolean[] = new Array(n).fill(false);
  for (let k = 0; k < bestLen; k++) clean[(bestStart + k) % n] = true;
  return { mask: clean, touchdown: bestStart < 0 ? 0 : bestStart / n, liftoff: bestStart < 0 ? 0 : ((bestStart + bestLen) % n) / n, duty: bestLen / n, plantedHeight: base };
}

/** How many hooves are on the ground at each sample. */
export function supportCount(masks: boolean[][]): number[] {
  const n = masks[0].length;
  return Array.from({ length: n }, (_, i) => masks.reduce((c, m) => c + (m[i] ? 1 : 0), 0));
}

/** Gaps (in stride fractions) between consecutive touchdowns, in the order the hooves land. */
export function footfallOrder(touchdowns: Record<string, number>): { order: string[]; gaps: number[] } {
  const order = Object.keys(touchdowns).sort((a, b) => touchdowns[a] - touchdowns[b]);
  const gaps = order.map((k, i) => {
    const next = touchdowns[order[(i + 1) % order.length]];
    return wrap01(next - touchdowns[k]) || 1;
  });
  return { order, gaps };
}

/** Round tick positions covering [lo, hi]. */
export function niceTicks(lo: number, hi: number, target = 5): number[] {
  const span = hi - lo || 1;
  const raw = span / target;
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const norm = raw / mag;
  const step = (norm < 1.5 ? 1 : norm < 3 ? 2 : norm < 7 ? 5 : 10) * mag;
  const out: number[] = [];
  for (let t = Math.ceil(lo / step) * step; t <= hi + step * 1e-6; t += step) out.push(Math.abs(t) < step * 1e-9 ? 0 : +t.toFixed(10));
  return out;
}
