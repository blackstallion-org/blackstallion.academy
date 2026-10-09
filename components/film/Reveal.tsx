"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";
import { ease } from "@/lib/motion/tokens";

type RevealProps = {
  children: ReactNode;
  delay?: number;
  y?: number;
  amount?: number;
  className?: string;
  as?: "div" | "p" | "li" | "span" | "section" | "figure";
};

/** The default reveal: rise and fade once, a little before fully in view. */
export function Reveal({ children, delay = 0, y = 28, amount = 0.3, className, as = "div" }: RevealProps) {
  const Tag = motion[as];
  return (
    <Tag
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount }}
      transition={{ duration: 0.9, ease: ease.citadel, delay }}
    >
      {children}
    </Tag>
  );
}
