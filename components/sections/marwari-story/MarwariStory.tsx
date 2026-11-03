/* Painted layers are absolutely positioned and sized by CSS on the stage, so plain <img> is the right element here (next/image would add srcset sizing the stage does not use). */
/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useLenis } from "lenis/react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useReducedMotion } from "@/lib/motion/reduced";
import { asset } from "@/lib/content/asset";
import { CHAPTERS, PAGE_TOTAL, firstPageNumber, type HorseSpec, type StoryChapter } from "./story-data";
import { DriftCanvas } from "./DriftCanvas";
import type { HorseDrive, HorseHandle } from "./MarwariHorse";
import "./story.css";

gsap.registerPlugin(ScrollTrigger);

const FLAG = "/images/story/marwari/flag.webp";

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Opacity of the horse across its chapter: fades in over the first `fadeIn` and out over the last `fadeOut`. */
function fadeCurve(p: number, fadeIn: number, fadeOut: number): number {
  const a = fadeIn > 0 ? Math.min(1, p / fadeIn) : 1;
  const b = fadeOut > 0 ? Math.min(1, (1 - p) / fadeOut) : 1;
  return Math.max(0, Math.min(a, b));
}

function applyHorse(drive: HorseDrive, spec: HorseSpec, p: number) {
  drive.yaw = lerp(spec.yaw[0], spec.yaw[1], p);
  drive.head = lerp(spec.head[0], spec.head[1], p);
  drive.fade = fadeCurve(p, spec.fadeIn, spec.fadeOut);
}

/**
 * The Marwari cavalry story: four chapters, eighteen pages, each chapter a pinned section whose layers, camera and
 * horse are scrubbed by its scroll progress. Scrolling back runs the same timelines in reverse. The 3D horse is one
 * WebGL context, created when the cavalry chapter nears the screen and carried between the horse slots of the
 * cavalry and legacy chapters. Under reduced motion nothing is pinned and nothing moves: every page is shown in order,
 * over the painted layers, with no horse and no dust. The page switches by setting attributes, so scrolling never
 * re-renders React.
 */
export function MarwariStory() {
  const rootRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const lenis = useLenis();
  const [drive] = useState<HorseDrive>(() => ({ yaw: 0, head: 0, fade: 0 }));

  // Lenis drives the native scroll; ScrollTrigger must hear every frame of it.
  useEffect(() => {
    if (!lenis || reduced) return;
    return lenis.on("scroll", ScrollTrigger.update);
  }, [lenis, reduced]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || reduced) return;

    const state: { horse: HorseHandle | null; slot: HTMLElement | null; cancelled: boolean; loading: boolean } = {
      horse: null,
      slot: null,
      cancelled: false,
      loading: false,
    };

    // three.js is loaded only when the cavalry chapter is about to show, in its own chunk.
    const loadHorse = () => {
      if (state.loading) return;
      state.loading = true;
      import("./MarwariHorse")
        .then(({ createMarwariHorse }) => {
          if (state.cancelled) return;
          const mobile = window.matchMedia("(max-width: 639px)").matches;
          state.horse = createMarwariHorse({ mobile }, drive);
          if (state.horse && state.slot) state.horse.moveTo(state.slot);
        })
        .catch(() => {
          /* the chapters read without the horse */
        });
    };

    const ctx = gsap.context(() => {
      CHAPTERS.forEach((chapter: StoryChapter) => {
        const section = root.querySelector<HTMLElement>(`[data-chapter="${chapter.id}"]`);
        if (!section) return;
        const stage = section.querySelector<HTMLElement>(".ms-stage");
        const scene = section.querySelector<HTMLElement>(".ms-scene");
        const pages = Array.from(section.querySelectorAll<HTMLElement>(".ms-page"));
        const rule = section.querySelector<HTMLElement>(".ms-rule");
        const bg = section.querySelector<HTMLElement>(".ms-bg");
        const mid = section.querySelector<HTMLElement>(".ms-mid");
        const fg = section.querySelector<HTMLElement>(".ms-fg");
        const smoke = section.querySelector<HTMLElement>(".ms-smoke");
        const flag = section.querySelector<HTMLElement>(".ms-flag");
        const light = section.querySelector<HTMLElement>(".ms-light");
        const slot = section.querySelector<HTMLElement>(".ms-horse-slot");
        if (!stage || !scene || pages.length === 0) return;

        // Flat painting to dimensional scene: the background recedes, the foreground comes forward, the middle drifts,
        // the whole scene tilts a few degrees, smoke and light come up. Every value is scrubbed, so it reverses on scroll.
        const tl = gsap.timeline({ paused: true, defaults: { ease: "none" } });
        tl.fromTo(scene, { rotateX: 0 }, { rotateX: 4 }, 0);
        if (bg) tl.fromTo(bg, { z: 0, scale: 1 }, { z: -150, scale: 1.12 }, 0);
        if (mid && chapter.art.mid?.drift) {
          const [from, to] = chapter.art.mid.drift;
          tl.fromTo(mid, { z: 0, xPercent: from }, { z: 40, xPercent: to }, 0);
        }
        if (fg) tl.fromTo(fg, { z: 0, yPercent: 3 }, { z: 170, yPercent: 0 }, 0);
        if (smoke) tl.fromTo(smoke, { opacity: 0, xPercent: -4 }, { opacity: 0.8, xPercent: 6 }, 0);
        if (flag) tl.fromTo(flag, { opacity: 0, y: -18 }, { opacity: 1, y: 0 }, 0);
        if (light) tl.fromTo(light, { opacity: 0.12 }, { opacity: 0.55 }, 0);

        let current = 0;
        ScrollTrigger.create({
          trigger: section,
          start: "top top",
          end: () => `+=${pages.length * window.innerHeight}`,
          pin: stage,
          pinSpacing: true,
          scrub: 0.6,
          invalidateOnRefresh: true,
          animation: tl,
          onUpdate: (self) => {
            const p = self.progress;
            const idx = Math.min(pages.length - 1, Math.floor(p * pages.length));
            if (idx !== current) {
              current = idx;
              pages.forEach((el, i) => el.setAttribute("data-active", i === idx ? "true" : "false"));
            }
            if (rule) rule.style.transform = `scaleX(${p})`;
            if (chapter.horse) applyHorse(drive, chapter.horse, p);
          },
          onToggle: (self) => {
            if (self.isActive && slot) {
              state.slot = slot;
              state.horse?.moveTo(slot);
            }
          },
        });
      });
    }, root);

    const lazy = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          loadHorse();
          lazy.disconnect();
        }
      },
      { rootMargin: "120% 0px" },
    );
    const cavalry = root.querySelector('[data-chapter="cavalry"]');
    if (cavalry) lazy.observe(cavalry);

    const refresh = () => ScrollTrigger.refresh();
    window.addEventListener("load", refresh);
    void document.fonts?.ready.then(refresh);

    return () => {
      state.cancelled = true;
      lazy.disconnect();
      window.removeEventListener("load", refresh);
      state.horse?.dispose();
      state.horse = null;
      ctx.revert();
    };
  }, [reduced, drive]);

  const motion = reduced ? "reduced" : "full";

  return (
    <div ref={rootRef} className="ms-story" data-motion={motion}>
      <h1 className="sr-only">The Marwari cavalry: a scroll story</h1>
      {CHAPTERS.map((chapter, index) => (
        <ChapterView key={chapter.id} chapter={chapter} index={index} reduced={reduced} />
      ))}
    </div>
  );
}

