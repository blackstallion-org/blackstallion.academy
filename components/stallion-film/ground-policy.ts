/**
 * How the horse meets the ground in the film: one policy file so the numbers can be read (and tested) in one place.
 *
 *  - The only shadow is the sun's: the soft dark blobs under the hooves are drawn only when the quality tier has switched the cast shadow off
 *    (a horse with no shadow at all would float), and not otherwise.
 *  - Dust is kicked up by a hoof that strikes or leaves the ground and stays low: it starts with a little sideways and backward speed and
 *    almost no lift, is pulled down hard, is never allowed above `KICK_MAX_RISE` over the terrain or below it, and fades in under a second.
 *    There is no drifting ambient dust any more (those motes floated at head height and read as grey puffs).
 *  - Hoof prints are faint: they are laid at each touchdown and fade over about a quarter of a minute.
 */

/** Strength (0..1) of the dark contact blobs: none while the sun casts a real shadow. */
export function contactBlobStrength(castShadow: boolean): number {
  return castShadow ? 0 : 0.5;
}

/** The highest a kicked-up grain may be above the terrain, metres. */
export const KICK_MAX_RISE = 0.4;
/** Downward acceleration of dust, m/s^2 (a heavy grain of sand falls fast). */
export const KICK_GRAVITY = 3.4;

export interface Kick {
  /** Grains to emit. */
  count: number;
  /** Horizontal speed range, m/s (sideways and backward from the hoof). */
  speed: [number, number];
  /** Upward speed range, m/s (small: the kick stays near the ground). */
  rise: [number, number];
  /** Grain size range, metres. */
  size: [number, number];
  /** Life range, seconds. */
  life: [number, number];
  /** Peak opacity range. */
  alpha: [number, number];
  /** Growth of a grain over its life (1 = twice its size). */
  growth: number;
}

const clamp = (x: number, a: number, b: number) => Math.min(b, Math.max(a, x));

/** A hoof strikes: a small ring of dust that scales with speed and impact. `dust` is the surface's dustiness (0 for turf, stone). */
export function touchdownKick(speed: number, impact: number, dust: number, budget: number): Kick {
  const v = clamp(speed / 12, 0, 1);
  return {
    count: Math.round((1 + 4 * v * v) * dust * budget * (0.6 + 0.7 * clamp(impact, 0, 1.5))),
    speed: [0.15 + 0.5 * v, 0.5 + 1.3 * v],
    rise: [0.03, 0.12 + 0.2 * v],
    size: [0.05, 0.11 + 0.03 * v],
    life: [0.45, 0.8 + 0.25 * v],
    alpha: [0.1 * dust, 0.2 * dust],
    growth: 0.9,
  };
}

/** A hoof leaves the ground at pace: a short spray backward, still low. */
export function liftKick(speed: number, dust: number, budget: number): Kick {
  const v = clamp(speed / 12, 0, 1);
  return {
    count: speed > 2.5 ? Math.round((1 + 4 * v * v) * dust * budget) : 0,
    speed: [0.3 * speed * 0.1 + 0.2, 0.9 + 1.6 * v],
    rise: [0.06, 0.25 + 0.2 * v],
    size: [0.045, 0.1],
    life: [0.4, 0.75],
    alpha: [0.1 * dust, 0.22 * dust],
    growth: 1.0,
  };
}

/** Faint hoof prints: opacity by place (sand shows them, a paved village lane barely does) and how long they last (seconds). */
export const PRINTS = {
  strength: { desert: 0.26, campus: 0.2, village: 0.1 } as Record<string, number>,
  life: 14,
};
