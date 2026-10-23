"use client";

import { ScrollRevealText } from "@/components/motion/ScrollRevealText";

import { motion, useReducedMotion } from "motion/react";
import { HeroFilm } from "./HeroFilm";
import { AcademyStats } from "./AcademyStats";
import { Crest } from "@/components/brand/Crest";
import { Cta } from "@/components/film/Marks";
import { hero } from "@/lib/content/home";
import { ease } from "@/lib/motion/tokens";

/**
 * §1 Hero · Full-frame cinematic opening film + Institutional doctrine below.
 * The video plays full screen without obstruction, followed by the manifesto down below.
 */
export function Hero() {
  return (
    <>
      <HeroVideoSection />
      <HeroContentSection />
    </>
  );
}

function HeroVideoSection() {
  return <HeroFilm />;
}

function HeroContentSection() {
  return (
    <section id="doctrine" tabIndex={-1} aria-label="Institutional Doctrine" className="relative bg-night py-16 md:py-24">
      <div className="gutter space-y-12 md:space-y-16">
        {/* Crest & Council badge */}
        <motion.p
          className="label flex items-center gap-3 text-sand"
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: ease.citadel }}
        >
          <Crest simple className="h-9 w-9" title="STPCI crest" />
          <span className="max-w-[16rem] sm:max-w-none">{hero.badge}</span>
        </motion.p>

        {/* The doctrine: one confident statement. Each sentence is its own line so "We" never dangles at a break;
            text-wrap: balance evens the lines on narrow phones. */}
        {/* The observer sits on the h1 (not the masked lines, which start clipped and would never intersect). */}
        <motion.h1
          className="doctrine-statement max-w-[17ch] text-balance sm:max-w-[19ch] lg:max-w-none"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.4 }}
        >
          {hero.statement.map((sentence, i) => (
            <span key={sentence} className="block overflow-hidden pb-[0.08em]">
              <motion.span
                className={i === 0 ? "block text-bone" : "block italic text-gold"}
                variants={{ hidden: { y: "105%" }, visible: { y: "0%", transition: { duration: 1.3, ease: ease.citadel, delay: i * 0.18 } } }}
              >
                {sentence}
              </motion.span>
              {i === 0 && " "}
            </span>
          ))}
        </motion.h1>

        {/* Lede & CTAs */}
        <div className="grid gap-8 border-t border-brass/25 pt-8 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
          <ScrollRevealText className="max-w-2xl text-lede text-sand leading-relaxed">{hero.sub}</ScrollRevealText>
          <div className="flex flex-wrap gap-4">
            <Cta href={hero.ctas[0].href} variant="solid">
              {hero.ctas[0].label}
            </Cta>
            <Cta href={hero.ctas[1].href}>{hero.ctas[1].label}</Cta>
          </div>
        </div>

        {/* Stats and Ticker */}
        <div className="pt-4">
          <AcademyStats />
          <Ticker />
        </div>
      </div>
    </section>
  );
}

function Ticker() {
  const reduced = useReducedMotion();
  const items = [...hero.ticker, ...hero.ticker];
  return (
    <div className="mt-8 overflow-hidden border-y border-brass py-2.5" aria-label="Live command figures (sample)">
      <div className={reduced ? "flex gap-10" : "animate-marquee flex w-max gap-10"}>
        {items.map((t, i) => (
          <span key={i} className="font-mono flex items-center gap-10 whitespace-nowrap text-[0.68rem] uppercase tracking-[0.12em] text-sand/80">
            {i % hero.ticker.length === 0 && <span className="h-1.5 w-1.5 rounded-full bg-blood" aria-hidden />}
            {t}
            <span aria-hidden className="text-brass/50">·</span>
          </span>
        ))}
      </div>
    </div>
  );
}
