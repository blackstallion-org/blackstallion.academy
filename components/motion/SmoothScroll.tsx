"use client";

import { ReactLenis } from "lenis/react";
import { useReducedMotion } from "@/lib/motion/reduced";
import type { ReactNode } from "react";

/**
 * Lenis smooth scroll for the whole site. Off under reduced motion, where the
 * browser's native scroll is kinder.
 *
 * The root instance is mounted beside the page rather than around it: `useLenis()` reads the root instance from
 * Lenis's own store, so nothing changes for consumers, but toggling Lenis no longer swaps the element that wraps
 * the page. (It used to: under reduced motion the wrapper changed type right after hydration, which unmounted and
 * re-rendered the entire site a second time.)
 */
export function SmoothScroll({ children }: { children: ReactNode }) {
  const reduced = useReducedMotion();
  return (
    <>
      {!reduced && <ReactLenis root options={{ lerp: 0.065, wheelMultiplier: 0.85, anchors: true }} />}
      {children}
    </>
  );
}
