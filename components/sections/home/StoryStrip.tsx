"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { mediaSrc, type MediaKey } from "@/lib/content/media";
import { Arrow } from "@/components/film/Marks";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

interface StoryChapter {
  id: string;
  frameNum: string;
  year: string;
  era: string;
  tag: string;
  line1: string;
  line2: string;
  subhead: string;
  narrative: string;
  image: MediaKey;
  cite: string;
}

const CHAPTERS: StoryChapter[] = [
  {
    id: "origin",
    frameNum: "01",
    year: "1193",
    era: "FOUNDATION · THAR BASIN",
    tag: "ONE BLOODLINE",
    line1: "THE ART OF",
    line2: "WARHORSE.",
    subhead: "Eight hundred years in one bloodline.",
    narrative:
      "For centuries, civilisation was shaped by the partnership between horse and rider. In the Thar Desert that partnership bred a horse unlike any other: iron bone, unbroken composure, and a sovereign mind.",
    image: "legendSand",
    cite: "BSAH ARCHIVE // CODEX MARWARI // 1193 AD",
  },
  {
    id: "adaptation",
    frameNum: "02",
    year: "1350",
    era: "THE DESERT SHIELD",
    tag: "TERRAIN ADAPTATION",
    line1: "BRED BY",
    line2: "TERRAIN.",
    subhead: "Bred by survival, not ideology.",
    narrative:
      "Driven onto the arid plains of the Thar, the horsemen of Marwar survived on endurance. Their horses learned to live on a cup of desert water, traverse burning sands without faltering, and outrun the desert wind.",
    image: "bgFort",
    cite: "BSAH ARCHIVE // RAJPUT FORTRESS // 1350 AD",
  },
  {
    id: "covenant",
    frameNum: "03",
    year: "1576",
    era: "THE COVENANT",
    tag: "THE SACRED VOW",
    line1: "THE SACRED",
    line2: "VOW.",
    subhead: "Victory, death, or carrying the rider home.",
    narrative:
      "A Marwari left the battlefield in only three ways: in victory, in death, or carrying its wounded rider home across desert lines. An ancient oath of fidelity that eight centuries never broke.",
    image: "legendCavalry",
    cite: "BSAH ARCHIVE // BATTLE OF HALDIGHATI // 1576 AD",
  },
];

/**
 * Recreates the hero animation from the Pinterest video ‘THE ART OF LIFE’:
 * - 3 full-viewport sections (one per image/chapter of the Marwari story).
 * - Large white serif typography acting as a mask knockout where the underlying photo reveals through the letters.
 * - GSAP ScrollTrigger reveals the text word-by-word with slow, consistent cinematic easing.
 * - Static overlay pattern: deep moody atmospheric photo behind with the knockout letters sliding in over it.
 */
