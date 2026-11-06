"use client";

import Link from "next/link";
import { WORLD_COPY, WORLDS_FINAL } from "@/lib/content/worlds";
import { CHAPTERS, HOLDS } from "./core/timeline";
import type { EngineStatus } from "./core/engine";
import styles from "./four-worlds.module.css";

const fade = (p: number, a: number, b: number, edge = 0.025) => {
  if (p < a - edge || p > b + edge) return 0;
  const i = Math.min(1, (p - (a - edge)) / edge);
  const o = Math.min(1, ((b + edge) - p) / edge);
  return Math.max(0, Math.min(i, o));
};

/**
 * Everything drawn over the film: the chapter card of the world on screen (bottom left, clear of the site navigation), the
 * chapter rail (four real buttons, keyboard reachable), the loading line, and the call to action after the final reveal.
 */
export function WorldsOverlay({ progress, status, onJump }: { progress: number; status: EngineStatus | null; onJump: (p: number) => void }) {
  const loading = !status || status.phase === "loading";
  const final = fade(progress, 0.955, 1.2, 0.03);
  const card = Math.max(...CHAPTERS.map((c) => fade(progress, c.from, c.to)));
  return (
    <div className={styles.overlay}>
      {loading && (
        <div className={styles.loading} role="status" aria-live="polite">
          <span className="label text-brass">Loading the first world</span>
          <span className={styles.loadbar}><span style={{ transform: `scaleX(${status?.progress ?? 0.05})` }} /></span>
        </div>
      )}

      <div className={styles.cardShade} style={{ opacity: card }} aria-hidden />
      {CHAPTERS.map((c) => {
        const o = fade(progress, c.from, c.to);
        const copy = WORLD_COPY[c.id];
        return (
          <div key={c.id} className={styles.card} style={{ opacity: o, visibility: o > 0.01 ? "visible" : "hidden" }} aria-hidden={o < 0.5}>
            <p className="label text-gold">
              <span className="font-mono">{c.n}</span> — {c.title.toUpperCase()}
            </p>
            <p className={`label ${styles.sub}`}>{c.subtitle.toUpperCase()}</p>
            <span className={styles.rule} aria-hidden />
            <h2 className={styles.headline}>
              <span className="t-inscribe block">{copy.inscription}</span>
              <span className="t-voice block text-gold">{copy.voice}</span>
            </h2>
            <p className={styles.line}>{copy.line}</p>
            {copy.note && <p className={styles.note}>{copy.note}</p>}
          </div>
        );
      })}

      {progress < 0.02 && !loading && (
        <p className={`label ${styles.hint}`} aria-hidden>
          Scroll to begin
        </p>
      )}

      <nav className={styles.rail} aria-label="Worlds">
        {CHAPTERS.map((c) => {
          const at = HOLDS.find((h) => h.label.toLowerCase() === c.title.toLowerCase())?.at ?? c.from;
          const on = progress >= c.from - 0.03 && progress <= (CHAPTERS[CHAPTERS.indexOf(c) + 1]?.from ?? 1.01) - 0.03;
          return (
            <button key={c.id} type="button" className={styles.railItem} data-on={on || undefined} onClick={() => onJump(at)} aria-current={on ? "step" : undefined}>
              <span className="font-mono">{c.n}</span>
              <span className="label">{c.title}</span>
            </button>
          );
        })}
      </nav>

      <div className={styles.finalShade} style={{ opacity: final }} aria-hidden />
      <div className={styles.final} style={{ opacity: final, visibility: final > 0.01 ? "visible" : "hidden" }}>
        <h2 className={styles.finalHeadline}>
          <span className="t-inscribe block">{WORLDS_FINAL.inscription}</span>
          <span className="t-voice block text-gold">{WORLDS_FINAL.voice}</span>
        </h2>
        <div className={styles.ctas}>
          <Link href={WORLDS_FINAL.primary.href} className={styles.primary} tabIndex={final > 0.5 ? 0 : -1}>
            <span className="label">{WORLDS_FINAL.primary.label}</span>
          </Link>
          <Link href={WORLDS_FINAL.secondary.href} className={styles.secondary} tabIndex={final > 0.5 ? 0 : -1}>
            <span className="label">{WORLDS_FINAL.secondary.label}</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
