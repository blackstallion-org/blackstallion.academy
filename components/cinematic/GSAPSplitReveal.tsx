"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface GSAPSplitRevealProps {
  /** The full text string to animate */
  text: string;
  /** "chars" | "words" | "lines" */
  splitType?: "chars" | "words" | "lines";
  /** Tailwind / CSS class string for the rendered element */
  className?: string;
  as?: "h1" | "h2" | "h3" | "p" | "span";
  /** Delay in seconds before the animation starts (for on-mount) */
  delay?: number;
  /** If true, triggers immediately on mount; if false, uses scroll trigger */
  immediate?: boolean;
  /** stagger between items */
  stagger?: number;
}

/**
 * Cinematic GSAP SplitText reveal. Each char/word rises out of a clip mask.
 * Inspired by the Awwwards GSAP reference project patterns.
 * Respects prefers-reduced-motion.
 */
export function GSAPSplitReveal({
  text,
  splitType = "chars",
  className,
  as: Tag = "h2",
  delay = 0,
  immediate = false,
  stagger = 0.025,
}: GSAPSplitRevealProps) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let cleanup: (() => void) | undefined;

    async function animate() {
      const { gsap } = await import("gsap");
      const { SplitText } = await import("gsap/SplitText");
      const { ScrollTrigger } = await import("gsap/ScrollTrigger");
      gsap.registerPlugin(SplitText, ScrollTrigger);

      const el = ref.current;
      if (!el) return;

      const split = SplitText.create(el, { type: splitType, linesClass: "overflow-hidden" });
      const targets =
        splitType === "chars"
          ? split.chars
          : splitType === "words"
          ? split.words
          : split.lines;

      gsap.set(targets, { y: "105%", opacity: 0 });

      const tl = gsap.timeline(
        immediate
          ? { delay }
          : {
              delay,
              scrollTrigger: {
                trigger: el,
                start: "top 85%",
                once: true,
              },
            }
      );

      tl.to(targets, {
        y: "0%",
        opacity: 1,
        duration: 1.1,
        ease: "power3.out",
        stagger,
      });

      cleanup = () => {
        tl.kill();
        split.revert();
      };
    }

    animate();
    return () => cleanup?.();
  }, [text, splitType, delay, immediate, stagger]);

  return (
    // @ts-expect-error dynamic tag
    <Tag ref={ref} className={cn("overflow-hidden", className)}>
      {text}
    </Tag>
  );
}
