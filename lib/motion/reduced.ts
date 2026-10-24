"use client";

import { useSyncExternalStore } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";
const subscribe = (cb: () => void) => {
  const mq = window.matchMedia(QUERY);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
};

/**
 * Hydration-safe reduced-motion flag: the server and the first client render agree (false),
 * then React re-renders with the real preference. Replaces motion's useReducedMotion, which
 * reads the media query during the first client render and caused hydration mismatches (#418).
 */
export function useReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, () => window.matchMedia(QUERY).matches, () => false);
}
