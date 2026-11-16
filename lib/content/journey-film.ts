import { asset } from "./asset";

/**
 * The Marwar Journey: the second film on the home page (and the whole of /worlds). 17 Nov 2026 (owner): the village opening is gone;
 * the film is now the owner's three Google Flow clips in this order: I the desert (a black Marwari across the Thar), II the palace,
 * III the BSAH gate. Each source is 10 s (desert and palace 1920 x 1080, gate 1280 x 720, upscaled).
 *
 * Built with ffmpeg (scratchpad jbuild/build.sh, recorded in PROGRESS.md): every clip is cropped to x 6–1694 / y 65–1015 (gate:
 * the same share of its frame) to clear the generator's mark in the lower right, scaled to 1920 x 1080 at 24 fps, and joined with
 * 0.6 s dissolves, so there is never a black frame between scenes. The first 0.5 s fades up from charcoal and the last 0.7 s fades
 * down to it, so the loop dips through the page colour. 28.83 s. Desktop 1920 x 1080 (H.264 CRF 20, ≤ 4 Mb/s, faststart), phones
 * 1280 x 720 (CRF 23, ≤ 1.6 Mb/s). New file names (-v2) so no cached copy of the village cut can play.
 *
 * Soundtrack (unchanged licence): "India Epic Cinematic Music" (u_hlhpc1qr1p, Pixabay Content License) with the site's cavalry
 * gallop bed, taken from the previous cut, trimmed to the new length and faded out over the last 1.5 s; AAC 160 kb/s. The film plays
 * muted until the visitor turns its sound on. Licences: public/audio/LICENSES.md.
 */
export const journeyFilm = {
  id: "stallion",
  label: "The Marwar Journey",
  music: { title: "India Epic Cinematic Music", author: "u_hlhpc1qr1p", licence: "Pixabay Content License" },
  desktop: asset("/video/marwar-journey-v2.mp4"),
  mobile: asset("/video/marwar-journey-v2-mobile.mp4"),
  poster: asset("/video/marwar-journey-v2-poster.jpg"),
  posterMobile: asset("/video/marwar-journey-v2-poster-mobile.jpg"),
  posterAlt: "A black Marwari canters across the dunes of the Thar, sand lifting at its hooves.",
  inscription: "From the desert",
  voice: "to the citadel gate.",
  /** Chapter starts in seconds (the middle of each dissolve); the current one is named in the film's label. */
  chapters: [
    { n: "I", title: "The desert", at: 0 },
    { n: "II", title: "The palace", at: 9.7 },
    { n: "III", title: "The gate", at: 19.1 },
  ],
} as const;
