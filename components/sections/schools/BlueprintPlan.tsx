"use client";

import { AnimatePresence, motion } from "motion/react";
import type { Tier } from "@/lib/content/schools";
import { ease } from "@/lib/motion/tokens";
import { cn } from "@/lib/utils";

const ink = "var(--color-brass)";
const gold = "var(--color-gold)";

/**
 * S09 architectural plan. Redraws when the tier changes: site boundary grows,
 * stalls are added one by one, lounge, floodlights and the VIP deck appear.
 */
export function BlueprintPlan({ tier, className }: { tier: Tier; className?: string }) {
  const site = { standard: { w: 520, h: 300 }, signature: { w: 640, h: 360 }, royal: { w: 740, h: 410 } }[tier.id];
  const ox = (800 - site.w) / 2;
  const oy = (460 - site.h) / 2;
  const arena = { x: ox + 30, y: oy + 40, w: site.w * 0.58, h: site.h * 0.62 };
  const stallW = Math.min(42, (site.w - 60) / tier.stables);
  const stallsX = ox + 30;
  const stallsY = oy + site.h - 70;
  const hasLounge = tier.id !== "standard";
  const hasLights = tier.id !== "standard";
  const hasDeck = tier.id === "royal";
  const t = { duration: 0.7, ease: ease.citadel };

  return (
    <svg viewBox="0 0 800 460" className={cn("h-full w-full", className)} role="img" aria-label={`${tier.name} site plan: ${tier.includes.join(", ")}`}>
      <defs>
        <pattern id="bp-grid" width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M20 0H0V20" fill="none" stroke="rgb(197 160 89 / 0.08)" strokeWidth="1" />
        </pattern>
        <pattern id="bp-sand" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="6" stroke="rgb(197 160 89 / 0.18)" strokeWidth="1" />
        </pattern>
      </defs>
      <rect width="800" height="460" fill="url(#bp-grid)" />

      {/* Site boundary */}
      <motion.rect
        initial={false}
        animate={{ x: ox, y: oy, width: site.w, height: site.h }}
        transition={t}
        fill="none"
        stroke={ink}
        strokeWidth="1"
        strokeDasharray="6 5"
      />
      <motion.text initial={false} animate={{ x: ox + 8, y: oy - 8 }} transition={t} className="font-mono" fontSize="11" fill="rgb(138 118 96)">
        SITE · {tier.acres.toUpperCase()}
      </motion.text>

      {/* Arena */}
      <motion.rect initial={false} animate={arena} transition={t} fill="url(#bp-sand)" stroke={gold} strokeWidth="1.4" rx="2" />
      <motion.text initial={false} animate={{ x: arena.x + 12, y: arena.y + 22 }} transition={t} className="label" fontSize="11" fill={gold} letterSpacing="2">
        {tier.id === "royal" ? "CAVALRY ARENA" : tier.id === "signature" ? "FULL ARENA" : "SAND ARENA"}
      </motion.text>
      {/* Tent-pegging lane */}
      <motion.line initial={false} animate={{ x1: arena.x + 20, x2: arena.x + arena.w - 20, y1: arena.y + arena.h / 2, y2: arena.y + arena.h / 2 }} transition={t} stroke={ink} strokeWidth="0.8" strokeDasharray="2 6" />
      <motion.circle initial={false} animate={{ cx: arena.x + arena.w - 34, cy: arena.y + arena.h / 2 }} transition={t} r="3" fill={gold} />

      {/* Floodlights */}
      <AnimatePresence>
        {hasLights &&
          [
            [arena.x, arena.y],
            [arena.x + arena.w, arena.y],
            [arena.x, arena.y + arena.h],
            [arena.x + arena.w, arena.y + arena.h],
          ].map(([x, y], i) => (
            <motion.g key={`l${i}`} initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ ...t, delay: 0.3 + i * 0.06 }}>
              <circle cx={x} cy={y} r="14" fill="rgb(230 202 101 / 0.12)" />
              <circle cx={x} cy={y} r="3.5" fill={gold} />
            </motion.g>
          ))}
      </AnimatePresence>

      {/* Stable block */}
      {Array.from({ length: 12 }, (_, i) => (
        <motion.rect
          key={`s${i}`}
          initial={false}
          animate={{
            x: stallsX + i * stallW,
            y: stallsY,
            width: Math.max(0, stallW - 4),
            height: 44,
            opacity: i < tier.stables ? 1 : 0,
          }}
          transition={{ ...t, delay: i < tier.stables ? i * 0.04 : 0 }}
          fill="rgb(42 29 18 / 0.8)"
          stroke={ink}
          strokeWidth="1"
        />
      ))}
      <motion.text initial={false} animate={{ x: stallsX, y: stallsY + 60 }} transition={t} className="font-mono" fontSize="11" fill="rgb(200 176 138)">
        {tier.stables} STABLES
      </motion.text>

      {/* Tack room (all tiers) */}
      <motion.rect initial={false} animate={{ x: arena.x + arena.w + 24, y: arena.y, width: 70, height: 50 }} transition={t} fill="none" stroke={ink} strokeWidth="1" />
      <motion.text initial={false} animate={{ x: arena.x + arena.w + 32, y: arena.y + 30 }} transition={t} className="label" fontSize="10" fill="rgb(200 176 138)" letterSpacing="1.5">
        TACK
      </motion.text>

      <AnimatePresence>
        {hasLounge && (
          <motion.g key="lounge" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ ...t, delay: 0.2 }}>
            <rect x={arena.x + arena.w + 24} y={arena.y + 64} width="110" height="56" fill="none" stroke={gold} strokeWidth="1" />
            <text x={arena.x + arena.w + 32} y={arena.y + 96} className="label" fontSize="10" fill={gold} letterSpacing="1.5">
              AC LOUNGE
            </text>
          </motion.g>
        )}
        {hasDeck && (
          <motion.g key="deck" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ ...t, delay: 0.35 }}>
            <rect x={arena.x + arena.w + 24} y={arena.y + 134} width="140" height="60" fill="rgb(230 202 101 / 0.08)" stroke={gold} strokeWidth="1.4" />
            <text x={arena.x + arena.w + 32} y={arena.y + 168} className="label" fontSize="10" fill={gold} letterSpacing="1.5">
              VIP DECK · STPCI
            </text>
          </motion.g>
        )}
      </AnimatePresence>

      {/* North arrow */}
      <g transform="translate(760 40)" fill="none" stroke={ink}>
        <circle r="14" strokeWidth="0.8" />
        <path d="M0 -10 L4 4 L0 1 L-4 4 Z" fill={ink} />
        <text y="28" textAnchor="middle" fontSize="9" fill="rgb(138 118 96)" className="font-mono" stroke="none">
          N
        </text>
      </g>
    </svg>
  );
}
