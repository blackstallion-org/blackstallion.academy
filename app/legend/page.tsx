import type { Metadata } from "next";
import { BreathCue } from "@/components/film/BreathCue";
import { EndCard } from "@/components/film/EndCard";
import { FilmImage } from "@/components/film/FilmImage";
import { Headline } from "@/components/film/Headline";
import { Reveal } from "@/components/film/Reveal";
import { Ascent, ChapterHead, ChapterRail, Descent, EarsZoom, LegendTitle, RouteMap, ThreeWords } from "@/components/sections/legend/LegendScenes";
import { bred, honour, honourClose, lore, ocean, revival, today } from "@/lib/content/legend";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "The Marwari",
  description: "Eight hundred years of the horse that would not leave the field: born of legend, bred in the Thar, nearly lost, revived. Every BSAH cadet rides one.",
};

export default function LegendPage() {
  return (
    <>
      <LegendTitle />
      <ChapterRail />

      {/* I · One bloodline — overview + miniature plate + three theories of origin */}
      <section id="ocean" aria-labelledby="ocean-h" className="gutter relative py-[clamp(6rem,14vh,12rem)]">
        <BreathCue />
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)] lg:items-center">
          <div>
            <ChapterHead id="ocean" />
            <Headline id="ocean-h" className="mt-4" inscription={ocean.inscription} voice={ocean.voice} />
            <Reveal>
              <p className="t-story mt-8 max-w-2xl text-sand first-letter:float-left first-letter:mr-3 first-letter:mt-1 first-letter:[font-family:var(--font-kalnia)] first-letter:font-semibold first-letter:text-[4.2em] first-letter:leading-[0.8] first-letter:text-gold">
                {ocean.body}
              </p>
            </Reveal>
          </div>
          <Reveal as="figure" className="mx-auto w-full max-w-md">
            <div className="relative aspect-[3/4] border border-brass/25 p-3">
              <div className="relative h-full w-full">
                <FilmImage name="legendBlack" sizes="(min-width: 1024px) 30vw, 90vw" />
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
          <ol className="mt-6 grid gap-px bg-brass/15 md:grid-cols-3">
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
            <FilmImage name="legendSand" sizes="(min-width: 1024px) 50vw, 100vw" />
            {[
              [38, 22],
              [52, 58],
              [70, 30],
              [30, 70],
              [82, 62],
              [60, 82],
            ].map(([x, y], i) => (
              <span
                key={i}
                aria-hidden
                className="font-mono absolute grid h-7 w-7 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-gold bg-night/70 text-[0.65rem] text-gold"
                style={{ left: `${x}%`, top: `${y}%` }}
              >
                {i + 1}
              </span>
            ))}
          </div>
          <div>
            <ChapterHead id="bred" />
            <Headline id="bred-h" className="mt-4" inscription={bred.inscription} voice={bred.voice} />
            <p className="t-story mt-6 text-sand">{bred.body}</p>
            <ol className="mt-10 border-t border-brass/20">
              {bred.traits.map((t, i) => (
                <Reveal as="li" key={t.name} className="grid grid-cols-[2.5rem_1fr] gap-4 border-b border-brass/20 py-5">
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

      {/* V · The Traditional Lore of the Bards — paired lore / insight ledger + the vow */}
      <section id="omens" aria-labelledby="omens-h" className="gutter relative py-[clamp(6rem,14vh,12rem)]">
        <ChapterHead id="omens" />
        <Headline id="omens-h" className="mt-4" inscription={lore.inscription} voice={lore.voice} />
        <p className="t-story mt-6 max-w-2xl text-sand">{lore.sub}</p>
        <ol className="mt-14 border-t border-brass/20">
          {lore.items.map((t, i) => (
            <Reveal as="li" key={t.name} delay={(i % 2) * 0.08} className="grid gap-6 border-b border-brass/20 py-10 lg:grid-cols-[14rem_1fr_1fr] lg:gap-10">
              <div>
                <p className="font-mono text-xs text-gold">ITEM {String(i + 1).padStart(2, "0")}</p>
                <p className="t-voice mt-2 text-2xl text-bone">{t.name}</p>
                <p className="label mt-2 text-dust">{t.tag}</p>
              </div>
              <div>
                <p className="label text-dust">Traditional lore</p>
                <p className="t-story mt-3 italic text-sand">{t.lore}</p>
              </div>
              <div>
                <p className="label text-brass">BSAH neutrality insight</p>
                <p className="mt-3 text-sand">{t.insight}</p>
              </div>
            </Reveal>
          ))}
        </ol>
        <p className="font-mono mt-6 text-xs text-dust">FOLKLORE · VARIES BY BREEDER AND REGION</p>

        <div className="relative mt-24 grid gap-10 overflow-hidden lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:items-center">
          <div className="relative aspect-[3/4] w-full max-w-md">
            <FilmImage name="legendBlack" sizes="(min-width: 1024px) 35vw, 90vw" />
          </div>
          <div>
            <Headline inscription={lore.vow.inscription} voice={lore.vow.voice} voiceColor="blood" size="2" />
            <Reveal>
              <p className="t-story mt-6 max-w-xl text-sand">{lore.vow.text}</p>
            </Reveal>
          </div>
        </div>
      </section>

      {/* VI · Three reasons */}
      <ThreeWords />

      {/* VII · Roll of honour — native horizontal reel */}
      <section id="honour" aria-labelledby="honour-h" className="relative py-[clamp(6rem,14vh,12rem)]">
        <div className="gutter">
          <ChapterHead id="honour" />
          <Headline id="honour-h" className="mt-4" inscription="The roll" voice="of honour." />
        </div>
        <ol className="no-scrollbar mt-12 flex snap-x snap-mandatory scroll-px-[max(16px,4vw)] gap-6 overflow-x-auto px-[max(16px,4vw)] pb-4" aria-label="Horses remembered">
          {honour.map((h) => (
            <li key={h.name} className="w-[78vw] shrink-0 snap-start sm:w-[46vw] lg:w-[30vw]">
              <div className="relative aspect-[3/4] overflow-hidden">
                <FilmImage name={h.image} sizes="(min-width: 1024px) 30vw, 78vw" />
                <div aria-hidden className="absolute inset-0 shade-b" />
                <div className="absolute inset-x-0 bottom-0 p-5">
                  <p className="label text-brass">
                    {h.when}
                    {h.legend && <span className="ml-2 text-dust">· legend</span>}
                  </p>
                  <p className="t-voice mt-1 text-3xl text-bone">{h.name}</p>
                </div>
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
      <section id="revival" aria-labelledby="revival-h" className="relative overflow-hidden py-[clamp(6rem,14vh,12rem)]">
        <FilmImage name="legendRevival" grade="deep" className="opacity-45" />
        <div aria-hidden className="absolute inset-0 bg-gradient-to-b from-night via-night/70 to-night" />
        <div className="gutter relative">
          <ChapterHead id="revival" />
          <Headline id="revival-h" className="mt-4" inscription={revival.inscription} voice={revival.voice} />
          <div className="mt-14">
            <Ascent />
          </div>
          <Reveal className="parchment mx-auto mt-24 max-w-2xl px-8 py-10 md:px-14 md:py-14">
            <p className="label text-[#6b5130]">{revival.vignette.note}</p>
            <p className="t-voice mt-3 text-3xl text-ink">{revival.vignette.title}</p>
            <p className="mt-5 text-lg leading-relaxed text-ink/85">{revival.vignette.text}</p>
          </Reveal>
        </div>
      </section>

      {/* XI · Every cadet rides one */}
      <section id="today" aria-labelledby="today-h" className="relative min-h-[100svh]">
        <FilmImage name="legendToday" sizes="100vw" />
        <div aria-hidden className="absolute inset-0 shade-b" />
        <div aria-hidden className="absolute inset-0 shade-l opacity-80" />
        <div className="gutter relative flex min-h-[100svh] flex-col justify-end pb-[10vh]">
          <ChapterHead id="today" />
          <Headline id="today-h" className="mt-4" size="1" inscription={today.inscription} voice={today.voice} />
          <Reveal>
            <p className="t-story mt-6 max-w-xl text-bone">{today.body}</p>
          </Reveal>
          <p className="t-ui mt-10 max-w-2xl text-xs leading-relaxed text-dust">{today.sources}</p>
        </div>
      </section>

      <EndCard current={1} />
    </>
  );
}
