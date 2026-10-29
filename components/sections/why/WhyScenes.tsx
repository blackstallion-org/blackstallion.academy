"use client";

import { ScrollRevealText } from "@/components/motion/ScrollRevealText";

import { motion, useScroll, useTransform, type MotionValue } from "motion/react";
import { useReducedMotion } from "@/lib/motion/reduced";
import { useEffect, useRef, useState } from "react";
import { FilmImage } from "@/components/film/FilmImage";
import { Headline } from "@/components/film/Headline";
import { Hoof, Label, ReelMark } from "@/components/film/Marks";
import { r } from "@/components/film/range";
import { Reveal } from "@/components/film/Reveal";
import { CompareSlider } from "@/components/sections/shared/CompareSlider";
import { entity } from "@/lib/content/site";
import { crucible, why } from "@/lib/content/science";
import { ease } from "@/lib/motion/tokens";
import { cn } from "@/lib/utils";
import { asset } from "@/lib/content/asset";

/** Title card · The Sovereign Truth. Features the monolithic glowing portal video plate with cinematic rising text and the central seam of light. */
export function WhyTitle() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (reducedMotion) {
      video.pause();
    } else {
      video.play().catch(() => {});
    }
  }, [reducedMotion]);

  return (
    <section aria-labelledby="why-h" className="editorial-scene">
<div className="tone-dark editorial-visual tone-dark relative min-h-[100svh] overflow-hidden bg-black text-bone">
      {/* Background Plate: Looping Monolithic Portal Video */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <video
          ref={videoRef}
          className="absolute inset-0 h-full w-full object-cover"
          style={{ objectPosition: "50% 50%" }}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          poster={asset("/video/portal-loop-poster.jpg")}
          aria-label="Monolithic illuminated doorway background film"
        >
          <source src={asset("/video/portal-loop-web.mp4")} type="video/mp4" />
          <source src={asset("/video/portal-loop.mp4")} type="video/mp4" />
          <source
            src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260808_112712_da9d53df-6d27-4b12-bdf6-aa9dc2622bdf.mp4"
            type="video/mp4"
          />
        </video>

        {/* Deep bottom gradient for strong text contrast on screen */}
        <div
          className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/90 via-black/45 to-transparent z-[1]"
        />
      </div>

      {/* Top veil keeps the site navigation legible without white fade */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-44 bg-gradient-to-b from-black/75 via-black/25 to-transparent z-10"
      />

      {/* Section badges: The crisis (left) & The cure (right) */}
      <motion.span
        className="label absolute left-[max(16px,4vw)] top-24 text-frost z-20 [text-shadow:0_2px_10px_rgba(0,0,0,0.9)]"
        initial={reducedMotion ? { opacity: 1 } : { opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: ease.citadel, delay: 0.2 }}
      >
        The crisis
      </motion.span>
      <motion.span
        className="label absolute right-[max(16px,4vw)] top-24 text-gold z-20 [text-shadow:0_2px_10px_rgba(0,0,0,0.9)]"
        initial={reducedMotion ? { opacity: 1 } : { opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: ease.citadel, delay: 0.2 }}
      >
        The cure
      </motion.span>

      {/* Editorial Content: Highly visible rising typography allowing portal video to breathe */}
      <div className="gutter relative flex min-h-[100svh] flex-col items-center justify-end pb-12 sm:pb-16 text-center z-20">
        <motion.div
          initial={reducedMotion ? { opacity: 1 } : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: ease.citadel, delay: 0.1 }}
        >
          
        </motion.div>

        <motion.div
          initial={reducedMotion ? { opacity: 1 } : { opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.95, ease: ease.citadel, delay: 0.25 }}
          className="mt-4 max-w-2xl mx-auto"
        >
          <Headline
            id="why-h"
            as="h1"
            size="2"
            animate="mount"
            delay={0.3}
            inscription={why.title.inscription}
            voice={why.title.voice}
            className="[text-shadow:0_4px_24px_rgba(0,0,0,0.95)]"
            inscriptionClassName="text-bone font-medium tracking-[0.2em]"
            voiceClassName="text-gold"
          />
        </motion.div>

        
      </div>
    </div>
<div className="tone-light editorial-details gutter"><ReelMark n={5} act="citadel" className="justify-center " />
<motion.p
          className="t-story mt-3 text-sm sm:text-base text-bone/90 max-w-lg mx-auto "
          initial={reducedMotion ? { opacity: 1 } : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: ease.citadel, delay: 0.4 }}
        >
          {why.title.sub}
        </motion.p></div>
</section>
  );
}

