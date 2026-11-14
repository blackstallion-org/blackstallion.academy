"use client";

import { useEffect } from "react";
import { backgroundHorsePlaying, disposeSoundscape, effectPlaying, IDLE_CALLS, isSoundEffect, playBackgroundHorse, playEffect, resumeSoundOnGesture, soundEnabled, stopEffects, type SoundEffect } from "@/lib/audio/engine";
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
/** The background horse sound (owner, 14 Nov 2026): one of the two long snorting recordings every 60 seconds, alternating. */
const BACKGROUND_HORSE_EVERY_MS = 60000;

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
        if (getMusicState() === "playing" && !ambienceActive() && !effectPlaying() && !backgroundHorsePlaying() && !document.hidden) {
          const choices = IDLE_CALLS.filter((c) => c !== last);
          const pick = choices[Math.floor(Math.random() * choices.length)];
          if (playEffect(pick, 0.08)) last = pick;
        }
        schedule();
      }, IDLE_MIN_MS + Math.random() * IDLE_SPREAD_MS);
    };
    schedule();

    // Background horse sound: a fixed 60-second beat. A beat that finds sound off, the tab hidden, a film playing or the music-only
    // mode simply passes; the next one tries again.
    // A beat that lands on a click sound or an idle call waits for it (up to 8 s) instead of losing the minute.
    let backgroundCount = 0;
    let retry: ReturnType<typeof setTimeout> | undefined;
    const attempt = (left: number) => {
      if (playBackgroundHorse(backgroundCount)) { backgroundCount++; return; }
      if (left > 0 && effectPlaying()) retry = setTimeout(() => attempt(left - 1), 1000);
    };
    const background = setInterval(() => attempt(8), BACKGROUND_HORSE_EVERY_MS);

    document.addEventListener("click", click);
    document.addEventListener("visibilitychange", visibility);
    window.addEventListener("pagehide", pagehide);
    return () => {
      clearTimeout(idle);
      clearInterval(background);
      clearTimeout(retry);
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
