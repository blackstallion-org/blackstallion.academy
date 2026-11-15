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
  // 15 Nov 2026 (owner): the Four Ranks band and curtain frames III and IV now use 2752 px originals (gallop, dustPlume, legendBahadur);
  // 1080p film stills looked soft at full screen.
  /** the Command banner: one large picture above the terminal */
  palaceCourtyard: still("palace-courtyard", "A dark bay Marwari in ceremonial tack trots across the chequered floor of a palace courtyard.", "34% 0%"),
};
