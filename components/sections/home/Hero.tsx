"use client";


import { motion } from "motion/react";
import { HeroFilm } from "./HeroFilm";
import { StallionHero } from "./StallionHero";
import { AcademyStats } from "./AcademyStats";
import { Crest } from "@/components/brand/Crest";
import { Cta } from "@/components/film/Marks";
import { hero } from "@/lib/content/home";
import { ease } from "@/lib/motion/tokens";

/**
 * §1 Hero (order since 2 Nov 2026): who we are and what we do first, then the full-frame opening film, then the Rajasthan
 * desert horse. The doctrine is the first screen after the opening zoom, so it clears the fixed nav itself.
 */
export function Hero() {
  return (
    <>
      <HeroContentSection />
      <HeroVideoSection />
      <StallionHero />
    </>
  );
}

function HeroVideoSection() {
  return <HeroFilm />;
}

function HeroContentSection() {
  return (
    <section id="doctrine" tabIndex={-1} aria-label="Who we are" className="relative flex min-h-[100svh] flex-col justify-center bg-night pb-16 pt-28 md:pb-24 md:pt-32">
      <div className="gutter space-y-10 md:space-y-14">
        {/* Crest & Council badge */}
        <motion.p
          className="label flex items-center gap-3 text-sand"
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: ease.citadel }}
        >
          <Crest simple className="h-9 w-9" title="STPCI crest" />
          <span className="max-w-[16rem] sm:max-w-none">Who we are · {hero.badge}</span>
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
          {/* The first screen now: plain text, not the scroll-lit reveal, so it reads at once. */}
          <p className="max-w-2xl text-lede leading-relaxed text-sand">{hero.sub}</p>
          <div className="flex flex-wrap gap-4">
            <Cta href={hero.ctas[0].href} variant="solid">
              {hero.ctas[0].label}
            </Cta>
            <Cta href={hero.ctas[1].href}>{hero.ctas[1].label}</Cta>
          </div>
        </div>

        {/* Stats. The sample-figures ticker was removed on 2 Nov 2026 (dense, and all of it sample data). */}
        <div className="pt-2">
          <AcademyStats />
        </div>
      </div>
    </section>
  );
}

