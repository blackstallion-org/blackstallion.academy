"use client";

import { motion, useInView, useScroll, useTransform } from "motion/react";
import { useRef } from "react";
import { FilmImage } from "@/components/film/FilmImage";
import { Headline } from "@/components/film/Headline";
import { Label, ReelMark } from "@/components/film/Marks";
import { r } from "@/components/film/range";
import { assessment, classSegments, disciplines, ranks } from "@/lib/content/curriculum";
import { ease } from "@/lib/motion/tokens";

/** Title card · T6 ledger page. Signature: ruled lines draw across the ledger like a clerk's pen. */
export function CurriculumTitle() {
  return (
    <section aria-labelledby="curr-h" className="relative min-h-[100svh] overflow-hidden">
      <FilmImage name="currLedger" priority />
      <div aria-hidden className="absolute inset-0 bg-night/45" />
      <div aria-hidden className="absolute inset-0 shade-b" />
      <div aria-hidden className="absolute inset-x-0 top-[18%] flex flex-col gap-[4.2vh] px-[6vw] opacity-60">
        {Array.from({ length: 9 }, (_, i) => (
          <motion.span key={i} className="block h-px origin-left bg-brass/40" initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 1.2, ease: ease.citadel, delay: 0.2 + i * 0.08 }} />
        ))}
      </div>
      <div className="gutter relative flex min-h-[100svh] flex-col justify-end pb-[10vh]">
        <ReelMark n={5} act="citadel" />
        <Headline id="curr-h" as="h1" size="1" animate="mount" className="mt-6 max-w-5xl" inscription="An athletic curriculum" voice="that builds character." />
        <p className="t-story mt-6 max-w-2xl text-sand">Every mounted drill maps to a trait a leader needs in a boardroom, a negotiation or a crisis.</p>
      </div>
    </section>
  );
}

