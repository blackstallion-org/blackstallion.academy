"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { Arrow } from "@/components/film/Marks";

export interface SpotlightRevealHeroProps {
  baseImage: string;
  revealImage?: string;
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

/**
 * § Cinematic Flashlight Reveal Hero
 * Features a deep dark ambient scene with soft cursor-following flashlight optics,
 * realistic light falloff, and subtle warm glow revealing sculpture details beneath the light.
 */
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
  spotlightRadius = 320,
  heightClass = "h-[100svh] min-h-[100svh]",
  className = "",
}: SpotlightRevealHeroProps) {
  const containerRef = useRef<HTMLElement>(null);
  const targetPos = useRef({ x: 0, y: 0, isUserMoving: false });
  const currentPos = useRef({ x: 0, y: 0 });
  const heroImg = revealImage || baseImage;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Set initial position centered on the rearing stallion & warrior (approx 52% X, 42% Y)
    const rect = container.getBoundingClientRect();
    const initX = rect.width * 0.52;
    const initY = rect.height * 0.42;
    currentPos.current = { x: initX, y: initY };
    targetPos.current = { x: initX, y: initY, isUserMoving: false };

    container.style.setProperty("--fl-x", `${initX}px`);
    container.style.setProperty("--fl-y", `${initY}px`);
    container.style.setProperty("--fl-radius", `${spotlightRadius}px`);
    container.style.setProperty("--fl-glow", `${Math.round(spotlightRadius * 1.45)}px`);

    const handlePointerMove = (e: PointerEvent) => {
      const bounds = container.getBoundingClientRect();
      targetPos.current.x = e.clientX - bounds.left;
      targetPos.current.y = e.clientY - bounds.top;
      targetPos.current.isUserMoving = true;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        const bounds = container.getBoundingClientRect();
        targetPos.current.x = e.touches[0].clientX - bounds.left;
        targetPos.current.y = e.touches[0].clientY - bounds.top;
        targetPos.current.isUserMoving = true;
      }
    };

    const handlePointerLeave = () => {
      // Smoothly drift back to subject center when cursor leaves
      targetPos.current.isUserMoving = false;
    };

    container.addEventListener("pointermove", handlePointerMove, { passive: true });
    container.addEventListener("pointerleave", handlePointerLeave, { passive: true });
    container.addEventListener("touchmove", handleTouchMove, { passive: true });

    let animationFrameId: number;
    const startTime = performance.now();

    const renderLoop = (now: number) => {
      const bounds = container.getBoundingClientRect();
      const w = bounds.width || 1200;
      const h = bounds.height || 800;

      // If user is idle or on initial state, add subtle ambient breathing drift over statue
      if (!targetPos.current.isUserMoving) {
        const elapsed = (now - startTime) * 0.001;
        const driftX = Math.sin(elapsed * 0.8) * (w * 0.04);
        const driftY = Math.cos(elapsed * 0.6) * (h * 0.03);
        targetPos.current.x = w * 0.52 + driftX;
        targetPos.current.y = h * 0.42 + driftY;
      }

      // Smooth interpolation for silky cinematic inertia (lerp factor ~0.09)
      const lerp = 0.09;
      currentPos.current.x += (targetPos.current.x - currentPos.current.x) * lerp;
      currentPos.current.y += (targetPos.current.y - currentPos.current.y) * lerp;

      container.style.setProperty("--fl-x", `${currentPos.current.x.toFixed(1)}px`);
      container.style.setProperty("--fl-y", `${currentPos.current.y.toFixed(1)}px`);

      animationFrameId = requestAnimationFrame(renderLoop);
    };

    animationFrameId = requestAnimationFrame(renderLoop);

    return () => {
      container.removeEventListener("pointermove", handlePointerMove);
      container.removeEventListener("pointerleave", handlePointerLeave);
      container.removeEventListener("touchmove", handleTouchMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, [spotlightRadius]);

  return (
    <>
    <section
      ref={containerRef}
      className={`relative w-full overflow-hidden bg-[#050606] select-none isolate ${heightClass} ${className}`}
      style={
        {
          "--fl-x": "52%",
          "--fl-y": "42%",
          "--fl-radius": `${spotlightRadius}px`,
          "--fl-glow": `${Math.round(spotlightRadius * 1.45)}px`,
        } as React.CSSProperties
      }
    >
      {/* ==============================================================
          Layer 1: Darkened Base Ambient Image (Deep Shadows & Surroundings)
          ============================================================== */}
      <div className="absolute inset-0 z-10 overflow-hidden pointer-events-none">
        <Image
          src={heroImg}
          alt="Classical equestrian sculpture of a warrior riding a rearing stallion against deep black"
          fill
          priority
          quality={95}
          sizes="100vw"
          className="object-cover object-[50%_35%] opacity-90 transition-opacity duration-300"
          style={{
            filter: "brightness(0.2) contrast(1.22) saturate(0.65) blur(0.4px)",
          }}
        />
        {/* Deep cinematic vignette */}
        <div
          aria-hidden
          className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_25%,rgba(5,6,6,0.65)_60%,rgba(5,6,6,0.98)_100%)]"
        />
        {/* Top edge shadow veil for navigation legibility */}
        <div
          aria-hidden
          className="absolute inset-x-0 top-0 h-36 bg-gradient-to-b from-[#050606] via-[#050606]/60 to-transparent"
        />
        {/* Bottom edge shadow veil for smooth section transition */}
        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-[#050606] via-[#050606]/70 to-transparent"
        />
      </div>

      {/* ==============================================================
          Layer 2: Flashlight Reveal Image (Sharp, Rich, Illuminated Details)
          Masked smoothly with realistic optical light falloff
          ============================================================== */}
      <div
        className="absolute inset-0 z-20 overflow-hidden pointer-events-none will-change-transform"
        style={{
          WebkitMaskImage:
            "radial-gradient(circle var(--fl-radius, 320px) at var(--fl-x, 50%) var(--fl-y, 42%), rgba(0,0,0,1) 0%, rgba(0,0,0,0.88) 28%, rgba(0,0,0,0.48) 58%, rgba(0,0,0,0.12) 82%, transparent 100%)",
          maskImage:
            "radial-gradient(circle var(--fl-radius, 320px) at var(--fl-x, 50%) var(--fl-y, 42%), rgba(0,0,0,1) 0%, rgba(0,0,0,0.88) 28%, rgba(0,0,0,0.48) 58%, rgba(0,0,0,0.12) 82%, transparent 100%)",
        }}
      >
        <Image
          src={heroImg}
          alt=""
          fill
          priority
          quality={95}
          sizes="100vw"
          className="object-cover object-[50%_35%]"
          style={{
            filter: "brightness(1.12) contrast(1.12) saturate(1.08)",
          }}
        />
      </div>

      {/* ==============================================================
          Layer 3: Realistic Flashlight Beam & Subtle Amber Optical Glow
          ============================================================== */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-25 mix-blend-screen will-change-transform"
        style={{
          background:
            "radial-gradient(circle var(--fl-glow, 460px) at var(--fl-x, 50%) var(--fl-y, 42%), rgba(245, 215, 140, 0.16) 0%, rgba(212, 175, 55, 0.08) 32%, rgba(200, 160, 40, 0.02) 65%, transparent 100%)",
        }}
      />
      {/* Central Hotspot Beam */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-26 mix-blend-screen will-change-transform"
        style={{
          background:
            "radial-gradient(circle calc(var(--fl-radius, 320px) * 0.42) at var(--fl-x, 50%) var(--fl-y, 42%), rgba(255, 250, 235, 0.18) 0%, rgba(255, 240, 200, 0.06) 55%, transparent 100%)",
        }}
      />

      {/* ==============================================================
          Layer 4: Central Headline & Typography (z-50)
          ============================================================== */}
      <div className="absolute top-[14%] left-0 right-0 flex flex-col items-center text-center px-5 pointer-events-none z-50">
        {tagline && (
          <p
            className="font-mono text-[0.68rem] tracking-[0.3em] uppercase text-gold/90 mb-3 hero-anim hero-fade [text-shadow:0_2px_10px_rgba(0,0,0,0.9)]"
            style={{ animationDelay: "0.15s" }}
          >
            {tagline}
          </p>
        )}

        <h1 className="text-white leading-[0.95] max-w-5xl select-none">
          <span
            className="block font-serif font-playfair italic font-normal text-5xl sm:text-7xl md:text-8xl hero-anim hero-reveal tracking-tight text-[#FAF7F0] [text-shadow:0_3px_24px_rgba(0,0,0,0.95),0_6px_40px_rgba(0,0,0,0.85)]"
            style={{
              letterSpacing: "-0.05em",
              animationDelay: "0.25s",
            }}
          >
            {titleItalic}
          </span>
          <span
            className="block font-sans font-normal text-5xl sm:text-7xl md:text-8xl -mt-1 sm:-mt-2 hero-anim hero-reveal tracking-tight text-white/95 [text-shadow:0_3px_24px_rgba(0,0,0,0.95),0_6px_40px_rgba(0,0,0,0.85)]"
            style={{
              letterSpacing: "-0.08em",
              animationDelay: "0.42s",
            }}
          >
            {titleRegular}
          </span>
        </h1>
      </div>

      {/* ==============================================================
          Layer 5: Bottom-Left Editorial Paragraph (z-30)
          ============================================================== */}
      {/* ==============================================================
          Layer 6: Bottom-Right Call to Action (z-30)
          ============================================================== */}
    </section>
    <div className="tone-light editorial-details gutter">      {leftDek && (
        <div
          className="max-w-2xl"
          style={{ animationDelay: "0.7s" }}
        >
          <p className="text-lg text-sand leading-relaxed">
            {leftDek}
          </p>
        </div>
      )}

      {(rightDek || ctaText) && (
        <div
          className="relative max-w-2xl flex flex-col items-start gap-4 z-30 "
          style={{ animationDelay: "0.85s" }}
        >
          {rightDek && (
            <p className="text-lg text-sand leading-relaxed">
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
</div>
    </>
  );
}
