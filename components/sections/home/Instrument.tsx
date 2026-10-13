"use client";

import Link from "next/link";
import { Headline } from "@/components/film/Headline";
import { Label } from "@/components/film/Marks";
import { SpecimenPlate } from "@/components/sections/anatomy/SpecimenPlate";
import { GSAPScrollReveal } from "@/components/cinematic/GSAPScrollReveal";
import { instrument } from "@/lib/content/home";

/**
 * §3 The Instrument · S03 specimen hotspots
 * "FIVE HUNDRED KILOGRAMS that read you first."
 * Interactive Marwari anatomical telemetry plate with 5 selectable hotspots:
 * Ears (180° Radar), Neck (Balancer), Saddle (3D Kinematics), Reins (10 Grams), Hoof (Desert Suspension).
 */
export function Instrument() {
  return (
    <section
      aria-labelledby="instrument-h"
      className="relative bg-[#08090B] py-20 lg:py-32 border-b border-brass/20"
    >
      <div className="gutter space-y-12">
        <div className="grid gap-8 lg:grid-cols-[1.2fr_minmax(0,1fr)] lg:items-end justify-between">
          <div className="space-y-4">
            <GSAPScrollReveal variant="fade-up">
              <Label reel={2}>The Instrument</Label>
            </GSAPScrollReveal>
            <GSAPScrollReveal variant="fade-up" delay={0.1}>
              <Headline
                id="instrument-h"
                inscription={instrument.inscription}
                voice={instrument.voice}
              />
            </GSAPScrollReveal>
          </div>

          <GSAPScrollReveal variant="fade-up" delay={0.2} className="space-y-4">
            <p className="text-sand text-lg font-serif leading-relaxed">
              {instrument.body}
            </p>
            <div className="flex items-center gap-2 border border-brass/20 bg-umber/30 px-3.5 py-1.5 rounded-full w-fit">
              <span className="h-1.5 w-1.5 rounded-full bg-gold animate-pulse" />
              <span className="font-mono text-[0.68rem] tracking-[0.16em] uppercase text-gold">
                ISO Telemetry &amp; Biomechanical Radar Active
              </span>
            </div>
          </GSAPScrollReveal>
        </div>

        <GSAPScrollReveal
          variant="fade-up"
          delay={0.2}
          className="rounded-3xl border border-brass/25 bg-umber/20 p-4 lg:p-8 backdrop-blur-md shadow-2xl"
        >
          <SpecimenPlate only={instrument.points} />
        </GSAPScrollReveal>

        <div className="flex items-center justify-between border-t border-brass/15 pt-8">
          <span className="font-mono text-[0.7rem] text-dust tracking-[0.18em] uppercase">
            PLATE 02 · MARWARI WAR HORSE · 15.2 HH
          </span>
          <Link
            href="/anatomy"
            className="group inline-flex items-center gap-3 rounded-full border border-brass/40 px-6 py-2.5 font-mono text-[0.72rem] tracking-[0.16em] uppercase text-gold hover:border-gold hover:bg-gold/10 transition-all"
          >
            Explore the instrument
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
      </div>
    </section>
  );
}
