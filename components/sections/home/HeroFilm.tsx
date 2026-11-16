"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { useLenis } from "lenis/react";
import { useReducedMotion } from "@/lib/motion/reduced";
import { saveDataMode } from "@/lib/motion/save-data";
import { OPENING_FILM, type HeroFilmSpec } from "@/lib/content/hero-films";
import styles from "./HeroFilm.module.css";

type Playback = "loading" | "buffering" | "playing" | "paused" | "blocked" | "failed" | "ended" | "skipped";

/** Seconds before the end of a film with a closing title at which its picture starts to settle under that title. */
const CLOSE_LEAD = 1.2;

/**
 * A home-page film (lib/content/hero-films.ts), with device-sized sources and a useful still at every failure state. The default is the
 * opening film under the doctrine screen; the original opening film is the same component with its own spec further down the page.
 *
 * 16 Nov 2026 (owner): a film with an `endTitle` plays once. In its last 1.2 s the picture dims toward the warm black and pushes in
 * slowly, its last frame is held (never a cut to black) and the academy's title resolves over it in smoke and warm light; the
 * controls give way to a quiet "Replay film". "Skip intro" goes straight to that closing state, then on to the story below.
 */
export function HeroFilm({ film = OPENING_FILM }: { film?: HeroFilmSpec } = {}) {
  const archive = film.id !== OPENING_FILM.id;
  const endTitle = film.endTitle;
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressRef = useRef<HTMLSpanElement>(null);
  const bufferedRef = useRef<HTMLSpanElement>(null);
  const controlsRef = useRef<HTMLDivElement>(null);
  const playRef = useRef<HTMLButtonElement>(null);
  const replayRef = useRef<HTMLButtonElement>(null);
  const userPaused = useRef(false);
  const scrubbing = useRef(false);
  const seekRef = useRef<HTMLDivElement>(null);
  const inView = useRef(true);
  const failed = useRef(false);
  // The film has ended (or was skipped): it stays on its last frame under the title until "Replay film", so coming back
  // into view or to the tab never restarts it.
  const finished = useRef(false);
  const focusAfter = useRef<"replay" | "play" | null>(null);
  const leaveTimer = useRef(0);
  const [state, setState] = useState<Playback>("loading");
  const [muted, setMuted] = useState(true);
  const [hasFrame, setHasFrame] = useState(false);
  // The last CLOSE_LEAD seconds of playback, and the title's short fade when it leaves (Replay, or a seek back out of the close).
  const [closing, setClosing] = useState(false);
  const [leaving, setLeaving] = useState(false);
  // The film opens on its title card (2.8 s). Seeking there before the first frame plays would replace the poster,
  // so the jump happens only when playback starts, and the video stays hidden from that seek until it is playing
  // (the <picture> poster underneath shows meanwhile, exactly as before). Until then the <video> shows its own
  // poster, which is the same still: the hero is painted from the first frame instead of only once the film plays
  // (that late reveal used to be the page's LCP).
  const primed = useRef(false);
  const startAt = useRef(film.startAt); // fixed for the life of this player, so prime() stays a plain ref reader

  const [seeked, setSeeked] = useState(false);
  // On phones the status line takes its own row, so every brief stall (common while the page is still starting)
  // used to push the page down and back up (layout shift). It now appears only if buffering lasts over a second.
  const [longStall, setLongStall] = useState(false);
  useEffect(() => {
    if (state !== "buffering") return;
    const timer = window.setTimeout(() => setLongStall(true), 1000);
    return () => { window.clearTimeout(timer); setLongStall(false); };
  }, [state]);
  const reduced = useReducedMotion();
  const lenis = useLenis();

  const titled = Boolean(endTitle) && (state === "ended" || state === "skipped");
  const settle = Boolean(endTitle) && (titled || closing);

  // Keyboard focus follows the controls: into "Replay film" if the film ended while focus was on a control (they become inert),
  // back to the play button after a replay.
  useEffect(() => {
    if (titled && focusAfter.current === "replay") { focusAfter.current = null; replayRef.current?.focus({ preventScroll: true }); }
    else if (!titled && focusAfter.current === "play") { focusAfter.current = null; playRef.current?.focus({ preventScroll: true }); }
  }, [titled]);
  useEffect(() => () => window.clearTimeout(leaveTimer.current), []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    let disposed = false;
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    // Data Saver or a 2G link: the film stays on its poster (the 3 to 8 MB file is never played), like reduced motion.
    const saveData = saveDataMode();
    const failure = () => { failed.current = true; if (!disposed) setState("failed"); };
    // Source errors can happen before hydration and do not bubble from <source>.
    // Inspect the native state too, including the all-sources-failed browser case.
    // The 12 s "no picture" limit counts from the first time the film is actually asked to play, not from mount: behind the
    // 37.5 s opening film (or off screen, or with preload="metadata" on Safari) the file is not fetched, and the old clock
    // marked a healthy film as failed before it was ever started (17 Nov 2026 audit).
    let playRequested: number | null = null;
    const watchdog = window.setInterval(() => {
      if (video.networkState === HTMLMediaElement.NETWORK_NO_SOURCE || (playRequested !== null && video.readyState < 2 && performance.now() - playRequested > 12000)) failure();
      if (video.readyState >= 2 || failed.current) window.clearInterval(watchdog);
    }, 200);
    // The film starts when the loader (and the opening zoom) has gone, so none of it plays unseen behind the overlay.
    // hold while the running-horse loader is up or the opening trailer is still playing over the page ("reveal" = it is fading out)
    const holding = () => !!document.querySelector(".bsah-loader") || document.documentElement.dataset.bsahIntro === "1";
    const sync = () => {
      if (holding()) video.pause();
      else if (finished.current || document.hidden || !inView.current || userPaused.current || preference.matches || saveData) video.pause();
      else {
        prime();
        playRequested ??= performance.now();
        video.play().catch(() => { if (!disposed) setState((previous) => failed.current || previous === "failed" ? "failed" : "blocked"); });
      }
    };
    const observer = new IntersectionObserver(([entry]) => { inView.current = entry.isIntersecting; sync(); }, { threshold: 0.05 });
    observer.observe(video);
    document.addEventListener("visibilitychange", sync);
    window.addEventListener("bsah:loader-gone", sync);
    preference.addEventListener("change", sync);
    sync();
    return () => { disposed = true; clearInterval(watchdog); observer.disconnect(); document.removeEventListener("visibilitychange", sync); window.removeEventListener("bsah:loader-gone", sync); preference.removeEventListener("change", sync); video.pause(); };
  }, []);

  /** Jump to the title card once, just before the first playback (needs metadata; otherwise onLoadedMetadata does it). */
  function prime() {
    const video = videoRef.current;
    if (!video || primed.current || video.readyState < HTMLMediaElement.HAVE_METADATA) return;
    primed.current = true;
    if (startAt.current > 0 && video.currentTime < startAt.current) { setSeeked(true); video.currentTime = Math.min(startAt.current, video.duration || startAt.current); }
  }
  /** Hold the last frame (a hair before the end, so a skipped film shows it without restarting). */
  const holdLastFrame = (video: HTMLVideoElement) => {
    if (Number.isFinite(video.duration) && video.duration > 0 && video.currentTime < video.duration - 0.1) video.currentTime = Math.max(0, video.duration - 0.02);
  };
  /** The title fades out instead of vanishing, then unmounts (so its letters animate afresh next time). */
  const fadeTitleOut = () => {
    setLeaving(true);
    window.clearTimeout(leaveTimer.current);
    leaveTimer.current = window.setTimeout(() => setLeaving(false), 650);
  };
  const updateProgress = () => {
    const video = videoRef.current;
    if (!video || !Number.isFinite(video.duration) || video.duration <= 0) return;
    if (progressRef.current) progressRef.current.style.transform = `scaleX(${video.currentTime / video.duration})`;
    seekRef.current?.setAttribute("aria-valuenow", String(Math.round(100 * video.currentTime / video.duration)));
    if (bufferedRef.current && video.buffered.length) bufferedRef.current.style.transform = `scaleX(${video.buffered.end(video.buffered.length - 1) / video.duration})`;
  };
  /** The picture starts to settle CLOSE_LEAD seconds before the end, and lifts again if the viewer seeks back out of it. */
  const watchClose = () => {
    const video = videoRef.current;
    if (!endTitle || !video || !Number.isFinite(video.duration) || video.duration <= 0) return;
    const near = video.duration - video.currentTime <= CLOSE_LEAD;
    if (near === closing) return;
    setClosing(near);
    if (near) { window.clearTimeout(leaveTimer.current); setLeaving(false); }
    else if (!finished.current) fadeTitleOut();
  };
  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    userPaused.current = !video.paused;
    if (video.paused) { prime(); video.play().catch(() => setState((previous) => previous === "failed" ? previous : "blocked")); }
    else video.pause();
  };
  const skip = () => {
    userPaused.current = true;
    const video = videoRef.current;
    video?.pause();
    // Straight to the closing title (scrolling back up finds it, not a paused frame), then on to the story below.
    if (endTitle) { finished.current = true; if (video) holdLastFrame(video); }
    setState("skipped");
    // Skipping lands on the story that follows the film.
    const target = document.querySelector<HTMLElement>("[data-home-story]") ?? document.getElementById("doctrine");
    if (!target) return;
    if (lenis && !reduced) lenis.scrollTo(target, { immediate: true });
    else target.scrollIntoView({ behavior: "instant" });
    target.focus({ preventScroll: true });
  };
  const replay = () => {
    const video = videoRef.current;
    if (!video) return;
    finished.current = false;
    userPaused.current = false;
    setClosing(false);
    fadeTitleOut();
    focusAfter.current = "play";
    setState("paused");
    video.currentTime = 0;
    prime();
    video.play().catch(() => setState((previous) => previous === "failed" ? previous : "blocked"));
  };
  const onEnded = () => {
    if (endTitle) {
      finished.current = true;
      const active = document.activeElement;
      if (active && (controlsRef.current?.contains(active) || seekRef.current === active)) focusAfter.current = "replay";
    }
    setState("ended");
  };
  const seekFromPointer = (clientX: number, el: HTMLElement) => {
    const video = videoRef.current;
    if (!video || !Number.isFinite(video.duration) || video.duration <= 0) return;
    const rect = el.getBoundingClientRect();
    video.currentTime = Math.min(1, Math.max(0, (clientX - rect.left) / Math.max(1, rect.width))) * video.duration;
    updateProgress();
  };
  const seekBy = (seconds: number) => {
    const video = videoRef.current;
    if (!video || !Number.isFinite(video.duration)) return;
    video.currentTime = Math.min(video.duration, Math.max(0, video.currentTime + seconds));
    updateProgress();
  };
  const playing = state === "playing";

  // "full" (the Marwar film, 9 Nov 2026): a true 2:1 picture, so the section has its shape and the picture fills it edge to edge.
  // "scope" (the original film): a scope picture (about 2.5:1) delivered inside 16:9 files with black bars baked in (the picture is 71 % of
  // the frame's height: rows 130 to 770 of 900), and its title cards run across 71 % of the picture's width. So it fills its band as far
  // as it can without cutting a word: the frame is 1.28 screens wide (1.3 on a phone) and its soft top and bottom edges (a mask) dissolve
  // into the dark, where the baked bars are. 4 Nov 2026 (owner): no empty bands, the section is cut to the picture itself (1.95:1).
  const FRAME_ASPECT = "1606 / 900";
  const scope = film.layout === "scope";
  const picture = <>
    <picture className="absolute inset-0">
      <source media="(max-width: 767px)" srcSet={film.posterMobile} />
      {/* Native picture is deliberately available before JS and video decoding. */}
      <img data-hero-poster src={film.poster} alt={film.posterAlt} fetchPriority={archive ? "low" : "high"} loading={archive ? "lazy" : undefined} className="h-full w-full object-cover" />
    </picture>
    <video ref={videoRef} className={`absolute inset-0 h-full w-full object-cover ${state !== "failed" && (hasFrame || !seeked) ? "opacity-100" : "opacity-0"}`} muted loop={!endTitle} playsInline preload="metadata" poster={film.poster} aria-label={`${film.label}`}
      onLoadedMetadata={() => { const video = videoRef.current; if (video && finished.current) holdLastFrame(video); else if (video && !video.paused) prime(); updateProgress(); }}
      onPlaying={() => { failed.current = false; setHasFrame(true); setState("playing"); }} onPause={() => setState((previous) => previous === "skipped" || previous === "failed" || previous === "ended" ? previous : "paused")}
      onWaiting={() => setState((previous) => failed.current || previous === "failed" ? "failed" : "buffering")} onStalled={() => setState((previous) => previous === "playing" ? "buffering" : previous)} onEnded={onEnded}
      onError={(event) => {
        // React also reports a skipped <source> (the phone cut on a desktop) as an error on the video: only a real media error,
        // or every source refused, marks the film as failed (same guard as IntroFilm and JourneyFilm).
        const video = event.currentTarget;
        if (video.error || video.networkState === HTMLMediaElement.NETWORK_NO_SOURCE) { failed.current = true; setState("failed"); }
      }} onTimeUpdate={() => { updateProgress(); watchClose(); }} onProgress={updateProgress} onVolumeChange={(event) => setMuted(event.currentTarget.muted)}>
      {/* No onError on <source>: a source whose media query does not match fires "error" when it is skipped, which
          wrongly marked the film as failed on wide screens. Real failures are caught by the video's own error
          event and by the NETWORK_NO_SOURCE watchdog above. */}
      <source media="(max-width: 767px)" src={film.mobile} type="video/mp4" />
      <source src={film.desktop} type="video/mp4" />
    </video>
  </>;
  return <section id={film.id} aria-label={film.label} data-playback={state} data-settle={settle ? "" : undefined} data-titled={titled ? "" : undefined} className={`tone-photo relative w-full overflow-hidden bg-night ${styles.film} ${scope ? "aspect-[1.95/1]" : "aspect-[2/1]"}`}>
    {/* 31 Oct 2026 (owner's request): no picture behind the film. Around a scope frame the screen is plain black on phone and desktop. */}
    {scope
      ? <div className="absolute left-1/2 top-1/2 w-[130vw] -translate-x-1/2 -translate-y-1/2 md:w-[128%]" style={{ aspectRatio: FRAME_ASPECT, maskImage: "linear-gradient(to bottom, transparent 14.6%, black 14.6%, black 85.4%, transparent 85.4%)", WebkitMaskImage: "linear-gradient(to bottom, transparent 14.6%, black 14.6%, black 85.4%, transparent 85.4%)" }}>{picture}</div>
      : <div className={`absolute inset-0 ${styles.picture}`}>{picture}</div>}

    {endTitle ? <>
      {/* A warm-to-dark wash over the held frame; always present so it can ease both ways. */}
      <div className={styles.wash} aria-hidden />
      {/* The closing title. Decorative layers are hidden from assistive technology; the sentence below is read once. */}
      {settle || leaving ? <div className={styles.title} data-leaving={leaving && !settle ? "" : undefined} aria-hidden>
        <div className={styles.smoke}><span className={styles.puff} /><span className={styles.puff} /><span className={styles.puff} /></div>
        <div className={styles.lockup}>
          <p className={`t-inscribe ${styles.name}`}>
            {endTitle.name.split(" ").map((word, w, words) => {
              const offset = words.slice(0, w).join(" ").length + (w ? 1 : 0);
              return <span key={w}>
                {[...word].map((letter, l) => <span key={l} className={styles.char} style={{ "--i": offset + l } as CSSProperties}>{letter}</span>)}
                {w < words.length - 1 ? " " : null}
              </span>;
            })}
            <span className={styles.sheen}>{endTitle.name}</span>
          </p>
          <p className={styles.subline}><span className={styles.rule} /><span className={`label ${styles.sub}`}>{endTitle.line}</span><span className={styles.rule} /></p>
        </div>
      </div> : null}
      {titled ? <p className="sr-only">{endTitle.name}, {endTitle.line}</p> : null}
    </> : null}

    {/* Controls sit on the foot of the screen (never in the top 80 px, which belongs to the nav). They give way to the closing title. */}
    <div ref={controlsRef} inert={titled} data-sound="off" className={`no-print gutter absolute inset-x-0 bottom-0 z-10 flex flex-wrap items-center justify-end sm:justify-between gap-x-3 gap-y-2 pb-3 pt-6 md:pb-7 md:pt-12 ${styles.controls}`}>
      {archive ? <span className="hidden sm:block" /> : <button type="button" onClick={skip} className="label hidden min-h-11 rounded-full border border-brass/50 bg-night/40 px-4 text-sand backdrop-blur-[2px] hover:text-gold sm:inline-block">Skip intro</button>}
      <p className="order-last w-full text-center text-xs text-sand sm:order-none sm:w-auto sm:flex-1" role="status" aria-live="polite">
        {state === "buffering" ? (longStall ? "Buffering film…" : null) : state === "failed" ? "The film is unavailable. Continue to explore the academy." : state === "blocked" ? "Press play to watch the opening film." : null}
      </p>
      <div className="flex items-center gap-2">
        <button type="button" disabled={state === "failed"} onClick={() => seekBy(-10)} aria-label="Back 10 seconds" className="label hidden h-11 min-w-11 place-items-center sm:grid rounded-full border border-brass/50 bg-night/40 px-3 text-xs text-sand backdrop-blur-[2px] hover:text-gold disabled:opacity-40">-10s</button>
        <button type="button" disabled={state === "failed"} onClick={() => seekBy(10)} aria-label="Forward 10 seconds" className="label hidden h-11 min-w-11 place-items-center sm:grid rounded-full border border-brass/50 bg-night/40 px-3 text-xs text-sand backdrop-blur-[2px] hover:text-gold disabled:opacity-40">+10s</button>
        <button type="button" disabled={state === "failed"} onClick={() => { if (videoRef.current) videoRef.current.muted = !videoRef.current.muted; }} aria-pressed={!muted} aria-label={muted ? "Sound off. Unmute the film" : "Sound on. Mute the film"} className="label min-h-9 rounded-full border border-brass/50 bg-night/40 px-3 text-[0.6rem] text-sand backdrop-blur-[2px] hover:text-gold disabled:opacity-50 sm:min-h-11 sm:px-4 sm:text-[inherit]">Sound {muted ? "off" : "on"}</button>
        <button ref={playRef} type="button" disabled={state === "failed"} onClick={togglePlay} aria-label={playing ? "Pause the film" : "Play the film"} className="grid h-9 w-9 place-items-center rounded-full border border-brass/50 bg-night/40 sm:h-11 sm:w-11 text-sand backdrop-blur-[2px] hover:text-gold disabled:opacity-50"><span aria-hidden>{playing ? "Ⅱ" : "▶"}</span></button>
      </div>
    </div>
    {/* Seek bar along the bottom edge: drag, click or touch anywhere on it to scrub, like a video player. Arrow keys step 5 s (Shift: 10 s). */}
    <div ref={seekRef} role="slider" tabIndex={0} inert={titled} aria-label={`Seek: ${film.label}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={0} data-seek
      className={`absolute inset-x-0 bottom-0 z-10 h-6 cursor-pointer touch-none select-none outline-none focus-visible:ring-2 focus-visible:ring-gold/70 ${styles.controls}`}
      onPointerDown={(event) => { if (state === "failed") return; event.currentTarget.setPointerCapture(event.pointerId); scrubbing.current = true; seekFromPointer(event.clientX, event.currentTarget); }}
      onPointerMove={(event) => { if (scrubbing.current) seekFromPointer(event.clientX, event.currentTarget); }}
      onPointerUp={() => { scrubbing.current = false; }}
      onPointerCancel={() => { scrubbing.current = false; }}
      onKeyDown={(event) => {
        const step = event.shiftKey ? 10 : 5;
        const video = videoRef.current;
        if (!video) return;
        if (event.key === "ArrowRight") seekBy(step);
        else if (event.key === "ArrowLeft") seekBy(-step);
        else if (event.key === "Home") video.currentTime = 0;
        else if (event.key === "End") video.currentTime = video.duration || 0;
        else return;
        event.preventDefault();
      }}>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[3px] bg-night/50" aria-hidden>
        <span ref={bufferedRef} className="absolute inset-0 origin-left bg-brass/40" style={{ transform: "scaleX(0)" }} />
        <span ref={progressRef} className="absolute inset-0 origin-left bg-gold" style={{ transform: "scaleX(0)" }} />
      </div>
    </div>
    {/* After the film: one quiet way back into it, where the controls were. */}
    {endTitle && titled ? <div className="no-print gutter pointer-events-none absolute inset-x-0 bottom-0 z-20 flex justify-end pb-3 md:pb-7">
      <button ref={replayRef} type="button" onClick={replay} className={`label pointer-events-auto min-h-9 rounded-full border border-brass/40 bg-night/30 px-4 text-[0.6rem] text-sand backdrop-blur-[2px] hover:border-brass hover:text-gold sm:min-h-11 sm:text-[inherit] ${styles.replay}`}>{endTitle.replay}</button>
    </div> : null}
  </section>;
}
