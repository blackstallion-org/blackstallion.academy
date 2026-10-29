"use client";

import { useEffect } from "react";
import styles from "./RunningHorse.module.css";

/**
 * The loader's horse: the supplied running-rider GIF, placed as it is. Same two props as the pixel horse it replaces, so Loader.tsx
 * treats them alike: `settling` (the page is ready) and `onSettled` (call me when the horse is done).
 */
export function RunningHorse({ settling, onSettled }: { settling: boolean; onSettled: () => void }) {
  useEffect(() => {
    if (!settling) return;
    const timer = setTimeout(onSettled, 200);
    return () => clearTimeout(timer);
  }, [settling, onSettled]);
  // eslint-disable-next-line @next/next/no-img-element -- an animated GIF, which next/image would flatten
  return <img className={styles.horse} src="/opening/loader.gif" alt="" width={500} height={333} draggable={false} />;
}
