"use client";

import Link from "next/link";
import { AnimatePresence, motion, useTransform } from "motion/react";
import { useState } from "react";
import { FilmImage } from "@/components/film/FilmImage";
import { Headline } from "@/components/film/Headline";
import { Arrow, Cta, Label } from "@/components/film/Marks";
import { PinnedScene } from "@/components/film/PinnedScene";
import { r } from "@/components/film/range";
import { Terminal } from "@/components/sections/command/Terminal";
import { chronicle, command, finale } from "@/lib/content/home";
import { posts } from "@/lib/content/journal";
import { corridors, entity } from "@/lib/content/site";
import { ease } from "@/lib/motion/tokens";
import { cn } from "@/lib/utils";

/** §13 Command AI · S13 terminal. Signature: the question types itself, the answer streams in. */
export function HomeCommand() {
  return (
    <section aria-labelledby="command-h" className="relative py-[clamp(6rem,14vh,12rem)]">
      <div className="gutter grid gap-12 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:items-center">
        <div>
          <Label reel={13}>Command AI</Label>
          <Headline id="command-h" className="mt-4" inscription={command.inscription} voice={command.voice} />
          <p className="mt-6 max-w-md text-sand">For principals and trustees: returns, insurance, safety and curriculum, answered on the spot.</p>
          <div className="mt-10">
            <Cta href="/command">Open the terminal</Cta>
          </div>
        </div>
        <Terminal opening={command.question} chips={command.chips} />
      </div>
    </section>
  );
}

/** §14 The Chronicle · S14 editorial index. Signature: the cover swaps as you move down the headlines. */
export function HomeChronicle() {
  const list = posts.slice(0, 4);
  const [i, setI] = useState(0);
  const p = list[i];

  return (
    <section aria-labelledby="chronicle-h" className="relative py-[clamp(6rem,14vh,12rem)]">
      <div className="gutter">
        <Label reel={14}>The Chronicle</Label>
        <Headline id="chronicle-h" className="mt-4" inscription={chronicle.inscription} voice={chronicle.voice} />
      </div>
      <div className="gutter mt-12 grid gap-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
        <Link href={`/journal/${p.slug}`} className="group relative block aspect-[4/3] overflow-hidden" aria-label={`${p.title.join(" ")} — read`}>
          <AnimatePresence mode="popLayout">
            <motion.div key={p.slug} className="absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.8, ease: ease.citadel }}>
              <FilmImage name={p.cover} sizes="(min-width: 1024px) 55vw, 100vw" className="transition-transform duration-[1600ms] group-hover:scale-[1.03]" />
            </motion.div>
          </AnimatePresence>
          <div aria-hidden className="absolute inset-0 shade-b" />
          <div className="absolute inset-x-0 bottom-0 p-6 md:p-8">
            <p className="label text-brass">
              {p.category} · {p.minutes} min read
            </p>
            <p className="t-voice mt-2 text-display-3 text-bone">{p.title.join(" ")}</p>
          </div>
        </Link>
        <ol className="border-t border-brass/15">
          {list.map((post, k) => (
            <li key={post.slug}>
              <Link
                href={`/journal/${post.slug}`}
                onMouseEnter={() => setI(k)}
                onFocus={() => setI(k)}
                className="group grid grid-cols-[2rem_1fr] gap-3 border-b border-brass/15 py-6"
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

/** §15 Finale · S15 credits roll. Signature: credits roll up past the three held calls to action. */
export function Finale() {
  return (
    <PinnedScene length={2.4} label="The arena is open" reducedFallback={<FinaleFrame />}>
      {(p) => <FinaleRolling progress={p} />}
    </PinnedScene>
  );
}

const credits: [string, string][] = [
  ["A production of", entity.parent],
  ["Operated by", entity.operator],
  ["Sanctioned by", entity.council],
  ["Starring", "Twenty-one Marwari and Kathiawari stallions"],
  ["And", "Every cadet who has earned a seal"],
  ["Filmed on location", "Hyderabad, Telangana"],
];

function FinaleRolling({ progress }: { progress: import("motion/react").MotionValue<number> }) {
  const y = useTransform(progress, r(0, 1), ["60%", "-120%"]);
  const ctaOpacity = useTransform(progress, r(0.25, 0.45), [0, 1]);
  return (
    <div className="relative h-full">
      <FilmImage name="duneSilhouette" grade="deep" className="opacity-70" />
      <div aria-hidden className="absolute inset-0 bg-night/50" />
      <motion.ul className="absolute inset-x-0 top-0 flex flex-col items-center gap-10 text-center" style={{ y }} aria-hidden>
        {credits.map(([k, v]) => (
          <li key={k}>
            <p className="label text-dust">{k}</p>
            <p className="t-inscribe mt-2 text-[clamp(0.9rem,1.6vw,1.3rem)] text-sand">{v}</p>
          </li>
        ))}
      </motion.ul>
      <motion.div className="relative flex h-full items-center" style={{ opacity: ctaOpacity }}>
        <FinaleFrame inline />
      </motion.div>
    </div>
  );
}

function FinaleFrame({ inline = false }: { inline?: boolean }) {
  return (
    <div className={cn("gutter w-full text-center", !inline && "relative py-32")}>
      {!inline && <FilmImage name="duneSilhouette" grade="deep" className="opacity-60" />}
      <div className="relative mx-auto max-w-5xl rounded-[1px] bg-night/40 py-10 backdrop-blur-[2px]">
        <Headline as="h2" size="1" inscription={finale.inscription} voice={finale.voice} className="mx-auto" />
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          {finale.ctas.map((c, i) => (
            <Cta key={c.href} href={c.href} variant={i === 0 ? "solid" : "ghost"}>
              {c.label}
            </Cta>
          ))}
        </div>
        <ul className="mt-10 flex flex-col items-center justify-center gap-2 sm:flex-row sm:gap-8">
          {corridors.map((c) => (
            <li key={c.id}>
              <a href={`mailto:${c.email}`} className="t-ui text-sm text-sand hover:text-gold">
                {c.email}
              </a>
            </li>
          ))}
        </ul>
        <p className="t-story mt-8 italic text-dust">
          {entity.motto}. {entity.mottoEn}.
        </p>
        <Link href="/legend" className="label mt-6 inline-flex items-center gap-2 text-gold/80 hover:text-gold">
          Begin at reel one <Arrow />
        </Link>
      </div>
    </div>
  );
}
