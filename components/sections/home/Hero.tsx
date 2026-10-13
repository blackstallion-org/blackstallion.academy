"use client";

import { motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { Crest } from "@/components/brand/Crest";
import { Headline } from "@/components/film/Headline";
import { Cta } from "@/components/film/Marks";
import { hero } from "@/lib/content/home";
import { ease } from "@/lib/motion/tokens";

/**
 * §1 Hero · Full-frame cinematic opening film + Institutional doctrine below.
 * The video plays full screen without obstruction, followed by the manifesto down below.
 */
export function Hero() {
  return (
    <>
      <HeroVideoSection />
      <HeroContentSection />
    </>
  );
}

function HeroVideoSection() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (reducedMotion) {
      video.pause();
      return;
    }
    video.play().catch(() => {
      // Autoplay with sound might be blocked; browser requires muted
      video.muted = true;
      video.play().catch(() => {});
    });
  }, [reducedMotion]);

  const toggleSound = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(video.muted);
  };

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  };

  const scrollToContent = () => {
    document.getElementById("doctrine")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section
      id="top"
      aria-label="Opening Film"
      className="tone-dark relative h-[100svh] min-h-[100svh] w-full overflow-hidden bg-night flex items-center justify-center"
    >
      <video
        ref={videoRef}
        className="absolute inset-0 h-full w-full object-cover"
        style={{ objectPosition: "50% 50%" }}
        muted
        loop
        playsInline
        autoPlay
        preload="auto"
        poster="/video/hero-main-poster.jpg"
        aria-label="The Marwari Stallion opening film"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onVolumeChange={(e) => setIsMuted(e.currentTarget.muted)}
      >
        <source src="/video/hero-main.mp4" type="video/mp4" />
      </video>

      {/* Top veil keeps the navigation legible over bright frames */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-charcoal/55 to-transparent" />

      {/* Center scroll prompt */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20">
        <button
          type="button"
          onClick={scrollToContent}
          className="group flex flex-col items-center gap-2 text-[#FAF7F0] transition-colors hover:text-gold focus-visible:text-gold drop-shadow-md"
          aria-label="Scroll down to academy doctrine"
        >
          <span className="font-mono text-[0.65rem] uppercase tracking-[0.22em] text-[#FAF7F0] group-hover:text-gold">
            Explore
          </span>
          <span className="block h-5 w-[1px] bg-gold transition-transform group-hover:scale-y-125 animate-pulse" />
        </button>
      </div>

      {/* Bottom right floating controls (Sound & Playback) */}
      <div className="no-print absolute bottom-6 right-6 z-20 flex items-center gap-2">
        <button
          type="button"
          onClick={toggleSound}
          aria-pressed={!isMuted}
          aria-label={isMuted ? "Unmute video sound" : "Mute video sound"}
          className="group flex items-center gap-2 rounded-full border border-brass/50 bg-night/80 px-3.5 py-2 text-[0.68rem] font-mono uppercase tracking-[0.12em] text-sand backdrop-blur-md transition-all hover:border-gold hover:text-gold"
        >
          {isMuted ? (
            <>
              <svg className="h-3.5 w-3.5 text-dust group-hover:text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
              </svg>
              <span>Sound OFF</span>
            </>
          ) : (
            <>
              <svg className="h-3.5 w-3.5 text-gold animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              </svg>
              <span className="text-gold">Sound ON</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={togglePlay}
          aria-label={isPlaying ? "Pause video" : "Play video"}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-brass/50 bg-night/80 text-sand backdrop-blur-md transition-all hover:border-gold hover:text-gold"
        >
          {isPlaying ? (
            <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
              <path fillRule="evenodd" d="M6.75 5.25a.75.75 0 01.75.75v12a.75.75 0 01-1.5 0v-12a.75.75 0 01.75-.75zm10.5 0a.75.75 0 01.75.75v12a.75.75 0 01-1.5 0v-12a.75.75 0 01.75-.75z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg className="h-3.5 w-3.5 translate-x-0.5" fill="currentColor" viewBox="0 0 24 24">
              <path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.99A1.875 1.875 0 014.5 18.338V5.653z" clipRule="evenodd" />
            </svg>
          )}
        </button>
      </div>
    </section>
  );
}

function HeroContentSection() {
  return (
    <section id="doctrine" aria-label="Institutional Doctrine" className="relative bg-night py-16 md:py-24">
      <div className="gutter space-y-12 md:space-y-16">
        {/* Crest & Council badge */}
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

        {/* Dual Headline statements */}
        <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
          <div>
            <Headline as="h1" size="2" animate="inView" voiceColor="bone" {...hero.frames[0]} />
          </div>
          <div className="lg:border-l lg:border-brass/35 lg:pl-12">
            <Headline as="p" size="2" animate="inView" voiceColor="gold" {...hero.frames[1]} />
          </div>
        </div>

        {/* Lede & CTAs */}
        <div className="grid gap-8 border-t border-brass/25 pt-8 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
          <p className="max-w-2xl text-lede text-sand leading-relaxed">{hero.sub}</p>
          <div className="flex flex-wrap gap-4">
            <Cta href={hero.ctas[0].href} variant="solid">
              {hero.ctas[0].label}
            </Cta>
            <Cta href={hero.ctas[1].href}>{hero.ctas[1].label}</Cta>
          </div>
        </div>

        {/* Stats and Ticker */}
        <div className="pt-4">
          <dl className="grid grid-cols-1 border-t border-brass sm:grid-cols-3">
            {hero.stats.map((s, i) => (
              <div
                key={s.value}
                className={i > 0 ? "border-t border-brass pt-6 sm:border-l sm:border-t-0 sm:pl-6 md:pl-8 sm:pt-4" : "pt-6 sm:pt-4 sm:pr-4"}
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
