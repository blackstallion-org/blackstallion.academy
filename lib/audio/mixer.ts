"use client";

import { asset, mediaCrossOrigin } from "@/lib/content/asset";

/**
 * The site's sound stage (2 Nov 2026): one WebAudio graph with three buses under a master gain.
 *
 *   music     one licensed track that loops for the whole visit. It lives in this module (the root layout keeps it alive), so
 *             client-side navigation never restarts it; a full reload resumes from the last saved position.
 *   ambience  a page's location bed (the Fleet worlds), crossfaded, with sparse one-shot cues on top.
 *   effects   the existing single-voice horse and UI cues (lib/audio/engine.ts routes through here when the graph exists).
 *
 * Rules: nothing is created or played before the visitor's own gesture (browsers require it, and the tests assert it); every level
 * change is a fade; music ducks under effects, under a location bed and to silence under an unmuted film.
 */

export const MUSIC = {
  src: asset("/audio/music/windswept.mp3"),
  title: "Windswept",
  author: "Kevin MacLeod (incompetech.com)",
  licence: "CC BY 4.0",
} as const;

/** Linear bus ceilings. Music sits well under speech level; effects keep their own per-cue caps in engine.ts. */
const MUSIC_LEVEL = 0.32;
const AMBIENCE_LEVEL = 0.55;
const FADE_TC = 0.45;
const POSITION_KEY = "bsah-music-position";

export type AmbienceKey = "cavalry" | "village" | "field";
type Cue = { src: string; gain: number };
export const AMBIENCES: Record<AmbienceKey, { bed: string; cues: Cue[]; every: [number, number] }> = {
  cavalry: { bed: asset("/audio/ambience/cavalry-bed.mp3"), cues: [{ src: asset("/audio/ambience/cavalry-gallop.mp3"), gain: 0.7 }], every: [14, 24] },
  village: { bed: asset("/audio/ambience/village-bed.mp3"), cues: [{ src: asset("/audio/ambience/village-herders.mp3"), gain: 0.6 }, { src: asset("/audio/interactions/walk.mp3"), gain: 0.35 }], every: [12, 22] },
  field: { bed: asset("/audio/ambience/field-bed.mp3"), cues: [{ src: asset("/audio/ambience/field-crowd.mp3"), gain: 0.6 }, { src: asset("/audio/interactions/neigh.mp3"), gain: 0.22 }], every: [13, 23] },
};

export type MusicState = "off" | "waiting" | "playing" | "blocked";

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
const bus: Partial<Record<"music" | "ambience" | "effects", GainNode>> = {};
let music: HTMLAudioElement | null = null;
let musicState: MusicState = "waiting";
let wanted = false; // the visitor wants music (sound is on); playback still needs a gesture
const ducks = new Map<string, number>();
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
let lastSave = 0;
let videoWatch: ReturnType<typeof setInterval> | undefined;

export function subscribeMusic(listener: () => void): () => void {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}
export function getMusicState(): MusicState { return musicState; }
function setState(next: MusicState) { if (next !== musicState) { musicState = next; emit(); } }

function canBuild(): boolean {
  return typeof window !== "undefined" && typeof (globalThis as { Audio?: unknown }).Audio === "function" && !!(window.AudioContext ?? (window as unknown as { webkitAudioContext?: unknown }).webkitAudioContext);
}

/** Builds the graph. Call only from inside a user gesture (it resumes the context there). */
function graph(): AudioContext | null {
  if (ctx) { if (ctx.state === "suspended") void ctx.resume().catch(() => {}); return ctx; }
  if (!canBuild()) return null;
  try {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    ctx = new Ctor({ latencyHint: "playback" });
    master = ctx.createGain();
    master.gain.value = 1;
    master.connect(ctx.destination);
    for (const name of ["music", "ambience", "effects"] as const) {
      const g = ctx.createGain();
      g.gain.value = name === "music" ? 0 : name === "ambience" ? AMBIENCE_LEVEL : 1;
      g.connect(master);
      bus[name] = g;
    }
    void ctx.resume().catch(() => {});
    return ctx;
  } catch { ctx = null; return null; }
}

/** The effects bus, for engine.ts. Null until the graph exists (then effects fall back to element volume). */
export function effectsBus(): { context: AudioContext; node: GainNode } | null {
  return ctx && bus.effects ? { context: ctx, node: bus.effects } : null;
}

