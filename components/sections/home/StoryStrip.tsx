"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { Arrow, Label } from "@/components/film/Marks";
import { mediaSrc, type MediaKey } from "@/lib/content/media";

interface StorySlide {
  id: string;
  reelNum: string;
  year: string;
  subtitle: string;
  titleLine1: string;
  titleLine2: string;
  imageKey: MediaKey;
  alt: string;
  align: "left" | "right";
  caption: string;
}

const STORY_SLIDES: StorySlide[] = [
  {
    id: "origin",
    reelNum: "01",
    year: "1193 AD",
    subtitle: "REEL 01 · 1193 AD · THAR BASIN",
    titleLine1: "Eight Hundred",
    titleLine2: "Years",
    imageKey: "legendSand",
    alt: "A Marwari's hooves lifting out of deep desert sand in the Thar Basin",
    align: "left",
    caption: "Driven onto the arid dunes of Marwar, forged by desert endurance.",
  },
  {
    id: "terrain",
    reelNum: "02",
    year: "1350 AD",
    subtitle: "REEL 02 · 1350 AD · THE DESERT SHIELD",
    titleLine1: "Bred By",
    titleLine2: "Terrain",
    imageKey: "bgFort",
    alt: "Sandstone Rajput fortress towering above the Thar at dusk",
    align: "right",
    caption: "Bred by geography, not ideology. Surviving on a cup of desert water.",
  },
  {
    id: "covenant",
    reelNum: "03",
    year: "1576 AD",
    subtitle: "REEL 03 · 1576 AD · THE LIVING VOW",
    titleLine1: "The Art",
    titleLine2: "Of Life",
    imageKey: "legendCavalry",
    alt: "Marwari horsemen silhouettes charging through a plume of golden desert dust",
    align: "left",
    caption: "Victory, death, or carrying the rider home. The unbroken covenant.",
  },
];

// Exact timing constants from user's specification (in seconds)
const HOLD_TIME = 1.8; // Time to hold text at normal readable size
const ZOOM_TIME = 2.4; // Time to zoom forward from scale 1 to 4.2
const FADE_TIME = 0.7; // Final fade out at the end of the zoom
const WAIT_TIME = 2.0; // EXACTLY 2.0 seconds clear screen wait before next slide
const ENTRANCE_TIME = 1.2; // Fade-in duration for incoming slide

