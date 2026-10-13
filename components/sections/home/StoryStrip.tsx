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

interface KnockoutSectionData {
  id: string;
  frameNum: string;
  year: string;
  kicker: string;
  title: string;
  subhead: string;
  story: string;
  imageKey: MediaKey;
  fallbackUrl: string;
}

const SECTIONS_DATA: KnockoutSectionData[] = [
  {
    id: "frame-01",
    frameNum: "01",
    year: "1193 AD",
    kicker: "REEL 01 · THAR BASIN",
    title: "THE ART OF LIFE",
    subhead: "Eight hundred years in one bloodline.",
    story:
      "For centuries, civilisation was shaped by the partnership between horse and rider. In the Thar Desert that partnership bred a horse unlike any other.",
    imageKey: "legendSand",
    fallbackUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&q=80",
  },
  {
    id: "frame-02",
    frameNum: "02",
    year: "1350 AD",
    kicker: "REEL 01 · THE DESERT SHIELD",
    title: "THE ART OF LIFE",
    subhead: "Bred by terrain, not ideology.",
    story:
      "Driven onto the arid plains of the Thar, the horsemen of Marwar survived on endurance. Their horses learned to live on a cup of desert water and outrun the wind.",
    imageKey: "bgFort",
    fallbackUrl: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1920&q=80",
  },
  {
    id: "frame-03",
    frameNum: "03",
    year: "1576 AD",
    kicker: "REEL 01 · THE COVENANT",
    title: "THE ART OF LIFE",
    subhead: "Victory, death, or carrying the rider home.",
    story:
      "A Marwari left the battlefield in only three ways: in victory, in death, or carrying its wounded rider home. The ancient covenant of loyalty that eight centuries never broke.",
    imageKey: "legendCavalry",
    fallbackUrl: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1920&q=80",
  },
];

