"use client";

/** Opt-in, lazy, single-voice sound effects. No autoplay or background loop. */
export const SOUND_FILES = {
  ambient: "/audio/bsah_ambient_432hz_drone.mp3", // retained legacy asset; no longer looped
  breath: "/audio/interactions/snort.mp3",
  key: "/audio/bsah_keystroke.wav",
  gallop: "/audio/interactions/gallop.mp3",
  neigh: "/audio/interactions/neigh.mp3",
  snort: "/audio/interactions/snort.mp3",
  chase: "/audio/interactions/desert-chase.mp3",
  herd: "/audio/interactions/herd.mp3",
  chariot: "/audio/interactions/chariot.mp3",
  horseCall: "/audio/interactions/horse-call.mp3",
  leather: "/audio/interactions/leather.wav",
  tack: "/audio/interactions/tack.wav",
} as const;
export type SoundEffect = Exclude<keyof typeof SOUND_FILES, "ambient">;
const EQUINE = new Set<SoundEffect>(["breath", "gallop", "neigh", "snort", "chase", "herd", "chariot", "horseCall"]);
const LEVELS: Record<SoundEffect, number> = { breath: .12, key: .08, gallop: .16, neigh: .08, snort: .12, chase: .13, herd: .11, chariot: .13, horseCall: .1, leather: .16, tack: .1 };
const KEY = "bsah-sound";
let enabled = true;
let hydrated = false;
let unlocked = false;
let lastAny = -Infinity;
let lastEquine = -Infinity;
const lastPlayed = new Map<string, number>();
const players = new Map<string, HTMLAudioElement>();
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((listener) => listener());

export function subscribeSound(listener: () => void): () => void {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}
export function soundEnabled(): boolean {
  if (typeof window === "undefined") return true;
  if (!hydrated) {
    hydrated = true;
    try { enabled = window.localStorage.getItem(KEY) !== "off"; } catch { enabled = true; }
  }
  return enabled;
}
export function stopEffects(): void {
  players.forEach((player) => {
    player.pause();
    try { player.currentTime = 0; } catch { /* Unloaded media has no seek range. */ }
  });
}
export function setSound(on: boolean): void {
  enabled = on;
  hydrated = true;
  unlocked = on; // called by the visitor's explicit toggle gesture
  try { window.localStorage.setItem(KEY, on ? "on" : "off"); } catch { /* Optional persistence. */ }
  if (!on) stopEffects();
  emit();
  if (on) playEffect("snort");
}

/** Restoring a saved preference or default-on requires a user gesture in browsers. */
export function resumeSoundOnGesture(): () => void {
  const resume = () => {
    if (soundEnabled()) unlocked = true;
    window.removeEventListener("pointerdown", resume);
    window.removeEventListener("keydown", resume);
    window.removeEventListener("click", resume);
  };
  window.addEventListener("pointerdown", resume);
  window.addEventListener("keydown", resume);
  window.addEventListener("click", resume);
  return () => {
    window.removeEventListener("pointerdown", resume);
    window.removeEventListener("keydown", resume);
    window.removeEventListener("click", resume);
  };
}

export function isSoundEffect(name: string): name is SoundEffect {
  return name !== "ambient" && Object.prototype.hasOwnProperty.call(SOUND_FILES, name);
}

/** Returns whether playback was attempted; blocked/missing media stays silent. */
export function playEffect(name: SoundEffect, volume = LEVELS[name], minGapMs = 0): boolean {
  if (!soundEnabled() || !unlocked || document.hidden) return false;
  // Let a deliberately unmuted film own the sound stage.
  if (Array.from(document.querySelectorAll("video")).some((video) => !video.paused && !video.muted && video.volume > 0)) return false;
  const now = Date.now();
  const equine = EQUINE.has(name);
  const gap = Math.max(minGapMs, equine ? 12000 : 900);
  if (now - lastAny < 700 || now - (lastPlayed.get(name) ?? -Infinity) < gap || (equine && now - lastEquine < 12000)) return false;
  if (Array.from(players.values()).some((player) => !player.paused && !player.ended)) return false;
  lastAny = now;
  lastPlayed.set(name, now);
  if (equine) lastEquine = now;
  try {
    let player = players.get(name);
    if (!player) {
      player = new Audio();
      player.preload = "none";
      player.src = SOUND_FILES[name];
      player.dataset.bsahEffect = name;
      player.hidden = true;
      player.setAttribute("aria-hidden", "true");
      document.body.appendChild(player);
      players.set(name, player);
    }
    player.volume = Math.max(0, Math.min(LEVELS[name], volume));
    player.currentTime = 0;
    void player.play().catch(() => { player?.pause(); });
    return true;
  } catch { return false; }
}

export function disposeSoundscape(): void {
  stopEffects();
  players.forEach((player) => { player.removeAttribute("src"); player.load(); player.remove(); });
  players.clear();
  unlocked = false;
}
