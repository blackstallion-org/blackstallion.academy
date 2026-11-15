import { Headline } from "@/components/film/Headline";
import { FilmImage } from "@/components/film/FilmImage";
import { Label } from "@/components/film/Marks";
import { Reveal } from "@/components/film/Reveal";
import { whyPlate } from "@/lib/content/fx-scenes";

/**
 * §1b · The same child, beside a horse (14 Nov 2026, owner). Replaces the ASCII ripple: one plain photograph of a black
 * Marwari on a clean ground, framed as an editorial plate with its caption below. No overlay, no filter, no motion beyond
 * the house Reveal. Signature: the stillness of the plate itself after the glass of the screen above it.
 */
export function HorsePlate() {
  return (
    <section aria-labelledby="why-plate-h" className="relative bg-night py-[clamp(6rem,14vh,12rem)]">
      <div className="gutter grid gap-12 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1fr)] lg:items-center lg:gap-[6vw]">
        <Reveal>
          <Label>{whyPlate.label}</Label>
          <Headline id="why-plate-h" className="mt-4" inscription={whyPlate.inscription} voice={whyPlate.voice} />
          <p className="t-story mt-6 max-w-md text-sand">{whyPlate.body}</p>
        </Reveal>
        <Reveal as="figure" delay={0.1} className="mx-auto w-full max-w-[34rem] lg:mx-0 lg:justify-self-end">
          <div className="relative aspect-[4/5] overflow-hidden border border-line bg-ember">
            <FilmImage name="kalaPortrait" grade="none" position="50% 40%" sizes="(min-width: 1024px) 34rem, 92vw" />
          </div>
          <figcaption className="mt-4 flex items-baseline gap-3 border-t border-line pt-3">
            <span className="shrink-0 whitespace-nowrap font-mono text-[0.65rem] tracking-[0.12em] text-brass">PLATE I</span>
            <span className="t-story text-sm italic leading-snug text-dust">{whyPlate.caption}</span>
          </figcaption>
        </Reveal>
      </div>
    </section>
  );
}
