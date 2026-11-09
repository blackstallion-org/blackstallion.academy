import { asset } from "./asset";

/**
 * The two films the home page plays in HeroFilm. Every path is already wrapped in asset(), so the player uses them as they are.
 *
 *  - OPENING_FILM: the owner's Marwar film (9 Nov 2026), 65 s, a true 2:1 picture with its own title card and sound. It is the
 *    first film under the doctrine screen, so the frame fills the band edge to edge (no baked bars to crop).
 *  - FIRST_FILM: the original opening film (Marwari stallions), kept further down the home page. It is a scope picture inside
 *    16:9 files with black bars baked in, so it keeps its wide, masked frame and starts on its title card at 2.8 s.
 */
export type HeroFilmSpec = {
  /** DOM id of the section; "top" is the anchor the site links to ("Replay opening film"). */
  id: string;
  label: string;
  poster: string;
  posterMobile: string;
  desktop: string;
  mobile: string;
  posterAlt: string;
  /** "full": the picture fills the band. "scope": the 16:9 file with baked bars, cropped by a mask (the original film). */
  layout: "full" | "scope";
  /** Seconds to jump to before the first playback (the title card), 0 for none. */
  startAt: number;
};

export const OPENING_FILM: HeroFilmSpec = {
  id: "top",
  label: "Opening Film",
  poster: asset("/video/hero-marwar-poster.webp"),
  posterMobile: asset("/video/hero-marwar-poster-mobile.webp"),
  desktop: asset("/video/hero-marwar-desktop.mp4"),
  mobile: asset("/video/hero-marwar-mobile.mp4"),
  posterAlt: "The Marwar: the title card of the academy's opening film over a desert sunset",
  layout: "full",
  startAt: 0,
};

export const FIRST_FILM: HeroFilmSpec = {
  id: "first-film",
  label: "The original opening film",
  poster: asset("/video/hero-main-poster.webp"),
  posterMobile: asset("/video/hero-main-poster.webp"),
  desktop: asset("/video/hero-main-desktop.mp4"),
  mobile: asset("/video/hero-main-mobile.mp4"),
  posterAlt: "Marwari stallions in the academy's original opening film",
  layout: "scope",
  startAt: 2.8,
};
