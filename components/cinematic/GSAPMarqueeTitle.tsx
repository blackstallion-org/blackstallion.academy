"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface GSAPMarqueeTitleProps {
  /** Array of title strings to show stacked with clip-path Awwwards style */
  lines: string[];
  className?: string;
  lineClassName?: string;
  /** Delay before animation starts */
  delay?: number;
}

/**
 * Awwwards ClipPath title — large display type revealed line-by-line
 * with the characteristic clip-from-center wipe (BenefitSection.jsx pattern).
 * Each line slides out from clip: polygon(50% 0, 50% 0, 50% 100%, 50% 100%)
 * to the full rect.
 */
export function GSAPClipTitle({ lines, className, lineClassName, delay = 0 }: GSAPMarqueeTitleProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let tl: any;

    async function animate() {
      const { gsap } = await import("gsap");
      const { ScrollTrigger } = await import("gsap/ScrollTrigger");
      gsap.registerPlugin(ScrollTrigger);

      const el = containerRef.current;
      if (!el) return;

      const lineEls = el.querySelectorAll("[data-clip-line]");

      // Set all lines to center clip (invisible)
      gsap.set(lineEls, { clipPath: "polygon(50% 0, 50% 0, 50% 100%, 50% 100%)", opacity: 0 });

      tl = gsap.timeline({
        delay,
        scrollTrigger: {
          trigger: el,
          start: "top 70%",
          once: true,
        },
      });

      lineEls.forEach((line, i) => {
        tl.to(
          line,
          {
            clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)",
            opacity: 1,
            duration: 1.1,
            ease: "circ.out",
          },
          i * 0.18
        );
      });
    }

    animate();
    return () => tl?.kill();
  }, [lines, delay]);

  return (
    <div ref={containerRef} className={cn("flex flex-col", className)}>
      {lines.map((line, i) => (
        <div
          key={i}
          data-clip-line
          className={cn(
            "overflow-hidden rounded-sm border border-brass/30 bg-leather/50 px-6 py-3 my-1",
            lineClassName
          )}
        >
          <span className="t-voice text-display-2 text-bone">{line}</span>
        </div>
      ))}
    </div>
  );
}
