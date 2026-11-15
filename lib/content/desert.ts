import { asset } from "./asset";

/**
 * Desert pictures for the home page (14 Nov 2026, owner's request: replace the dark dust frames, the picture under "Four ranks"
 * and the Command banner with these five). Supplied by the owner and used with the photographers' permission as the owner
 * confirmed; the photographers' own marks stay in the pictures and the credit lines name them. The wide rider and the canyon
 * rider are paintings or composites, not photographs. Small originals are enlarged with Lanczos and light sharpening
 * (public/images/desert/). None of them shows the academy, its horses or its cadets.
 */
export type DesertPhoto = { src: string; width: number; height: number; alt: string; position: string };

const d = (name: string, width: number, height: number, alt: string, position: string): DesertPhoto => ({
  src: asset(`/images/desert/${name}.webp`),
  width,
  height,
  alt,
  position,
});

export const desert = {
  /** the wide picture under "Four ranks" (a 21:9 band) */
  riderAtSunset: d("rider-at-sunset", 1440, 596, "A lone rider gallops across a dusty plain beneath jagged mountains at sunset, cloak streaming.", "50% 55%"),
  /** curtain frame IV, "Then it settles." */
  canyonRider: d("canyon-rider", 1080, 1350, "A tiny rider crosses a vast sand canyon in an orange haze.", "50% 66%"),
  /** curtain frame III, "Where the dust lifts." The photographer's mark is at the top right, so the picture is held to the top. */
  rearingAtDawn: d("rearing-at-dawn", 1620, 1074, "A Marwari rears in silhouette against a red and violet dawn, dust lifting at its hooves.", "50% 0%"),
  /** the Command banner, left */
  dustSilhouette: d("dust-silhouette", 1440, 960, "A horse in silhouette rears in a cloud of golden dust against a pale orange sky.", "0% 50%"),
  /** the Command banner, right */
  palaceRearing: d("palace-rearing", 1440, 960, "A Marwari rears against a golden sunset between two domed palace pavilions.", "40% 50%"),
};

export const desertCredit = "Photographs of Marwari horses, used with the photographers' permission. Including van Alderen and Hafner Photography.";

/** Credit for the curtain frame that carries the Druz photograph. */
export const druzCredit = "Photograph: Ekaterina Druz (equine-photo.net), used with the photographer's permission.";