/** §1 · S34 staircase. Signature: each step rises into place, lifting the rank name with it. */
export function Staircase() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.35 });
  return (
    <section aria-labelledby="ranks-h" className="gutter relative py-[clamp(6rem,14vh,12rem)]">
      <Label>Four ranks</Label>
      <Headline id="ranks-h" className="mt-4" inscription="Squire to" voice="Sovereign Lancer." />
      <div ref={ref} className="mt-16 grid gap-4 md:h-[62svh] md:grid-cols-4 md:items-end md:gap-2">
        {ranks.map((rk, i) => (
          <motion.div
            key={rk.id}
            className="relative flex flex-col justify-start border-t-2 border-gold bg-gradient-to-b from-ember/70 to-transparent p-5 md:p-6"
            initial={{ height: "0%", opacity: 0 }}
            animate={inView ? { height: `${40 + i * 20}%`, opacity: 1 } : {}}
            transition={{ duration: 1.3, ease: ease.citadel, delay: i * 0.18 }}
            style={{ minHeight: 220 }}
          >
            <span className="t-inscribe text-3xl text-gold">{rk.numeral}</span>
            <p className="t-voice mt-3 text-2xl text-bone md:text-3xl">{rk.name}</p>
            <p className="mt-3 text-sm text-sand">{rk.detail}</p>
            <p className="t-ui mt-4 text-xs text-dust">{rk.insignia}</p>
            <p className="font-mono mt-auto pt-6 text-xs text-dust">PILLARS {String(rk.pillars[0]).padStart(2, "0")}–{String(rk.pillars[rk.pillars.length - 1]).padStart(2, "0")}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

/** §3 · S36 clock ring. Signature: the 45-minute ring fills segment by segment as you scroll. */
export function ClockRing() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.7", "end 0.7"] });
  const R = 150;
  const C = 2 * Math.PI * R;
  return (
    <section ref={ref} aria-labelledby="class-h" className="gutter relative py-[clamp(6rem,14vh,12rem)]">
      <div className="grid gap-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-center">
        <div className="relative mx-auto aspect-square w-full max-w-md">
          <svg viewBox="0 0 400 400" className="h-full w-full -rotate-90" aria-hidden>
            <circle cx="200" cy="200" r={R} fill="none" stroke="rgb(184 115 51 / 0.15)" strokeWidth="18" />
            {classSegments.map((s, i) => (
              <Seg key={s.title} i={i} progress={scrollYProgress} from={s.from} to={s.to} C={C} R={R} mounted={s.mounted} />
            ))}
            {Array.from({ length: 46 }, (_, m) => {
              const a = (m / 45) * Math.PI * 2;
              const len = m % 15 === 0 ? 14 : m % 5 === 0 ? 8 : 4;
              return (
                <line key={m} x1={200 + Math.cos(a) * 172} y1={200 + Math.sin(a) * 172} x2={200 + Math.cos(a) * (172 + len)} y2={200 + Math.sin(a) * (172 + len)} stroke="rgb(184 115 51 / 0.5)" strokeWidth="1" />
              );
            })}
          </svg>
          <div className="absolute inset-0 grid place-items-center text-center">
            <div>
              <p className="t-voice text-7xl text-gold">45</p>
              <p className="label mt-1 text-dust">minutes</p>
            </div>
          </div>
        </div>
        <div>
          <Label>One session</Label>
          <Headline id="class-h" className="mt-4" inscription="Forty-five" voice="minutes, exactly." />
          <ol className="mt-10 border-t border-brass/20">
            {classSegments.map((s) => (
              <li key={s.title} className="grid grid-cols-[5.5rem_1fr] gap-4 border-b border-brass/20 py-4">
                <span className="font-mono pt-1 text-sm text-gold">
                  {String(s.from).padStart(2, "0")}–{s.to}
                </span>
                <span>
                  <span className="t-voice block text-xl text-bone">
                    {s.title} {s.mounted && <span className="label ml-2 align-middle text-brass">Mounted</span>}
                  </span>
                  <span className="mt-1 block text-sand">{s.detail}</span>
                </span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

function Seg({ i, progress, from, to, C, R, mounted }: { i: number; progress: import("motion/react").MotionValue<number>; from: number; to: number; C: number; R: number; mounted: boolean }) {
  const len = ((to - from) / 45) * C;
  const offset = (from / 45) * C;
  const fill = useTransform(progress, r(from / 45, to / 45), [0, len - 3]);
  const dash = useTransform(fill, (f) => `${f} ${C}`);
  return (
    <motion.circle
      cx="200"
      cy="200"
      r={R}
      fill="none"
      stroke={mounted ? "var(--color-gold)" : "var(--color-brass)"}
      strokeWidth="18"
      strokeDasharray={dash}
      strokeDashoffset={-offset}
      opacity={0.6 + i * 0.08}
    />
  );
}

/** §5 · S38 three stamps. Signature: three stamps hit the page one after another. */
export function ThreeStamps() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });
  return (
    <section aria-labelledby="graded-h" className="gutter relative overflow-hidden py-[clamp(6rem,14vh,12rem)] text-center">
      <Label className="justify-center">Graded three ways</Label>
      <Headline id="graded-h" className="mx-auto mt-4" inscription="Every session," voice="sealed the same day." />
      <div ref={ref} className="mt-14 grid gap-10 sm:grid-cols-3">
        {assessment.map((a, i) => (
          <motion.div
            key={a.name}
            className="mx-auto flex max-w-xs flex-col items-center"
            initial={{ opacity: 0, scale: 1.4, rotate: -8 }}
            animate={inView ? { opacity: 1, scale: 1, rotate: i === 1 ? 3 : -4 } : {}}
            transition={{ duration: 0.5, ease: ease.citadel, delay: 0.2 + i * 0.35 }}
          >
            <div className="grid h-40 w-40 place-items-center rounded-full border-2 border-dashed border-blood/70 text-blood">
              <div className="grid h-32 w-32 place-items-center rounded-full border border-blood/60">
                <span className="t-inscribe text-lg tracking-[0.1em]">{a.name}</span>
              </div>
            </div>
            <p className="mt-6 text-sand">{a.detail}</p>
          </motion.div>
        ))}
      </div>
      <p className="mx-auto mt-12 max-w-xl text-sand">Grades enter the ledger the same day and appear in the parent app.</p>
    </section>
  );
}

/** §6 · S39 discipline panels. Four tall photographs; the caption rises on hover or focus. */
export function DisciplinePanels() {
  return (
    <section aria-labelledby="disc-h" className="relative py-[clamp(6rem,14vh,12rem)]">
      <div className="gutter">
        <Label>The disciplines</Label>
        <Headline id="disc-h" className="mt-4" inscription="Four ways" voice="to win a field." />
      </div>
      <ul className="mt-12 grid gap-1 sm:grid-cols-2 lg:grid-cols-4">
        {disciplines.map((d, i) => (
          <li key={d.name} tabIndex={0} className="group relative h-[70svh] overflow-hidden focus-visible:outline-offset-[-6px]">
            <FilmImage name={d.image} sizes="(min-width: 1024px) 25vw, 50vw" className="transition-transform duration-[1600ms] ease-[var(--ease-citadel)] group-hover:scale-[1.05] group-focus:scale-[1.05]" />
            <div aria-hidden className="absolute inset-0 shade-b" />
            <div className="absolute inset-x-0 bottom-0 p-6">
              <p className="font-mono text-xs text-gold">0{i + 1}</p>
              <p className="t-voice mt-2 text-3xl text-bone">{d.name}</p>
              <p className="mt-3 max-w-xs text-sand transition-all duration-700 lg:translate-y-4 lg:opacity-0 lg:group-hover:translate-y-0 lg:group-hover:opacity-100 lg:group-focus:translate-y-0 lg:group-focus:opacity-100">
                {d.line}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
