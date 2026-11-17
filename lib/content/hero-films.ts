import { asset } from "./asset";

/**
 * The two films the home page plays in HeroFilm. Every path is already wrapped in asset(), so the player uses them as they are.
 *
 *  - OPENING_FILM: the owner's current hero film, prepared as a browser-friendly 2:1 picture with sound. It is the
 *    first film under the doctrine screen, so the frame fills the band edge to edge.
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
  /**
   * The closing title shown over the film's held, dimmed last frame (the film plays once, without looping). Copy is set in
   * natural case; the player sets it in capitals. Leave it out and the film loops as before.
   */
  endTitle?: { name: string; line: string; replay: string };
};

export const OPENING_FILM: HeroFilmSpec = {
  id: "top",
  label: "Opening Film",
  poster: asset("/video/hero-rider-lesson-poster.webp"),
  posterMobile: asset("/video/hero-rider-lesson-poster-mobile.webp"),
  desktop: asset("/video/hero-rider-lesson.mp4"),
  mobile: asset("/video/hero-rider-lesson-mobile.mp4"),
  posterAlt: "A black horse in silhouette against a warm sunlit background",
  layout: "full",
  startAt: 0,
  // 16 Nov 2026 (owner): the film's own end card ("BLACK STALLION" on smoke, then 2.3 s of black, 58.04 s to 63.30 s) was cut
  // from both files. They now end on the last frame of the white-horse close-up (frame 1390, 57.958 s), with the sound faded out
  // over the last 1.4 s; originals are in git history. The academy's title is drawn by the player over that held frame instead.
  endTitle: { name: "The Black Stallion", line: "Academy of Horsemanship", replay: "Replay film" },
};
