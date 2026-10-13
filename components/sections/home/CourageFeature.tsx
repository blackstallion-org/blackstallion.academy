"use client";

import Image from "next/image";
import Link from "next/link";
import { GSAPScrollReveal } from "@/components/cinematic/GSAPScrollReveal";
import { Label } from "@/components/film/Marks";

/**
 * §2.5 Courage Builds Character — Direct from Gemini Reference Image (Screen 2)
 *
 * Left: Monumental editorial typography & equestrian philosophy
 * Right: Intimate fine-art studio portrait of Marwari stallion face & curved ears
 */
export function CourageFeature() {
  return (
    <section
      aria-label="Courage Builds Character"
      className="relative bg-[#08090B] py-20 lg:py-32 border-b border-brass/20 overflow-hidden"
    >
      {/* Subtle ambient background glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute right-0 top-1/4 h-[500px] w-[500px] rounded-full bg-gradient-to-l from-copper/15 via-gold/10 to-transparent blur-3xl"
      />

      <div className="gutter grid gap-12 lg:grid-cols-2 lg:items-center">
        {/* Left Column: Typography & Philosophy */}
        <div className="space-y-8 max-w-xl">
          <GSAPScrollReveal variant="fade-up">
            <Label reel={1}>The Creed</Label>
          </GSAPScrollReveal>

          <GSAPScrollReveal variant="fade-up" delay={0.1}>
            <h2 className="space-y-1">
              <span className="t-inscribe block text-[clamp(2.4rem,5vw,4.5rem)] text-sand/80 leading-tight uppercase">
                Courage builds
              </span>
              <span className="t-voice block text-[clamp(3rem,6.5vw,5.8rem)] text-gold leading-[0.92]">
                character.
              </span>
            </h2>
          </GSAPScrollReveal>

          <GSAPScrollReveal variant="fade-up" delay={0.2}>
            <p className="text-sand text-[clamp(1.1rem,1.3vw,1.35rem)] font-serif leading-relaxed">
              In the saddle, as in life, courage isn&apos;t the absence of fear, but the decision to move forward anyway.
            </p>
          </GSAPScrollReveal>

          <GSAPScrollReveal variant="fade-up" delay={0.3}>
            <div className="border-l-2 border-gold/60 pl-6 py-2 space-y-2 bg-umber/20 rounded-r-xl">
              <p className="font-serif italic text-bone text-base">
                &ldquo;A horse lends a human being the wings, speed, and nobility they lack. When half a tonne yields to twenty grams of intent, a child learns true command.&rdquo;
              </p>
              <span className="font-mono text-[0.68rem] tracking-[0.16em] uppercase text-dust block">
                — Captain Vikramaditya Singh, Cavalry Veteran &amp; Faculty Dean
              </span>
            </div>
          </GSAPScrollReveal>

          <GSAPScrollReveal variant="fade-up" delay={0.4}>
            <Link
              href="/legend"
              className="group inline-flex items-center gap-3 rounded-full border border-brass/50 bg-night/80 px-6 py-3 font-mono text-[0.72rem] tracking-[0.16em] uppercase text-gold transition-all hover:bg-gold hover:text-night hover:shadow-[0_0_20px_rgba(197,160,89,0.3)]"
            >
              Explore the lineage
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
          </GSAPScrollReveal>
        </div>

        {/* Right Column: High-Contrast Fine Art Marwari Portrait */}
        <GSAPScrollReveal
          variant="fade-up"
          delay={0.2}
          className="relative aspect-[4/5] w-full rounded-3xl overflow-hidden border border-brass/30 shadow-[0_30px_90px_rgba(0,0,0,0.9)] group"
        >
          <Image
            src="/images/marwari-bw.png"
            alt="Fine art studio photograph of a Marwari stallion"
            fill
            unoptimized
            className="object-cover object-[50%_35%] transition-transform duration-[2000ms] ease-out group-hover:scale-105"
          />

          {/* Vignette overlays */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#08090B] via-transparent to-transparent opacity-80"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#08090B]/60 via-transparent to-transparent"
          />

          {/* Portrait Telemetry Stamp */}
          <div className="absolute bottom-6 left-6 z-20 flex flex-col gap-1 bg-night/80 backdrop-blur-md border border-brass/30 px-4 py-2.5 rounded-xl">
            <span className="font-mono text-[0.62rem] text-gold tracking-[0.2em] uppercase font-bold">
              STUDIO ARCHIVE · MARWARI NO. 01
            </span>
            <span className="text-[0.72rem] font-serif text-sand/90">
              Lyre-Shaped Acoustic Swivel · Pure Desert Lineage
            </span>
          </div>
        </GSAPScrollReveal>
      </div>
    </section>
  );
}
