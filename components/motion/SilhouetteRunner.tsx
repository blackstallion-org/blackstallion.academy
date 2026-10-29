"use client";

import { useEffect, useState } from "react";
import styles from "./SilhouetteRunner.module.css";

/**
 * The loader's horse: a rider on a galloping horse, drawn as an ink silhouette that fills from the feet as the page loads and
 * completes when it is ready. Same two props as the pixel horse it replaces, so Loader.tsx treats them alike:
 * `settling` (the page is ready) and `onSettled` (call me when the horse has finished its last stride).
 */
export function SilhouetteRunner({ settling, onSettled }: { settling: boolean; onSettled: () => void }) {
  const [go, setGo] = useState(false);

  // The fill starts one frame after the first paint, so its rise is a transition and not a jump.
  useEffect(() => {
    const frame = requestAnimationFrame(() => setGo(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  // Once the page is ready the fill completes in 280 ms; the overlay then fades.
  useEffect(() => {
    if (!settling) return;
    const timer = setTimeout(onSettled, 320);
    return () => clearTimeout(timer);
  }, [settling, onSettled]);

  return (
    <div className={styles.runner} data-go={go || undefined} data-settling={settling || undefined} aria-hidden>
      <div className={`${styles.layer} ${styles.ghost}`} />
      <div className={`${styles.layer} ${styles.fill}`} />
    </div>
  );
}
