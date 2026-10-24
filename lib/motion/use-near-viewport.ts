"use client";

import { useEffect, useState, type RefObject } from "react";
import { NEAR_VIEWPORT, whenNearViewport } from "./near-viewport";

/**
 * `true` from the first moment `ref` comes within `margin` of the viewport (and for good after that).
 * Used to mount heavy client-only layers (WebGL canvases and their libraries) only when they are about to be seen;
 * callers keep a same-size frame in the layout until then, so nothing shifts.
 */
export function useNearViewport(ref: RefObject<Element | null>, margin: string = NEAR_VIEWPORT): boolean {
  const [near, setNear] = useState(false);
  useEffect(() => {
    const element = ref.current;
    if (!element || near) return;
    return whenNearViewport(element, () => setNear(true), margin);
  }, [ref, margin, near]);
  return near;
}

/**
 * Live "is any part on screen" flag, for pausing render loops (R3F `frameloop`, rAF) while offscreen.
 * Starts `false`; without IntersectionObserver it reports `true`.
 */
export function useOnScreen(ref: RefObject<Element | null>, margin = "0px"): boolean {
  const [onScreen, setOnScreen] = useState(false);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    if (typeof IntersectionObserver === "undefined") {
      const frame = requestAnimationFrame(() => setOnScreen(true));
      return () => cancelAnimationFrame(frame);
    }
    const observer = new IntersectionObserver(([entry]) => setOnScreen(entry.isIntersecting), { rootMargin: margin });
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref, margin]);
  return onScreen;
}
