"use client";

import { useSyncExternalStore } from "react";
import { setSound, soundEnabled, subscribeSound } from "@/lib/audio/engine";

/** Top-right nav toggle. Defaults to ON; can be switched off by the visitor at any time. */
export function SoundToggle() {
  const on = useSyncExternalStore(subscribeSound, soundEnabled, () => true);
  return (
    <button
      type="button"
      data-sound-toggle
      onClick={() => setSound(!on)}
      aria-pressed={on}
      aria-label={`Sound ${on ? "on" : "off"}. Toggle website sound effects.`}
      className="label flex items-center gap-2 px-2 py-2.5 text-sand hover:text-gold"
    >
      <span className="hidden sm:inline">Sound</span>
      <span className="font-mono tracking-[0.1em] text-gold">{on ? "ON" : "OFF"}</span>
    </button>
  );
}
