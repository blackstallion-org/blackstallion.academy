"use client";

/**
 * Audio engine (Layer 10). Everything is opt-in: sound is OFF until the visitor switches it on,
 * the choice is remembered when storage allows, and a missing or blocked file fails silently.
 * Files (see public/audio/README.md): bsah_ambient_432hz_drone.mp3, bsah_stallion_breath.wav, bsah_keystroke.wav.
 */

export const SOUND_FILES = {
  ambient: "/audio/bsah_ambient_432hz_drone.mp3",
  breath: "/audio/bsah_stallion_breath.wav",
  key: "/audio/bsah_keystroke.wav",
} as const;

const KEY = "bsah-sound";
let enabled = false;
let ambient: HTMLAudioElement | null = null;
let hydrated = false;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

function readStored(): boolean {
  try {
    return window.localStorage.getItem(KEY) === "on";
  } catch {
    return false;
  }
}

export function subscribeSound(cb: () => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function soundEnabled(): boolean {
  if (typeof window === "undefined") return false;
  if (!hydrated) {
    hydrated = true;
    enabled = readStored();
  }
  return enabled;
}

function startAmbient() {
  try {
    if (!ambient) {
      ambient = new Audio(SOUND_FILES.ambient);
      ambient.loop = true;
      ambient.volume = 0.22;
    }
    void ambient.play().catch(() => {});
  } catch {
    /* file missing or autoplay blocked: stay silent */
  }
}

export function setSound(on: boolean): void {
  enabled = on;
  hydrated = true;
  try {
    window.localStorage.setItem(KEY, on ? "on" : "off");
  } catch {
    /* storage unavailable */
  }
  if (on) startAmbient();
  else ambient?.pause();
  emit();
}

/** Resume ambient after a page load if the visitor previously opted in (needs a user gesture in most browsers). */
export function resumeAmbientOnGesture(): void {
  if (!soundEnabled()) return;
  const go = () => {
    if (soundEnabled()) startAmbient();
    window.removeEventListener("pointerdown", go);
    window.removeEventListener("keydown", go);
  };
  window.addEventListener("pointerdown", go, { once: true });
  window.addEventListener("keydown", go, { once: true });
}

const lastPlayed: Record<string, number> = {};

/** One-shot effect. Does nothing unless sound is on; throttled per file. */
export function playEffect(name: "breath" | "key", volume = 0.5, minGapMs = 0): void {
  if (!soundEnabled()) return;
  const now = Date.now();
  if (now - (lastPlayed[name] ?? 0) < minGapMs) return;
  lastPlayed[name] = now;
  try {
    const a = new Audio(SOUND_FILES[name]);
    a.volume = volume;
    void a.play().catch(() => {});
  } catch {
    /* silent */
  }
}
