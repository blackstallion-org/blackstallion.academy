import { FilmImage } from "@/components/film/FilmImage";
import { Cta, Label } from "@/components/film/Marks";
import { HomeHeadline as Headline } from "./HomeTypography";
import { horseFirst } from "@/lib/content/home";

/**
 * "Before the saddle, the horse." One photograph of a Marwar horseman with a black Marwari, and three sentences.
 * Took the place of the public colour-palette moodboard (Atelier) on 2 Nov 2026; the design tokens are unchanged.
 */
export function HorseFirst() {
  return (
    <section aria-labelledby="horse-first-h" className="bg-parch py-[clamp(5rem,12vh,10rem)]">
      <div className="gutter grid items-center gap-10 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-20">
        <figure className="relative mx-auto aspect-[4/5] w-full max-w-[34rem] overflow-hidden">
          <FilmImage name="homeHorseman" grade="none" sizes="(min-width: 768px) 34rem, 100vw" />
        </figure>
        <div className="max-w-md">
          <Label>{horseFirst.label}</Label>
          <Headline id="horse-first-h" className="mt-4" inscription={horseFirst.inscription} voice={horseFirst.voice} />
          <p data-home-detail className="t-story mt-6 text-sand">{horseFirst.body}</p>
          <div className="mt-8">
            <Cta href={horseFirst.cta.href}>{horseFirst.cta.label}</Cta>
          </div>
        </div>
      </div>
    </section>
  );
}
