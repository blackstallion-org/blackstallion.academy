"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play, Volume2, VolumeX } from "lucide-react";
import { Headline } from "@/components/film/Headline";
import { Label } from "@/components/film/Marks";
import { introFilm as film } from "@/lib/content/intro-film";
import { saveDataMode } from "@/lib/motion/save-data";

type Playback = "idle" | "playing" | "paused" | "failed";

const RING = "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold";
const BUTTON = `inline-flex h-12 w-12 items-center justify-center rounded-full border border-brass/50 bg-ember text-bone transition-colors duration-500 hover:border-gold hover:text-gold ${RING}`;

/**
 * The Lineage on the About reel (17 Nov 2026, owner): the same 60 s film that opens the website, in a quiet frame between the title card
 * and the Mandate letter. The controls sit under the picture, never over it. It plays muted while it is on screen (sound is the visitor's
 * choice), pauses off screen and in a hidden tab, and under reduced motion or Data Saver it shows its poster until the visitor presses play.
 */
export function LineageFilm() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const progressRef = useRef<HTMLSpanElement>(null);
  const userPaused = useRef(false);
  const userStarted = useRef(false);
  const inView = useRef(false);
  const [state, setState] = useState<Playback>("idle");
  const [muted, setMuted] = useState(true);

  useEffect(() => {
    const video = videoRef.current;
    const section = sectionRef.current;
    if (!video || !section) return;
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const saveData = saveDataMode();
    const sync = () => {
      const autoplayAllowed = !preference.matches && !saveData;
      const wanted = !document.hidden && inView.current && !userPaused.current && (autoplayAllowed || userStarted.current);
      if (wanted && video.paused) video.play().catch(() => setState((s) => (s === "failed" ? s : "paused")));
      else if (!wanted && !video.paused) video.pause();
    };
    const observer = new IntersectionObserver(([entry]) => { inView.current = entry.isIntersecting && entry.intersectionRatio >= 0.35; sync(); }, { threshold: [0, 0.35, 0.6] });
    observer.observe(section);
    document.addEventListener("visibilitychange", sync);
    preference.addEventListener("change", sync);
    return () => { observer.disconnect(); document.removeEventListener("visibilitychange", sync); preference.removeEventListener("change", sync); video.pause(); };
  }, []);

  const toggle = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) { userPaused.current = false; userStarted.current = true; video.play().catch(() => setState("failed")); }
    else { userPaused.current = true; video.pause(); }
  };
  const toggleSound = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    video.volume = 1;
    setMuted(video.muted);
    if (!video.muted && video.paused) toggle();
  };

  return (
    <section ref={sectionRef} aria-labelledby="lineage-h" className="tone-light bg-parch py-[clamp(5rem,12vh,9rem)]">
      <div className="gutter mx-auto max-w-[78rem]">
        <div className="max-w-2xl">
          <Label>The lineage · 60 seconds</Label>
          <Headline id="lineage-h" className="mt-4" size="2" inscription="Eight hundred years," voice="in one minute." />
          <p className="t-story mt-5 text-sand">
            From the sands of Marwar, through Mughal India and the Silk Roads, to the Black Stallion Academy. The film that opens this website, here in full.
          </p>
        </div>

        <figure className="mt-10">
          <div className="relative aspect-video w-full overflow-hidden bg-parch ring-1 ring-brass/30">
            <video
              ref={videoRef}
              className="absolute inset-0 h-full w-full object-cover"
              muted
              loop
              playsInline
              preload="metadata"
              poster={film.poster}
              aria-label={film.description}
              onPlaying={() => setState("playing")}
              onPause={() => setState((s) => (s === "failed" ? s : "paused"))}
              onError={(e) => { const v = e.currentTarget; if (v.error || v.networkState === HTMLMediaElement.NETWORK_NO_SOURCE) setState("failed"); }}
              onTimeUpdate={(e) => {
                const v = e.currentTarget;
                if (progressRef.current && v.duration > 0) progressRef.current.style.transform = `scaleX(${v.currentTime / v.duration})`;
              }}
            >
              <source media="(max-width: 767px)" src={film.mobile} type="video/mp4" />
              <source src={film.desktop} type="video/mp4" />
            </video>
          </div>
          <figcaption className="mt-4 flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
            <span className="font-mono text-[0.68rem] uppercase tracking-[0.14em] text-dust">
              {state === "failed" ? "The film could not load. Please try again." : film.note}
            </span>
            <span className="flex items-center gap-3">
              <button type="button" className={BUTTON} onClick={toggleSound} aria-pressed={!muted} aria-label="Film sound">
                {muted ? <VolumeX size={18} strokeWidth={1.4} aria-hidden /> : <Volume2 size={18} strokeWidth={1.4} aria-hidden />}
              </button>
              <button type="button" className={BUTTON} onClick={toggle} aria-label={state === "playing" ? "Pause the film" : "Play the film"}>
                {state === "playing" ? <Pause size={18} strokeWidth={1.4} aria-hidden /> : <Play size={18} strokeWidth={1.4} aria-hidden />}
              </button>
            </span>
          </figcaption>
          <span className="relative mt-3 block h-[2px] w-full bg-brass/20" aria-hidden>
            <span ref={progressRef} className="absolute inset-0 origin-left scale-x-0 bg-gold" />
          </span>
        </figure>
      </div>
    </section>
  );
}