export function StoryStrip() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const isReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const ctx = gsap.context(() => {
      const sections = container.querySelectorAll<HTMLElement>(".story-viewport-section");

      sections.forEach((section) => {
        const bgImg = section.querySelector<HTMLElement>(".story-bg-img");
        const badge = section.querySelector<HTMLElement>(".story-badge");
        const wordInners = section.querySelectorAll<HTMLElement>(".story-word-inner");
        const storyCopy = section.querySelector<HTMLElement>(".story-copy");
        const bottomBar = section.querySelector<HTMLElement>(".story-bottom-bar");

        if (isReduced) {
          gsap.set([badge, wordInners, storyCopy, bottomBar], { opacity: 1, y: 0 });
          return;
        }

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: section,
            start: "top 70%",
            toggleActions: "play none none reverse",
          },
        });

        // Background image slow cinematic ease
        if (bgImg) {
          tl.fromTo(
            bgImg,
            { scale: 1.12, opacity: 0.16 },
            { scale: 1.0, opacity: 0.38, duration: 1.6, ease: "power2.out" },
            0
          );
        }

        // Top badge fade-down
        if (badge) {
          tl.fromTo(
            badge,
            { opacity: 0, y: -16 },
            { opacity: 1, y: 0, duration: 0.8, ease: "power2.out" },
            0.15
          );
        }

        // Giant serif knockout text word-by-word reveal
        if (wordInners.length > 0) {
          tl.fromTo(
            wordInners,
            {
              y: "115%",
              opacity: 0,
              rotateX: -18,
              filter: "blur(8px)",
            },
            {
              y: "0%",
              opacity: 1,
              rotateX: 0,
              filter: "blur(0px)",
              duration: 1.3,
              stagger: 0.09,
              ease: "power3.out",
            },
            0.25
          );
        }

        // Narrative subhead & story text
        if (storyCopy) {
          tl.fromTo(
            storyCopy,
            { opacity: 0, y: 32 },
            { opacity: 1, y: 0, duration: 1.1, ease: "power2.out" },
            0.6
          );
        }

        // Bottom timeline bar
        if (bottomBar) {
          tl.fromTo(
            bottomBar,
            { opacity: 0, y: 14 },
            { opacity: 1, y: 0, duration: 0.8, ease: "power2.out" },
            0.75
          );
        }
      });
    }, container);

    return () => {
      ctx.revert();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      id="hero-slider"
      aria-label="The Marwari Story · The Art of the Warhorse"
      className="relative w-full bg-[#0a0908] text-[#FAF7F0] select-none"
    >
      {CHAPTERS.map((chapter, idx) => {
        const imgSrc = mediaSrc(chapter.image) || `/media/${chapter.image}.png`;
        const wordsLine1 = chapter.line1.split(" ");
        const wordsLine2 = chapter.line2.split(" ");

        return (
          <section
            key={chapter.id}
            id={`chapter-${chapter.id}`}
            className="story-viewport-section relative h-[100svh] min-h-[700px] w-full overflow-hidden border-b border-gold/25 flex flex-col justify-between px-[clamp(20px,4vw,64px)] py-[clamp(24px,3.8vh,48px)] isolate"
          >
            {/* ================= Static Atmospheric Background Layer ================= */}
            <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden bg-[#0a0908]">
              {/* Background Photo (atmospheric, dimmed behind the text overlay) */}
              <div
                className="story-bg-img absolute inset-0 h-full w-full will-change-transform"
                style={{
                  backgroundImage: `url(${imgSrc})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center 38%",
                  opacity: 0.36,
                }}
              />

              {/* Radial Vignette to focus eyes on the knockout typography */}
              <div
                aria-hidden
                className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(10,9,8,0.5)_60%,#0a0908_100%)]"
              />
              <div
                aria-hidden
                className="absolute inset-0 bg-gradient-to-t from-[#0a0908] via-transparent to-[#0a0908]/75"
              />
            </div>

            {/* ================= Top Chrome ================= */}
            <header className="story-badge relative z-20 flex items-start justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-[0.68rem] tracking-[0.25em] uppercase text-gold">
                    THE MARWARI STORY // REEL 01
                  </span>
                  <span className="hidden sm:inline-block h-1 w-1 rounded-full bg-gold/60" />
                  <span className="hidden sm:inline-block font-mono text-[0.65rem] tracking-[0.18em] uppercase text-sand/80">
                    {chapter.era}
                  </span>
                </div>
                <h3 className="font-mono text-xs text-sand/70 tracking-widest uppercase mt-1">
                  FRAME {chapter.frameNum} OF {String(CHAPTERS.length).padStart(2, "0")} · {chapter.year} AD
                </h3>
              </div>

              {/* Chapter Badge Seal */}
              <div className="flex items-center gap-3 font-mono text-[0.68rem] tracking-widest text-gold border border-gold/40 bg-black/60 px-3.5 py-1.5 rounded-full backdrop-blur-md">
                <span className="h-1.5 w-1.5 rounded-full bg-gold animate-pulse" />
                <span>{chapter.tag}</span>
              </div>
            </header>

            {/* ================= Center Stage: Giant White Serif Knockout Typography ================= */}
            <div className="relative z-20 my-auto flex flex-col justify-center max-w-7xl">
              <h2 className="font-serif text-[clamp(3.8rem,10.2vw,11.2rem)] font-bold tracking-tight uppercase leading-[0.88] select-none [perspective:1000px]">
                {/* Line 1 */}
                <span className="block overflow-hidden pb-1">
                  {wordsLine1.map((word, wIdx) => (
                    <span
                      key={`l1-${wIdx}`}
                      className="inline-block overflow-hidden mr-[0.24em] last:mr-0 align-top"
                    >
                      <span
                        className="story-word-inner inline-block text-transparent will-change-transform"
                        style={{
                          backgroundImage: `url(${imgSrc})`,
                          backgroundSize: "cover",
                          backgroundPosition: "center 38%",
                          WebkitBackgroundClip: "text",
                          backgroundClip: "text",
                          WebkitTextStroke: "1.2px rgba(250, 247, 240, 0.9)",
                          filter: "drop-shadow(0 8px 30px rgba(0,0,0,0.7))",
                        }}
                      >
                        {word}
                      </span>
                    </span>
                  ))}
                </span>

                {/* Line 2 */}
                <span className="block overflow-hidden pt-1">
                  {wordsLine2.map((word, wIdx) => (
                    <span
                      key={`l2-${wIdx}`}
                      className="inline-block overflow-hidden mr-[0.24em] last:mr-0 align-top"
                    >
                      <span
                        className="story-word-inner inline-block text-transparent will-change-transform"
                        style={{
                          backgroundImage: `url(${imgSrc})`,
                          backgroundSize: "cover",
                          backgroundPosition: "center 38%",
                          WebkitBackgroundClip: "text",
                          backgroundClip: "text",
                          WebkitTextStroke: "1.2px rgba(250, 247, 240, 0.9)",
                          filter: "drop-shadow(0 8px 30px rgba(0,0,0,0.7))",
                        }}
                      >
                        {word}
                      </span>
                    </span>
                  ))}
                </span>
              </h2>

              {/* Subhead & Narrative Story Copy */}
              <div className="story-copy mt-6 sm:mt-10 grid gap-6 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1.8fr)] items-start">
                <div>
                  <p className="font-serif italic text-xl sm:text-2xl text-gold tracking-tight">
                    {chapter.subhead}
                  </p>
                </div>
                <div>
                  <p className="text-sand/95 text-base sm:text-lg leading-relaxed max-w-2xl font-sans">
                    {chapter.narrative}
                  </p>
                  <p className="font-mono text-[0.62rem] uppercase tracking-[0.2em] text-dust mt-3">
                    {chapter.cite}
                  </p>
                </div>
              </div>
            </div>

            {/* ================= Bottom Timeline & Navigation Chrome ================= */}
            <footer className="story-bottom-bar relative z-20 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-line/40 pt-4 text-xs font-mono">
              {/* Step indicator pills */}
              <div className="flex items-center gap-3">
                {CHAPTERS.map((c, i) => (
                  <a
                    key={c.id}
                    href={`#chapter-${c.id}`}
                    className={`flex items-center gap-2 border px-3 py-1 transition-all ${
                      i === idx
                        ? "border-gold bg-gold/15 text-gold"
                        : "border-line/60 text-dust hover:text-sand hover:border-gold/50"
                    }`}
                  >
                    <span>{c.frameNum}</span>
                    <span className="hidden md:inline">{c.tag}</span>
                  </a>
                ))}
              </div>

              {/* Action / Next Frame Prompt */}
              <div className="flex items-center gap-6">
                <span className="text-[0.68rem] tracking-widest text-dust hidden sm:inline">
                  {idx < CHAPTERS.length - 1
                    ? `SCROLL TO UNVEIL FRAME 0${idx + 2} ↓`
                    : "THE LIVING WARHORSE HERITAGE"}
                </span>

                <Link
                  href="/legend"
                  className="group inline-flex items-center gap-2 text-gold hover:text-bone transition-colors"
                >
                  <span className="tracking-widest uppercase">The Full Legend</span>
                  <Arrow className="transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </footer>
          </section>
        );
      })}
    </div>
  );
}
