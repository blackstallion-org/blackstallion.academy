"use client";

import Link from "next/link";
import { useImperativeHandle, useRef, useState, type Ref } from "react";
import { WORLD_SWISS, WORLDS_FINAL } from "@/lib/content/worlds";
import { CHAPTERS, HOLDS } from "./core/timeline";
import type { EngineStatus } from "./core/engine";
import { WorldsSoundButton } from "./WorldsSound";
import styles from "./four-worlds.module.css";

export type OverlayHandle = { update: (progress: number) => void };

/** The chapter whose card is on screen (-1 inside a transition: the text steps aside while the worlds dissolve). */
const chapterAt = (p: number) => CHAPTERS.findIndex((c) => p >= c.from - 0.005 && p <= c.to + 0.005);
/** The index item that is "on": the latest chapter that has begun. */
const indexAt = (p: number) => CHAPTERS.reduce((on, c, i) => (p >= c.from - 0.03 ? i : on), 0);

/**
 * Everything drawn over the film, in a Swiss grid: one sans, flush left, a very large numeral, a hairline, one short line per
 * world. A bottom bar carries the progress hairline, the four worlds (real buttons) and the sound and light-mode switches.
 * It never re-renders with the scroll: the page pushes the progress in through `update`, which writes the hairline directly
 * and sets React state only when the chapter, the final call to action or the hint actually changes.
 */
export function WorldsOverlay({ ref, status, onJump, lite, onLite }: { ref?: Ref<OverlayHandle>; status: EngineStatus | null; onJump: (p: number) => void; lite: boolean; onLite: () => void }) {
  const fill = useRef<HTMLSpanElement>(null);
  const [chapter, setChapter] = useState(0);
  const [index, setIndex] = useState(0);
  const [final, setFinal] = useState(false);
  const [hint, setHint] = useState(true);
  const loading = !status || status.phase === "loading";

  useImperativeHandle(ref, () => ({
    update(p: number) {
      if (fill.current) fill.current.style.transform = `scaleX(${p})`;
      setChapter(chapterAt(p));
      setIndex(indexAt(p));
      setFinal(p >= 0.955);
      setHint(p < 0.02);
    },
  }), []);

  return (
    <div className={styles.overlay}>
      {loading && (
        <div className={styles.loading} role="status" aria-live="polite">
          <span>Loading</span>
          <span className={styles.loadbar}><span style={{ transform: `scaleX(${status?.progress ?? 0.05})` }} /></span>
        </div>
      )}

      <div className={styles.shade} data-on={chapter >= 0 || undefined} aria-hidden />
      <div className={styles.shade} data-on={final || undefined} aria-hidden />

      {CHAPTERS.map((c, i) => {
        const copy = WORLD_SWISS[c.id];
        return (
          <section key={c.id} className={styles.card} data-on={chapter === i || undefined} aria-label={`${c.n} ${c.title}`}>
            <span className={styles.numeral} aria-hidden>{c.n}</span>
            <div className={styles.cardText}>
              <h2 className={styles.title}>{c.title}</h2>
              <p className={styles.line}>{copy.line}</p>
              {copy.note && <p className={styles.note}>{copy.note}</p>}
            </div>
          </section>
        );
      })}

      <p className={styles.hint} data-off={!hint || undefined} aria-hidden>Scroll ↓</p>

      <div className={styles.final} data-on={final || undefined}>
        <h2 className={styles.finalHead}>{WORLDS_FINAL.inscription}</h2>
        <p className={styles.finalSub}>{WORLDS_FINAL.sub}</p>
        <div className={styles.ctas}>
          <Link href={WORLDS_FINAL.primary.href} className={styles.primary}>
            {WORLDS_FINAL.primary.label} <span aria-hidden>→</span>
          </Link>
          <Link href={WORLDS_FINAL.secondary.href} className={styles.secondary}>
            {WORLDS_FINAL.secondary.label} <span aria-hidden>→</span>
          </Link>
        </div>
      </div>

      <div className={styles.bar}>
        <span className={styles.track} aria-hidden><span ref={fill} className={styles.fill} /></span>
        <div className={styles.row}>
          <nav className={styles.index} aria-label="Worlds">
            {CHAPTERS.map((c, i) => {
              const at = HOLDS.find((h) => h.label.toLowerCase() === c.title.toLowerCase())?.at ?? c.from;
              return (
                <button key={c.id} type="button" className={styles.indexItem} data-on={index === i || undefined} onClick={() => onJump(at)} aria-current={index === i ? "step" : undefined} aria-label={`${c.n} ${c.title}`}>
                  <span className={styles.num}>{c.n}</span>
                  <span className={styles.indexName}>{c.title}</span>
                </button>
              );
            })}
          </nav>
          <div className={styles.controls}>
            <button type="button" className={styles.ctrl} aria-pressed={lite} onClick={onLite} title="Lighter picture for slower devices">
              <span>Smooth</span>
              <span className={styles.ctrlState}>{lite ? "On" : "Auto"}</span>
            </button>
            <WorldsSoundButton />
          </div>
        </div>
      </div>
    </div>
  );
}
