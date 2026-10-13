"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { FilmImage } from "@/components/film/FilmImage";
import { Arrow, Label } from "@/components/film/Marks";
import type { MediaKey } from "@/lib/content/media";
import { cn } from "@/lib/utils";

/* ================= 5 Legend Frames Data ================= */
interface LegendFrame {
  id: string;
  num: string;
  numeral: string;
  kicker: string;
  headline: string;
  story: string;
  image: MediaKey;
  tag: string;
  year: string;
  hasCta?: boolean;
}

const FRAMES: LegendFrame[] = [
  {
    id: "bloodline",
    num: "01",
    numeral: "I",
    kicker: "One bloodline",
    headline: "Eight hundred years in one bloodline.",
    story:
      "For centuries, civilisation was shaped by the partnership between horse and rider. In the Thar Desert that partnership bred a horse unlike any other.",
    image: "legendSand",
    tag: "ORIGIN · THAR BASIN",
    year: "1193",
  },
  {
    id: "terrain",
    num: "02",
    numeral: "II",
    kicker: "Marwar, the Thar",
    headline: "Bred by terrain, not ideology.",
    story:
      "Driven onto the arid plains of the Thar, the horsemen of Marwar survived on endurance. Their horses learned to live on a cup of desert water and outrun the wind.",
    image: "bgFort",
    tag: "TERRAIN · ADAPTATION",
    year: "1350",
  },
  {
    id: "vow",
    num: "03",
    numeral: "III",
    kicker: "The vow",
    headline: "Victory, death, or carrying the rider home.",
    story:
      "A Marwari left the battlefield in only three ways: in victory, in death, or carrying its wounded rider home. The ancient vow of loyalty that never broke.",
    image: "legendCavalry",
    tag: "CAVALRY · THE VOW",
    year: "1576",
  },
  {
    id: "revival",
    num: "04",
    numeral: "IV",
    kicker: "Nearly lost",
    headline: "The line that refused to vanish.",
    story:
      "After 1947 the royal stables emptied. Horses were sold, castrated, and scattered. A few passionate breeders refused to let eight centuries of blood end.",
    image: "legendRevival",
    tag: "REVIVAL · 1947–TODAY",
    year: "1947",
  },
  {
    id: "mark",
    num: "05",
    numeral: "V",
    kicker: "The mark",
    headline: "Their ears curl inward until the tips touch.",
    story:
      "Rotating 180 degrees independently, that is how you know the blood is pure. The inward lyre seal that no mixed breeding can ever imitate.",
    image: "legendEars",
    tag: "THE SEAL · PUREBRED MARWARI",
    year: "2026",
    hasCta: true,
  },
];

/* ================= Animation Physics Constants ================= */
// Fluid expo deceleration curve matching Sandhill Studio / Apple motion physics
const FLUID_EASING = [0.16, 1, 0.3, 1] as const;
const TRANSITION_DURATION = 1.2; // 1.2s fluid duration
const AUTOPLAY_INTERVAL = 7000; // 7s autoplay per slide

/**
 * Sandhill Studio-style 3D Receding Depth & Scale Accordion Hero Slider.
 * Self-contained component replacing the horizontal story strip.
 *
 * Choreography:
 * 1. 3D Receding Exit: Outgoing image scales down to scale(0.85) / translateZ(-150px)
 *    and dims as its container width shrinks into the side column.
 * 2. Incoming Image Forward Expansion: Queued card expands to dominant stage while its
 *    inner image scales down from scale(1.2) to scale(1.0) stepping forward into the scene.
 * 3. Inner Scale Compensation: w-[65vw] fixed wrapper with overflow: hidden prevents squishing.
 * 4. Kinetic Typography: Outgoing headline scales down (0.92) & shifts left/up (x: -24, y: -18);
 *    incoming title scales up (0.92 -> 1.0) and rises (y: 28 -> 0).
 */
