"use client";

import { motion, useInView, useMotionValueEvent, useScroll, useTransform, type MotionValue } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { FilmImage } from "@/components/film/FilmImage";
import { Headline } from "@/components/film/Headline";
import { ReelMark } from "@/components/film/Marks";
import { PinnedScene } from "@/components/film/PinnedScene";
import { r } from "@/components/film/range";
import { Reveal } from "@/components/film/Reveal";
import { chapters, ears, fall, marwar, reasons, revival, title } from "@/lib/content/legend";
import { ease } from "@/lib/motion/tokens";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ T2 · Iris */

/** Title card · T2 iris. Signature: a circular iris opens on the dune as you scroll. */
export function LegendTitle() {
  return (
    <PinnedScene length={2} label="The land of death" reducedFallback={<IrisFrame open />}>
      {(p) => <IrisFrame progress={p} />}
    </PinnedScene>
  );
}

function IrisFrame({ progress, open = false }: { progress?: MotionValue<number>; open?: boolean }) {
  const { scrollYProgress } = useScroll();
  const p = progress ?? scrollYProgress;
  const radius = useTransform(p, r(0, 0.7), [open ? 150 : 14, 150]);
  const clip = useTransform(radius, (v) => `circle(${v}% at 50% 48%)`);
  const scale = useTransform(p, r(0, 1), [1.25, 1]);
  const textY = useTransform(p, r(0, 1), ["0%", "-12%"]);
  const ring = useTransform(radius, (v) => `${v * 2}vmax`);

  return (
    <div className={cn("relative h-full w-full bg-night", open && "min-h-[100svh]")}>
      <motion.div className="absolute inset-0" style={{ clipPath: open ? undefined : clip }}>
        <FilmImage name="duneSilhouette" priority scale={open ? 1 : scale} grade="film" />
        <div aria-hidden className="absolute inset-0 shade-b" />
      </motion.div>
      <motion.div aria-hidden className="pointer-events-none absolute left-1/2 top-[48%] aspect-square -translate-x-1/2 -translate-y-1/2 rounded-full border border-brass" style={{ width: ring }} />
      <motion.div className="gutter relative flex h-full min-h-[100svh] flex-col justify-end pb-[10vh]" style={{ y: textY }}>
        <ReelMark n={1} act="legend" />
        <Headline as="h1" size="poster" animate="mount" className="mt-6" inscription={title.inscription} voice={title.voice} />
        <p className="t-story mt-6 max-w-2xl text-sand">{title.sub}</p>
      </motion.div>
    </div>
  );
}

/* ------------------------------------------------------------------ S16 · Chapter rail */

/**
 * Sticky chapter index: ticks only, so it never sits on the copy. The chapter name appears as a chip on
 * hover or focus. The rail shows only while a chapter fills the middle of the screen (hidden on the title
 * card and the end card).
 */
