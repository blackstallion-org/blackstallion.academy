"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface GSAPScrollRevealProps {
  children: ReactNode;
  className?: string;
  /** "fade-up" | "clip-down" | "clip-left" | "clip-right" */
  variant?: "fade-up" | "clip-down" | "clip-left" | "clip-right";
  delay?: number;
  duration?: number;
}

/**
 * Wraps any content with a GSAP ScrollTrigger-powered reveal.
 * "clip-down" reproduces the Awwwards ClipPathTitle effect where a coloured
 * band slides down from 0 height to full height, exactly as in BenefitSection.jsx.
 */
export function GSAPScrollReveal({
  children,
  className,
  variant = "fade-up",
  delay = 0,
  duration = 0.9,
}: GSAPScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let tl: any;
    let cleanup: (() => void) | undefined;

    async function animate() {
      const { gsap } = await import("gsap");
      const { ScrollTrigger } = await import("gsap/ScrollTrigger");
      gsap.registerPlugin(ScrollTrigger);

      const el = ref.current;
      if (!el) return;

      const from: Record<string, string | number> = {};
      const to: Record<string, string | number> = {};

      switch (variant) {
        case "clip-down":
          gsap.set(el, { clipPath: "polygon(0% 0%, 100% 0%, 100% 0%, 0% 0%)" });
          tl = gsap.timeline({
            scrollTrigger: { trigger: el, start: "top 78%", once: true },
          });
          tl.to(el, {
            clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)",
            duration,
            ease: "circ.out",
            delay,
          });
          break;

        case "clip-left":
          gsap.set(el, { clipPath: "polygon(0 0, 0 0, 0 100%, 0% 100%)" });
          tl = gsap.timeline({
            scrollTrigger: { trigger: el, start: "top 80%", once: true },
          });
          tl.to(el, {
            clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)",
            duration,
            ease: "power3.out",
            delay,
          });
          break;

        case "clip-right":
          gsap.set(el, { clipPath: "polygon(100% 0, 100% 0, 100% 100%, 100% 100%)" });
          tl = gsap.timeline({
            scrollTrigger: { trigger: el, start: "top 80%", once: true },
          });
          tl.to(el, {
            clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)",
            duration,
            ease: "power3.out",
            delay,
          });
          break;

        case "fade-up":
        default:
          gsap.set(el, { y: 32, opacity: 0 });
          tl = gsap.timeline({
            scrollTrigger: { trigger: el, start: "top 82%", once: true },
          });
          tl.to(el, { y: 0, opacity: 1, duration, ease: "power3.out", delay });
          break;
      }

      cleanup = () => {
        tl?.kill();
        ScrollTrigger.getAll()
          .filter((t) => t.trigger === el)
          .forEach((t) => t.kill());
      };
    }

    animate();
    return () => cleanup?.();
  }, [variant, delay, duration]);

  return (
    <div ref={ref} className={cn(className)}>
      {children}
    </div>
  );
}
