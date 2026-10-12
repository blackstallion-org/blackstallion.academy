"use client";

import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion, useScroll, useTransform } from "motion/react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { FilmImage } from "@/components/film/FilmImage";
import { r } from "@/components/film/range";
import { LOCAL_MEDIA, mediaSrc, type MediaKey } from "@/lib/content/media";
import { cinematic } from "@/lib/motion/cinematic";
import { useReducedMotion } from "@/lib/motion/reduced";
import { ease } from "@/lib/motion/tokens";
import { cn } from "@/lib/utils";

export type Destination = {
  id: string;
  href: string;
  /** Oversized word that travels behind the rider (decorative; the full name is in the list). */
  title: string;
  /** Full accessible name. */
  name: string;
  /** One line of context: tier, stallions. */
  meta: string;
  image: MediaKey;
  position?: string;
};

type LayeredMarqueeProps = {
  id?: string;
  labelledBy: string;
  destinations: Destination[];
  /** A transparent cut-out (horse and rider) that stands in front of the title. */
  foreground: MediaKey;
  /** Heading block (reel mark, h1, one line, CTA). */
  heading: ReactNode;
  listLabel: string;
};

const pad = (n: number) => String(n + 1).padStart(2, "0");

/**
 * Signature move for the hubs: four layers.
 * 1 the active destination's photograph (crossfades), 2 its name set enormous and drifting sideways,
 * 3 a horse and rider cut-out standing in front of the name, 4 the interface.
 * Destinations rotate every few seconds; hovering or focusing one selects it and holds the rotation,
 * and a pause control stops it for good. Reduced motion: no rotation, drift or parallax.
 */
