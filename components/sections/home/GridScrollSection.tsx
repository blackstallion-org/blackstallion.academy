"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { mediaSrc, type MediaKey } from "@/lib/content/media";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

// 43 exact grid item coordinates from the Codrops layout
const GRID_COORDINATES: Array<{ r: number; c: number }> = [
  { r: 1, c: 4 },
  { r: 1, c: 1 },
  { r: 2, c: 8 },
  { r: 2, c: 5 },
  { r: 3, c: 3 },
  { r: 4, c: 7 },
  { r: 5, c: 8 },
  { r: 6, c: 2 },
  { r: 7, c: 3 },
  { r: 8, c: 7 },
  { r: 9, c: 1 },
  { r: 9, c: 6 },
  { r: 10, c: 4 },
  { r: 11, c: 2 },
  { r: 12, c: 6 },
  { r: 13, c: 3 },
  { r: 14, c: 5 },
  { r: 15, c: 1 },
  { r: 16, c: 2 },
  { r: 17, c: 8 },
  { r: 18, c: 3 },
  { r: 19, c: 5 },
  { r: 20, c: 4 },
  { r: 21, c: 2 },
  { r: 22, c: 7 },
  { r: 23, c: 1 },
  { r: 24, c: 5 },
  { r: 25, c: 4 },
  { r: 26, c: 2 },
  { r: 27, c: 3 },
  { r: 28, c: 6 },
  { r: 29, c: 5 },
  { r: 30, c: 4 },
  { r: 31, c: 1 },
  { r: 32, c: 6 },
  { r: 33, c: 3 },
  { r: 34, c: 5 },
  { r: 35, c: 1 },
  { r: 36, c: 8 },
  { r: 37, c: 6 },
  { r: 38, c: 3 },
  { r: 39, c: 5 },
  { r: 40, c: 4 },
];

const CURATED_MEDIA_KEYS: MediaKey[] = [
  "fleetChetak",
  "fleetVeer",
  "legendBlack",
  "legendGrey",
  "fleetKesar",
  "fleetArbudh",
  "kalaPortrait",
  "nukraPortrait",
  "heroDust",
  "rearing",
  "gallop",
  "eye",
  "riderLance",
  "duneSilhouette",
  "bgCharge",
  "legendSand",
  "legendEars",
  "legendRevival",
  "legendToday",
  "anatomyProfile",
  "scienceRider",
  "whyCure",
  "currGroundcare",
  "currFormation",
  "currArchery",
  "currBarrel",
  "currTentpeg",
  "currBatch",
  "cadetZayd",
  "cadetAnanya",
  "cadetRohan",
  "parentsRail",
  "schoolAerial",
  "schoolArenaNight",
  "tournCup",
  "tournCrowd",
  "tournPodium",
  "journalReins",
  "contactGate",
];

