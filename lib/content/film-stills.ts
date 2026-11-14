import { asset } from "./asset";

/**
 * Stills from the owner's Marwar Journey film (15 Nov 2026, public/video/marwar-journey.mp4). They replace the five supplied desert
 * photographs, three of which carried photographers' watermarks (van Alderen, Hafner, Ekaterina Druz / equine-photo.net) and two of
 * which were small originals enlarged to 1440 px. Each still is a full 1920 × 1080 frame taken from the 1080p master (no upscaling),
 * lightly sharpened and saved as WebP. The film is the owner's own, so the stills carry no third-party marks and need no credit line.
 * They are generated imagery (a placeholder in the same sense as the Higgsfield stills): none of them shows the academy, its horses or
 * its cadets.
 */
export type FilmStill = { src: string; width: number; height: number; alt: string; position: string };

const still = (name: string, alt: string, position: string): FilmStill => ({
  src: asset(`/images/film/${name}.webp`),
  width: 1920,
  height: 1080,
  alt,
  position,
});

export const filmStills = {
  /** the wide band under "Four ranks" (LedgerAscent) */
  citadelGate: still("citadel-gate", "A black Marwari walks across a stone forecourt toward a carved palace gate, a rider waiting in the arch.", "62% 58%"),
  /** curtain frame III, "Where the dust lifts." */
  dustLifts: still("dust-lifts", "A black Marwari with a white blaze canters toward the camera across the dunes, sand lifting behind it.", "38% 50%"),
  /** curtain frame IV, "Then it settles." */
  duneSettles: still("dune-settles", "A black Marwari stands still on the crest of a dune, its hoofprints in the sand behind it.", "30% 50%"),
  /** the Command banner: one large picture above the terminal */
  palaceCourtyard: still("palace-courtyard", "A dark bay Marwari in ceremonial tack trots across the chequered floor of a palace courtyard.", "34% 0%"),
};
