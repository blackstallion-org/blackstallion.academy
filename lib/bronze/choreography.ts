/**
 * The scroll choreography of "Bronze and Time": a bronze horse that a camera circles once while four short chapters come and go.
 * Pure numbers and functions, no three.js and no DOM, so the engine, the section and the tests all read the same values.
 * Every constant is the reference page's own (a single-page "Laocoön" landing: 900vh of scroll, one 360 degree orbit); the only
 * additions are `framing` (a portrait screen needs the camera further back to keep the horse in frame), the beat ids and
 * `sideOffset` (the statue steps aside for each chapter's text instead of only for the first).
 */

export type BeatId = "bronze" | "stillness" | "form" | "record";

/** When each chapter is on screen (progress 0..1 of the whole track) and where its link in the chapter index scrolls to. */
export const BEATS: readonly { id: BeatId; from: number; to: number; jump: number }[] = [
  { id: "bronze", from: -0.1, to: 0.12, jump: 0.0 },
  { id: "stillness", from: 0.28, to: 0.4, jump: 0.34 },
  { id: "form", from: 0.56, to: 0.68, jump: 0.62 },
  { id: "record", from: 0.84, to: 1.05, jump: 0.94 },
];

export const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

/** Which chapters are active at this progress (the windows never overlap). */
export function beatStates(progress: number): boolean[] {
  return BEATS.map((b) => progress >= b.from && progress <= b.to);
}

/** The "stories" progress bar: the fill (0..1) of dash `index` (0..3), each dash owning a quarter of the track. */
export function dashFill(progress: number, index: number): number {
  const start = index * 0.25;
  return clamp((progress - start) / 0.25, 0, 1);
}

/** Top of grid dot `index` in percent of the stage height: each dot drifts at its own speed and direction and wraps around. */
export function gridDotTop(index: number, progress: number): number {
  const startY = ((index * 17) % 80) + 10;
  let speed = 90 + ((index * 55) % 180);
  if (index % 2 === 0) speed = -speed;
  const y = startY + progress * speed;
  return ((y % 100) + 100) % 100;
}

export type Framing = {
  /** Multiplier on the orbit radius. 1 on a landscape screen; a portrait phone needs the camera back to fit a horse side-on. */
  distance: number;
  /** 1 on a landscape screen (the horse is moved right to leave the text column); 0 when there is no room beside it. */
  shift: number;
  /** Where the camera looks vertically (lower = the horse sits higher on the screen, above the text). */
  lookY: number;
};

export function framing(aspect: number): Framing {
  if (aspect >= 1) return { distance: 1, shift: 1, lookY: -0.15 };
  const distance = clamp(0.98 / aspect, 1, 2.2);
  return { distance, shift: 0, lookY: -0.15 - (distance - 1) * 0.95 };
}

export type OrbitPose = { position: [number, number, number]; lookAt: [number, number, number] };

/**
 * Where the statue stands on a landscape screen, in world units to the right (+) or left (-) of the middle, for each chapter:
 * clear of that chapter's text. The reference page only offsets its first screen (0.9 to the right, eased out over the first
 * 28 % of the track); here every chapter keeps the metal out from under its own words, and the first screen is the same.
 */
const SIDE: readonly (readonly [number, number])[] = [
  [0, 0.9], // chapter one: text on the left
  [0.34, 1.35], // chapter two: stillness, text left of centre
  [0.62, -1.1], // chapter three: form, text on the right
  [0.94, 1.6], // chapter four: record, text left of centre
  [1, 1.6],
];

export function sideOffset(progress: number): number {
  const p = clamp(progress, 0, 1);
  for (let i = 1; i < SIDE.length; i++) {
    const [p1, s1] = SIDE[i];
    if (p <= p1) {
      const [p0, s0] = SIDE[i - 1];
      const t = (p - p0) / (p1 - p0);
      return s0 + (s1 - s0) * t * t * (3 - 2 * t);
    }
  }
  return SIDE[SIDE.length - 1][1];
}

/** Camera target for a scroll progress: one full circle, rising and closing in towards the middle of the track. */
export function orbit(progress: number, view: Framing = { distance: 1, shift: 1, lookY: -0.15 }): OrbitPose {
  const phi = progress * Math.PI * 2;
  const y = 0.35 + Math.sin(progress * Math.PI) * 0.8;
  const radius = (4.2 - Math.sin(progress * Math.PI) * 0.6) * view.distance;
  // The camera looks to the left of the statue by `side`, measured along its own right-hand axis, so the statue stands that far to the right.
  const side = sideOffset(progress) * view.shift;
  return {
    position: [radius * Math.sin(phi), y * view.distance, radius * Math.cos(phi)],
    lookAt: [-side * Math.cos(phi), view.lookY, side * Math.sin(phi)],
  };
}

/** Frame-rate independent form of a per-frame lerp factor that was tuned at 60 frames per second. */
export const lerpFactor = (perFrame: number, dt: number) => 1 - Math.pow(1 - perFrame, dt * 60);
