"use client";

import { motion, useReducedMotion, useTransform, type MotionValue } from "motion/react";
import { Chapter } from "../Chapter";
import { FilmImage } from "../FilmImage";
import { ProgressFade } from "../MaskLine";
import { assessment, creed, ranks } from "@/lib/content/film";
import { r } from "../range";

/**
 * Chapter III. The four ranks travel past like a cavalry line.
 * Signature moment: a lance draws across the frame as you advance from Squire to Lancer.
 */
export function Ranks() {
  return (
    <Chapter id="ranks" label="Chapter III: The Ranks" length={4.5}>
      {(p) => <RanksFrame p={p} />}
    </Chapter>
  );
}

function RanksFrame({ p }: { p: MotionValue<number> }) {
  const reduced = useReducedMotion();
  const x = useTransform(p, r(0.08, 0.86), ["0vw", `-${(ranks.length - 1) * 100}vw`]);
  const bgScale = useTransform(p, r(0, 1), [1.25, 1.05]);
  const bgX = useTransform(p, r(0, 1), ["3%", "-3%"]);
  const lance = useTransform(p, r(0.08, 0.86), [0, 1]);
  const creedOpacity = useTransform(p, r(0.86, 0.92), [0, 1]);

  return (
    <div className="relative h-full w-full bg-night">
      <FilmImage name="bgArena" scale={bgScale} x={bgX} />
      <div className="absolute inset-0 bg-night/55" />
      <div className="absolute inset-0 bg-gradient-to-t from-night via-transparent to-night/70" />

      <div className="absolute left-5 right-5 top-24 flex flex-wrap items-baseline justify-between gap-4 sm:left-10 sm:right-24 sm:top-28">
        <ProgressFade progress={p} range={[0.01, 0.06]}>
          <p className="label text-gold">
            Chapter III <span className="mx-3 text-sand/50">/</span> Squire to Lancer
          </p>
        </ProgressFade>
        <ProgressFade progress={p} range={[0.03, 0.08]}>
          <p className="label text-sand/80">
            Every session graded:{" "}
            {assessment.map((a, i) => (
              <span key={a} className="text-bone">
                {a}
                {i < assessment.length - 1 && <span className="mx-2 text-brass">/</span>}
              </span>
            ))}
          </p>
        </ProgressFade>
      </div>

      {/* The cavalry line */}
      <motion.ol
        className="absolute inset-y-0 left-0 flex"
        style={{ x: reduced ? 0 : x, width: `${ranks.length * 100}vw` }}
      >
        {ranks.map((r) => (
          <li key={r.name} className="relative flex h-full w-screen items-center px-5 sm:px-10 lg:pl-[8vw]">
            <span
              aria-hidden
              className="pointer-events-none absolute right-[4vw] top-1/2 -translate-y-1/2 select-none font-display text-[46vw] leading-none text-transparent opsz-display sm:text-[34vw]"
              style={{ WebkitTextStroke: "1px rgb(197 160 89 / 0.35)" }}
            >
              {r.numeral}
            </span>
            <div className="relative max-w-[640px]">
              <p className="label mb-5 text-brass">Rank {r.numeral}</p>
              <h3 className="font-display text-display-1 tracking-display text-bone opsz-display">{r.name}</h3>
              <p className="mt-6 max-w-[38ch] text-lede italic text-sand">{r.skills}</p>
            </div>
          </li>
        ))}
      </motion.ol>

      {/* The lance */}
      <div className="absolute bottom-[14svh] left-5 right-5 sm:left-10 sm:right-24" aria-hidden>
        <motion.div className="relative h-px origin-left bg-gradient-to-r from-brass/30 via-brass to-gold" style={{ scaleX: lance }}>
          <span className="absolute -right-1 -top-[5px] h-0 w-0 border-y-[5px] border-l-[14px] border-y-transparent border-l-gold" />
        </motion.div>
        <div className="mt-4 hidden justify-between sm:flex">
          {ranks.map((r) => (
            <span key={r.name} className="label text-[0.62rem] text-sand/60">
              {r.name}
            </span>
          ))}
        </div>
      </div>

      <motion.blockquote
        style={{ opacity: creedOpacity }}
        className="absolute bottom-[22svh] left-5 max-w-[34ch] font-display text-display-3 italic text-gold sm:left-auto sm:right-24"
      >
        “{creed[0]}”
      </motion.blockquote>
    </div>
  );
}
