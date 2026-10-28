"use client";

import { motion, useInView, AnimatePresence } from "motion/react";
import { useReducedMotion } from "@/lib/motion/reduced";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { pillars, ranks } from "@/lib/content/curriculum";
import { ledger } from "@/lib/content/home";
import { cn } from "@/lib/utils";
import { asset } from "@/lib/content/asset";

const VIEW_W = 1440;
const VIEW_H = 680;

interface NodeConfig {
  n: number;
  x: number;
  y: number;
  rankIndex: number;
  image: string;
}

const NODES: NodeConfig[] = [
  { n: 1, x: 135, y: 470, rankIndex: 0, image: asset("/images/ledger/node_01.png") },
  { n: 2, x: 315, y: 460, rankIndex: 0, image: asset("/images/ledger/node_02.png") },
  { n: 3, x: 280, y: 390, rankIndex: 0, image: asset("/images/ledger/node_03.png") },
  { n: 4, x: 455, y: 465, rankIndex: 1, image: asset("/images/ledger/node_04.png") },
  { n: 6, x: 555, y: 345, rankIndex: 1, image: asset("/images/ledger/node_06.png") },
  { n: 5, x: 655, y: 420, rankIndex: 1, image: asset("/images/ledger/node_05.png") },
  { n: 7, x: 805, y: 390, rankIndex: 2, image: asset("/images/ledger/node_07.png") },
  { n: 8, x: 960, y: 360, rankIndex: 2, image: asset("/images/ledger/node_08.png") },
  { n: 9, x: 920, y: 290, rankIndex: 2, image: asset("/images/ledger/node_09.png") },
  { n: 10, x: 1195, y: 335, rankIndex: 3, image: asset("/images/ledger/node_10.png") },
  { n: 11, x: 1160, y: 255, rankIndex: 3, image: asset("/images/ledger/node_11.png") },
  { n: 12, x: 1130, y: 180, rankIndex: 3, image: asset("/images/ledger/node_12.png") },
  { n: 13, x: 1195, y: 115, rankIndex: 3, image: asset("/images/ledger/node_13.png") },
];

const INTERMEDIATE_DOTS = [
  { x: 185, y: 435, rankIndex: 0 },
  { x: 235, y: 410, rankIndex: 0 }, // junction 1
  { x: 385, y: 470, rankIndex: 0 },
  { x: 490, y: 405, rankIndex: 1 },
  { x: 525, y: 370, rankIndex: 1 }, // junction 2
  { x: 730, y: 410, rankIndex: 1 },
  { x: 845, y: 345, rankIndex: 2 },
  { x: 890, y: 305, rankIndex: 2 }, // junction 3
  { x: 940, y: 335, rankIndex: 2 },
  { x: 1075, y: 395, rankIndex: 2 },
  { x: 1145, y: 365, rankIndex: 2 },
  { x: 1175, y: 290, rankIndex: 3 },
  { x: 1145, y: 215, rankIndex: 3 },
  { x: 1165, y: 145, rankIndex: 3 },
];

const RANK_PATHS = [
  // Rank I (Squire)
  {
    rankIndex: 0,
    paths: [
      "M 135 470 Q 185 435, 235 410",
      "M 235 410 Q 255 398, 280 390",
      "M 235 410 Q 275 440, 315 460",
      "M 315 460 Q 385 475, 455 465",
    ],
  },
  // Rank II (Rider)
  {
    rankIndex: 1,
    paths: [
      "M 455 465 Q 490 405, 525 370",
      "M 525 370 Q 540 358, 555 345",
      "M 525 370 Q 585 395, 655 420",
      "M 655 420 Q 730 420, 805 390",
    ],
  },
  // Rank III (Knight)
  {
    rankIndex: 2,
    paths: [
      "M 805 390 Q 845 345, 890 305",
      "M 890 305 Q 905 295, 920 290",
      "M 890 305 Q 930 335, 960 360",
      "M 960 360 C 1050 405, 1130 375, 1195 335",
    ],
  },
  // Rank IV (Sovereign Lancer)
  {
    rankIndex: 3,
    paths: [
      "M 1195 335 Q 1175 290, 1160 255",
      "M 1160 255 Q 1145 215, 1130 180",
      "M 1130 180 Q 1165 145, 1195 115",
    ],
  },
];

