"use client";

import { Fragment, useImperativeHandle, useRef, useState, type CSSProperties, type Ref } from "react";
import { INTRO_COPY } from "@/lib/content/worlds";
import { END_SECONDS, FILM_SECONDS, OPEN_SECONDS } from "./core/director";
import { letterbox } from "./core/letterbox";
import type { EngineStatus } from "./core/engine";
import type { WorldId } from "./core/types";
import { sfx } from "./core/sfx";
import { WorldsMusic } from "./WorldsSound";
import styles from "./four-worlds.module.css";

export type OverlayHandle = { update: (progress: number, seconds: number) => void };

/** Where in the film (progress) each world's headline and sentence are on screen. */
const STORY: { id: WorldId; from: number; to: number }[] = [
  { id: "origins", from: 0.014, to: 0.2 },
  { id: "life", from: 0.278, to: 0.462 },
  { id: "legacy", from: 0.512, to: 0.702 },
  { id: "beyond", from: 0.758, to: 0.925 },
];
/** progress where each world begins to open (its transition starts) */
const WORLD_AT = [0, 0.235, 0.47, 0.715];
const storyAt = (p: number) => STORY.findIndex((s) => p >= s.from && p <= s.to);

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
  const last = useRef({ story: -1, ending: false, world: -1 });

  useImperativeHandle(ref, () => ({
    update(p: number, t: number) {
      const portrait = window.innerWidth < window.innerHeight;
      // the ending: the bars close slowly over the last picture; the film is black before the page is revealed
      const closing = smooth((t - (FILM_SECONDS + 0.6)) / (END_SECONDS - 3));
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
      // one opening cue per world, as its transition begins (the first as the bars open)
      const w = p >= WORLD_AT[3] ? 3 : p >= WORLD_AT[2] ? 2 : p >= WORLD_AT[1] ? 1 : t > 0.5 ? 0 : -1;
      if (w > last.current.world && t < FILM_SECONDS) { last.current.world = w; sfx.world(STORY[w].id); }
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
