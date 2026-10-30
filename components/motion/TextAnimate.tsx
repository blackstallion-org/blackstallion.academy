"use client";

import { motion, type Variants } from "motion/react";
import { Fragment } from "react";
import { useReducedMotion } from "@/lib/motion/reduced";
import { ease } from "@/lib/motion/tokens";

/**
 * Text that arrives once, as it scrolls into view: the three moves of magicui's TextAnimate, built on `motion` (no new dependency).
 *
 *   blurIn     the whole line sharpens out of a blur
 *   slideUp    word by word, each rising out of its own clipped line
 *   blurInUp   character by character, rising and sharpening
 *
 * The full string stays in the accessibility tree (one aria-label); the split pieces are aria-hidden. Reduced motion: a plain fade.
 * Weighted, never bouncy: the house curve, short staggers.
 */
export type TextAnimation = "blurIn" | "slideUp" | "blurInUp";

const PIECE: Record<TextAnimation, Variants> = {
  blurIn: { hidden: { opacity: 0, filter: "blur(12px)" }, show: { opacity: 1, filter: "blur(0px)" } },
  slideUp: { hidden: { y: "105%" }, show: { y: "0%" } },
  blurInUp: { hidden: { opacity: 0, y: "0.35em", filter: "blur(8px)" }, show: { opacity: 1, y: "0em", filter: "blur(0px)" } },
};

const FADE: Variants = { hidden: { opacity: 0 }, show: { opacity: 1 } };

export function TextAnimate({
  children,
  as = "p",
  animation = "blurInUp",
  by,
  delay = 0,
  duration,
  className,
}: {
  children: string;
  as?: "p" | "h1" | "h2" | "h3" | "span" | "div";
  animation?: TextAnimation;
  /** Defaults: blurIn → line, slideUp → word, blurInUp → character. */
  by?: "line" | "word" | "character";
  delay?: number;
  duration?: number;
  className?: string;
}) {
  const reduced = useReducedMotion();
  const Tag = motion[as];
  const unit = by ?? (animation === "blurIn" ? "line" : animation === "slideUp" ? "word" : "character");
  const step = unit === "character" ? 0.028 : unit === "word" ? 0.075 : 0;
  const d = duration ?? (unit === "character" ? 0.7 : unit === "word" ? 0.9 : 1.2);
  const piece = reduced ? FADE : PIECE[animation];
  const t = { duration: reduced ? 0.6 : d, ease: ease.citadel };

  const words = children.split(" ");

  return (
    <Tag
      aria-label={children}
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.4 }}
      variants={{ hidden: {}, show: { transition: { staggerChildren: reduced ? 0 : step, delayChildren: delay } } }}
    >
      {unit === "line" || reduced ? (
        <motion.span aria-hidden className="inline-block" variants={piece} transition={t}>
          {children}
        </motion.span>
      ) : (
        words.map((word, wi) => (
          <Fragment key={wi}>
            <span aria-hidden className={animation === "slideUp" ? "inline-block overflow-hidden pb-[0.12em] align-bottom" : "inline-block whitespace-nowrap"}>
              {unit === "word" ? (
                <motion.span className="inline-block" variants={piece} transition={t}>
                  {word}
                </motion.span>
              ) : (
                Array.from(word).map((ch, ci) => (
                  <motion.span key={ci} className="inline-block" variants={piece} transition={t}>
                    {ch}
                  </motion.span>
                ))
              )}
            </span>
            {wi < words.length - 1 && " "}
          </Fragment>
        ))
      )}
    </Tag>
  );
}
