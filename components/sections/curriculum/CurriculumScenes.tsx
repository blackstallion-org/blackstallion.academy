"use client";

import { motion, useInView, useScroll, useTransform } from "motion/react";
import { useRef, useState } from "react";
import { FilmImage } from "@/components/film/FilmImage";
import { Headline } from "@/components/film/Headline";
import { Label, ReelMark } from "@/components/film/Marks";
import { r } from "@/components/film/range";
import { assessment, classSegments, disciplines, ranks } from "@/lib/content/curriculum";
import { ease } from "@/lib/motion/tokens";
import { cn } from "@/lib/utils";
import { r3 } from "@/lib/round";

/** Title card · T6 ledger page. Signature: ruled lines draw across the ledger like a clerk's pen. */
export function CurriculumTitle() {
  return (
    <section aria-labelledby="curr-h" className="relative min-h-[100svh] overflow-hidden">
      <FilmImage name="currLedger" priority />
      <div aria-hidden className="absolute inset-0 bg-night/45" />
      <div aria-hidden className="absolute inset-0 shade-b" />
      <div aria-hidden className="absolute inset-x-0 top-[18%] flex flex-col gap-[4.2vh] px-[6vw] opacity-60">
        {Array.from({ length: 9 }, (_, i) => (
          <motion.span key={i} className="block h-px origin-left bg-line" initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 1.2, ease: ease.citadel, delay: 0.2 + i * 0.08 }} />
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

/** §1 · S34 staircase. Signature: each step rises into place; choosing a step opens its rank dossier. */
export function Staircase() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.35 });
  const [sel, setSel] = useState(0);
  const rk = ranks[sel];
  const focus = rk.detail.replace(/\.$/, "").split(/, (?:and )?/);
  const artifacts = rk.insignia.split(" · ").map((a) => (/stpci/i.test(a) ? `${a} (subject to verification)` : a));
  return (
    <section aria-labelledby="ranks-h" className="gutter relative py-[clamp(6rem,14vh,12rem)]">
      <Label>Four ranks</Label>
      <Headline id="ranks-h" className="mt-4" inscription="Squire to" voice="Sovereign Lancer." />
      <div ref={ref} className="mt-16 grid gap-4 md:h-[62svh] md:grid-cols-4 md:items-end md:gap-2" role="tablist" aria-label="Cadet ranks">
        {ranks.map((r_, i) => (
          <motion.button
            key={r_.id}
            type="button"
            role="tab"
            id={`rank-tab-${r_.id}`}
            aria-selected={sel === i}
            aria-controls="rank-panel"
            onClick={() => setSel(i)}
            className={cn(
              "relative flex flex-col justify-start border-t-2 p-5 text-left transition-colors md:p-6",
              sel === i ? "border-gold bg-gradient-to-b from-ember to-ember/20" : "border-line bg-gradient-to-b from-ember/50 to-transparent hover:border-gold/60",
            )}
            initial={{ height: "0%", opacity: 0 }}
            animate={inView ? { height: `${40 + i * 20}%`, opacity: 1 } : {}}
            transition={{ duration: 1.3, ease: ease.citadel, delay: i * 0.18 }}
            style={{ minHeight: 220 }}
          >
            <span className="t-inscribe text-3xl text-gold">{r_.numeral}</span>
            <span className="t-voice mt-3 block text-2xl text-bone md:text-3xl">{r_.name}</span>
            <span className="mt-3 block text-sm text-sand">{r_.detail}</span>
            <span className="t-ui mt-4 block text-xs text-dust">{r_.insignia}</span>
            <span className="font-mono mt-auto block pt-6 text-xs text-dust">PILLARS {String(r_.pillars[0]).padStart(2, "0")}–{String(r_.pillars[r_.pillars.length - 1]).padStart(2, "0")}</span>
          </motion.button>
        ))}
      </div>
      <div id="rank-panel" role="tabpanel" aria-labelledby={`rank-tab-${rk.id}`} className="mt-8 grid gap-8 border border-line p-6 md:grid-cols-[auto_1fr_1fr] md:p-8">
        <div>
          <p className="font-mono text-xs text-dust">RANK {rk.numeral} OF IV</p>
          <p className="t-voice mt-1 text-3xl text-gold">{rk.name}</p>
          <div className="mt-4 flex gap-1.5" aria-label={`Progress: rank ${sel + 1} of 4`}>
            {ranks.map((_, i) => (
              <span key={i} className={cn("h-1.5 w-10", i <= sel ? "bg-gold" : "bg-line")} />
            ))}
          </div>
        </div>
        <div>
          <p className="label text-brass">Core focus</p>
          <ul className="mt-3 space-y-1.5 text-sand">
            {focus.map((f) => (
              <li key={f}>· {f.charAt(0).toUpperCase() + f.slice(1)}</li>
            ))}
          </ul>
        </div>
        <div>
          <p className="label text-brass">Artifacts</p>
          <ul className="mt-3 space-y-1.5 text-sand">
            {artifacts.map((a) => (
              <li key={a}>· {a.charAt(0).toUpperCase() + a.slice(1)}</li>
            ))}
          </ul>
        </div>
        <p className="t-ui text-xs text-dust md:col-span-3">
          Illustrative progression. Ranks are awarded only on verified assessment records; nothing chosen here is saved.
        </p>
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
            <circle cx="200" cy="200" r={R} fill="none" stroke="color-mix(in srgb, var(--color-brass) 15%, transparent)" strokeWidth="18" />
            {classSegments.map((s, i) => (
              <Seg key={s.title} i={i} progress={scrollYProgress} from={s.from} to={s.to} C={C} R={R} mounted={s.mounted} />
            ))}
            {Array.from({ length: 46 }, (_, m) => {
              const a = (m / 45) * Math.PI * 2;
              const len = m % 15 === 0 ? 14 : m % 5 === 0 ? 8 : 4;
              return (
                <line key={m} x1={r3(200 + Math.cos(a) * 172)} y1={r3(200 + Math.sin(a) * 172)} x2={r3(200 + Math.cos(a) * (172 + len))} y2={r3(200 + Math.sin(a) * (172 + len))} stroke="color-mix(in srgb, var(--color-brass) 40%, transparent)" strokeWidth="1" />
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
          <ol className="mt-10 border-t border-line">
            {classSegments.map((s) => (
              <li key={s.title} className="grid grid-cols-[5.5rem_1fr] gap-4 border-b border-line py-4">
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
