"use client";

import { motion } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Crest } from "@/components/brand/Crest";
import { GSAPScrollReveal } from "@/components/cinematic/GSAPScrollReveal";
import { Cta } from "@/components/film/Marks";
import { hero } from "@/lib/content/home";
import { homeFilm } from "@/lib/content/media";
import { useReducedMotion } from "@/lib/motion/reduced";
import { ease } from "@/lib/motion/tokens";
import { cn } from "@/lib/utils";

/**
 * §1 Hero · Cinematic Film Opening Sequence (100vw x 100svh)
 *
 * Designed like the first 10 seconds of a premium historical film about India's Marwari horse:
 * - Edge-to-edge 100vw x 100svh cinematic video
 * - Floating academy crest and wordmark
 * - Controlled atmospheric vignette and subtle film grain
 * - Masked typography reveal sequence via GSAP:
 *     Beat 1: "WE DO NOT TEACH CHILDREN TO RIDE."
 *     Beat 2: "WE FORGE THEM TO LEAD."
 * - BSAH motto: "DOMINUS SUI, DOMINUS EQUI"
 * - Restrained luxury CTAs: "Enter the Academy" & "Watch our story"
 * - Audio controls & pause/play controls
 * - Split doctrine cards, 3-column stats, and live command ticker
 */
export function Hero() {
  return (
    <>
      <HeroFilm />
      <HeroDoctrineSection />
    </>
  );
}

