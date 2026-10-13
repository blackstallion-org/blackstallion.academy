import type { Metadata } from "next";
import Link from "next/link";
import { FilmImage } from "@/components/film/FilmImage";
import { Headline } from "@/components/film/Headline";
import { Label } from "@/components/film/Marks";
import { Reveal } from "@/components/film/Reveal";
import { GridScrollSection } from "@/components/sections/home/GridScrollSection";
import { lore } from "@/lib/content/legend";
import type { MediaKey } from "@/lib/content/media";

export const metadata: Metadata = {
  title: "The Traditional Lore of the Bards",
  description: "The oral histories, markings, and cadence of Marwar: Kala, the hair whorls, the Nukra lineage and the Nachni heritage, each read alongside BSAH's institutional interpretation.",
  alternates: { canonical: "/lore" },
};

/** One visual identity per component: its own plate, numeral and image. */
const plates: { image: MediaKey; numeral: string; grade: "film" | "mono" | "deep"; position?: string }[] = [
  { image: "kalaPortrait", numeral: "I", grade: "mono" },
  { image: "legendGrey", numeral: "II", grade: "film" },
  { image: "nukraPortrait", numeral: "III", grade: "film" },
  { image: "legendNachni", numeral: "IV", grade: "deep" },
];

/**
 * The Traditional Lore of the Bards: a standalone folklore reel, kept apart from the historical
 * (/legend) and scientific (/science, /anatomy) reels. Every component labels the folklore and the
 * BSAH interpretation separately; nothing here is presented as a scientific claim.
 */
export default function LorePage() {
  return (
    <>
      {/* Opening Visual Prologue: The Sovereign Arsenal & Living Warhorse Bloodlines */}
      <GridScrollSection />

      <section aria-labelledby="lore-h" className="gutter relative flex min-h-[60svh] flex-col justify-end pb-[10vh] pt-20 border-t border-line/40">
        <Label>Folklore · a reel of its own</Label>
        <h1 id="lore-h" className="mt-6 text-display-1">
          <span className="t-inscribe block text-[0.55em] text-bone">{lore.inscription}</span>
          <span className="t-voice block text-gold">{lore.voice}</span>
        </h1>
        <p className="t-story mt-8 max-w-2xl text-sand">{lore.sub}</p>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-dust">{lore.note}</p>
        <nav aria-label="Lore components" className="mt-10 flex flex-wrap gap-2">
          {lore.items.map((t, i) => (
            <a key={t.name} href={`#lore-${i + 1}`} className="label border border-line px-3 py-2 text-sand hover:border-gold hover:text-bone">
              {String(i + 1).padStart(2, "0")} · {t.name}
            </a>
          ))}
        </nav>
      </section>

      {lore.items.map((t, i) => {
        const plate = plates[i];
        const flip = i % 2 === 1;
        return (
          <section
            key={t.name}
            id={`lore-${i + 1}`}
            aria-labelledby={`lore-${i + 1}-h`}
            className="gutter relative scroll-mt-24 border-t border-line py-[clamp(5rem,12vh,10rem)]"
          >
            <div className={`grid gap-10 lg:grid-cols-2 lg:items-center ${flip ? "lg:[&>figure]:order-2" : ""}`}>
              <Reveal as="figure" className="relative mx-auto aspect-[4/5] w-full max-w-lg overflow-hidden border border-line">
                <FilmImage name={plate.image} grade={plate.grade} position={plate.position} sizes="(min-width: 1024px) 40vw, 92vw" />
                <span aria-hidden className="t-inscribe absolute left-4 top-3 text-5xl text-ivory/90 [text-shadow:0_1px_10px_rgb(23_21_19/0.55)]">{plate.numeral}</span>
              </Reveal>
              <div>
                <p className="font-mono text-xs text-gold">COMPONENT {String(i + 1).padStart(2, "0")}</p>
                <h2 id={`lore-${i + 1}-h`} className="t-voice mt-2 text-display-3 text-bone">{t.name}</h2>
                <p className="label mt-2 text-dust">{t.tag}</p>
                <div className="mt-8 border-l border-line pl-5">
                  <p className="label text-dust">Traditional lore · folklore</p>
                  <p className="t-story mt-3 italic text-sand">{t.lore}</p>
                </div>
                <div className="mt-8 border-l border-gold/60 pl-5">
                  <p className="label text-brass">BSAH interpretation</p>
                  <p className="mt-3 text-sand">{t.insight}</p>
                </div>
              </div>
            </div>
          </section>
        );
      })}

      <section aria-labelledby="vow-h" className="gutter relative border-t border-line py-[clamp(6rem,14vh,12rem)]">
        <Headline id="vow-h" inscription={lore.vow.inscription} voice={lore.vow.voice} voiceColor="blood" size="2" />
        <Reveal>
          <p className="t-story mt-6 max-w-xl text-sand">{lore.vow.text}</p>
        </Reveal>
        <p className="font-mono mt-10 text-xs text-dust">FOLKLORE · VARIES BY BREEDER AND REGION · NOT A SCIENTIFIC CLAIM</p>
        <div className="mt-12 flex flex-wrap gap-6">
          <Link href="/legend" className="label text-sand underline decoration-line underline-offset-4 hover:text-bone">← The history: Reel 01</Link>
          <Link href="/anatomy" className="label text-sand underline decoration-line underline-offset-4 hover:text-bone">The science: Reel 02 →</Link>
        </div>
      </section>
    </>
  );
}
