"use client";

import { useSyncExternalStore } from "react";
import { HERO_MODEL, HERO_MODEL_MOBILE } from "@/components/3d/marwari-paths";

/** Where the camera dolly lands: the digital Sovereign Passport. */
export const PASSPORT_HREF = "/cadets#passport";
/** The rigged hero stallion; NEXT_PUBLIC_STALLION_MODEL overrides it (e.g. a commissioned sculpt). */
export const MODEL_URL = process.env.NEXT_PUBLIC_STALLION_MODEL || HERO_MODEL;
/** Phones and narrow screens get the 1024 px texture profile (about 40 % smaller, less GPU memory). */
export function heroModelUrl(): string {
  if (process.env.NEXT_PUBLIC_STALLION_MODEL) return MODEL_URL;
  const small = window.matchMedia("(max-width: 820px), (pointer: coarse)").matches;
  const saver = (navigator as unknown as { connection?: { saveData?: boolean } }).connection?.saveData;
  return small || saver ? HERO_MODEL_MOBILE : HERO_MODEL;
}

/**
 * Starts the model download as soon as the hero knows it will show the stallion, instead of after the stage's chunk has
 * loaded and mounted (about nine seconds later on Slow 4G). A `preload` of the exact URL the loader will ask for is
 * reused by that request; the Draco decoder files go with it. Safe to call more than once.
 */
export function preloadHeroAssets() {
  if (typeof document === "undefined") return;
  for (const href of [heroModelUrl(), "/draco/draco_wasm_wrapper.js", "/draco/draco_decoder.wasm"]) {
    if (document.head.querySelector(`link[rel="preload"][href="${href}"]`)) continue;
    const link = document.createElement("link");
    link.rel = "preload";
    link.as = "fetch";
    link.crossOrigin = "anonymous";
    link.href = href;
    document.head.appendChild(link);
  }
}

const MODEL_CONFIGURED = Boolean(process.env.NEXT_PUBLIC_STALLION_MODEL);
const noSubscribe = () => () => {};
/**
 * The 3D centrepiece is on when NEXT_PUBLIC_STALLION_MODEL is set. Until the owner approves it for everyone,
 * the hero keeps its film and `?stallion=preview` shows the stallion for review.
 */
export function useStallionEnabled() {
  return useSyncExternalStore(
    noSubscribe,
    () => MODEL_CONFIGURED || new URLSearchParams(window.location.search).get("stallion") === "preview",
    () => MODEL_CONFIGURED,
  );
}