export function StoryStrip() {
  const [activeIdx, setActiveIdx] = useState(0);
  const [prevIdx, setPrevIdx] = useState<number | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const transitionTimerRef = useRef<NodeJS.Timeout | null>(null);
  const autoplayTimerRef = useRef<NodeJS.Timeout | null>(null);

  const total = FRAMES.length;
  const cur = FRAMES[activeIdx];

  const changeSlide = useCallback(
    (newIdx: number) => {
      if (newIdx === activeIdx) return;
      setPrevIdx(activeIdx);
      setActiveIdx(newIdx);
      setIsTransitioning(true);

      if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current);
      transitionTimerRef.current = setTimeout(() => {
        setIsTransitioning(false);
      }, 1250);
    },
    [activeIdx]
  );

  const nextSlide = useCallback(() => {
    changeSlide((activeIdx + 1) % total);
  }, [activeIdx, total, changeSlide]);

  const prevSlide = useCallback(() => {
    changeSlide((activeIdx - 1 + total) % total);
  }, [activeIdx, total, changeSlide]);

  // Autoplay timer
  useEffect(() => {
    if (isPaused) return;
    autoplayTimerRef.current = setInterval(nextSlide, AUTOPLAY_INTERVAL);
    return () => {
      if (autoplayTimerRef.current) clearInterval(autoplayTimerRef.current);
    };
  }, [nextSlide, isPaused]);

  // Clean up transition timer on unmount
  useEffect(() => {
    return () => {
      if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current);
    };
  }, []);

  return (
    <section
      id="hero-slider"
      aria-label="The Legend in Five Frames"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className="relative w-full h-[100svh] min-h-[680px] max-h-[1100px] overflow-hidden bg-[#0F0E0D] text-[#FAF7F0] isolate select-none border-b border-gold/20"
    >
      {/* ================= Pinned Top Chrome ================= */}
      <header className="pointer-events-none absolute left-0 right-0 top-0 z-30 flex items-start justify-between px-[clamp(18px,3vw,44px)] pt-[clamp(20px,3.2vh,40px)]">
        <div>
          <div className="flex items-center gap-3">
            <Label reel={1} className="text-gold">
              The Legend
            </Label>
            <span className="font-mono text-[0.62rem] uppercase tracking-widest text-sand/60">
              Reel 01 · Sandhill Studio Style
            </span>
          </div>
          <h2 className="font-serif text-[clamp(1.2rem,2vw,1.8rem)] text-bone tracking-tight mt-1 m-0">
            Eight hundred years in one bloodline.
          </h2>
        </div>

        {/* Pinned Output Sign / Studio Badge */}
        <div className="pointer-events-auto flex items-center gap-4">
          <div className="hidden sm:flex flex-col items-end text-right">
            <span className="font-mono text-[0.72rem] tracking-[0.2em] uppercase text-gold font-bold">
              FRAME {cur.num} / {String(total).padStart(2, "0")}
            </span>
            <span className="font-mono text-[0.6rem] tracking-[0.14em] uppercase text-sand/60">
              {cur.tag}
            </span>
          </div>

          <div
            className="flex h-11 w-11 items-center justify-center rounded-full border border-gold/40 bg-black/60 backdrop-blur-md text-gold shadow-lg"
            title="BSAH Studio Archive Output Sign"
          >
            <span className="font-serif text-sm font-bold tracking-tight">N&apos;</span>
          </div>
        </div>
      </header>

      {/* ================= Desktop / Tablet Accordion Layout ================= */}
      <div
        className="hidden md:flex h-full w-full"
        style={{ perspective: "1400px", transformStyle: "preserve-3d" }}
      >
        {FRAMES.map((frame, idx) => {
          const isActive = idx === activeIdx;
          const isPrevious = idx === prevIdx && isTransitioning;

          return (
            <div
              key={frame.id}
              onClick={() => changeSlide(idx)}
              style={{
                flex: isActive ? "6.2 1 0%" : "1 1 0%",
                transition: `flex ${TRANSITION_DURATION}s cubic-bezier(0.16, 1, 0.3, 1)`,
                transformStyle: "preserve-3d",
              }}
              className={cn(
                "relative h-full overflow-hidden border-r border-gold/20 will-change-[flex,transform]",
                isActive
                  ? "cursor-default"
                  : "cursor-pointer bg-[#141210]"
              )}
            >
              {/* Inner Image Wrapper with Scale Compensation & 3D Receding Depth */}
              <motion.div
                animate={{
                  scale: isActive ? 1.0 : isPrevious ? 0.85 : 1.2,
                  z: isActive ? 0 : isPrevious ? -150 : -60,
                  filter: isActive
                    ? "brightness(1) contrast(1.02)"
                    : "brightness(0.95) contrast(1.02)",
                }}
                transition={{
                  duration: TRANSITION_DURATION,
                  ease: FLUID_EASING,
                }}
                style={{
                  transformStyle: "preserve-3d",
                }}
                className="absolute top-0 bottom-0 h-full w-[65vw] min-w-[720px] left-1/2 -translate-x-1/2 pointer-events-none will-change-transform"
              >
                <FilmImage
                  name={frame.image}
                  sizes={isActive ? "(min-width: 1024px) 65vw, 100vw" : "15vw"}
                  priority={idx === 0}
                  className="h-full w-full object-cover"
                />
              </motion.div>

              {/* Atmospheric Luxury Gradients */}
              <div
                aria-hidden
                className={cn(
                  "pointer-events-none absolute inset-0 transition-opacity duration-1000",
                  isActive
                    ? "bg-gradient-to-t from-[#0F0E0D] via-[#0F0E0D]/30 to-transparent"
                    : "bg-gradient-to-t from-black/60 via-transparent to-transparent"
                )}
              />

              {/* Inactive Panel Preview Slivers (Vertical Editorial Typography) */}
              <motion.div
                animate={{
                  opacity: isActive ? 0 : 1,
                  pointerEvents: isActive ? "none" : "auto",
                }}
                transition={{
                  duration: 0.6,
                  ease: FLUID_EASING,
                }}
                className="absolute inset-0 z-20 flex flex-col justify-between items-center py-[clamp(28px,4vh,48px)] px-2"
              >
                <span className="font-mono text-xs font-bold text-gold tracking-widest">
                  {frame.num}
                </span>

                <div className="flex flex-col items-center gap-2">
                  <span className="font-mono text-[0.65rem] uppercase tracking-[0.22em] text-sand/80 whitespace-nowrap [writing-mode:vertical-rl] rotate-180">
                    {frame.kicker}
                  </span>
                  <span className="h-6 w-px bg-gold/30 my-1" />
                </div>

                <span className="font-mono text-[0.62rem] text-sand/50 tracking-wider">
                  {frame.year}
                </span>
              </motion.div>

              {/* Kinetic Editorial Typography (Anchored & Fixed-Width to Prevent Text Squish) */}
              <motion.div
                animate={{
                  opacity: isActive ? 1 : 0,
                  scale: isActive ? 1.0 : 0.92,
                  x: isActive ? 0 : isPrevious ? -24 : 0,
                  y: isActive ? 0 : isPrevious ? -18 : 28,
                  filter: isActive ? "blur(0px)" : isPrevious ? "blur(4px)" : "blur(6px)",
                }}
                transition={{
                  duration: TRANSITION_DURATION,
                  ease: FLUID_EASING,
                }}
                style={{
                  pointerEvents: isActive ? "auto" : "none",
                }}
                className="relative z-20 flex h-full flex-col justify-end px-[clamp(28px,4.5vw,70px)] pb-[clamp(90px,12vh,130px)] w-[clamp(480px,58vw,780px)]"
              >
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-bold uppercase tracking-[0.22em] text-gold">
                      FRAME {frame.num} · {frame.year}
                    </span>
                    <span className="h-px w-6 bg-gold/40" />
                    <span className="font-mono text-[0.65rem] uppercase tracking-widest text-sand/70">
                      {frame.kicker}
                    </span>
                  </div>

                  <h3 className="font-display text-[clamp(2rem,3.8vw,4.2rem)] font-normal leading-[1.04] text-[#FAF7F0] tracking-tight m-0 text-balance">
                    {frame.headline}
                  </h3>

                  <p className="font-serif text-sm md:text-base leading-relaxed text-sand/90 max-w-xl m-0 pt-1">
                    {frame.story}
                  </p>

                  {frame.hasCta && (
                    <div className="pt-3">
                      <Link
                        href="/legend"
                        className="group inline-flex items-center gap-3 rounded-full border border-gold bg-gold/20 px-6 py-2.5 font-mono text-xs uppercase tracking-widest text-bone backdrop-blur-md transition-all hover:bg-gold hover:text-black hover:shadow-[0_0_24px_rgba(212,175,55,0.4)]"
                      >
                        <span>Read the full legend</span>
                        <Arrow className="transition-transform group-hover:translate-x-1" />
                      </Link>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          );
        })}
      </div>

      {/* ================= Mobile Layout (Full-Bleed Stack with 3D Depth) ================= */}
      <div className="flex md:hidden relative h-full w-full overflow-hidden [perspective:1000px]">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={cur.id}
            initial={{ opacity: 0, scale: 1.15, z: 0 }}
            animate={{ opacity: 1, scale: 1.0, z: 0 }}
            exit={{ opacity: 0, scale: 0.88, z: -120 }}
            transition={{ duration: 0.9, ease: FLUID_EASING }}
            className="absolute inset-0 h-full w-full"
          >
            <FilmImage
              name={cur.image}
              sizes="100vw"
              priority
              className="h-full w-full object-cover"
            />
            <div
              aria-hidden
              className="absolute inset-0 bg-gradient-to-t from-[#0F0E0D] via-[#0F0E0D]/50 to-transparent"
            />

            <div className="relative z-20 flex h-full flex-col justify-end px-6 pb-28">
              <motion.div
                initial={{ opacity: 0, scale: 0.94, y: 24 }}
                animate={{ opacity: 1, scale: 1.0, y: 0 }}
                exit={{ opacity: 0, scale: 0.92, y: -16 }}
                transition={{ duration: 0.9, ease: FLUID_EASING }}
                className="space-y-3"
              >
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[0.68rem] font-bold uppercase tracking-widest text-gold">
                    FRAME {cur.num} · {cur.kicker}
                  </span>
                </div>
                <h3 className="font-display text-2xl font-normal leading-tight text-[#FAF7F0] m-0">
                  {cur.headline}
                </h3>
                <p className="font-serif text-xs leading-relaxed text-sand/90 m-0 line-clamp-3">
                  {cur.story}
                </p>
                {cur.hasCta && (
                  <div className="pt-2">
                    <Link
                      href="/legend"
                      className="inline-flex items-center gap-2 rounded-full border border-gold bg-gold/20 px-4 py-2 font-mono text-[0.68rem] uppercase tracking-widest text-bone"
                    >
                      Read full legend →
                    </Link>
                  </div>
                )}
              </motion.div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ================= Pinned Bottom Controls & Segmented Scrubber ================= */}
      <footer className="pointer-events-auto absolute bottom-0 left-0 right-0 z-30 flex flex-col gap-3 px-[clamp(18px,3vw,44px)] pb-[clamp(18px,2.8vh,30px)]">
        {/* Segmented Timeline Scrubber */}
        <div className="flex w-full items-center gap-2" role="tablist" aria-label="Slider frames">
          {FRAMES.map((f, i) => (
            <button
              key={f.id}
              type="button"
              role="tab"
              aria-selected={i === activeIdx}
              onClick={() => changeSlide(i)}
              className="group relative h-4 flex-1 py-1 focus:outline-none"
              aria-label={`Jump to Frame ${f.num}: ${f.kicker}`}
            >
              <div className="relative h-1 w-full rounded-full bg-white/15 overflow-hidden">
                {i === activeIdx ? (
                  <motion.div
                    key={`progress-${activeIdx}-${isPaused}`}
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{
                      duration: isPaused ? TRANSITION_DURATION : AUTOPLAY_INTERVAL / 1000,
                      ease: isPaused ? FLUID_EASING : "linear",
                    }}
                    style={{ originX: 0 }}
                    className="absolute inset-0 bg-gold shadow-[0_0_12px_rgba(212,175,55,0.8)]"
                  />
                ) : (
                  <div
                    className={cn(
                      "h-full w-full transition-colors duration-500",
                      i < activeIdx ? "bg-gold/60" : "bg-white/20 group-hover:bg-white/40"
                    )}
                  />
                )}
              </div>
            </button>
          ))}
        </div>

        {/* Minimal Controls Row */}
        <div className="flex items-center justify-between font-mono text-[0.68rem] tracking-widest text-sand/70">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={prevSlide}
              aria-label="Previous legend frame"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-gold/30 bg-black/40 text-sand hover:border-gold hover:text-gold transition-colors"
            >
              ←
            </button>
            <button
              type="button"
              onClick={nextSlide}
              aria-label="Next legend frame"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-gold/30 bg-black/40 text-sand hover:border-gold hover:text-gold transition-colors"
            >
              →
            </button>
            <span className="hidden sm:inline-block text-sand/50">
              Drag or Click any sliver to expand
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsPaused((prev) => !prev)}
              className="hover:text-gold transition-colors"
            >
              AUTOPLAY: {isPaused ? "PAUSED" : "ACTIVE"}
            </button>
          </div>
        </div>
      </footer>
    </section>
  );
}
