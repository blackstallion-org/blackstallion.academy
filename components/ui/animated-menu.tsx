"use client";

import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

/**
 * Letter-roll text (from the supplied "animated menu" component, adapted to this codebase):
 * - `motion/react` instead of `framer-motion` (same API; the project's motion library),
 * - the project's `cn` (clsx + tailwind-merge with BSAH's custom scales) instead of `@/lib/cn`,
 * - driven by `active` so a parent link can trigger it on hover AND keyboard focus,
 * - accessible: screen readers get the text once; the two animated letter rows are hidden from them,
 * - reduced motion: renders plain text with no movement.
 * Styling stays in Tailwind classes on the element; nothing is added to global CSS.
 */
const STAGGER = 0.035;

type Props = {
  children: string;
  className?: string;
  /** Stagger outwards from the middle letter instead of left to right. */
  center?: boolean;
  /** When provided, the parent controls the roll (e.g. hover or focus on a whole link row). */
  active?: boolean;
};

export function AnimatedMenuText({ children, className, center = false, active }: Props) {
  const reduced = useReducedMotion();
  if (reduced) return <span className={cn("relative block", className)}>{children}</span>;

  const letters = children.split("");
  const delay = (i: number) => (center ? STAGGER * Math.abs(i - (letters.length - 1) / 2) : STAGGER * i);
  const controlled = active !== undefined;

  return (
    <motion.span
      initial="initial"
      animate={controlled ? (active ? "hovered" : "initial") : undefined}
      whileHover={controlled ? undefined : "hovered"}
      className={cn("relative block overflow-hidden", className)}
      style={{ lineHeight: 0.98 }}
    >
      <span className="sr-only">{children}</span>
      <span aria-hidden className="block whitespace-pre">
        {letters.map((l, i) => (
          <motion.span
            key={i}
            className="inline-block"
            variants={{ initial: { y: 0 }, hovered: { y: "-100%" } }}
            transition={{ ease: [0.65, 0, 0.35, 1], duration: 0.45, delay: delay(i) }}
          >
            {l === " " ? " " : l}
          </motion.span>
        ))}
      </span>
      <span aria-hidden className="absolute inset-0 block whitespace-pre">
        {letters.map((l, i) => (
          <motion.span
            key={i}
            className="inline-block"
            variants={{ initial: { y: "100%" }, hovered: { y: 0 } }}
            transition={{ ease: [0.65, 0, 0.35, 1], duration: 0.45, delay: delay(i) }}
          >
            {l === " " ? " " : l}
          </motion.span>
        ))}
      </span>
    </motion.span>
  );
}

/** Same component under the name used by the original snippet. */
export { AnimatedMenuText as Component };
