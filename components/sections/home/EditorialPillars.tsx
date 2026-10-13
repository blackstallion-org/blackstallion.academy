"use client";

import Image from "next/image";
import Link from "next/link";
import { GSAPScrollReveal } from "@/components/cinematic/GSAPScrollReveal";
import { Label } from "@/components/film/Marks";

/**
 * §14.5 Editorial Pillars & Academy Creed — Direct from Gemini Reference Image (Screen 5)
 *
 * 4 Monumental Pillars:
 *   01 World Class Training
 *   02 Elite Horses
 *   03 Modern Facilities
 *   04 Lifelong Community
 *
 * Alongside the iconic quote card: "The horse teaches us what no book can. — BSAH"
 */
export function EditorialPillars() {
  const pillars = [
    {
      num: "01",
      title: "World Class Training",
      desc: "Tent pegging, mounted archery, dressage, and cavalry skill-at-arms drilled by Indian Army RVC veterans.",
    },
    {
      num: "02",
      title: "Elite Horses",
      desc: "Indigenous Marwari and Kathiawari stallions, bred for endurance, 180° acoustic radar, and unflinching courage.",
    },
    {
      num: "03",
      title: "Turnkey Campus Citadels",
      desc: "Spacious stables, regulation dressage arenas, and laser-graded tent pegging lanes funded 100% by BSAH.",
    },
    {
      num: "04",
      title: "Lifelong Community",
      desc: "A brotherhood and sisterhood of young leaders, sealed passports, and national circuit championships.",
    },
  ];

  return (
    <section
      aria-label="The Journey Builds the Rider"
      className="relative bg-[#08090B] py-20 lg:py-32 border-b border-brass/20 overflow-hidden"
    >
      <div className="gutter space-y-16">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-brass/15 pb-8">
          <div>
            <GSAPScrollReveal variant="fade-up">
              <Label>Core Foundations</Label>
            </GSAPScrollReveal>
            <GSAPScrollReveal variant="fade-up" delay={0.1}>
              <h2 className="mt-4 text-[clamp(2.5rem,5.5vw,5rem)] t-voice text-bone leading-[0.95]">
                The journey builds the rider.
              </h2>
            </GSAPScrollReveal>
          </div>
          <GSAPScrollReveal variant="fade-up" delay={0.2}>
            <p className="max-w-md text-sand font-serif text-lg leading-relaxed">
              More than a school. A way of life. BSAH shapes riders who lead with courage, humility, and unbreakable purpose.
            </p>
          </GSAPScrollReveal>
        </div>

        {/* 4 Pillars Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {pillars.map((p, i) => (
            <GSAPScrollReveal
              key={p.num}
              variant="fade-up"
              delay={i * 0.1}
              className="group relative flex flex-col justify-between rounded-2xl border border-brass/20 bg-gradient-to-b from-umber/40 to-night p-8 transition-all hover:border-gold/60 hover:-translate-y-1"
            >
              <div className="space-y-4">
                <span className="font-mono text-xs text-gold tracking-[0.2em]">
                  {p.num}
                </span>
                <h3 className="t-voice text-2xl text-bone group-hover:text-gold transition-colors">
                  {p.title}
                </h3>
                <p className="text-sand/80 text-sm font-serif leading-relaxed">
                  {p.desc}
                </p>
              </div>
              <div className="mt-8 pt-4 border-t border-brass/15 flex items-center justify-between">
                <span className="font-mono text-[0.65rem] tracking-[0.16em] uppercase text-dust">
                  PILLAR {p.num}
                </span>
                <span className="text-gold text-sm group-hover:translate-x-1 transition-transform">
                  →
                </span>
              </div>
            </GSAPScrollReveal>
          ))}
        </div>

        {/* Monumental Quote Card & Dusk Silhouette (From Reference Image) */}
        <GSAPScrollReveal
          variant="fade-up"
          delay={0.2}
          className="relative rounded-3xl border border-brass/30 bg-gradient-to-r from-[#1A1715] via-[#121318] to-[#08090B] p-10 lg:p-16 overflow-hidden shadow-2xl"
        >
          <div
            aria-hidden
            className="pointer-events-none absolute -right-20 -bottom-20 h-96 w-96 rounded-full bg-gold/10 blur-3xl"
          />

          <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr] lg:items-center">
            <div className="space-y-6">
              <span className="font-mono text-xs text-gold tracking-[0.22em] uppercase">
                THE SOVEREIGN MOTTO · DOMINUS EQUI
              </span>
              <blockquote className="t-voice text-[clamp(2.2rem,4.5vw,4.2rem)] text-bone leading-[1.05]">
                &ldquo;The horse teaches us what no book can.&rdquo;
              </blockquote>
              <p className="font-serif italic text-sand text-lg">
                — The Black Stallion Academy of Horsemanship
              </p>
              <div className="pt-4">
                <Link
                  href="/curriculum"
                  className="group inline-flex items-center gap-3 rounded-full bg-gold px-7 py-3 font-mono text-[0.72rem] tracking-[0.16em] uppercase text-night font-bold transition-all hover:bg-bone hover:shadow-[0_0_20px_rgba(197,160,89,0.4)]"
                >
                  Explore curriculum
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

            <div className="relative aspect-[4/3] w-full rounded-2xl overflow-hidden border border-brass/25 shadow-xl">
              <Image
                src="/images/arena-hero.jpg"
                alt="Stallion in the arena at sunset"
                fill
                unoptimized
                className="object-cover filter brightness-90 contrast-105"
              />
              <div
                aria-hidden
                className="absolute inset-0 bg-gradient-to-t from-[#08090B]/80 via-transparent to-transparent"
              />
              <div className="absolute bottom-4 left-4 z-10 flex items-center gap-2">
                <Image
                  src="/brand/crest.svg"
                  alt="BSAH Crest"
                  width={20}
                  height={20}
                  className="h-5 w-5 text-gold"
                />
                <span className="font-mono text-[0.65rem] tracking-[0.18em] uppercase text-bone">
                  SOVEREIGN CITADEL ARENA
                </span>
              </div>
            </div>
          </div>
        </GSAPScrollReveal>
      </div>
    </section>
  );
}
