"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PASSPORT_HREF, preloadHeroAssets, stallionEnabledNow, useStallionEnabled } from "@/components/hero/stallion-flags";
import type { FilmEngine } from "@/components/stallion-film/engine";
import { useReducedMotion } from "@/lib/motion/reduced";
import { cn } from "@/lib/utils";

const StallionStage = dynamic(() => import("@/components/hero/StallionStage").then((m) => m.StallionStage), { ssr: false });

const CHAPTERS = [
  { n: "I", title: "Heritage", line: "The desert of Marwar", at: 0.2 },
  { n: "II", title: "Identity", line: "The village", at: 0.5 },
  { n: "III", title: "Excellence", line: "The academy · an illustrative setting", at: 0.8 },
] as const;

/**
 * Text held on the pale scenes (desert sky, village wall, academy sky). The shared `shade-*` gradients stop at 25 %, which leaves caramel
 * type unreadable on a pale wall, so the chapter label and the bottom row sit on their own stronger fade (charcoal in this dark scope),
 * with light type and a soft shadow. The fade is off on the dark stage (chapter 0).
 */
const SHADE_TOP = "bg-[linear-gradient(180deg,rgb(var(--shade-rgb)/0.74)_0%,rgb(var(--shade-rgb)/0.6)_50%,rgb(var(--shade-rgb)/0)_100%)]";
const SHADE_BOTTOM = "bg-[linear-gradient(0deg,rgb(var(--shade-rgb)/0.7)_0%,rgb(var(--shade-rgb)/0.42)_55%,rgb(var(--shade-rgb)/0)_100%)]";
const HELD = "[text-shadow:0_1px_12px_rgb(var(--shade-rgb)/0.7)]";

/**
 * The interactive stallion under the opening film, on for every visitor (`?stallion=off` hides it for a visit);
 * without WebGL it falls back to a rendered still and a plain link.
 *
 * With motion allowed it is also the pinned frame of a three-chapter film (desert → village → campus) that runs on the
 * same canvas and the same horse: scroll chooses the chapter, the horse and the camera follow their own scripts.
 * Reduced motion: only the still hero, as before.
 */