function ChapterView({ chapter, index, reduced }: { chapter: StoryChapter; index: number; reduced: boolean }) {
  const { art, smoke, flag } = chapter;
  return (
    <section className="ms-chapter" data-chapter={chapter.id} aria-labelledby={`ms-${chapter.id}`}>
      <div className="ms-stage">
        <div className="ms-scene">
          <img className="ms-layer ms-bg" src={asset(art.bg)} alt="" decoding="async" />
          {art.mid && (
            <img
              className="ms-layer ms-mid"
              src={asset(art.mid.file)}
              alt=""
              decoding="async"
              style={{ width: art.mid.width, bottom: art.mid.bottom }}
            />
          )}
          {chapter.horse && <div className="ms-horse-slot" />}
          {art.fg && (
            <img
              className="ms-layer ms-fg"
              src={asset(art.fg.file)}
              alt=""
              decoding="async"
              style={{ width: art.fg.width, bottom: art.fg.bottom }}
            />
          )}
          {smoke && (
            <div className="ms-smoke" style={{ left: smoke.left, top: smoke.top, width: smoke.width }}>
              <img className="ms-smoke__img" src={asset(smoke.file)} alt="" decoding="async" />
            </div>
          )}
          {flag && (
            <div className="ms-flag" style={{ left: flag.left, top: flag.top, height: flag.height }}>
              <img className="ms-flag__img" src={asset(FLAG)} alt="" decoding="async" />
            </div>
          )}
          <div className="ms-light" aria-hidden="true" />
          {!reduced && <DriftCanvas />}
        </div>
        <div className="ms-frame" aria-hidden="true" />
        <div className="ms-copy">
          <h2 id={`ms-${chapter.id}`} className="ms-numeral">
            {chapter.numeral} · {chapter.name}
          </h2>
          <div className="ms-pages">
            {chapter.pages.map((page, i) => (
              <article key={i} className="ms-page" data-active={i === 0 ? "true" : "false"}>
                <p className="ms-page__count">
                  {String(firstPageNumber(index) + i).padStart(2, "0")} / {PAGE_TOTAL}
                </p>
                <h3 className="ms-page__title">{page.title}</h3>
                <p className="ms-page__body">{page.body}</p>
                {page.link && (
                  <Link href={page.link.href} className="ms-page__link">
                    {page.link.label}
                  </Link>
                )}
              </article>
            ))}
          </div>
          <div className="ms-rule-track" aria-hidden="true">
            <span className="ms-rule" />
          </div>
        </div>
      </div>
    </section>
  );
}
