"use client";

import { ReactLenis } from "lenis/react";
import { useReducedMotion } from "@/lib/motion/reduced";
import type { ReactNode } from "react";

/**
 * Lenis smooth scroll for the whole site. Off under reduced motion, where the
 * browser's native scroll is kinder.
 */
export function SmoothScroll({ children }: { children: ReactNode }) {
  const reduced = useReducedMotion();
  if (reduced) return <>{children}</>;
  return (
    <ReactLenis root options={{ lerp: 0.065, wheelMultiplier: 0.85, anchors: true }}>
      {children}
    </ReactLenis>
  );
}
