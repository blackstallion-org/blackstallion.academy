import type { Metadata } from "next";
import Link from "next/link";
import { FilmImage } from "@/components/film/FilmImage";
import { Headline } from "@/components/film/Headline";
import { Arrow, ReelMark } from "@/components/film/Marks";
import { Reveal } from "@/components/film/Reveal";
import { LoreIndex } from "@/components/sections/journal/LoreIndex";
import { posts } from "@/lib/content/journal";
import { lore } from "@/lib/content/legend";
import type { MediaKey } from "@/lib/content/media";
import { reelNo } from "@/lib/content/site";

export const metadata: Metadata = {
  alternates: { canonical: "/journal" },
  title: "The Traditional Lore",
  description:
    "Marwar's oral tradition, told as folklore: Kaal the black horse, the hair whorls, the Nukra lineage and the horses born to dance, each beside how BSAH reads it today.",
};

/** One plate per chapter: the photograph, its numeral and where to hold the crop. */
const plates: { image: MediaKey; numeral: string; position?: string }[] = [
  { image: "kalaPortrait", numeral: "I" },
  { image: "legendGrey", numeral: "II" },
  { image: "nukraPortrait", numeral: "III", position: "40% 40%" },
  { image: "legendNachni", numeral: "IV" },
];

const chapters = lore.items.map((item, i) => ({ ...item, id: `lore-${i + 1}`, plate: plates[i] }));

/**
 * Reel 24 (since 17 Nov 2026) · The Traditional Lore (16 Nov 2026, owner's brief). It replaces "The Chronicle" and absorbs /lore (which now
 * redirects here): one page for Marwar's folklore, kept apart from the history (/legend) and the science (/anatomy, /science).
 * Every chapter separates what the bards said from how the academy reads it, and the page says plainly that none of it is a
 * scientific claim. The story index at the foot follows the editorial index the owner chose: a hairline, the title, a line in
 * capitals, one sentence, a number.
 */
export default function TraditionalLorePage() {
  return (
    <>
      {/* Title card */}
      <header className="gutter relative pb-[clamp(3.5rem,8vh,6rem)] pt-[clamp(7rem,14vh,10rem)]">
        <ReelMark n={reelNo("/journal")} act="ledger" />
        <Headline id="lore-title" as="h1" size="1" animate="mount" className="mt-8" inscription="The traditional" voice="lore." />
        <div className="mt-10 grid gap-8 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] md:gap-16">
          <p className="t-story max-w-xl text-xl leading-relaxed text-sand">
            The oral histories, markings and cadence of Marwar, as the bards told them, and how the academy reads them today.
          </p>
          <p className="max-w-md border-l border-brass/50 pl-5 text-sm leading-relaxed text-dust">{lore.note}</p>
        </div>
      </header>

      {/* The index sticks only while the four chapters scroll past (its containing block ends with chapter IV). */}
      <div>
      <LoreIndex chapters={chapters.map((c) => ({ id: c.id, name: c.name }))} />

      {/* Four chapters */}
      {chapters.map((c, i) => {
        const flip = i % 2 === 1;
        return (
          <section key={c.id} id={c.id} aria-labelledby={`${c.id}-h`} className="gutter relative scroll-mt-36 py-[clamp(5rem,12vh,9rem)]">
            <div className="grid gap-10 md:grid-cols-12 md:items-center md:gap-12">
              <Reveal as="figure" className={`relative md:col-span-5 ${flip ? "md:order-2 md:col-start-8" : ""}`}>
                <div className="relative aspect-[4/5] overflow-hidden bg-umber">
                  <FilmImage name={c.plate.image} grade="none" position={c.plate.position} sizes="(min-width: 768px) 40vw, 92vw" />
                </div>
              </Reveal>
              <div className={`md:col-span-6 ${flip ? "md:order-1 md:col-start-1" : "md:col-start-7"}`}>
                <p className="font-mono text-[0.68rem] tracking-[0.18em] text-brass">PART {c.plate.numeral} · {c.tag.toUpperCase()}</p>
                <h2 id={`${c.id}-h`} className="t-voice mt-4 text-[clamp(2.1rem,4.2vw,3.6rem)] leading-[1.05] text-bone">{c.name}</h2>
                <Reveal className="mt-8 border-t border-line pt-6">
                  <p className="label text-dust">As the bards told it</p>
                  <p className="t-story mt-3 text-lg italic leading-relaxed text-sand">{c.lore}</p>
                </Reveal>
                <Reveal delay={0.1} className="mt-7 border-t border-line pt-6">
                  <p className="label text-gold">How we read it today</p>
                  <p className="mt-3 leading-relaxed text-sand">{c.insight}</p>
                </Reveal>
              </div>
            </div>
          </section>
        );
      })}
      </div>

      {/* The vow */}
      <section aria-labelledby="vow-h" className="tone-dark surface-leather relative py-[clamp(6rem,14vh,11rem)]">
        <div className="gutter">
          <Headline id="vow-h" inscription={lore.vow.inscription} voice={lore.vow.voice} voiceColor="blood" size="2" />
          <p className="t-story mt-6 max-w-xl text-lg text-sand">{lore.vow.text}</p>
          <p className="font-mono mt-10 text-[0.65rem] tracking-[0.14em] text-dust">FOLKLORE · VARIES BY BREEDER AND REGION · NOT A SCIENTIFIC CLAIM</p>
        </div>
      </section>

      {/* Story index, in the owner's editorial style */}
      <section aria-labelledby="stories-h" className="gutter relative py-[clamp(6rem,14vh,11rem)]">
        <p className="label text-brass">From the lore</p>
        <h2 id="stories-h" className="t-voice mt-3 text-display-3 text-bone">Five stories, told as stories.</h2>
        <ol className="mt-14 grid gap-x-16 md:grid-cols-2">
          {posts.map((p, i) => (
            <li key={p.slug}>
              <Link href={`/journal/${p.slug}`} className="group block border-t border-line pb-12 pt-8 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold">
                <p className="t-voice text-[clamp(1.7rem,2.6vw,2.4rem)] leading-tight text-bone transition-colors duration-500 group-hover:text-gold">{p.title.join(" ")}</p>
                <p className="t-story mt-4 text-[0.95rem] uppercase tracking-[0.06em] text-sand">
                  Story {String(i + 1).padStart(2, "0")} · {p.meta}
                </p>
                <p className="t-story mt-5 max-w-xl text-lg leading-relaxed text-sand">{p.dek}</p>
                <p className="mt-6 flex items-center gap-3">
                  <span className="font-mono text-xs text-dust">{String(i + 1).padStart(2, "0")}</span>
                  <span className="label text-gold opacity-0 transition-opacity duration-500 group-hover:opacity-100 group-focus-visible:opacity-100">
                    {p.minutes} min read <Arrow className="ml-1 inline" />
                  </span>
                </p>
              </Link>
            </li>
          ))}
        </ol>
        <div className="mt-8 flex flex-wrap gap-6 border-t border-line pt-8">
          <Link href="/legend" className="label text-sand underline decoration-line underline-offset-4 hover:text-bone">← The history: the Marwari</Link>
          <Link href="/anatomy" className="label text-sand underline decoration-line underline-offset-4 hover:text-bone">The science: the instrument →</Link>
        </div>
      </section>
    </>
  );
}
