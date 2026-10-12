"use client";

import Link from "next/link";
import { motion, useMotionValueEvent, useScroll, useTransform, type MotionValue } from "motion/react";
import { useReducedMotion } from "@/lib/motion/reduced";
import { useRef, useState } from "react";
import { Monogram } from "@/components/brand/Monogram";
import { FilmImage } from "@/components/film/FilmImage";
import { Headline } from "@/components/film/Headline";
import { Arrow, Label, ReelMark } from "@/components/film/Marks";
import { PinnedScene } from "@/components/film/PinnedScene";
import { r } from "@/components/film/range";
import { Reveal } from "@/components/film/Reveal";
import { creed, day, passport, reels, spotlights, uniform } from "@/lib/content/academy";
import { ease } from "@/lib/motion/tokens";
import { cn } from "@/lib/utils";
import { QrSeal } from "@/components/brand/QrSeal";

/** Title card · T8 portrait. Signature: a tall portrait rises beside the title with a vertical name credit. */
export function CadetsTitle() {
  return (
    <section aria-labelledby="cadets-h" className="relative min-h-[100svh] overflow-hidden pt-24">
      <div className="gutter grid min-h-[calc(100svh-6rem)] gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:items-end">
        <div className="pb-[8vh]">
          <ReelMark n={7} act="citadel" />
          <Headline id="cadets-h" as="h1" size="poster" animate="mount" className="mt-6" inscription="The hall" voice="of valour." />
          <p className="t-story mt-6 max-w-lg text-sand">Cadets earn their place: hour by hour, rank by rank, sealed in brass.</p>
        </div>
        <motion.div className="relative h-[70svh] lg:h-[86svh]" initial={{ clipPath: "inset(100% 0 0 0)" }} animate={{ clipPath: "inset(0% 0 0 0)" }} transition={{ duration: 1.6, ease: ease.citadel, delay: 0.3 }}>
          <FilmImage name="cadetZayd" priority sizes="(min-width: 1024px) 45vw, 100vw" />
          <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-night via-transparent to-transparent" />
          <p className="label absolute right-3 top-6 text-ivory/90 [text-shadow:0_1px_10px_rgb(23_21_19/0.55)] [writing-mode:vertical-rl]">Cadet Alpha · Cadet Knight · sample</p>
        </motion.div>
      </div>
    </section>
  );
}

/** §1 · S43 staggered portraits. */
export function Spotlights() {
  return (
    <section aria-labelledby="spot-h" className="gutter relative py-[clamp(6rem,14vh,12rem)]">
      <Label>Spotlights</Label>
      <Headline id="spot-h" className="mt-4" inscription="Hours earned," voice="names remembered." />
      <ol className="mt-16 grid gap-14 md:grid-cols-3 md:gap-8">
        {spotlights.map((s, i) => (
          <Reveal as="li" key={s.name} delay={i * 0.12} className={cn(i === 1 && "md:mt-24", i === 2 && "md:mt-48")}>
            <div className="relative aspect-[3/4] overflow-hidden">
              <FilmImage name={s.image} sizes="(min-width: 768px) 30vw, 100vw" />
              <div aria-hidden className="absolute inset-0 shade-b" />
              <span className="font-mono absolute left-4 top-4 text-xs text-gold">{s.hours} HRS</span>
            </div>
            <p className="label mt-5 text-brass">{s.rank}</p>
            <p className="t-voice mt-1 text-3xl text-bone">{s.name}</p>
            <p className="mt-2 text-sand">{s.honour}</p>
            <p className="t-ui mt-1 text-sm text-dust">{s.hub}</p>
            <Link href={`/verify/${s.code}`} className="label mt-4 inline-flex items-center gap-3 text-gold hover:text-bone">
              Verify record <Arrow />
            </Link>
          </Reveal>
        ))}
      </ol>
      <p className="t-ui mt-12 text-xs text-dust">Spotlights are sample records with invented callsigns, not real cadets; portraits are AI placeholders.</p>
    </section>
  );
}

/** §2 · S44 passport object. Signature: the leather cover swings open as you scroll, revealing the seals. */
export function PassportObject() {
  return (
    <PinnedScene id="passport" length={2.6} label="The Sovereign Passport" className="tone-dark surface-leather" reducedFallback={<PassportFrame open />}>
      {(p) => <PassportFrame progress={p} />}
    </PinnedScene>
  );
}

