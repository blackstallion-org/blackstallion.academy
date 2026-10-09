"use client";

import { AnimatePresence, motion, useInView, useReducedMotion, useScroll, useTransform } from "motion/react";
import { useRef, useState, type KeyboardEvent } from "react";
import { FilmImage } from "@/components/film/FilmImage";
import { Headline } from "@/components/film/Headline";
import { Label, ReelMark } from "@/components/film/Marks";
import { r } from "@/components/film/range";
import { RiderDiagram, type SystemId } from "@/components/sections/home/RiderDiagram";
import { statusColor, systems } from "@/lib/content/science";
import { ease } from "@/lib/motion/tokens";
import { cn } from "@/lib/utils";


/** Title card · T4 line drawing. Signature: motion-capture lines draw over the rider, then the photograph fades up. */
export function ScienceTitle() {
  const draw = { initial: { pathLength: 0 }, animate: { pathLength: 1 } };
  const t = (d: number) => ({ duration: 1.6, ease: ease.citadel, delay: d });
  return (
    <section aria-labelledby="science-h" className="relative min-h-[100svh] overflow-hidden">
      <motion.div className="absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 2.2, delay: 1.2 }}>
        <FilmImage name="scienceRider" priority grade="deep" />
      </motion.div>
      <div aria-hidden className="absolute inset-0 shade-l" />
      <svg viewBox="0 0 100 56.25" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full" aria-hidden>
        <g fill="none" stroke="var(--color-gold)" strokeWidth="0.12">
          <motion.line x1="58.5" y1="6" x2="58.5" y2="36" strokeDasharray="0.6 0.6" {...draw} transition={t(0.2)} />
          <motion.circle cx="58.5" cy="9.5" r="1.6" {...draw} transition={t(0.35)} />
          <motion.path d="M58.5 14 L58.3 22 L57.6 28" {...draw} transition={t(0.5)} />
          <motion.path d="M57.6 28 L61.5 33 L60.4 39" {...draw} transition={t(0.65)} />
          <motion.path d="M30 31 C 42 28.5, 52 28.5, 66 30.5" strokeDasharray="0.4 0.8" {...draw} transition={t(0.8)} />
          <motion.path d="M57.6 28 m-3 0 a3 3 0 0 1 6 0" {...draw} transition={t(1)} />
        </g>
        <g className="font-mono" fontSize="1.05" fill="rgb(230 202 101)">
          <motion.text x="59.6" y="7" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={t(1.2)}>
            AXIS 0.0°
          </motion.text>
          <motion.text x="62" y="27.5" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={t(1.35)}>
            PELVIS ≈100/MIN
          </motion.text>
          <motion.text x="31" y="29.6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={t(1.5)}>
            STRIDE
          </motion.text>
        </g>
      </svg>
      <div className="gutter relative flex min-h-[100svh] flex-col justify-end pb-[10vh]">
        <ReelMark n={3} act="citadel" />
        <Headline id="science-h" as="h1" size="poster" animate="mount" className="mt-6 max-w-[14ch]" inscription="What the saddle" voice="does to a child." />
        <p className="t-story mt-6 max-w-xl text-sand">Four systems, one twenty-minute session. Here is what we can show, and how sure we are.</p>
      </div>
    </section>
  );
}

