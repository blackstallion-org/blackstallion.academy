import { ScrollRevealText } from "@/components/motion/ScrollRevealText";
import { EditorialScrollSync, EditorialImage } from "@/components/motion/EditorialMotion";
import type { Metadata } from "next";
import { MaskedWord } from "@/components/motion/fx/MaskedWord";
import Link from "next/link";
import { BreathCue } from "@/components/film/BreathCue";
import { EndCard } from "@/components/film/EndCard";
import { FilmImage } from "@/components/film/FilmImage";
import { EditorialHeadline as Headline } from "@/components/motion/EditorialMotion";
import { EditorialReveal as Reveal } from "@/components/motion/EditorialMotion";
import { Ascent, ChapterHead, ChapterRail, Descent, EarsZoom, LegendTitle, RouteMap, TharGallopReel, ThreeWords } from "@/components/sections/legend/LegendScenes";
import { MarwariInterlude } from "@/components/sections/editorial/ReferencePanels";
import { HorizontalChapter } from "@/components/motion/HorizontalChapter";
import { ReplayHeadline } from "@/components/motion/ReplayHeadline";
import { bred, honour, honourClose, lore, ocean, revival, today } from "@/lib/content/legend";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  alternates: { canonical: "/legend" },
  title: "The Marwari",
  description: "Eight hundred years of the horse that would not leave the field: born of legend, bred in the Thar, nearly lost, revived. Every BSAH cadet rides one.",
};