export function StoryStrip() {
  const containerRef = useRef<HTMLDivElement>(null);
  const slidesRef = useRef<(HTMLDivElement | null)[]>([]);
  const progressLineRef = useRef<HTMLDivElement>(null);
  const counterRef = useRef<HTMLSpanElement>(null);

  const [activeIndex, setActiveIndex] = useState(0);

  const activeTlRef = useRef<gsap.core.Timeline | null>(null);
  const isAnimatingRef = useRef(false);
  const touchStartXRef = useRef<number | null>(null);
  const playSlideSequenceRef = useRef<(index: number) => void>(() => {});

  // Play cinematic sequence from a given slide index
  const playSlideSequence = useCallback((index: number) => {
    const slides = slidesRef.current;
    const progressLine = progressLineRef.current;
    const counterEl = counterRef.current;
    const totalSlides = STORY_SLIDES.length;

    const currentSlide = slides[index];
    const nextIndex = (index + 1) % totalSlides;
    const nextSlide = slides[nextIndex];

    if (!currentSlide || !nextSlide) return;

    isAnimatingRef.current = true;
    setActiveIndex(index);

    const currentTitle = currentSlide.querySelector<HTMLElement>(".slide-title");
    const currentSub = currentSlide.querySelector<HTMLElement>(".slide-subtitle");
    const currentBg = currentSlide.querySelector<HTMLElement>(".slide-bg");

    const nextTitle = nextSlide.querySelector<HTMLElement>(".slide-title");
    const nextSub = nextSlide.querySelector<HTMLElement>(".slide-subtitle");
    const nextBg = nextSlide.querySelector<HTMLElement>(".slide-bg");

    if (!currentTitle || !currentSub || !currentBg || !nextTitle || !nextSub || !nextBg) return;

    if (counterEl) {
      counterEl.textContent = `0${index + 1} / 0${totalSlides}`;
    }

    // Kill any existing timeline
    if (activeTlRef.current) {
      activeTlRef.current.kill();
    }

    const tl = gsap.timeline({
      onComplete: () => {
        // Reset previous slide transforms cleanly
        currentSlide.classList.remove("is-active");
        gsap.set(currentSlide, { visibility: "hidden", opacity: 0 });
        gsap.set(currentTitle, { scale: 1, opacity: 0 });
        gsap.set(currentSub, { scale: 1, opacity: 0 });
        gsap.set(currentBg, { scale: 1.05, opacity: 0 });

        // Promote next slide to active
        nextSlide.classList.add("is-active");
        setActiveIndex(nextIndex);
        isAnimatingRef.current = false;

        // Loop seamlessly to next slide
        playSlideSequenceRef.current(nextIndex);
      },
    });

    activeTlRef.current = tl;

    // -------------------------------------------------------------
    // 1. READABLE PHASE & PROGRESS BAR
    // Text displays at normal scale (1.0). Subtle background drift.
    // -------------------------------------------------------------
    const activeDuration = HOLD_TIME + ZOOM_TIME; // 4.2s
    if (progressLine) {
      tl.fromTo(
        progressLine,
        { width: "0%" },
        { width: "100%", duration: activeDuration, ease: "linear" },
        0
      );
    }

    // Subtle drift during readable hold
    tl.to(currentBg, { scale: 1.08, duration: HOLD_TIME, ease: "sine.out" }, 0);

    // -------------------------------------------------------------
    // 2. FORWARD-ZOOM EFFECT: BOTH TEXT & IMAGE SCALE FORWARD TOGETHER
    // Begins after HOLD_TIME (1.8s). Scales forward toward the viewer.
    // Text scales from 1.0 to 4.2.
    // Background image scales from 1.08 to 1.48.
    // -------------------------------------------------------------
    tl.to(currentTitle, { scale: 4.2, duration: ZOOM_TIME, ease: "power2.in" }, HOLD_TIME);
    tl.to(currentSub, { scale: 2.2, duration: ZOOM_TIME, ease: "power2.in" }, HOLD_TIME);
    tl.to(currentBg, { scale: 1.48, duration: ZOOM_TIME, ease: "power2.in" }, HOLD_TIME);

    // -------------------------------------------------------------
    // 3. FADE OUT NEAR THE END OF THE ZOOM
    // Fades out in final 0.7s when moving past the viewer.
    // -------------------------------------------------------------
    const fadeStartTime = HOLD_TIME + ZOOM_TIME - FADE_TIME; // 3.5s
    tl.to([currentTitle, currentSub], { opacity: 0, duration: FADE_TIME, ease: "power2.in" }, fadeStartTime);
    tl.to(currentBg, { opacity: 0, duration: FADE_TIME, ease: "power2.inOut" }, fadeStartTime);

    // Outgoing slide is completely invisible at 4.2s
    const clearStartTime = activeDuration; // 4.2s
    tl.set(currentSlide, { visibility: "hidden", opacity: 0 }, clearStartTime);
    if (progressLine) {
      tl.set(progressLine, { width: "0%" }, clearStartTime);
    }

    // -------------------------------------------------------------
    // 4. EXACTLY 2-SECOND CLEAR SCREEN WAITING PERIOD
    // Completely clear screen from 4.2s to 6.2s. Zero overlap.
    // -------------------------------------------------------------
    const nextEntranceTime = clearStartTime + WAIT_TIME; // 6.2s

    // -------------------------------------------------------------
    // 5. INTRODUCE NEXT SLIDE AT NORMAL SIZE (Starts at 6.2s)
    // -------------------------------------------------------------
    tl.call(
      () => {
        if (counterEl) {
          counterEl.textContent = `0${nextIndex + 1} / 0${totalSlides}`;
        }
      },
      undefined,
      nextEntranceTime
    );

    // Prep next slide elements at normal size (scale: 1)
    tl.set(nextSlide, { visibility: "visible", opacity: 1 }, nextEntranceTime);
    tl.set(nextBg, { scale: 1.05, opacity: 0 }, nextEntranceTime);
    tl.set(nextTitle, { scale: 1, opacity: 0 }, nextEntranceTime);
    tl.set(nextSub, { scale: 1, opacity: 0 }, nextEntranceTime);

    // Fade in next background
    tl.to(nextBg, { opacity: 1, duration: ENTRANCE_TIME, ease: "power2.out" }, nextEntranceTime);

    // Introduce next text at readable normal size
    tl.to([nextTitle, nextSub], { opacity: 1, duration: ENTRANCE_TIME, ease: "power2.out" }, nextEntranceTime);
  }, []);

  // Jump or swipe directly to a target slide index
  const goToSlide = useCallback(
    (targetIndex: number) => {
      if (activeTlRef.current) {
        activeTlRef.current.kill();
        activeTlRef.current = null;
      }

      const slides = slidesRef.current;
      const progressLine = progressLineRef.current;
      const counterEl = counterRef.current;
      const totalSlides = STORY_SLIDES.length;

      // Clean reset of all slides
      slides.forEach((slide, idx) => {
        if (!slide) return;
        const title = slide.querySelector<HTMLElement>(".slide-title");
        const sub = slide.querySelector<HTMLElement>(".slide-subtitle");
        const bg = slide.querySelector<HTMLElement>(".slide-bg");

        if (idx === targetIndex) {
          slide.classList.add("is-active");
          gsap.set(slide, { visibility: "visible", opacity: 1 });
          if (title) gsap.set(title, { scale: 1, opacity: 1 });
          if (sub) gsap.set(sub, { scale: 1, opacity: 1 });
          if (bg) gsap.set(bg, { scale: 1.05, opacity: 1 });
        } else {
          slide.classList.remove("is-active");
          gsap.set(slide, { visibility: "hidden", opacity: 0 });
          if (title) gsap.set(title, { scale: 1, opacity: 0 });
          if (sub) gsap.set(sub, { scale: 1, opacity: 0 });
          if (bg) gsap.set(bg, { scale: 1.05, opacity: 0 });
        }
      });

      if (progressLine) gsap.set(progressLine, { width: "0%" });
      if (counterEl) counterEl.textContent = `0${targetIndex + 1} / 0${totalSlides}`;

      setActiveIndex(targetIndex);
      isAnimatingRef.current = false;

      // Resume cinematic loop from chosen slide
      playSlideSequence(targetIndex);
    },
    [playSlideSequence]
  );

  const nextSlide = useCallback(() => {
    const nextIdx = (activeIndex + 1) % STORY_SLIDES.length;
    goToSlide(nextIdx);
  }, [activeIndex, goToSlide]);

  const prevSlide = useCallback(() => {
    const prevIdx = (activeIndex - 1 + STORY_SLIDES.length) % STORY_SLIDES.length;
    goToSlide(prevIdx);
  }, [activeIndex, goToSlide]);

  // Touch swipe support for smartphone devices ("sp")
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartXRef.current - touchEndX;

    // Minimum swipe threshold of 45px
    if (Math.abs(diff) > 45) {
      if (diff > 0) {
        nextSlide(); // Swiped left -> next slide
      } else {
        prevSlide(); // Swiped right -> prev slide
      }
    }
    touchStartXRef.current = null;
  };

  // Mount & initialize GSAP timeline
  useEffect(() => {
    playSlideSequenceRef.current = playSlideSequence;
    const slides = slidesRef.current;
    if (!slides.length) return;

    // Set initial layout state
    slides.forEach((slide, idx) => {
      if (!slide) return;
      const title = slide.querySelector<HTMLElement>(".slide-title");
      const sub = slide.querySelector<HTMLElement>(".slide-subtitle");
      const bg = slide.querySelector<HTMLElement>(".slide-bg");

      if (idx === 0) {
        slide.classList.add("is-active");
        gsap.set(slide, { visibility: "visible", opacity: 1 });
        if (title) gsap.set(title, { scale: 1, opacity: 1 });
        if (sub) gsap.set(sub, { scale: 1, opacity: 1 });
        if (bg) gsap.set(bg, { scale: 1.05, opacity: 1 });
      } else {
        slide.classList.remove("is-active");
        gsap.set(slide, { visibility: "hidden", opacity: 0 });
        if (title) gsap.set(title, { scale: 1, opacity: 0 });
        if (sub) gsap.set(sub, { scale: 1, opacity: 0 });
        if (bg) gsap.set(bg, { scale: 1.05, opacity: 0 });
      }
    });

    if (counterRef.current) {
      counterRef.current.textContent = `01 / 0${STORY_SLIDES.length}`;
    }

    // Start playback sequence on slide 0
    playSlideSequence(0);

    return () => {
      if (activeTlRef.current) {
        activeTlRef.current.kill();
        activeTlRef.current = null;
      }
    };
  }, [playSlideSequence]);

  return (
    <section
      aria-label="Eight Hundred Years in One Bloodline · The Marwari Reel"
      className="relative w-full bg-black overflow-hidden select-none isolate text-white"
    >
      {/* Fullscreen Viewport Container */}
      <div
        ref={containerRef}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className="relative w-full h-screen min-h-[640px] max-h-[1100px] overflow-hidden bg-black"
      >
        {/* Top Minimal Editorial Bar */}
        <div className="pointer-events-none absolute top-6 left-6 right-6 sm:top-10 sm:left-10 sm:right-10 z-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Label className="tracking-[0.28em] text-[0.68rem] text-gold/90">The Legend Reel</Label>
            <span className="hidden sm:inline-block h-1 w-1 rounded-full bg-gold/40" />
            <span className="hidden sm:inline-block font-mono text-[0.68rem] tracking-[0.2em] text-sand/60 uppercase">
              800 Years of the Marwari
            </span>
          </div>

          <div className="pointer-events-auto">
            <Link
              href="/history"
              className="group inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/40 px-4 py-1.5 font-mono text-[0.7rem] uppercase tracking-widest text-sand/80 backdrop-blur-md transition-all hover:border-gold hover:text-gold"
            >
              <span>Explore chronicle</span>
              <Arrow className="transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>

        {/* 3 Story Slides */}
        {STORY_SLIDES.map((slide, idx) => {
          const imgSrc = mediaSrc(slide.imageKey) || `/media/${slide.imageKey}.png`;
          const isLeft = slide.align === "left";

          return (
            <div
              key={slide.id}
              ref={(el) => {
                slidesRef.current[idx] = el;
              }}
              className={`slide absolute inset-0 w-full h-full overflow-visible pointer-events-none ${
                idx === 0 ? "is-active" : ""
              } ${isLeft ? "slide--left" : "slide--right"}`}
              style={{
                opacity: idx === 0 ? 1 : 0,
                visibility: idx === 0 ? "visible" : "hidden",
              }}
            >
              {/* Drifting Background Image */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imgSrc}
                alt={slide.alt}
                className="slide-bg absolute inset-0 w-full h-full object-cover brightness-[0.72] will-change-transform"
                style={{ transform: "scale(1.05)" }}
              />

              {/* Cinematic Vignette Overlay */}
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/55 z-[1]"
              />

              {/* Vertically Centered Text Container */}
              <div
                className={`slide-content absolute inset-0 flex flex-col justify-center px-[clamp(2rem,8.5vw,9.5rem)] z-[2] overflow-visible pointer-events-none ${
                  isLeft ? "items-start text-left" : "items-end text-right"
                }`}
              >
                {/* Subtitle with wide letter spacing */}
                <p
                  className="slide-subtitle text-[clamp(0.72rem,1.1vw,0.95rem)] tracking-[0.35em] uppercase text-white/75 mb-3 sm:mb-5 will-change-transform"
                  style={{
                    transformOrigin: isLeft ? "left center" : "right center",
                  }}
                >
                  {slide.subtitle}
                </p>

                {/* Giant Headline that scales dramatically toward the viewer */}
                <h2
                  className="slide-title font-serif text-[clamp(2.9rem,7.5vw,7.6rem)] font-light leading-[1.04] tracking-[-0.02em] uppercase text-[#FAF7F0] will-change-transform inline-block w-fit max-w-none m-0"
                  style={{
                    fontFamily:
                      'var(--font-kalnia), var(--font-newsreader), "Playfair Display", "Didot", "Cinzel", serif',
                    transformOrigin: isLeft ? "left center" : "right center",
                  }}
                >
                  {slide.titleLine1}
                  <br />
                  {slide.titleLine2}
                </h2>

                {/* Sub-caption brief */}
                <p
                  className="hidden md:block font-serif text-sm sm:text-base text-sand/70 max-w-md mt-6 leading-relaxed opacity-80"
                  style={{
                    textAlign: isLeft ? "left" : "right",
                  }}
                >
                  {slide.caption}
                </p>
              </div>
            </div>
          );
        })}

        {/* Floating Navigation & Progress Indicators (Bottom-Right) */}
        <div className="ui-controls absolute bottom-6 right-6 sm:bottom-10 sm:right-10 flex items-center gap-4 sm:gap-6 z-20 text-[0.85rem] tracking-[0.15em] text-white/60">
          {/* Slide Counter */}
          <span ref={counterRef} className="counter font-mono tabular-nums text-xs sm:text-sm text-sand/90">
            01 / 0{STORY_SLIDES.length}
          </span>

          {/* Cinematic Progress Bar */}
          <div className="progress-bar w-[60px] h-[2px] bg-white/20 relative overflow-hidden rounded-full">
            <div ref={progressLineRef} className="progress-line absolute left-0 top-0 h-full w-0 bg-white" />
          </div>

          {/* Interactive Next / Prev Switchers */}
          <div className="flex items-center gap-2 pointer-events-auto">
            <button
              type="button"
              onClick={prevSlide}
              aria-label="Previous slide"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-black/60 text-sand/80 hover:text-white hover:border-gold hover:bg-gold/20 transition-all text-xs"
            >
              ←
            </button>
            <button
              type="button"
              onClick={nextSlide}
              aria-label="Next slide"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-black/60 text-sand/80 hover:text-white hover:border-gold hover:bg-gold/20 transition-all text-xs"
            >
              →
            </button>
          </div>
        </div>

        {/* Bottom-Left Context Indicator */}
        <div className="pointer-events-none absolute bottom-6 left-6 sm:bottom-10 sm:left-10 z-20 flex items-center gap-3">
          <span className="h-1.5 w-1.5 rounded-full bg-gold/80 animate-pulse" />
          <span className="font-mono text-[0.62rem] sm:text-[0.68rem] tracking-[0.22em] uppercase text-sand/60">
            Swipe or use arrows to cycle
          </span>
        </div>
      </div>
    </section>
  );
}