export function GridScrollSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const grid = gridRef.current;
    const header = headerRef.current;
    if (!section || !grid || !header) return;

    // Use GSAP context for safe React mounting/unmounting
    const ctx = gsap.context(() => {
      // 1. Smoothly fade out the sticky hero header as user scrolls down so it NEVER collides with the conclusion!
      gsap.to(header, {
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: "28% top",
          scrub: true,
        },
        opacity: 0,
        y: -70,
        scale: 0.96,
        pointerEvents: "none",
        ease: "power1.out",
      });

      // 2. Parallax animation for small images: keep them sharp, clear and beautifully floating
      const items = grid.querySelectorAll<HTMLElement>(".grid__item");

      items.forEach((item, index) => {
        const image = item.querySelector<HTMLElement>(".grid__item-img");
        if (!image) return;

        // Subtle, elegant vertical float with varied speeds so images remain clearly visible and sharp
        const speed = 30 + (index % 4) * 18;

        gsap.fromTo(
          image,
          {
            y: speed,
            scale: 0.94,
            opacity: 0.9,
          },
          {
            scrollTrigger: {
              trigger: item,
              start: "top bottom",
              end: "bottom top",
              scrub: 1,
            },
            y: -speed,
            scale: 1.04,
            opacity: 1,
            ease: "none",
          }
        );
      });
    }, section);

    return () => {
      ctx.revert();
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      aria-label="The Sovereign Arsenal Grid"
      className="relative w-full bg-[#0d0c0a] text-bone overflow-clip border-b border-line/40"
    >
      {/* Pinned Sticky Cover (Header & Luxury Brand Typography) */}
      <div className="sticky top-0 z-20 flex h-screen w-full flex-col items-center justify-center pointer-events-none px-6">
        {/* Soft, reduced subtle vignette - no dark muddy veil */}
        <div
          aria-hidden
          className="absolute inset-0 bg-radial from-transparent via-[#0d0c0a]/40 to-[#0d0c0a]/80 pointer-events-none"
        />

        <div
          ref={headerRef}
          className="relative z-10 flex flex-col items-center text-center max-w-4xl transition-all"
        >
          <span className="font-mono text-xs sm:text-sm uppercase tracking-[0.35em] text-gold mb-3 sm:mb-4">
            The Sovereign Arsenal · Lore Archive
          </span>

          <h2 className="font-display text-[clamp(2.5rem,7.5vw,7.5rem)] font-bold tracking-tight text-bone uppercase leading-[0.9] drop-shadow-2xl">
            Black Stallion<sup className="text-[0.42em] align-top text-gold ml-1">®</sup>
          </h2>

          <h3 className="font-mono text-xs sm:text-base uppercase tracking-[0.25em] text-sand mt-4 sm:mt-6">
            Twenty-One Living Warhorse Bloodlines
          </h3>

          <div className="mt-8 flex items-center gap-2 rounded-full border border-gold/40 bg-black/40 px-4 py-1.5 backdrop-blur-md">
            <span className="h-1.5 w-1.5 rounded-full bg-gold animate-ping" />
            <span className="font-mono text-[0.68rem] tracking-widest uppercase text-sand">
              Scroll through the living archive
            </span>
          </div>
        </div>
      </div>

      {/* 8-Column Scattered Grid scrolling behind/through the pinned cover */}
      <div className="relative -mt-[100vh] z-10 pb-28">
        <div
          ref={gridRef}
          className="grid w-full grid-cols-8 gap-3 sm:gap-4 md:gap-6 px-3 sm:px-6 md:px-10"
          style={{
            gridAutoRows: "clamp(90px, 14vw, 200px)",
          }}
        >
          {GRID_COORDINATES.map((coord, index) => {
            const mediaKey = CURATED_MEDIA_KEYS[index % CURATED_MEDIA_KEYS.length];
            const src = mediaSrc(mediaKey) || `/media/${mediaKey}.png`;
            const col = coord.c;
            const row = coord.r;

            return (
              <div
                key={`${row}-${col}-${index}`}
                className="grid__item relative will-change-transform"
                style={{
                  gridRow: row,
                  gridColumn: col,
                }}
              >
                {/* Clear, crisp image container with zero dark tint mask */}
                <div
                  className="grid__item-img relative aspect-square w-full rounded-lg sm:rounded-xl overflow-hidden border border-gold/35 hover:border-gold shadow-[0_10px_30px_rgba(0,0,0,0.5)] bg-[#171513] will-change-transform transition-colors"
                  style={{
                    backgroundImage: `url(${src})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center 35%",
                  }}
                >
                  {/* Subtle number tag for editorial flair */}
                  <div className="pointer-events-none absolute bottom-1.5 left-2 hidden sm:block">
                    <span className="font-mono text-[0.6rem] uppercase tracking-wider text-sand bg-black/60 px-1.5 py-0.5 rounded border border-white/10 backdrop-blur-sm">
                      #{String(index + 1).padStart(2, "0")}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Concluding Section Statement (Clean, standalone, zero overlap) */}
      <div className="relative z-20 min-h-[50vh] sm:min-h-[60vh] flex items-center justify-center border-t border-line/50 bg-[#12110e] px-6 py-28 text-center">
        <div className="max-w-3xl space-y-6">
          <span className="font-mono text-xs uppercase tracking-[0.28em] text-brass">
            The Doctrine of Reality
          </span>
          <p className="t-voice text-2xl sm:text-4xl text-bone leading-relaxed">
            “From the dawn of civilisation onwards, the living warhorse has asked for the opposite of digital fragility: iron bone, unbroken composure, and a sovereign mind.”
          </p>
          <p className="font-mono text-xs uppercase tracking-widest text-dust">
            Black Stallion Academy &amp; Studbook · Sovereign Charter
          </p>
        </div>
      </div>
    </section>
  );
}
