"use client";

import { useEffect, useRef } from "react";
import { acts, type Act } from "@/lib/content/site";
import { LanceRule } from "./Marks";
import { BreathCue } from "./BreathCue";

/**
 * Act break on the home page: "ACT II · THE CITADEL — Now, the proof."
 * Enhanced with GSAP word-colour scroll animation (MessageSection.jsx pattern).
 * Each word lights up from the brass/dust tone to full bone/gold as it enters the viewport.
 */
export function Intermission({ act, line }: { act: Act; line: string }) {
  const lineRef = useRef<HTMLParagraphElement>(null);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let split: any;
    let tl: any;

    async function animate() {
      const { gsap } = await import("gsap");
      const { SplitText } = await import("gsap/SplitText");
      const { ScrollTrigger } = await import("gsap/ScrollTrigger");
      gsap.registerPlugin(SplitText, ScrollTrigger);

      const el = lineRef.current;
      if (!el) return;

      split = SplitText.create(el, { type: "words" });

      // Start all words as dimmed brass, animate to bone/gold as they scroll into view
      gsap.set(split.words, { color: "rgb(184 138 98 / 0.3)" });

      tl = gsap.to(split.words, {
        color: "rgb(201 166 107 / 1)", // --color-antique (gold in dark scope)
        ease: "power1.in",
        stagger: 1,
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 60%",
          end: "50% center",
          scrub: true,
        },
      });
    }

    animate();

    return () => {
      tl?.kill();
      split?.revert();
    };
  }, [line]);

  return (
    <div
      ref={sectionRef}
      className="tone-dark surface-leather gutter relative overflow-hidden py-[16vh] text-center"
    >
      {act === "ledger" && <BreathCue />}
      <LanceRule label={`Act ${acts[act].numeral} · ${acts[act].name}`} />

      {/* The act line — GSAP word-colour scroll */}
      <div className="relative mt-10 overflow-hidden">
        <p
          ref={lineRef}
          className="t-voice text-display-3 text-gold"
        >
          {line}
        </p>
      </div>
    </div>
  );
}
