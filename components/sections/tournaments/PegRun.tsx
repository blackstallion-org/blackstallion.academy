"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { motion } from "motion/react";
import { Headline } from "@/components/film/Headline";
import { Label } from "@/components/film/Marks";
import { MorphGallery } from "@/components/motion/fx/MorphGallery";
import { VelocityMarquee } from "@/components/motion/fx/VelocityMarquee";
import { ScrollRevealText } from "@/components/motion/ScrollRevealText";
import { mediaSrc } from "@/lib/content/media";
import { pegIntro, pegStages, pegVirtues } from "@/lib/content/peg";
import { useReducedMotion } from "@/lib/motion/reduced";
import { ease } from "@/lib/motion/tokens";
import { cn } from "@/lib/utils";

/**
 * §3 · S63 Peg run (replaces the static S59 course diagram; the diagram survives as the lane strip).
 * One run in four stages. Signature moment: each stage dissolves into the next through drifting noise
 * (MorphGallery) while the rider mark travels down the 100 m lane. Play runs the four stages once.
 * Coda: the four virtues drift past, quickening with the scroll (VelocityMarquee).
 */
const STEP_MS = 2600;

export function PegRun() {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const reduced = useReducedMotion();
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const stage = pegStages[index];
  const items = pegStages.map((s) => ({ src: mediaSrc(s.image) ?? "", alt: s.name }));

  useEffect(() => {
    if (!playing) return;
    if (index >= pegStages.length - 1) {
      const done = window.setTimeout(() => setPlaying(false), STEP_MS);
      return () => window.clearTimeout(done);
    }
    const t = window.setTimeout(() => setIndex((i) => i + 1), STEP_MS);
    return () => window.clearTimeout(t);
  }, [playing, index]);

  const choose = (i: number) => {
    setPlaying(false);
    setIndex(i);
  };
  const onKey = (e: KeyboardEvent<HTMLButtonElement>, i: number) => {
    const last = pegStages.length - 1;
    const next = e.key === "ArrowRight" || e.key === "ArrowDown" ? (i === last ? 0 : i + 1) : e.key === "ArrowLeft" || e.key === "ArrowUp" ? (i === 0 ? last : i - 1) : e.key === "Home" ? 0 : e.key === "End" ? last : -1;
    if (next < 0) return;
    e.preventDefault();
    choose(next);
    tabs.current[next]?.focus();
  };
  const play = () => {
    if (playing) {
      setPlaying(false);
      return;
    }
    setIndex(0);
    setPlaying(true);
  };

  return (
    <section aria-labelledby="course-h" className="tone-dark relative bg-night py-[clamp(6rem,14vh,12rem)]">
      <div className="gutter grid gap-10 lg:grid-cols-[minmax(0,0.75fr)_minmax(0,1.25fr)] lg:items-end">
        <div>
          <Label>{pegIntro.label}</Label>
          <Headline id="course-h" className="mt-4" inscription={pegIntro.inscription} voice={pegIntro.voice} />
        </div>
        <ScrollRevealText className="t-story max-w-2xl text-sand">{pegIntro.body}</ScrollRevealText>
      </div>

      <div className="gutter mt-12 grid gap-8 lg:grid-cols-[minmax(0,1.45fr)_minmax(0,0.55fr)]">
        <figure className="relative">
          <MorphGallery items={items} index={index} className="aspect-[16/9] w-full border border-line" />
          <figcaption className="sr-only" aria-live="polite">
            Stage {stage.n}, {stage.name}: {stage.text}
          </figcaption>
          {/* the lane: 100 m, rider mark travels with the stage */}
          <div aria-hidden className="relative mt-6 h-12">
            <div className="absolute inset-x-0 top-4 h-px bg-line" />
            {Array.from({ length: 11 }, (_, i) => (
              <span key={i} className="absolute top-4 flex -translate-x-1/2 flex-col items-center" style={{ left: `${i * 10}%` }}>
                <span className="h-2 w-px bg-line" />
                <span className={cn("font-mono mt-1 text-[10px] text-dust", i % 2 === 1 && "hidden sm:block")}>{i * 10}</span>
              </span>
            ))}
            <span className="absolute top-2.5 h-3 w-1.5 bg-gold" style={{ left: "88%" }} />
            <span className="absolute -top-1 h-9 w-0.5 bg-blood" style={{ left: "94%" }} />
            <motion.span
              className="absolute top-1.5 h-5 w-5 -translate-x-1/2 rounded-full border border-gold bg-night"
              initial={false}
              animate={{ left: `${stage.mark * 100}%` }}
              transition={reduced ? { duration: 0 } : { duration: 1.4, ease: ease.citadel }}
            />
          </div>
          <p className="t-ui mt-1 text-xs text-dust">{pegIntro.note}</p>
        </figure>

        <div>
          <div role="tablist" aria-label="Stages of a tent-pegging run" aria-orientation="vertical" className="border-t border-line">
            {pegStages.map((s, i) => (
              <button
                key={s.key}
                ref={(el) => {
                  tabs.current[i] = el;
                }}
                role="tab"
                id={`peg-tab-${s.key}`}
                aria-selected={i === index}
                aria-controls="peg-panel"
                tabIndex={i === index ? 0 : -1}
                onClick={() => choose(i)}
                onKeyDown={(e) => onKey(e, i)}
                className={cn("flex w-full items-baseline gap-5 border-b border-line py-4 text-left transition-colors", i === index ? "text-bone" : "text-dust hover:text-sand")}
              >
                <span className={cn("font-mono text-xs", i === index ? "text-gold" : "")}>{s.n}</span>
                <span className="t-voice text-2xl">{s.name}</span>
                <span className="label ml-auto text-[0.65rem]">{s.at}</span>
              </button>
            ))}
          </div>
          <div id="peg-panel" role="tabpanel" aria-labelledby={`peg-tab-${stage.key}`} className="mt-6 min-h-[7.5rem]">
            <p className="t-story text-lede text-sand">{stage.text}</p>
          </div>
          <button type="button" onClick={play} aria-pressed={playing} className="label mt-6 inline-flex items-center gap-3 border border-line px-5 py-3 text-sand transition-colors hover:border-gold hover:text-bone">
            <span aria-hidden className="font-mono text-gold">{playing ? "❚❚" : "▶"}</span>
            {playing ? "Pause the run" : "Play the run"}
          </button>
        </div>
      </div>

      <VelocityMarquee rows={pegVirtues} className="mt-[clamp(4rem,10vh,8rem)] text-bone" rowClassName="t-inscribe py-1 text-[clamp(2.5rem,8vw,7.5rem)] leading-none" />
    </section>
  );
}
