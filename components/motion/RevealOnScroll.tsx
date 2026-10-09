"use client";

import { motion, type Variants } from "motion/react";
import type { ReactNode } from "react";
import { fadeUp, inViewOnce, staggerChildren, transition } from "@/lib/motion/tokens";

type RevealOnScrollProps = {
  children: ReactNode;
  /** rise: fade + 24px rise (default) · fade: opacity only */
  effect?: "rise" | "fade";
  delay?: number;
  /** Stagger direct children instead of revealing the block as one. Wrap each child in <RevealItem>. */
  stagger?: boolean;
  as?: "div" | "section" | "ul" | "ol" | "article";
  className?: string;
};

function blockVariants(effect: "rise" | "fade", delay: number): Variants {
  const rise = effect === "rise";
  return {
    hidden: rise ? { opacity: 0, y: 24 } : { opacity: 0 },
    visible: rise
      ? { opacity: 1, y: 0, transition: { ...transition.reveal, delay } }
      : { opacity: 1, transition: { ...transition.reveal, delay } },
  };
}

/** Reveals content once as it scrolls into view. */
export function RevealOnScroll({
  children,
  effect = "rise",
  delay = 0,
  stagger = false,
  as = "div",
  className,
}: RevealOnScrollProps) {
  const Tag = motion[as];
  const variants = stagger ? staggerChildren(delay) : blockVariants(effect, delay);
  return (
    <Tag className={className} variants={variants} initial="hidden" whileInView="visible" viewport={inViewOnce}>
      {children}
    </Tag>
  );
}

/** A child of <RevealOnScroll stagger>. */
export function RevealItem({
  children,
  as = "div",
  className,
}: {
  children: ReactNode;
  as?: "div" | "li" | "article";
  className?: string;
}) {
  const Tag = motion[as];
  return (
    <Tag className={className} variants={fadeUp}>
      {children}
    </Tag>
  );
}
