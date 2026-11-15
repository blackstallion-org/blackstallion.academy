"use client";

import { asset } from "@/lib/content/asset";
import { duckMusic, effectsBus, getMusicState, pauseAmbience, releaseMusic, resumeAmbience, setMusicWanted, startMusic, stopMusic } from "./mixer";

/**
 * Opt-in, lazy, single-voice sound effects, routed through the mixer's effects bus once the visitor's gesture has built it.
 *
 * The horse palette (2 Nov 2026, seven sounds, sources in public/audio/LICENSES.md):
 *   calls        neigh, horseCall
 *   breath       snort, breath
 *   hoofbeats    gallop, walk
 *   interaction  saddle (leather creak of a rider settling)
 * Plus two synthetic UI accents (leather, tack) and the legacy keystroke.
 */
export const SOUND_FILES = {
  neigh: asset("/audio/interactions/neigh.mp3"),
  horseCall: asset("/audio/interactions/horse-call.mp3"),
  snort: asset("/audio/interactions/snort.mp3"),
  // 14 Nov 2026 (owner): the four-burst breathing clip sounded like a cough; every breath cue is now the one short snort.
  breath: asset("/audio/interactions/snort.mp3"),
  gallop: asset("/audio/interactions/gallop.mp3"),
  walk: asset("/audio/interactions/walk.mp3"),
  saddle: asset("/audio/interactions/saddle.mp3"),
  leather: asset("/audio/interactions/leather.wav"),
  tack: asset("/audio/interactions/tack.wav"),
  key: asset("/audio/bsah_keystroke.wav"),
} as const;
export type SoundEffect = keyof typeof SOUND_FILES;
export const HORSE_PALETTE: readonly SoundEffect[] = ["neigh", "horseCall", "snort", "breath", "gallop", "walk", "saddle"];
/** The occasional idle call while music plays: the quieter, non-alarming members of the palette. */
export const IDLE_CALLS: readonly SoundEffect[] = ["horseCall", "snort", "neigh"];
const EQUINE = new Set<SoundEffect>(HORSE_PALETTE);
const LEVELS: Record<SoundEffect, number> = { neigh: 0.08, horseCall: 0.1, snort: 0.12, breath: 0.14, gallop: 0.16, walk: 0.16, saddle: 0.14, leather: 0.16, tack: 0.1, key: 0.08 };
const KEY = "bsah-sound";
/** Through the graph, effects sit about 7 dB above their old element volume so they read over the (ducked) music bed. */
const GRAPH_EFFECT_GAIN = 2.2;
let enabled = true;
let hydrated = false;
let unlocked = false;
let lastAny = -Infinity;
let lastEquine = -Infinity;
const lastPlayed = new Map<string, number>();
const players = new Map<string, { el: HTMLAudioElement; gain: GainNode | null }>();
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((listener) => listener());

