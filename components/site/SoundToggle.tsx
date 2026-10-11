"use client";

import { useEffect, useSyncExternalStore } from "react";
import { resumeAmbientOnGesture, setSound, soundEnabled, subscribeSound } from "@/lib/audio/engine";

/** Top-right nav toggle. Defaults to OFF; never plays anything until the visitor turns it on. */
export function SoundToggle() {
  const on = useSyncExternalStore(subscribeSound, soundEnabled, () => false);
  useEffect(() => {
    resumeAmbientOnGesture();
  }, []);
  return (
    <button
      type="button"
      onClick={() => setSound(!on)}
      aria-pressed={on}
      aria-label={`Sound ${on ? "on" : "off"}. Toggle ambient sound.`}
      className="label flex items-center gap-2 px-2 py-2.5 text-sand hover:text-gold"
    >
      <span className="hidden sm:inline">Sound</span>
      <span className="font-mono tracking-[0.1em] text-gold">{on ? "ON" : "OFF"}</span>
    </button>
  );
}
