"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { FilmImage } from "@/components/film/FilmImage";
import { HomeHeadline as Headline } from "./HomeTypography";
import { Arrow, Cta, Label } from "@/components/film/Marks";
import { CommandTeaser } from "@/components/sections/command/CommandExperience";
import { chronicle, finale } from "@/lib/content/home";
import { posts } from "@/lib/content/journal";
import { corridors, entity } from "@/lib/content/site";
import { ease } from "@/lib/motion/tokens";
import { cn } from "@/lib/utils";
import { BrassBorder } from "@/components/motion/fx/BrassBorder";

/** §13 Command AI · S13 terminal. Signature: the question types itself, the answer streams in. */
export function HomeCommand() {
  return <CommandTeaser />;
}

/** §14 The Chronicle · S14 editorial index. Signature: the cover swaps as you move down the headlines. */
export function HomeChronicle() {
  const list = posts.slice(0, 4);
  const [i, setI] = useState(0);
  const p = list[i];

  return (
    <section aria-labelledby="chronicle-h" className="relative py-[clamp(6rem,14vh,12rem)]">
      <div className="gutter">
        <Label reel={15}>The Chronicle</Label>
        <Headline id="chronicle-h" className="mt-4" inscription={chronicle.inscription} voice={chronicle.voice} />
      </div>
      <div className="gutter mt-12 grid gap-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
        <Link href={`/journal/${p.slug}`} className="group relative block">
          <div className="relative aspect-[4/3] overflow-hidden">
          <AnimatePresence mode="popLayout">
            <motion.div key={p.slug} className="absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.8, ease: ease.citadel }}>
              <FilmImage name={p.cover} sizes="(min-width: 1024px) 55vw, 100vw" />
            </motion.div>
          </AnimatePresence>
          </div>
          <div className="relative py-6">
            <p className="label text-brass">
              {p.category} · {p.minutes} min read
            </p>
            <p className="t-voice mt-2 text-display-3 text-bone">{p.title.join(" ")}</p>
          </div>
        </Link>
        <ol className="border-t border-line">
          {list.map((post, k) => (
            <li data-home-detail key={post.slug}>
              <Link
                href={`/journal/${post.slug}`}
                onMouseEnter={() => setI(k)}
                onFocus={() => setI(k)}
                className="group grid grid-cols-[2rem_1fr] gap-3 border-b border-line py-6"
              >
                <span className="font-mono pt-1 text-xs text-dust">{String(k + 1).padStart(2, "0")}</span>
                <span>
                  <span className={cn("t-voice block text-xl transition-colors md:text-2xl", i === k ? "text-gold" : "text-bone group-hover:text-gold")}>
                    {post.title.join(" ")}
                  </span>
                  <span className="mt-2 block text-sm text-sand/80">{post.dek}</span>
                </span>
              </Link>
            </li>
          ))}
          <li className="pt-8">
            <Cta href="/journal" variant="link">
              Read the Chronicle
            </Cta>
          </li>
        </ol>
      </div>
    </section>
  );
}

/** §15 Finale · S15 The Arena is Open · Stealth Bomber & Snow Gallop Finale */
export function Finale() {
  return (
    <section aria-label="The arena is open" className="relative tone-dark surface-leather min-h-[100svh] overflow-hidden bg-night">
      <FinaleFrame />
    </section>
  );
}

function FinaleFrame({ inline = false }: { inline?: boolean }) {
  return (
    <div className={cn("relative min-h-[100svh] w-full flex items-center justify-center py-12 md:py-16 overflow-hidden bg-night", inline && "min-h-full py-0")}>
      {/* Edge-to-edge full screen cinematic background image */}
      <FilmImage name="duneSilhouette" grade="deep" className="opacity-100" />

      {/* Minimized, Elegant Editorial Content */}
      <div data-home-final-copy className="relative mx-auto max-w-3xl px-6 py-8 text-center z-20 flex flex-col items-center">
        {/* Minimized Inscription */}
        <p data-home-final-intro className="font-mono text-[0.68rem] sm:text-xs tracking-[0.3em] uppercase text-gold/90 mb-2 [text-shadow:0_1px_8px_rgba(0,0,0,0.8)]">
          {finale.inscription}
        </p>

        {/* Minimized, Refined Headline */}
        <h2 data-home-phrase data-home-final-title className="font-serif text-2xl sm:text-3xl md:text-4xl font-light text-bone tracking-tight leading-snug [text-shadow:0_2px_14px_rgba(0,0,0,0.85)] max-w-xl mx-auto">
          {finale.voice}
        </h2>

        {/* Action Buttons - Sleek, Compact Luxury Pills */}
        <div data-home-detail className="mt-8 flex flex-wrap justify-center gap-3">
          {finale.ctas.map((c, i) =>
            i === 0 ? (
              <BrassBorder key={c.href} as={Link} href={c.href} className="tone-dark group bg-night px-5 py-3 text-bone sm:px-7 sm:py-4">
                <span>{c.label}</span>
                <Arrow className="transition-transform group-hover:translate-x-1" />
              </BrassBorder>
            ) : (
              <Link
                key={c.href}
                href={c.href}
                className="tone-dark label group inline-flex items-center gap-3 border border-line bg-night/85 px-5 py-3 text-sand transition-colors hover:border-gold hover:text-bone sm:px-7 sm:py-4"
              >
                <span>{c.label}</span>
                <Arrow className="transition-transform group-hover:translate-x-1" />
              </Link>
            ),
          )}
        </div>

        {/* Email Corridors - Clean Compact Micro Pills */}
        <ul className="mt-5 flex flex-wrap items-center justify-center gap-1.5 sm:gap-2">
          {corridors.map((c) => (
            <li key={c.id}>
              <a
                href={`mailto:${c.email}`}
                className="inline-block border border-line bg-night/80 px-3 py-1 font-mono text-[0.66rem] tracking-wider text-sand transition-colors hover:border-gold hover:text-gold"
              >
                {c.email}
              </a>
            </li>
          ))}
        </ul>

        {/* Motto & Reel One Link */}
        <p className="mt-5 font-serif italic text-xs sm:text-sm text-sand/80 [text-shadow:0_1px_8px_rgba(0,0,0,0.8)]">
          {entity.motto}. {entity.mottoEn}.
        </p>
        <Link
          href="/legend"
          className="mt-2 inline-flex min-h-6 items-center gap-2 font-mono text-[0.66rem] uppercase tracking-[0.22em] text-gold hover:text-bone transition-colors"
        >
          <span>Begin at reel one</span>
          <Arrow />
        </Link>
      </div>
    </div>
  );
}
