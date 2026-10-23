"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import gsap from "gsap";

export interface CrispSlide {
  id: string;
  title: string;
  category: string;
  image: string;
  badge?: string;
  spec?: string;
  detail?: string;
  link?: string;
}

export interface CrispHeaderSlideshowProps {
  id?: string;
  label?: string;
  headlineInscription?: string;
  headlineVoice?: string;
  tagline?: string;
  slides: CrispSlide[];
  replayEnabled?: boolean;
}

export function CrispHeaderSlideshow({
  id = "crisp-slideshow",
  label = "BSAH · ARMOURY & TACK REEL",
  headlineInscription = "The Sovereign",
  headlineVoice = "Equipment.",
  tagline = "HAND-FORGED SADDLERY · ARCHIVAL TACK · DESERT SPECS",
  slides,
  replayEnabled = true,
}: CrispHeaderSlideshowProps) {
  const containerRef = useRef<HTMLElement>(null);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  // Run the signature Osmo Crisp Loading Animation sequence
  const runAnimation = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    timelineRef.current?.kill();
    setIsPlaying(true);

    const loader = container.querySelector<HTMLElement>(".crisp-loader");
    const loaderGroups = container.querySelectorAll<HTMLElement>(".crisp-loader__group");
    const scalingMedia = container.querySelector<HTMLElement>(".crisp-loader__media.is--scaling");
    const scaleDownCards = container.querySelectorAll<HTMLElement>(".is--scale-down");
    const headerTitle = container.querySelectorAll<HTMLElement>(".crisp-header__h1 span");
    const topBar = container.querySelectorAll<HTMLElement>(".crisp-header__top");
    const bottomBar = container.querySelectorAll<HTMLElement>(".crisp-header__bottom");

    if (!loader || !scalingMedia) return;

    // Reset styles
    gsap.set(container, { visibility: "visible", opacity: 1 });
    gsap.set(loader, { opacity: 1, display: "flex", pointerEvents: "auto" });
    gsap.set(loaderGroups, { xPercent: 20 });
    gsap.set(scalingMedia, { scale: 1, borderRadius: "16px", zIndex: 30 });
    gsap.set(scaleDownCards, { scale: 1, opacity: 1 });
    gsap.set([headerTitle, topBar, bottomBar], { clearProps: "all" });

    const tl = gsap.timeline({
      defaults: { ease: "expo.inOut" },
      onComplete: () => {
        setIsPlaying(false);
        gsap.set(loader, { display: "none" });
      },
    });

    // 1. Horizontal marquee roll of thumbnail cards
    tl.to(loaderGroups, {
      xPercent: -35,
      duration: 1.2,
      ease: "power2.inOut",
    });

    // 2. Flanking cards scale down while center card prepares
    tl.to(
      scaleDownCards,
      {
        scale: 0.82,
        opacity: 0.35,
        duration: 0.6,
        ease: "power2.out",
      },
      "-=0.5"
    );

    // 3. Center card scales up to fill the viewport
    tl.to(
      scalingMedia,
      {
        scale: 8.5,
        borderRadius: "0px",
        duration: 1.0,
        ease: "expo.inOut",
      },
      "-=0.25"
    );

    // 4. Fade loader overlay smoothly into underlying active slide
    tl.to(
      loader,
      {
        opacity: 0,
        duration: 0.55,
        ease: "power2.out",
      },
      "-=0.35"
    );

    // 5. Reveal header title typography
    if (headerTitle.length) {
      tl.from(
        headerTitle,
        {
          yPercent: 120,
          opacity: 0,
          duration: 0.9,
          ease: "expo.out",
          stagger: 0.06,
        },
        "-=0.45"
      );
    }

    // 6. Reveal top and bottom interface elements
    if (topBar.length) {
      tl.from(
        topBar,
        {
          yPercent: -100,
          opacity: 0,
          duration: 0.75,
          ease: "expo.out",
        },
        "-=0.75"
      );
    }

    if (bottomBar.length) {
      tl.from(
        bottomBar,
        {
          yPercent: 60,
          opacity: 0,
          duration: 0.75,
          ease: "expo.out",
        },
        "-=0.75"
      );
    }

    timelineRef.current = tl;
    // Reduced motion: no card marquee, zoom or title travel; show the finished header at once.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      tl.progress(1);
      setIsPlaying(false);
    }
  }, []);

  // Initialize on mount
  useEffect(() => {
    void document.fonts.ready.then(() => {
      runAnimation();
    });

    return () => {
      timelineRef.current?.kill();
    };
  }, [runAnimation]);

  // Slideshow auto-advance timer
  useEffect(() => {
    if (!isAutoPlaying || isPlaying) return;
    // No automatic slide changes with reduced motion (WCAG 2.2.2); the slide controls still work.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slides.length);
    }, 5500);

    return () => clearInterval(interval);
  }, [isAutoPlaying, isPlaying, slides.length]);

  const activeSlide = slides[currentIndex] || slides[0];

  return (
    <>
    <section
      id={id}
      ref={containerRef}
      data-slideshow="wrap"
      aria-label="Osmo Crisp Header Slideshow"
      className="crisp-header relative min-h-[100svh] w-full overflow-hidden bg-[#0e0d0c] text-white"
    >
      {/* Background Fullscreen Slider */}
      <div className="crisp-header__slider" aria-hidden="true">
        <div className="crisp-header__slider-list">
          {slides.map((slide, idx) => (
            <div
              key={slide.id}
              data-slideshow="slide"
              className={`crisp-header__slider-slide ${idx === currentIndex ? "is--current" : ""}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                className="crisp-header__slider-slide-inner"
                src={slide.image}
                alt={slide.title}
                data-slideshow="parallax"
                draggable={false}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Dark Ambient Vignette Overlay */}
      <div className="crisp-header__overlay" aria-hidden="true" />

      {/* Osmo Crisp Introductory Preloader Carousel */}
      <div className="crisp-loader">
        <div className="crisp-loader__wrap">
          <div className="crisp-loader__groups">
            {/* Duplicated Marquee Group for Continuous Loop */}
            <div className="crisp-loader__group is--duplicate" aria-hidden="true">
              {slides.map((s, idx) => (
                <div key={`dup-${idx}`} className="crisp-loader__single">
                  <div className="crisp-loader__media">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      loading="eager"
                      src={s.image}
                      alt={s.title}
                      className="crisp-loader__cover-img"
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Active Staggered Group with Center Scaling Card */}
            <div className="crisp-loader__group is--relative">
              {slides.map((s, idx) => {
                const isCenter = idx === 2 || (slides.length < 3 && idx === 0);
                return (
                  <div key={`rel-${idx}`} className="crisp-loader__single">
                    <div
                      className={`crisp-loader__media ${
                        isCenter ? "is--scaling is--radius" : ""
                      }`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        loading="eager"
                        src={s.image}
                        alt={s.title}
                        className={`crisp-loader__cover-img ${
                          !isCenter ? "is--scale-down" : ""
                        }`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Lateral Vignette Fade Masks */}
          <div className="crisp-loader__fade" aria-hidden="true" />
          <div className="crisp-loader__fade is--duplicate" aria-hidden="true" />
        </div>
      </div>

      {/* Foreground Header Content — Guaranteed top clearance below fixed SiteNav */}
      <div
        className="crisp-header__content pb-8 sm:pb-12"
        style={{ paddingTop: "clamp(5.75rem, 12vh, 7.5rem)" }}
      >
        {/* Top Folio Bar */}
        <div className="crisp-header__top flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs uppercase tracking-[0.22em] text-[#c9a66b] border border-[#c9a66b]/30 px-3 py-1 rounded bg-black/60 backdrop-blur-sm">
              {label}
            </span>
            <span className="text-xs font-mono text-[#d4c3ad]/80 hidden md:inline">
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
                aria-label="Replay aperture sequence"
              >
                <span>Replay Aperture</span>
                <span aria-hidden="true">↺</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsAutoPlaying((prev) => !prev)}
              className="hidden sm:inline-flex items-center gap-1.5 rounded border border-[#c9a66b]/30 bg-black/60 px-3 py-1.5 text-xs font-mono uppercase tracking-widest text-[#d4c3ad] hover:text-[#c9a66b] transition-colors"
            >
              <span>{isAutoPlaying ? "Auto ▶" : "Paused ⏸"}</span>
            </button>
          </div>
        </div>

        {/* Center Grand Headline */}
        <div className="crisp-header__center">
          <h1 className="crisp-header__h1 drop-shadow-2xl">
            <span className="block text-[#f3ede2]">{headlineInscription}</span>
            <span className="block text-[#c9a66b] italic font-serif mt-1">
              {headlineVoice}
            </span>
          </h1>

          {activeSlide && (
            <div className="mt-4 inline-flex items-center gap-3 rounded-full border border-[#c9a66b]/30 bg-black/60 px-4 py-1.5 backdrop-blur-sm">
              <span className="h-2 w-2 rounded-full bg-[#c9a66b] animate-pulse" aria-hidden="true" />
              <span className="font-mono text-xs uppercase tracking-widest text-[#c9a66b]">
                {activeSlide.category}
              </span>
              <span className="text-white/40">·</span>
              <span className="font-serif italic text-sm text-[#f3ede2]">
                {activeSlide.title}
              </span>
            </div>
          )}
        </div>

        {/* Bottom Interactive Thumbnail Carousel & Telemetry */}
        <div className="crisp-header__bottom">
          <div className="crisp-header__slider-nav" role="tablist" aria-label="Equipment slides">
            {slides.map((slide, idx) => (
              <button
                key={slide.id}
                type="button"
                role="tab"
                aria-selected={idx === currentIndex}
                aria-label={`View slide ${idx + 1}: ${slide.title}`}
                data-slideshow="thumb"
                onClick={() => {
                  setCurrentIndex(idx);
                  setIsAutoPlaying(false);
                }}
                className={`crisp-header__slider-nav-btn ${
                  idx === currentIndex ? "is--current" : ""
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  loading="eager"
                  src={slide.image}
                  alt={slide.title}
                  className="crisp-loader__cover-img"
                />
              </button>
            ))}
          </div>


        </div>
      </div>
    </section>
    <div className="tone-light editorial-details gutter" aria-live="polite">
      <p className="label text-brass">Specification {String(currentIndex + 1).padStart(2, "0")} / {String(slides.length).padStart(2, "0")}</p>
      <h2 className="t-voice text-3xl">{activeSlide.title}</h2>
      <p>{activeSlide.spec || activeSlide.detail}</p>
    </div>
    </>
  );
}
