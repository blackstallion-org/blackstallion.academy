import { FilmImage } from "@/components/film/FilmImage";
import { Headline } from "@/components/film/Headline";
import { Label } from "@/components/film/Marks";
import { atelier } from "@/lib/content/home";

/**
 * Moodboard composition: five stills in two columns with the house palette running down the seam.
 * Built from the academy's own (placeholder) stills and brand tokens; a poster that also works at phone width.
 */
const slots: Record<string, string> = {
  a: "aspect-[4/3.6]",
  b: "aspect-[4/2.2]",
  c: "aspect-[4/2]",
  d: "aspect-[4/5.25]",
  e: "aspect-[4/4.5]",
};

export function Atelier() {
  const left = atelier.tiles.filter((t) => t.slot === "a" || t.slot === "d");
  const right = atelier.tiles.filter((t) => t.slot === "b" || t.slot === "c" || t.slot === "e");
  const tile = (t: (typeof atelier.tiles)[number]) => (
    <div key={t.key} className={`relative w-full overflow-hidden ${slots[t.slot]}`}>
      <FilmImage name={t.key} grade="film" sizes="(min-width: 1024px) 30rem, 50vw" />
    </div>
  );

  return (
    <section aria-labelledby="atelier-h" className="bg-parch py-20 md:py-28">
      <div className="gutter grid gap-12 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:items-center lg:gap-20">
        <div className="max-w-md">
          <Label>{atelier.label}</Label>
          <Headline id="atelier-h" className="mt-4" inscription={atelier.inscription} voice={atelier.voice} />
          <p className="t-story mt-6 text-sand">{atelier.body}</p>
          <ul className="mt-8 flex flex-wrap gap-x-5 gap-y-2" aria-label="House colours">
            {atelier.swatches.map((s) => (
              <li key={s.name} className="label flex items-center gap-2 text-dust">
                <span aria-hidden className={`h-3 w-3 rounded-full ring-1 ring-brass/40 ${s.className}`} />
                {s.name}
              </li>
            ))}
          </ul>
        </div>

        <figure className="relative mx-auto w-full max-w-[34rem] bg-ivory p-[4%] shadow-[0_30px_60px_-30px_rgb(73_49_38/0.45)]">
          <div className="grid grid-cols-2 gap-[2.5%]">
            <div className="flex flex-col gap-[5%]">{left.map(tile)}</div>
            <div className="flex flex-col gap-[3.4%]">{right.map(tile)}</div>
          </div>
          {/* The palette runs down the seam between the two columns. */}
          <div aria-hidden className="pointer-events-none absolute inset-y-0 left-1/2 flex -translate-x-1/2 flex-col items-center justify-center gap-[2.2%]">
            {atelier.swatches.map((s) => (
              <span key={s.name} className={`block aspect-square w-[clamp(2.1rem,9vw,3.9rem)] rounded-full border-[3px] border-ivory shadow-sm ${s.className}`} />
            ))}
          </div>
          <figcaption className="sr-only">Moodboard of reins, a Marwari eye, leather tack, a rearing stallion and a cadet, with the house colours.</figcaption>
        </figure>
      </div>
    </section>
  );
}
