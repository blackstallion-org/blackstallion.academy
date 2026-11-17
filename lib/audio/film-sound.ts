"use client";

import { useEffect, useSyncExternalStore, type RefObject } from "react";
import { soundEnabled, subscribeSound } from "./engine";

/**
 * Owner, 17 Nov 2026: the opening films follow the site's sound switch. Sound on → the film plays with its sound;
 * sound off → muted. The film's own Sound button still overrides it until the switch changes again.
 *
 * Browsers refuse to unmute a video before the visitor has interacted with the page (Chrome pauses it instead), so on a
 * first visit the film starts muted and its sound comes in at the first click, tap or key press. The music already
 * ducks under any unmuted playing film (lib/audio/mixer.ts), so the two never clash.
 */
export function useFilmSound(ref: RefObject<HTMLVideoElement | null>): void {
  const on = useSyncExternalStore(subscribeSound, soundEnabled, () => false);
  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    if (!on) { video.muted = true; return; }
    const unmute = () => {
      const v = ref.current;
      if (!v || !v.muted) return;
      const wasPlaying = !v.paused;
      v.volume = 1;
      v.muted = false;
      // some browsers still pause an unmuted video; resume it, or fall back to muted rather than stop the film
      if (wasPlaying && v.paused) v.play().catch(() => { v.muted = true; void v.play().catch(() => {}); });
    };
    const activated = typeof navigator !== "undefined" && (navigator as Navigator & { userActivation?: { hasBeenActive: boolean } }).userActivation?.hasBeenActive;
    if (activated) { unmute(); return; }
    const events = ["pointerdown", "keydown", "touchend"] as const;
    const once = (event: Event) => {
      events.forEach((e) => window.removeEventListener(e, once, true));
      // a first press on the film's own Sound button is left to that button, which would otherwise undo the unmute
      if ((event.target as Element | null)?.closest?.("[data-film-sound]")) return;
      unmute();
    };
    events.forEach((e) => window.addEventListener(e, once, true));
    return () => events.forEach((e) => window.removeEventListener(e, once, true));
  }, [on, ref]);
}
