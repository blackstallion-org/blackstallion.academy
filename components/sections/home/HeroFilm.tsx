"use client";

import { useEffect, useRef, useState } from "react";
import { useLenis } from "lenis/react";
import { useReducedMotion } from "@/lib/motion/reduced";

type Playback = "loading" | "buffering" | "playing" | "paused" | "blocked" | "failed" | "ended" | "skipped";

/** Existing opening film, with device-sized sources and a useful still at every failure state. */
export function HeroFilm() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressRef = useRef<HTMLSpanElement>(null);
  const bufferedRef = useRef<HTMLSpanElement>(null);
  const userPaused = useRef(false);
  const inView = useRef(true);
  const failed = useRef(false);
  const [state, setState] = useState<Playback>("loading");
  const [muted, setMuted] = useState(true);
  const [hasFrame, setHasFrame] = useState(false);
  const reduced = useReducedMotion();
  const lenis = useLenis();

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    let disposed = false;
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const failure = () => { failed.current = true; if (!disposed) setState("failed"); };
    // Source errors can happen before hydration and do not bubble from <source>.
    // Inspect the native state too, including the all-sources-failed browser case.
    const mediaStarted = performance.now();
    const watchdog = window.setInterval(() => {
      if (video.networkState === HTMLMediaElement.NETWORK_NO_SOURCE || (!preference.matches && video.readyState < 2 && performance.now() - mediaStarted > 12000)) failure();
      if (video.readyState >= 2 || failed.current) window.clearInterval(watchdog);
    }, 200);
    const sync = () => {
      if (document.hidden || !inView.current || userPaused.current || preference.matches) video.pause();
      else video.play().catch(() => { if (!disposed) setState((previous) => failed.current || previous === "failed" ? "failed" : "blocked"); });
    };
    const observer = new IntersectionObserver(([entry]) => { inView.current = entry.isIntersecting; sync(); }, { threshold: 0.05 });
    observer.observe(video);
    document.addEventListener("visibilitychange", sync);
    preference.addEventListener("change", sync);
    sync();
    return () => { disposed = true; clearInterval(watchdog); observer.disconnect(); document.removeEventListener("visibilitychange", sync); preference.removeEventListener("change", sync); video.pause(); };
  }, []);

  const updateProgress = () => {
    const video = videoRef.current;
    if (!video || !Number.isFinite(video.duration) || video.duration <= 0) return;
    if (progressRef.current) progressRef.current.style.transform = `scaleX(${video.currentTime / video.duration})`;
    if (bufferedRef.current && video.buffered.length) bufferedRef.current.style.transform = `scaleX(${video.buffered.end(video.buffered.length - 1) / video.duration})`;
  };
  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    userPaused.current = !video.paused;
    if (video.paused) video.play().catch(() => setState((previous) => previous === "failed" ? previous : "blocked"));
    else video.pause();
  };
  const skip = () => {
    userPaused.current = true;
    videoRef.current?.pause();
    setState("skipped");
    const target = document.getElementById("doctrine");
    if (!target) return;
    if (lenis && !reduced) lenis.scrollTo(target, { immediate: true });
    else target.scrollIntoView({ behavior: "instant" });
    target.focus({ preventScroll: true });
  };
  const playing = state === "playing";

  // The film is a scope picture (≈2.48:1) delivered inside 16:9 files with baked-in black bars
  // (cropdetect: 1284×518 at y=104 of 1284×720, 1606×648 at y=130 of 1606×900). The frame takes the film's
  // own ratio at full viewport width and the media is cropped to it, so no black bars or empty viewport remain on
  // any screen; the controls sit on a bar attached to the bottom edge of the frame.
  return <section id="top" aria-label="Opening Film" data-playback={state} className="tone-dark relative w-full bg-night pt-16 md:pt-20">
    <div className="relative w-full overflow-hidden bg-night" style={{ aspectRatio: "1284 / 518" }}>
      <picture className="absolute inset-0">
        <source media="(max-width: 767px)" srcSet="/video/hero-main-poster-mobile.webp" />
        {/* Native picture is deliberately available before JS and video decoding. */}
        <img data-hero-poster src="/video/hero-main-poster.webp" alt="Marwari stallions in the academy opening film" fetchPriority="high" className="h-full w-full object-cover" style={{ objectPosition: "50% 51.5%" }} />
      </picture>
      <video ref={videoRef} className={`absolute inset-0 h-full w-full object-cover ${hasFrame && state !== "failed" ? "opacity-100" : "opacity-0"}`} style={{ objectPosition: "50% 51.5%" }} muted loop playsInline preload="metadata" poster="/video/hero-main-poster.webp" aria-label="The Marwari Stallion opening film"
        onLoadedMetadata={() => { const video = videoRef.current; if (video && video.currentTime < 2.8) video.currentTime = Math.min(2.8, video.duration || 2.8); updateProgress(); }}
        onPlaying={() => { failed.current = false; setHasFrame(true); setState("playing"); }} onPause={() => setState((previous) => previous === "skipped" || previous === "failed" ? previous : "paused")}
        onWaiting={() => setState((previous) => failed.current || previous === "failed" ? "failed" : "buffering")} onStalled={() => setState((previous) => previous === "playing" ? "buffering" : previous)} onEnded={() => setState("ended")}
        onError={() => { failed.current = true; setState("failed"); }} onTimeUpdate={updateProgress} onProgress={updateProgress} onVolumeChange={(event) => setMuted(event.currentTarget.muted)}>
        <source media="(max-width: 767px)" src="/video/hero-main-mobile.mp4" type="video/mp4" onError={() => { failed.current = true; setState("failed"); }} />
        <source src="/video/hero-main-desktop.mp4" type="video/mp4" onError={() => { failed.current = true; setState("failed"); }} />
      </video>
      {/* Progress sits on the frame's bottom edge. */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[3px] bg-night/50" aria-hidden><span ref={bufferedRef} className="absolute inset-0 origin-left bg-brass/40" style={{ transform: "scaleX(0)" }} /><span ref={progressRef} className="absolute inset-0 origin-left bg-gold" style={{ transform: "scaleX(0)" }} /></div>
    </div>
    {/* Control bar attached to the frame (never floating over the picture or under the nav). */}
    <div data-sound="off" className="no-print gutter flex flex-wrap items-center justify-between gap-x-3 gap-y-2 border-b border-brass/20 py-3">
      <button type="button" onClick={skip} className="label min-h-11 rounded-full border border-brass/50 px-4 text-sand hover:text-gold">Skip intro</button>
      <p className="order-last w-full text-xs text-sand sm:order-none sm:w-auto sm:flex-1 sm:text-center" role="status" aria-live="polite">
        {state === "buffering" ? "Buffering film…" : state === "failed" ? "The film is unavailable. Continue to explore the academy." : state === "blocked" ? "Press play to watch the opening film." : null}
      </p>
      <div className="flex items-center gap-2">
        <button type="button" disabled={state === "failed"} onClick={() => { if (videoRef.current) videoRef.current.muted = !videoRef.current.muted; }} aria-pressed={!muted} aria-label={muted ? "Sound off. Unmute the film" : "Sound on. Mute the film"} className="label min-h-11 rounded-full border border-brass/50 px-4 text-sand hover:text-gold disabled:opacity-50">Sound {muted ? "off" : "on"}</button>
        <button type="button" disabled={state === "failed"} onClick={togglePlay} aria-label={playing ? "Pause the film" : "Play the film"} className="grid h-11 w-11 place-items-center rounded-full border border-brass/50 text-sand hover:text-gold disabled:opacity-50"><span aria-hidden>{playing ? "Ⅱ" : "▶"}</span></button>
      </div>
    </div>
  </section>;
}
