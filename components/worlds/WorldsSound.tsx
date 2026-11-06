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
    if (!soundEnabled()) return () => { sfx.stop(); setMusicSource(null); };
    void startMusic();
    // browsers only start audio on a real activation: take the first click, key, tap or release and start the music then
    const events = ["pointerdown", "pointerup", "click", "keydown", "touchend"] as const;
    const off = () => events.forEach((e) => window.removeEventListener(e, go, true));
    function go(event: Event) {
      if (event instanceof KeyboardEvent && (event.metaKey || event.ctrlKey)) return;
      void startMusic().then((ok) => { if (ok) off(); });
    }
    events.forEach((e) => window.addEventListener(e, go, true));
    return () => { off(); sfx.stop(); setMusicSource(null); };
  }, []);

  const playing = music === "playing";
  return (
    <span className={styles.music} role="img" aria-label={playing ? "Music playing" : "Music"} data-on={playing || undefined}>
      <i /><i /><i /><i />
      {music === "blocked" && <b className={styles.musicHint}>Tap for sound</b>}
    </span>
  );
}