function PassportFrame({ progress, open = false }: { progress?: MotionValue<number>; open?: boolean }) {
  const { scrollYProgress } = useScroll();
  const p = progress ?? scrollYProgress;
  const rotate = useTransform(p, r(0.1, 0.55), [open ? -178 : 0, -178]);
  const pagesOpacity = useTransform(p, r(0.35, 0.6), [open ? 1 : 0, 1]);
  const [stage, setStage] = useState(open ? 3 : 0);
  useMotionValueEvent(p, "change", (v) => setStage(v < 0.55 ? 0 : v < 0.7 ? 1 : v < 0.85 ? 2 : 3));
  const seals = ["Squire", "Rider", "Knight", "Lancer"];

  return (
    <div className={cn("relative flex h-full items-center", open && "min-h-[100svh] py-24")}>
      <FilmImage name="bgPassport" grade="deep" className="opacity-30" />
      <div className="gutter relative grid w-full gap-12 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:items-center">
        <div>
          <Label>The passport</Label>
          <Headline className="mt-4" inscription={passport.inscription} voice={passport.voice} />
          <p className="t-story mt-6 max-w-md text-sand">{passport.body}</p>
        </div>
        <div className="mx-auto w-full max-w-[34rem] [perspective:1800px]">
          <div className="relative ml-[50%] aspect-[3/4] w-1/2">
            {/* Inner right page */}
            <motion.div className="parchment absolute inset-0 p-4 sm:p-6" style={{ opacity: pagesOpacity }}>
              <p className="label text-[#6b5130]">Seals</p>
              <ul className="mt-3 grid grid-cols-2 gap-3">
                {seals.map((s, i) => (
                  <li key={s} className="flex flex-col items-center">
                    <motion.span
                      className={cn("grid h-12 w-12 place-items-center rounded-full border-2 sm:h-16 sm:w-16", i < 3 ? "border-caramel bg-caramel/60" : "border-dashed border-caramel/50")}
                      animate={{ scale: i < 3 && stage > i ? 1 : i < 3 ? 1.3 : 1, opacity: i < 3 ? (stage > i ? 1 : 0) : 1 }}
                      transition={{ duration: 0.35, ease: ease.citadel }}
                    >
                      {i < 3 && <Monogram className="h-6 w-6 text-[#3b2a12] sm:h-8 sm:w-8" />}
                    </motion.span>
                    <span className="label mt-1 text-[0.55rem] text-[#6b5130]">{s}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-3 flex items-end justify-between gap-2">
                <p className="font-mono text-[0.6rem] text-[#3b2a12] sm:text-xs">HOURS · 48</p>
                <QrSeal code="BSAH-2026-HYD-042" label="QR seal" className="w-14 text-[#3b2a12] sm:w-20" />
              </div>
            </motion.div>
            {/* Cover, hinged on the left edge; the back of the cover is the identity page */}
            <motion.div className="absolute inset-0 origin-left [transform-style:preserve-3d]" style={{ rotateY: rotate }}>
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 border border-antique/70 bg-[linear-gradient(135deg,#493126,#2a1d15)] shadow-[0_30px_60px_rgb(0_0_0/0.6)] [backface-visibility:hidden]">
                <Monogram className="h-14 w-14 text-gold" />
                <p className="t-inscribe text-center text-[0.7rem] tracking-[0.18em] text-gold/90">
                  Sovereign
                  <br />
                  Passport
                </p>
                <p className="label text-[0.5rem] text-brass/70">BSAH · STPCI</p>
              </div>
              <div className="parchment absolute inset-0 p-4 [backface-visibility:hidden] [transform:rotateY(180deg)] sm:p-6">
                <p className="label text-[#6b5130]">Identity</p>
                <p className="t-voice mt-3 text-lg text-ink sm:text-2xl">Cadet Alpha</p>
                <p className="t-ui mt-1 text-xs text-[#5a4526]">Zone 01A · Financial District Hub</p>
                <p className="font-mono mt-6 text-[0.55rem] text-[#3b2a12] sm:text-xs">BSAH-2026-HYD-042</p>
                <p className="t-ui mt-1 text-[0.6rem] text-[#5a4526]">Sample record</p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** §3 · S45 day clock. Signature: a sun marker travels down the day as you scroll. */
export function DayClock() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.6", "end 0.6"] });
  const top = useTransform(scrollYProgress, r(0, 1), ["0%", "100%"]);
  return (
    <section aria-labelledby="day-h" className="gutter relative py-[clamp(6rem,14vh,12rem)]">
      <div className="grid gap-12 lg:grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)]">
        <div className="lg:sticky motion-reduce:lg:static lg:top-28 lg:self-start">
          <Label>A day</Label>
          <Headline id="day-h" className="mt-4" inscription="A cadet's" voice="day." />
        </div>
        <div ref={ref} className="relative pl-10">
          <span aria-hidden className="absolute bottom-0 left-3 top-0 w-px bg-line/25" />
          <motion.span aria-hidden className="absolute left-3 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold" style={{ top }} />
          <ol className="flex flex-col gap-10">
            {day.map((d) => (
              <Reveal as="li" key={d.time} className="grid gap-2 sm:grid-cols-[6rem_1fr] sm:gap-6">
                <span className="font-mono text-xl text-gold">{d.time}</span>
                <span>
                  <span className="t-voice block text-2xl text-bone">{d.title}</span>
                  <span className="mt-1 block text-sand">{d.text}</span>
                </span>
              </Reveal>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

/** §4 · S46 creed card. Signature: each line of the creed is set as if by letterpress. */
export function CreedCard() {
  return (
    <section aria-labelledby="creed-h" className="gutter relative py-[clamp(6rem,14vh,12rem)]">
      <div className="parchment mx-auto max-w-3xl px-8 py-12 md:px-16 md:py-16">
        <p className="label text-center text-[#6b5130]">Dominus Sui, Dominus Equi</p>
        <h2 id="creed-h" className="t-inscribe mt-3 text-center text-3xl text-ink md:text-4xl">
          The Sovereign Cadet Creed
        </h2>
        <ol className="mt-10 flex flex-col gap-6">
          {creed.map((c, i) => (
            <Reveal as="li" key={c} delay={i * 0.08} className="grid grid-cols-[2.5rem_1fr] gap-3">
              <span className="t-inscribe text-xl text-[#6b5130]">{["I", "II", "III", "IV", "V", "VI"][i]}</span>
              <span className="text-lg leading-relaxed text-ink">{c}</span>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}

/** §5 · S02 film strip (second use, native horizontal scroll). Ten-second milestone reels with a posture overlay. */
export function MilestoneReels() {
  const reduced = useReducedMotion();
  return (
    <section aria-labelledby="reels-h" className="relative py-[clamp(6rem,14vh,12rem)]">
      <div className="gutter">
        <Label>Milestone reels</Label>
        <Headline id="reels-h" className="mt-4" inscription="Ten seconds" voice="that prove it." />
      </div>
      <ol className="no-scrollbar mt-12 flex snap-x scroll-pl-[max(16px,4vw)] gap-0 overflow-x-auto bg-ember/60 py-5 pl-[max(16px,4vw)]">
        {reels.map((rl, i) => (
          <li key={rl.title} className="relative w-[80vw] shrink-0 snap-start border-x-8 border-ember/80 sm:w-[46vw] lg:w-[30vw]">
            <div className="relative aspect-[9/12] overflow-hidden">
              <FilmImage name={rl.image} sizes="(min-width: 1024px) 30vw, 80vw" />
              <svg viewBox="0 0 100 133" className="absolute inset-0 h-full w-full" aria-hidden>
                <motion.path
                  d="M50 30 L50 62 M50 40 L40 56 M50 40 L60 54 M50 62 L42 86 M50 62 L58 84"
                  fill="none"
                  stroke="var(--color-gold)"
                  strokeWidth="0.6"
                  initial={{ pathLength: reduced ? 1 : 0 }}
                  whileInView={{ pathLength: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 1.4, delay: i * 0.2 }}
                />
                {[
                  [50, 30],
                  [50, 40],
                  [50, 62],
                  [40, 56],
                  [60, 54],
                  [42, 86],
                  [58, 84],
                ].map(([x, y], k) => (
                  <circle key={k} cx={x} cy={y} r="1.1" fill="var(--color-gold)" />
                ))}
              </svg>
              <span className="font-mono absolute right-3 top-3 text-[0.65rem] text-ivory/90 [text-shadow:0_1px_10px_rgb(23_21_19/0.55)]">0:10</span>
              <div aria-hidden className="absolute inset-0 shade-b" />
              <div className="absolute inset-x-0 bottom-0 p-4">
                <p className="t-voice text-xl text-bone">{rl.title}</p>
                <p className="label mt-1 text-sand">{rl.who}</p>
              </div>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}


/** §2b · S45 the uniform. The cadet uniform specification as a tailor's docket (Master Refinement §7). */
export function UniformSpec() {
  return (
    <section aria-labelledby="uniform-h" className="relative bg-umber/40 py-[clamp(6rem,14vh,12rem)]">
      <div className="gutter grid gap-12 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-center">
        <div className="relative aspect-[3/4] w-full max-w-md overflow-hidden lg:order-2">
          <FilmImage name="cadetZayd" sizes="(min-width: 1024px) 40vw, 90vw" grade="deep" />
          <div aria-hidden className="absolute inset-0 shade-b" />
          <p className="font-mono absolute bottom-4 left-5 text-[0.6rem] tracking-[0.14em] text-dust">BSAH CADET UNIFORM · SPEC 2026</p>
        </div>
        <div className="lg:order-1">
          <Label>The uniform</Label>
          <Headline id="uniform-h" className="mt-4" inscription="Midnight wool," voice="copper and brass." />
          <dl className="mt-10 border-t border-line">
            {uniform.map((u, i) => (
              <div key={u.item} className="grid gap-1 border-b border-line py-5 sm:grid-cols-[10rem_1fr] sm:gap-6">
                <dt className="pt-1">
                  <span className="font-mono mr-3 text-xs text-gold">{String(i + 1).padStart(2, "0")}</span>
                  <span className="label text-dust">{u.item}</span>
                </dt>
                <dd className="text-sand">{u.spec}</dd>
              </div>
            ))}
          </dl>
          <p className="t-ui mt-6 text-xs text-dust">Issued with the onboarding kit; sizing at the assessment ride.</p>
        </div>
      </div>
    </section>
  );
}
