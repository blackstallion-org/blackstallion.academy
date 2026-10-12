"use client";

import { motion } from "motion/react";
import { useEffect, useState, type ReactNode } from "react";
import { cinematic, openingDelay } from "@/lib/motion/cinematic";
import { useReducedMotion } from "@/lib/motion/reduced";
import { ease } from "@/lib/motion/tokens";
import { cn } from "@/lib/utils";

type SplitRevealProps = {
  id?: string;
  /** Accessible name of the opening region. */
  label: string;
  /** The full-bleed picture (video or image) that the masks open onto. It must fill its parent. */
  media: ReactNode;
  /** Where the cut crosses the top and bottom edges, in % of the width. Asymmetric by default. */
  cut?: [top: number, bottom: number];
  className?: string;
  /** Overlay copy and controls. Receives `open` so it can enter after the masks part. */
  children: (open: boolean) => ReactNode;
};

/**
 * Signature move for the home page: two leather masks, cut on a diagonal, part to reveal the film.
 * The picture settles from a slight push-in while they go. Two DOM layers, clip-path + transform only.
 *
 * - Waits for the first-visit loader, never plays behind it.
 * - Reduced motion: no masks, no push-in; the copy simply fades.
 * - Without JavaScript the masks are hidden (noscript style), so the film is never trapped behind them.
 */
export function SplitReveal({ id, label, media, cut = [57, 41], className, children }: SplitRevealProps) {
  const reduced = useReducedMotion();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (reduced) {
      const id = requestAnimationFrame(() => setOpen(true));
      return () => cancelAnimationFrame(id);
    }
    const t = window.setTimeout(() => setOpen(true), openingDelay() * 1000);
    return () => window.clearTimeout(t);
  }, [reduced]);

  const [top, bottom] = cut;
  const leftMask = `polygon(0 0, ${top}% 0, ${bottom}% 100%, 0 100%)`;
  const rightMask = `polygon(${top}% 0, 100% 0, 100% 100%, ${bottom}% 100%)`;

  return (
    <section id={id} aria-label={label} className={cn("tone-dark relative h-[100svh] min-h-[560px] w-full overflow-hidden bg-night", className)}>
      <motion.div
        className="absolute inset-0"
        initial={false}
        animate={{ scale: open || reduced ? 1 : 1.12 }}
        transition={{ duration: 2.8, ease: ease.citadel }}
      >
        {media}
      </motion.div>

      {children(open)}

      {!reduced && (
        <div aria-hidden className="bsah-split-masks pointer-events-none absolute inset-0 z-30">
          <motion.div
            className="surface-leather absolute inset-0"
            style={{ clipPath: leftMask }}
            initial={false}
            animate={{ x: open ? "-66%" : "0%" }}
            transition={{ duration: cinematic.signature, ease: ease.inOut }}
          />
          <motion.div
            className="surface-leather absolute inset-0"
            style={{ clipPath: rightMask }}
            initial={false}
            animate={{ x: open ? "66%" : "0%" }}
            transition={{ duration: cinematic.signature, ease: ease.inOut, delay: 0.12 }}
          />
          {/* The seam: an antique-gold hairline on the cut that burns off as the masks part */}
          <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <motion.line
              x1={top}
              y1={0}
              x2={bottom}
              y2={100}
              stroke="var(--color-antique)"
              strokeWidth="1.2"
              vectorEffect="non-scaling-stroke"
              initial={{ pathLength: 0, opacity: 1 }}
              animate={open ? { pathLength: 1, opacity: 0 } : { pathLength: 1, opacity: 1 }}
              transition={open ? { duration: 0.5, ease: ease.citadel } : { duration: 0.9, ease: ease.citadel, delay: 0.2 }}
            />
          </svg>
        </div>
      )}
      <noscript>
        <style>{".bsah-split-masks{display:none}"}</style>
      </noscript>
    </section>
  );
}
