"use client";

import { useEffect } from "react";
import { disposeSoundscape, effectPlaying, IDLE_CALLS, isSoundEffect, playEffect, resumeSoundOnGesture, soundEnabled, stopEffects, type SoundEffect } from "@/lib/audio/engine";
import { ambienceActive, disposeMixer, getMusicState, musicWanted, pauseAmbience, resumeAmbience, startMusic, stopMusic } from "@/lib/audio/mixer";

/** A horse sound when a link opens another reel (from the seven-sound palette). */
const JOURNEYS: Record<string, SoundEffect> = {
  "/legend": "gallop",
  "/cadets": "walk",
  "/fleet": "horseCall",
  "/tournaments": "gallop",
};

/** The idle call: roughly every 15 s while the music plays, jittered so it never ticks like a clock. */
const IDLE_MIN_MS = 15000;
const IDLE_SPREAD_MS = 9000;

/**
 * Lives in the root layout, so it (and the music it starts) survives every client-side navigation.
 * One delegated listener covers pointer and keyboard-activated controls on all routes.
 */
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

    // Hidden tab: everything fades out; coming back resumes the music (the page already has the visitor's activation).
    let resumeOnShow = false;
    const visibility = () => {
      if (document.hidden) {
        stopEffects();
        resumeOnShow = getMusicState() === "playing";
        if (resumeOnShow) stopMusic(true);
        pauseAmbience();
      } else if (soundEnabled() && musicWanted()) {
        if (resumeOnShow) void startMusic();
        resumeAmbience();
      }
    };
    const pagehide = () => { stopEffects(); stopMusic(true); };

    // Idle calls: only while the music is actually playing, never over a location bed, an effect or a film.
    let idle: ReturnType<typeof setTimeout> | undefined;
    let last: SoundEffect | null = null;
    const schedule = () => {
      idle = setTimeout(() => {
        if (getMusicState() === "playing" && !ambienceActive() && !effectPlaying() && !document.hidden) {
          const choices = IDLE_CALLS.filter((c) => c !== last);
          const pick = choices[Math.floor(Math.random() * choices.length)];
          if (playEffect(pick, 0.08)) last = pick;
        }
        schedule();
      }, IDLE_MIN_MS + Math.random() * IDLE_SPREAD_MS);
    };
    schedule();

    document.addEventListener("click", click);
    document.addEventListener("visibilitychange", visibility);
    window.addEventListener("pagehide", pagehide);
    return () => {
      clearTimeout(idle);
      removeGesture();
      document.removeEventListener("click", click);
      document.removeEventListener("visibilitychange", visibility);
      window.removeEventListener("pagehide", pagehide);
      disposeSoundscape();
      disposeMixer();
    };
  }, []);
  return null;
}