/** §1 · S31 phone glass. Signature: notifications pour down the glass while the copy holds still. */
export function Glass() {
  const reduced = useReducedMotion();
  const items = [...why.glass.notifications, ...why.glass.notifications];
  return (
    <section aria-labelledby="glass-h" className="gutter relative py-[clamp(6rem,14vh,12rem)]">
      <div className="grid gap-16 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)] lg:items-center">
        <div>
          <Label>The crisis</Label>
          <Headline id="glass-h" className="mt-4" inscription={why.glass.inscription} voice={why.glass.voice} voiceColor="bone" voiceClassName="text-frost" />
          <Reveal>
            <ScrollRevealText className="t-story mt-6 max-w-lg text-sand">{why.glass.body}</ScrollRevealText>
          </Reveal>
        </div>
        <div className="tone-dark relative mx-auto h-[560px] w-[280px] rounded-[44px] border border-frost/30 bg-charcoal p-3 shadow-[0_40px_100px_-20px_rgb(73_49_38/0.55)]">
          <div className="relative h-full w-full overflow-hidden rounded-[34px] bg-gradient-to-b from-umber to-night">
            <div aria-hidden className="absolute left-1/2 top-3 z-10 h-6 w-24 -translate-x-1/2 rounded-full bg-black" />
            <p className="font-mono absolute left-0 right-0 top-12 text-center text-4xl font-light text-frost/80">03:12</p>
            <div className="absolute inset-x-3 bottom-0 top-28 overflow-hidden [mask-image:linear-gradient(transparent,black_15%,black_85%,transparent)]">
              <motion.ul
                className="flex flex-col gap-2"
                animate={reduced ? undefined : { y: ["0%", "-50%"] }}
                transition={{ duration: 16, repeat: Infinity, ease: "linear" }}
                aria-label="Notifications"
              >
                {items.map((n, k) => (
                  <li key={k} className="t-ui rounded-2xl bg-frost/10 px-4 py-3 text-[0.8rem] text-frost/90">
                    <span className="mr-2 inline-block h-2 w-2 rounded-full bg-blood/80 align-middle" aria-hidden />
                    {n}
                  </li>
                ))}
              </motion.ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/** §2 · S05 full-screen slider + metric table. */
export function BigSlider() {
  const [pct, setPct] = useState(50);
  const cured = pct < 50;
  return (
    <section aria-labelledby="slider-h" className="relative py-[clamp(4rem,10vh,8rem)]">
      <div className="gutter">
        <Headline id="slider-h" inscription={why.slider.inscription} voice={why.slider.voice} />
      </div>
      <CompareSlider left="whyCrisis" right="whyCure" leftLabel="Digital crisis" rightLabel="Sovereign cure" onChange={setPct} className="mt-10 h-[78svh] w-full" />
      <div className="gutter mt-10">
        <div className="grid grid-cols-[6rem_1fr_1fr] gap-4 border-b border-line pb-3 md:grid-cols-[10rem_1fr_1fr]">
          <span />
          <span className="label text-frost">Digital crisis</span>
          <span className="label text-gold">Sovereign cure</span>
        </div>
        {why.slider.table.map((row) => (
          <div key={row.k} className="grid grid-cols-[6rem_1fr_1fr] gap-4 border-b border-line py-5 md:grid-cols-[10rem_1fr_1fr]">
            <span className="label pt-1 text-brass">{row.k}</span>
            <span className={cn("transition-colors duration-700 md:text-lg", cured ? "text-frost/40 line-through decoration-1" : "text-frost")}>{row.a}</span>
            <span className={cn("t-voice transition-colors duration-700 md:text-xl", cured ? "text-gold" : "text-bone/70")}>{row.b}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

/** §3 · S32 The Sanctuary of Unpowered Truth · The Human & Horse Bond */
export function Monolith({ lines, coda, label }: { lines: string[]; coda?: string; label?: string }) {
  const textRef = useRef<HTMLParagraphElement>(null);
  const reduced = useReducedMotion();
  // The words light up as the paragraph itself crosses the screen. (The section is far taller than the text, because
  // of the plates below it, so tracking the section left the last lines grey while they were being read.) Every word
  // is fully dark by the time the whole paragraph fits on screen (its foot reaching the bottom edge), and stays dark.
  const { scrollYProgress } = useScroll({ target: textRef, offset: ["start 0.92", "end 1"] });
  const words = lines.join(" ¶ ").split(" ");

  return (
    <section
      aria-label={label ?? "The sanctuary of unpowered truth"}
      className="gutter relative py-[clamp(6rem,16vh,14rem)] overflow-hidden"
    >
      {/* Section Header */}
      <div className="flex flex-col gap-2">
        <Label className="text-gold">
          {label ?? "The sanctuary of unpowered truth"}
        </Label>
        <p className="font-mono text-xs uppercase tracking-[0.24em] text-sand">
          The Human &amp; Horse Bond · Sacred Trust
        </p>
      </div>

      {/* Main Showcase Layout */}
      <div className="mt-12 grid gap-12 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:items-center">
        {/* Left Column: Scroll-illuminated Monolith text + Wide pasture plate */}
        <div>
          <p ref={textRef} className="t-voice text-display-2 leading-[1.08] text-bone">
            {words.map((w, k) =>
              w === "¶" ? (
                <span key={k} className="block h-8" />
              ) : (
                <Word
                  key={k}
                  progress={scrollYProgress}
                  reduced={reduced}
                  // Words light in sequence over the first 80% of the travel, each fading over a short window, so the
                  // last word is complete at 90% and the whole text holds at full ink for the last tenth.
                  range={[(k / words.length) * 0.8, ((k + 1) / words.length) * 0.8 + 0.1]}
                >
                  {w}
                </Word>
              ),
            )}
          </p>

          {coda && (
            <p className="t-story mt-10 text-xl italic text-gold font-normal">
              {coda}
            </p>
          )}

          {/* Wide Landscape Plate: Kneeling in pasture */}
          <div className="mt-14 overflow-hidden border border-brass/25 bg-night shadow-[0_20px_50px_rgba(0,0,0,0.6)]">
            <div className="relative aspect-[16/10] overflow-hidden">
              <FilmImage
                name="bondField"
                grade="none"
                priority
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="opacity-100 transition-transform duration-700 hover:scale-[1.02]"
              />
            </div>
            <div className="border-t border-brass/20 bg-night/95 p-5 flex items-baseline justify-between gap-4">
              <div>
                <span className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-gold">
                  02 · Field Communion
                </span>
                <p className="t-voice mt-1 text-lg text-bone">
                  Kneeling eye-to-eye in open pasture
                </p>
              </div>
              <span className="font-mono text-xs text-dust">
                Untethered
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Vertical Intimate Portrait */}
        <div className="flex flex-col gap-4">
          <div className="relative overflow-hidden border border-brass/30 bg-night shadow-[0_24px_60px_rgba(0,0,0,0.7)] group">
            <div className="relative aspect-[2/3] overflow-hidden">
              <FilmImage
                name="currGroundcare"
                grade="none"
                priority
                position="50% 40%"
                sizes="(min-width: 1024px) 40vw, 100vw"
                className="opacity-100 transition-transform duration-700 group-hover:scale-[1.03]"
              />
            </div>
            <div className="border-t border-brass/25 bg-night/95 p-6">
              <span className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-gold">
                01 · The Unbroken Covenant
              </span>
              <p className="t-voice mt-1.5 text-xl text-bone">
                Reverence, surrender and mutual truth
              </p>
              <p className="t-story mt-2 text-sm text-sand/80 leading-relaxed">
                A 500-kilogram partner that answers only the reality of how you feel. The cadet masters themselves to earn the stallion&apos;s peace.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Word({ children, progress, range, reduced }: { children: string; progress: MotionValue<number>; range: [number, number]; reduced: boolean }) {
  const opacity = useTransform(progress, r(...range), [0.4, 1]);
  return (
    <motion.span className="mr-[0.25em] inline-block text-bone" style={{ opacity: reduced ? 1 : opacity }}>
      {children}
    </motion.span>
  );
}

/** §4 · S33 hoofprint checklist. Signature: hoofprints stamp down the list like a horse walking past. */
export function TrainList() {
  return (
    <section aria-labelledby="train-h" className="gutter relative py-[clamp(6rem,14vh,12rem)]">
      <div className="grid gap-12 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
        <div>
          <Label>The cure</Label>
          <Headline id="train-h" className="mt-4" inscription={why.train.inscription} voice={why.train.voice} />
          <p className="t-story mt-6 max-w-sm italic text-dust">
            {entity.motto}. {entity.mottoEn}.
          </p>
        </div>
        <ol className="flex flex-col">
          {why.train.items.map((it, k) => (
            <Reveal as="li" key={it} delay={k * 0.12} className="flex items-center gap-6 border-b border-line py-6" y={0}>
              <motion.span initial={{ scale: 1.6, opacity: 0 }} whileInView={{ scale: 1, opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.4, delay: 0.2 + k * 0.12 }} style={{ rotate: k % 2 ? 12 : -12 }}>
                <Hoof className="h-6 w-6 text-gold" />
              </motion.span>
              <span className="t-voice text-[clamp(1.3rem,2.6vw,2.2rem)] leading-tight text-bone">{it}</span>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}


/** §2b · S32 the Sovereign Crucible. The core narrative engine: desert endurance, the three modern crises, the answer in the saddle. */
export function SovereignCrucible() {
  return (
    <section aria-labelledby="crucible-h" className="relative bg-umber/40 py-[clamp(6rem,14vh,12rem)]">
      <div className="gutter">
        <Label>{crucible.label}</Label>
        <Headline id="crucible-h" className="mt-4 max-w-5xl" inscription={crucible.inscription} voice={crucible.voice} />
        <div className="mt-10 grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div>
            {crucible.paras.map((t) => (
              <Reveal key={t.slice(0, 24)}>
                <ScrollRevealText className="t-story mt-6 max-w-xl text-sand first:mt-0">{t}</ScrollRevealText>
              </Reveal>
            ))}
            <Reveal>
              <ScrollRevealText className="t-story mt-10 max-w-xl text-bone">{crucible.stallion}</ScrollRevealText>
            </Reveal>
          </div>
          <ol className="self-start border-t border-frost/25">
            {crucible.crises.map((c, i) => (
              <Reveal as="li" key={c.name} delay={i * 0.12} className="grid grid-cols-[3rem_1fr] gap-4 border-b border-frost/25 py-6">
                <span className="font-mono pt-1 text-sm text-frost">0{i + 1}</span>
                <span>
                  <span className="t-voice block text-2xl text-frost">{c.name}</span>
                  <span className="mt-2 block text-sand">{c.text}</span>
                </span>
              </Reveal>
            ))}
          </ol>
        </div>
        <div className="mt-20 max-w-3xl">
          {crucible.closing.map((line, i) => (
            <Reveal key={line} delay={i * 0.15}>
              <p className={cn("t-voice mt-3 text-display-3", i === 2 ? "text-gold" : "text-bone")}>{line}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
