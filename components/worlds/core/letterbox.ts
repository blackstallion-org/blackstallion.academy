import { BOUNDARIES } from "./timeline";

/**
 * The black bars. A pure function of the film's progress (and of how far the opening has run), so they move with the picture and
 * run backwards with it. Each bar covers a fraction of the frame height (0 = none, 0.5 = the screen is shut):
 *  - the opening: the screen starts shut and the bars draw back, slowly, to their resting height;
 *  - the resting height is a slim cinema frame;
 *  - at each transition (the eye, the dust, the clouds) they close in a little and open again, breathing with the dissolve;
 *  - at the end of the film they close, slowly, over the last of the final scene.
 */
export const REST_LANDSCAPE = 0.072;
export const REST_PORTRAIT = 0.05;
const BUMP = 0.055;
const CLOSE_FROM = 0.955;
const CLOSE_TO = 0.997;

const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * t * (t * (t * 6 - 15) + 10);
};

/**
 * `close` (0..1) closes the bars by hand (the autoplay's ending runs on its own clock); left out, they close with the last of the
 * progress, as they do in the scroll version.
 */
export function letterbox(p: number, opened: number, portrait: boolean, close?: number): number {
  const rest = portrait ? REST_PORTRAIT : REST_LANDSCAPE;
  let h = rest;
  for (const b of BOUNDARIES) {
    const lead = 0.014;
    const x = smooth(b.start - lead, (b.start + b.end) / 2, p) * (1 - smooth((b.start + b.end) / 2, b.end + lead, p));
    h += BUMP * x;
  }
  h += (0.5 - h) * (close ?? smooth(CLOSE_FROM, CLOSE_TO, p));
  // the opening runs on the clock, not on the scroll: the first thing seen is the bars drawing back from black
  const o = smooth(0, 1, opened);
  return 0.5 + (h - 0.5) * o;
}
