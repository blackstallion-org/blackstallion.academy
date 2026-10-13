"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Headline } from "@/components/film/Headline";
import { Label } from "@/components/film/Marks";
import { BlueprintPlan } from "@/components/sections/schools/BlueprintPlan";
import { GSAPScrollReveal } from "@/components/cinematic/GSAPScrollReveal";
import { schoolsTeaser } from "@/lib/content/home";
import { tiers } from "@/lib/content/schools";
import { cn } from "@/lib/utils";

/**
 * §9 Schools teaser · S09 Campus Citadel (Blueprint + Estate Aerial)
 * "YOUR CAMPUS becomes a citadel."
 * Zero capital expenditure to the school board. BSAH funds, builds, and runs the arena,
 * and returns 25–30% of tuition to the school.
 */
export function SchoolsTeaser() {
  const [id, setId] = useState(tiers[0].id);
  const [view, setView] = useState<"blueprint" | "aerial">("blueprint");
  const tier = tiers.find((t) => t.id === id)!;

  return (
    <section
      aria-labelledby="schools-h"
      className="relative bg-[#08090B] py-20 lg:py-32 border-b border-brass/20 overflow-hidden"
    >
      <div className="gutter relative grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] lg:items-center">
        {/* Left: Proposal & Tier Selection */}
        <div className="space-y-8">
          <GSAPScrollReveal variant="fade-up">
            <Label reel={10}>For school boards</Label>
          </GSAPScrollReveal>

          <GSAPScrollReveal variant="fade-up" delay={0.1}>
            <Headline
              id="schools-h"
              inscription={schoolsTeaser.inscription}
              voice={schoolsTeaser.voice}
            />
          </GSAPScrollReveal>

          <GSAPScrollReveal variant="fade-up" delay={0.2}>
            <p className="max-w-md text-sand font-serif text-lg leading-relaxed">
              {schoolsTeaser.body}
            </p>
          </GSAPScrollReveal>

          {/* Interactive Tier Switcher */}
          <GSAPScrollReveal variant="fade-up" delay={0.3}>
            <div className="flex flex-col border-t border-brass/20" role="radiogroup" aria-label="Hub tier">
            {tiers.map((t) => (
              <button
                key={t.id}
                type="button"
                role="radio"
                aria-checked={id === t.id}
                onClick={() => setId(t.id)}
                className={cn(
                  "group grid grid-cols-[1fr_auto] items-baseline gap-4 border-b border-brass/15 py-4 text-left transition-all",
                  id === t.id ? "bg-umber/30 px-4 -mx-4 rounded-xl border-gold/40" : "hover:bg-umber/15"
                )}
              >
                <span>
                  <span
                    className={cn(
                      "t-voice block text-2xl transition-colors",
                      id === t.id ? "text-gold" : "text-sand group-hover:text-bone"
                    )}
                  >
                    {t.name}
                  </span>
                  <span className="t-ui mt-1 block text-xs text-dust">
                    {t.stables} stables · {t.acres} · {t.cadets} cadets
                  </span>
                </span>
                <span
                  className={cn(
                    "font-mono text-sm font-bold",
                    id === t.id ? "text-gold" : "text-dust"
                  )}
                >
                  {t.capexLabel}
                </span>
              </button>
            ))}
          </div>
          </GSAPScrollReveal>

          <GSAPScrollReveal variant="fade-up" delay={0.4} className="pt-2">
            <Link
              href="/schools"
              className="group inline-flex items-center gap-3 rounded-full bg-gold px-7 py-3.5 font-mono text-[0.72rem] tracking-[0.16em] uppercase text-night font-bold transition-all hover:bg-bone hover:shadow-[0_0_20px_rgba(197,160,89,0.4)]"
            >
              Explore our facilities
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
          </GSAPScrollReveal>
        </div>

        {/* Right: Architectural Plan & Aerial Estate Photo View */}
        <GSAPScrollReveal
          variant="fade-up"
          delay={0.2}
          className="relative rounded-3xl border border-brass/25 bg-umber/30 p-4 lg:p-6 shadow-2xl backdrop-blur-md"
        >
          {/* View Toggles */}
          <div className="flex items-center justify-between mb-4 border-b border-brass/15 pb-3">
            <span className="font-mono text-[0.65rem] tracking-[0.2em] uppercase text-gold">
              CAD DRAWING: {tier.id.toUpperCase()}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setView("blueprint")}
                className={cn(
                  "font-mono text-[0.65rem] tracking-[0.14em] uppercase px-3 py-1 rounded-full transition-all",
                  view === "blueprint"
                    ? "bg-gold text-night font-bold"
                    : "border border-brass/30 text-sand hover:text-gold"
                )}
              >
                Blueprint
              </button>
              <button
                type="button"
                onClick={() => setView("aerial")}
                className={cn(
                  "font-mono text-[0.65rem] tracking-[0.14em] uppercase px-3 py-1 rounded-full transition-all",
                  view === "aerial"
                    ? "bg-gold text-night font-bold"
                    : "border border-brass/30 text-sand hover:text-gold"
                )}
              >
                Aerial Estate
              </button>
            </div>
          </div>

          <div className="relative aspect-[800/480] w-full rounded-2xl overflow-hidden border border-brass/20 bg-night">
            {view === "blueprint" ? (
              <div className="p-2 h-full w-full">
                <BlueprintPlan tier={tier} />
              </div>
            ) : (
              <div className="relative h-full w-full">
                <Image
                  src="/images/arena-hero.jpg"
                  alt="Aerial view of school riding arena"
                  fill
                  unoptimized
                  className="object-cover"
                />
                <div
                  aria-hidden
                  className="absolute inset-0 bg-gradient-to-t from-night/80 via-transparent to-transparent"
                />
                <div className="absolute bottom-4 left-4 z-10 flex items-center gap-2 bg-night/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-brass/30">
                  <span className="font-mono text-[0.65rem] text-gold tracking-[0.16em] uppercase">
                    RENDER · {tier.name.toUpperCase()} ON CAMPUS
                  </span>
                </div>
              </div>
            )}
          </div>

          <p className="font-mono text-[0.62rem] text-dust mt-3 text-right tracking-[0.14em] uppercase">
            SCALE 1:200 · CERTIFIED BY ARCHITECTURAL CORPS · ZERO-CAPEX ENGINE
          </p>
        </GSAPScrollReveal>
      </div>
    </section>
  );
}
