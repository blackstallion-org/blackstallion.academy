"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export interface SplitSlide {
  imageAlt: string;
  imageSrc: string;
  imageFocus?: string;
  kicker: string;
  heading: string;
  body: string;
  ctaLabel?: string;
  ctaHref?: string;
  ambientTone?: string;
}

interface SplitSliderProps {
  slides: SplitSlide[];
  className?: string;
  autoPlay?: number;
}

/**
 * Award-Winning Split-Slider Transition Component:
 * - Left: large cinematic media frame with rounded corners and antique brass hairline border.
 * - Right: oversized editorial serif typography that overlaps across the media and dark background.
 * - Layered ambient background tone.
 * - Outgoing headline exits vertically behind overflow mask.
 * - Outgoing image subtly scales and wipes away.
 * - Incoming image reveals through smooth directional clip-path wipe.
 * - Incoming headline enters with staggered vertical text reveal.
 * - GSAP timelines with power3.inOut / power4.out, transition lock, accessible controls.
 */
export function SplitSlider({ slides, className, autoPlay = 0 }: SplitSliderProps) {
  const [current, setCurrent] = useState(0);
  const [prev, setPrev] = useState<number | null>(null);
  const [animating, setAnimating] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const imageOutRef = useRef<HTMLDivElement>(null);
  const imageInRef = useRef<HTMLDivElement>(null);
  const headingOutRef = useRef<HTMLHeadingElement>(null);
  const headingInRef = useRef<HTMLHeadingElement>(null);
  const kickerInRef = useRef<HTMLParagraphElement>(null);
  const bodyInRef = useRef<HTMLParagraphElement>(null);
  const ctaInRef = useRef<HTMLDivElement>(null);

  const touchStartX = useRef<number | null>(null);

  const goTo = useCallback(
    async (next: number) => {
      if (animating || next === current) return;
      if (typeof window === "undefined") return;

      // Respect reduced motion preferences
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        setCurrent(next);
        return;
      }

      setAnimating(true);
      setPrev(current);
      setCurrent(next);

      const { gsap } = await import("gsap");
      const { SplitText } = await import("gsap/SplitText");
      gsap.registerPlugin(SplitText);

      // Allow DOM to update
      await new Promise((r) => requestAnimationFrame(r));
      await new Promise((r) => requestAnimationFrame(r));

      const tl = gsap.timeline({
        onComplete: () => {
          setPrev(null);
          setAnimating(false);
        },
      });

      // ── 1. Outgoing Heading Exits Upward ──
      if (headingOutRef.current) {
        tl.to(
          headingOutRef.current,
          {
            y: "-110%",
            opacity: 0,
            duration: 0.55,
            ease: "power3.in",
          },
          0
        );
      }

      // ── 2. Outgoing Image Scales and Wipes Away ──
      if (imageOutRef.current) {
        tl.to(
          imageOutRef.current,
          {
            clipPath: "polygon(0% 0%, 0% 0%, 0% 100%, 0% 100%)",
            scale: 1.06,
            duration: 0.75,
            ease: "power3.inOut",
          },
          0
        );
      }

      // ── 3. Incoming Image Reveals via Directional Clip-Path Wipe ──
      if (imageInRef.current) {
        gsap.set(imageInRef.current, {
          clipPath: "polygon(100% 0%, 100% 0%, 100% 100%, 100% 100%)",
          scale: 1.08,
        });
        tl.to(
          imageInRef.current,
          {
            clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)",
            scale: 1,
            duration: 0.9,
            ease: "power3.inOut",
          },
          0.2
        );
      }

      // ── 4. Incoming Heading Enters with Staggered Vertical Reveal ──
      if (headingInRef.current) {
        const split = SplitText.create(headingInRef.current, { type: "lines,words" });
        gsap.set(split.words, { y: "115%", opacity: 0 });
        tl.to(
          split.words,
          {
            y: "0%",
            opacity: 1,
            duration: 0.85,
            ease: "power4.out",
            stagger: 0.04,
          },
          0.35
        );
      }

      // ── 5. Incoming Kicker, Body & CTA Stagger Reveal ──
      const fadeTargets = [kickerInRef.current, bodyInRef.current, ctaInRef.current].filter(Boolean);
      if (fadeTargets.length) {
        gsap.set(fadeTargets, { y: 20, opacity: 0 });
        tl.to(
          fadeTargets,
          {
            y: 0,
            opacity: 1,
            duration: 0.7,
            ease: "power2.out",
            stagger: 0.08,
          },
          0.45
        );
      }
    },
    [animating, current]
  );

  const goNext = useCallback(() => goTo((current + 1) % slides.length), [goTo, current, slides.length]);
  const goPrev = useCallback(() => goTo((current - 1 + slides.length) % slides.length), [goTo, current, slides.length]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goNext, goPrev]);

  // Touch swipe support
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) goNext();
      else goPrev();
    }
    touchStartX.current = null;
  };

  // Auto-play
  useEffect(() => {
    if (!autoPlay) return;
    const id = setInterval(goNext, autoPlay);
    return () => clearInterval(id);
  }, [autoPlay, goNext]);

  const slide = slides[current];
  const prevSlide = prev !== null ? slides[prev] : null;

  return (
    <div
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className={cn(
        "relative flex flex-col lg:flex-row items-center justify-between min-h-[90svh] px-6 py-12 lg:px-16 lg:py-20 bg-[#08090B] overflow-hidden",
        className
      )}
    >
      {/* ── Layered Ambient Tone Glow ── */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 -left-40 h-[600px] w-[600px] rounded-full bg-gradient-to-br from-[#A9673F]/15 via-[#C5A059]/10 to-transparent blur-3xl transition-opacity duration-1000"
      />

      {/* ── LEFT: Cinematic Media Frame with Rounded Corners ── */}
      <div className="relative w-full lg:w-[58%] aspect-[4/3] lg:aspect-[16/11] rounded-2xl lg:rounded-3xl overflow-hidden border border-brass/25 shadow-[0_24px_80px_rgba(0,0,0,0.85)] z-10">
        {/* Outgoing Image */}
        {prevSlide && (
          <div ref={imageOutRef} className="absolute inset-0 z-10">
            <Image
              src={prevSlide.imageSrc}
              alt={prevSlide.imageAlt}
              fill
              unoptimized
              className="object-cover"
              style={{ objectPosition: prevSlide.imageFocus ?? "50% 50%" }}
            />
          </div>
        )}

        {/* Incoming Image */}
        <div ref={imageInRef} className="absolute inset-0 z-20">
          <Image
            src={slide.imageSrc}
            alt={slide.imageAlt}
            fill
            unoptimized
            priority
            className="object-cover"
            style={{ objectPosition: slide.imageFocus ?? "50% 50%" }}
          />

          {/* Right edge cinematic gradient for smooth overlap */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-[#08090B]/70 lg:to-[#08090B]/90"
          />

          {/* Bottom vignette */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-[#08090B]/85 to-transparent"
          />

          {/* Frame Telemetry Indicator */}
          <div className="absolute left-6 bottom-6 z-30 flex items-center gap-3 bg-night/80 backdrop-blur-md border border-brass/30 px-3.5 py-1.5 rounded-full">
            <span className="h-1.5 w-1.5 rounded-full bg-gold animate-pulse" />
            <span className="font-mono text-[0.65rem] text-bone tracking-[0.2em] uppercase font-bold">
              FRAME {String(current + 1).padStart(2, "0")} / {String(slides.length).padStart(2, "0")}
            </span>
          </div>
        </div>
      </div>

      {/* ── RIGHT: Oversized Editorial Serif Overlapping Typography ── */}
      <div className="relative w-full lg:w-[48%] lg:-ml-20 xl:-ml-28 flex flex-col justify-center pt-8 lg:pt-0 z-20">
        <div className="relative flex flex-col gap-6 max-w-xl bg-[#08090B]/85 lg:bg-[#08090B]/90 backdrop-blur-xl p-8 lg:p-12 rounded-3xl border border-brass/20 shadow-2xl">
          {/* Kicker */}
          <p
            ref={kickerInRef}
            className="label text-brass tracking-[0.24em] uppercase text-xs flex items-center gap-2"
          >
            <span className="h-1 w-6 bg-gold inline-block" />
            {slide.kicker}
          </p>

          {/* Outgoing Heading (Masked Exit) */}
          {prevSlide && (
            <div className="absolute inset-x-8 lg:inset-x-12 top-20 overflow-hidden pointer-events-none" aria-hidden>
              <h2
                ref={headingOutRef}
                className="t-voice text-[clamp(2.4rem,4.5vw,4.8rem)] leading-[0.95] text-bone"
              >
                {prevSlide.heading}
              </h2>
            </div>
          )}

          {/* Incoming Heading (Masked Vertical Staggered Entry) */}
          <div className="overflow-hidden pb-1">
            <h2
              ref={headingInRef}
              className="t-voice text-[clamp(2.4rem,4.5vw,4.8rem)] leading-[0.95] text-bone drop-shadow-[0_2px_16px_rgba(197,160,89,0.2)]"
            >
              {slide.heading}
            </h2>
          </div>

          {/* Body Description */}
          <p
            ref={bodyInRef}
            className="text-sand text-[clamp(1rem,1.15vw,1.2rem)] font-serif leading-relaxed"
          >
            {slide.body}
          </p>

          {/* CTA Link */}
          {slide.ctaHref && slide.ctaLabel && (
            <div ref={ctaInRef}>
              <Link
                href={slide.ctaHref}
                className="group inline-flex items-center gap-3 rounded-full border border-gold/60 bg-transparent px-6 py-3 font-mono text-[0.72rem] uppercase tracking-[0.16em] text-gold transition-all hover:bg-gold hover:text-night hover:shadow-[0_0_20px_rgba(197,160,89,0.3)]"
              >
                {slide.ctaLabel}
                <svg
                  aria-hidden
                  className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </div>
          )}

          {/* Coordinated Navigation Controls */}
          <div className="mt-4 flex items-center justify-between border-t border-brass/15 pt-6">
            {/* Slide Dots / Indicators */}
            <div className="flex items-center gap-2" role="tablist" aria-label="Frames">
              {slides.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  role="tab"
                  aria-selected={i === current}
                  aria-label={`Jump to frame ${i + 1}`}
                  onClick={() => goTo(i)}
                  className={cn(
                    "h-1.5 transition-all duration-500 rounded-full",
                    i === current
                      ? "bg-gold w-8 shadow-[0_0_8px_rgba(197,160,89,0.6)]"
                      : "bg-brass/30 w-3 hover:bg-brass/60"
                  )}
                />
              ))}
            </div>

            {/* Prev / Next Arrows with Transition Lock */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={goPrev}
                aria-label="Previous slide"
                disabled={animating}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-brass/40 bg-night/80 text-sand hover:border-gold hover:text-gold transition-all disabled:opacity-30 disabled:pointer-events-none"
              >
                <svg
                  aria-hidden
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              <button
                type="button"
                onClick={goNext}
                aria-label="Next slide"
                disabled={animating}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-brass/40 bg-night/80 text-sand hover:border-gold hover:text-gold transition-all disabled:opacity-30 disabled:pointer-events-none"
              >
                <svg
                  aria-hidden
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
