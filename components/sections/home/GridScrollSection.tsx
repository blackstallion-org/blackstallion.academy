"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { mediaSrc, type MediaKey } from "@/lib/content/media";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

// 43 exact grid item coordinates from the Codrops Demo 1 layout
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

  useEffect(() => {
    const section = sectionRef.current;
    const grid = gridRef.current;
    if (!section || !grid) return;

    // Use GSAP context for safe React mounting/unmounting
    const ctx = gsap.context(() => {
      const items = grid.querySelectorAll<HTMLElement>(".grid__item");

      items.forEach((item) => {
        const image = item.querySelector<HTMLElement>(".grid__item-img");
        if (!image) return;

        const randomOrigin = Math.random() > 0.5 ? "0% 100%" : "100% 100%";

        gsap.timeline({
          scrollTrigger: {
            trigger: item,
            start: "top 45%",
            end: "bottom top",
            scrub: true,
          },
        })
          .set(image, {
            transformOrigin: randomOrigin,
          })
          .to(image, {
            ease: "none",
            scale: 0,
            opacity: 0,
          });
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
      className="relative w-full bg-[#0a0908] text-bone overflow-clip border-y border-line/40"
    >
      {/* Pinned Sticky Cover (Header & Luxury Brand Typography) */}
      <div className="sticky top-0 z-20 flex h-screen w-full flex-col items-center justify-center pointer-events-none px-6">
        {/* Soft radial backdrop to preserve contrast over moving images */}
        <div
          aria-hidden
          className="absolute inset-0 bg-radial from-[#0a0908]/90 via-[#0a0908]/65 to-transparent pointer-events-none"
        />

        <div className="relative z-10 flex flex-col items-center text-center max-w-4xl">
          <span className="font-mono text-xs sm:text-sm uppercase tracking-[0.35em] text-gold mb-3 sm:mb-4">
            The Sovereign Arsenal
          </span>

          <h2 className="font-display text-[clamp(2.5rem,7.5vw,7.5rem)] font-bold tracking-tight text-bone uppercase leading-[0.9] drop-shadow-2xl">
            Black Stallion<sup className="text-[0.42em] align-top text-gold ml-1">®</sup>
          </h2>

          <h3 className="font-mono text-xs sm:text-base uppercase tracking-[0.25em] text-sand/85 mt-4 sm:mt-6">
            Twenty-One Living Warhorse Bloodlines
          </h3>

          <div className="mt-8 flex items-center gap-2 rounded-full border border-gold/30 bg-black/60 px-4 py-1.5 backdrop-blur-md">
            <span className="h-1.5 w-1.5 rounded-full bg-gold animate-ping" />
            <span className="font-mono text-[0.68rem] tracking-widest uppercase text-sand">
              Scroll through the citadel
            </span>
          </div>
        </div>
      </div>

      {/* 8-Column Scattered Grid scrolling behind/through the pinned cover */}
      <div className="relative -mt-[100vh] z-10 pb-24">
        <div
          ref={gridRef}
          className="grid w-full grid-cols-8 gap-2 sm:gap-3.5 md:gap-5 px-3 sm:px-6 md:px-10"
          style={{
            gridAutoRows: "clamp(70px, 12vw, 170px)",
          }}
        >
          {GRID_COORDINATES.map((coord, index) => {
            const mediaKey = CURATED_MEDIA_KEYS[index % CURATED_MEDIA_KEYS.length];
            const src = mediaSrc(mediaKey) || `/media/${mediaKey}.png`;
            // Wrap column index for mobile screens if needed
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
                <div
                  className="grid__item-img relative aspect-square w-full rounded-lg sm:rounded-xl overflow-hidden border border-gold/20 shadow-lg bg-[#141210] will-change-transform"
                  style={{
                    backgroundImage: `url(${src})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center 35%",
                  }}
                >
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />
                  <div className="pointer-events-none absolute bottom-1.5 left-2 hidden sm:block">
                    <span className="font-mono text-[0.55rem] uppercase tracking-wider text-sand/75">
                      #{String(index + 1).padStart(2, "0")}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Concluding Section Statement (Matching the editorial footer from the Codrops demo) */}
      <div className="relative z-20 min-h-[50vh] sm:min-h-[65vh] flex items-center justify-center border-t border-line/40 bg-ember/30 px-6 py-20 text-center">
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
