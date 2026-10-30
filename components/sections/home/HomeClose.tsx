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
import { DeckCorners, DeckFrame, DeckLockup } from "@/components/film/Deck";

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

/**
 * §15 Finale · the closing slide (30 Oct 2026, after the owner's references: the "contacts" slide). The dune still full-bleed in
 * a dark panel on the ivory margin, one lockup in the centre, the three doors as text links beneath it, the e-mail corridors and
 * the motto in the corners. Was a stack of boxed buttons and e-mail chips.
 */
export function Finale() {
  return (
    <section aria-label="The arena is open">
      <DeckFrame>
        <div className="relative flex min-h-[92svh] flex-col items-center justify-center overflow-hidden px-6 pb-60 pt-28 md:pb-36">
          <FilmImage name="duneSilhouette" grade="deep" sizes="100vw" />
          <div aria-hidden className="absolute inset-0 bg-night/45" />
          <div aria-hidden className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_50%_45%,transparent_0%,color-mix(in_srgb,var(--color-night)_75%,transparent)_100%)]" />

          <DeckLockup as="h2" caps="The arena" script="is open." left="Reel 16" right="The gate" sub={finale.voice} className="relative z-10" />

          <ul className="relative z-10 mt-10 flex flex-wrap justify-center gap-x-8 gap-y-4">
            {finale.ctas.map((c, i) => (
              <li key={c.href}>
                <Link
                  href={c.href}
                  className={cn(
                    "label group inline-flex items-center gap-3 border-b pb-1.5 transition-colors hover:border-gold hover:text-gold",
                    i === 0 ? "border-gold text-gold" : "border-line text-bone",
                  )}
                >
                  {c.label}
                  <Arrow className="transition-transform group-hover:translate-x-1" />
                </Link>
              </li>
            ))}
          </ul>

          <DeckCorners tag={entity.motto} />
          <div className="absolute inset-x-0 bottom-0 z-20 flex flex-wrap items-end justify-between gap-x-10 gap-y-5 p-[clamp(20px,3vw,40px)]">
            <p className="t-ui max-w-[16rem] text-xs leading-relaxed text-sand">
              {entity.mottoEn}.{" "}
              <Link href="/legend" className="whitespace-nowrap text-gold underline decoration-line underline-offset-4 hover:text-bone">
                Begin at reel one
              </Link>
            </p>
            <ul className="t-ui flex flex-col gap-1 text-xs text-sand md:items-end">
              {corridors.map((c) => (
                <li key={c.id}>
                  <span className="text-dust">{c.title}:</span>{" "}
                  <a href={`mailto:${c.email}`} className="hover:text-gold">
                    {c.email}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </DeckFrame>
    </section>
  );
}