export function StoryStrip() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    console.log("🎬 [Knockout Reveal] Initializing 'THE ART OF LIFE' animation on mount...");

    const sections = container.querySelectorAll<HTMLElement>(".hero");
    if (!sections || sections.length === 0) return;

    // Use GSAP context for clean lifecycle management
    const ctx = gsap.context(() => {
      sections.forEach((section, index) => {
        const letters = section.querySelectorAll<HTMLElement>(".letter");
        const meta = section.querySelectorAll<HTMLElement>(".hero-meta");

        if (!letters || letters.length === 0) return;

        // Animate letters immediately on page load / mount with cascade
        gsap.to(letters, {
          opacity: 1,
          y: 0,
          duration: 1.1,
          ease: "power3.out",
          stagger: 0.04,
          delay: 0.35 + index * 0.15,
          onStart: () => {
            console.log(`✅ [Knockout Reveal] Section ${index + 1} ('${SECTIONS_DATA[index].title}') animation fired successfully`);
          },
        });

        // Animate metadata / story text smoothly
        if (meta && meta.length > 0) {
          gsap.to(meta, {
            opacity: 1,
            y: 0,
            duration: 1.0,
            ease: "power2.out",
            delay: 0.6 + index * 0.15,
          });
        }

        // ScrollTrigger: re-trigger / scrub on scroll when user reaches section 2 or 3
        ScrollTrigger.create({
          trigger: section,
          start: "top 75%",
          onEnter: () => {
            gsap.to(letters, {
              opacity: 1,
              y: 0,
              duration: 1.1,
              ease: "power3.out",
              stagger: 0.04,
              overwrite: "auto",
            });
          },
        });
      });
    }, container);

    // Fallback: If GSAP fails or takes too long, force reveal via setTimeout
    const fallbackTimer = setTimeout(() => {
      const allLetters = container.querySelectorAll<HTMLElement>(".letter");
      allLetters.forEach((el) => {
        if (getComputedStyle(el).opacity === "0") {
          el.style.opacity = "1";
          el.style.transform = "translateY(0px)";
          el.style.transition = "opacity 0.8s ease, transform 0.8s ease";
        }
      });
      const allMeta = container.querySelectorAll<HTMLElement>(".hero-meta");
      allMeta.forEach((el) => {
        if (getComputedStyle(el).opacity === "0") {
          el.style.opacity = "1";
          el.style.transform = "translateY(0px)";
          el.style.transition = "opacity 0.8s ease, transform 0.8s ease";
        }
      });
      console.log("✅ [Knockout Reveal] Fallback safety check complete");
    }, 1800);

    return () => {
      clearTimeout(fallbackTimer);
      ctx.revert();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      id="hero-slider"
      aria-label="The Art of Life · Marwari Story"
      className="relative w-full bg-[#0a0a0a] text-white overflow-hidden select-none"
    >
      {SECTIONS_DATA.map((item, idx) => {
        const bgUrl = mediaSrc(item.imageKey) || item.fallbackUrl;

        return (
          <section
            key={item.id}
            id={`story-section-${idx + 1}`}
            className="hero relative w-full h-[100vh] min-h-[680px] flex flex-col items-center justify-between overflow-hidden border-b border-white/10 px-6 py-10 sm:px-12 sm:py-14 isolate"
          >
            {/* Background image layer */}
            <div
              className="hero-bg absolute inset-0 bg-cover bg-center bg-no-repeat z-[1] will-change-transform"
              style={{
                backgroundImage: `url(${bgUrl})`,
              }}
            />

            {/* Dark overlay so the text pop is stronger */}
            <div
              className="hero-overlay absolute inset-0 bg-black/45 z-[2] pointer-events-none"
            />

            {/* Top Chapter Metadata */}
            <div className="hero-meta relative z-[3] w-full flex items-center justify-between opacity-0 translate-y-4 will-change-transform">
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs uppercase tracking-[0.25em] text-[#c9a66b]">
                  {item.kicker}
                </span>
                <span className="h-1 w-1 rounded-full bg-[#c9a66b]" />
                <span className="font-mono text-xs uppercase tracking-[0.18em] text-[#faf7f0]/80">
                  {item.year}
                </span>
              </div>
              <div className="font-mono text-xs uppercase tracking-[0.2em] text-[#c9a66b] border border-[#c9a66b]/40 bg-black/60 px-3 py-1 rounded-full backdrop-blur-md">
                FRAME {item.frameNum} / 03
              </div>
            </div>

            {/* The knockout text (centered full-viewport punch) */}
            <div className="relative z-[3] my-auto flex flex-col items-center justify-center text-center max-w-6xl px-4">
              <h1
                className="hero-title font-serif text-[clamp(3.5rem,12vw,9.5rem)] font-normal tracking-[0.04em] text-center leading-[0.95] uppercase will-change-transform"
                style={{
                  backgroundImage: `url(${bgUrl})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  backgroundRepeat: "no-repeat",
                  WebkitBackgroundClip: "text",
                  backgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  color: "transparent",
                  textShadow: "0 0 40px rgba(0,0,0,0.4)",
                  WebkitTextStroke: "1px rgba(255, 255, 255, 0.65)",
                }}
              >
                {item.title.split("").map((char, cIdx) => (
                  <span
                    key={`${item.id}-char-${cIdx}`}
                    className="letter inline-block will-change-transform"
                    style={{
                      opacity: 0,
                      transform: "translateY(40px)",
                    }}
                  >
                    {char === " " ? "\u00A0" : char}
                  </span>
                ))}
              </h1>

              {/* Subhead accompanying the knockout reveal */}
              <p className="hero-meta font-serif italic text-xl sm:text-3xl text-[#c9a66b] mt-6 tracking-wide opacity-0 translate-y-4 will-change-transform">
                {item.subhead}
              </p>
            </div>

            {/* Bottom Story & Navigation Chrome */}
            <div className="hero-meta relative z-[3] w-full max-w-4xl flex flex-col sm:flex-row items-center justify-between gap-6 border-t border-white/15 pt-6 opacity-0 translate-y-4 will-change-transform">
              <p className="font-sans text-sm sm:text-base text-[#FAF7F0]/90 leading-relaxed text-center sm:text-left max-w-xl">
                {item.story}
              </p>

              <div className="flex items-center gap-6 shrink-0">
                <span className="font-mono text-xs tracking-widest text-[#FAF7F0]/60 hidden md:inline">
                  {idx < 2 ? `SCROLL TO 0${idx + 2} ↓` : "THE LIVING WARHORSE"}
                </span>
                <Link
                  href="/legend"
                  className="font-mono text-xs uppercase tracking-widest text-[#c9a66b] hover:text-white flex items-center gap-2 border border-[#c9a66b]/40 bg-black/40 px-4 py-2 rounded-full transition-colors"
                >
                  <span>The Full Legend</span>
                  <Arrow />
                </Link>
              </div>
            </div>
          </section>
        );
      })}
    </div>
  );
}
