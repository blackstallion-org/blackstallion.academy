"use client";

import { ScrollRevealText } from "@/components/motion/ScrollRevealText";

import { motion, useInView, useMotionValueEvent, useScroll, useTransform, type MotionValue } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { EditorialImage } from "@/components/motion/EditorialMotion";
import { FilmImage } from "@/components/film/FilmImage";
import { EditorialHeadline as Headline } from "@/components/motion/EditorialMotion";
import { ReelMark } from "@/components/film/Marks";
import { PinnedScene } from "@/components/film/PinnedScene";
import { r } from "@/components/film/range";
import { EditorialReveal as Reveal } from "@/components/motion/EditorialMotion";
import { chapters, ears, fall, marwar, reasons, revival, title } from "@/lib/content/legend";
import { ease } from "@/lib/motion/tokens";
import { useReducedMotion } from "@/lib/motion/reduced";
import { whenNearViewport } from "@/lib/motion/near-viewport";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ T2 · Iris */

/** Title card · T2 iris. Signature: a circular iris opens on the dune as you scroll. */
export function LegendTitle() {
  return (
    <>
      <PinnedScene length={2} label="The land of death" reducedFallback={<IrisFrame open />}>
        {(p) => <IrisFrame progress={p} />}
      </PinnedScene>
      <div className="tone-light editorial-details gutter">
        <ReelMark n={1} act="legend" />
        <ScrollRevealText className="t-story text-sand">{title.sub}</ScrollRevealText>
      </div>
    </>
  );
}

function IrisFrame({ progress, open = false }: { progress?: MotionValue<number>; open?: boolean }) {
  const { scrollYProgress } = useScroll();
  const p = progress ?? scrollYProgress;
  const textY = useTransform(p, r(0, 1), ["0%", "-10%"]);

  return (
    <div className="tone-dark relative h-full w-full min-h-[100svh] bg-night overflow-hidden">
      <div className="absolute inset-0">
        <EditorialImage><FilmImage name="duneSilhouette" priority scale={1} grade="none" /></EditorialImage>
      </div>
      <motion.div className="gutter relative flex h-full min-h-[100svh] flex-col justify-end pb-[clamp(7rem,20svh,14rem)] max-sm:pb-[28svh]" style={open ? undefined : { y: textY }}>
        <Headline as="h1" size="poster" animate="mount" className="mt-6 max-w-[12ch] [text-shadow:0_3px_15px_rgba(0,0,0,0.65)]" inscription={title.inscription} voice={title.voice} />

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
              <span className={cn("h-px transition-all duration-500", active === c.id ? "w-6 bg-gold" : "w-3 bg-line group-hover:w-5 group-hover:bg-line")} />
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
    <p className={cn("label flex items-center gap-3 text-brass", className)}>
      <span className="t-inscribe text-base tracking-[0.1em] text-gold">{c.numeral}</span>
      <span aria-hidden className="h-px w-8 bg-line" />
      {c.name}
    </p>
  );
}

/* ------------------------------------------------------------------ S17 · Route map */

