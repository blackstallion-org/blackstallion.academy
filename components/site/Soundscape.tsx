"use client";

import { useEffect } from "react";
import { disposeSoundscape, isSoundEffect, playEffect, resumeSoundOnGesture, stopEffects, type SoundEffect } from "@/lib/audio/engine";

const JOURNEYS: Record<string, SoundEffect> = {
  "/legend": "chariot",
  "/cadets": "gallop",
  "/fleet": "herd",
  "/tournaments": "chase",
};

/** One delegated listener covers pointer and keyboard-activated controls on all routes. */
export function Soundscape() {
  useEffect(() => {
    const removeGesture = resumeSoundOnGesture();
    const click = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const control = target.closest<HTMLElement>("[data-sound], a[href], button, [role='button'], [role='tab'], [role='radio'], summary");
      if (!control || control.closest("[data-sound='off'], [data-sound-toggle]") || control.matches(":disabled, [aria-disabled='true']")) return;
      const explicit = control.closest<HTMLElement>("[data-sound]")?.dataset.sound;
      if (explicit && isSoundEffect(explicit)) { playEffect(explicit); return; }
      // Sound never validates or acknowledges a form submission.
      if (control.closest("form")) return;
      if (control instanceof HTMLAnchorElement) {
        if (control.origin !== location.origin || control.target === "_blank" || control.hasAttribute("download")) return;
        const effect = control.pathname !== location.pathname ? JOURNEYS[control.pathname] : undefined;
        playEffect(effect ?? "leather");
      } else {
        playEffect("tack");
      }
    };
    const quiet = () => { if (document.hidden) stopEffects(); };
    document.addEventListener("click", click);
    document.addEventListener("visibilitychange", quiet);
    window.addEventListener("pagehide", stopEffects);
    return () => {
      removeGesture();
      document.removeEventListener("click", click);
      document.removeEventListener("visibilitychange", quiet);
      window.removeEventListener("pagehide", stopEffects);
      disposeSoundscape();
    };
  }, []);
  return null;
}
