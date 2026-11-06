"use client";

import { useEffect, useSyncExternalStore } from "react";
import { setEffectsAllowed, soundEnabled, subscribeSound } from "@/lib/audio/engine";
import { getMusicState, pauseAmbience, resumeAmbience, setMusicSource, subscribeMusic, type MusicState } from "@/lib/audio/mixer";
import { applySoundMode, getSoundMode, subscribeSoundMode, type SoundMode } from "@/lib/audio/mode";
import { asset } from "@/lib/content/asset";
import styles from "./four-worlds-scroll.module.css";

/** The film's own track (public/audio/music/four-worlds.mp3): it takes the site's music bus while /worlds is open. */
const TRACK = asset("/audio/music/four-worlds.mp3");

/**
 * The film's sound control, in the bottom bar. It is the site's own sound switch (the same state as the Sound button in the
 * navigation): turning it on picks the "music" mode, so the film's track plays and nothing else makes a sound. Nothing plays
 * until the visitor presses it (browsers require a gesture). Leaving the page puts the open-range recording back.
 */
export function WorldsScrollSoundButton() {
  const on = useSyncExternalStore(subscribeSound, soundEnabled, () => false);
  const mode = useSyncExternalStore<SoundMode>(subscribeSoundMode, getSoundMode, () => "none");
  const music = useSyncExternalStore<MusicState>(subscribeMusic, getMusicState, () => "waiting");

  useEffect(() => {
    setMusicSource(TRACK);
    // no horse sounds on this page (the idle neighs and snorts, the location ambience); the film has its music and its text sound
    setEffectsAllowed(false);
    pauseAmbience();
    return () => { setMusicSource(null); setEffectsAllowed(getSoundMode() !== "music"); resumeAmbience(); };
  }, []);

  const wanted = on && (mode === "theme" || mode === "music");
  const playing = wanted && music === "playing";
  return (
    <button
      type="button"
      data-sound="off"
      className={styles.ctrl}
      aria-pressed={wanted}
      aria-label={wanted ? "Turn the film's music off" : "Turn the film's music on"}
      onClick={() => applySoundMode(wanted ? "none" : "music")}
    >
      <span>Sound</span>
      <span className={styles.ctrlState}>{wanted ? "On" : "Off"}</span>
      <span aria-hidden className={styles.eq} data-on={playing || undefined}>
        <i /><i /><i />
      </span>
    </button>
  );
}
