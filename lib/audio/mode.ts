import { setEffectsAllowed, setSound, soundEnabled, stopEffects } from "./engine";
import { resumeAmbience, setMusicAllowed, startMusic } from "./mixer";

/**
 * What the sound menu plays. Nothing plays on page load: the visitor picks a mode.
 *   theme   the website's own sound: the open-range track and the horse sounds
 *   horse   horse sounds only (breath, calls, hoofbeats), no music
 *   music   the open-range track on its own, independent of the site's sounds
 *   none    silence
 */
export type SoundMode = "theme" | "horse" | "music" | "none";
let mode: SoundMode = "none";
const listeners = new Set<() => void>();
export function getSoundMode(): SoundMode { return mode; }
export function subscribeSoundMode(listener: () => void): () => void {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

export function applySoundMode(next: SoundMode): void {
  mode = next;
  listeners.forEach((listener) => listener());
  if (next === "none") { setSound(false); return; }
  setEffectsAllowed(next !== "music");
  setMusicAllowed(next !== "horse");
  if (next === "music") stopEffects();
  // setSound(true) starts whatever the mode allows (the music, the greeting snort) and turns the engine on.
  if (!soundEnabled()) { setSound(true); return; }
  if (next !== "horse") void startMusic().then(() => resumeAmbience());
}
