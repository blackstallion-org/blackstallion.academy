"use client";

import { Fragment, useEffect, useImperativeHandle, useRef, useState, type CSSProperties, type Ref } from "react";
import { INTRO_COPY, WORLD_SWISS } from "@/lib/content/worlds";
import { STORY, storyAt } from "./core/director";
import { sfx } from "./core/sfx";
import { CHAPTERS } from "./core/timeline";
import { letterbox } from "./core/letterbox";
import type { EngineStatus } from "./core/engine";
import { WorldsScrollSoundButton } from "./WorldsScrollSound";
import styles from "./four-worlds-scroll.module.css";
import intro from "./four-worlds.module.css";

export type ScrollOverlayHandle = { update: (progress: number) => void };

/** How long the bars take to draw back at the start (ms). */
const OPEN_MS = 4200;

/**
 * Everything drawn over the film is two black bars and one button. The bars (a letterbox) open slowly when the film starts,
 * breathe in step with each transition and close over the last scene; the button is the film's music, on and off. The four
 * worlds' names stay in the page as text for screen readers only.
 * The bars are moved directly from the engine's frame callback: a scroll tick never re-renders React.
 */
export function WorldsScrollOverlay({ ref, status }: { ref?: Ref<ScrollOverlayHandle>; status: EngineStatus | null }) {
  const top = useRef<HTMLDivElement>(null);
  const bottom = useRef<HTMLDivElement>(null);
  const progress = useRef(0);
  const opened = useRef(0);
  const portrait = useRef(false);
  const [story, setStory] = useState(-1);
  const lastStory = useRef(-1);

  const draw = () => {
    const h = letterbox(progress.current, opened.current, portrait.current);
    // a bar is 50% of the frame tall; scaleY shrinks it toward its own edge (compositor only, no layout)
    const s = `scaleY(${Math.max(0, Math.min(1, h * 2)).toFixed(4)})`;
    if (top.current) top.current.style.transform = s;
    if (bottom.current) bottom.current.style.transform = s;
  };

  useImperativeHandle(ref, () => ({
    update(p: number) {
      progress.current = p;
      draw();
      // the same headline and sentence per world as the intro, placed by scroll position; each one speaks its text sound as it comes up
      const i = storyAt(p);
      if (i !== lastStory.current) {
        lastStory.current = i;
        setStory(i);
        if (i >= 0) sfx.story(INTRO_COPY[STORY[i].id].headline.split(/\s+/).length);
      }
    },
  }), []);

  const ready = status?.phase === "ready";
  useEffect(() => {
    portrait.current = window.innerWidth < window.innerHeight;
    const onResize = () => { portrait.current = window.innerWidth < window.innerHeight; draw(); };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  useEffect(() => {
    if (!ready) { opened.current = 0; draw(); return; }
    let raf = 0;
    const t0 = performance.now();
    const step = (now: number) => {
      opened.current = Math.min(1, (now - t0) / OPEN_MS);
      draw();
      if (opened.current < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [ready]);

  useEffect(() => () => sfx.stop(), []);

  return (
    <div className={styles.overlay}>
      <div className={intro.overlay} aria-hidden>
        <div className={intro.shade} data-on={story >= 0 || undefined} />
        {STORY.map((s, i) => {
          const c = INTRO_COPY[s.id];
          return (
            <div key={s.id} className={intro.story} data-on={story === i || undefined}>
              <h2 className={intro.headline}>
                {c.headline.split(" ").map((w, k) => (
                  <Fragment key={k}>
                    <span className={intro.mask}><span className={intro.word} style={{ "--i": k } as CSSProperties}>{w}</span></span>{" "}
                  </Fragment>
                ))}
              </h2>
              <p className={intro.sentence}>{c.line}</p>
            </div>
          );
        })}
      </div>

      <div ref={top} className={`${styles.bar} ${styles.barTop}`} style={{ transform: "scaleY(1)" }} aria-hidden />
      <div ref={bottom} className={`${styles.bar} ${styles.barBottom}`} style={{ transform: "scaleY(1)" }} aria-hidden />

      <ol className="sr-only" aria-label="The two worlds">
        {CHAPTERS.map((c) => (
          <li key={c.id}>{c.n} {c.title}. {WORLD_SWISS[c.id].line}</li>
        ))}
      </ol>

      <div className={styles.music}>
        <WorldsScrollSoundButton />
      </div>
    </div>
  );
}