function musicTarget(): number {
  let level = MUSIC_LEVEL;
  ducks.forEach((d) => { level = Math.min(level, MUSIC_LEVEL * d); });
  return level;
}
function applyMusicLevel(tc = FADE_TC) {
  if (!ctx || !bus.music) return;
  const g = bus.music.gain;
  g.cancelScheduledValues(ctx.currentTime);
  g.setTargetAtTime(musicState === "playing" ? musicTarget() : 0, ctx.currentTime, tc);
}

/** Lower the music while something else speaks: `level` is a fraction of the music's own level (0 = silent). */
export function duckMusic(reason: string, level: number): void { ducks.set(reason, Math.max(0, Math.min(1, level))); applyMusicLevel(); }
export function releaseMusic(reason: string): void { if (ducks.delete(reason)) applyMusicLevel(0.8); }

function unmutedFilmPlaying(): boolean {
  if (typeof document === "undefined") return false;
  return Array.from(document.querySelectorAll("video")).some((v) => !v.paused && !v.muted && v.volume > 0);
}

function ensureElement(): HTMLAudioElement | null {
  if (music) return music;
  if (!graph() || !ctx || !bus.music) return null;
  const el = new Audio();
  const cors = mediaCrossOrigin(MUSIC.src);
  if (cors) el.crossOrigin = cors;
  el.src = MUSIC.src;
  el.loop = true;
  el.preload = "auto";
  el.setAttribute("aria-hidden", "true");
  try {
    const saved = Number(window.sessionStorage.getItem(POSITION_KEY));
    if (Number.isFinite(saved) && saved > 0) el.addEventListener("loadedmetadata", () => { try { el.currentTime = saved % (el.duration || saved + 1); } catch { /* not seekable yet */ } }, { once: true });
  } catch { /* storage blocked */ }
  el.addEventListener("timeupdate", () => {
    const now = Date.now();
    if (now - lastSave > 2000) { lastSave = now; try { window.sessionStorage.setItem(POSITION_KEY, String(el.currentTime)); } catch { /* optional */ } }
  });
  el.addEventListener("pause", () => { if (musicState === "playing" && wanted && !document.hidden) setState("waiting"); });
  try { ctx.createMediaElementSource(el).connect(bus.music); } catch { return null; }
  music = el;
  // Development only: lets the headless checks read the playhead to prove the track never restarts on navigation.
  if (process.env.NODE_ENV !== "production") (window as unknown as { __bsahMusic?: HTMLAudioElement }).__bsahMusic = el;
  return el;
}

/** Starts (or resumes) the music. Must run inside a user gesture. Resolves true when it is audibly playing. */
export async function startMusic(): Promise<boolean> {
  wanted = true;
  const el = ensureElement();
  if (!el || !ctx) { setState("blocked"); return false; }
  try {
    if (ctx.state === "suspended") await ctx.resume();
    await el.play();
    setState("playing");
    applyMusicLevel(1.2); // a slow fade in
    watchFilms();
    return true;
  } catch {
    setState("blocked");
    return false;
  }
}

/** Fades the music out and pauses it (sound off, hidden tab). */
export function stopMusic(keepWanted = false): void {
  if (!keepWanted) wanted = false;
  const el = music;
  setState(keepWanted ? "waiting" : "off");
  applyMusicLevel(0.18);
  if (el) setTimeout(() => { if (musicState !== "playing") el.pause(); }, 700);
  clearInterval(videoWatch);
}
export function musicWanted(): boolean { return wanted; }
export function setMusicWanted(on: boolean): void { wanted = on; setState(on ? (musicState === "playing" ? "playing" : "waiting") : "off"); }

/** An unmuted film owns the stage: the music fades to nothing while it plays and comes back after. */
function watchFilms() {
  clearInterval(videoWatch);
  videoWatch = setInterval(() => {
    if (unmutedFilmPlaying()) duckMusic("film", 0); else releaseMusic("film");
  }, 800);
}

/* ---------------- ambience ---------------- */

const buffers = new Map<string, Promise<AudioBuffer | null>>();
function load(src: string): Promise<AudioBuffer | null> {
  let p = buffers.get(src);
  if (!p) {
    p = fetch(src).then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(new Error(String(r.status))))).then((b) => (ctx ? ctx.decodeAudioData(b) : null)).catch(() => null);
    buffers.set(src, p);
  }
  return p;
}

