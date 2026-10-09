"use client";

import { motion } from "motion/react";
import { inViewOnce, lineReveal, staggerChildren } from "@/lib/motion/tokens";
import { cn } from "@/lib/utils";

type SplitLinesProps = {
  /** One string per line. Breaking lines by hand keeps the rag deliberate. */
  lines: string[];
  as?: "h1" | "h2" | "h3" | "p";
  /** "mount" for heroes above the fold, "inView" for everything else. */
  trigger?: "mount" | "inView";
  delay?: number;
  className?: string;
  lineClassName?: string;
};

/**
 * Signature move 1 (dust reveal): each line rises out of a mask, staggered.
 * Under reduced motion MotionConfig skips the transform and the text simply appears.
 */
export function SplitLines({
  lines,
  as = "h2",
  trigger = "inView",
  delay = 0,
  className,
  lineClassName,
}: SplitLinesProps) {
  const Tag = motion[as];
  const play =
    trigger === "mount"
      ? { initial: "hidden" as const, animate: "visible" as const }
      : { initial: "hidden" as const, whileInView: "visible" as const, viewport: inViewOnce };

  return (
    <Tag className={className} variants={staggerChildren(delay)} {...play}>
      {lines.map((line, i) => (
        // pb/-mb keeps descenders from being clipped by the mask
        <span key={i} className="block overflow-hidden pb-[0.12em] -mb-[0.12em]">
          <motion.span className={cn("block will-change-transform", lineClassName)} variants={lineReveal}>
            {line}
          </motion.span>
        </span>
      ))}
    </Tag>
  );
}
