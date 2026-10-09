"use client";

import { motion, useReducedMotion, useTransform, type MotionValue } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { Crest } from "@/components/brand/Crest";
import { FilmImage } from "@/components/film/FilmImage";
import { Headline } from "@/components/film/Headline";
import { Cta } from "@/components/film/Marks";
import { PinnedScene } from "@/components/film/PinnedScene";
import { r } from "@/components/film/range";
import { GoldDust } from "@/components/motion/GoldDust";
import { hero } from "@/lib/content/home";
import { heroVideo, LOCAL_MEDIA } from "@/lib/content/media";
import { ease } from "@/lib/motion/tokens";

/**
 * §1 Hero · T1 dust emergence + S01 pinned headline scrub.
 * Signature: "WE DO NOT TEACH children to ride." gives way to "WE FORGE THEM to lead."
 * while the photograph pushes in and a wall of dust drifts across.
 */
export function Hero() {
  return (
    <PinnedScene id="top" length={2.4} label="We forge them to lead" reducedFallback={<HeroStatic />}>
      {(p) => <HeroFrame progress={p} />}
    </PinnedScene>
  );
}

function HeroVideo() {
  const ref = useRef<HTMLVideoElement>(null);
  const [ok, setOk] = useState(false);
  useEffect(() => {
    ref.current?.play().catch(() => {});
  }, []);
  return (
    <video
      ref={ref}
      className="absolute inset-0 h-full w-full object-cover transition-opacity duration-[1600ms]"
      style={{ opacity: ok ? 0.9 : 0, objectPosition: "62% 45%" }}
      src={LOCAL_MEDIA ? heroVideo.file : heroVideo.remote}
      muted
      loop
      playsInline
      autoPlay
      preload="metadata"
      aria-hidden
      onCanPlay={() => setOk(true)}
    />
  );
}

function HeroFrame({ progress }: { progress: MotionValue<number> }) {
  const scale = useTransform(progress, r(0, 1), [1.06, 1.22]);
  const dustX = useTransform(progress, r(0, 1), ["-12%", "14%"]);
  const dustOpacity = useTransform(progress, r(0, 0.35, 0.6, 1), [0.25, 0.75, 0.75, 0.35]);
  const aOpacity = useTransform(progress, r(0.18, 0.36), [1, 0]);
  const aY = useTransform(progress, r(0.18, 0.36), ["0%", "-30%"]);
  const bOpacity = useTransform(progress, r(0.4, 0.58), [0, 1]);
  const bY = useTransform(progress, r(0.4, 0.58), ["30%", "0%"]);
  const subOpacity = useTransform(progress, r(0.55, 0.72), [0, 1]);
  const veil = useTransform(progress, r(0.7, 1), [0, 0.5]);

  return (
    <div className="relative h-full w-full">
      <motion.div className="absolute inset-0" style={{ scale }}>
        <FilmImage name="heroDust" priority />
        <HeroVideo />
      </motion.div>
      <FilmImage name="dustWall" blend="screen" x={dustX} opacity={dustOpacity} bleed />
      <div aria-hidden className="absolute inset-0 shade-b" />
      <div aria-hidden className="absolute inset-0 shade-l opacity-70" />
      <motion.div aria-hidden className="absolute inset-0 bg-night" style={{ opacity: veil }} />
      <div aria-hidden className="absolute inset-0 opacity-80">
        <GoldDust density={0.5} />
      </div>

      <div className="gutter relative flex h-full flex-col justify-between pb-6 pt-24 md:pt-28">
        <motion.p
          className="label flex items-center gap-3 text-sand"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: ease.citadel, delay: 0.6 }}
        >
          <Crest simple className="h-9 w-9" title="STPCI crest" />
          <span className="max-w-[16rem] sm:max-w-none">{hero.badge}</span>
        </motion.p>

        <div className="relative">
          <div className="relative min-h-[2.1em] text-poster">
            <motion.div className="absolute inset-x-0 bottom-0" style={{ opacity: aOpacity, y: aY }}>
              <Headline as="h1" size="poster" animate="mount" delay={0.4} voiceColor="bone" {...hero.frames[0]} />
            </motion.div>
            <motion.div className="absolute inset-x-0 bottom-0" style={{ opacity: bOpacity, y: bY }} aria-hidden>
              <Headline as="p" size="poster" animate="none" {...hero.frames[1]} />
            </motion.div>
          </div>

          <motion.div
            className="mt-6 grid gap-6 md:mt-8 md:grid-cols-[minmax(0,1fr)_auto] md:items-end"
            style={{ opacity: subOpacity }}
          >
            <p className="max-w-xl text-lede text-sand">{hero.sub}</p>
            <div className="flex flex-wrap gap-3">
              <Cta href={hero.ctas[0].href} variant="solid">
                {hero.ctas[0].label}
              </Cta>
              <Cta href={hero.ctas[1].href}>{hero.ctas[1].label}</Cta>
            </div>
          </motion.div>
        </div>

        <div>
          <dl className="grid grid-cols-3 border-t border-brass/25">
            {hero.stats.map((s, i) => (
              <div key={s.value} className={i > 0 ? "border-l border-brass/25 pl-3 pt-4 md:pl-6" : "pt-4 pr-3"}>
                <dt className="sr-only">{s.label}</dt>
                <dd className="t-voice text-[clamp(1.35rem,3.2vw,2.6rem)] leading-none text-gold">{s.value}</dd>
                <dd className="label mt-2 text-[0.62rem] text-dust md:text-[0.7rem]">{s.label}</dd>
              </div>
            ))}
          </dl>
          <Ticker />
        </div>
      </div>
    </div>
  );
}

function Ticker() {
  const reduced = useReducedMotion();
  const items = [...hero.ticker, ...hero.ticker];
  return (
    <div className="mt-5 overflow-hidden border-y border-brass/15 py-2" aria-label="Live command figures (sample)">
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

function HeroStatic() {
  return (
    <div className="relative min-h-[100svh]">
      <FilmImage name="heroDust" priority />
      <div aria-hidden className="absolute inset-0 shade-b" />
      <div className="gutter relative flex min-h-[100svh] flex-col justify-end gap-8 pb-16 pt-28">
        <p className="label text-sand">{hero.badge}</p>
        <h1 className="text-poster">
          <span className="t-inscribe block text-[0.5em]">{hero.frames[0].inscription}</span>
          <span className="t-voice block">{hero.frames[0].voice}</span>
          <span className="t-inscribe mt-4 block text-[0.5em]">{hero.frames[1].inscription}</span>
          <span className="t-voice block text-gold">{hero.frames[1].voice}</span>
        </h1>
        <p className="max-w-xl text-lede text-sand">{hero.sub}</p>
        <div className="flex flex-wrap gap-3">
          <Cta href={hero.ctas[0].href} variant="solid">
            {hero.ctas[0].label}
          </Cta>
          <Cta href={hero.ctas[1].href}>{hero.ctas[1].label}</Cta>
        </div>
      </div>
    </div>
  );
}
