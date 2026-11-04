"use client";


import { Fragment } from "react";
import { HeroFilm } from "./HeroFilm";
import { StallionHero } from "./StallionHero";
import { Cta } from "@/components/film/Marks";
import { hero } from "@/lib/content/home";
import { LOGO } from "@/lib/content/site";
import styles from "./Hero.module.css";

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
    <section id="doctrine" tabIndex={-1} aria-label="Who we are" className={styles.hero}>
      <div className={styles.content}>
        {/* A plain picture: next/image refuses the ?v= cache key on a local file. The logo is the BSAH crest (4 Nov 2026 update). */}
        {/* eslint-disable-next-line @next/next/no-img-element -- see the note above */}
        <img
          src={LOGO.lg}
          alt="The Black Stallion Academy of Horsemanship crest"
          width={900}
          height={900}
          fetchPriority="high"
          className={styles.crest}
        />
        <h1 className={styles.statement}>
          {hero.statement.map((sentence, index) => {
            const words = sentence.split(" ");
            return (
              <span key={sentence} className={index === 1 ? styles.emphasis : undefined}>
                {words.map((word, w) => (
                  <Fragment key={w}>
                    <span className={styles.word} style={{ animationDelay: `${0.2 + index * 0.9 + w * 0.12}s` }}>{word}</span>
                    {w < words.length - 1 ? " " : null}
                  </Fragment>
                ))}
              </span>
            );
          })}
        </h1>
        <p className={styles.intro}>{hero.sub}</p>
        <div className={styles.actions}>
          <Cta href={hero.ctas[0].href} variant="solid" className={styles.primary}>{hero.ctas[0].label}</Cta>
          <Cta href={hero.ctas[1].href} className={styles.secondary}>{hero.ctas[1].label}</Cta>
        </div>
        <dl className={styles.stats} aria-label="Academy at a glance">
          {hero.stats.map((stat) => (
            <div key={stat.value}>
              <dt>{stat.label}</dt>
              <dd>{stat.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