export function subscribeSound(listener: () => void): () => void {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

/** Sound defaults to ON, except for visitors who ask their system for reduced motion (then OFF until they turn it on). */
export function soundEnabled(): boolean {
  if (typeof window === "undefined") return true;
  if (!hydrated) {
    hydrated = true;
    try {
      const saved = window.localStorage.getItem(KEY);
      enabled = saved ? saved !== "off" : !window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    } catch { enabled = true; }
  }
  return enabled;
}

export function stopEffects(): void {
  stopBackgroundHorse();
  players.forEach(({ el }) => {
    el.pause();
    try { el.currentTime = 0; } catch { /* Unloaded media has no seek range. */ }
  });
  releaseMusic("effect");
}

/** Called by the visitor's explicit toggle gesture: on starts the music right away, off silences everything. */
export function setSound(on: boolean): void {
  enabled = on;
  hydrated = true;
  unlocked = on;
  try { window.localStorage.setItem(KEY, on ? "on" : "off"); } catch { /* Optional persistence. */ }
  if (!on) { stopEffects(); stopMusic(); pauseAmbience(); }
  emit();
  if (on) {
    setMusicWanted(true);
    void startMusic().then(() => resumeAmbience());
    playEffect("snort");
  }
}

/**
 * For handlers that run on the visitor's own pointer or key gesture and synthesize their own audio. The page-wide listener below
 * runs after the target's handler, so the first gesture would otherwise arrive one event too late. No-op while sound is off.
 */
export function unlockSoundFromGesture(): void {
  if (soundEnabled()) unlocked = true;
}

function saveData(): boolean {
  const c = (navigator as unknown as { connection?: { saveData?: boolean } }).connection;
  return !!c?.saveData;
}

/**
 * Restoring a saved preference or the default-on state needs a real activation gesture. Touch `pointerdown` is not one, so this
 * listens to click, key, pointer-up and touch-end, and keeps listening until the music has actually started. Presses on the nav's
 * Sound control are left to that control. Save-Data visitors get effects but no automatic music (the toggle can still start it).
 */
export function resumeSoundOnGesture(): () => void {
  const events = ["click", "keydown", "pointerup", "touchend"] as const;
  const remove = () => events.forEach((e) => window.removeEventListener(e, resume, true));
  let starting = false;
  function resume(event: Event) {
    const target = event.target;
    if (target instanceof Element && target.closest("[data-sound-toggle]")) return;
    if (event instanceof KeyboardEvent && (event.key === "Escape" || event.key === "Tab" || event.metaKey || event.ctrlKey)) return;
    if (!soundEnabled()) return;
    unlocked = true;
    if (saveData() || starting || getMusicState() === "playing") { if (getMusicState() === "playing") remove(); return; }
    starting = true;
    setMusicWanted(true);
    void startMusic().then((ok) => { starting = false; if (ok) { remove(); resumeAmbience(); } });
  }
  events.forEach((e) => window.addEventListener(e, resume, true));
  return remove;
}

export function isSoundEffect(name: string): name is SoundEffect {
  return Object.prototype.hasOwnProperty.call(SOUND_FILES, name);
}

function filmPlaying(): boolean {
  return Array.from(document.querySelectorAll("video")).some((video) => !video.paused && !video.muted && video.volume > 0);
}

/**
 * True when the visitor has sound on and has interacted with the page (so the browser allows playback), the tab is visible and
 * no unmuted film owns the sound stage. For effects that synthesize their own audio (the hoofbeats of the film).
 */
export function soundReady(): boolean {
  if (!soundEnabled() || !unlocked || typeof document === "undefined" || document.hidden) return false;
  return !filmPlaying();
}

/** True while any effect is sounding (the idle calls wait for silence). */
export function effectPlaying(): boolean {
  return Array.from(players.values()).some(({ el }) => !el.paused && !el.ended);
}

/** Returns whether playback was attempted; blocked/missing media stays silent. */
/** Off when the sound menu is on "Open-range music" (the track alone, no horse sounds). */
let effectsAllowed = true;
export function setEffectsAllowed(on: boolean): void { effectsAllowed = on; if (!on) stopEffects(); }

/**
 * Pressing "Horse sounds" in the sound menu answers with a horse right away: a neigh, a call or a snort, a little louder than the
 * ambient ones. The spacing rules that keep the page from nagging (12 s between horse sounds, one at a time) are set aside for this
 * one deliberate press; everything else (sound off, the film owning the sound stage, a hidden tab) still applies.
 */
export function previewHorse(): boolean {
  if (!soundEnabled() || !unlocked) return false;
  stopEffects();
  lastAny = 0;
  lastEquine = 0;
  lastPlayed.clear();
  const picks: SoundEffect[] = ["neigh", "horseCall", "snort"];
  return playEffect(picks[Math.floor(Math.random() * picks.length)], 0.3);
}

export function playEffect(name: SoundEffect, volume = LEVELS[name], minGapMs = 0): boolean {
  if (!effectsAllowed) return false;
  if (!soundEnabled() || !unlocked || document.hidden) return false;
  // Let a deliberately unmuted film own the sound stage.
  if (filmPlaying()) return false;
  const now = Date.now();
  const equine = EQUINE.has(name);
  const gap = Math.max(minGapMs, equine ? 12000 : 900);
  if (now - lastAny < 700 || now - (lastPlayed.get(name) ?? -Infinity) < gap || (equine && now - lastEquine < 12000)) return false;
  if (effectPlaying()) return false;
  lastAny = now;
  lastPlayed.set(name, now);
  if (equine) lastEquine = now;
  try {
    let entry = players.get(name);
    if (!entry) {
      const el = new Audio();
      el.preload = "none";
      el.src = SOUND_FILES[name];
      el.dataset.bsahEffect = name;
      el.hidden = true;
      el.setAttribute("aria-hidden", "true");
      document.body.appendChild(el);
      let gain: GainNode | null = null;
      const route = effectsBus();
      if (route) {
        try {
          gain = route.context.createGain();
          route.context.createMediaElementSource(el).connect(gain).connect(route.node);
        } catch { gain = null; }
      }
      el.addEventListener("ended", () => releaseMusic("effect"));
      el.addEventListener("pause", () => releaseMusic("effect"));
      entry = { el, gain };
      players.set(name, entry);
    }
    const level = Math.max(0, Math.min(LEVELS[name], volume));
    // Through the graph the element stays at full scale and the gain node sets the level (iOS ignores element volume).
    if (entry.gain) { entry.el.volume = 1; entry.gain.gain.value = level * GRAPH_EFFECT_GAIN; } else entry.el.volume = level;
    entry.el.currentTime = 0;
    duckMusic("effect", 0.5);
    void entry.el.play().catch(() => { entry?.el.pause(); });
    return true;
  } catch { return false; }
}

/**
 * Background horse sounds (14 Nov 2026, owner): two long snorting recordings that play, one at a time and alternating, once a
 * minute (components/site/Soundscape.tsx) wherever the sound menu allows horse sounds. They have their own voice, so a 32-second
 * clip never silences the link and button sounds, and they sit quietly: the music only dips a little while one plays.
 */
export const BACKGROUND_HORSE = [asset("/audio/interactions/snorting-short.mp3"), asset("/audio/interactions/snorting-long.mp3")] as const;
const BACKGROUND_LEVEL = 0.1;
const BACKGROUND_DUCK = 0.8;
const background = new Map<number, { el: HTMLAudioElement; gain: GainNode | null }>();

/** True while a background horse sound is sounding (the idle calls wait for it). */
export function backgroundHorsePlaying(): boolean {
  return Array.from(background.values()).some(({ el }) => !el.paused && !el.ended);
}

/** Plays background horse sound number `index` (wrapping) if sound is on and allowed, the tab is visible, no film owns the sound and nothing else is sounding. Returns whether it started. */
export function playBackgroundHorse(index: number): boolean {
  if (!effectsAllowed || !soundEnabled() || !unlocked || document.hidden || filmPlaying()) return false;
  if (backgroundHorsePlaying() || effectPlaying()) return false;
  const i = ((index % BACKGROUND_HORSE.length) + BACKGROUND_HORSE.length) % BACKGROUND_HORSE.length;
  try {
    let entry = background.get(i);
    if (!entry) {
      const el = new Audio();
      el.preload = "none";
      el.src = BACKGROUND_HORSE[i];
      el.dataset.bsahBackgroundHorse = String(i);
      el.hidden = true;
      el.setAttribute("aria-hidden", "true");
      document.body.appendChild(el);
      let gain: GainNode | null = null;
      const route = effectsBus();
      if (route) {
        try {
          gain = route.context.createGain();
          route.context.createMediaElementSource(el).connect(gain).connect(route.node);
        } catch { gain = null; }
      }
      el.addEventListener("ended", () => releaseMusic("background-horse"));
      el.addEventListener("pause", () => releaseMusic("background-horse"));
      entry = { el, gain };
      background.set(i, entry);
    }
    if (entry.gain) { entry.el.volume = 1; entry.gain.gain.value = BACKGROUND_LEVEL * GRAPH_EFFECT_GAIN; } else entry.el.volume = BACKGROUND_LEVEL;
    entry.el.currentTime = 0;
    duckMusic("background-horse", BACKGROUND_DUCK);
    void entry.el.play().catch(() => { entry?.el.pause(); });
    return true;
  } catch { return false; }
}

function stopBackgroundHorse(): void {
  background.forEach(({ el }) => {
    el.pause();
    try { el.currentTime = 0; } catch { /* Unloaded media has no seek range. */ }
  });
  releaseMusic("background-horse");
}

export function disposeSoundscape(): void {
  stopEffects();
  background.forEach(({ el }) => { el.removeAttribute("src"); el.load(); el.remove(); });
  background.clear();
  players.forEach(({ el }) => { el.removeAttribute("src"); el.load(); el.remove(); });
  players.clear();
  unlocked = false;
}
