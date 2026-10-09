import type { Metadata } from "next";
import { EndCard } from "@/components/film/EndCard";
import { FilmImage } from "@/components/film/FilmImage";
import { Headline } from "@/components/film/Headline";
import { Reveal } from "@/components/film/Reveal";
import { Ascent, ChapterHead, ChapterRail, Descent, EarsZoom, LegendTitle, RouteMap, ThreeWords } from "@/components/sections/legend/LegendScenes";
import { bred, dance, honour, honourClose, ocean, omens, revival, today } from "@/lib/content/legend";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "The Marwari",
  description: "Eight hundred years of the horse that would not leave the field: born of legend, bred in the Thar, nearly lost, revived. Every BSAH cadet rides one.",
};

function Swatch({ kind }: { kind: string }) {
  if (kind === "split")
    return <span className="h-10 w-10 rounded-full" style={{ background: "conic-gradient(#e9e4da 0 50%, #5a3b22 50% 100%)" }} />;
  if (kind === "whorl")
    return (
      <svg viewBox="0 0 40 40" className="h-10 w-10 text-brass" fill="none" stroke="currentColor" strokeWidth="1.2" aria-hidden>
        <path d="M20 20 m0 -2 a2 2 0 1 1 -2 2 a5 5 0 1 1 5 5 a8 8 0 1 1 -8 -8 a11 11 0 1 1 11 11" />
      </svg>
    );
  return <span className="h-10 w-10 rounded-full border border-brass/30" style={{ background: kind }} />;
}

export default function LegendPage() {
  return (
    <>
      <LegendTitle />
      <ChapterRail />

      {/* I · Born of the ocean — quote + miniature plate + three theories */}
      <section id="ocean" aria-labelledby="ocean-h" className="gutter relative py-[clamp(6rem,14vh,12rem)]">
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
                <FilmImage name="legendOcean" grade="none" sizes="(min-width: 1024px) 30vw, 90vw" />
              </div>
            </div>
            <figcaption className="label mt-4 text-dust">
              <span className="font-mono mr-2 text-gold">PLATE I</span>
              {ocean.caption}
            </figcaption>
          </Reveal>
        </div>

        <div className="mt-24">
          <p className="label text-brass">Three theories of where it really began</p>
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
          <div className="relative aspect-[16/11] overflow-hidden lg:sticky lg:top-24 lg:self-start">
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

      {/* V · Omens — almanac grid + the vow */}
      <section id="omens" aria-labelledby="omens-h" className="gutter relative py-[clamp(6rem,14vh,12rem)]">
        <ChapterHead id="omens" />
        <Headline id="omens-h" className="mt-4" inscription={omens.inscription} voice={omens.voice} />
        <p className="t-story mt-6 max-w-2xl text-sand">{omens.body}</p>
        <ul className="mt-12 grid grid-cols-1 gap-px bg-brass/15 sm:grid-cols-2 lg:grid-cols-4">
          {omens.tiles.map((t, i) => (
            <Reveal as="li" key={t.name} delay={(i % 4) * 0.08} className="flex flex-col gap-5 bg-night p-6">
              <div className="flex items-center justify-between">
                <Swatch kind={t.swatch} />
                <span className={cn("label", t.tone === "luck" ? "text-gold" : t.tone === "ill" ? "text-blood" : "text-dust")}>
                  {t.tone === "luck" ? "Fortune" : t.tone === "ill" ? "Ill omen" : "Apart"}
                </span>
              </div>
              <p className="t-voice text-xl text-bone">{t.name}</p>
              <p className="text-sm text-sand">{t.text}</p>
            </Reveal>
          ))}
          <li className="hidden bg-night p-6 lg:flex lg:items-end">
            <p className="font-mono text-xs leading-relaxed text-dust">FOLKLORE · VARIES BY BREEDER AND REGION</p>
          </li>
        </ul>

        <div className="relative mt-24 grid gap-10 overflow-hidden lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:items-center">
          <div className="relative aspect-[3/4] w-full max-w-md">
            <FilmImage name="legendBlack" sizes="(min-width: 1024px) 35vw, 90vw" />
          </div>
          <div>
            <Headline inscription={omens.vow.inscription} voice={omens.vow.voice} voiceColor="blood" size="2" />
            <Reveal>
              <p className="t-story mt-6 max-w-xl text-sand">{omens.vow.text}</p>
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
        <ol className="no-scrollbar mt-12 flex snap-x snap-mandatory gap-6 overflow-x-auto px-[max(16px,4vw)] pb-4" aria-label="Horses remembered">
          {honour.map((h) => (
            <li key={h.name} className="w-[78vw] shrink-0 snap-start sm:w-[46vw] lg:w-[30vw]">
              <div className="relative aspect-[3/4] overflow-hidden">
                <FilmImage name={h.image} grade={h.image === "legendChetak" ? "none" : "film"} sizes="(min-width: 1024px) 30vw, 78vw" />
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

      {/* VIII · Born to dance — interlude */}
      <section id="dance" aria-labelledby="dance-h" className="relative grid min-h-[80svh] lg:grid-cols-2">
        <div className="gutter flex flex-col justify-center py-24 lg:order-1">
          <ChapterHead id="dance" />
          <Headline id="dance-h" className="mt-4" inscription={dance.inscription} voice={dance.voice} />
          <Reveal>
            <p className="t-story mt-6 max-w-lg text-sand">{dance.body}</p>
          </Reveal>
        </div>
        <div className="relative min-h-[60svh] lg:order-2">
          <FilmImage name="legendNachni" sizes="(min-width: 1024px) 50vw, 100vw" />
          <div aria-hidden className="absolute inset-0 bg-gradient-to-r from-night via-transparent to-transparent lg:via-night/10" />
        </div>
      </section>

      {/* IX · The fall — descent */}
      <Descent />

      {/* X · The revival — ascent timeline + vignette */}
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
