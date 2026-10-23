"use client";

import Link from "next/link";
import { Component, useCallback, useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useProgress } from "@react-three/drei";
import dynamic from "next/dynamic";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { useLenis } from "lenis/react";
import { useReducedMotion } from "@/lib/motion/reduced";
import { FilmImage } from "@/components/film/FilmImage";
import { EditorialScrollSync } from "@/components/motion/EditorialMotion";
import styles from "./StatueEditorial.module.css";
import { EndCard } from "@/components/film/EndCard";
import { cn } from "@/lib/utils";

// Register ScrollTrigger safely
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

// Dynamically import StatueCanvas to ensure 100% client-only WebGL execution
const StatueCanvas = dynamic(
  () => import("./StatueCanvas").then((mod) => mod.StatueCanvas),
  { ssr: false }
);

const subscribeHydration = () => () => {};

class MonumentBoundary extends Component<{ children: ReactNode; onFailure: () => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { this.props.onFailure(); }
  render() { return this.state.failed ? null : this.props.children; }
}

interface ChapterData {
  id: string;
  num: string;
  title: string;
  subtitle: string;
  body: string;
  desktopPos: string;
  textAlign: "left" | "right";
}

const SECTIONS: ChapterData[] = [
  {
    id: "origin",
    num: "01",
    title: "ORIGIN",
    subtitle: "EVERY LEGACY BEGINS WITH A VISION.",
    body: "Cast from centuries of martial composure and equestrian mastery. The highest crest of the sovereign line emerges from sacred stillness.",
    // Upper Left
    desktopPos: "lg:top-[18%] lg:left-[8%]",
    textAlign: "left",
  },
  {
    id: "steed",
    num: "02",
    title: "THE STEED",
    subtitle: "POWER. PRECISION. PRESENCE.",
    body: "Five hundred kilograms of unyielding truth. Inward-curving lyre ears that catch every breath of the desert wind. An equine instrument that cannot be flattered.",
    // Upper Right
    desktopPos: "lg:top-[20%] lg:right-[8%]",
    textAlign: "right",
  },
  {
    id: "rider",
    num: "03",
    title: "THE RIDER",
    subtitle: "LEADERSHIP IS BUILT UPON DISCIPLINE.",
    body: "Hands clear, spine vertical, heart calm. True command is not dominance over the beast, but total mastery of the self upon the mount.",
    // Middle Left
    desktopPos: "lg:top-[46%] lg:left-[8%]",
    textAlign: "left",
  },
  {
    id: "craft",
    num: "04",
    title: "CRAFT & STONE",
    subtitle: "EVERY DETAIL CARRIES THE WEIGHT OF HISTORY.",
    body: "Chiseled from noble stone and tempered bronze. Every vein, sinew, and saddle contour forged with the solemn precision of former cavalry masters.",
    // Middle Right
    desktopPos: "lg:top-[48%] lg:right-[8%]",
    textAlign: "right",
  },
  {
    id: "archive",
    num: "05",
    title: "ARCHIVE",
    subtitle: "A LEGACY CAST IN FORM. A VISION BUILT TO ENDURE.",
    body: "Preserved across generations for the cadets of the Black Stallion Academy of Horsemanship. Where discipline turns young riders into leaders.",
    // Lower Left
    desktopPos: "lg:bottom-[18%] lg:left-[8%]",
    textAlign: "left",
  },
  {
    id: "orbit",
    num: "06",
    title: "360° ORBIT",
    subtitle: "UNBROKEN SYMMETRY ACROSS EVERY ANGLE.",
    body: "From the chiseled martial crest to the muscular hindquarters and sovereign spine. A complete circular rotation witnessing the bronze monument in its total, unbroken presence.",
    // Lower Right
    desktopPos: "lg:bottom-[18%] lg:right-[8%]",
    textAlign: "right",
  },
];

