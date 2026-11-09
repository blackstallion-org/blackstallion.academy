"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type ComponentType } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Music2, VolumeX } from "lucide-react";
import { soundEnabled, subscribeSound } from "@/lib/audio/engine";
import { getMusicState, type MusicState, subscribeMusic } from "@/lib/audio/mixer";
import { applySoundMode, getSoundMode, subscribeSoundMode, type SoundMode } from "@/lib/audio/mode";

/** Three choices (owner, 9 Nov 2026): everything, the horse sounds without the song, or silence. */
const OPTIONS: { mode: SoundMode; label: string; note: string; icon: ComponentType<{ size?: number | string; className?: string }> }[] = [
  { mode: "theme", label: "All sound", note: "Theme song + horse sounds", icon: Music2 },
  { mode: "horse", label: "Horse sounds", note: "No song", icon: HorseIcon },
  { mode: "none", label: "Mute", note: "Silence", icon: VolumeX },
];

function HorseIcon({ size = 20, className }: { size?: number | string; className?: string }) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="m5 13 3-4 2-1 1-4 2 3 2-2 1 4 3 3 2 6-4 2-3-2-3-1-3 2-3-1-2-2 2-3Z" />
      <path d="m8 9-2 1-2 3M13 12h.01M16 9l2 4" />
    </svg>
  );
}

/**
 * Top-right sound menu. Nothing plays until the visitor picks an option, and the choice is shown on the button.
 */
export function SoundToggle() {
  const on = useSyncExternalStore(subscribeSound, soundEnabled, () => false);
  const music = useSyncExternalStore<MusicState>(subscribeMusic, getMusicState, () => "waiting");
  const mode = useSyncExternalStore<SoundMode>(subscribeSoundMode, getSoundMode, () => "none");
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);
  const playing = on && music === "playing";
  const waiting = on && !playing;
  const label = !on ? "OFF" : mode === "theme" ? "ALL" : mode === "horse" ? "HORSE" : mode === "music" ? "MUSIC" : "ON";

  useEffect(() => {
    if (!open) return;
    const dismiss = (event: Event) => {
      if (event instanceof KeyboardEvent) { if (event.key === "Escape") setOpen(false); return; }
      if (!wrap.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", dismiss);
    document.addEventListener("keydown", dismiss);
    return () => { document.removeEventListener("pointerdown", dismiss); document.removeEventListener("keydown", dismiss); };
  }, [open]);

  const pick = (next: SoundMode) => { applySoundMode(next); setOpen(false); };

  return (
    <div ref={wrap} className="relative">
      <button
        type="button"
        data-sound-toggle
        data-state={!on ? "off" : playing ? "playing" : "waiting"}
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Sound: ${label.toLowerCase()}. Choose what plays.`}
        title="Choose what plays"
        className="label flex min-h-11 items-center gap-2 px-2 py-2.5 text-sand hover:text-gold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
      >
        <span className="hidden sm:inline">Sound</span>
        <span className="font-mono tracking-[0.1em] text-gold">{label}</span>
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
      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            aria-label="Sound options"
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="absolute right-0 top-full z-50 mt-2 flex w-[min(17rem,calc(100vw-2rem))] flex-col gap-1 rounded-xl border border-brass/30 bg-night p-2 text-sand shadow-[0_14px_36px_rgba(18,10,5,0.2)]"
          >
            {OPTIONS.map((option) => {
              const checked = option.mode === "none" ? !on || mode === "none" : on && mode === option.mode;
              const Icon = option.icon;
              return (
                <button
                  key={option.mode}
                  type="button"
                  role="menuitemradio"
                  aria-label={`${option.label}: ${option.note}`}
                  aria-checked={checked}
                  onClick={() => pick(option.mode)}
                  className={`flex min-h-12 w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold ${checked ? "bg-brass/15 text-gold" : "text-sand hover:bg-brass/10 hover:text-gold"}`}
                >
                  <Icon size={20} aria-hidden="true" />
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="label">{option.label}</span>
                    <span className="t-ui text-xs text-dust">{option.note}</span>
                  </span>
                  {checked && <span aria-hidden="true" className="h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
