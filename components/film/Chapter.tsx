"use client";

import { useScroll, type MotionValue } from "motion/react";
import { useRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type ChapterProps = {
  id: string;
  /** Scroll length in screen heights. The frame stays pinned for (length - 1) screens. */
  length?: number;
  /** Accessible name for the chapter. */
  label: string;
  className?: string;
  children: (progress: MotionValue<number>) => ReactNode;
};

/**
 * A pinned, scroll-scrubbed chapter: a tall section with a sticky full-screen
 * frame. `progress` runs 0 → 1 while the frame is pinned.
 */
export function Chapter({ id, length = 2.5, label, className, children }: ChapterProps) {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });

  return (
    <section
      ref={ref}
      id={id}
      aria-label={label}
      data-chapter={id}
      className={cn("relative", className)}
      style={{ height: `${length * 100}svh` }}
    >
      <div className="sticky top-0 h-[100svh] w-full overflow-hidden">{children(scrollYProgress)}</div>
    </section>
  );
}