export function LayeredMarquee({ id, labelledBy, destinations, foreground, heading, listLabel }: LayeredMarqueeProps) {
  const reduced = useReducedMotion();
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [holding, setHolding] = useState(false);
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const bgY = useTransform(scrollYProgress, r(0, 1), ["0%", "14%"]);
  const titleY = useTransform(scrollYProgress, r(0, 1), ["0%", "-10%"]);
  const fgY = useTransform(scrollYProgress, r(0, 1), ["0%", "-22%"]);

  const rotating = !reduced && !paused && !holding && destinations.length > 1;

  useEffect(() => {
    if (!rotating) return;
    let t = window.setTimeout(function tick() {
      if (!document.hidden) setActive((a) => (a + 1) % destinations.length);
      t = window.setTimeout(tick, cinematic.dwell);
    }, cinematic.dwell);
    return () => window.clearTimeout(t);
  }, [rotating, destinations.length, active]);

  const d = destinations[active];

  return (
    <section ref={ref} id={id} aria-labelledby={labelledBy} className="tone-dark relative min-h-[100svh] overflow-hidden bg-night lg:h-[100svh] lg:min-h-[640px]">
      {/* 1 · background */}
      <motion.div className="absolute -inset-y-[8%] inset-x-0" style={reduced ? undefined : { y: bgY }}>
        <AnimatePresence initial={false}>
          <motion.div
            key={d.id}
            className="absolute inset-0"
            initial={{ opacity: 0, scale: 1.06 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: cinematic.crossfade, ease: ease.citadel }}
          >
            <FilmImage name={d.image} priority={active === 0} grade="deep" position={d.position} />
          </motion.div>
        </AnimatePresence>
      </motion.div>
      <div aria-hidden className="absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-night/75 to-transparent" />
      <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-night via-night/30 to-transparent" />

      {/* 2 · the oversized name, behind the rider */}
      <motion.div aria-hidden className="pointer-events-none absolute inset-x-0 top-[9%] md:top-[14%]" style={reduced ? undefined : { y: titleY }}>
        <AnimatePresence initial={false}>
          <motion.div
            key={d.id}
            className="absolute inset-x-0 top-0 overflow-hidden"
            initial={{ x: "22%", opacity: 0 }}
            animate={{ x: "0%", opacity: 1 }}
            exit={{ x: "-22%", opacity: 0 }}
            transition={{ duration: 1.2, ease: ease.inOut }}
          >
            <div className={cn("flex w-max", !reduced && "animate-marquee")}>
              {[0, 1].map((k) => (
                <span key={k} className="t-inscribe whitespace-nowrap pr-[0.4em] text-[clamp(3.5rem,16vw,17rem)] leading-[0.9] text-bone/80 [font-weight:300]">
                  {d.title} ·&nbsp;{d.title} ·&nbsp;
                </span>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>
      </motion.div>

      {/* 3 · the rider */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute bottom-0 right-[-22%] aspect-[1856/2304] h-[58svh] sm:right-[-6%] md:h-[74svh] lg:left-1/2 lg:right-auto lg:h-[86svh] lg:-translate-x-[42%]"
        style={reduced ? undefined : { y: fgY }}
        initial={{ opacity: 0, x: -24 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 1.6, ease: ease.citadel, delay: 0.4 }}
      >
        <Cutout name={foreground} />
      </motion.div>

      {/* On narrow screens the list sits over the rider's legs: let them fall into shadow there */}
      <div aria-hidden className="absolute inset-x-0 bottom-0 h-[55%] bg-gradient-to-t from-night via-night/75 to-transparent lg:hidden" />

      {/* 4 · interface */}
      <div className="gutter relative z-10 flex min-h-[100svh] flex-col justify-end gap-8 pb-[max(2rem,env(safe-area-inset-bottom))] pt-40 lg:grid lg:h-full lg:min-h-0 lg:grid-cols-[minmax(0,28rem)_1fr_minmax(0,25rem)] lg:items-end lg:gap-10 lg:pb-[8vh]">
          <div className="max-w-md">{heading}</div>
          <div aria-hidden className="hidden lg:block" />
          <div onMouseEnter={() => setHolding(true)} onMouseLeave={() => setHolding(false)} onFocus={() => setHolding(true)} onBlur={() => setHolding(false)}>
            <div className="flex items-center justify-between gap-4">
              <p className="label text-brass">{listLabel}</p>
              {!reduced && destinations.length > 1 && (
                <button
                  type="button"
                  onClick={() => setPaused((v) => !v)}
                  aria-pressed={paused}
                  className="label text-dust hover:text-gold"
                  aria-label={paused ? "Resume the hub rotation" : "Pause the hub rotation"}
                >
                  {paused ? "Play" : "Pause"}
                </button>
              )}
            </div>
            <ul className="mt-3 border-t border-line">
              {destinations.map((x, i) => {
                const on = i === active;
                return (
                  <li key={x.id}>
                    <Link
                      href={x.href}
                      aria-current={on ? "true" : undefined}
                      onMouseEnter={() => setActive(i)}
                      onFocus={() => setActive(i)}
                      className="group relative grid grid-cols-[2rem_1fr_auto] items-baseline gap-3 border-b border-line py-3.5"
                    >
                      <span className={cn("font-mono text-xs transition-colors", on ? "text-gold" : "text-dust")}>{pad(i)}</span>
                      <span>
                        <span className={cn("t-voice block text-base leading-snug transition-colors sm:text-lg md:text-xl", on ? "text-gold" : "text-bone group-hover:text-gold")}>{x.name}</span>
                        <span className="t-ui mt-0.5 hidden text-sm text-dust sm:block">{x.meta}</span>
                      </span>
                      <span aria-hidden className={cn("text-gold transition-transform", on ? "translate-x-0 opacity-100" : "-translate-x-1 opacity-50")}>→</span>
                      {on && rotating && (
                        <span key={`${x.id}-${active}`} aria-hidden className="absolute bottom-[-1px] left-0 h-px bg-gold motion-safe:animate-[dwell_7s_linear_forwards]" />
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
      </div>
    </section>
  );
}

/** A transparent PNG cut-out, contained and bottom-aligned. Hidden if the file is missing. */
function Cutout({ name }: { name: MediaKey }) {
  const [missing, setMissing] = useState(false);
  const src = mediaSrc(name);
  if (!src || missing) return null;
  return (
    <Image
      src={src}
      alt=""
      fill
      sizes="(min-width: 1024px) 45vw, 70vw"
      unoptimized={!LOCAL_MEDIA}
      onError={() => setMissing(true)}
      className="object-contain object-bottom [filter:drop-shadow(0_30px_40px_rgb(0_0_0/0.55))_saturate(0.9)]"
    />
  );
}
