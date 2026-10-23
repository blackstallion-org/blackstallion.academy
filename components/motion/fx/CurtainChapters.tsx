"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { useMotionValueEvent, type MotionValue } from "motion/react";
import { FilmImage } from "@/components/film/FilmImage";
import { PinnedScene } from "@/components/film/PinnedScene";
import type { MediaKey } from "@/lib/content/media";

/**
 * Full-screen chapters that slide over one another like curtains as the reader scrolls
 * (after the GSAP "Animated Sections" demo, without hijacking the wheel). The scene pins; crossing each
 * scroll threshold brings in the next chapter: the outer and inner wrappers counter-slide so the photo
 * appears to be uncovered in place, and the heading's letters rise in a random order.
 * Scrolling back reverses the direction. Reduced motion: stacked chapters, no pin, no travel.
 * Accessibility: the animated stage is visual only (aria-hidden); every chapter is also rendered once as plain text for
 * screen readers, so no chapter depends on the scroll position to be read.
 */
export type Chapter = { image: MediaKey; time: string; title: string; line: string };

type CurtainChaptersProps = {
  id?: string;
  label: string;
  chapters: Chapter[];
  /** Shown after each time, e.g. "Sample" when the times are illustrative. */
  timeNote?: string;
};

function Frame({ c, i, total, timeNote }: { c: Chapter; i: number; total: number; timeNote?: string }) {
  return (
    <>
      <FilmImage name={c.image} grade="deep" sizes="100vw" />
      <div aria-hidden className="shade-b absolute inset-0" />
      <div className="gutter absolute inset-x-0 bottom-0 pb-[12vh]">
        <p className="label text-brass">
          <span className="font-mono text-gold">{c.time}</span>
          {timeNote ? ` · ${timeNote}` : null} · {String(i + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
        </p>
        <h3 className="t-voice mt-4 max-w-[14ch] text-display-2 text-bone" data-curtain-heading>
          {c.title}
        </h3>
        <p className="t-story mt-4 max-w-xl text-lede text-sand">{c.line}</p>
      </div>
    </>
  );
}

function split(el: HTMLElement) {
  if (el.dataset.split) return Array.from(el.querySelectorAll<HTMLElement>("[data-ch]"));
  const text = el.textContent ?? "";
  el.setAttribute("aria-label", text);
  el.textContent = "";
  const words = text.split(" ");
  words.forEach((word, wi) => {
    const w = document.createElement("span");
    w.className = "inline-block overflow-hidden align-bottom";
    w.setAttribute("aria-hidden", "true");
    for (const ch of word) {
      const s = document.createElement("span");
      s.className = "inline-block";
      s.dataset.ch = "";
      s.textContent = ch;
      w.appendChild(s);
    }
    el.appendChild(w);
    if (wi < words.length - 1) el.appendChild(document.createTextNode(" "));
  });
  el.dataset.split = "1";
  return Array.from(el.querySelectorAll<HTMLElement>("[data-ch]"));
}

function Stage({ chapters, progress, timeNote }: { chapters: Chapter[]; progress: MotionValue<number>; timeNote?: string }) {
  const [index, setIndex] = useState(0);
  const sections = useRef<(HTMLDivElement | null)[]>([]);
  const outers = useRef<(HTMLDivElement | null)[]>([]);
  const inners = useRef<(HTMLDivElement | null)[]>([]);
  const images = useRef<(HTMLDivElement | null)[]>([]);
  const current = useRef(-1);
  const tl = useRef<gsap.core.Timeline | null>(null);

  useMotionValueEvent(progress, "change", (p) => {
    const next = Math.min(chapters.length - 1, Math.floor(p * chapters.length * 0.999));
    setIndex(next);
  });

  useEffect(() => {
    const prev = current.current;
    if (prev === index) return;
    current.current = index;
    // The first chapter is shown as rendered (its title would otherwise rise at hydration, long before it is on screen);
    // titles rise from the second chapter on.
    if (prev === -1) return;
    const dir = index > prev ? 1 : -1;
    tl.current?.progress(1);
    const t = gsap.timeline({ defaults: { duration: 1.1, ease: "power2.inOut" } });
    if (prev >= 0) {
      gsap.set(sections.current[prev], { zIndex: 0 });
      t.to(images.current[prev], { yPercent: -15 * dir }, 0).set(sections.current[prev], { autoAlpha: 0 });
    }
    gsap.set(sections.current[index], { autoAlpha: 1, zIndex: 1 });
    if (prev >= 0) {
      t.fromTo([outers.current[index], inners.current[index]], { yPercent: (k: number) => (k ? -100 * dir : 100 * dir) }, { yPercent: 0 }, 0);
      t.fromTo(images.current[index], { yPercent: 15 * dir }, { yPercent: 0 }, 0);
    }
    const heading = sections.current[index]?.querySelector<HTMLElement>("[data-curtain-heading]");
    if (heading) {
      t.fromTo(split(heading), { autoAlpha: 0, yPercent: 120 * dir }, { autoAlpha: 1, yPercent: 0, duration: 0.9, ease: "power2.out", stagger: { each: 0.025, from: "random" } }, 0.2);
    }
    tl.current = t;
  }, [index]);

  useEffect(() => () => void tl.current?.kill(), []);

  return (
    <div aria-hidden className="relative h-full overflow-hidden">
      {chapters.map((c, i) => (
        <div
          key={c.title}
          ref={(el) => {
            sections.current[i] = el;
          }}
          className="absolute inset-0"
          style={{ visibility: i === 0 ? "visible" : "hidden" }}
        >
          <div ref={(el) => { outers.current[i] = el; }} className="h-full w-full overflow-hidden">
            <div ref={(el) => { inners.current[i] = el; }} className="h-full w-full overflow-hidden">
              <div ref={(el) => { images.current[i] = el; }} className="absolute inset-0">
                <Frame c={c} i={i} total={chapters.length} timeNote={timeNote} />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function CurtainChapters({ id, label, chapters, timeNote }: CurtainChaptersProps) {
  const reducedFallback = (
    <div>
      <h2 className="sr-only">{label}</h2>
      {chapters.map((c, i) => (
        <div key={c.title} className="tone-dark relative h-[80svh] min-h-[480px] overflow-hidden bg-night">
          <Frame c={c} i={i} total={chapters.length} timeNote={timeNote} />
        </div>
      ))}
    </div>
  );
  return (
    <PinnedScene id={id} label={label} length={chapters.length + 0.5} className="tone-dark bg-night" reducedFallback={reducedFallback}>
      {(progress) => (
        <>
          <div className="sr-only">
            <h2>{label}</h2>
            <ol>
              {chapters.map((c) => (
                <li key={c.title}>
                  <h3>{c.title}</h3>
                  <p>
                    {c.time}
                    {timeNote ? ` (${timeNote.toLowerCase()})` : ""}: {c.line}
                  </p>
                </li>
              ))}
            </ol>
          </div>
          <Stage chapters={chapters} progress={progress} timeNote={timeNote} />
        </>
      )}
    </PinnedScene>
  );
}
