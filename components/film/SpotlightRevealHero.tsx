"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Arrow } from "@/components/film/Marks";

export interface SpotlightRevealHeroProps {
  baseImage: string;
  revealImage: string;
  tagline?: string;
  titleItalic: string;
  titleRegular: string;
  leftDek?: string;
  rightDek?: string;
  ctaText?: string;
  ctaHref?: string;
  ctaVariant?: "accent" | "gold" | "outline";
  spotlightRadius?: number;
  heightClass?: string;
  className?: string;
}

export function SpotlightRevealHero({
  baseImage,
  revealImage,
  tagline,
  titleItalic,
  titleRegular,
  leftDek,
  rightDek,
  ctaText,
  ctaHref,
  ctaVariant = "gold",
  spotlightRadius = 260,
  heightClass = "h-[100svh] min-h-[100svh]",
  className = "",
}: SpotlightRevealHeroProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number }>({ x: -999, y: -999 });

  const mouse = useRef<{ x: number; y: number }>({ x: -999, y: -999 });
  const smooth = useRef<{ x: number; y: number }>({ x: -999, y: -999 });
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    // Default initial coordinates centered within container
    const initialX = rect.width * 0.5;
    const initialY = rect.height * 0.45;
    mouse.current = { x: initialX, y: initialY };
    smooth.current = { x: initialX, y: initialY };
    setCursorPos({ x: initialX, y: initialY });

    const handleMouseMove = (e: MouseEvent) => {
      const b = container.getBoundingClientRect();
      mouse.current = {
        x: e.clientX - b.left,
        y: e.clientY - b.top,
      };
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!e.touches.length) return;
      const t = e.touches[0];
      const b = container.getBoundingClientRect();
      mouse.current = {
        x: t.clientX - b.left,
        y: t.clientY - b.top,
      };
    };

    // Smooth lerp loop
    const animate = () => {
      smooth.current.x += (mouse.current.x - smooth.current.x) * 0.12;
      smooth.current.y += (mouse.current.y - smooth.current.y) * 0.12;

      setCursorPos({
        x: Math.round(smooth.current.x * 10) / 10,
        y: Math.round(smooth.current.y * 10) / 10,
      });

      rafRef.current = requestAnimationFrame(animate);
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    container.addEventListener("touchmove", handleTouchMove, { passive: true });
    container.addEventListener("touchstart", handleTouchMove, { passive: true });
    rafRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      container.removeEventListener("touchmove", handleTouchMove);
      container.removeEventListener("touchstart", handleTouchMove);
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  const maskStyle = {
    WebkitMaskImage: `radial-gradient(circle ${spotlightRadius}px at ${cursorPos.x}px ${cursorPos.y}px, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 40%, rgba(0,0,0,0.75) 60%, rgba(0,0,0,0.38) 75%, rgba(0,0,0,0.12) 88%, transparent 100%)`,
    maskImage: `radial-gradient(circle ${spotlightRadius}px at ${cursorPos.x}px ${cursorPos.y}px, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 40%, rgba(0,0,0,0.75) 60%, rgba(0,0,0,0.38) 75%, rgba(0,0,0,0.12) 88%, transparent 100%)`,
  };

  return (
    <section
      ref={containerRef}
      className={`relative w-full overflow-hidden bg-black select-none isolate ${heightClass} ${className}`}
    >
      {/* Layer 1: Base Background Image (z-10) with subtle cinematic zoom - full clarity */}
      <div
        className="absolute inset-0 bg-center bg-cover bg-no-repeat z-10 hero-zoom"
        style={{ backgroundImage: `url(${baseImage})` }}
      />

      {/* Layer 2: Reveal Image with Spotlight Mask (z-20) */}
      <div
        className="absolute inset-0 bg-center bg-cover bg-no-repeat z-20 pointer-events-none"
        style={{
          backgroundImage: `url(${revealImage})`,
          ...maskStyle,
        }}
      />

      {/* Subtle bottom edge scrim for button contrast only if text exists */}
      {(leftDek || rightDek || ctaText) && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/50 to-transparent z-25"
        />
      )}

      {/* Subtle Spotlight Glow Halo following cursor */}
      <div
        aria-hidden
        className="pointer-events-none absolute rounded-full z-26 transition-opacity duration-300"
        style={{
          width: `${spotlightRadius * 2}px`,
          height: `${spotlightRadius * 2}px`,
          left: `${cursorPos.x - spotlightRadius}px`,
          top: `${cursorPos.y - spotlightRadius}px`,
          background: "radial-gradient(circle, rgba(212,175,55,0.08) 0%, rgba(212,175,55,0.02) 60%, transparent 80%)",
        }}
      />

      {/* Layer 3: Central Headline (z-50) */}
      <div className="absolute top-[14%] left-0 right-0 flex flex-col items-center text-center px-5 pointer-events-none z-50">
        {tagline && (
          <p
            className="font-mono text-[0.68rem] tracking-[0.3em] uppercase text-gold/90 mb-3 hero-anim hero-fade"
            style={{ animationDelay: "0.15s" }}
          >
            {tagline}
          </p>
        )}

        <h1 className="text-white leading-[0.95] max-w-5xl">
          <span
            className="block font-serif font-playfair italic font-normal text-5xl sm:text-7xl md:text-8xl hero-anim hero-reveal tracking-tight text-[#FAF7F0]"
            style={{
              letterSpacing: "-0.05em",
              animationDelay: "0.25s",
            }}
          >
            {titleItalic}
          </span>
          <span
            className="block font-sans font-normal text-5xl sm:text-7xl md:text-8xl -mt-1 sm:-mt-2 hero-anim hero-reveal tracking-tight text-white/95"
            style={{
              letterSpacing: "-0.08em",
              animationDelay: "0.42s",
            }}
          >
            {titleRegular}
          </span>
        </h1>
      </div>

      {/* Layer 4: Bottom-Left Editorial Paragraph (z-30) */}
      {leftDek && (
        <div
          className="hidden sm:block absolute bottom-12 left-8 md:left-14 max-w-[280px] md:max-w-[320px] z-30 hero-anim hero-fade pointer-events-none"
          style={{ animationDelay: "0.7s" }}
        >
          <p className="text-xs sm:text-sm text-white/85 leading-relaxed drop-shadow-md">
            {leftDek}
          </p>
        </div>
      )}

      {/* Layer 5: Bottom-Right Call to Action (z-30) */}
      {(rightDek || ctaText) && (
        <div
          className="absolute bottom-8 sm:bottom-12 left-6 right-6 sm:left-auto sm:right-10 md:right-14 max-w-full sm:max-w-[300px] flex flex-col items-start gap-4 z-30 hero-anim hero-fade"
          style={{ animationDelay: "0.85s" }}
        >
          {rightDek && (
            <p className="text-xs sm:text-sm text-white/85 leading-relaxed drop-shadow-md">
              {rightDek}
            </p>
          )}

          {ctaText && ctaHref && (
            <Link
              href={ctaHref}
              className={`group inline-flex items-center gap-3 rounded-full text-xs font-mono uppercase tracking-widest px-7 py-3 transition-all hover:scale-[1.03] active:scale-95 pointer-events-auto ${
                ctaVariant === "accent"
                  ? "bg-[#e8702a] hover:bg-[#d2611f] text-white shadow-lg shadow-[#e8702a]/30 font-medium"
                  : ctaVariant === "outline"
                  ? "border border-gold/70 bg-black/60 text-white backdrop-blur-md hover:bg-gold hover:text-black hover:border-gold hover:shadow-[0_0_24px_rgba(212,175,55,0.4)]"
                  : "bg-[#d4af37] hover:bg-[#e5c158] text-black font-semibold shadow-lg shadow-[#d4af37]/30 hover:shadow-[#d4af37]/50"
              }`}
            >
              <span>{ctaText}</span>
              <Arrow className="transition-transform group-hover:translate-x-1" />
            </Link>
          )}
        </div>
      )}
    </section>
  );
}
