"use client";

import { useEffect, useRef, useState } from "react";
import { useLenis } from "lenis/react";
import { Pause, Play, Volume2, VolumeX } from "lucide-react";
import { Headline } from "@/components/film/Headline";
import { journeyFilm as film } from "@/lib/content/journey-film";
import { useReducedMotion } from "@/lib/motion/reduced";
import { saveDataMode } from "@/lib/motion/save-data";
import { cn } from "@/lib/utils";

type Playback = "idle" | "playing" | "paused" | "failed";

const RING = "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold";
/** The dark glass the controls sit on: charcoal at 55 %, a hairline of antique gold, no blur-heavy SaaS card. */
const DARK = "border border-gold/35 bg-[rgb(var(--shade-rgb)/0.55)] text-bone backdrop-blur-[3px] transition-colors duration-500 hover:border-gold hover:text-gold";

/**
 * §1b The Marwar Journey (15 Nov 2026): the owner's film, full screen, looping, in place of the real-time 3D stallion film.
 *
 * Plays muted (browsers block sound without a gesture) as soon as the loader has gone and the frame is on screen; pauses off screen
 * and in a hidden tab. A dark Play/Pause button, a Sound toggle, four chapter marks that seek, a hairline progress and "Skip the
 * film" (to the story that follows) sit on the foot of the frame, never in the top 80 px that belongs to the nav.
 * Reduced motion or Data Saver: the poster only, until the visitor presses play.
 */
