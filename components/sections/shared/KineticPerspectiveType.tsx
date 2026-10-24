"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

export interface KineticPerspectiveTypeProps {
  id?: string;
  label?: string;
  text?: string;
  subText?: string;
  numLines?: number;
  tone?: "dark" | "light";
}

/**
 * 3D Kinetic Perspective Variable-Font Wave
 * Renders multiple cloned typographic planes tilted in 3D space with continuous
 * sinusoidal font-weight, stretch, and perspective oscillation.
 */
export function KineticPerspectiveType({
  id = "kinetic-perspective-type",
  label = "KINETIC DISPATCH · EDITORIAL TYPOGRAPHY",
  text = "BLACK STALLION ACADEMY",
  subText = "SOVEREIGN DISCIPLINE · MARWAR TRADITION · BATTLELINE COMPOSURE",
  numLines = 9,
  tone = "dark",
}: KineticPerspectiveTypeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const faceRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    const frame = frameRef.current;
    const face = faceRef.current;
    if (!container || !frame || !face) return;

    // Initial 3D transform orientation
    gsap.set(container, { perspective: "420px", autoAlpha: 1 });
    gsap.set(frame, {
      rotationX: 52,
      transformStyle: "preserve-3d",
      willChange: "transform",
    });

    const lines = face.querySelectorAll<HTMLElement>(".kinetic-txt-line");

    const tl = gsap.timeline({ repeat: -1 });

    // Font weight and opacity wave across lines
    tl.to(lines, {
      fontWeight: 900,
      opacity: 1,
      stagger: {
        yoyo: true,
        each: 0.08,
        repeat: -1,
      },
      duration: 0.85,
      ease: "sine.inOut",
    });

    // Subtitle stretching oscillation
    const etcTweens = gsap.to(".kinetic-etc", {
      letterSpacing: "0.28em",
      opacity: 0.9,
      yoyo: true,
      repeat: -1,
      duration: 6,
      ease: "sine.inOut",
    });

    // Perspective depth breathing
    const perspectiveTween = gsap.to(container, {
      perspective: "260px",
      yoyo: true,
      repeat: -1,
      duration: 4.5,
      ease: "sine.inOut",
    });

    timelineRef.current = tl;

    return () => {
      tl.kill();
      etcTweens.kill();
      perspectiveTween.kill();
    };
  }, []);

  const isDark = tone === "dark";

  return (
    <section
      id={id}
      aria-label="3D Kinetic Perspective Typography"
      className={`relative w-full overflow-hidden py-16 sm:py-24 ${
        isDark ? "bg-[#0e0d0c] text-[#f3ede2]" : "bg-[#f3ede2] text-[#171513]"
      }`}
    >
      <div className="gutter mx-auto w-full max-w-6xl text-center">
        {/* Folio Tag */}
        {label && (
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#c9a66b]/30 bg-black/40 px-4 py-1 text-xs font-mono uppercase tracking-[0.22em] text-[#c9a66b] backdrop-blur-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-[#c9a66b] animate-pulse" aria-hidden="true" />
            {label}
          </div>
        )}

        {/* 3D Perspective Stage Container */}
        <div
          ref={containerRef}
          className="relative mx-auto my-6 flex h-[280px] sm:h-[360px] md:h-[420px] w-full items-center justify-center overflow-hidden"
          style={{ perspective: "420px" }}
        >
          <div
            ref={frameRef}
            className="flex flex-col items-center justify-center select-none"
            style={{ transformStyle: "preserve-3d" }}
          >
            <div ref={faceRef} className="flex flex-col items-center gap-0.5 sm:gap-1">
              {Array.from({ length: numLines }).map((_, idx) => (
                <div
                  key={idx}
                  className="kinetic-txt-line font-playfair font-normal uppercase tracking-wider text-2xl sm:text-4xl md:text-5xl lg:text-6xl text-transparent bg-clip-text bg-gradient-to-r from-[#d4c3ad] via-white to-[#c9a66b] leading-tight opacity-40 transition-opacity"
                  style={{
                    textShadow: "0 4px 20px rgba(0,0,0,0.5)",
                    transform: `translateZ(${idx * 2}px)`,
                  }}
                >
                  {text}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Subtitle / Telemetry Legend */}
        {subText && (
          <p className="kinetic-etc font-mono text-[0.65rem] sm:text-xs uppercase tracking-[0.2em] text-[#c9a66b]/80 mt-4 max-w-xl mx-auto">
            {subText}
          </p>
        )}
      </div>
    </section>
  );
}
