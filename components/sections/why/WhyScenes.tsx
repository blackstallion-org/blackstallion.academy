"use client";

import { motion, useScroll, useTransform, type MotionValue } from "motion/react";
import { useReducedMotion } from "@/lib/motion/reduced";
import { useEffect, useRef, useState } from "react";
import { Headline } from "@/components/film/Headline";
import { Hoof, Label, ReelMark } from "@/components/film/Marks";
import { r } from "@/components/film/range";
import { Reveal } from "@/components/film/Reveal";
import { CompareSlider } from "@/components/sections/shared/CompareSlider";
import { entity } from "@/lib/content/site";
import { crucible, why } from "@/lib/content/science";
import { ease } from "@/lib/motion/tokens";
import { cn } from "@/lib/utils";

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
    <section aria-labelledby="why-h" className="relative min-h-[100svh] overflow-hidden bg-[#050505]">
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
          preload="auto"
          poster="/video/portal-loop-poster.jpg"
          aria-label="Monolithic illuminated doorway background film"
        >
          <source src="/video/portal-loop.mp4" type="video/mp4" />
          <source
            src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260808_112712_da9d53df-6d27-4b12-bdf6-aa9dc2622bdf.mp4"
            type="video/mp4"
          />
        </video>

        {/* Dual-layer vignette & shading to blend seamlessly into deep night */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `
              linear-gradient(to bottom,
                rgba(5,5,5,0.75) 0%,
                rgba(5,5,5,0.2) 20%,
                rgba(5,5,5,0) 50%,
                rgba(5,5,5,0.4) 75%,
                rgba(5,5,5,0.85) 90%,
                #050505 100%),
              linear-gradient(to right,
                #050505 0%,
                rgba(5,5,5,0.5) 12%,
                transparent 30%,
                transparent 70%,
                rgba(5,5,5,0.5) 88%,
                #050505 100%)
            `,
          }}
        />
      </div>

      {/* Center golden seam of light standing at the portal threshold */}
      <motion.span
        aria-hidden
        className="absolute inset-y-0 left-1/2 w-px bg-gold/90 shadow-[0_0_12px_rgba(212,175,55,0.5)] z-10"
        initial={reducedMotion ? { scaleY: 1 } : { scaleY: 0 }}
        animate={{ scaleY: 1 }}
        transition={{ duration: 1.4, ease: ease.citadel, delay: 0.8 }}
      />

      {/* Top veil keeps the site navigation legible */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-44 bg-gradient-to-b from-night/90 via-night/50 to-transparent z-10"
      />

      {/* Section badges: The crisis (left) & The cure (right) */}
      <motion.span
        className="label absolute left-[max(16px,4vw)] top-24 text-frost z-20"
        initial={reducedMotion ? { opacity: 1 } : { opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: ease.citadel, delay: 0.2 }}
      >
        The crisis
      </motion.span>
      <motion.span
        className="label absolute right-[max(16px,4vw)] top-24 text-gold z-20"
        initial={reducedMotion ? { opacity: 1 } : { opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: ease.citadel, delay: 0.2 }}
      >
        The cure
      </motion.span>

      {/* Editorial Content: Minimized, sleek rising typography allowing portal video to breathe */}
      <div className="gutter relative flex min-h-[100svh] flex-col items-center justify-end pb-6 sm:pb-8 text-center z-20">
        <motion.div
          initial={reducedMotion ? { opacity: 1 } : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: ease.citadel, delay: 0.1 }}
        >
          <ReelMark n={4} act="citadel" className="justify-center scale-90" />
        </motion.div>

        <motion.div
          initial={reducedMotion ? { opacity: 1 } : { opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.95, ease: ease.citadel, delay: 0.25 }}
          className="mt-2 max-w-xl mx-auto"
        >
          <Headline
            id="why-h"
            as="h1"
            size="3"
            animate="mount"
            delay={0.3}
            inscription={why.title.inscription}
            voice={why.title.voice}
            inscriptionClassName="text-bone/90 tracking-[0.2em]"
          />
        </motion.div>

        <motion.p
          className="t-ui mt-2 text-xs text-sand/75 max-w-md mx-auto tracking-wide"
          initial={reducedMotion ? { opacity: 1 } : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: ease.citadel, delay: 0.4 }}
        >
          {why.title.sub}
        </motion.p>
      </div>
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
            <p className="t-story mt-6 max-w-lg text-sand">{why.glass.body}</p>
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

/** §3 · S32 quote monolith. Signature: each word lights as the scroll passes it. */
export function Monolith({ lines, coda, label }: { lines: string[]; coda?: string; label?: string }) {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.8", "end 0.45"] });
  const words = lines.join(" ¶ ").split(" ");
  return (
    <section ref={ref} aria-label={label ?? "The sanctuary of unpowered truth"} className="gutter relative py-[clamp(8rem,20vh,16rem)]">
      {label && <Label className="mb-8">{label}</Label>}
      <p className="t-voice max-w-[22ch] text-display-2 leading-[1.05] sm:max-w-none">
        {words.map((w, k) =>
          w === "¶" ? (
            <span key={k} className="block h-6" />
          ) : (
            <Word key={k} progress={scrollYProgress} range={[k / words.length, (k + 1) / words.length]}>
              {w}
            </Word>
          ),
        )}
      </p>
      {coda && <p className="t-story mt-12 italic text-gold">{coda}</p>}
    </section>
  );
}

function Word({ children, progress, range }: { children: string; progress: MotionValue<number>; range: [number, number] }) {
  const opacity = useTransform(progress, r(...range), [0.14, 1]);
  return (
    <motion.span className="mr-[0.25em] inline-block text-bone" style={{ opacity }}>
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
                <p className="t-story mt-6 max-w-xl text-sand first:mt-0">{t}</p>
              </Reveal>
            ))}
            <Reveal>
              <p className="t-story mt-10 max-w-xl text-bone">{crucible.stallion}</p>
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
