"use client";

import { MotionConfig } from "motion/react";
import type { ReactNode } from "react";
import { transition } from "@/lib/motion/tokens";

/**
 * Global motion defaults: the house curve, and reduced motion honoured
 * everywhere (transforms are skipped, opacity still fades).
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <MotionConfig reducedMotion="user" transition={transition.ui}>
      {children}
    </MotionConfig>
  );
}
