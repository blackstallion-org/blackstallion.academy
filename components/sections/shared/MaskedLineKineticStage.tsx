"use client";

import { motion, useInView, type Variants } from "motion/react";
import { Fragment, useRef } from "react";
import { useReducedMotion } from "@/lib/motion/reduced";
import { ease } from "@/lib/motion/tokens";
import { cn } from "@/lib/utils";

export interface KineticBoxConfig {
  id: string;
  label: string;
  metric: string;
  description: string;
}

export interface MaskedLineKineticStageProps {
  id: string;
  label?: string;
  headline: string;
  caption?: string;
  /** The three principles under the headline. */
  boxes: KineticBoxConfig[];
  tone?: "dark" | "light";
}

const rise: Variants = { out: { y: "112%" }, in: { y: "0%" } };
const settle: Variants = { out: { opacity: 0, y: 18 }, in: { opacity: 1, y: 0 } };
const draw: Variants = { out: { scaleX: 0 }, in: { scaleX: 1 } };

/**
 * A statement and three principles, set plainly: one rule, one headline whose words rise once into view, and three
 * numbered columns. No controls, no loops. (It replaces a stage of looping boxes and replay buttons.) The first
 * sentence of the headline is in ink and the last in gold, the same two-voice pattern as the site's headlines.
 * Reduced motion: everything is simply there.
 */
export function MaskedLineKineticStage({ id, label, headline, caption, boxes, tone = "dark" }: MaskedLineKineticStageProps) {
  const ref = useRef<HTMLDivElement>(null);
  const seen = useInView(ref, { once: true, margin: "0px 0px -15% 0px" });
  const reduced = useReducedMotion();
  const state = seen || reduced ? "in" : "out";
  const time = (seconds: number) => (reduced ? { duration: 0 } : { duration: seconds, ease: ease.citadel });

  // "First sentence. Second sentence." -> two voices. A headline with one sentence is all ink.
  const sentences = headline.match(/[^.!?]+[.!?]+(\s|$)/g)?.map((s) => s.trim()) ?? [headline];
  const leadWords = (sentences.length > 1 ? sentences.slice(0, -1).join(" ") : sentences[0]).split(" ");
  const tailWords = sentences.length > 1 ? sentences[sentences.length - 1].split(" ") : [];
  const words = (list: string[], offset: number, className?: string) =>
    list.map((word, i) => (
      // The space sits outside the mask: a trailing space inside an inline-block collapses and glues the words.
      <Fragment key={`${offset + i}-${word}`}>
        <span className="inline-block overflow-hidden pb-[0.14em] align-bottom">
          <motion.span
            className={cn("inline-block", className)}
            variants={rise}
            animate={state}
            initial={false}
            transition={{ ...time(0.9), delay: reduced ? 0 : Math.min((offset + i) * 0.035, 0.9) }}
          >
            {word}
          </motion.span>
        </span>{" "}
      </Fragment>
    ));

  return (
    <section
      id={id}
      aria-labelledby={`${id}-heading`}
      className={cn("relative bg-night py-[clamp(5rem,12vh,10rem)] text-bone", tone === "dark" && "tone-dark")}
    >
      <div ref={ref} className="gutter mx-auto w-full max-w-6xl">
        {label && (
          <p className="label flex items-center gap-4 text-brass">
            <span aria-hidden className="h-px w-10 bg-brass/60" />
            {label}
          </p>
        )}

        <h2 id={`${id}-heading`} className="t-voice mt-8 max-w-[28ch] text-balance text-[clamp(2rem,4.4vw,3.9rem)] leading-[1.12] text-bone">
          {words(leadWords, 0)}
          {words(tailWords, leadWords.length, "text-gold")}
        </h2>

        {caption && (
          <motion.p
            className="t-story mt-8 max-w-2xl text-lg leading-relaxed text-sand"
            variants={settle}
            animate={state}
            initial={false}
            transition={{ ...time(0.8), delay: reduced ? 0 : 0.5 }}
          >
            {caption}
          </motion.p>
        )}

        <motion.span
          aria-hidden
          className="mt-14 block h-px origin-left bg-line"
          variants={draw}
          animate={state}
          initial={false}
          transition={{ ...time(1.1), delay: reduced ? 0 : 0.35 }}
        />

        <ol className="grid md:grid-cols-3">
          {boxes.map((box, index) => (
            <motion.li
              key={box.id}
              className={cn(
                "border-b border-line py-9 last:border-b-0 md:border-b-0 md:py-12",
                index > 0 && "md:border-l md:pl-10",
                index < boxes.length - 1 && "md:pr-10",
              )}
              variants={settle}
              animate={state}
              initial={false}
              transition={{ ...time(0.8), delay: reduced ? 0 : 0.55 + index * 0.14 }}
            >
              <span className="font-mono text-xs tracking-[0.2em] text-gold">{String(index + 1).padStart(2, "0")}</span>
              <p className="label mt-5 text-brass">{box.label}</p>
              <p className="t-inscribe mt-3 text-[clamp(1.05rem,1.5vw,1.3rem)] leading-snug text-bone">{box.metric}</p>
              <p className="t-story mt-4 text-base leading-relaxed text-sand">{box.description}</p>
            </motion.li>
          ))}
        </ol>
      </div>
    </section>
  );
}