export default function LegendPage() {
  return (
    <>
      <EditorialScrollSync />
      <LegendTitle />
      <MarwariInterlude />
      <ChapterRail />
      <TharGallopReel />

      {/* I · One bloodline — overview + miniature plate + three theories of origin */}
      <section id="ocean" aria-labelledby="ocean-h" className="gutter relative py-[clamp(6rem,14vh,12rem)]">
        <BreathCue />
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.75fr)] lg:items-center">
          <div>
            <ChapterHead id="ocean" />
            <Headline id="ocean-h" technique="words" className="mt-4 max-w-[16ch]" inscription={ocean.inscription} voice={ocean.voice} />
            <p className="t-story mt-4 italic text-bone">{ocean.sub}</p>
            <Reveal>
              <p className="t-story mt-8 max-w-2xl text-sand first-letter:float-left first-letter:mr-3 first-letter:mt-1 first-letter:[font-family:var(--font-kalnia)] first-letter:font-semibold first-letter:text-[4.2em] first-letter:leading-[0.8] first-letter:text-gold">
                {ocean.body}
              </p>
            </Reveal>
          </div>
          <Reveal as="figure" className="mx-auto w-full max-w-md">
            <div className="relative aspect-[3/4] border border-line p-3">
              <div className="relative h-full w-full">
                <EditorialImage><FilmImage name="legendBlack" sizes="(min-width: 1024px) 30vw, 90vw" grade="none" /></EditorialImage>
              </div>
            </div>
            <figcaption className="label mt-4 text-dust">
              <span className="font-mono mr-2 text-gold">PLATE I</span>
              {ocean.caption}
            </figcaption>
          </Reveal>
        </div>

        <div className="mt-24">
          <p className="label text-brass">Reel 01 · The three theories of origin</p>
          <ol className="mt-6 grid gap-px bg-line md:grid-cols-3">
            {ocean.theories.map((t, i) => (
              <Reveal as="li" key={t.name} delay={i * 0.1} className="bg-night p-6 md:p-8">
                <p className="flex items-center justify-between">
                  <span className="t-voice text-2xl text-bone">{t.name}</span>
                  <span className={cn("label", t.verdict === "Most accepted" ? "text-gold" : "text-dust")}>{t.verdict}</span>
                </p>
                <p className="mt-4 text-sand">{t.text}</p>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      {/* II · Marwar, 1193 — route map */}
      <RouteMap />

      {/* III · Bred by law — annotated callouts */}
      <section id="bred" aria-labelledby="bred-h" className="gutter relative py-[clamp(6rem,14vh,12rem)]">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
          <div className="relative aspect-[16/11] overflow-hidden lg:sticky motion-reduce:lg:static lg:top-24 lg:self-start">
            <EditorialImage><FilmImage name="legendSand" sizes="(min-width: 1024px) 50vw, 100vw" grade="none" /></EditorialImage>
            {[
              [60, 42], // 1: Upright shoulder
              [58, 72], // 2: Slim, hard legs
              [44, 34], // 3: Fine, silky coat
              [50, 52], // 4: Endurance
              [74, 18], // 5: The homing sense
              [32, 60], // 6: The revaal
            ].map(([x, y], i) => (
              <span
                key={i}
                aria-hidden
                className="widget-hud font-mono absolute grid h-7 w-7 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-gold bg-night/70 text-[0.65rem] text-gold"
                style={{ left: `${x}%`, top: `${y}%` }}
              >
                {i + 1}
              </span>
            ))}
          </div>
          <div>
            <ChapterHead id="bred" />
            <Headline id="bred-h" className="mt-4" inscription={bred.inscription} voice={bred.voice} />
            <ScrollRevealText className="t-story mt-6 text-sand">{bred.body}</ScrollRevealText>
            <ol className="mt-10 border-t border-line">
              {bred.traits.map((t, i) => (
                <Reveal as="li" key={t.name} className="grid grid-cols-[2.5rem_1fr] gap-4 border-b border-line py-5">
                  <span className="font-mono text-gold">{String(i + 1).padStart(2, "0")}</span>
                  <span>
                    <span className="t-voice block text-xl text-bone">{t.name}</span>
                    <span className="mt-1 block text-sand">{t.text}</span>
                  </span>
                </Reveal>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* IV · The ears — scrub zoom */}
      <EarsZoom />

      {/* V · The Traditional Lore of the Bards lives in its own reel (/lore), kept apart from history and science */}
      <section id="omens" aria-labelledby="omens-h" className="gutter relative py-[clamp(5rem,12vh,10rem)]">
        <ChapterHead id="omens" />
        <Headline id="omens-h" className="mt-4" inscription={lore.inscription} voice={lore.voice} size="2" />
        <ScrollRevealText className="t-story mt-6 max-w-2xl text-sand">{lore.sub}</ScrollRevealText>
        <p className="mt-4 max-w-2xl text-sm text-dust">
          Folklore is kept in a reel of its own, apart from this history and from the science: Kala, the hair whorls, the Nukra lineage and the Nachni heritage.
        </p>
        <Link href="/lore" className="label mt-8 inline-block border border-line px-4 py-3 text-sand hover:border-gold hover:text-bone">
          Enter the lore of the bards →
        </Link>
      </section>

      {/* VI · Three reasons */}
      <ThreeWords />
      <HorizontalChapter typeface="heritage" chapter="The living legacy" text="A horse carried centuries of memory." tone="light" />

      {/* VII · Roll of honour — native horizontal reel */}
      <section id="honour" aria-labelledby="honour-h" className="relative py-[clamp(6rem,14vh,12rem)]">
        <div className="gutter">
          <ChapterHead id="honour" />
          <Headline id="honour-h" technique="words" className="mt-4" inscription="The roll" voice="of honour." />
        </div>
        <ol tabIndex={0} className="no-scrollbar mt-12 flex snap-x snap-mandatory scroll-px-[max(16px,4vw)] gap-6 overflow-x-auto px-[max(16px,4vw)] pb-4" aria-label="Horses remembered">
          {honour.map((h) => (
            <li key={h.name} className="w-[78vw] shrink-0 snap-start sm:w-[46vw] lg:w-[30vw]">
              <div className="relative aspect-[3/4] overflow-hidden border border-line/40">
                <EditorialImage depth={false}><FilmImage name={h.image} sizes="(min-width: 1024px) 30vw, 78vw" grade="none" /></EditorialImage>

              </div>
                <div className="relative mt-5">
                  <p className="label text-gold ">
                    {h.when}
                    {h.legend && <span className="ml-2 text-dust">· legend</span>}
                  </p>
                  <p className="t-voice mt-1 text-3xl text-bone ">{h.name}</p>
                </div>
              <p className="mt-4 text-sand">{h.text}</p>
            </li>
          ))}
        </ol>
        <div className="gutter mt-10">
          <p className="t-story max-w-2xl italic text-bone">{honourClose}</p>
          <p className="label mt-4 text-dust">Scroll sideways for the full roll →</p>
        </div>
      </section>

      {/* VIII · The fall — descent */}
      <Descent />

      {/* IX · The revival — ascent timeline + vignette */}
      <section id="revival" aria-labelledby="revival-h" className="relative min-h-[100svh] overflow-hidden py-[clamp(6rem,14vh,12rem)]">
        {/* S65 Masked word: the herd photograph seen only through the word. Signature: letters rise, the herd drifts behind them. */}
        <div aria-hidden className="gutter mb-12">
          <MaskedWord as="p" text="Revival" image="legendRevival" textScale={0.2} />
        </div>
        <div className="gutter relative">
          <ChapterHead id="revival" />
          <Headline id="revival-h" className="mt-4 [text-shadow:0_2px_12px_rgba(0,0,0,0.6)]" inscription={revival.inscription} voice={revival.voice} />
          <div className="mt-14">
            <Ascent />
          </div>
          <Reveal className="parchment mx-auto mt-24 max-w-2xl px-8 py-10 md:px-14 md:py-14 shadow-2xl">
            <p className="label text-brass">{revival.vignette.note}</p>
            <p className="t-voice mt-3 text-3xl text-ink">{revival.vignette.title}</p>
            <p className="mt-5 text-lg leading-relaxed text-ink/85">{revival.vignette.text}</p>
          </Reveal>
        </div>
      </section>

      {/* XI · Every cadet rides one */}
      <section id="today" aria-labelledby="today-h" className="relative min-h-[100svh]">
        <div className="relative h-[75svh] min-h-[400px]"><EditorialImage><FilmImage name="legendToday" sizes="100vw" grade="none" /></EditorialImage></div>
        <div className="gutter editorial-reading relative">
          <ChapterHead id="today" />
          <Headline id="today-h" className="mt-4 [text-shadow:0_2px_12px_rgba(0,0,0,0.6)]" size="1" inscription={today.inscription} voice={today.voice} />
          <Reveal>
            <p className="t-story mt-6 max-w-xl text-bone [text-shadow:0_1px_8px_rgba(0,0,0,0.5)]">{today.body}</p>
          </Reveal>
          <p className="t-ui mt-10 max-w-2xl text-xs leading-relaxed text-dust">{today.sources}</p>
        </div>
      </section>

      <ReplayHeadline typeface="elegant" id="legend-replay" label="The story continues" text="The story stays with the horse." tone="dark" defaultMode="words" />
      <EndCard current={1} />
    </>
  );
}
