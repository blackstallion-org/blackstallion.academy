"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import gsap from "gsap";
import Link from "next/link";
import { asset } from "@/lib/content/asset";

interface WillemExpandingHeroProps {
  id?: string;
  startWord?: string; // e.g. "MAR"
  endWord?: string;   // e.g. "WARI"
  fullWord?: string;  // e.g. "MARWARI"
  tagline?: string;
  subtitle?: string;
  images?: string[];
  replayEnabled?: boolean;
}

export function WillemExpandingHero({
  id = "willem-hero",
  startWord = "MAR",
  endWord = "WARI",
  fullWord = "MARWARI",
  tagline = "THE TRADITIONAL LORE OF THE BARDS",
  subtitle = "Eight hundred years of the sovereign horse that would not leave the field.",
  images = [
    asset("/images/fleet/fleet-chetak.webp"),
    asset("/images/fleet/fleet-veer.webp"),
    asset("/images/legend/legend-bahadur.webp"),
    asset("/images/black-marwari-stallion.webp"),
  ],
  replayEnabled = true,
}: WillemExpandingHeroProps) {
  const containerRef = useRef<HTMLElement>(null);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const runAnimation = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    timelineRef.current?.kill();
    setIsPlaying(true);

    const loadingLetter = container.querySelectorAll(".willem__letter");
    const box = container.querySelectorAll(".willem-loader__box");
    const growingImage = container.querySelectorAll(".willem__growing-image");
    const headingStart = container.querySelectorAll(".willem__h1-start");
    const headingEnd = container.querySelectorAll(".willem__h1-end");
    const coverImageExtra = container.querySelectorAll(".willem__cover-image-extra");
    const headerLetter = container.querySelectorAll(".willem__letter-white");
    const navLinks = container.querySelectorAll(".willem-nav a, .willem-hero__caption");

    // Reset initial styles
    gsap.set([loadingLetter, headerLetter, navLinks], { clearProps: "all" });
    gsap.set(box, { width: "0em" });
    gsap.set(growingImage, { width: "0%", height: "100%" });
    gsap.set(coverImageExtra, { opacity: 1 });
    gsap.set(headingStart, { x: "0em" });
    gsap.set(headingEnd, { x: "0em" });

    const tl = gsap.timeline({
      defaults: {
        ease: "expo.inOut",
      },
      onComplete: () => {
        setIsPlaying(false);
      },
    });

    // 1. Letters slide up
    if (loadingLetter.length) {
      tl.from(loadingLetter, {
        yPercent: 100,
        stagger: 0.03,
        duration: 1.15,
      });
    }

    // 2. Center box & aperture image expand
    if (box.length) {
      tl.fromTo(
        box,
        { width: "0em" },
        { width: "1.1em", duration: 1.2 },
        "< 1.1"
      );
    }

    if (growingImage.length) {
      tl.fromTo(
        growingImage,
        { width: "0%" },
        { width: "100%", duration: 1.2 },
        "<"
      );
    }

    // 3. Flanking letters slide apart
    if (headingStart.length) {
      tl.fromTo(
        headingStart,
        { x: "0em" },
        { x: "-0.06em", duration: 1.2 },
        "<"
      );
    }

    if (headingEnd.length) {
      tl.fromTo(
        headingEnd,
        { x: "0em" },
        { x: "0.06em", duration: 1.2 },
        "<"
      );
    }

    // 4. Staggered image flash inside aperture
    if (coverImageExtra.length) {
      tl.fromTo(
        coverImageExtra,
        { opacity: 1 },
        {
          opacity: 0,
          duration: 0.06,
          ease: "none",
          stagger: 0.45,
        },
        "-=0.08"
      );
    }

    // 5. Full viewport image expansion
    if (growingImage.length) {
      tl.to(
        growingImage,
        {
          width: "100vw",
          height: "100svh",
          duration: 1.9,
        },
        "< 1.1"
      );
    }

    if (box.length) {
      tl.to(
        box,
        {
          width: "115vw",
          duration: 1.9,
        },
        "<"
      );
    }

    // 6. Header typography and nav reveal
    if (headerLetter.length) {
      tl.from(
        headerLetter,
        {
          yPercent: 110,
          duration: 1.2,
          ease: "expo.out",
          stagger: 0.03,
        },
        "< 1.1"
      );
    }

    if (navLinks.length) {
      tl.from(
        navLinks,
        {
          yPercent: 100,
          opacity: 0,
          duration: 1.1,
          ease: "expo.out",
          stagger: 0.08,
        },
        "<"
      );
    }

    timelineRef.current = tl;
    // Reduced motion: no letter travel or zoom; show the finished hero (photograph, title, folio) at once.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      tl.progress(1);
      setIsPlaying(false);
    }
  }, []);

  useEffect(() => {
    void document.fonts.ready.then(() => {
      runAnimation();
    });

    return () => {
      timelineRef.current?.kill();
    };
  }, [runAnimation]);

  return (
    <>
    <section
      id={id}
      ref={containerRef}
      className="willem-header tone-dark relative min-h-[100svh] w-full overflow-hidden bg-[#0e0d0c] text-white"
    >
      {/* Central Split Letter Aperture Loader */}
      <div className="willem-loader pointer-events-none">
        <div className="willem__h1">
          {/* Start letters */}
          <div className="willem__h1-start">
            {startWord.split("").map((char, idx) => (
              <span key={`start-${idx}`} className="willem__letter">
                {char}
              </span>
            ))}
          </div>

          {/* Growing photographic center aperture */}
          <div className="willem-loader__box">
            <div className="willem-loader__box-inner">
              <div className="willem__growing-image">
                <div className="willem__growing-image-wrap">
                  {images[0] && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      className="willem__cover-image-extra is--1"
                      src={images[0]}
                      alt="Historic Marwari charger"
                    />
                  )}
                  {images[1] && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      className="willem__cover-image-extra is--2"
                      src={images[1]}
                      alt="Kathiawari stallion"
                    />
                  )}
                  {images[2] && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      className="willem__cover-image-extra is--3"
                      src={images[2]}
                      alt="Desert sentinel stallion"
                    />
                  )}
                  {images[3] && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      className="willem__cover-image"
                      src={images[3]}
                      alt="Sovereign obsidian Marwari"
                    />
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* End letters */}
          <div className="willem__h1-end">
            {endWord.split("").map((char, idx) => (
              <span key={`end-${idx}`} className="willem__letter">
                {char}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Hero Header Content Overlay */}
      <div className="willem-header__content relative z-20 pt-20 sm:pt-24 pb-8 sm:pb-12">
        {/* Top Navigation Bar */}
        <div className="willem-header__top">
          <nav className="willem-nav" aria-label="Willem folio navigation">
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs uppercase tracking-[0.22em] text-[#c9a66b] border border-[#c9a66b]/30 px-3 py-1 rounded bg-black/60 backdrop-blur-sm">
                BSAH · ARCHIVE FOLIO
              </span>
              <span className="text-xs font-mono text-[#d4c3ad]/80 hidden sm:inline">
                {tagline}
              </span>
            </div>

            <div className="flex items-center gap-3">
              {replayEnabled && (
                <button
                  type="button"
                  onClick={runAnimation}
                  disabled={isPlaying}
                  className="inline-flex items-center gap-2 rounded border border-[#c9a66b]/40 bg-black/70 px-3.5 py-1.5 text-xs font-mono uppercase tracking-widest text-[#c9a66b] hover:border-[#c9a66b] hover:bg-[#c9a66b]/20 transition-all backdrop-blur-sm disabled:opacity-50"
                  aria-label="Replay Aperture sequence"
                >
                  <span>Replay Aperture</span>
                  <span aria-hidden="true">↺</span>
                </button>
              )}
              <Link
                href="/fleet"
                className="hidden md:inline-block rounded border border-[#c9a66b] bg-[#c9a66b] px-4 py-1.5 text-xs font-mono uppercase tracking-widest text-[#0e0d0c] font-semibold hover:bg-white transition-colors"
              >
                The Studbook →
              </Link>
            </div>
          </nav>
        </div>

        {/* Bottom Full Word Title & Description */}
        <div className="willem-header__bottom">
          <div className="willem__h1 drop-shadow-2xl">
            {fullWord.split("").map((char, idx) => (
              <span key={`white-${idx}`} className="willem__letter-white text-white">
                {char}
              </span>
            ))}
            <span className="willem__letter-white is--space text-[#c9a66b] ml-4 font-mono text-[0.45em] align-top">
              ©
            </span>
          </div>


        </div>
      </div>
    </section>
    <div className="tone-light editorial-details gutter">          <div className="max-w-2xl">
            <p className="font-serif italic text-lg sm:text-xl text-sand leading-relaxed">
              {subtitle}
            </p>
            <p className="mt-2 text-xs font-mono uppercase tracking-widest text-brass">
              ORAL CODEX · MARWAR CLANS · RAJASTHAN
            </p>
          </div></div>
    </>
  );
}
