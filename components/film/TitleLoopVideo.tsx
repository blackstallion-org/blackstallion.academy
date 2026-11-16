"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { saveDataMode } from "@/lib/motion/save-data";
import { useReducedMotion } from "@/lib/motion/reduced";
import { cn } from "@/lib/utils";

const noSubscribe = () => () => {};

/**
 * A silent looping film behind a title card (pass paths already wrapped in asset()). It plays only while on screen and never under reduced motion or Data Saver; in those
 * cases (and until the first frame plays) the poster still is what shows, so the section is never empty. Place it as the first,
 * absolutely positioned layer of the section and add the gradient that holds the text yourself.
 */
export function TitleLoopVideo({ src, phoneSrc, poster, className }: { src: string; phoneSrc?: string; poster: string; className?: string }) {
  const reduced = useReducedMotion();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  // the lighter phone file, when given, is chosen on the client (below 768 px); the server renders the poster only
  const phone = useSyncExternalStore(noSubscribe, () => window.matchMedia("(max-width: 767px)").matches, () => null);
  const file = !phoneSrc ? src : phone === null ? null : phone ? phoneSrc : src;
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !file || reduced || saveDataMode()) return;
    const sync = (visible: boolean) => { if (visible && !document.hidden) video.play().catch(() => {}); else video.pause(); };
    let visible = true;
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; sync(visible); }, { threshold: 0.05 });
    observer.observe(video);
    const onVisibility = () => sync(visible);
    document.addEventListener("visibilitychange", onVisibility);
    return () => { observer.disconnect(); document.removeEventListener("visibilitychange", onVisibility); video.pause(); };
  }, [reduced, file]);
  return (
    <div aria-hidden className={cn("absolute inset-0 overflow-hidden", className)}>
      {/* eslint-disable-next-line @next/next/no-img-element -- the poster is a decorative still under the film */}
      <img src={poster} alt="" className="absolute inset-0 h-full w-full object-cover" />
      {reduced || !file ? null : (
        <video ref={videoRef} src={file} poster={poster} muted loop playsInline preload="auto" tabIndex={-1} onPlaying={() => setPlaying(true)}
          className={cn("absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ease-out", playing ? "opacity-100" : "opacity-0")} />
      )}
    </div>
  );
}
