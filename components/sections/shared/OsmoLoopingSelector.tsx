"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useLenis } from "lenis/react";

export interface LoopingItem {
  id: string;
  num?: string;
  title: string;
  subtitle?: string;
  badge?: string;
  detail?: string;
  meta?: string;
  image?: string;
}

export interface OsmoLoopingSelectorProps {
  id: string;
  label: string;
  headlineInscription?: string;
  headlineVoice?: string;
  caption?: string;
  items: LoopingItem[];
  categories?: { id: string; label: string; items: LoopingItem[] }[];
  onSelect?: (item: LoopingItem, index: number) => void;
  tone?: "dark" | "light";
}

export function OsmoLoopingSelector({
  id,
  label,
  headlineInscription = "The Sovereign",
  headlineVoice = "Selector.",
  caption = "Continuous kinetic drum rotation. Tap any entry or category to snap the precision brass brackets.",
  items: initialItems,
  categories,
  onSelect,
  tone = "dark",
}: OsmoLoopingSelectorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const selectorRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);

  const [activeCategoryIndex, setActiveCategoryIndex] = useState(0);
  const currentItems = categories ? categories[activeCategoryIndex].items : initialItems;

  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const lenis = useLenis();

  useEffect(() => {
    const unsub = lenis?.on("scroll", ScrollTrigger.update);
    return () => unsub?.();
  }, [lenis]);

  // Update dynamic corner bracket width to tightly wrap the active center word
  const updateEdgeWidth = useCallback((targetIndex: number) => {
    const list = listRef.current;
    const selector = selectorRef.current;
    if (!list || !selector) return;

    const words = Array.from(list.children) as HTMLElement[];
    if (!words.length) return;

    const centerWord = words[targetIndex % words.length];
    if (!centerWord) return;

    const p = centerWord.querySelector("p") || centerWord;
    const centerWordWidth = p.getBoundingClientRect().width;
    const listWidth = list.getBoundingClientRect().width || 1;
    const paddingBuffer = 48; // padding comfort in px
    const targetPx = Math.min(centerWordWidth + paddingBuffer, listWidth);
    const percentageWidth = Math.max((targetPx / listWidth) * 100, 20);

    gsap.to(selector, {
      width: `${percentageWidth}%`,
      duration: 0.55,
      ease: "expo.out",
    });
  }, []);

  // Jump to specific item index
  const jumpToIndex = useCallback(
    (index: number) => {
      const list = listRef.current;
      if (!list || !currentItems.length) return;

      timelineRef.current?.pause();
      setIsPaused(true);

      const total = currentItems.length;
      const normalizedIndex = (index + total) % total;
      setActiveIndex(normalizedIndex);

      const wordHeight = 100 / total;
      updateEdgeWidth(normalizedIndex);

      gsap.to(list, {
        yPercent: -wordHeight * normalizedIndex,
        duration: 0.85,
        ease: "power3.out",
      });

      if (onSelect) {
        onSelect(currentItems[normalizedIndex], normalizedIndex);
      }
    },
    [currentItems, onSelect, updateEdgeWidth]
  );

  // Setup loop animation timeline
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const list = listRef.current;
    const selector = selectorRef.current;
    if (!list || !selector || currentItems.length === 0) return;

    let currentIndex = 0;
    const totalWords = currentItems.length;
    const wordHeight = 100 / totalWords;

    gsap.set(list, { yPercent: 0 });
    updateEdgeWidth(0);

    const moveWords = () => {
      currentIndex = (currentIndex + 1) % totalWords;
      setActiveIndex(currentIndex);

      gsap.to(list, {
        yPercent: -wordHeight * currentIndex,
        duration: 1.15,
        ease: "elastic.out(1, 0.88)",
        onStart: () => updateEdgeWidth(currentIndex),
      });

      if (onSelect) {
        onSelect(currentItems[currentIndex], currentIndex);
      }
    };

    const tl = gsap
      .timeline({ repeat: -1, delay: 1.2 })
      .call(moveWords)
      .to({}, { duration: 2.2 })
      .repeat(-1);

    timelineRef.current = tl;

    return () => {
      tl.kill();
    };
  }, [currentItems, onSelect, updateEdgeWidth]);

  const activeItem = currentItems[activeIndex] || currentItems[0];

  return (
    <section
      id={id}
      ref={containerRef}
      aria-labelledby={`${id}-heading`}
      className={`looping-words-section py-[clamp(5rem,11vh,9rem)] ${
        tone === "light" ? "bg-[#f3ede2] text-[#30251e]" : "bg-[#0e0d0c] text-[#f3ede2]"
      }`}
    >
      <div className="gutter relative mx-auto w-full max-w-5xl text-center">
        {/* Reel Tag & Header */}
        <div className="inline-flex items-center gap-2 rounded-full border border-[#c9a66b]/30 bg-[#171513]/70 px-4 py-1.5 text-xs font-mono uppercase tracking-[0.2em] text-[#c9a66b] mb-6">
          <span className="h-2 w-2 rounded-full bg-[#c9a66b] animate-pulse" aria-hidden="true" />
          {label}
        </div>

        <h2
          id={`${id}-heading`}
          className="font-playfair text-3xl sm:text-5xl md:text-6xl font-normal tracking-tight text-white leading-tight"
        >
          <span className="block text-[#d4c3ad]/90">{headlineInscription}</span>
          <span className="block text-[#c9a66b] italic font-serif">{headlineVoice}</span>
        </h2>

        {caption && (
          <p className="t-story mt-5 text-[#d4c3ad]/80 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
            {caption}
          </p>
        )}

        {/* Category Tabs (if provided) */}
        {categories && categories.length > 1 && (
          <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
            {categories.map((cat, idx) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  setActiveCategoryIndex(idx);
                  setActiveIndex(0);
                  setIsPaused(false);
                }}
                className={`px-4 py-2 text-xs font-mono uppercase tracking-widest rounded-sm border transition-all ${
                  activeCategoryIndex === idx
                    ? "border-[#c9a66b] bg-[#c9a66b] text-[#0e0d0c] font-semibold"
                    : "border-[#c9a66b]/30 bg-black/40 text-[#d4c3ad] hover:border-[#c9a66b]/70"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        )}

        {/* Osmo Looping Words Selector Drum */}
        <div className="mt-12 relative flex flex-col items-center justify-center">
          <div className="looping-words">
            <div className="looping-words__containers">
              <ul ref={listRef} data-looping-words-list="" className="looping-words__list">
                {currentItems.map((item, idx) => (
                  <li
                    key={item.id}
                    className="looping-words__item"
                    onClick={() => jumpToIndex(idx)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        jumpToIndex(idx);
                      }
                    }}
                    aria-label={`Select ${item.title}`}
                  >
                    <p
                      className={`looping-words__p transition-opacity duration-300 ${
                        activeIndex === idx ? "opacity-100 text-[#f3ede2]" : "opacity-35 text-[#d4c3ad]"
                      }`}
                    >
                      {item.title}
                    </p>
                  </li>
                ))}
              </ul>
            </div>

            {/* Gradient Mask Fade */}
            <div className="looping-words__fade" />

            {/* Dynamic Corner Bracket Selector */}
            <div ref={selectorRef} data-looping-words-selector="" className="looping-words__selector">
              <div className="looping-words__edge" />
              <div className="looping-words__edge is--2" />
              <div className="looping-words__edge is--3" />
              <div className="looping-words__edge is--4" />
            </div>
          </div>

          {/* Active Word Telemetry & Detail Plate */}
          {activeItem && (
            <div className="mt-8 max-w-xl mx-auto rounded border border-[#c9a66b]/25 bg-[#171513]/85 p-6 backdrop-blur-sm text-center transition-all duration-300 shadow-xl shadow-black/50">
              <div className="flex items-center justify-center gap-3 text-xs font-mono uppercase tracking-widest text-[#c9a66b]">
                {activeItem.num && <span>{activeItem.num}</span>}
                {activeItem.badge && (
                  <span className="px-2 py-0.5 rounded border border-[#c9a66b]/30 bg-black/40">
                    {activeItem.badge}
                  </span>
                )}
                {activeItem.meta && <span className="text-[#d4c3ad]/70">{activeItem.meta}</span>}
              </div>

              <h3 className="font-playfair text-2xl text-white mt-2 font-normal">
                {activeItem.title}
              </h3>

              {activeItem.subtitle && (
                <p className="italic text-[#d4c3ad] text-sm mt-1 font-serif">
                  {activeItem.subtitle}
                </p>
              )}

              {activeItem.detail && (
                <p className="text-xs text-[#d4c3ad]/90 mt-3 leading-relaxed border-t border-[#c9a66b]/15 pt-3">
                  {activeItem.detail}
                </p>
              )}
            </div>
          )}

          {/* Interactive Play / Pause & Quick Jump Controls */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => {
                if (isPaused) {
                  timelineRef.current?.resume();
                  setIsPaused(false);
                } else {
                  timelineRef.current?.pause();
                  setIsPaused(true);
                }
              }}
              className="px-4 py-1.5 text-xs font-mono uppercase tracking-widest rounded border border-[#c9a66b]/40 text-[#c9a66b] hover:border-[#c9a66b] hover:bg-[#c9a66b]/10 transition-colors"
            >
              {isPaused ? "Resume Rotation ▶" : "Pause Drum ⏸"}
            </button>

            <div className="flex items-center gap-1.5">
              {currentItems.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => jumpToIndex(idx)}
                  className={`h-2 rounded-full transition-all ${
                    activeIndex === idx ? "w-6 bg-[#c9a66b]" : "w-2 bg-[#c9a66b]/30 hover:bg-[#c9a66b]/60"
                  }`}
                  aria-label={`Jump to item ${idx + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
