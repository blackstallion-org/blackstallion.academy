"use client";

import { useEffect, useSyncExternalStore } from "react";
import { setEffectsAllowed, setSound, soundEnabled, subscribeSound } from "@/lib/audio/engine";
import { getMusicState, pauseAmbience, resumeAmbience, setMusicSource, startMusic, subscribeMusic, type MusicState } from "@/lib/audio/mixer";
import { getSoundMode } from "@/lib/audio/mode";
import { asset } from "@/lib/content/asset";
import { sfx } from "./core/sfx";
import styles from "./four-worlds.module.css";

/** The film's own track (public/audio/music/four-worlds.mp3): it takes the site's music bus while the film plays. */
const TRACK = asset("/audio/music/four-worlds.mp3");

/**
 * The film's music. It starts by itself (when the site's sound is on); browsers only allow audio after a first click, key or touch,
 * so if it is held back the site's own gesture listener starts it on that first touch. There is no switch here, only a small
 * animation that moves while the music plays. Leaving the film puts the open-range recording back.
 *
 * While the film is up the site's horse sounds (the idle neighs and snorts, the greeting snort) and its location ambience are held
 * back: the film has its own music and its own text sounds (core/sfx.ts). When the site's sound is off nothing is shown here (the
 * switch is in the site's header; on /worlds the film page has its own).
 */
export function WorldsMusic() {
  const music = useSyncExternalStore<MusicState>(subscribeMusic, getMusicState, () => "waiting");
  // The site's sound switch (header) is not on this page, so its state is read here: when it is off the film offers its own switch.
  const on = useSyncExternalStore(subscribeSound, soundEnabled, () => true);

  // no horse sounds over the film: effects off, location ambience paused; both come back when the film leaves
  useEffect(() => {
    setEffectsAllowed(false);
    pauseAmbience();
    return () => { setEffectsAllowed(getSoundMode() !== "music"); resumeAmbience(); };
  }, []);

  useEffect(() => {
    setMusicSource(TRACK);
    if (!on) {
      // Sound is off (the visitor's earlier choice, or reduced motion): the first tap, key or click on the film turns it on. That is a real
      // gesture, so the browser allows the audio, and nothing plays until it happens.
      const wake = (event: Event) => {
        if (event instanceof KeyboardEvent && (event.metaKey || event.ctrlKey)) return;
        setSound(true);
      };
      const wakeEvents = ["pointerdown", "click", "keydown", "touchend"] as const;
      wakeEvents.forEach((e) => window.addEventListener(e, wake, true));
      return () => { wakeEvents.forEach((e) => window.removeEventListener(e, wake, true)); sfx.stop(); setMusicSource(null); };
    }
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
  }, [on]);

  const playing = music === "playing";
  // Until the music is actually playing (sound off, or the browser waiting for a first tap) the film says how to get sound.
  const needsTap = !on || !playing;
  return (
    <span className={styles.music} role="img" aria-label={playing ? "Music playing" : needsTap ? "Tap for sound" : "Music"} data-on={playing || undefined}>
      <i /><i /><i /><i />
      {needsTap && <b className={styles.musicHint}>Tap for sound</b>}
    </span>
  );
}
