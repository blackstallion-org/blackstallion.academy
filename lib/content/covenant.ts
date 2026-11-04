import type { MediaKey } from "@/lib/content/media";

/**
 * The Covenant on /fleet: four close shots, one short line each. It replaces the 3D cadet-and-stallion scene
 * (`FleetCovenantScene`, no longer on the page) with Higgsfield stills (28 Oct 2026, AI placeholder art until the shoot).
 * The lines are the old scene titles, shortened; no claims.
 */
export type CovenantFrame = {
  image: MediaKey;
  /** Roman numeral and a two-word name, set small. */
  mark: string;
  line: string;
  /** Slow push-in direction: where the frame drifts to, in percent of its own size. */
  drift: { x: number; y: number };
};

export const covenant = {
  label: "The covenant",
  region: "The Covenant: four close shots of a cadet and a Marwari stallion",
  frames: [
    { image: "covenantStillness", mark: "I · Stillness", line: "Two wills meet.", drift: { x: -1.2, y: -0.6 } },
    { image: "covenantEye", mark: "II · The eye", line: "Unbroken spirit.", drift: { x: 1.2, y: -0.8 } },
    { image: "covenantTouch", mark: "III · The touch", line: "A touch on velvet.", drift: { x: -1, y: 0.8 } },
    { image: "covenantProfile", mark: "IV · One breath", line: "Forged in silence.", drift: { x: 0.8, y: -0.6 } },
  ] satisfies CovenantFrame[],
};
