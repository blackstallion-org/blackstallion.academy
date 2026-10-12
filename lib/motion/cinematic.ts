/**
 * Shared timing for the five cinematic openings (docs/cinematic-redesign).
 * Every opening uses the house curves from ./tokens; these numbers only decide *when* things happen.
 */

/** Seconds the first-visit loader covers the page (components/motion/Loader.tsx leaves at ~1.15 s + 0.35 s fade). */
const LOADER_COVER = 1.35;

/**
 * Delay before an opening sequence starts, so it is never played behind the loader.
 * Client-only: call it inside an effect.
 */
export function openingDelay(extra = 0): number {
  if (typeof document === "undefined") return extra;
  const loaderSkipped = Boolean(document.documentElement.dataset.bsahLoaded);
  return (loaderSkipped ? 0.15 : LOADER_COVER) + extra;
}

export const cinematic = {
  /** Mask / aperture / dissolve: the one signature move per page. */
  signature: 1.7,
  /** Headline lines after the signature lands. */
  copy: 1.1,
  /** Background crossfades (hubs). */
  crossfade: 1.4,
  /** Hub carousel dwell, in ms, before the next destination (paused on hover, focus, hidden tab or reduced motion). */
  dwell: 7000,
} as const;
