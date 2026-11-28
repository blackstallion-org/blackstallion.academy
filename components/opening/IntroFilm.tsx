"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Pause, Play, Volume2, VolumeX } from "lucide-react";
import { introFilm as film, openingHorse as horseFilm } from "@/lib/content/intro-film";
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
 *
 * 22 Nov 2026 (owner): the intro opens with a 10 s black-horse film on a black stage (`openingHorse`), silent, and the instant it ends the
 * picture CUTS to "The Lineage": two stacked videos, the second made visible in one frame, with no fade, veil or transition of any kind.
 * Sound, Play/Pause and the progress bar follow whichever part is showing; Skip skips both.
 */
export function IntroFilm({ onDone, onReveal }: { onDone: () => void; onReveal?: () => void }) {
  const video = useRef<HTMLVideoElement>(null);
  const horse = useRef<HTMLVideoElement>(null);
  const cutTimer = useRef(0);
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
  // the site's sound switch drives The Lineage's sound (the horse film is silent)
  useFilmSound(video);
  /** the fade, hand-off and sound-fade timers, cancelled if the film unmounts before they run */
  const timers = useRef<number[]>([]);
  const fadeFrame = useRef(0);
  useEffect(() => () => { timers.current.forEach((t) => window.clearTimeout(t)); cancelAnimationFrame(fadeFrame.current); }, []);
  /** "horse": the 10 s black-horse film; "film": The Lineage. The change is one render, with no transition. */
  const [phase, setPhase] = useState<"horse" | "film">("horse");
  const phaseRef = useRef<"horse" | "film">("horse");
  const active = () => (phaseRef.current === "horse" ? horse.current : video.current);

  const finish = useCallback(() => {
    if (finished.current) return;
    finished.current = true;
    window.clearTimeout(cutTimer.current);
    horse.current?.pause();
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

  /** The horse film has ended: cut to The Lineage in one frame (it is already loaded underneath), or hold the last horse frame until it is. */
  const cut = useCallback(() => {
    const v = video.current;
    if (!v || finished.current || phaseRef.current === "film") return;
    const go = () => {
      if (finished.current || phaseRef.current === "film") return;
      window.clearTimeout(cutTimer.current);
      v.removeEventListener("canplay", go);
      phaseRef.current = "film";
      setPhase("film");
      v.play().catch(() => setBlocked(true));
    };
    if (v.readyState >= 2) { go(); return; }
    v.addEventListener("canplay", go);
    // The Lineage could not be loaded in time: the page is shown instead, as for any intro that cannot load
    cutTimer.current = window.setTimeout(() => { v.removeEventListener("canplay", go); if (!finished.current) { finished.current = true; onDone(); } }, LOAD_LIMIT);
  }, [onDone]);

  useEffect(() => {
    const v = horse.current;
    const lineage = video.current;
    if (!v) return;
    const key = (e: KeyboardEvent) => { if (e.key === "Escape") skip(); };
    window.addEventListener("keydown", key);
    giveUp.current = window.setTimeout(() => { if (v.readyState < 2 && !finished.current) { finished.current = true; onDone(); } }, LOAD_LIMIT);
    v.play().catch(() => { window.clearTimeout(giveUp.current); setBlocked(true); });
    // a hidden tab pauses the film instead of letting it run on unseen
    const vis = () => {
      if (finished.current) return;
      const a = active();
      if (!a) return;
      if (document.hidden) a.pause();
      else if (!held.current && a.paused) a.play().catch(() => setBlocked(true));
    };
    document.addEventListener("visibilitychange", vis);
    return () => {
      window.clearTimeout(cutTimer.current);
      window.removeEventListener("keydown", key);
      document.removeEventListener("visibilitychange", vis);
      window.clearTimeout(giveUp.current);
      v.pause();
      lineage?.pause();
    };
  }, [skip, onDone]);

  /** one bar for both parts: the horse film's seconds, then The Lineage's */
  const onTime = () => {
    const v = active();
    if (!v || !Number.isFinite(v.duration) || v.duration <= 0) return;
    const total = horseFilm.length + film.length;
    const t = (phaseRef.current === "horse" ? 0 : horseFilm.length) + v.currentTime;
    if (progress.current) progress.current.style.transform = `scaleX(${Math.min(1, t / total)})`;
  };
  const togglePlay = () => {
    const v = active();
    if (!v) return;
    window.clearTimeout(giveUp.current);
    if (v.paused) { held.current = false; v.play().then(() => setBlocked(false)).catch(() => setBlocked(true)); }
    else { held.current = true; v.pause(); }
  };
  const toggleSound = () => {
    const v = active();
    if (!v) return;
    // the choice is shared, so it carries from the (silent) horse film into The Lineage
    const next = !v.muted;
    for (const el of [horse.current, video.current]) if (el) { el.muted = next; el.volume = 1; }
    if (!next && v.paused) togglePlay();
  };

  const horsePhase = phase === "horse";
  return (
    <div className={styles.root} data-reveal={reveal || undefined} data-phase={phase} data-intro-film role="region" aria-label={`Opening film: ${horsePhase ? horseFilm.label : film.label}`}>
      <div className={styles.stage}>
        {/* The Lineage waits underneath, loading while the horse plays; it becomes visible in the same frame the horse film ends. */}
        <video
          ref={video}
          className={styles.video}
          data-hidden={horsePhase || undefined}
          muted
          playsInline
          preload="auto"
          poster={film.poster}
          aria-label={film.description}
          aria-hidden={horsePhase || undefined}
          onPlaying={() => { if (phaseRef.current === "film") { setPlaying(true); setBlocked(false); } }}
          onPause={() => { if (phaseRef.current === "film") setPlaying(false); }}
          onEnded={finish}
          // React also reports a <source> whose media query does not match (the phone file on a desktop) as an error on the video;
          // only a real media error, or every source refused, ends the intro early.
          onError={(e) => { const v = e.currentTarget; if ((v.error || v.networkState === HTMLMediaElement.NETWORK_NO_SOURCE) && !finished.current) { finished.current = true; onDone(); } }}
          onTimeUpdate={() => { if (phaseRef.current === "film") onTime(); }}
          onVolumeChange={(e) => { if (phaseRef.current === "film") setMuted(e.currentTarget.muted); }}
        >
          <source media="(max-width: 767px), (max-height: 500px)" src={film.mobile} type="video/mp4" />
          <source src={film.desktop} type="video/mp4" />
        </video>
        <video
          ref={horse}
          className={`${styles.video} ${styles.horse}`}
          data-hidden={!horsePhase || undefined}
          muted
          playsInline
          preload="auto"
          poster={horseFilm.poster}
          aria-label={horseFilm.description}
          aria-hidden={!horsePhase || undefined}
          onPlaying={() => { setPlaying(true); setBlocked(false); }}
          onPause={() => { if (phaseRef.current === "horse") setPlaying(false); }}
          onEnded={cut}
          // the horse film is a preface: if it cannot play, the intro carries straight on with The Lineage
          // (React reports a skipped <source> as an error too, so only a real media error or "no usable source" counts)
          onError={(e) => { const v = e.currentTarget; if ((v.error || v.networkState === HTMLMediaElement.NETWORK_NO_SOURCE) && !finished.current && phaseRef.current === "horse") { window.clearTimeout(giveUp.current); cut(); } }}
          onTimeUpdate={() => { if (phaseRef.current === "horse") onTime(); }}
          onVolumeChange={(e) => { if (phaseRef.current === "horse") setMuted(e.currentTarget.muted); }}
        >
          <source media="(max-width: 767px), (max-height: 500px)" src={horseFilm.mobile} type="video/mp4" />
          <source src={horseFilm.desktop} type="video/mp4" />
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
          <span className={styles.note}>{horsePhase ? horseFilm.note : film.note}</span>
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
