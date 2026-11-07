import { BOUNDARIES } from "./timeline";

/**
 * The film's clock. The intro plays itself: film time (seconds) maps to progress (0..1) through the same timeline the scroll
 * version used, so every shot, hold and transition is still exactly where the camera path put it. The mapping is close to linear (a steady
 * camera speed): only a gentle lingering on each world's hero moment and the transitions, and a soft ease in from black and out into the end.
 */
export const FILM_SECONDS = 76;
/** after the last frame: the letterbox closes, the picture fades to black, then the homepage is revealed (seconds) */
export const END_SECONDS = 6.8;
/** the bars draw back from black over this long at the start */
export const OPEN_SECONDS = 5;

const HOLD_AT = [0.155, 0.37, 0.64, 0.9];

/** Where in the film (progress) each world's headline and sentence are on screen: the same on the intro and on the scroll page. */
export const STORY: { id: "origins" | "life" | "legacy" | "beyond"; from: number; to: number }[] = [
  { id: "origins", from: 0.014, to: 0.2 },
  { id: "life", from: 0.278, to: 0.462 },
  { id: "legacy", from: 0.512, to: 0.702 },
  { id: "beyond", from: 0.758, to: 0.925 },
];
export const storyAt = (p: number) => STORY.findIndex((s) => p >= s.from && p <= s.to);

/** relative time spent per unit of progress: > 1 means the film slows there */
function weight(p: number) {
  let w = 1;
  for (const h of HOLD_AT) w += 0.3 * Math.exp(-(((p - h) / 0.035) ** 2));
  for (const b of BOUNDARIES) w += 0.22 * Math.exp(-(((p - (b.start + b.end) / 2) / 0.02) ** 2));
  w += 1.3 * Math.exp(-((p / 0.03) ** 2)); // ease in
  w += 1.1 * Math.exp(-(((1 - p) / 0.035) ** 2)); // ease out
  return w;
}

const N = 2000;
const TIME = (() => {
  const t = new Float64Array(N + 1);
  for (let i = 1; i <= N; i++) t[i] = t[i - 1] + weight((i - 0.5) / N);
  const total = t[N];
  for (let i = 0; i <= N; i++) t[i] = (t[i] / total) * FILM_SECONDS;
  return t;
})();

/** film time (s) -> progress (0..1) */
export function progressAt(seconds: number): number {
  if (seconds <= 0) return 0;
  if (seconds >= FILM_SECONDS) return 1;
  let lo = 0;
  let hi = N;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (TIME[mid] <= seconds) lo = mid;
    else hi = mid;
  }
  const f = (seconds - TIME[lo]) / (TIME[hi] - TIME[lo] || 1);
  return (lo + f) / N;
}

/** progress -> film time (s), the inverse (used to place text and to test pacing) */
export function timeAt(p: number): number {
  const x = Math.min(1, Math.max(0, p)) * N;
  const i = Math.min(N - 1, Math.floor(x));
  return TIME[i] + (TIME[i + 1] - TIME[i]) * (x - i);
}