function HeroFilm() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const title1Ref = useRef<HTMLDivElement>(null);
  const title2Ref = useRef<HTMLDivElement>(null);
  const metaRef = useRef<HTMLDivElement>(null);

  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const [hasStarted, setHasStarted] = useState(false);
  const reduced = useReducedMotion();

  // GSAP Film Title Sequence
  useEffect(() => {
    if (reduced) {
      setHasStarted(true);
      return;
    }

    let isMounted = true;
    let tl: any;

    async function initGSAP() {
      const { gsap } = await import("gsap");
      const { SplitText } = await import("gsap/SplitText");
      gsap.registerPlugin(SplitText);

      if (!isMounted) return;

      const title1 = title1Ref.current;
      const title2 = title2Ref.current;
      const meta = metaRef.current;

      if (!title1 || !title2 || !meta) return;

      const split1 = SplitText.create(title1, { type: "words,chars" });
      const split2 = SplitText.create(title2, { type: "words,chars" });

      gsap.set(split1.chars, { yPercent: 120, opacity: 0 });
      gsap.set(split2.chars, { yPercent: 120, opacity: 0 });
      gsap.set(meta, { y: 24, opacity: 0 });

      tl = gsap.timeline({
        delay: 0.5,
        onStart: () => setHasStarted(true),
      });

      // Beat 1: "WE DO NOT TEACH CHILDREN TO RIDE."
      tl.to(split1.chars, {
        yPercent: 0,
        opacity: 1,
        duration: 1.0,
        stagger: 0.02,
        ease: "power3.out",
      })
      // Beat 2: "WE FORGE THEM TO LEAD."
      .to(
        split2.chars,
        {
          yPercent: 0,
          opacity: 1,
          duration: 1.1,
          stagger: 0.025,
          ease: "power4.out",
        },
        "-=0.4"
      )
      // Beat 3: Metadata, motto, and CTAs reveal
      .to(
        meta,
        {
          y: 0,
          opacity: 1,
          duration: 0.9,
          ease: "power2.out",
        },
        "-=0.5"
      );
    }

    initGSAP();

    return () => {
      isMounted = false;
      tl?.kill();
    };
  }, [reduced]);

  // Video playback
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
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  return (
    <section
      id="top"
      aria-label="Opening Film"
      className="relative h-[100svh] w-full overflow-hidden bg-night text-bone"
    >
      {/* ── 1. Edge-to-Edge Cinematic Video Frame ── */}
      <div className="absolute inset-0 h-full w-full overflow-hidden">
        <video
          ref={videoRef}
          className="absolute inset-0 h-full w-full object-cover object-[50%_45%] scale-[1.03] transition-transform duration-[10000ms] ease-out hover:scale-100"
          muted
          loop
          playsInline
          autoPlay
          preload="auto"
          poster={homeFilm.poster}
          aria-label="The Marwari stallion cinematic opening film"
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onVolumeChange={(e) => setIsMuted(e.currentTarget.muted)}
        >
          {homeFilm.sources.map((s) => (
            <source
              key={s.src}
              src={s.src}
              media={"media" in s ? s.media : undefined}
              type="video/mp4"
            />
          ))}
        </video>

        {/* Cinematic Atmospheric Vignettes */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-[#08090B]/85 via-[#08090B]/40 to-transparent"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[65%] bg-gradient-to-t from-[#08090B] via-[#08090B]/60 to-transparent"
        />
      </div>

      {/* ── 2. Top Film Header: Academy Crest & Motto ── */}
      <div className="absolute inset-x-0 top-6 z-20 flex items-center justify-between px-6 lg:px-14">
        <div className="flex items-center gap-3">
          <Image
            src="/brand/crest.svg"
            alt="BSAH Crest"
            width={32}
            height={32}
            className="h-8 w-8 text-gold drop-shadow-[0_2px_12px_rgba(197,160,89,0.3)]"
          />
          <div className="flex flex-col">
            <span className="font-mono text-[0.68rem] tracking-[0.24em] uppercase text-bone">
              Black Stallion Academy
            </span>
            <span className="text-[0.6rem] tracking-[0.28em] uppercase text-gold/80 font-serif italic">
              Dominus Sui, Dominus Equi
            </span>
          </div>
        </div>

        {/* Reel marker */}
        <div className="hidden sm:flex items-center gap-2 border border-brass/30 bg-night/60 backdrop-blur-md px-3 py-1 rounded-full">
          <span className="h-1.5 w-1.5 rounded-full bg-gold animate-pulse" />
          <span className="font-mono text-[0.6rem] tracking-[0.2em] text-sand uppercase">
            R00 · Film Title Sequence
          </span>
        </div>
      </div>

      {/* ── 3. Monumental Film Title Sequence (Masked Typography) ── */}
      <div className="gutter absolute inset-x-0 bottom-0 z-20 flex flex-col justify-end pb-8 lg:pb-14">
        <div className="max-w-4xl space-y-4">
          {/* Subheading tag */}
          <div className="overflow-hidden">
            <p className="label text-brass tracking-[0.26em] uppercase text-xs">
              Indigenous Marwari Horsemanship · Est. 2026
            </p>
          </div>

          {/* Line 1: Inscription */}
          <div className="overflow-hidden pb-1">
            <div
              ref={title1Ref}
              className="t-inscribe text-[clamp(2rem,5vw,4.5rem)] leading-[1.05] tracking-[0.06em] text-bone/90"
              style={{ fontStretch: "125%", fontWeight: 200 }}
            >
              We do not teach children to ride.
            </div>
          </div>

          {/* Line 2: War Voice (The line that lands) */}
          <div className="overflow-hidden pb-2">
            <div
              ref={title2Ref}
              className="t-voice text-[clamp(2.8rem,7.5vw,7.2rem)] leading-[0.92] text-gold drop-shadow-[0_4px_24px_rgba(197,160,89,0.25)]"
              style={{ fontWeight: 700 }}
            >
              We forge them to lead.
            </div>
          </div>

          {/* Lede + CTAs + Controls */}
          <div ref={metaRef} className="pt-2 space-y-6">
            <p className="max-w-2xl text-sand text-[clamp(1rem,1.2vw,1.25rem)] leading-relaxed font-serif">
              {hero.sub}
            </p>

            <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
              <div className="flex flex-wrap items-center gap-4">
                <Link
                  href="/contact?gate=parents"
                  className="group inline-flex items-center gap-3 rounded-full bg-gold px-7 py-3.5 font-mono text-[0.72rem] tracking-[0.16em] uppercase text-night font-bold transition-all hover:bg-bone hover:shadow-[0_0_24px_rgba(197,160,89,0.4)]"
                >
                  Enter the Academy
                  <svg
                    aria-hidden
                    className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M17 8l4 4m0 0l-4 4m4-4H3"
                    />
                  </svg>
                </Link>

                <Link
                  href="/legend"
                  className="inline-flex items-center gap-3 rounded-full border border-brass/50 bg-night/50 backdrop-blur-md px-6 py-3.5 font-mono text-[0.72rem] tracking-[0.14em] uppercase text-bone transition-all hover:border-gold hover:text-gold"
                >
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brass/20 text-gold">
                    ▶
                  </span>
                  Watch our story
                </Link>
              </div>

              {/* Accessible Controls (Mute / Unmute & Play / Pause) */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={toggleSound}
                  aria-pressed={!isMuted}
                  aria-label={isMuted ? "Unmute film audio" : "Mute film audio"}
                  className="group flex items-center gap-2 rounded-full border border-brass/40 bg-night/70 backdrop-blur-md px-3.5 py-2 font-mono text-[0.68rem] uppercase tracking-[0.12em] text-sand transition-colors hover:border-gold hover:text-gold"
                >
                  {isMuted ? (
                    <>
                      <svg
                        aria-hidden
                        className="h-3.5 w-3.5 text-dust group-hover:text-gold"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"
                        />
                      </svg>
                      <span>Sound off</span>
                    </>
                  ) : (
                    <>
                      <svg
                        aria-hidden
                        className="h-3.5 w-3.5 text-gold"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
                        />
                      </svg>
                      <span className="text-gold font-bold">Sound on</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={togglePlay}
                  aria-label={isPlaying ? "Pause film" : "Play film"}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-brass/40 bg-night/70 backdrop-blur-md text-sand transition-colors hover:border-gold hover:text-gold"
                >
                  {isPlaying ? (
                    <svg
                      aria-hidden
                      className="h-3.5 w-3.5"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        fillRule="evenodd"
                        d="M6.75 5.25a.75.75 0 01.75.75v12a.75.75 0 01-1.5 0v-12a.75.75 0 01.75-.75zm10.5 0a.75.75 0 01.75.75v12a.75.75 0 01-1.5 0v-12a.75.75 0 01.75-.75z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : (
                    <svg
                      aria-hidden
                      className="h-3.5 w-3.5 translate-x-0.5"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        fillRule="evenodd"
                        d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.99A1.875 1.875 0 014.5 18.338V5.653z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * §1.5 Doctrine Section — Matching Reference Image Screen 1
 * Displays the split cards, institutional authority badge, metrics, and command ticker.
 */
function HeroDoctrineSection() {
  return (
    <section
      id="doctrine"
      aria-label="Academy Doctrine"
      className="relative bg-[#08090B] py-20 lg:py-28 border-b border-brass/20"
    >
      <div className="gutter space-y-16">
        {/* Institutional Governance Badge */}
        <GSAPScrollReveal variant="fade-up" className="inline-block">
          <div className="flex items-center gap-3 border border-brass/25 bg-umber/40 backdrop-blur-md px-4 py-2 rounded-full">
            <Image
              src="/images/stpci-crest.jpg"
              alt="STPCI Crest"
              width={24}
              height={24}
              className="h-6 w-6 rounded-full object-cover"
            />
            <span className="font-mono text-[0.68rem] tracking-[0.16em] uppercase text-sand">
              {hero.badge}
            </span>
          </div>
        </GSAPScrollReveal>

        {/* Split Cards: "WE DO NOT TEACH children to ride." | "WE FORGE THEM to lead." */}
        <div className="grid gap-6 md:grid-cols-2">
          <GSAPScrollReveal
            variant="fade-up"
            className="group relative overflow-hidden rounded-2xl border border-brass/25 bg-gradient-to-br from-umber/80 to-night p-8 lg:p-12 transition-all hover:border-gold/60"
          >
            <div className="flex flex-col justify-between h-full space-y-6">
              <span className="label text-dust">Core Inscription 01</span>
              <div>
                <span className="t-inscribe block text-display-3 text-sand/70 uppercase">
                  We do not teach
                </span>
                <span className="t-voice block text-display-2 text-bone">
                  children to ride.
                </span>
              </div>
              <p className="text-sand/80 text-sm font-serif leading-relaxed">
                Riding is the baseline. The saddle is our forge for developing mental fortitude, emotional mastery, and unbreakable poise under pressure.
              </p>
            </div>
          </GSAPScrollReveal>

          <GSAPScrollReveal
            variant="fade-up"
            delay={0.15}
            className="group relative overflow-hidden rounded-2xl border border-gold/40 bg-gradient-to-br from-[#1C1815] to-[#08090B] p-8 lg:p-12 transition-all hover:border-gold"
          >
            <div className="flex flex-col justify-between h-full space-y-6">
              <span className="label text-gold">Core Inscription 02</span>
              <div>
                <span className="t-inscribe block text-display-3 text-gold/80 uppercase">
                  We forge them
                </span>
                <span className="t-voice block text-display-2 text-gold">
                  to lead.
                </span>
              </div>
              <p className="text-sand/80 text-sm font-serif leading-relaxed">
                The interscholastic equestrian leadership academy and national circuit. Indigenous Marwari stallions, ex-cavalry instructors, on your campus.
              </p>
            </div>
          </GSAPScrollReveal>
        </div>

        {/* 3-Column Metrics Row (From Reference Image) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 border-y border-brass/20 py-10">
          <GSAPScrollReveal variant="fade-up" delay={0.05} className="flex flex-col gap-2">
            <span className="t-voice text-[clamp(2.8rem,5vw,4.5rem)] text-gold leading-none">
              13
            </span>
            <span className="label text-dust">
              Pillars of character, drilled in the saddle
            </span>
          </GSAPScrollReveal>

          <GSAPScrollReveal variant="fade-up" delay={0.15} className="flex flex-col gap-2">
            <span className="t-voice text-[clamp(2.8rem,5vw,4.5rem)] text-gold leading-none">
              25–30%
            </span>
            <span className="label text-dust">
              Tuition revenue returned to partner school
            </span>
          </GSAPScrollReveal>

          <GSAPScrollReveal variant="fade-up" delay={0.25} className="flex flex-col gap-2">
            <span className="t-voice text-[clamp(2.8rem,5vw,4.5rem)] text-gold leading-none">
              24/7
            </span>
            <span className="label text-dust">
              Live stall-cam telemetry for every parent
            </span>
          </GSAPScrollReveal>
        </div>

        {/* Live Command Ticker (Sample Data) */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-umber/30 border border-brass/15 rounded-xl px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-mono text-[0.7rem] uppercase tracking-[0.16em] text-gold font-bold">
              BSAH National Command
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-6 font-mono text-[0.68rem] tracking-[0.12em] text-sand">
            {hero.ticker.slice(1).map((item, idx) => (
              <span key={idx} className="flex items-center gap-2">
                <span className="text-brass/50">/</span>
                <span>{item}</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
