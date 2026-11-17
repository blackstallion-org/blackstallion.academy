import { asset } from "./asset";

/**
 * The opening film (17 Nov 2026, owner's brief): "The Lineage", 60 s, 1920 x 1080 H.264 + AAC with its own sound, so picture and
 * score are always in sync. Parchment opens on the horse, the crown and the storm, then the lineage runs Marwar, Mughal India, the
 * Silk Roads, and closes on the BSAH crest and "Dominus sui, dominus equi". It replaced the 37.5 s ink-and-parchment journey
 * (scripts/build-intro-film.mjs, kept for history). The same file plays in the About reel (components/sections/about/LineageFilm.tsx).
 * Source: public/video/stills/the-lineage.mp4. Web cuts (ffmpeg, faststart): desktop = the source as is; phones = 1280 x 720, CRF 26,
 * AAC 96 kb/s. Shown once per session over the home page (components/opening/IntroFilm.tsx). The picture is illustration, and the
 * frame says so (`note`).
 */
export const introFilm = {
  label: "The Lineage",
  desktop: asset("/video/the-lineage.mp4"),
  mobile: asset("/video/the-lineage-mobile.mp4"),
  poster: asset("/video/the-lineage-poster.jpg"),
  /** running time in seconds (the film's own end hands over to the page) */
  length: 60,
  note: "Illustrated film",
  music: { title: "Sovereign of the Marwar", credit: "original score" },
  /** what the film shows, for screen readers */
  description:
    "An illustrated film on parchment: a Marwari horse and rider cross the desert below a fort, and a bond holds through the storm at " +
    "Haldighati; the lineage then runs from Marwar through Mughal India and the Silk Roads, and ends on the Black Stallion Academy " +
    "of Horsemanship crest and its motto, Dominus sui, dominus equi.",
} as const;
