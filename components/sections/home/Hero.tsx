"use client";

import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { Crest } from "@/components/brand/Crest";
import { ScrollIndicator } from "@/components/cinematic/ScrollIndicator";
import { SplitReveal } from "@/components/cinematic/SplitReveal";
import { Headline } from "@/components/film/Headline";
import { Cta } from "@/components/film/Marks";
import { hero } from "@/lib/content/home";
import { homeFilm } from "@/lib/content/media";
import { useReducedMotion } from "@/lib/motion/reduced";
import { ease } from "@/lib/motion/tokens";

/**
 * §1 Hero · Cinematic opening 1 of 5 (docs/cinematic-redesign): split-screen kinetic reveal.
 * The opening film fills the screen, two leather masks part on a diagonal, then one line lands.
 * The doctrine (second frame, lede, CTAs, figures) follows below.
 */
export function Hero() {
  return (
    <>
      <HeroFilm />
      <HeroContentSection />
    </>
  );
}

function HeroFilm() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const reduced = useReducedMotion();

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (reduced) {
      video.pause();
      return;
    }
    video.play().catch(() => {
      video.muted = true;
      video.play().catch(() => {});
    });
  }, [reduced]);

  // Pause the film while the tab is hidden; resume only if it was playing.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    let resume = false;
    const onVis = () => {
      if (document.hidden) {
        resume = !video.paused;
        video.pause();
      } else if (resume) {
        video.play().catch(() => {});
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  const toggleSound = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(video.muted);
  };

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) video.play().catch(() => {});
    else video.pause();
  };

  return (
    <SplitReveal
      id="top"
      label="Opening film"
      media={
        <video
          ref={videoRef}
          className="absolute inset-0 h-full w-full object-cover object-[42%_45%] md:object-[50%_45%]"
          muted
          loop
          playsInline
          autoPlay
          preload="auto"
          poster={homeFilm.poster}
          aria-label="The Marwari stallion opening film"
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onVolumeChange={(e) => setIsMuted(e.currentTarget.muted)}
        >
          {homeFilm.sources.map((s) => (
            <source key={s.src} src={s.src} media={"media" in s ? s.media : undefined} type="video/mp4" />
          ))}
        </video>
      }
    >
      {(open) => (
        <>
          {/* Holds the headline and the navigation without dimming the horse */}
          <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-night/60 to-transparent" />
          <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-[55%] bg-gradient-to-t from-night/90 via-night/40 to-transparent" />

          <div className="gutter absolute inset-x-0 bottom-0 z-20 flex flex-col gap-8 pb-[max(2.5rem,env(safe-area-inset-bottom))] md:flex-row md:items-end md:justify-between md:pb-12">
            <motion.div
              className="max-w-[min(42rem,100%)]"
              initial={false}
              animate={open ? { opacity: 1, y: 0 } : { opacity: 0, y: 28 }}
              transition={{ duration: 1.1, ease: ease.citadel, delay: open ? 0.75 : 0 }}
            >
              <Headline as="h1" size="1" animate="none" voiceColor="gold" {...hero.frames[0]} />
              <motion.div
                className="mt-7"
                initial={false}
                animate={open ? { opacity: 1 } : { opacity: 0 }}
                transition={{ duration: 0.8, ease: ease.citadel, delay: open ? 1.25 : 0 }}
              >
                <Cta href={hero.ctas[0].href} variant="solid">
                  {hero.ctas[0].label}
                </Cta>
              </motion.div>
            </motion.div>

            <motion.div
              className="no-print flex items-center gap-2 self-end"
              initial={false}
              animate={open ? { opacity: 1 } : { opacity: 0 }}
              transition={{ duration: 0.8, delay: open ? 1.4 : 0 }}
            >
              <button
                type="button"
                onClick={toggleSound}
                aria-pressed={!isMuted}
                aria-label={isMuted ? "Unmute video sound" : "Mute video sound"}
                className="group flex items-center gap-2 rounded-full border border-brass/50 bg-night/70 px-3.5 py-2 font-mono text-[0.68rem] uppercase tracking-[0.12em] text-sand transition-colors hover:border-gold hover:text-gold"
              >
                {isMuted ? (
                  <>
                    <svg aria-hidden className="h-3.5 w-3.5 text-dust group-hover:text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                    </svg>
                    <span>Sound off</span>
                  </>
                ) : (
                  <>
                    <svg aria-hidden className="h-3.5 w-3.5 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                    </svg>
                    <span className="text-gold">Sound on</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={togglePlay}
                aria-label={isPlaying ? "Pause video" : "Play video"}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-brass/50 bg-night/70 text-sand transition-colors hover:border-gold hover:text-gold"
              >
                {isPlaying ? (
                  <svg aria-hidden className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
                    <path fillRule="evenodd" d="M6.75 5.25a.75.75 0 01.75.75v12a.75.75 0 01-1.5 0v-12a.75.75 0 01.75-.75zm10.5 0a.75.75 0 01.75.75v12a.75.75 0 01-1.5 0v-12a.75.75 0 01.75-.75z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg aria-hidden className="h-3.5 w-3.5 translate-x-0.5" fill="currentColor" viewBox="0 0 24 24">
                    <path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.99A1.875 1.875 0 014.5 18.338V5.653z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            </motion.div>
          </div>

          <motion.div
            className="absolute bottom-10 left-1/2 z-20 hidden -translate-x-1/2 lg:block"
            initial={false}
            animate={open ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 0.8, delay: open ? 1.6 : 0 }}
          >
            <ScrollIndicator target="doctrine" label="Explore" />
          </motion.div>
        </>
      )}
    </SplitReveal>
  );
}

function HeroContentSection() {
  return (
    <section id="doctrine" aria-labelledby="doctrine-h" className="relative scroll-mt-16 bg-night py-[clamp(5rem,12vh,9rem)]">
      <div className="gutter space-y-12 md:space-y-16">
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

        {/* The second frame lands here; the first is the film's line above. */}
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-end lg:gap-16">
          <Headline id="doctrine-h" as="h2" size="1" animate="inView" voiceColor="gold" {...hero.frames[1]} />
          <div className="flex flex-col gap-8 lg:border-l lg:border-line lg:pl-12">
            <p className="max-w-2xl text-lede leading-relaxed text-sand">{hero.sub}</p>
            <div className="flex flex-wrap gap-4">
              <Cta href={hero.ctas[1].href} variant="solid">
                {hero.ctas[1].label}
              </Cta>
              <Cta href={hero.ctas[0].href}>{hero.ctas[0].label}</Cta>
            </div>
          </div>
        </div>

        <div className="pt-4">
          <dl className="grid grid-cols-1 border-t border-brass sm:grid-cols-3">
            {hero.stats.map((s, i) => (
              <div
                key={s.value}
                className={i > 0 ? "border-t border-brass pt-6 sm:border-l sm:border-t-0 sm:pl-6 sm:pt-4 md:pl-8" : "pt-6 sm:pr-4 sm:pt-4"}
              >
                <dt className="sr-only">{s.label}</dt>
                <dd className="t-voice text-[clamp(1.85rem,3.4vw,2.8rem)] leading-none text-gold">{s.value}</dd>
                <dd className="label mt-3 text-[0.65rem] text-dust md:text-[0.72rem]">{s.label}</dd>
              </div>
            ))}
          </dl>
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
