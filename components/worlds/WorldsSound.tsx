"use client";

import { useEffect, useSyncExternalStore } from "react";
import { soundEnabled } from "@/lib/audio/engine";
import { getMusicState, setMusicSource, startMusic, subscribeMusic, type MusicState } from "@/lib/audio/mixer";
import { asset } from "@/lib/content/asset";
import { sfx } from "./core/sfx";
import styles from "./four-worlds.module.css";

/** The film's own track (public/audio/music/four-worlds.mp3): it takes the site's music bus while the film plays. */
const TRACK = asset("/audio/music/four-worlds.mp3");

/**
 * The film's music. It starts by itself (when the site's sound is on); browsers only allow audio after a first click, key or touch,
 * so if it is held back the site's own gesture listener starts it on that first touch. There is no switch here, only a small
 * animation that moves while the music plays. Leaving the film puts the open-range recording back.
 */
export function WorldsMusic() {
  const music = useSyncExternalStore<MusicState>(subscribeMusic, getMusicState, () => "waiting");

  useEffect(() => {
    setMusicSource(TRACK);
    if (soundEnabled()) void startMusic();
    return () => { sfx.stop(); setMusicSource(null); };
  }, []);

  const playing = music === "playing";
  return (
    <span className={styles.music} role="img" aria-label={playing ? "Music playing" : "Music"} data-on={playing || undefined}>
      <i /><i /><i /><i />
    </span>
  );
}
