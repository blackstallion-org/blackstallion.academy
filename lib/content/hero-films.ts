import { lineageFilm } from "./lineage-film";

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
  /**
   * "full": a 2:1 picture fills a 2:1 band. "wide": a 16:9 picture fills a 16:9 band, uncropped (The Lineage).
   * "scope": the 16:9 file with baked bars, cropped by a mask (the original film).
   */
  layout: "full" | "wide" | "scope";
  /** Play once and hold the last frame under a quiet "Replay film" (a film with an `endTitle` does this too). Without it, a film loops. */
  once?: boolean;
  /** The Replay button's words when the film has no `endTitle`. */
  replayLabel?: string;
  /** Seconds to jump to before the first playback (the title card), 0 for none. */
  startAt: number;
  /**
   * The closing title shown over the film's held, dimmed last frame (the film plays once, without looping). Copy is set in
   * natural case; the player sets it in capitals. Leave it out and the film loops as before.
   */
  endTitle?: { name: string; line: string; replay: string };
};

/**
 * 17 Nov 2026 (owner): "add this as the website intro and remove the current one". The opening film is "The Lineage" (the one-minute
 * film built in video/, with its Rajasthani score and horse sounds), in place of the 16 Nov rider-lesson film, whose files stay in
 * public/video, unused. It plays once, uncropped, and holds its own end card (crest, BLACK STALLION, the motto), so it has no
 * `endTitle` over it. The file names live in lineageFilm (lib/content/lineage-film.ts), the same film that /film plays.
 */
export const OPENING_FILM: HeroFilmSpec = {
  id: "top",
  label: "The Lineage, the opening film",
  poster: lineageFilm.poster,
  posterMobile: lineageFilm.posterMobile,
  desktop: lineageFilm.desktop,
  mobile: lineageFilm.mobile,
  posterAlt: lineageFilm.posterAlt,
  layout: "wide",
  startAt: 0,
  once: true,
  replayLabel: "Replay film",
};
