"use client";

import { motion } from "motion/react";
import type { ElementType } from "react";
import { ease } from "@/lib/motion/tokens";
import { cn } from "@/lib/utils";

const sizes = {
  poster: "text-poster",
  "1": "text-display-1",
  "2": "text-display-2",
  "3": "text-display-3",
} as const;

const voiceColors = {
  gold: "text-gold",
  bone: "text-bone",
  sand: "text-sand",
  blood: "text-blood",
  brass: "text-brass",
} as const;

type HeadlineProps = {
  /** Line 1: wide hairline capitals. */
  inscription: string;
  /** Line 2: heavy lowercase. */
  voice: string;
  as?: ElementType;
  size?: keyof typeof sizes;
  voiceColor?: keyof typeof voiceColors;
  /** "mount" above the fold, "inView" elsewhere, "none" when a parent animates it. */
  animate?: "mount" | "inView" | "none";
  delay?: number;
  className?: string;
  inscriptionClassName?: string;
  voiceClassName?: string;
  id?: string;
};

/**
 * The two-voice headline (Blueprint 2.3). One family, two voices:
 * INSCRIPTION (calm, carved) then the war voice (the line that lands).
 * Each line rises out of a mask.
 */
export function Headline({
  inscription,
  voice,
  as: Tag = "h2",
  size = "2",
  voiceColor = "gold",
  animate = "inView",
  delay = 0,
  className,
  inscriptionClassName,
  voiceClassName,
  id,
}: HeadlineProps) {
  const trigger =
    animate === "none"
      ? {}
      : animate === "mount"
        ? { initial: "hidden", animate: "visible" }
        : { initial: "hidden", whileInView: "visible", viewport: { once: true, amount: 0.5 } };

  const line = (i: number) => ({
    hidden: { y: "105%" },
    visible: { y: "0%", transition: { duration: 1.1, ease: ease.citadel, delay: delay + i * 0.14 } },
  });

  return (
    <Tag id={id} className={cn(sizes[size], "text-balance", className)}>
      <motion.span className="block" {...trigger}>
        <span className="block overflow-hidden pb-[0.06em]">
          <motion.span
            variants={animate === "none" ? undefined : line(0)}
            className={cn("t-inscribe block text-[0.5em] leading-[1.02] text-bone", inscriptionClassName)}
          >
            {inscription}
          </motion.span>
        </span>
        <span className="block overflow-hidden pb-[0.12em]">
          <motion.span
            variants={animate === "none" ? undefined : line(1)}
            className={cn("t-voice block", voiceColors[voiceColor], voiceClassName)}
          >
            {voice}
          </motion.span>
        </span>
      </motion.span>
    </Tag>
  );
}
