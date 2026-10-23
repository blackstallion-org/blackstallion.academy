"use client";

import { ScrollRevealText } from "@/components/motion/ScrollRevealText";

import { motion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";
import { Matrix } from "@/components/sections/home/Matrix";
import { FilmImage } from "@/components/film/FilmImage";
import { Headline } from "@/components/film/Headline";
import { Label, ReelMark } from "@/components/film/Marks";
import { r } from "@/components/film/range";
import { ease } from "@/lib/motion/tokens";


/** Title card · T4 line drawing. Signature: motion-capture lines draw over the rider, then the photograph fades up. */
export function ScienceTitle() {
  const draw = { initial: { pathLength: 0 }, animate: { pathLength: 1 } };
  const t = (d: number) => ({ duration: 1.6, ease: ease.citadel, delay: d });
  return (
    <section aria-labelledby="science-h" className="editorial-scene">
<div className="tone-dark editorial-visual relative min-h-[100svh] overflow-hidden">
      <motion.div className="absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 2.2, delay: 1.2 }}>
        <FilmImage name="scienceRider" priority grade="deep" />
      </motion.div>
      <div aria-hidden className="absolute inset-0 shade-l" />
      {/*
        Motion-capture overlay, registered to science-rider.png (rider's spine at x≈54.6 of 100, seat at y≈23.6 of 56.25).
        The SVG slices exactly as the photo covers, so the marks stay on the rider at any desktop size. Hidden on phones,
        where the portrait crop puts the rider behind the headline.
      */}
      <svg viewBox="0 0 100 56.25" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 hidden h-full w-full md:block" aria-hidden>
        <g fill="none" stroke="var(--color-antique)" strokeWidth="0.12">
          <motion.line x1="54.6" y1="3.2" x2="54.6" y2="34" strokeDasharray="0.6 0.6" {...draw} transition={t(0.2)} />
          <motion.circle cx="54.8" cy="5.8" r="2" {...draw} transition={t(0.35)} />
          <motion.path d="M54.8 8.6 L54.6 15.5 L54.1 23.6" {...draw} transition={t(0.5)} />
          <motion.path d="M54.1 23.6 L53 27.6 L55.2 35.5" {...draw} transition={t(0.65)} />
          <motion.path d="M54.1 23.6 m-3 0 a3 3 0 0 1 6 0" {...draw} transition={t(0.8)} />
          <motion.path d="M57.1 22.4 L60.6 19.8" strokeWidth="0.08" {...draw} transition={t(0.95)} />
          <motion.path d="M46.5 53.2 H68 M46.5 52.4 V54 M68 52.4 V54" {...draw} transition={t(1)} />
        </g>

      </svg>
      <div className="gutter relative flex min-h-[100svh] flex-col justify-end pb-[10vh]">
        
        <Headline id="science-h" as="h1" size="poster" animate="mount" className="mt-6 max-w-[4.7em]" inscription="What the saddle" voice="does to a child." />
        
      </div>
    </div>
<div className="tone-light editorial-details gutter"><ReelMark n={3} act="citadel" />
<ScrollRevealText className="t-story mt-6 max-w-xl text-sand">Four systems, one twenty-minute session. Here is what we can show, and how sure we are.</ScrollRevealText><p className="label text-dust">Axis 0.0° · Pelvis ≈100/min · Stride</p></div>
</section>
  );
}

/** §1 · S04 Biological Systems Matrix. */
export function SystemsConsole() {
  return <Matrix />;
}

export { WalkStudy as PulseLine } from "./WalkStudy";

/** §3 · S29 comparison ledger. Signature: each row rules in from the left. */
export function ComparisonLedger({ cols, rows, note }: { cols: readonly string[]; rows: readonly { k: string; a: string; b: string }[]; note: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.85", "end 0.6"] });
  return (
    <section aria-labelledby="compare-h" className="gutter relative py-[clamp(6rem,14vh,12rem)]">
      <Label>Demands compared</Label>
      <Headline id="compare-h" className="mt-4" inscription="Twenty minutes" voice="in the saddle." />
      <div ref={ref} className="mt-12">
        <div className="grid grid-cols-[6rem_1fr_1fr] gap-4 border-b border-line pb-3 md:grid-cols-[10rem_1fr_1fr] md:gap-8">
          <span />
          <span className="label text-gold">{cols[0]}</span>
          <span className="label text-dust">{cols[1]}</span>
        </div>
        {rows.map((row, k) => (
          <Row key={row.k} row={row} k={k} n={rows.length} progress={scrollYProgress} />
        ))}
        <p className="t-ui mt-6 max-w-2xl text-sm text-dust">{note}</p>
      </div>
    </section>
  );
}

function Row({ row, k, n, progress }: { row: { k: string; a: string; b: string }; k: number; n: number; progress: import("motion/react").MotionValue<number> }) {
  const scaleX = useTransform(progress, r(k / n, (k + 1) / n), [0, 1]);
  return (
    <motion.div className="relative grid grid-cols-[6rem_1fr_1fr] gap-4 py-6 md:grid-cols-[10rem_1fr_1fr] md:gap-8">
      <span className="label pt-1 text-brass">{row.k}</span>
      <span className="text-bone md:text-lg">{row.a}</span>
      <span className="text-sand md:text-lg">{row.b}</span>
      <motion.span aria-hidden className="absolute inset-x-0 bottom-0 h-px origin-left bg-line/25" style={{ scaleX }} />
    </motion.div>
  );
}

