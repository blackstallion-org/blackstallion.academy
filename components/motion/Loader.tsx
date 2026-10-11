"use client";

import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { MONOGRAM_VIEWBOX, blaze, earLeft, earRight } from "@/components/brand/paths";
import { ease } from "@/lib/motion/tokens";
import { cn } from "@/lib/utils";

const SESSION_KEY = "bsah-loaded";

/**
 * Runs before first paint (see app/layout.tsx). Marks <html> when the loader
 * should not show: already seen this session, or reduced motion.
 */
export const loaderBootScript = `try{if(sessionStorage.getItem("${SESSION_KEY}")||matchMedia("(prefers-reduced-motion: reduce)").matches){document.documentElement.dataset.bsahLoaded="1"}}catch(e){}`;

const fill = {
  pathLength: { duration: 0.8, ease: ease.citadel },
  fillOpacity: { duration: 0.35, delay: 0.55, ease: ease.citadel },
};

/**
 * The loader mark on its own: the ears draw in brass line, fill, then turn
 * inward as if listening (signature move 4). About 1.2 s.
 * Used by <Loader>.
 */
export function LoaderMark({ className, onDone }: { className?: string; onDone?: () => void }) {
  const part = { hidden: { pathLength: 0, fillOpacity: 0 }, visible: { pathLength: 1, fillOpacity: 1, transition: fill } };
  // Ears start splayed outward and turn in to the resting mark, as if listening.
  const ear = (splay: number) => ({
    hidden: { pathLength: 0, fillOpacity: 0, rotate: splay },
    visible: {
      pathLength: 1,
      fillOpacity: 1,
      rotate: 0,
      transition: { ...fill, rotate: { duration: 0.45, delay: 0.75, ease: ease.citadel } },
    },
  });

  return (
    <motion.svg
      viewBox={MONOGRAM_VIEWBOX}
      className={cn("h-20 w-20 text-dust", className)}
      initial="hidden"
      animate="visible"
      aria-hidden
      onAnimationComplete={() => onDone?.()}
    >
      <g fill="currentColor" stroke="currentColor" strokeWidth="0.6" strokeLinejoin="round">
        <motion.path d={earLeft} variants={ear(-7)} style={{ originX: "60%", originY: "100%" }} />
        <motion.path d={earRight} variants={ear(7)} style={{ originX: "40%", originY: "100%" }} />
        <motion.path d={blaze} variants={part} />
      </g>
    </motion.svg>
  );
}

/**
 * First-visit loader (≤ 1.5 s): the brass ears draw, the crest name fades in,
 * the obsidian lifts. Skipped for repeat visits in the session and under reduced motion.
 */
export function Loader() {
  const [state, setState] = useState<"show" | "leaving" | "gone">("show");

  useEffect(() => {
    if (document.documentElement.dataset.bsahLoaded) {
      // Already hidden by CSS before paint; unmount on the next frame.
      const id = requestAnimationFrame(() => setState("gone"));
      return () => cancelAnimationFrame(id);
    }
    try {
      sessionStorage.setItem(SESSION_KEY, "1");
    } catch {}
    const leave = window.setTimeout(() => setState("leaving"), 1150);
    return () => window.clearTimeout(leave);
  }, []);

  if (state === "gone") return null;

  return (
    <motion.div
      className="bsah-loader fixed inset-0 z-[100] grid place-items-center bg-night"
      initial={{ opacity: 1 }}
      animate={{ opacity: state === "leaving" ? 0 : 1 }}
      transition={{ duration: 0.35, ease: ease.citadel }}
      onAnimationComplete={() => state === "leaving" && setState("gone")}
      aria-hidden
    >
      <div className="flex flex-col items-center gap-6">
        <LoaderMark className="h-16 w-16 sm:h-20 sm:w-20" />
        <motion.p
          className="t-inscribe text-xs tracking-[0.2em] text-brass/80"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.55, ease: ease.citadel }}
        >
          BLACK STALLION
        </motion.p>
      </div>
    </motion.div>
  );
}
