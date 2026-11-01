"use client";

import { useEffect } from "react";
import styles from "./RunningHorse.module.css";
import { LOADER_IMAGE } from "@/lib/opening/config";

/**
 * The loader's horse. Since 2 Nov 2026 (R31) the supplied GIF's gallop silhouettes are kept but every frame is filled with the same
 * piece of site imagery (a black Marwari's coat, from the legend ear still), with a transparent ground: the old fill was cut-up
 * third-party packaging that changed on every frame. Built by docs/claude-site-brief-2026-11-02/IMPLEMENTATION_LOG.md (R31). Same two props as the pixel horse it replaces, so Loader.tsx
 * treats them alike: `settling` (the page is ready) and `onSettled` (call me when the horse is done). `zooming` is the opening on the
 * first visit to the home page: the camera goes into the horse (it keeps galloping) and the overlay dissolves into the website.
 */
export function RunningHorse({ settling, zooming = false, onSettled }: { settling: boolean; zooming?: boolean; onSettled: () => void }) {
  useEffect(() => {
    if (!settling) return;
    const timer = setTimeout(onSettled, 200);
    return () => clearTimeout(timer);
  }, [settling, onSettled]);
  // eslint-disable-next-line @next/next/no-img-element -- an animated WebP, which next/image would flatten
  return <img className={styles.horse} src={LOADER_IMAGE} alt="" width={500} height={333} draggable={false} data-zooming={zooming || undefined} />;
}
