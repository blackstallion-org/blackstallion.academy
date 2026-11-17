"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Pause, Play, Volume2, VolumeX } from "lucide-react";
import { introFilm as film } from "@/lib/content/intro-film";
import { useFilmSound } from "@/lib/audio/film-sound";
import styles from "./intro-film.module.css";

/** How long the visitor waits for the first frame before the page is shown instead (ms). */
const LOAD_LIMIT = 12000;

/**
 * The opening film (16 Nov 2026): 37.5 s of ink and parchment laid over the home page on the first visit of a session
 * (lib/opening/intro-boot.ts decides; never under reduced motion, Data Saver or 2G). It plays once, muted until the visitor turns
 * the sound on (the score is in the same file, so it is always in sync), and when it ends, or on Skip or Escape, it dissolves into
 * the page beneath. Landscape screens fill with the film; portrait phones show the whole 16:9 picture on a parchment field, with
 * the controls below it. The top 80 px stay clear for the nav. If the film cannot load in time or fails, the page is shown at once.
 */
export function IntroFilm({ onDone, onReveal }: { onDone: () => void; onReveal?: () => void }) {
  const video = useRef<HTMLVideoElement>(null);
  const progress = useRef<HTMLSpanElement>(null);
  const finished = useRef(false);
  /** the load-limit timer; cleared once the visitor has to (or chooses to) press play, so the film never vanishes under their hand */
  const giveUp = useRef(0);
  /** paused by the visitor (not by a hidden tab), so returning to the tab does not resume it */
  const held = useRef(false);
  const [playing, setPlaying] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [muted, setMuted] = useState(true);
  const [veil, setVeil] = useState(false);
  const [reveal, setReveal] = useState(false);
  useFilmSound(video);
  /** the fade, hand-off and sound-fade timers, cancelled if the film unmounts before they run */
  const timers = useRef<number[]>([]);
  const fadeFrame = useRef(0);
  useEffect(() => () => { timers.current.forEach((t) => window.clearTimeout(t)); cancelAnimationFrame(fadeFrame.current); }, []);

  const finish = useCallback(() => {
    if (finished.current) return;
    finished.current = true;
    const v = video.current;
    // the sound leaves with the picture instead of stopping dead
    if (v && !v.muted && !v.paused) {
      const start = performance.now();
      const step = (now: number) => {
        // a frame's timestamp can fall a hair before `start`, which would put the volume above 1 and throw
        const k = Math.min(1, Math.max(0, 1 - (now - start) / 1400));
        v.volume = k;
        if (k > 0) fadeFrame.current = requestAnimationFrame(step);
        else v.pause();
      };
      fadeFrame.current = requestAnimationFrame(step);
    } else v?.pause();
    setReveal(true);
    onReveal?.();
    timers.current.push(window.setTimeout(onDone, 2100));
  }, [onDone, onReveal]);
  const skip = useCallback(() => {
    if (finished.current) return;
    setVeil(true);
    timers.current.push(window.setTimeout(finish, 500));
  }, [finish]);

  useEffect(() => {
    const v = video.current;
    if (!v) return;
    const key = (e: KeyboardEvent) => { if (e.key === "Escape") skip(); };
    window.addEventListener("keydown", key);
    giveUp.current = window.setTimeout(() => { if (v.readyState < 2 && !finished.current) { finished.current = true; onDone(); } }, LOAD_LIMIT);
    v.play().catch(() => { window.clearTimeout(giveUp.current); setBlocked(true); });
    // a hidden tab pauses the film instead of letting it run on unseen
    const vis = () => {
      if (finished.current) return;
      if (document.hidden) v.pause();
      else if (!held.current && v.paused) v.play().catch(() => setBlocked(true));
    };
    document.addEventListener("visibilitychange", vis);
    return () => {
      window.removeEventListener("keydown", key);
      document.removeEventListener("visibilitychange", vis);
      window.clearTimeout(giveUp.current);
      v.pause();
    };
  }, [skip, onDone]);

  const onTime = () => {
    const v = video.current;
    if (!v || !Number.isFinite(v.duration) || v.duration <= 0) return;
    if (progress.current) progress.current.style.transform = `scaleX(${v.currentTime / v.duration})`;
  };
  const togglePlay = () => {
    const v = video.current;
    if (!v) return;
    window.clearTimeout(giveUp.current);
    if (v.paused) { held.current = false; v.play().then(() => setBlocked(false)).catch(() => setBlocked(true)); }
    else { held.current = true; v.pause(); }
  };
  const toggleSound = () => {
    const v = video.current;
    if (!v) return;
    v.muted = !v.muted;
    v.volume = 1;
    if (!v.muted && v.paused) togglePlay();
  };

  return (
    <div className={styles.root} data-reveal={reveal || undefined} data-intro-film role="region" aria-label={`Opening film: ${film.label}`}>
      <div className={styles.stage}>
        <video
          ref={video}
          className={styles.video}
          muted
          playsInline
          preload="auto"
          poster={film.poster}
          aria-label={film.description}
          onPlaying={() => { setPlaying(true); setBlocked(false); }}
          onPause={() => setPlaying(false)}
          onEnded={finish}
          // React also reports a <source> whose media query does not match (the phone file on a desktop) as an error on the video;
          // only a real media error, or every source refused, ends the intro early.
          onError={(e) => { const v = e.currentTarget; if ((v.error || v.networkState === HTMLMediaElement.NETWORK_NO_SOURCE) && !finished.current) { finished.current = true; onDone(); } }}
          onTimeUpdate={onTime}
          onVolumeChange={(e) => setMuted(e.currentTarget.muted)}
        >
          <source media="(max-width: 767px), (max-height: 500px)" src={film.mobile} type="video/mp4" />
          <source src={film.desktop} type="video/mp4" />
        </video>
      </div>
      <div className={styles.foot} aria-hidden />

      {blocked && (
        <button type="button" className={styles.bigPlay} onClick={togglePlay} aria-label="Play the opening film">
          <Play size={28} strokeWidth={1.2} aria-hidden />
        </button>
      )}

      <div className={styles.controls}>
        <div className={styles.left}>
          <button type="button" className={styles.skip} onClick={skip}>Skip intro <span aria-hidden>→</span></button>
          <span className={styles.note}>{film.note}</span>
        </div>
        <div className={styles.buttons}>
          <button type="button" className={styles.round} data-film-sound onClick={toggleSound} aria-pressed={!muted} aria-label="Film sound">
            {muted ? <VolumeX size={18} strokeWidth={1.4} aria-hidden /> : <Volume2 size={18} strokeWidth={1.4} aria-hidden />}
          </button>
          <button type="button" className={`${styles.round} ${styles.play}`} onClick={togglePlay} aria-label={playing ? "Pause the film" : "Play the film"}>
            {playing ? <Pause size={20} strokeWidth={1.4} aria-hidden /> : <Play size={20} strokeWidth={1.4} aria-hidden />}
          </button>
        </div>
      </div>
      <span className={styles.track} aria-hidden><span ref={progress} /></span>
      <div className={styles.veil} data-on={veil || undefined} aria-hidden />
    </div>
  );
}
