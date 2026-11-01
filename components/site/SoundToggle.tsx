"use client";

import { useSyncExternalStore } from "react";
import { setSound, soundEnabled, subscribeSound } from "@/lib/audio/engine";
import { getMusicState, MUSIC, resumeAmbience, startMusic, subscribeMusic, type MusicState } from "@/lib/audio/mixer";

/**
 * Top-right nav control, truthful about what is sounding:
 *   OFF                 nothing plays;
 *   ON + hollow ring    sound is on but the browser is still waiting for a first click or key press (pressing this starts it);
 *   ON + moving bars    the music is audible now (pressing this turns all sound off).
 */
export function SoundToggle() {
  const on = useSyncExternalStore(subscribeSound, soundEnabled, () => true);
  const music = useSyncExternalStore<MusicState>(subscribeMusic, getMusicState, () => "waiting");
  const playing = on && music === "playing";
  const waiting = on && !playing;

  const press = () => {
    if (waiting) { void startMusic().then(() => resumeAmbience()); return; }
    setSound(!on);
  };
  const label = !on
    ? "Sound off. Turn sound and music on."
    : playing
      ? `Sound on: music playing (“${MUSIC.title}” by ${MUSIC.author}, ${MUSIC.licence}). Turn all sound off.`
      : "Sound on, waiting to start. Press to start the music.";

  return (
    <button
      type="button"
      data-sound-toggle
      data-state={!on ? "off" : playing ? "playing" : "waiting"}
      onClick={press}
      aria-pressed={on}
      aria-label={label}
      title={label}
      className="label flex min-h-11 items-center gap-2 px-2 py-2.5 text-sand hover:text-gold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
    >
      <span className="hidden sm:inline">Sound</span>
      <span className="font-mono tracking-[0.1em] text-gold">{on ? "ON" : "OFF"}</span>
      <span aria-hidden className="relative flex h-3 w-3.5 items-end justify-between">
        {playing ? (
          [0, 1, 2].map((i) => (
            <span key={i} className="sound-bar block w-[2px] rounded-full bg-gold" style={{ animationDelay: `${i * 0.18}s` }} />
          ))
        ) : waiting ? (
          <span className="absolute inset-0 m-auto block h-2 w-2 rounded-full border border-gold" />
        ) : (
          <span className="absolute inset-x-0 top-1/2 block h-px bg-current opacity-60" />
        )}
      </span>
    </button>
  );
}
