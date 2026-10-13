"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

/**
 * The opening cinematic title card.
 * Uses GSAP SplitText + clip-path mask for the film-title-sequence effect
 * from the Awwwards reference (HeroSection.jsx pattern).
 *
 * Frame 1: "WE DO NOT TEACH CHILDREN TO RIDE."
 * Frame 2: "WE FORGE THEM TO LEAD."
 *
 * Both lines rise out of a mask with a power3.out ease.
 * Respects prefers-reduced-motion.
 */
interface GSAPHeroTitleProps {
  /** The two lines of copy */
  inscription: string;
  voice: string;
  /** Delay (seconds) before the animation fires — should match the SplitReveal timing */
  delay?: number;
  className?: string;
}

export function GSAPHeroTitle({ inscription, voice, delay = 0.6, className }: GSAPHeroTitleProps) {
  const inscriptionRef = useRef<HTMLSpanElement>(null);
  const voiceRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let tl: any;

    async function animate() {
      const { gsap } = await import("gsap");
      const { SplitText } = await import("gsap/SplitText");
      gsap.registerPlugin(SplitText);

      if (!inscriptionRef.current || !voiceRef.current) return;

      const inscSplit = SplitText.create(inscriptionRef.current, { type: "chars" });
      const voiceSplit = SplitText.create(voiceRef.current, { type: "chars" });

      gsap.set([inscSplit.chars, voiceSplit.chars], { y: "110%", opacity: 0 });

      tl = gsap.timeline({ delay });

      tl
        .to(inscSplit.chars, {
          y: "0%",
          opacity: 1,
          duration: 0.9,
          ease: "power3.out",
          stagger: 0.018,
        })
        .to(
          voiceSplit.chars,
          {
            y: "0%",
            opacity: 1,
            duration: 1.0,
            ease: "power4.out",
            stagger: 0.022,
          },
          "-=0.6"
        );

      return () => {
        tl?.kill();
        inscSplit.revert();
        voiceSplit.revert();
      };
    }

    let cleanupFn: (() => void) | undefined;
    animate().then((fn) => {
      cleanupFn = fn;
    });

    return () => cleanupFn?.();
  }, [inscription, voice, delay]);

  return (
    <div className={cn("select-none", className)}>
      <div className="overflow-hidden pb-[0.04em]">
        <span
          ref={inscriptionRef}
          className="t-inscribe block text-display-3 leading-[1.1] tracking-[0.06em] uppercase text-bone/80"
          style={{ fontStretch: "125%", fontWeight: 200 }}
        >
          {inscription}
        </span>
      </div>
      <div className="overflow-hidden pb-[0.1em]">
        <span
          ref={voiceRef}
          className="t-voice block text-display-1 leading-none text-gold"
          style={{ fontWeight: 700 }}
        >
          {voice}
        </span>
      </div>
    </div>
  );
}