export function JourneyFilm({ id = film.id, headingAs = "h2" }: { id?: string; headingAs?: "h1" | "h2" } = {}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const progressRef = useRef<HTMLSpanElement>(null);
  const userPaused = useRef(false);
  const userStarted = useRef(false);
  const inView = useRef(false);
  const [state, setState] = useState<Playback>("idle");
  const [muted, setMuted] = useState(true);
  const [chapter, setChapter] = useState(0);
  // The <video> stays transparent until its first frame plays, so the device-sized poster underneath shows meanwhile (a video with
  // metadata but no frame paints black); it then crossfades in and keeps its last frame when paused.
  const [hasFrame, setHasFrame] = useState(false);
  const reduced = useReducedMotion();
  const lenis = useLenis();

  useEffect(() => {
    const video = videoRef.current;
    const section = sectionRef.current;
    if (!video || !section) return;
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const saveData = saveDataMode();
    const holding = () => !!document.querySelector(".bsah-loader");
    const sync = () => {
      const autoplayAllowed = !preference.matches && !saveData;
      const wanted = !document.hidden && inView.current && !userPaused.current && (autoplayAllowed || userStarted.current) && !holding();
      if (wanted && video.paused) video.play().catch(() => setState((s) => (s === "failed" ? s : "paused")));
      else if (!wanted && !video.paused) video.pause();
    };
    const observer = new IntersectionObserver(([entry]) => { inView.current = entry.isIntersecting; sync(); }, { threshold: 0.35 });
    observer.observe(section);
    document.addEventListener("visibilitychange", sync);
    window.addEventListener("bsah:loader-gone", sync);
    preference.addEventListener("change", sync);
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", sync);
      window.removeEventListener("bsah:loader-gone", sync);
      preference.removeEventListener("change", sync);
      video.pause();
    };
  }, []);

  const onTime = () => {
    const video = videoRef.current;
    if (!video || !Number.isFinite(video.duration) || video.duration <= 0) return;
    if (progressRef.current) progressRef.current.style.transform = `scaleX(${video.currentTime / video.duration})`;
    let next = 0;
    film.chapters.forEach((c, i) => { if (video.currentTime >= c.at) next = i; });
    setChapter((previous) => (previous === next ? previous : next));
  };

  const play = () => {
    const video = videoRef.current;
    if (!video) return;
    userPaused.current = false;
    userStarted.current = true;
    video.play().catch(() => setState((s) => (s === "failed" ? s : "paused")));
  };
  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) play();
    else { userPaused.current = true; video.pause(); }
  };
  const toggleSound = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    // Turning the sound on is a request to watch: start it if it was waiting on its poster.
    if (!video.muted && video.paused) play();
  };
  const seekTo = (at: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = at;
    onTime();
    if (video.paused) play();
  };
  const skip = () => {
    const video = videoRef.current;
    if (video) { userPaused.current = true; video.pause(); }
    const section = sectionRef.current;
    const target = (section?.nextElementSibling as HTMLElement | null) ?? null;
    if (!target) return;
    if (lenis && !reduced) lenis.scrollTo(target, { duration: 1.4 });
    else target.scrollIntoView({ behavior: reduced ? "instant" : "smooth" });
  };

  const playing = state === "playing";
  const current = film.chapters[chapter];

  return (
    <section
      ref={sectionRef}
      id={id}
      tabIndex={-1}
      aria-labelledby="journey-film-h"
      data-playback={state}
      data-parallax-skip
      className="tone-photo relative h-[100svh] min-h-[40rem] w-full overflow-hidden bg-night outline-none md:h-[115svh]"
    >
      <picture className="absolute inset-0">
        <source media="(max-width: 767px)" srcSet={film.posterMobile} />
        {/* Above the fold on /worlds (the h1): fetched at once there; lazily under the home page's opening screens. */}
        <img src={film.poster} alt="" loading={headingAs === "h1" ? "eager" : "lazy"} fetchPriority={headingAs === "h1" ? "high" : "auto"} className="h-full w-full object-cover" />
      </picture>
      <video
        ref={videoRef}
        className={cn("absolute inset-0 h-full w-full object-cover transition-opacity duration-1000", hasFrame && state !== "failed" ? "opacity-100" : "opacity-0")}
        muted
        loop
        playsInline
        preload="metadata"
        aria-label={`${film.label}: ${film.posterAlt}`}
        onPlaying={() => { setHasFrame(true); setState("playing"); }}
        onPause={() => setState((s) => (s === "failed" ? s : "paused"))}
        // React also reports a <source> whose media query does not match as an error on the video: only a real failure counts.
        onError={(e) => { const v = e.currentTarget; if (v.error || v.networkState === HTMLMediaElement.NETWORK_NO_SOURCE) setState("failed"); }}
        onTimeUpdate={onTime}
        onVolumeChange={(event) => setMuted(event.currentTarget.muted)}
      >
        <source media="(max-width: 767px)" src={film.mobile} type="video/mp4" />
        <source src={film.desktop} type="video/mp4" />
      </video>

      {/* Gradients hold the type: a soft vignette at the top under the nav, a deep fade at the foot. */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[linear-gradient(180deg,rgb(var(--shade-rgb)/0.5),rgb(var(--shade-rgb)/0))]" />
      <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-[62%] bg-[linear-gradient(0deg,rgb(var(--shade-rgb)/0.88)_0%,rgb(var(--shade-rgb)/0.55)_38%,rgb(var(--shade-rgb)/0)_100%)]" />

      <div className="no-print gutter absolute inset-x-0 bottom-0 z-10 pb-6 pt-24 md:pb-10">
        <p className="label text-brass">
          A film · {film.label}
          <span className="ml-3 text-sand">{current.n} · {current.title}</span>
        </p>
        <Headline id="journey-film-h" as={headingAs} size="3" className="mt-2 max-w-[22ch]" inscriptionClassName="text-[0.95rem] md:text-[1.1rem]" voiceClassName="text-[clamp(1.6rem,3.2vw,2.75rem)]" inscription={film.inscription} voice={film.voice} />

        <div className="mt-6 flex flex-wrap items-center justify-between gap-x-6 gap-y-4 md:mt-8">
          <div role="group" aria-label="Film chapters">
            <ol className="flex flex-wrap items-center gap-2">
              {film.chapters.map((c, i) => (
                <li key={c.n}>
                  <button
                    type="button"
                    onClick={() => seekTo(c.at)}
                    disabled={state === "failed"}
                    aria-current={chapter === i ? "step" : undefined}
                    aria-label={`Chapter ${c.n}: ${c.title}`}
                    className={cn("label min-h-11 rounded-full px-3.5 text-[0.62rem]", DARK, RING, chapter === i && "border-gold text-gold")}
                  >
                    {c.n}<span className="hidden md:inline"> · {c.title}</span>
                  </button>
                </li>
              ))}
            </ol>
          </div>

          <div className="flex items-center gap-3">
            <button type="button" onClick={skip} className={cn("label min-h-11 px-2 text-sand underline-offset-4 hover:text-gold hover:underline", RING)}>
              Skip the film ↓
            </button>
            <button
              type="button"
              disabled={state === "failed"}
              onClick={toggleSound}
              aria-pressed={!muted}
              aria-label={`${film.label} sound`}
              className={cn("grid h-12 w-12 place-items-center rounded-full disabled:opacity-40", DARK, RING)}
            >
              {muted ? <VolumeX size={18} strokeWidth={1.4} aria-hidden /> : <Volume2 size={18} strokeWidth={1.4} aria-hidden />}
            </button>
            <button
              type="button"
              disabled={state === "failed"}
              onClick={togglePlay}
              aria-label={playing ? `Pause ${film.label}` : `Play ${film.label}`}
              className={cn("grid h-14 w-14 place-items-center rounded-full disabled:opacity-40 md:h-16 md:w-16", DARK, RING)}
            >
              {playing ? <Pause size={20} strokeWidth={1.4} aria-hidden /> : <Play size={20} strokeWidth={1.4} aria-hidden className="translate-x-[1px]" />}
            </button>
          </div>
        </div>
        {state === "failed" ? <p role="status" className="mt-4 text-sm text-sand">The film is unavailable. The story continues below.</p> : null}
      </div>

      <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-[2px] bg-[rgb(var(--shade-rgb)/0.5)]">
        <span ref={progressRef} className="absolute inset-0 origin-left bg-gold" style={{ transform: "scaleX(0)" }} />
      </div>
    </section>
  );
}
