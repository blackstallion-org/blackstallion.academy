import Image from "next/image";
import { Headline } from "@/components/film/Headline";
import { Cta, Label } from "@/components/film/Marks";
import { Reveal } from "@/components/film/Reveal";
import { asset } from "@/lib/content/asset";
import { pratapStatue, pratapSummary } from "@/lib/content/pratap";

/** What follows the scroll story: the bronze, then the story told in plain paragraphs, above the footer. */
export function PratapAfterword() {
  return (
    <>
      <section aria-label="The bronze of Maharana Pratap on Chetak" className="gutter relative bg-night py-[clamp(4rem,10vh,8rem)]">
        <Reveal>
          <figure className="mx-auto max-w-6xl">
            <div className="overflow-hidden border border-line">
              <Image
                src={asset(pratapStatue.src)}
                alt={pratapStatue.alt}
                width={pratapStatue.width}
                height={pratapStatue.height}
                sizes="(min-width: 1280px) 1152px, 92vw"
                className="h-auto w-full"
              />
            </div>
            <figcaption className="mt-4 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
              <span className="t-voice text-lg text-bone">{pratapStatue.caption}</span>
              <span className="t-ui text-[0.78rem] italic text-dust">{pratapStatue.credit}</span>
            </figcaption>
          </figure>
        </Reveal>
      </section>

      <section aria-labelledby="pratap-summary-h" className="gutter relative border-t border-line bg-night pb-[clamp(5rem,12vh,10rem)] pt-[clamp(4rem,10vh,8rem)]">
        <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
          <div className="lg:sticky motion-reduce:lg:static lg:top-28 lg:self-start">
            <Label>{pratapSummary.label}</Label>
            <Headline id="pratap-summary-h" className="mt-4" size="2" inscription={pratapSummary.inscription} voice={pratapSummary.voice} />
          </div>
          <div>
            {pratapSummary.paragraphs.map((text, i) => (
              <Reveal as="p" key={i} delay={i * 0.05} className="mb-7 max-w-[38rem] text-[1.12rem] leading-[1.75] text-sand">
                {text}
              </Reveal>
            ))}
            <div className="mt-10 flex flex-wrap gap-4">
              <Cta href={pratapSummary.links[0].href} variant="ghost">{pratapSummary.links[0].label}</Cta>
              <Cta href={pratapSummary.links[1].href} variant="link">{pratapSummary.links[1].label}</Cta>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