export function ChapterRail() {
  const [active, setActive] = useState<string>(chapters[0].id);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const els = chapters.map((c) => document.getElementById(c.id)).filter(Boolean) as HTMLElement[];
    const current = new IntersectionObserver(
      (entries) => {
        const vis = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (vis[0]) setActive(vis[0].target.id);
      },
      { rootMargin: "-40% 0px -50% 0px" },
    );
    const inside = new Set<Element>();
    const shown = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => (e.isIntersecting ? inside.add(e.target) : inside.delete(e.target)));
        setVisible(inside.size > 0);
      },
      { rootMargin: "-45% 0px -45% 0px" },
    );
    els.forEach((el) => {
      current.observe(el);
      shown.observe(el);
    });
    return () => {
      current.disconnect();
      shown.disconnect();
    };
  }, []);

  return (
    <nav
      aria-label="Chapters"
      inert={!visible}
      className={cn(
        "no-print fixed left-0 top-1/2 z-40 hidden -translate-y-1/2 pl-[max(16px,1.6vw)] transition-opacity duration-700 xl:block",
        visible ? "opacity-100" : "pointer-events-none opacity-0",
      )}
    >
      <ol className="flex flex-col gap-1">
        {chapters.map((c) => (
          <li key={c.id}>
            <a
              href={`#${c.id}`}
              className="group relative flex h-3.5 items-center"
              aria-current={active === c.id ? "location" : undefined}
              aria-label={`Chapter ${c.numeral}: ${c.name}`}
            >
              <span className={cn("h-px transition-all duration-500", active === c.id ? "w-6 bg-gold" : "w-3 bg-brass group-hover:w-5 group-hover:bg-brass")} />
              <span
                aria-hidden
                className="label pointer-events-none absolute left-9 whitespace-nowrap bg-night/90 px-2 py-1 text-[0.6rem] text-gold opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100"
              >
                {c.numeral} · {c.name}
              </span>
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}

/** Chapter heading with roman numeral. */
export function ChapterHead({ id, className }: { id: string; className?: string }) {
  const c = chapters.find((x) => x.id === id)!;
  return (
    <p className={cn("label flex items-center gap-3 text-dust", className)}>
      <span className="t-inscribe text-base tracking-[0.1em] text-gold">{c.numeral}</span>
      <span aria-hidden className="h-px w-8 bg-brass" />
      {c.name}
    </p>
  );
}

/* ------------------------------------------------------------------ S17 · Route map */

/** Ch. II · route drawn from the river plains (east) across the Thar to Marwar (west) as you scroll. */
export function RouteMap() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const draw = useTransform(scrollYProgress, r(0.2, 0.6), [0, 1]);
  return (
    <section id="marwar" ref={ref} aria-labelledby="marwar-h" className="relative overflow-hidden">
      {/* The map. On phones the copy follows below it; from md up the copy sits over the foot of the map. */}
      <div className="relative h-[58svh] min-h-[360px] md:h-[90svh] md:min-h-[560px]">
        <FilmImage name="bgFort" grade="deep" />
        <div aria-hidden className="absolute inset-0 bg-gradient-to-b from-night via-night/30 to-night" />
        <svg viewBox="0 0 1000 400" preserveAspectRatio="none" className="absolute inset-x-0 top-[34%] h-[30%] w-full md:top-[38%]" aria-hidden>
          <motion.path
            d="M940 220 C 820 160, 760 260, 640 210 S 440 120, 330 200 S 140 250, 60 180"
            fill="none"
            stroke="var(--color-gold)"
            strokeWidth="2"
            strokeDasharray="1 0"
            style={{ pathLength: draw }}
          />
          <circle cx="940" cy="220" r="6" fill="var(--color-gold)" />
          <motion.circle cx="60" cy="180" r="7" fill="var(--color-gold)" style={{ opacity: draw }} />
        </svg>
        <span className="label absolute right-[4vw] top-[30%] text-gold md:top-[34%]">River plains</span>
        <span className="label absolute left-[44%] top-[29%] text-sand/80 md:top-[33%]">The Thar</span>
        <motion.span className="label absolute left-[4vw] top-[26%] text-gold md:top-[30%]" style={{ opacity: draw }}>
          Marwar
        </motion.span>
      </div>
      <div className="gutter relative grid gap-6 pb-16 md:absolute md:inset-x-0 md:bottom-0 md:grid-cols-[1fr_minmax(0,32rem)] md:items-end md:pb-[8vh]">
        <div>
          <ChapterHead id="marwar" />
          <Headline id="marwar-h" className="mt-4" inscription={marwar.inscription} voice={marwar.voice} />
        </div>
        <p className="text-sand">{marwar.body}</p>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ S19 · Scrub zoom */

/** Ch. IV · the camera pushes into the ear tips while four beats change. */
export function EarsZoom() {
  return (
    <PinnedScene id="ears" length={3.4} label="The ears" reducedFallback={<EarsStatic />}>
      {(p) => <EarsFrame progress={p} />}
    </PinnedScene>
  );
}

function EarsFrame({ progress }: { progress: MotionValue<number> }) {
  const scale = useTransform(progress, r(0, 1), [1, 1.7]);
  const y = useTransform(progress, r(0, 1), ["0%", "14%"]);
  const [beat, setBeat] = useState(0);
  useMotionValueEvent(progress, "change", (v) => setBeat(Math.min(ears.beats.length - 1, Math.floor(v * ears.beats.length * 0.999))));
  return (
    <div className="relative h-full">
      <FilmImage name="legendEars" scale={scale} y={y} position="50% 30%" bleed />
      <div aria-hidden className="absolute inset-0 shade-b" />
      <div aria-hidden className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_35%,transparent_30%,rgb(15_14_13/0.8)_80%)]" />
      <div className="gutter relative flex h-full flex-col justify-end pb-[10vh]">
        <ChapterHead id="ears" />
        <Headline className="mt-4" size="1" inscription={ears.inscription} voice={ears.voice} />
        <div className="relative mt-6 min-h-[6rem] max-w-xl">
          {ears.beats.map((b, i) => (
            <motion.p
              key={b}
              className={cn("t-story absolute inset-x-0 top-0", i === ears.beats.length - 1 ? "t-voice text-display-3 text-gold" : "text-bone")}
              animate={{ opacity: beat === i ? 1 : 0, y: beat === i ? 0 : beat > i ? -16 : 16 }}
              transition={{ duration: 0.6, ease: ease.citadel }}
              aria-hidden={beat !== i}
            >
              {b}
            </motion.p>
          ))}
        </div>
        <div className="mt-6 flex gap-2" aria-hidden>
          {ears.beats.map((_, i) => (
            <span key={i} className={cn("h-px w-10 transition-colors duration-500", i <= beat ? "bg-gold" : "bg-brass/25")} />
          ))}
        </div>
      </div>
    </div>
  );
}

function EarsStatic() {
  return (
    <div className="relative min-h-[100svh]">
      <FilmImage name="legendEars" position="50% 30%" />
      <div aria-hidden className="absolute inset-0 shade-b" />
      <div className="gutter relative flex min-h-[100svh] flex-col justify-end gap-4 pb-16">
        <ChapterHead id="ears" />
        <Headline size="1" inscription={ears.inscription} voice={ears.voice} />
        {ears.beats.map((b) => (
          <p key={b} className="max-w-xl text-bone">
            {b}
          </p>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ S21 · Three words */

/** Ch. VI · Victory. Death. Or carrying its rider home. */
export function ThreeWords() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.45 });
  return (
    <section id="reasons" aria-label="Three reasons" className="relative overflow-hidden py-[clamp(6rem,16vh,14rem)]">
      <FilmImage name="legendCavalry" grade="deep" className="opacity-60" />
      <div aria-hidden className="absolute inset-0 bg-gradient-to-b from-night via-night/40 to-night" />
      <div className="gutter relative">
        <ChapterHead id="reasons" />
        <Reveal>
          <p className="t-story mt-6 max-w-2xl text-sand">{reasons.lead}</p>
        </Reveal>
        <div ref={ref} className="mt-12 flex flex-col">
          {reasons.words.map((w, i) => (
            <span key={w} className="block overflow-hidden">
              <motion.span
                className={cn(
                  "block leading-[0.95]",
                  i === 2 ? "t-voice text-display-2 text-gold" : "t-inscribe text-[clamp(2.2rem,10vw,12.5rem)]",
                  i === 1 && "text-dust",
                )}
                initial={{ y: "110%" }}
                animate={inView ? { y: "0%" } : {}}
                transition={{ duration: 1.2, ease: ease.citadel, delay: 0.2 + i * 0.6 }}
              >
                {w}
              </motion.span>
            </span>
          ))}
        </div>
        <Reveal delay={0.3}>
          <p className="mt-10 max-w-xl text-sand">{reasons.tail}</p>
        </Reveal>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ S23 · Descent */

/** Ch. IX · each line drops in lower than the last while the picture drains to grey. */
export function Descent() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const gray = useTransform(scrollYProgress, r(0.15, 0.7), ["grayscale(0) brightness(0.8)", "grayscale(1) brightness(0.45)"]);
  return (
    <section id="fall" ref={ref} aria-labelledby="fall-h" className="relative overflow-hidden py-[clamp(6rem,14vh,12rem)]">
      <div className="absolute inset-0">
        <FilmImage name="legendFall" grade="mono" filter={gray} className="opacity-50" />
        <div aria-hidden className="absolute inset-0 bg-gradient-to-r from-night via-night/80 to-night/40" />
      </div>
      <div className="gutter relative">
        <ChapterHead id="fall" />
        <Headline id="fall-h" className="mt-4" inscription={fall.inscription} voice={fall.voice} voiceColor="sand" />
        <ol className="mt-14 flex max-w-3xl flex-col gap-10">
          {fall.lines.map((l, i) => (
            <Reveal key={i} as="li" y={-24} className="grid grid-cols-[3rem_1fr] gap-4" delay={0.05}>
              <span className="font-mono pt-1 text-xs text-dust">{String(i + 1).padStart(2, "0")}</span>
              <p className={cn("text-lede", i === fall.lines.length - 1 ? "text-bone" : "text-sand/90")} style={{ marginLeft: `${i * 2.2}%` }}>
                {l}
              </p>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ S24 · Ascent timeline */

/** Ch. X · milestones climb a rising line. */
export function Ascent() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.3 });
  const n = revival.milestones.length;
  const pts = revival.milestones.map((_, i) => [40 + (i * 920) / (n - 1), 300 - (i * 250) / (n - 1)] as const);
  const d = pts.map(([x, y], i) => `${i ? "L" : "M"}${x} ${y}`).join(" ");
  return (
    <div ref={ref}>
      <div className="relative hidden md:block" style={{ aspectRatio: "1000 / 340" }}>
        <svg viewBox="0 0 1000 340" className="absolute inset-0 h-full w-full" aria-hidden>
          <line x1="40" x2="960" y1="320" y2="320" stroke="rgb(89 56 34 / 0.62)" />
          <motion.path d={d} fill="none" stroke="var(--color-gold)" strokeWidth="1.6" initial={{ pathLength: 0 }} animate={inView ? { pathLength: 1 } : {}} transition={{ duration: 2.4, ease: ease.citadel }} />
          {pts.map(([x, y], i) => (
            <motion.circle key={i} cx={x} cy={y} r="5" fill="var(--color-gold)" initial={{ scale: 0 }} animate={inView ? { scale: 1 } : {}} transition={{ delay: 0.3 + i * 0.35, duration: 0.5 }} />
          ))}
        </svg>
        {pts.map(([x, y], i) => (
          <motion.div
            key={i}
            className="absolute w-[15%] -translate-x-1/2 text-center"
            style={{ left: `${x / 10}%`, top: `${(y / 340) * 100}%` }}
            initial={{ opacity: 0, y: 10 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.4 + i * 0.35, duration: 0.6 }}
          >
            <p className="font-mono mt-4 text-sm text-gold">{revival.milestones[i].year}</p>
          </motion.div>
        ))}
      </div>
      <ol className="mt-6 grid gap-8 md:grid-cols-3 lg:grid-cols-6 lg:gap-6">
        {revival.milestones.map((m) => (
          <Reveal as="li" key={m.year} className="border-t border-brass pt-4">
            <p className="font-mono text-sm text-gold md:hidden">{m.year}</p>
            <p className="mt-1 text-sm leading-relaxed text-sand">{m.text}</p>
          </Reveal>
        ))}
      </ol>
    </div>
  );
}