export function CinematicStatueScroll({ editorial: requestedEditorial = false }: { editorial?: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const hydrated = useSyncExternalStore(subscribeHydration, () => true, () => false);
  const [failed, setFailed] = useState(false);
  const editorial = requestedEditorial || reduced || failed;
  const lenis = useLenis();
  const scrollProgressRef = useRef<number>(0);
  const scrollHintRef = useRef<HTMLDivElement>(null);
  const chapterRefs = useRef<(HTMLDivElement | null)[]>([]);
  const scrollTriggerRef = useRef<ScrollTrigger | null>(null);
  const viewportRef = useRef<HTMLDivElement>(null);

  // Optional deep-link via query parameter ?ch=1..6 or ?chapter=1..6
  const getInitialChapter = useCallback(() => {
    if (typeof window === "undefined") return 0;
    try {
      const params = new URLSearchParams(window.location.search);
      const chParam = params.get("ch") || params.get("chapter");
      if (chParam) {
        const idx = parseInt(chParam, 10) - 1;
        if (idx >= 0 && idx < SECTIONS.length) return idx;
      }
      if (window.location.hash) {
        const hash = window.location.hash.replace("#", "").toLowerCase();
        const found = SECTIONS.findIndex((s, idx) => s.id === hash || s.num === hash || `0${idx + 1}` === hash);
        if (found !== -1) return found;
      }
    } catch {}
    return 0;
  }, []);

  const initChapter = getInitialChapter();
  const [activeIdx, setActiveIdx] = useState(initChapter);
  const [isMobile, setIsMobile] = useState(false);

  // Sync initial index if hydrated
  useEffect(() => {
    if (!hydrated) return;
    const idx = getInitialChapter();
    if (idx <= 0) return;
    const targets = [0.0, 0.2, 0.36, 0.52, 0.68, 0.88];
    scrollProgressRef.current = targets[idx];
    // Applied in a frame callback (not synchronously in the effect) to avoid a cascading render.
    const id = window.requestAnimationFrame(() => setActiveIdx(idx));
    return () => window.cancelAnimationFrame(id);
  }, [hydrated, getInitialChapter]);

  // Drei loading progress
  const { progress, active } = useProgress();
  const [loaded, setLoaded] = useState(false);
  const cinematic = !editorial || (hydrated && !reduced && !failed);

  // Mark loaded when Drei completes
  useEffect(() => {
    if (!active && progress === 100) {
      const timer = setTimeout(() => setLoaded(true), 400);
      return () => clearTimeout(timer);
    }
  }, [active, progress]);

  useEffect(() => {
    if (!hydrated || reduced || loaded || failed) return;
    const deadline = window.setTimeout(() => setFailed(true), 20000);
    return () => window.clearTimeout(deadline);
  }, [editorial, hydrated, reduced, loaded, failed]);

  // Responsive check
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    const frame = window.requestAnimationFrame(checkMobile);
    window.addEventListener("resize", checkMobile, { passive: true });
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", checkMobile);
    };
  }, []);

  /**
   * Smoothly scroll page to any chapter's corresponding scroll target.
   * Target progress points across 6 chapters:
   * Ch 01: 0.00
   * Ch 02: 0.20
   * Ch 03: 0.36
   * Ch 04: 0.52
   * Ch 05: 0.68
   * Ch 06: 0.88
   */
  const scrollToChapter = useCallback((index: number, immediate = false) => {
    const container = containerRef.current;
    if (!container) return;
    if (reduced || failed) {
      chapterRefs.current[index]?.scrollIntoView({ behavior: immediate ? "auto" : "smooth", block: "center" });
      return;
    }

    const rect = container.getBoundingClientRect();
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const containerTop = scrollTop + rect.top;
    const containerHeight = container.offsetHeight;
    const viewportHeight = window.innerHeight;
    const scrollDistance = containerHeight - viewportHeight;

    const targets = [0.0, 0.2, 0.36, 0.52, 0.68, 0.88];
    const targetProgress = targets[index] ?? index / (SECTIONS.length - 1);
    const targetY = containerTop + targetProgress * scrollDistance;

    if (lenis) {
      lenis.scrollTo(targetY, { immediate });
    } else {
      window.scrollTo({ top: targetY, behavior: immediate ? ("instant" as ScrollBehavior) : "smooth" });
    }
  }, [lenis, reduced, failed]);

  // Jump to initial chapter once loaded
  useEffect(() => {
    if (!loaded) return;
    const initIdx = getInitialChapter();
    if (initIdx > 0) {
      const timer = setTimeout(() => {
        scrollToChapter(initIdx, true);
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [loaded, getInitialChapter, scrollToChapter]);

  // GSAP ScrollTrigger & Master Bidirectional Timeline Setup
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !cinematic) return;

    const initIdx = getInitialChapter();

    const ctx = gsap.context(() => {
      // 1. Initial visual states for floating annotations
      chapterRefs.current.forEach((el, index) => {
        if (!el) return;
        if (index === initIdx) {
          gsap.set(el, { opacity: 1, y: 0, autoAlpha: 1, filter: "blur(0px)" });
        } else {
          gsap.set(el, { opacity: 0, y: 18, autoAlpha: 0, filter: "blur(8px)" });
        }
      });

      // 2. Master Scrub Timeline driven strictly by ScrollTrigger
      const tl = gsap.timeline({
        defaults: { ease: "power2.inOut" },
        scrollTrigger: {
          id: "statue-master-scroll",
          trigger: containerRef.current,
          pin: viewportRef.current,
          start: "top top",
          end: "bottom bottom",
          scrub: 0.8,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            const p = Math.max(0, Math.min(1, self.progress));
            scrollProgressRef.current = p;

            // Synchronize active chapter across the 6 intervals
            let active = 0;
            if (p >= 0.77) active = 5;
            else if (p >= 0.62) active = 4;
            else if (p >= 0.46) active = 3;
            else if (p >= 0.30) active = 2;
            else if (p >= 0.14) active = 1;
            else active = 0;

            setActiveIdx(active);
          },
        },
      });

      scrollTriggerRef.current = tl.scrollTrigger ?? null;

      // Bottom scroll hint fades out early
      if (scrollHintRef.current) {
        tl.to(
          scrollHintRef.current,
          {
            opacity: 0,
            y: 12,
            autoAlpha: 0,
            duration: 0.04,
          },
          0.02
        );
      }

      // ==============================================================
      // 3. SYNCHRONIZED CHAPTER ANNOTATIONS (0.00 to 1.00)
      // Soft opacity reveal, gentle upward motion, and blur-to-sharp transitions
      // ==============================================================

      // Chapter 01: [0.00 .. 0.14] — exits between 0.10 and 0.14
      if (chapterRefs.current[0]) {
        tl.to(
          chapterRefs.current[0],
          {
            opacity: 0,
            y: -18,
            autoAlpha: 0,
            filter: "blur(6px)",
            duration: 0.04,
          },
          0.10
        );
      }

      // Chapter 02: [0.14 .. 0.30] — enters 0.14..0.18, holds to 0.26, exits 0.26..0.30
      if (chapterRefs.current[1]) {
        tl.fromTo(
          chapterRefs.current[1],
          { opacity: 0, y: 18, autoAlpha: 0, filter: "blur(8px)" },
          { opacity: 1, y: 0, autoAlpha: 1, filter: "blur(0px)", duration: 0.04 },
          0.14
        );
        tl.to(
          chapterRefs.current[1],
          { opacity: 0, y: -18, autoAlpha: 0, filter: "blur(6px)", duration: 0.04 },
          0.26
        );
      }

      // Chapter 03: [0.30 .. 0.46] — enters 0.30..0.34, holds to 0.42, exits 0.42..0.46
      if (chapterRefs.current[2]) {
        tl.fromTo(
          chapterRefs.current[2],
          { opacity: 0, y: 18, autoAlpha: 0, filter: "blur(8px)" },
          { opacity: 1, y: 0, autoAlpha: 1, filter: "blur(0px)", duration: 0.04 },
          0.30
        );
        tl.to(
          chapterRefs.current[2],
          { opacity: 0, y: -18, autoAlpha: 0, filter: "blur(6px)", duration: 0.04 },
          0.42
        );
      }

      // Chapter 04: [0.46 .. 0.62] — enters 0.46..0.50, holds to 0.58, exits 0.58..0.62
      if (chapterRefs.current[3]) {
        tl.fromTo(
          chapterRefs.current[3],
          { opacity: 0, y: 18, autoAlpha: 0, filter: "blur(8px)" },
          { opacity: 1, y: 0, autoAlpha: 1, filter: "blur(0px)", duration: 0.04 },
          0.46
        );
        tl.to(
          chapterRefs.current[3],
          { opacity: 0, y: -18, autoAlpha: 0, filter: "blur(6px)", duration: 0.04 },
          0.58
        );
      }

      // Chapter 05: [0.62 .. 0.77] — enters 0.62..0.66, holds to 0.73, exits 0.73..0.77
      if (chapterRefs.current[4]) {
        tl.fromTo(
          chapterRefs.current[4],
          { opacity: 0, y: 18, autoAlpha: 0, filter: "blur(8px)" },
          { opacity: 1, y: 0, autoAlpha: 1, filter: "blur(0px)", duration: 0.04 },
          0.62
        );
        tl.to(
          chapterRefs.current[4],
          { opacity: 0, y: -18, autoAlpha: 0, filter: "blur(6px)", duration: 0.04 },
          0.73
        );
      }

      // Chapter 06: [0.77 .. 1.00] — 360° Orbit enters 0.77..0.81, holds through 1.00
      if (chapterRefs.current[5]) {
        tl.fromTo(
          chapterRefs.current[5],
          { opacity: 0, y: 18, autoAlpha: 0, filter: "blur(8px)" },
          { opacity: 1, y: 0, autoAlpha: 1, filter: "blur(0px)", duration: 0.04 },
          0.77
        );
      }

      // Initial progress sync
      const st = tl.scrollTrigger;
      if (st) {
        const targets = [0.0, 0.2, 0.36, 0.52, 0.68, 0.88];
        let p = Math.max(0, Math.min(1, st.progress));
        if (p === 0 && initIdx > 0) {
          p = targets[initIdx];
        }
        scrollProgressRef.current = p;
        tl.progress(p);
        let currentIdx = 0;
        if (p >= 0.77) currentIdx = 5;
        else if (p >= 0.62) currentIdx = 4;
        else if (p >= 0.46) currentIdx = 3;
        else if (p >= 0.30) currentIdx = 2;
        else if (p >= 0.14) currentIdx = 1;
        setActiveIdx(currentIdx);
      }

      ScrollTrigger.refresh();
    }, containerRef);

    return () => {
      ctx.revert();
      scrollTriggerRef.current = null;
    };
  }, [cinematic]);

  // Centered monument in fullscreen composition
  const statueX = 0;

  return (
    <div className={cn("relative w-full bg-[#0B0A09] text-[#FAF7F0] select-none", styles.root)}>
      <EditorialScrollSync />

      {/* ==============================================================
          1. 600vh MASTER SCROLL CONTAINER WITH STICKY VIEWPORT PIN
          ============================================================== */}
      <div
        ref={containerRef}
        className={styles.stage}
      >
        <div ref={viewportRef} className={styles.viewport}>
          {/* ==============================================================
              2. CINEMATIC CIRCULAR MUSEUM SPOTLIGHT (CSS Background Lighting)
              ============================================================== */}
          <div aria-hidden className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
            {/* Dark Charcoal Base Atmosphere */}
            <div className="absolute inset-0 bg-[#0B0A09]" />

            {/* Large Diffused Ivory-Gold Museum Spotlight */}
            <div className={styles.museumSpotlight} />

            {/* Warm Core Light Feathering */}
            <div className={styles.museumCoreLight} />

            {/* Perimeter Vignette for Contrast & Focus */}
            <div className={styles.museumVignette} />
          </div>

          {/* ==============================================================
              3. FULLSCREEN 3D WEBGL CANVAS (Dominated Monument, Centered)
              ============================================================== */}
          <div className={styles.visual}>
            {(!hydrated || reduced || failed) ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <FilmImage name="curriculumHeroStatue" grade="none" className="max-h-[85vh] object-contain" />
              </div>
            ) : (
              <MonumentBoundary onFailure={() => setFailed(true)}>
                <StatueCanvas
                  scrollProgressRef={scrollProgressRef}
                  statueX={statueX}
                  isMobile={isMobile}
                />
              </MonumentBoundary>
            )}
          </div>

          {/* ==============================================================
              4. TOP BAR & BACK NAVIGATION (Minimal, Unobtrusive)
              ============================================================== */}
          <header className="absolute inset-x-0 top-16 md:top-20 z-30 flex items-center justify-between px-6 sm:px-10 py-4 pointer-events-auto">
            <Link
              href="/"
              className="group flex items-center gap-2.5 font-mono text-[0.68rem] uppercase tracking-[0.25em] text-[#C5A059] transition-colors hover:text-white"
            >
              <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-1" />
              <span>BSAH · Sovereign Citadel</span>
            </Link>

            <div className="flex items-center gap-3 sm:gap-4">
              <span className="hidden sm:inline-block font-mono text-[0.65rem] tracking-[0.3em] uppercase text-[#FAF7F0]/60">
                Rossbändiger · Equestrian Monument
              </span>
              <span className="rounded-full border border-[#C5A059]/40 bg-black/60 px-3 py-1 font-mono text-[0.62rem] uppercase tracking-[0.2em] text-[#C5A059] backdrop-blur-md shadow-lg">
                Chapter {SECTIONS[activeIdx].num} / 06
              </span>
            </div>
          </header>

          {/* ==============================================================
              5. DISTRIBUTED EDITORIAL CHAPTER ANNOTATIONS (Floating Overlay)
              Only the active chapter is revealed, smoothly animated with GSAP
              ============================================================== */}
          <div className={styles.annotationsLayer}>
            {SECTIONS.map((sec, i) => {
              const Heading = i === 0 ? "h1" : "h2";
              return (
                <div
                  key={sec.id}
                  ref={(el) => {
                    chapterRefs.current[i] = el;
                  }}
                  className={cn(
                    "absolute z-20 pointer-events-none max-w-[320px] sm:max-w-[360px] md:max-w-[390px] px-6 sm:px-0 transition-all",
                    // Desktop assigned quadrant / flank
                    sec.desktopPos,
                    // Mobile: safe bottom region, centered clear of 3D horse
                    "max-lg:top-auto max-lg:bottom-24 max-lg:inset-x-6 max-lg:mx-auto max-lg:text-center",
                    // Desktop alignment
                    sec.textAlign === "right" ? "lg:text-right" : "lg:text-left",
                    // Active pointer interaction
                    activeIdx === i ? "pointer-events-auto" : "pointer-events-none",
                    // Without the scroll-driven timeline (reduced motion, no WebGL, model failed) nothing hides the
                    // other chapters, so only the active one is shown (all six are listed in the notes below).
                    !cinematic && activeIdx !== i && "hidden"
                  )}
                >
                  {/* Small Uppercase Chapter Number & Tag */}
                  <div className={cn(
                    "inline-flex items-center gap-2.5",
                    sec.textAlign === "right" ? "lg:flex-row-reverse" : "lg:flex-row",
                    "max-lg:justify-center"
                  )}>
                    <span className="h-px w-6 bg-[#C5A059]" />
                    <p className="font-mono text-[10px] sm:text-[11px] uppercase tracking-[0.3em] text-[#C5A059] font-medium">
                      CHAPTER {sec.num}
                    </p>
                  </div>

                  {/* Elegant Chapter Title */}
                  <Heading className="t-voice mt-2 text-2xl sm:text-3xl lg:text-4xl font-light tracking-[0.06em] leading-tight text-[#FAF7F0] uppercase [text-shadow:0_2px_14px_rgba(0,0,0,0.85)]">
                    {sec.title}
                  </Heading>

                  {/* Short Supporting Subtitle with subtle gold tone */}
                  <p className="mt-2 font-mono text-[10px] sm:text-[11px] tracking-[0.22em] text-[#C5A059]/90 font-medium uppercase [text-shadow:0_1px_8px_rgba(0,0,0,0.9)]">
                    {sec.subtitle}
                  </p>

                  {/* Subtle Fine Divider Line */}
                  <div className={cn(
                    "my-3 h-px w-12 bg-gradient-to-r from-[#C5A059]/60 to-transparent",
                    sec.textAlign === "right" ? "lg:ml-auto lg:bg-gradient-to-l" : "",
                    "max-lg:mx-auto"
                  )} />

                  {/* Supporting Sentence / Concise Narrative */}
                  <p className="text-xs sm:text-sm leading-relaxed text-[#FAF7F0]/75 [text-shadow:0_1px_10px_rgba(0,0,0,0.9)] font-sans">
                    {sec.body}
                  </p>

                  {/* Section 05 Prompt to Orbit */}
                  {i === 4 && (
                    <div className={cn(
                      "mt-4 inline-flex items-center gap-2 font-mono text-[10px] tracking-[0.25em] text-[#C5A059] uppercase",
                      sec.textAlign === "right" ? "lg:flex-row-reverse" : "lg:flex-row",
                      "max-lg:justify-center"
                    )}>
                      <span className="h-1.5 w-1.5 rounded-full bg-[#C5A059] animate-pulse" />
                      <span>Scroll to engage 360° Orbit</span>
                    </div>
                  )}

                  {/* Section 06 Final CTAs */}
                  {i === 5 && (
                    <div className={cn(
                      "mt-5 flex flex-wrap items-center gap-3 pointer-events-auto",
                      sec.textAlign === "right" ? "lg:justify-end" : "lg:justify-start",
                      "max-lg:justify-center"
                    )}>
                      <Link
                        href="/curriculum"
                        className="inline-flex items-center gap-2 rounded-full border border-[#C5A059] bg-[#C5A059]/20 px-4 py-2 font-mono text-[11px] uppercase tracking-[0.2em] text-[#FAF7F0] backdrop-blur-md transition-all hover:bg-[#C5A059] hover:text-black cursor-pointer shadow-lg"
                      >
                        <span>Curriculum</span>
                        <ArrowUpRight className="h-3.5 w-3.5" />
                      </Link>
                      <Link
                        href="/contact?gate=parents"
                        className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-black/50 px-4 py-2 font-mono text-[11px] uppercase tracking-[0.2em] text-sand backdrop-blur-md transition-all hover:border-[#C5A059] hover:text-white cursor-pointer shadow-lg"
                      >
                        <span>Enrol</span>
                      </Link>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* ==============================================================
              6. UNOBTRUSIVE FLOATING CHAPTER STEPPER (Bottom Centered)
              ============================================================== */}
          <nav
            aria-label="Statue Chapters Timeline"
            className="absolute bottom-6 inset-x-0 z-30 flex justify-center pointer-events-auto px-4"
          >
            <div className="flex items-center gap-1.5 sm:gap-2 rounded-full border border-[#C5A059]/25 bg-black/70 px-4 py-1.5 backdrop-blur-md shadow-2xl">
              {SECTIONS.map((sec, i) => {
                const isActive = activeIdx === i;
                return (
                  <button
                    key={sec.id}
                    type="button"
                    onClick={() => scrollToChapter(i)}
                    aria-label={`Jump to Chapter ${sec.num}: ${sec.title}`}
                    className={cn(
                      "flex items-center gap-1.5 rounded-full px-2.5 py-1 font-mono text-[11px] transition-all cursor-pointer",
                      isActive
                        ? "bg-[#C5A059] text-black font-semibold shadow-[0_0_12px_rgba(197,160,89,0.5)] scale-105"
                        : "text-[#FAF7F0]/40 hover:text-[#FAF7F0] hover:bg-white/5"
                    )}
                  >
                    <span>{sec.num}</span>
                    {isActive && (
                      <span className="hidden sm:inline uppercase text-[9px] tracking-wider font-bold">
                        · {sec.title}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </nav>

          {/* ==============================================================
              7. BOTTOM SCROLL HINT (Active in Chapter 01)
              ============================================================== */}
          <div
            ref={scrollHintRef}
            // Desktop and scroll-driven mode only: below 1024 px it collided with the chapter text, and without the
            // scroll timeline there is nothing to "scroll to explore".
            className={cn("absolute bottom-16 md:bottom-20 inset-x-0 z-20 hidden justify-center pointer-events-none", cinematic && "lg:flex")}
          >
            <div className="flex flex-col items-center gap-2">
              <span className="font-mono text-[0.62rem] tracking-[0.3em] uppercase text-[#FAF7F0]/60 [text-shadow:0_1px_8px_rgba(0,0,0,0.9)]">
                Scroll to Explore Monument
              </span>
              <div className="h-6 w-px bg-gradient-to-b from-[#C5A059] to-transparent animate-pulse" />
            </div>
          </div>

          {/* ==============================================================
              8. PRELOADER STATUS INDICATOR
              ============================================================== */}
          {hydrated && !reduced && !failed && !loaded && (
            <div role="status" className="pointer-events-none absolute bottom-24 right-6 z-30 font-mono text-xs text-[#FAF7F0] bg-black/60 px-3 py-1 rounded-full border border-line">
              Forging 3D Equestrian Monument · {Math.round(progress)}% loaded
            </div>
          )}
        </div>
      </div>

      {/* ==============================================================
          9. CITADEL ARCHIVE EXIT SECTION (Unpinned scroll reveal)
          ============================================================== */}
      <div className="tone-light editorial-reel-notes gutter">
        {SECTIONS.map((sec) => (
          <article key={sec.id}>
            <h3>{sec.title}</h3>
            <p>{sec.body}</p>
          </article>
        ))}
      </div>

      <section className="relative z-30 bg-[#070605] text-[#FAF7F0] border-t border-[#C5A059]/20 px-6 sm:px-12 md:px-20 py-24 sm:py-32">
        <div className="mx-auto max-w-5xl">
          <div className="flex flex-col items-center text-center">
            <div className="inline-flex items-center gap-3">
              <span className="h-px w-8 bg-[#C5A059]/60" />
              <p className="font-mono text-xs uppercase tracking-[0.3em] text-[#C5A059]">
                The Sovereign Citadel Archive
              </p>
              <span className="h-px w-8 bg-[#C5A059]/60" />
            </div>

            <h2 className="t-voice mt-6 text-3xl sm:text-5xl md:text-6xl font-light tracking-[0.05em] uppercase text-[#FAF7F0]">
              Formed by Discipline. Built to Endure.
            </h2>

            <p className="t-story mt-6 max-w-2xl text-base sm:text-lg leading-relaxed text-[#FAF7F0]/80">
              The Rossbändiger monument stands as the central keystone of the Black Stallion Academy of Horsemanship.
              Here, cadets master composure before courage, and humility before command.
            </p>

            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/fleet"
                className="inline-flex items-center gap-2 rounded-full border border-[#C5A059] bg-[#C5A059] px-7 py-3 font-mono text-xs uppercase tracking-[0.25em] text-black font-semibold transition-all hover:bg-white hover:border-white"
              >
                <span>The Studbook Fleet</span>
                <ArrowUpRight className="h-4 w-4" />
              </Link>
              <Link
                href="/curriculum"
                className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/60 px-7 py-3 font-mono text-xs uppercase tracking-[0.25em] text-[#FAF7F0] backdrop-blur-md transition-all hover:border-[#C5A059] hover:text-[#C5A059]"
              >
                <span>Cadet Curriculum</span>
              </Link>
              <Link
                href="/contact?gate=parents"
                className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/60 px-7 py-3 font-mono text-xs uppercase tracking-[0.25em] text-[#FAF7F0] backdrop-blur-md transition-all hover:border-white/50 hover:text-white"
              >
                <span>Admissions Gate</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Hand visitor to Next Reel (04 · The Matrix) */}
      <EndCard current={3} />
    </div>
  );
}