const RANK_CARDS = [
  {
    id: "squire",
    numeral: "I",
    name: "Cadet Squire",
    short: "Ground care and trot",
    image: asset("/images/ledger/rank_clean_1.jpg"),
    href: "/curriculum#squire",
    pillars: [1, 2, 3],
  },
  {
    id: "rider",
    numeral: "II",
    name: "Cadet Rider",
    short: "Independent canter",
    image: asset("/images/ledger/rank_clean_2.jpg"),
    href: "/curriculum#rider",
    pillars: [4, 5, 6],
  },
  {
    id: "knight",
    numeral: "III",
    name: "Cadet Knight",
    short: "Lance and bow",
    image: asset("/images/ledger/rank_clean_3.jpg"),
    href: "/curriculum#knight",
    pillars: [7, 8, 9],
  },
  {
    id: "lancer",
    numeral: "IV",
    name: "Sovereign Lancer",
    short: "National competition",
    image: asset("/images/ledger/rank_clean_4.jpg"),
    href: "/curriculum#lancer",
    pillars: [10, 11, 12, 13],
  },
];

export function LedgerAscent() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const inView = useInView(sectionRef, { amount: 0.25 });
  const reduced = useReducedMotion();

  const [activeRank, setActiveRank] = useState(0);
  const [selectedPillar, setSelectedPillar] = useState<number | null>(null);
  const [hoveredPillar, setHoveredPillar] = useState<number | null>(null);
  const [autoRotate, setAutoRotate] = useState(true);

  // Auto-cycle active rank every 4.2 seconds when in view unless user interacted
  useEffect(() => {
    if (!inView || !autoRotate || reduced || selectedPillar !== null) return;
    const interval = window.setInterval(() => {
      setActiveRank((curr) => (curr + 1) % ranks.length);
    }, 4200);
    return () => window.clearInterval(interval);
  }, [inView, autoRotate, reduced, selectedPillar]);

  const handleSelectRank = (rankIdx: number) => {
    setAutoRotate(false);
    setActiveRank(rankIdx);
  };

  const handleSelectPillar = (pillarNum: number) => {
    setAutoRotate(false);
    setSelectedPillar((curr) => (curr === pillarNum ? null : pillarNum));
    const node = NODES.find((nd) => nd.n === pillarNum);
    if (node) {
      setActiveRank(node.rankIndex);
    }
  };

  const activePillarData = selectedPillar !== null ? pillars[selectedPillar - 1] : null;

  return (
    <>
    <section
      ref={sectionRef}
      id="ledger"
      aria-labelledby="ledger-h"
      className="relative w-full lg:h-screen lg:min-h-[820px] lg:max-h-[960px] flex flex-col justify-between overflow-hidden bg-[#171513] text-[#f3ede2] tone-dark pt-12 lg:pt-16 pb-0"
    >
      {/* ==============================================================
          MOBILE-ONLY EDITORIAL HEADER BLOCK (clean vertical flow)
          ============================================================== */}
      <div className="lg:hidden px-6 pt-2 pb-4 pointer-events-auto">
        <div className="flex items-center gap-3">
          <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-[#c9a66b]">
            REEL 05 · THE LEDGER
          </span>
          <span className="h-px w-14 bg-[#c9a66b]/45" />
        </div>
        <h2 className="mt-2.5 font-serif text-3xl font-normal tracking-tight text-[#f3ede2] leading-[1.05]">
          {ledger.inscription}<br />
          {ledger.voice}
        </h2>
        
      </div>

      {/* ==============================================================
          MAIN CINEMATIC CONSTELLATION STAGE (Widescreen Canvas)
          ============================================================== */}
      <div className="relative w-full flex-1 flex flex-col justify-center overflow-x-auto lg:overflow-visible scrollbar-none">
        <div className="relative w-full h-[420px] sm:h-[480px] lg:h-full min-w-[1180px] lg:min-w-full overflow-hidden select-none">
          {/* Backdrop cinematic image */}
          <div className="absolute inset-0">
            <Image
              src={asset("/images/ledger-ascent-bg.jpg")}
              alt="Cadet on a Marwari stallion ascending towards the mountain fortress"
              fill
              className="object-cover object-center pointer-events-none"
              sizes="100vw"
            />
            {/* Subtle cinematic gradient vignettes */}
            <div className="absolute inset-x-0 top-0 h-32 lg:h-40 bg-gradient-to-b from-[#171513] via-[#171513]/60 to-transparent pointer-events-none" />
            <div className="absolute inset-x-0 bottom-0 h-32 lg:h-36 bg-gradient-to-t from-[#171513] via-[#171513]/70 to-transparent pointer-events-none" />
            <div className="absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-[#171513]/85 via-[#171513]/40 to-transparent pointer-events-none" />
            <div className="absolute inset-y-0 right-0 w-1/4 bg-gradient-to-l from-[#171513]/60 via-transparent to-transparent pointer-events-none" />
          </div>

          {/* DESKTOP-ONLY Editorial Header Block (Floating Absolute) */}
          <div className="hidden lg:block absolute top-6 xl:top-8 left-10 xl:left-16 z-20 max-w-lg pointer-events-auto">
            {/* Reel Kicker */}
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs uppercase tracking-[0.22em] text-[#c9a66b]">
                REEL 05 · THE LEDGER
              </span>
              <span className="h-px w-16 bg-[#c9a66b]/45" />
            </div>

            {/* Display Headline */}
            <h2
              id="ledger-h"
              className="mt-3 font-serif text-4xl xl:text-5xl font-normal tracking-tight text-[#f3ede2] leading-[1.04]"
            >
              {ledger.inscription}<br />
              {ledger.voice}
            </h2>

            {/* Subtext */}
            

            {/* Vertical Milestone Gauge */}
            <div className="mt-4 flex flex-col items-start gap-1 font-mono text-[11px] tracking-widest text-[#c9a66b]/80">
              <span className="font-medium">01</span>
              <span className="w-px h-7 bg-[#c9a66b]/40 ml-1.5" />
              <span className="text-[#a8957f]">13</span>
            </div>
          </div>

          {/* Golden Constellation SVG Vector Path */}
          <svg
            viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
            preserveAspectRatio="none"
            className="absolute inset-0 h-full w-full pointer-events-none z-10"
            aria-hidden="true"
          >
            <defs>
              <filter id="ledger-gold-glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3.5" result="glow" />
                <feComposite in="SourceGraphic" in2="glow" operator="over" />
              </filter>
            </defs>

            {/* Render Connecting Paths */}
            {RANK_PATHS.map((group) => {
              const isActive = group.rankIndex === activeRank;
              const isPast = group.rankIndex < activeRank;
              return group.paths.map((d, pathIdx) => (
                <g key={`path-${group.rankIndex}-${pathIdx}`}>
                  {/* Outer glowing line */}
                  <motion.path
                    d={d}
                    fill="none"
                    stroke={isActive ? "rgba(201, 166, 107, 0.45)" : "rgba(201, 166, 107, 0.15)"}
                    strokeWidth={isActive ? 6 : 3}
                    filter="url(#ledger-gold-glow)"
                    initial={false}
                    animate={{
                      opacity: isActive ? 1 : isPast ? 0.6 : 0.25,
                      strokeWidth: isActive ? 6 : 3,
                    }}
                    transition={{ duration: 0.8 }}
                  />
                  {/* Crisp core line */}
                  <motion.path
                    d={d}
                    fill="none"
                    stroke={isActive ? "#c9a66b" : isPast ? "#b88a62" : "rgba(201, 166, 107, 0.35)"}
                    strokeWidth={isActive ? 2 : 1.2}
                    initial={false}
                    animate={{
                      stroke: isActive ? "#c9a66b" : isPast ? "rgba(201, 166, 107, 0.65)" : "rgba(201, 166, 107, 0.25)",
                      strokeWidth: isActive ? 2 : 1.2,
                    }}
                    transition={{ duration: 0.8 }}
                  />
                </g>
              ));
            })}

            {/* Intermediate Anchor & Junction Dots */}
            {INTERMEDIATE_DOTS.map((dot, idx) => {
              const isActive = dot.rankIndex === activeRank;
              return (
                <g key={`dot-${idx}`}>
                  {isActive && (
                    <circle
                      cx={dot.x}
                      cy={dot.y}
                      r="7"
                      fill="rgba(201, 166, 107, 0.2)"
                    />
                  )}
                  <circle
                    cx={dot.x}
                    cy={dot.y}
                    r={isActive ? 3.5 : 2.5}
                    fill={isActive ? "#f3ede2" : "rgba(243, 237, 226, 0.5)"}
                    stroke="#c9a66b"
                    strokeWidth={isActive ? 1.5 : 1}
                  />
                </g>
              );
            })}
          </svg>

          {/* Interactive HTML Milestone Node Badges */}
          {NODES.map((node) => {
            const pillar = pillars[node.n - 1];
            const isRankActive = node.rankIndex === activeRank;
            const isPillarSelected = selectedPillar === node.n;
            const isPillarHovered = hoveredPillar === node.n;

            // Compute exact percentage coordinates
            const leftPct = (node.x / VIEW_W) * 100;
            const topPct = (node.y / VIEW_H) * 100;

            const numStr = String(node.n).padStart(2, "0");

            return (
              <div
                key={`node-${node.n}`}
                className="absolute z-20 transition-transform duration-500"
                style={{
                  left: `${leftPct}%`,
                  top: `${topPct}%`,
                  transform: "translate(-50%, -50%)",
                }}
              >
                {/* Node trigger button */}
                <button
                  type="button"
                  onClick={() => handleSelectPillar(node.n)}
                  onMouseEnter={() => setHoveredPillar(node.n)}
                  onMouseLeave={() => setHoveredPillar(null)}
                  className="relative group focus:outline-none"
                >
                  {/* Subtle pulsing halo when rank active or selected */}
                  {(isRankActive || isPillarSelected) && (
                    <motion.div
                      className="absolute -inset-2 rounded-full border border-[#c9a66b]/40 pointer-events-none"
                      animate={{ scale: [1, 1.2, 1], opacity: [0.6, 0.15, 0.6] }}
                      transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
                    />
                  )}

                  {/* Circular Image Milestone Avatar */}
                  <div
                    className={cn(
                      "relative w-11 h-11 lg:w-13 lg:h-13 rounded-full overflow-hidden transition-all duration-300",
                      "border-2 shadow-[0_0_15px_rgba(201,166,107,0.35)] bg-[#171513]",
                      isPillarSelected || isPillarHovered
                        ? "border-[#f3ede2] scale-110 shadow-[0_0_25px_rgba(201,166,107,0.8)]"
                        : isRankActive
                          ? "border-[#c9a66b] scale-105"
                          : "border-[#c9a66b]/60 opacity-80 hover:opacity-100 hover:border-[#c9a66b]",
                    )}
                  >
                    <Image
                      src={node.image}
                      alt=""
                      width={52}
                      height={52}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  </div>

                  {/* Node Label Text positioned to right */}
                  <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2.5 w-32 sm:w-36 text-left pointer-events-none">
                    <span className="font-serif text-xs font-semibold text-[#c9a66b] block">
                      {numStr}
                    </span>
                    <span className="font-sans text-[11px] lg:text-xs font-normal text-[#f3ede2] leading-tight block drop-shadow-[0_2px_4px_rgba(0,0,0,0.95)]">
                      {pillar.name}
                    </span>
                  </div>
                </button>
              </div>
            );
          })}

          {/* Floating Pillar Detail Inspector Card (When clicked) */}
          <AnimatePresence>
            {activePillarData && (
              <motion.div
                initial={{ opacity: 0, y: 15, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.96 }}
                transition={{ duration: 0.25 }}
                className="absolute z-40 bottom-4 left-6 sm:left-12 lg:left-16 max-w-md p-5 rounded-sm bg-[#171513]/95 border border-[#c9a66b]/40 backdrop-blur-md shadow-2xl"
              >
                <div className="flex items-center justify-between border-b border-[#c9a66b]/20 pb-2">
                  <span className="font-mono text-[10px] uppercase tracking-widest text-[#c9a66b]">
                    PILLAR {String(activePillarData.n).padStart(2, "0")} · {activePillarData.discipline ? "TACTICAL DISCIPLINE" : "FOUNDATION OF HORSEMANSHIP"}
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedPillar(null)}
                    className="text-xs text-[#a8957f] hover:text-[#f3ede2] transition-colors px-1"
                    aria-label="Close details"
                  >
                    ✕
                  </button>
                </div>
                <h4 className="font-serif text-lg text-[#f3ede2] mt-2 font-normal">
                  {activePillarData.name}
                </h4>
                <div className="mt-2 text-xs text-[#ddd0bc]/85 space-y-1">
                  <p><strong className="text-[#c9a66b] font-medium">Core Skill:</strong> {activePillarData.skill}</p>
                  <p><strong className="text-[#c9a66b] font-medium">Forged Trait:</strong> {activePillarData.trait}</p>
                </div>
                <p className="mt-2 text-xs italic text-[#ddd0bc]/70 leading-relaxed">
                  &ldquo;{activePillarData.sub}&rdquo;
                </p>
                <div className="mt-3 pt-2 border-t border-[#c9a66b]/15 flex items-center justify-between">
                  <span className="text-[11px] font-mono text-[#a8957f]">
                    Mapped to {ranks[activeRank].name}
                  </span>
                  <Link
                    href={`/curriculum#rank-${ranks[activeRank].id}`}
                    className="text-xs font-mono text-[#c9a66b] hover:text-white flex items-center gap-1 transition-colors"
                  >
                    Drill Protocol →
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Mobile swipe helper badge */}
          <div className="lg:hidden absolute bottom-2 right-4 z-30 pointer-events-none bg-[#171513]/80 border border-[#c9a66b]/30 px-2.5 py-1 text-[10px] font-mono text-[#c9a66b]">
            ← Swipe to explore 13 pillars →
          </div>
        </div>
      </div>

      {/* ==============================================================
          BOTTOM FOUR-RANK DECK
          ============================================================== */}
      <div
        className="w-full border-t border-[#c9a66b]/20 bg-[#12100e] text-[#f3ede2] z-30 shrink-0"
        role="group"
        aria-label="Four BSAH Ranks"
      >
        <div className="grid grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 divide-x divide-[#c9a66b]/15">
          {RANK_CARDS.map((r, i) => {
            const isActive = activeRank === i;
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => handleSelectRank(i)}
                onFocus={() => handleSelectRank(i)}
                aria-pressed={isActive}
                className={cn(
                  "relative p-3.5 sm:p-4 lg:p-5 text-left transition-all duration-300 group overflow-hidden flex flex-col justify-between min-h-[130px] lg:min-h-[145px]",
                  isActive ? "bg-[#1c1814]" : "bg-[#12100e] hover:bg-[#181411]",
                )}
              >
                {/* Active indicator top bar */}
                <div
                  className={cn(
                    "absolute top-0 left-0 right-0 h-0.5 transition-colors duration-500",
                    isActive ? "bg-[#c9a66b]" : "bg-transparent group-hover:bg-[#c9a66b]/30",
                  )}
                />

                {/* Background image on right with smooth gradient fade */}
                <div className="absolute top-0 right-0 bottom-0 w-3/5 pointer-events-none opacity-40 group-hover:opacity-60 transition-opacity duration-500">
                  <Image
                    src={r.image}
                    alt={r.name}
                    fill
                    className="object-cover object-right"
                    sizes="(max-width: 768px) 50vw, 25vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-[#1c1814] via-[#1c1814]/70 to-transparent" />
                </div>

                {/* Left Card Information */}
                <div className="relative z-10 pr-2">
                  {/* Roman Numeral */}
                  <span className="font-serif text-2xl lg:text-3xl font-normal text-[#c9a66b] block">
                    {r.numeral}
                  </span>

                  {/* Rank Title */}
                  <span className="font-serif text-sm sm:text-base lg:text-lg text-[#f3ede2] font-medium block mt-0.5 leading-snug">
                    {r.name}
                  </span>

                  {/* Subtitle / Focus */}
                  <span className="text-[11px] lg:text-xs text-[#ddd0bc]/75 block mt-0.5 font-light">
                    {r.short}
                  </span>
                </div>

                {/* Bottom interactive circle arrow button */}
                <div className="relative z-10 mt-2 flex items-center justify-between">
                  <span
                    className={cn(
                      "w-6 h-6 rounded-full border flex items-center justify-center transition-all duration-300",
                      isActive
                        ? "border-[#c9a66b] bg-[#c9a66b]/20 text-[#c9a66b] shadow-[0_0_10px_rgba(201,166,107,0.4)]"
                        : "border-[#c9a66b]/40 text-[#c9a66b]/70 group-hover:border-[#c9a66b] group-hover:text-[#c9a66b]",
                    )}
                  >
                    <svg
                      width="10"
                      height="10"
                      viewBox="0 0 16 16"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.75"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M3 8h10M9 4l4 4-4 4" />
                    </svg>
                  </span>

                  {/* Pillars included indicator */}
                  <span className="text-[10px] font-mono text-[#a8957f]/70">
                    Pillars {r.pillars[0]}–{r.pillars[r.pillars.length - 1]}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
    <div className="tone-light editorial-details gutter"><p>{ledger.body}</p></div>
    </>
  );
}
