import { HeroFilm } from "./HeroFilm";
import { FIRST_FILM } from "@/lib/content/hero-films";

/**
 * The academy's original opening film (Marwari stallions), kept on the home page after the new opening film took the top
 * (9 Nov 2026). Same player as the hero, without the "Skip intro" control.
 */
export function FirstFilm() {
  return (
    <>
      <div className="gutter pb-6 pt-[clamp(3rem,8vh,6rem)] md:pb-8">
        <p className="label text-brass">The first film</p>
        <p className="t-story mt-2 max-w-2xl text-sand">Where the academy&rsquo;s opening film began: Marwari stallions, kept here to watch again.</p>
      </div>
      <HeroFilm film={FIRST_FILM} />
    </>
  );
}
