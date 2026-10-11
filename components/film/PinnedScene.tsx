"use client";

import { useScroll, type MotionValue } from "motion/react";
import { useReducedMotion } from "@/lib/motion/reduced";
import { useRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type PinnedSceneProps = {
  id?: string;
  /** Scroll length in screen heights. The frame stays pinned for (length - 1) screens. */
  length?: number;
  label?: string;
  className?: string;
  frameClassName?: string;
  /** Rendered instead of the pinned frame when the visitor prefers reduced motion. */
  reducedFallback?: ReactNode;
  children: (progress: MotionValue<number>) => ReactNode;
};

/**
 * A tall section with a sticky full-screen frame. `progress` runs 0 → 1 while pinned.
 * Under reduced motion the section is not pinned: `reducedFallback` (stacked frames) renders instead.
 */
export function PinnedScene({
  id,
  length = 2.5,
  label,
  className,
  frameClassName,
  reducedFallback,
  children,
}: PinnedSceneProps) {
  const ref = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });

  if (reduced && reducedFallback) {
    return (
      <section id={id} aria-label={label} className={cn("relative", className)}>
        {reducedFallback}
      </section>
    );
  }

  return (
    <section
      ref={ref}
      id={id}
      aria-label={label}
      className={cn("relative", className)}
      style={{ height: `${length * 100}svh` }}
    >
      <div className={cn("sticky top-0 h-[100svh] w-full overflow-hidden", frameClassName)}>
        {children(scrollYProgress)}
      </div>
    </section>
  );
}
