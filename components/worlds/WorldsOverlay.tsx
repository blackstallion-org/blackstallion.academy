"use client";

import { Fragment, useImperativeHandle, useRef, useState, type CSSProperties, type Ref } from "react";
import { INTRO_COPY } from "@/lib/content/worlds";
import { FILM_SECONDS, OPEN_SECONDS, STORY, storyAt } from "./core/director";
import { letterbox } from "./core/letterbox";
import type { EngineStatus } from "./core/engine";
import { sfx } from "./core/sfx";
import { WorldsMusic } from "./WorldsSound";
import styles from "./four-worlds.module.css";

export type OverlayHandle = { update: (progress: number, seconds: number) => void };

const smooth = (x: number) => { const t = Math.min(1, Math.max(0, x)); return t * t * t * (t * (t * 6 - 15) + 10); };

/**
 * Everything drawn over the film: the letterbox, one large headline and one sentence per world, the sound button and a quiet Skip.
 * The bars and the ending run on the film's clock and are moved directly from the engine's frame callback, so a frame never
 * re-renders React; state changes only when the story on screen changes.
 */
export function WorldsOverlay({ ref, status, onSkip, veil }: { ref?: Ref<OverlayHandle>; status: EngineStatus | null; onSkip: () => void; veil: boolean }) {
  const top = useRef<HTMLDivElement>(null);
  const bottom = useRef<HTMLDivElement>(null);
  const root = useRef<HTMLDivElement>(null);
  const [story, setStory] = useState(-1);
  const [ending, setEnding] = useState(false);
  const last = useRef({ story: -1, ending: false });

  useImperativeHandle(ref, () => ({
    update(p: number, t: number) {
      const portrait = window.innerWidth < window.innerHeight;
      // the ending: the bars close slowly over the last picture; the film is black before the page is revealed
      // only once the last shot has fully played out (the picture is still for a beat), then over 3 s
      const closing = smooth((t - (FILM_SECONDS + 0.3)) / 2.2);
      const h = letterbox(p, smooth(t / OPEN_SECONDS), portrait, closing);
      const s = `scaleY(${Math.max(0, Math.min(1, h * 2)).toFixed(4)})`;
      if (top.current) top.current.style.transform = s;
      if (bottom.current) bottom.current.style.transform = s;
      const i = t > FILM_SECONDS - 3.5 ? -1 : storyAt(p);
      if (i !== last.current.story) {
        last.current.story = i;
        setStory(i);
        if (i >= 0) sfx.story(INTRO_COPY[STORY[i].id].headline.split(/\s+/).length);
      }
      const e = t > FILM_SECONDS - 1;
      if (e !== last.current.ending) { last.current.ending = e; setEnding(e); }
    },
  }), []);

  const loading = !status || status.phase === "loading";

  return (
    <div ref={root} className={styles.overlay} data-ending={ending || undefined}>
      <div className={styles.shade} data-on={story >= 0 || undefined} aria-hidden />

      {STORY.map((s, i) => {
        const c = INTRO_COPY[s.id];
        return (
          <div key={s.id} className={styles.story} data-on={story === i || undefined} aria-hidden={story !== i}>
            <h2 className={styles.headline}>
              {c.headline.split(" ").map((w, k) => (
                <Fragment key={k}>
                  <span className={styles.mask}><span className={styles.word} style={{ "--i": k } as CSSProperties}>{w}</span></span>{" "}
                </Fragment>
              ))}
            </h2>
            <p className={styles.sentence}>{c.line}</p>
          </div>
        );
      })}

      <div ref={top} className={`${styles.bar} ${styles.barTop}`} style={{ transform: "scaleY(1)" }} aria-hidden />
      <div ref={bottom} className={`${styles.bar} ${styles.barBottom}`} style={{ transform: "scaleY(1)" }} aria-hidden />

      {loading && <span className={styles.loadline} role="status" aria-label="Loading the introduction"><span style={{ transform: `scaleX(${Math.max(0.04, status?.progress ?? 0)})` }} /></span>}

      <div className={styles.controls}>
        <button type="button" className={styles.ctrl} onClick={() => { sfx.stop(); onSkip(); }} data-sound="off">Skip intro <span aria-hidden>→</span></button>
        <WorldsMusic />
      </div>

      <p className="sr-only" aria-live="polite">{story >= 0 ? `${INTRO_COPY[STORY[story].id].headline} ${INTRO_COPY[STORY[story].id].line}` : ""}</p>
      <div className={styles.veil} data-on={veil || undefined} aria-hidden />
    </div>
  );
}
