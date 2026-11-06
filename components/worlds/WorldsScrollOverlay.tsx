"use client";

import { useEffect, useImperativeHandle, useRef, type Ref } from "react";
import { WORLD_SWISS } from "@/lib/content/worlds";
import { CHAPTERS } from "./core/timeline";
import { letterbox } from "./core/letterbox";
import type { EngineStatus } from "./core/engine";
import { WorldsScrollSoundButton } from "./WorldsScrollSound";
import styles from "./four-worlds-scroll.module.css";

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

  return (
    <div className={styles.overlay}>
      <div ref={top} className={`${styles.bar} ${styles.barTop}`} style={{ transform: "scaleY(1)" }} aria-hidden />
      <div ref={bottom} className={`${styles.bar} ${styles.barBottom}`} style={{ transform: "scaleY(1)" }} aria-hidden />

      <ol className="sr-only" aria-label="The four worlds">
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
