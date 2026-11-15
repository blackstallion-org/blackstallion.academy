import { asset } from "./asset";

/**
 * The opening film (16 Nov 2026, owner's brief): 37.5 s, one continuous historical journey cut from three generated parchment
 * animations and set to the owner's score. Marwar on the map → Rajput horsemen → British-era Jodhpur → the Jodhpur Lancers →
 * the royal stables → the lone black stallion. Shown once per session over the home page (components/opening/IntroFilm.tsx).
 *
 * Built by scripts/build-intro-film.mjs (the edit, per-beat speeds, the crop past the generator's corner mark, grain, the score's
 * fade and loudness are all documented there). H.264 + AAC in one file, so sound is always in sync: desktop 1920 × 1080, phones
 * 1280 × 720, faststart. The picture is illustration, and the frame says so (`note`).
 */
export const introFilm = {
  label: "From Marwar to the black stallion, in ink",
  desktop: asset("/video/intro-film.mp4"),
  mobile: asset("/video/intro-film-mobile.mp4"),
  poster: asset("/video/intro-film-poster.webp"),
  /** running time in seconds (the film's own end hands over to the page) */
  length: 37.5,
  note: "Illustrated film",
  music: { title: "Sovereign of the Marwar", credit: "original score" },
  /** what the film shows, for screen readers */
  description:
    "An illustrated film on parchment: the map of Marwar draws itself in ink and rises into Rajput horsemen before their forts; " +
    "British-era Jodhpur; the Jodhpur Lancers charge across the desert; the Maharaja among his Marwari horses; and a lone black " +
    "stallion standing on the map of the world.",
} as const;
