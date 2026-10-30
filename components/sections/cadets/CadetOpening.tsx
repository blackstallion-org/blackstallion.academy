import { Headline } from "@/components/film/Headline";
import { FilmImage } from "@/components/film/FilmImage";
import { Label } from "@/components/film/Marks";
import { cadetOpening } from "@/lib/content/fx-scenes";

/**
 * The scene under the Hall of Valour opening (28 Oct 2026, owner's request): the small framed photograph that expanded
 * on scroll is gone; in its place one full-width Higgsfield still of a young cadet cantering a bay Marwari, with the promise
 * held on a gradient at its foot (no card on the photograph).
 */
export function CadetOpening() {
  return (
    <section aria-label={cadetOpening.label} className="tone-dark relative isolate flex min-h-[92svh] items-end overflow-hidden bg-night">
      <FilmImage name="cadetRohan" sizes="100vw" position="50% 20%" />
      {/* A daylight photograph: the fade is deeper than the shared shades so the type holds on it. */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-[78%] bg-gradient-to-t from-night via-night/85 to-transparent" />
      <div className="gutter relative z-10 w-full pb-[clamp(3rem,9vh,6rem)] pt-[clamp(8rem,30vh,16rem)]">
        <Label>{cadetOpening.label}</Label>
        <Headline className="mt-4" inscription={cadetOpening.inscription} voice={cadetOpening.voice} animate="none" />
        <p className="t-story mt-6 max-w-xl text-lede text-sand">{cadetOpening.body}</p>
      </div>
    </section>
  );
}