/** Ch. II · route drawn from the river plains (east) across the Thar to Marwar (west) as you scroll. */
export function RouteMap() {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const draw = useTransform(scrollYProgress, r(0.2, 0.6), [0, 1]);
  return (
    <section id="marwar" ref={ref} aria-labelledby="marwar-h" className="relative min-h-[100svh] overflow-hidden">
      {/* The map. Full screen clear view without gradient washes. */}
      <div className="relative h-[100svh] min-h-[600px] w-full">
        <EditorialImage><FilmImage name="bgFort" grade="none" /></EditorialImage>
        <svg viewBox="0 0 1000 400" preserveAspectRatio="none" className="absolute inset-x-0 top-[34%] h-[30%] w-full md:top-[38%]" aria-hidden>
          <motion.path
            d="M940 220 C 820 160, 760 260, 640 210 S 440 120, 330 200 S 140 250, 60 180"
            fill="none"
            stroke="var(--color-gold)"
            strokeWidth="2"
            strokeDasharray="1 0"
            style={{ pathLength: reduced ? 1 : draw }}
          />
          <circle cx="940" cy="220" r="6" fill="var(--color-gold)" />
          <motion.circle cx="60" cy="180" r="7" fill="var(--color-gold)" style={{ opacity: reduced ? 1 : draw }} />
        </svg>
        <span className="label absolute right-[4vw] top-[30%] text-gold md:top-[34%] bg-night px-3 py-2">River plains</span>
        <span className="label absolute left-[44%] top-[29%] text-sand/80 md:top-[33%] bg-night px-3 py-2">The Thar</span>
        <motion.span className="label absolute left-[4vw] top-[26%] text-gold md:top-[30%] bg-night px-3 py-2" style={{ opacity: reduced ? 1 : draw }}>
          Marwar
        </motion.span>
      </div>
      <div className="gutter relative grid gap-6 py-12 lg:grid-cols-[1fr_minmax(0,38rem)] lg:items-start">
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
  const [beat, setBeat] = useState(0);
  useMotionValueEvent(progress, "change", (v) => setBeat(Math.min(ears.beats.length - 1, Math.floor(v * ears.beats.length * 0.999))));
  return (
    <div className="relative grid h-full grid-rows-[minmax(0,1fr)_auto]">
      <div className="tone-dark relative min-h-0 overflow-hidden">
        <FilmImage name="legendEars" scale={1} y="0%" position="50% 30%" bleed grade="none" />
        <div className="gutter absolute inset-x-0 bottom-8"><Headline size="1" inscription={ears.inscription} voice={ears.voice} /></div>
      </div>
      <div className="tone-light gutter relative bg-night py-6">
        <ChapterHead id="ears" />
        <div className="relative mt-4 min-h-[6.5rem] max-w-2xl">
          {ears.beats.map((b, i) => (
            <motion.p key={b} className={cn("absolute inset-x-0 top-0 text-lg leading-relaxed", i === ears.beats.length - 1 ? "t-voice text-gold" : "text-sand")}
              animate={{ opacity: beat === i ? 1 : 0, y: beat === i ? 0 : beat > i ? -16 : 16 }}
              transition={{ duration: 0.6, ease: ease.citadel }} aria-hidden={beat !== i}>{b}</motion.p>
          ))}
        </div>
        <div className="flex gap-2" aria-hidden>{ears.beats.map((_, i) => <span key={i} className={cn("h-px w-10 transition-colors duration-500", i <= beat ? "bg-gold" : "bg-line")} />)}</div>
      </div>
    </div>
  );
}

function EarsStatic() {
  return (
    <div>
      <div className="tone-dark relative h-[65svh] min-h-[360px] overflow-hidden">
        <FilmImage name="legendEars" position="50% 30%" grade="none" />
        <div className="gutter absolute inset-x-0 bottom-8"><Headline size="1" inscription={ears.inscription} voice={ears.voice} /></div>
      </div>
      <div className="tone-light editorial-details gutter"><ChapterHead id="ears" />{ears.beats.map((b) => <p key={b} className="text-sand">{b}</p>)}</div>
    </div>
  );
}

/* ------------------------------------------------------------------ S21 · Three words */

/** Ch. VI · Victory. Death. Or carrying its rider home. */
export function ThreeWords() {
  return (
    <section id="reasons" aria-label="Three reasons" className="editorial-scene">
      <div className="tone-dark editorial-photo-title">
        <FilmImage name="legendCavalry" grade="none" />
        <div className="gutter">
          <div className="flex flex-col gap-5 md:gap-8">
            {reasons.words.map((w, i) => (
              <Reveal key={w} y={36} delay={i * 0.12}
                className={cn("leading-[1.05]", i === 2 ? "t-voice max-w-[16ch] text-[clamp(2.2rem,5vw,6rem)] text-bone" : "t-inscribe text-[clamp(3rem,10vw,12.5rem)] text-bone")}
              >{w}</Reveal>
            ))}
          </div>
        </div>
      </div>
      <div className="tone-light editorial-details gutter">
        <ChapterHead id="reasons" />
        <Reveal><ScrollRevealText className="t-story text-bone">{reasons.lead}</ScrollRevealText></Reveal>
        <Reveal delay={0.3}><p className="text-sand">{reasons.tail}</p></Reveal>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ S23 · Descent */

/** Ch. IX · each line drops in lower than the last while the picture drains to grey. */
export function Descent() {
  const ref = useRef<HTMLElement>(null);
  return (
    <section id="fall" ref={ref} aria-labelledby="fall-h" className="editorial-scene">
      <div className="tone-dark editorial-photo-title">
      <div className="absolute inset-0">
        <EditorialImage><FilmImage name="legendFall" grade="none" className="opacity-100" /></EditorialImage>
      </div>
      <div className="gutter relative">
        <ChapterHead id="fall" />
        <Headline id="fall-h" className="mt-4" inscription={fall.inscription} voice={fall.voice} voiceColor="sand" />

      </div>
      </div>
      <div className="tone-light editorial-reading gutter">        <ol className="mt-0 flex max-w-3xl flex-col gap-10">
          {fall.lines.map((l, i) => (
            <Reveal key={i} as="li" y={-24} className="grid grid-cols-[3rem_1fr] gap-4" delay={0.05}>
              <span className="font-mono pt-1 text-xs text-dust">{String(i + 1).padStart(2, "0")}</span>
              <p className={cn("text-lede", i === fall.lines.length - 1 ? "text-bone" : "text-sand/90")} style={{ marginLeft: `${i * 2.2}%` }}>
                {l}
              </p>
            </Reveal>
          ))}
        </ol></div>
    </section>
  );
}

/* ------------------------------------------------------------------ S24 · Ascent timeline */

/** Ch. X · milestones climb a rising line. */
export function Ascent() {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.3 });
  const n = revival.milestones.length;
  const pts = revival.milestones.map((_, i) => [40 + (i * 920) / (n - 1), 300 - (i * 250) / (n - 1)] as const);
  const d = pts.map(([x, y], i) => `${i ? "L" : "M"}${x} ${y}`).join(" ");
  return (
    <div ref={ref}>
      <div className="relative hidden md:block" style={{ aspectRatio: "1000 / 340" }}>
        <svg viewBox="0 0 1000 340" className="absolute inset-0 h-full w-full" aria-hidden>
          <line x1="40" x2="960" y1="320" y2="320" stroke="color-mix(in srgb, var(--color-brass) 25%, transparent)" />
          <motion.path d={d} fill="none" stroke="var(--color-gold)" strokeWidth="1.6" initial={false} animate={{ pathLength: reduced || inView ? 1 : 0 }} transition={{ duration: reduced ? 0 : 2.4, ease: ease.citadel }} />
          {pts.map(([x, y], i) => (
            <motion.circle key={i} cx={x} cy={y} r="5" fill="var(--color-gold)" initial={false} animate={{ scale: reduced || inView ? 1 : 0 }} transition={{ delay: reduced ? 0 : 0.3 + i * 0.35, duration: reduced ? 0 : 0.5 }} />
          ))}
        </svg>
        {pts.map(([x, y], i) => (
          <motion.div
            key={i}
            className="absolute w-[15%] -translate-x-1/2 text-center"
            style={{ left: `${x / 10}%`, top: `${(y / 340) * 100}%` }}
            initial={false}
            animate={{ y: reduced || inView ? 0 : 10 }}
            transition={{ delay: reduced ? 0 : 0.4 + i * 0.35, duration: reduced ? 0 : 0.6 }}
          >
            <p className="font-mono mt-4 text-sm text-gold">{revival.milestones[i].year}</p>
          </motion.div>
        ))}
      </div>
      <ol className="mt-6 grid gap-8 md:grid-cols-3 lg:grid-cols-6 lg:gap-6">
        {revival.milestones.map((m) => (
          <Reveal as="li" key={m.year} className="border-t border-line pt-4">
            <p className="font-mono text-sm text-gold md:hidden">{m.year}</p>
            <p className="mt-1 text-sm leading-relaxed text-sand">{m.text}</p>
          </Reveal>
        ))}
      </ol>
    </div>
  );
}

/** Full-bleed Thar Gallop Cinema Reel · Golden hour stallion gallop */
export function TharGallopReel() {
  // The reel used to autoplay (and download) with the page. It now starts buffering one screen before it is reached
  // and plays while on screen, as before; offscreen it pauses instead of decoding unseen frames.
  const videoRef = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const cancel = whenNearViewport(video, () => { video.preload = "auto"; });
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) video.play().catch(() => {});
      else video.pause();
    });
    observer.observe(video);
    return () => { cancel(); observer.disconnect(); };
  }, []);
  return (
    <section aria-label="The Sovereign Gallop across the Thar" className="relative w-full overflow-hidden bg-[#0A0908] tone-dark border-y border-line/30">
      <div className="relative aspect-[16/9] lg:aspect-[21/9] w-full min-h-[460px] lg:min-h-[620px] overflow-hidden">
        <video
          ref={videoRef}
          src="https://d8j0ntlcm91z4.cloudfront.net/user_3KHOl32PLtCsaNMEkJTP0HHT06X/hf_20261009_002919_571f23fa-14a9-4d0b-bbe3-19f4311054d8.mp4"
          loop
          muted
          playsInline
          preload="none"
          className="h-full w-full object-cover"
        />
        <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-night via-night/35 to-transparent pointer-events-none" />
        <div aria-hidden className="absolute inset-0 bg-gradient-to-b from-night/40 via-transparent to-transparent pointer-events-none" />

        <div className="gutter absolute inset-0 flex flex-col justify-end pb-10 sm:pb-14 z-10 pointer-events-none">
          <div className="max-w-2xl">
            <span className="font-mono text-[0.68rem] uppercase tracking-[0.22em] text-gold font-bold block mb-2">
              Field Dispatch · Cinema Reel
            </span>
            <h2 className="t-voice text-3xl sm:text-4xl lg:text-5xl text-bone font-light tracking-tight m-0 [text-shadow:0_3px_15px_rgba(0,0,0,0.85)]">
              The Sovereign Gallop across the Thar
            </h2>
            <p className="t-story mt-3 text-sand text-sm sm:text-base max-w-xl leading-relaxed [text-shadow:0_2px_10px_rgba(0,0,0,0.7)]">
              A purebred Marwari stallion at full gallop in Rajasthan. Eight hundred years of desert agility captured in golden hour dust.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