type Bed = { key: AmbienceKey; source: AudioBufferSourceNode | null; gain: GainNode; timer: ReturnType<typeof setTimeout> | undefined; live: boolean };
let bed: Bed | null = null;
let requested: AmbienceKey | null = null;
/** Bed sources started and not yet stopped (a fading bed counts until it stops): the proof that switching never doubles a bed. */
let sounding = 0;

function fadeOutBed(b: Bed) {
  b.live = false;
  clearTimeout(b.timer);
  if (!ctx) return;
  b.gain.gain.cancelScheduledValues(ctx.currentTime);
  b.gain.gain.setTargetAtTime(0, ctx.currentTime, 0.4);
  const src = b.source;
  setTimeout(() => { try { src?.stop(); } catch { /* already stopped */ } if (src) sounding -= 1; src?.disconnect(); b.gain.disconnect(); }, 2200);
}

function scheduleCue(b: Bed) {
  const spec = AMBIENCES[b.key];
  const wait = (spec.every[0] + Math.random() * (spec.every[1] - spec.every[0])) * 1000;
  b.timer = setTimeout(async () => {
    if (!b.live || !ctx || document.hidden) { if (b.live) scheduleCue(b); return; }
    const cue = spec.cues[Math.floor(Math.random() * spec.cues.length)];
    const buf = await load(cue.src);
    if (buf && b.live && ctx) {
      const s = ctx.createBufferSource();
      s.buffer = buf;
      const g = ctx.createGain();
      g.gain.value = cue.gain;
      const pan = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
      if (pan) { pan.pan.value = Math.random() * 1.2 - 0.6; s.connect(g).connect(pan).connect(b.gain); } else s.connect(g).connect(b.gain);
      s.onended = () => { s.disconnect(); g.disconnect(); pan?.disconnect(); };
      s.start();
    }
    scheduleCue(b);
  }, wait);
}

/**
 * The location bed for a page section (Fleet worlds). `null` fades it out. Safe to call before a gesture: the request is kept and
 * honoured once sound is unlocked. Only one bed plays; switching crossfades and never doubles a bed.
 */
export async function setAmbience(key: AmbienceKey | null): Promise<void> {
  requested = key;
  if (bed && bed.key === key && bed.live) return;
  if (bed) { fadeOutBed(bed); bed = null; }
  if (!key) { releaseMusic("ambience"); return; }
  if (!ctx || !bus.ambience || !wanted) return; // honoured later by resumeAmbience()
  const gain = ctx.createGain();
  gain.gain.value = 0;
  gain.connect(bus.ambience);
  const mine: Bed = { key, source: null, gain, timer: undefined, live: true };
  bed = mine;
  duckMusic("ambience", 0.45);
  const buf = await load(AMBIENCES[key].bed);
  if (!buf || !mine.live || !ctx) { if (mine.live) { gain.disconnect(); bed = null; } return; }
  const s = ctx.createBufferSource();
  s.buffer = buf;
  s.loop = true;
  // MP3 encoder padding at both ends: loop inside it so the seam does not tick.
  s.loopStart = Math.min(0.06, buf.duration / 4);
  s.loopEnd = Math.max(s.loopStart + 0.5, buf.duration - 0.06);
  s.connect(gain);
  s.start(0, s.loopStart);
  sounding += 1;
  mine.source = s;
  gain.gain.setTargetAtTime(1, ctx.currentTime, 0.5);
  scheduleCue(mine);
}

/** Development only: what the ambience is doing, for the headless sound checks. */
export function ambienceDebug() { return { requested, current: bed?.live ? bed.key : null, sounding }; }

/** True while a location bed is (or is about to be) sounding: the idle horse calls stay quiet then. */
export function ambienceActive(): boolean { return !!bed?.live; }

export function resumeAmbience(): void { if (requested && (!bed || !bed.live)) void setAmbience(requested); }
export function pauseAmbience(): void { if (bed) { fadeOutBed(bed); bed = null; releaseMusic("ambience"); } }

export function disposeMixer(): void {
  pauseAmbience();
  clearInterval(videoWatch);
  if (music) { music.pause(); music.removeAttribute("src"); music.load(); }
  music = null;
  if (ctx) void ctx.close().catch(() => {});
  ctx = null;
  master = null;
  delete bus.music; delete bus.ambience; delete bus.effects;
  buffers.clear();
  ducks.clear();
  musicState = "waiting";
}
