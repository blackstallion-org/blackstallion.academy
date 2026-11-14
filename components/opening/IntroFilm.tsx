"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Pause, Play, Volume2, VolumeX } from "lucide-react";
import { journeyFilm as film } from "@/lib/content/journey-film";
import styles from "./intro-film.module.css";

/** How long the visitor waits for the first frame before the page is shown instead (ms). */
const LOAD_LIMIT = 12000;

/**
 * The opening film, laid over the home page on the first visit of a session (15 Nov 2026: the owner's Marwar Journey film replaces
 * the real-time 3D "Four Worlds" intro). It plays once, muted until the visitor turns the sound on, and when it ends (or on Skip,
 * or Escape) it fades away over the page beneath it. A dark Play/Pause button and a Sound toggle sit in the foot of the frame
 * beside "Skip intro"; the top 80 px stay clear for the nav. If the film cannot load in time or fails, the page is shown at once.
 */
export function IntroFilm({ onDone, onReveal }: { onDone: () => void; onReveal?: () => void }) {
  const video = useRef<HTMLVideoElement>(null);
  const progress = useRef<HTMLSpanElement>(null);
  const finished = useRef(false);
  /** the load-limit timer; cleared once the visitor has to (or chooses to) press play, so the film never vanishes under their hand */
  const giveUp = useRef(0);
  // phones get the phone poster (the component only renders in the browser, after the intro marker is set)
  const [poster] = useState(() => (typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches ? film.posterMobile : film.poster));
  const [playing, setPlaying] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [muted, setMuted] = useState(true);
  const [chapter, setChapter] = useState(-1);
  const [veil, setVeil] = useState(false);
  const [reveal, setReveal] = useState(false);

  const finish = useCallback(() => {
    if (finished.current) return;
    finished.current = true;
    video.current?.pause();
    setReveal(true);
    onReveal?.();
    window.setTimeout(onDone, 2900);
  }, [onDone, onReveal]);
  const skip = useCallback(() => {
    if (finished.current) return;
    setVeil(true);
    window.setTimeout(finish, 700);
  }, [finish]);

  useEffect(() => {
    const v = video.current;
    if (!v) return;
    const key = (e: KeyboardEvent) => { if (e.key === "Escape") skip(); };
    window.addEventListener("keydown", key);
    giveUp.current = window.setTimeout(() => { if (v.readyState < 2 && !finished.current) { finished.current = true; onDone(); } }, LOAD_LIMIT);
    v.play().catch(() => { window.clearTimeout(giveUp.current); setBlocked(true); });
    return () => { window.removeEventListener("keydown", key); window.clearTimeout(giveUp.current); v.pause(); };
  }, [skip, onDone]);

  const onTime = () => {
    const v = video.current;
    if (!v || !Number.isFinite(v.duration) || v.duration <= 0) return;
    if (progress.current) progress.current.style.transform = `scaleX(${v.currentTime / v.duration})`;
    // each chapter's caption shows for its first 3.4 s, then the picture is left alone
    let next = -1;
    film.chapters.forEach((c, i) => { if (v.currentTime >= c.at + 0.6 && v.currentTime < c.at + 4) next = i; });
    setChapter((previous) => (previous === next ? previous : next));
  };
  const togglePlay = () => {
    const v = video.current;
    if (!v) return;
    window.clearTimeout(giveUp.current);
    if (v.paused) v.play().then(() => setBlocked(false)).catch(() => setBlocked(true));
    else v.pause();
  };
  const toggleSound = () => {
    const v = video.current;
    if (!v) return;
    v.muted = !v.muted;
    if (!v.muted && v.paused) togglePlay();
  };

  return (
    <div className={`${styles.root} tone-photo`} data-reveal={reveal || undefined} data-intro-film role="region" aria-label={`Introduction film: ${film.label}`}>
      <video
        ref={video}
        className={styles.video}
        muted
        playsInline
        preload="auto"
        poster={poster}
        aria-label={film.posterAlt}
        onPlaying={() => { setPlaying(true); setBlocked(false); }}
        onPause={() => setPlaying(false)}
        onEnded={finish}
        // React also reports a <source> whose media query does not match (the phone file on a desktop) as an error on the video;
        // only a real media error, or every source refused, ends the intro early.
        onError={(e) => { const v = e.currentTarget; if ((v.error || v.networkState === HTMLMediaElement.NETWORK_NO_SOURCE) && !finished.current) { finished.current = true; onDone(); } }}
        onTimeUpdate={onTime}
        onVolumeChange={(e) => setMuted(e.currentTarget.muted)}
      >
        <source media="(max-width: 767px)" src={film.mobile} type="video/mp4" />
        <source src={film.desktop} type="video/mp4" />
      </video>
      <div className={styles.shade} aria-hidden />

      {film.chapters.map((c, i) => (
        <p key={c.n} className={styles.caption} data-on={chapter === i || undefined} aria-hidden>
          <span className={styles.captionNumber}>{c.n}</span>
          <span className={styles.captionTitle}>{c.title}</span>
        </p>
      ))}

      {blocked && (
        <button type="button" className={styles.bigPlay} onClick={togglePlay} aria-label="Play the introduction film">
          <Play size={28} strokeWidth={1.2} aria-hidden />
        </button>
      )}

      <div className={styles.controls}>
        <button type="button" className={styles.skip} onClick={skip}>Skip intro <span aria-hidden>→</span></button>
        <div className={styles.buttons}>
          <button type="button" className={styles.round} onClick={toggleSound} aria-pressed={!muted} aria-label="Film sound">
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