export function StallionHero() {
  const enabled = useStallionEnabled();
  const reduced = useReducedMotion();
  const [failed, setFailed] = useState(false);
  const [chapter, setChapter] = useState(0);
  const wrapRef = useRef<HTMLElement>(null);
  const filmRef = useRef<FilmEngine | null>(null);
  const progressRef = useRef(0);
  const filmOn = enabled && !reduced && !failed;

  useEffect(() => {
    // The hydration pass reads the server snapshot (true), so `?stallion=off` must be ruled out here before the model is fetched.
    if (enabled && stallionEnabledNow()) preloadHeroAssets();
  }, [enabled]);

  const filmConfig = useMemo(
    () => (filmOn ? { mobile: typeof window !== "undefined" && window.matchMedia("(max-width: 820px), (pointer: coarse)").matches, onChapter: (c: number) => setChapter(c) } : undefined),
    [filmOn],
  );

  const onFilm = useCallback((f: FilmEngine | null) => {
    filmRef.current = f;
    if (f) {
      f.setProgress(progressRef.current);
      const preset = new URLSearchParams(window.location.search).get("quality");
      if (preset === "high" || preset === "medium" || preset === "low") f.setPreset(preset);
      if (new URLSearchParams(window.location.search).has("filmdebug") || process.env.NODE_ENV !== "production") {
        (window as unknown as { __stallionFilm?: unknown }).__stallionFilm = f;
      }
    } else {
      setChapter(0);
    }
  }, []);

  // scroll → progress through the pinned section
  useEffect(() => {
    if (!filmOn) return;
    let raf = 0;
    const sync = () => {
      raf = 0;
      const el = wrapRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const p = Math.min(1, Math.max(0, -r.top / Math.max(1, r.height - window.innerHeight)));
      progressRef.current = p;
      const f = filmRef.current;
      if (f) {
        f.setProgress(p);
        if (p > 0.02) f.preload(1);
        if (p > 0.24) f.preload(2);
        if (p > 0.5) f.preload(3);
      }
    };
    const request = () => {
      if (!raf) raf = requestAnimationFrame(sync);
    };
    window.addEventListener("scroll", request, { passive: true });
    window.addEventListener("resize", request);
    request();
    return () => {
      window.removeEventListener("scroll", request);
      window.removeEventListener("resize", request);
      cancelAnimationFrame(raf);
    };
  }, [filmOn]);

  const jumpTo = (p: number) => {
    const el = wrapRef.current;
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top: top + p * (el.offsetHeight - window.innerHeight), behavior: "smooth" });
  };
  const skip = () => {
    const el = wrapRef.current;
    if (!el) return;
    window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY + el.offsetHeight, behavior: "smooth" });
  };

  if (!enabled) return null;

  const frame = (
    <div className="tone-dark relative h-[100svh] min-h-[36rem] overflow-hidden bg-night pt-24 md:pt-28">
      <div className="gutter pointer-events-none relative z-10 flex flex-wrap items-baseline justify-between gap-4">
        {chapter === 0 ? (
          <>
            <p className="label text-brass">The Stallion · Kala Marwari</p>
            <p className="label text-dust">{filmOn ? "Scroll to follow the stallion." : "Move, tilt or drag. Click to open the passport."}</p>
          </>
        ) : (
          <p className={cn("label text-bone", HELD)} aria-live="polite">
            {CHAPTERS[chapter - 1].n} · {CHAPTERS[chapter - 1].title} <span className="ml-3 text-sand">{CHAPTERS[chapter - 1].line}</span>
          </p>
        )}
      </div>
      <div className={cn("absolute inset-x-0 bottom-0", filmOn ? "top-0" : "top-24 md:top-28")}>
        {failed ? (
          <Link href={PASSPORT_HREF} className="relative block h-full w-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-gold">
            <Image src="/models/marwari-hero-poster.webp" alt="A black Marwari stallion with inward-curving ears." fill sizes="100vw" className="object-contain" />
            <span className="label absolute bottom-[8%] right-4 border border-line bg-night/70 px-3 py-2 text-sand sm:right-[6%]">Open the Sovereign Passport →</span>
          </Link>
        ) : (
          <StallionStage
            className="h-full w-full"
            onStatus={(s) => s === "failed" && setFailed(true)}
            filmConfig={filmConfig}
            onFilm={onFilm}
            clickEnabled={chapter === 0}
          />
        )}
      </div>
      {filmOn && (
        <>
          <div aria-hidden className={cn("pointer-events-none absolute inset-x-0 top-0 z-[5] h-64 transition-opacity duration-700", SHADE_TOP, chapter === 0 ? "opacity-0" : "opacity-100")} />
          <div aria-hidden className={cn("pointer-events-none absolute inset-x-0 bottom-0 z-[5] h-36 transition-opacity duration-700", SHADE_BOTTOM, chapter === 0 ? "opacity-0" : "opacity-100")} />
        </>
      )}
      {filmOn && (
        <nav aria-label="Film chapters" className="gutter absolute inset-x-0 bottom-5 z-20 flex flex-wrap items-center justify-between gap-3">
          <ol className="flex flex-wrap items-center gap-2">
            {CHAPTERS.map((c, i) => (
              <li key={c.n}>
                <button
                  type="button"
                  onClick={() => jumpTo(c.at)}
                  aria-current={chapter === i + 1 ? "step" : undefined}
                  className={cn(
                    "label min-h-11 border px-3 py-2 backdrop-blur-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold",
                    chapter === i + 1 ? "border-gold bg-night/80 text-gold" : "border-line bg-night/65 text-sand hover:text-bone",
                  )}
                >
                  {c.n} <span className="hidden sm:inline">· {c.title}</span>
                </button>
              </li>
            ))}
          </ol>
          <button type="button" onClick={skip} className={cn("label min-h-11 px-3 py-2 text-bone underline-offset-4 hover:text-gold hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold", HELD)}>
            Skip the film ↓
          </button>
        </nav>
      )}
    </div>
  );

  if (!filmOn) return <section aria-label="The Marwari stallion">{frame}</section>;
  return (
    <section ref={wrapRef} aria-label="The Marwari stallion" className="relative h-[560svh] md:h-[640svh]">
      <div className="sticky top-0">{frame}</div>
    </section>
  );
}
