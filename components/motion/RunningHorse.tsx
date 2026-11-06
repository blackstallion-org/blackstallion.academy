"use client";

import { useEffect, useState } from "react";
import styles from "./RunningHorse.module.css";
import { LOADER_IMAGE, LOADER_STORY, LOADER_STORY_STEP } from "@/lib/opening/config";

/**
 * The loader's horse. The supplied gallop silhouette (an animated WebP with a transparent ground) is now the horse's MASK, not its
 * picture: the same gallop plays unchanged, and inside it a short story of Marwari miniature paintings changes every 0.3 s
 * (lib/opening/config.ts, LOADER_STORY). It is all CSS (opacity and transform only), so the sequence never re-renders React,
 * and it loops without a seam: the first painting is the permanent base, the others fade in over it, and a top copy of the first
 * fades in last so the restart is invisible. Reduced motion shows the first painting still. Same props as before: `settling` (the
 * page is ready) and `onSettled`; 
 */
const FADE = 0.12; // seconds of each crossfade inside the 0.3 s step

function storyCss(count: number) {
  const cycle = count * LOADER_STORY_STEP;
  const pct = (seconds: number) => +((seconds / cycle) * 100).toFixed(3);
  let css = "";
  for (let i = 1; i < count; i++) {
    css += `@keyframes bsahStory${i}{0%,${pct(i * LOADER_STORY_STEP)}%{opacity:0}${pct(i * LOADER_STORY_STEP + FADE)}%,100%{opacity:1}}`;
  }
  css += `@keyframes bsahStoryClose{0%,${pct(cycle - FADE)}%{opacity:0}100%{opacity:1}}`;
  return css;
}

export function RunningHorse({ settling, onSettled }: { settling: boolean; onSettled: () => void }) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (!settling) return;
    const timer = setTimeout(onSettled, 200);
    return () => clearTimeout(timer);
  }, [settling, onSettled]);
  // Show the horse only once its silhouette has arrived: a mask that has not loaded would otherwise show bare rectangles.
  useEffect(() => {
    const probe = new Image();
    probe.onload = probe.onerror = () => setReady(true);
    probe.src = LOADER_IMAGE;
    return () => { probe.onload = probe.onerror = null; };
  }, []);

  const count = LOADER_STORY.length;
  const cycle = count * LOADER_STORY_STEP;
  const mask = `url(${LOADER_IMAGE})`;
  const layer = (src: string, key: string, i: number, animation?: string) => (
    // eslint-disable-next-line @next/next/no-img-element -- painted stills inside a CSS mask; next/image's wrapper adds nothing here
    <img key={key} className={styles.layer} src={src} alt="" draggable={false} decoding="async" fetchPriority={i === 0 ? "high" : "low"}
      style={{ ["--dir" as string]: i % 2 ? -1 : 1, animation }} />
  );
  return (
    <div className={styles.horse} data-ready={ready || undefined} style={{ WebkitMaskImage: mask, maskImage: mask }}>
      <style>{storyCss(count)}</style>
      <div className={styles.stack} style={{ animationDuration: `${cycle}s` }}>
        {LOADER_STORY.map((src, i) => layer(src, src, i, i === 0 ? undefined : `bsahStory${i} ${cycle}s linear infinite`))}
        {count > 1 && layer(LOADER_STORY[0], "close", 0, `bsahStoryClose ${cycle}s linear infinite`)}
      </div>
    </div>
  );
}
