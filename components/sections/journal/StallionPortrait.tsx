import Link from "next/link";
import { FilmImage } from "@/components/film/FilmImage";
import { Arrow } from "@/components/film/Marks";
import { TextAnimate } from "@/components/motion/TextAnimate";

/**
 * One plate, set like a page of the studbook: the portrait large in a parchment frame, the words beside it, a hairline between.
 * It replaced the single-card "StaticImageReel" (a lone thumbnail with a line about not being an interactive effect) on 30 Oct 2026.
 */
const marks = [
  { n: "01", name: "The ear", text: "Lyre-shaped, curving in until the tips touch." },
  { n: "02", name: "The coat", text: "Kala: black, traced gold by lantern light." },
  { n: "03", name: "The bearing", text: "Neck high, legs hard, bred for the desert." },
];

export function StallionPortrait() {
  return (
    <section aria-labelledby="portrait-h" className="tone-dark bg-night py-[clamp(5rem,10vw,9rem)]">
      <div className="gutter grid gap-12 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:items-end lg:gap-20">
        <figure>
          <div className="bg-umber p-2">
            <div className="relative aspect-[4/5] overflow-hidden sm:aspect-[5/4] lg:aspect-[4/5]">
              <FilmImage name="legendBlack" grade="none" sizes="(min-width: 1024px) 52vw, 100vw" />
            </div>
          </div>
          <figcaption className="label mt-4 flex flex-wrap justify-between gap-x-6 gap-y-1 text-dust">
            <span>Plate XIV · The studbook portrait</span>
            <span>Black Marwari stallion</span>
          </figcaption>
        </figure>

        <div>
          <p className="label text-brass">From the stable</p>
          <h2 id="portrait-h" className="mt-5 text-display-2 text-bone">
            <TextAnimate as="span" animation="slideUp" className="t-inscribe block">
              The sovereign
            </TextAnimate>
            <TextAnimate as="span" animation="blurIn" delay={0.35} className="t-voice block text-gold">
              stallion.
            </TextAnimate>
          </h2>
          <TextAnimate as="p" animation="blurIn" delay={0.6} className="t-story mt-6 max-w-md text-lg italic text-sand">
            Eight centuries of selection, held still in one frame.
          </TextAnimate>

          <ol className="mt-10 divide-y divide-line border-y border-line">
            {marks.map((m) => (
              <li key={m.n} className="grid grid-cols-[2.5rem_1fr] gap-x-4 py-5">
                <span className="font-mono text-xs text-dust">{m.n}</span>
                <div>
                  <p className="t-inscribe text-lg text-bone">{m.name}</p>
                  <p className="t-voice mt-1 text-gold">{m.text}</p>
                </div>
              </li>
            ))}
          </ol>

          <Link href="/fleet" className="label mt-8 inline-flex items-center gap-3 text-gold hover:text-bone">
            Meet the fleet <Arrow />
          </Link>
        </div>
      </div>
    </section>
  );
}
