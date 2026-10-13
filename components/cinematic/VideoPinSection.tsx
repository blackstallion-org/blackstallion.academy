"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useReducedMotion } from "@/lib/motion/reduced";

/**
 * Awwwards Video Pin Section (Inspired by GSAP-Awwwards-Website-main VideoPinSection.jsx)
 *
 * Expands a cinematic aperture from a compact circular mask (circle(8%)) to full-bleed (circle(100%))
 * as the user scrolls, revealing the lantern-lit stables and brass seal registry.
 */
export function VideoPinSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const videoBoxRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) return;
    if (typeof window === "undefined") return;

    let ctx: any;

    async function initGSAP() {
      const { gsap } = await import("gsap");
      const { ScrollTrigger } = await import("gsap/ScrollTrigger");
      gsap.registerPlugin(ScrollTrigger);

      if (!sectionRef.current || !videoBoxRef.current) return;

      const isMobile = window.innerWidth <= 768;

      if (!isMobile) {
        ctx = gsap.context(() => {
          const tl = gsap.timeline({
            scrollTrigger: {
              trigger: sectionRef.current,
              start: "top top",
              end: "+=120%",
              scrub: 1.2,
              pin: true,
            },
          });

          tl.fromTo(
            videoBoxRef.current,
            { clipPath: "circle(10% at 50% 50%)", scale: 1.15 },
            { clipPath: "circle(100% at 50% 50%)", scale: 1, ease: "power2.inOut" }
          );

          if (headlineRef.current) {
            tl.fromTo(
              headlineRef.current,
              { opacity: 0, y: 40 },
              { opacity: 1, y: 0, ease: "power3.out" },
              "-=0.6"
            );
          }
        }, sectionRef);
      }
    }

    initGSAP();

    return () => {
      ctx?.revert();
    };
  }, [reduced]);

  return (
    <section
      ref={sectionRef}
      className="relative h-[100svh] w-full overflow-hidden bg-[#08090B] flex items-center justify-center border-b border-brass/20"
      aria-label="Every Hour Sealed in Brass"
    >
      {/* ── Expanding Video Box (Awwwards Circular Wipe) ── */}
      <div
        ref={videoBoxRef}
        style={{ clipPath: "circle(100% at 50% 50%)" }}
        className="absolute inset-0 h-full w-full overflow-hidden"
      >
        <video
          src="/video/home-hero-cropped-1920.mp4"
          autoPlay
          muted
          loop
          playsInline
          className="h-full w-full object-cover object-center filter brightness-90 contrast-105"
        />

        {/* Cinematic Vignette */}
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-t from-[#08090B] via-[#08090B]/40 to-[#08090B]/70"
        />
      </div>

      {/* ── Center Editorial Overlay ── */}
      <div
        ref={headlineRef}
        className="gutter relative z-20 flex flex-col items-center text-center max-w-4xl space-y-6"
      >
        <div className="flex items-center gap-2 border border-gold/40 bg-night/80 backdrop-blur-md px-4 py-1.5 rounded-full">
          <span className="h-1.5 w-1.5 rounded-full bg-gold animate-pulse" />
          <span className="font-mono text-[0.68rem] tracking-[0.2em] uppercase text-gold">
            REEL 11 · THE ARCHIVE OF PURITY
          </span>
        </div>

        <h2 className="space-y-2">
          <span className="t-inscribe block text-[clamp(2rem,4vw,3.5rem)] text-sand/80 uppercase">
            Every hour
          </span>
          <span className="t-voice block text-[clamp(3rem,7vw,6.5rem)] text-bone drop-shadow-[0_4px_24px_rgba(197,160,89,0.3)]">
            sealed in brass.
          </span>
        </h2>

        <p className="max-w-xl text-sand text-[clamp(1rem,1.2vw,1.25rem)] font-serif leading-relaxed">
          A day at BSAH is a day of purpose, discipline and pride. Every mounted minute, veterinary telemetry check, and tactical lance transition is recorded forever in the sovereign ledger.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
          <div className="flex items-center gap-3 border border-brass/30 bg-night/80 backdrop-blur-md px-5 py-2.5 rounded-xl">
            <span className="font-mono text-[0.72rem] tracking-[0.16em] uppercase text-dust">
              PASSPORT CODE DEMO:
            </span>
            <span className="font-mono text-[0.78rem] tracking-[0.18em] uppercase text-gold font-bold">
              BSAH-2026-HYD-042
            </span>
          </div>

          <Link
            href="/verify"
            className="group inline-flex items-center gap-3 rounded-full bg-gold px-6 py-3 font-mono text-[0.72rem] tracking-[0.16em] uppercase text-night font-bold transition-all hover:bg-bone hover:shadow-[0_0_24px_rgba(197,160,89,0.4)]"
          >
            Verify a Cadet
            <svg
              aria-hidden
              className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}
