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
  spotlightRadius = 260,
  heightClass = "h-screen min-h-[640px] max-h-[1080px]",
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
      {/* Layer 1: Base Background Image (z-10) with subtle cinematic zoom */}
      <div
        className="absolute inset-0 bg-center bg-cover bg-no-repeat z-10 hero-zoom brightness-[0.68]"
        style={{ backgroundImage: `url(${baseImage})` }}
      />

      {/* Layer 2: Reveal Image with Spotlight Mask (z-20) */}
      <div
        className="absolute inset-0 bg-center bg-cover bg-no-repeat z-20 pointer-events-none brightness-[1.05]"
        style={{
          backgroundImage: `url(${revealImage})`,
          ...maskStyle,
        }}
      />

      {/* Subtle vignette shade for contrast */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/55 z-25"
      />

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

      {/* Layer 3: Central Headline (z-30) */}
      <div className="absolute top-[14%] sm:top-[16%] left-0 right-0 flex flex-col items-center text-center px-6 pointer-events-none z-30">
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
            className="block font-serif italic font-normal text-4xl sm:text-7xl md:text-8xl hero-anim hero-reveal tracking-tight text-[#FAF7F0]"
            style={{
              fontFamily: 'var(--font-kalnia), var(--font-newsreader), "Playfair Display", Georgia, serif',
              letterSpacing: "-0.03em",
              animationDelay: "0.25s",
            }}
          >
            {titleItalic}
          </span>
          <span
            className="block font-serif font-light text-4xl sm:text-7xl md:text-8xl -mt-1 sm:-mt-2 hero-anim hero-reveal uppercase tracking-tight text-white/95"
            style={{
              fontFamily: 'var(--font-kalnia), var(--font-newsreader), "Playfair Display", serif',
              letterSpacing: "-0.02em",
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
          <p className="font-serif text-xs sm:text-sm text-sand/85 leading-relaxed drop-shadow">
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
            <p className="font-serif text-xs sm:text-sm text-sand/80 leading-relaxed drop-shadow">
              {rightDek}
            </p>
          )}

          {ctaText && ctaHref && (
            <Link
              href={ctaHref}
              className="group inline-flex items-center gap-3 rounded-full border border-gold/70 bg-black/60 px-6 py-2.5 font-mono text-xs uppercase tracking-widest text-bone backdrop-blur-md transition-all hover:bg-gold hover:text-black hover:border-gold hover:shadow-[0_0_24px_rgba(212,175,55,0.4)] pointer-events-auto"
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