/** §1 · S04 full console with evidence tags. */
export function SystemsConsole() {
  const [i, setI] = useState(0);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const s = systems[i];
  const onKey = (e: KeyboardEvent, k: number) => {
    const n = systems.length;
    const next = ["ArrowRight", "ArrowDown"].includes(e.key) ? (k + 1) % n : ["ArrowLeft", "ArrowUp"].includes(e.key) ? (k - 1 + n) % n : -1;
    if (next < 0) return;
    e.preventDefault();
    setI(next);
    tabs.current[next]?.focus();
  };
  return (
    <section aria-labelledby="systems-h" className="gutter relative py-[clamp(6rem,14vh,12rem)]">
      <Label>Four systems</Label>
      <Headline id="systems-h" className="mt-4" inscription="One rider," voice="four systems at work." />
      <div role="tablist" aria-label="Body systems" className="no-scrollbar mt-12 flex gap-8 overflow-x-auto border-b border-brass/20">
        {systems.map((x, k) => (
          <button
            key={x.id}
            ref={(el) => {
              tabs.current[k] = el;
            }}
            role="tab"
            aria-selected={i === k}
            aria-controls="systems-panel"
            id={`sys-${x.id}`}
            tabIndex={i === k ? 0 : -1}
            onClick={() => setI(k)}
            onKeyDown={(e) => onKey(e, k)}
            className={cn("relative shrink-0 pb-4 text-left", i === k ? "text-gold" : "text-sand hover:text-bone")}
          >
            <span className="font-mono mr-2 text-xs text-dust">0{k + 1}</span>
            <span className="t-voice text-xl md:text-2xl">{x.name}</span>
            {i === k && <motion.span layoutId="sys-underline" className="absolute inset-x-0 -bottom-px h-px bg-gold" />}
          </button>
        ))}
      </div>
      <div id="systems-panel" role="tabpanel" aria-labelledby={`sys-${s.id}`} className="mt-12 grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)] lg:items-center">
        <AnimatePresence mode="wait">
          <motion.div key={s.id} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.45, ease: ease.citadel }}>
            <ol className="flex flex-col gap-6">
              {s.points.map((p, k) => (
                <li key={p} className="grid grid-cols-[2.5rem_1fr] gap-4">
                  <span className="font-mono pt-1 text-gold">{String(k + 1).padStart(2, "0")}</span>
                  <p className="text-lede text-bone">{p}</p>
                </li>
              ))}
            </ol>
            <ul className="mt-10 flex flex-col gap-3 border-l border-brass/40 pl-5">
              {s.evidence.map((e) => (
                <li key={e.text}>
                  <span className={cn("label mr-3", statusColor[e.status])}>● {e.status}</span>
                  <span className="text-sm text-sand">{e.text}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        </AnimatePresence>
        <div className="mx-auto aspect-[5/7] w-full max-w-sm">
          <RiderDiagram active={s.id as SystemId} />
        </div>
      </div>
    </section>
  );
}

/** §2 · S28 pulse line. Signature: two waveforms (horse's walk, human gait) beat almost in phase at ~100/min. */
export function PulseLine() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.3 });
  const reduced = useReducedMotion();
  const wave = (amp: number, phase: number) =>
    Array.from({ length: 41 }, (_, k) => {
      const x = k * 30;
      const y = 60 + Math.sin((k / 4) * Math.PI + phase) * amp + Math.sin((k / 2) * Math.PI + phase) * amp * 0.25;
      return `${k ? "L" : "M"}${x} ${y.toFixed(1)}`;
    }).join(" ");
  return (
    <section aria-labelledby="pulse-h" className="relative overflow-hidden bg-umber/40 py-[clamp(6rem,14vh,12rem)]">
      <div className="gutter grid gap-12 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:items-center">
        <div>
          <Label>The walk</Label>
          <Headline id="pulse-h" className="mt-4" inscription="A hundred steps" voice="a minute." />
          <p className="t-story mt-6 text-sand">
            At a walk, a horse&rsquo;s back moves the rider&rsquo;s pelvis forward, sideways and up and down about a hundred times a minute: the same pattern the body makes when it walks. Therapists have used it for decades.
          </p>
          <p className="font-mono mt-8 text-3xl text-gold">≈100 movements / min</p>
          <p className="label mt-2 text-dust">Source · American Hippotherapy Association</p>
        </div>
        <div ref={ref} className="relative h-56 overflow-hidden border-y border-brass/15">
          {[
            { amp: 34, phase: 0, color: "var(--color-gold)", label: "Horse's walk · rider's pelvis" },
            { amp: 26, phase: 0.35, color: "rgb(200 176 138 / 0.6)", label: "Human walking gait" },
          ].map((w, k) => (
            <div key={k} className="absolute inset-0">
              <motion.svg
                viewBox="0 0 1200 120"
                preserveAspectRatio="none"
                className="absolute top-1/2 h-32 w-[200%] -translate-y-1/2"
                animate={inView && !reduced ? { x: ["0%", "-50%"] } : { x: "0%" }}
                transition={{ duration: 4.8, repeat: Infinity, ease: "linear" }}
                aria-hidden
              >
                <path d={wave(w.amp, w.phase)} fill="none" stroke={w.color} strokeWidth={k ? 1 : 1.8} vectorEffect="non-scaling-stroke" />
              </motion.svg>
              <span className="label absolute left-3" style={{ top: k ? "auto" : 10, bottom: k ? 10 : "auto", color: w.color }}>
                {w.label}
              </span>
            </div>
          ))}
          <span aria-hidden className="absolute inset-y-0 left-1/2 w-px bg-brass/30" />
        </div>
      </div>
    </section>
  );
}

/** §3 · S29 comparison ledger. Signature: each row rules in from the left. */
export function ComparisonLedger({ cols, rows, note }: { cols: readonly string[]; rows: readonly { k: string; a: string; b: string }[]; note: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.85", "end 0.6"] });
  return (
    <section aria-labelledby="compare-h" className="gutter relative py-[clamp(6rem,14vh,12rem)]">
      <Label>Demands compared</Label>
      <Headline id="compare-h" className="mt-4" inscription="Twenty minutes" voice="in the saddle." />
      <div ref={ref} className="mt-12">
        <div className="grid grid-cols-[6rem_1fr_1fr] gap-4 border-b border-brass/40 pb-3 md:grid-cols-[10rem_1fr_1fr] md:gap-8">
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
  const opacity = useTransform(progress, r(k / n, (k + 0.6) / n), [0.25, 1]);
  return (
    <motion.div className="relative grid grid-cols-[6rem_1fr_1fr] gap-4 py-6 md:grid-cols-[10rem_1fr_1fr] md:gap-8" style={{ opacity }}>
      <span className="label pt-1 text-brass">{row.k}</span>
      <span className="text-bone md:text-lg">{row.a}</span>
      <span className="text-sand/70 md:text-lg">{row.b}</span>
      <motion.span aria-hidden className="absolute inset-x-0 bottom-0 h-px origin-left bg-brass/25" style={{ scaleX }} />
    </motion.div>
  );
}

