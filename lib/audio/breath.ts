import { soundReady, subscribeSound } from "@/lib/audio/engine";
import { prefersReducedMotion } from "@/lib/sensory";

/**
 * A stallion breathing, synthesized with WebAudio (no audio files): looped brown noise through a low-pass for the chest, a
 * soft band of air for the nostrils and a ~64 Hz sine for weight, shaped by a slow inhale/exhale envelope.
 *
 * Safety rules, all enforced here and covered by tests/crisis-cure-sensory.test.mjs:
 * - It only starts from `engage()`, which the caller invokes from a trusted pointer/key handler (never on load, never autoplay).
 * - It only sounds while `soundReady()` holds: the site's Sound toggle is on, the visitor has interacted, the tab is visible and
 *   no unmuted film owns the sound stage. It also stays silent under reduced motion.
 * - It is very quiet (master gain ceiling BREATH_PEAK, about -26 dBFS) and always fades in and out; nothing starts or stops abruptly.
 * - Turning Sound off, hiding the tab or releasing the pointer fades it out and parks the AudioContext.
 *
 * Phone speakers cannot reproduce much below ~150 Hz, so on a phone the cue is mostly the airy part; headphones and laptops carry the chest.
 */

/** Linear ceiling for the master gain. */
export const BREATH_PEAK = 0.05;
const FADE_IN_TC = 0.12;
const FADE_OUT_TC = 0.25;
const FADE_OUT_MS = 900;
/** One full breath, in seconds: roughly 2 s in and out. */
const PERIOD = 3.6;
/** How far ahead (seconds) breaths are scheduled on the audio clock. */
const AHEAD = 4;
const DRIVE_GAP_MS = 50;

/** True when a breath may sound right now. */
export function breathAllowed(): boolean {
  return !prefersReducedMotion() && soundReady();
}

type ContextCtor = typeof AudioContext;

function contextCtor(): ContextCtor | null {
  const w = window as unknown as { AudioContext?: ContextCtor; webkitAudioContext?: ContextCtor };
  return w.AudioContext ?? w.webkitAudioContext ?? null;
}

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

/** Two seconds of brown noise that loops without a click (the end is bent to meet the start). */
function brownNoise(ac: AudioContext): AudioBuffer {
  const n = Math.floor(ac.sampleRate * 2);
  const buffer = ac.createBuffer(1, n, ac.sampleRate);
  const data = buffer.getChannelData(0);
  let seed = 7;
  let last = 0;
  for (let i = 0; i < n; i++) {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    last = (last + 0.02 * ((seed / 4294967296) * 2 - 1)) / 1.02;
    data[i] = last * 3.5;
  }
  const seam = data[n - 1] - data[0];
  for (let i = 0; i < n; i++) data[i] -= (seam * i) / (n - 1);
  return buffer;
}

export class BreathCue {
  private ac: AudioContext | null = null;
  private master: GainNode | null = null;
  private breath: GainNode | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;
  private stopTimer: ReturnType<typeof setTimeout> | null = null;
  private unsubscribe: (() => void) | null = null;
  private nextAt = 0;
  private lastDrive = 0;
  private engaged = false;
  private readonly onVisibility = () => {
    if (document.hidden) this.release(true);
  };

  /** True while a breath is sounding (or fading in). */
  get active(): boolean {
    return this.engaged;
  }

  /**
   * Creates and resumes the audio context without making a sound. Touch drags call this on pointerdown, because the activation
   * that unlocks audio on touch devices arrives later; the cue then fades in the moment the drag turns out to be horizontal.
   */
  prime(): boolean {
    if (!breathAllowed() || !this.build() || !this.ac) return false;
    if (this.stopTimer) {
      clearTimeout(this.stopTimer);
      this.stopTimer = null;
    }
    void this.ac.resume().catch(() => {});
    return true;
  }

  /** Fade the breath in. Call from a trusted pointer or key handler. Returns false (and stays silent) when sound is not allowed. */
  engage(intensity = 0.4): boolean {
    if (!this.prime() || !this.ac) return false;
    if (!this.timer) {
      this.schedule();
      this.timer = setInterval(() => this.schedule(), 1000);
    }
    this.unsubscribe ??= subscribeSound(() => {
      if (!breathAllowed()) this.release(true);
    });
    document.addEventListener("visibilitychange", this.onVisibility);
    this.engaged = true;
    this.level(intensity, FADE_IN_TC);
    return true;
  }

  /** Follow the drag: 0 (barely there) to 1 (the loudest this cue ever gets, still very quiet). */
  drive(intensity: number): void {
    if (!this.engaged) return;
    if (!breathAllowed()) {
      this.release(true);
      return;
    }
    const now = performance.now();
    if (now - this.lastDrive < DRIVE_GAP_MS) return;
    this.lastDrive = now;
    this.level(intensity, FADE_IN_TC);
  }

  /** Fade out and park the audio context. Safe to call at any time. */
  release(immediate = false): void {
    if (!this.ac) return;
    const wasEngaged = this.engaged;
    this.engaged = false;
    document.removeEventListener("visibilitychange", this.onVisibility);
    if (wasEngaged) this.level(0, immediate ? 0.05 : FADE_OUT_TC);
    if (this.stopTimer) clearTimeout(this.stopTimer);
    this.stopTimer = setTimeout(() => this.park(), wasEngaged ? (immediate ? 250 : FADE_OUT_MS) : 50);
  }

  dispose(): void {
    this.release(true);
    if (this.stopTimer) clearTimeout(this.stopTimer);
    this.stopTimer = null;
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    this.unsubscribe?.();
    this.unsubscribe = null;
    document.removeEventListener("visibilitychange", this.onVisibility);
    void this.ac?.close().catch(() => {});
    this.ac = null;
    this.master = null;
    this.breath = null;
  }

  private park(): void {
    this.stopTimer = null;
    if (this.engaged || !this.ac) return;
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    this.nextAt = 0;
    void this.ac.suspend().catch(() => {});
  }

  private level(intensity: number, timeConstant: number): void {
    if (!this.ac || !this.master) return;
    const gain = this.master.gain;
    const t = this.ac.currentTime;
    gain.cancelScheduledValues(t);
    gain.setValueAtTime(gain.value, t);
    gain.setTargetAtTime(BREATH_PEAK * clamp01(intensity), t, timeConstant);
  }

  private schedule(): void {
    const ac = this.ac;
    const gain = this.breath?.gain;
    if (!ac || !gain) return;
    const now = ac.currentTime;
    if (this.nextAt < now) this.nextAt = now + 0.05;
    while (this.nextAt < now + AHEAD) {
      const t = this.nextAt;
      // a short, faint inhale; a beat; a longer, fuller exhale that dies away
      gain.setValueAtTime(0, t);
      gain.linearRampToValueAtTime(0.28, t + 1.2);
      gain.linearRampToValueAtTime(0.2, t + 1.5);
      gain.linearRampToValueAtTime(1, t + 2.1);
      gain.linearRampToValueAtTime(0, t + 3.5);
      this.nextAt += PERIOD;
    }
  }

  private build(): boolean {
    if (this.ac) return true;
    try {
      const Ctor = contextCtor();
      if (!Ctor) return false;
      const ac = new Ctor();
      const master = ac.createGain();
      master.gain.value = 0;
      const soften = ac.createBiquadFilter();
      soften.type = "lowpass";
      soften.frequency.value = 1400;
      const breath = ac.createGain();
      breath.gain.value = 0;
      breath.connect(soften);
      soften.connect(master);
      master.connect(ac.destination);

      const noise = brownNoise(ac);

      // chest: brown noise below ~170 Hz
      const chest = ac.createBufferSource();
      chest.buffer = noise;
      chest.loop = true;
      const chestLow = ac.createBiquadFilter();
      chestLow.type = "lowpass";
      chestLow.frequency.value = 170;
      chestLow.Q.value = 0.6;
      const chestGain = ac.createGain();
      chestGain.gain.value = 0.6;
      chest.connect(chestLow);
      chestLow.connect(chestGain);
      chestGain.connect(breath);
      chest.start();

      // nostrils: a soft band of air around 450 Hz
      const air = ac.createBufferSource();
      air.buffer = noise;
      air.loop = true;
      air.playbackRate.value = 2;
      const airBand = ac.createBiquadFilter();
      airBand.type = "bandpass";
      airBand.frequency.value = 450;
      airBand.Q.value = 0.8;
      const airGain = ac.createGain();
      airGain.gain.value = 0.35;
      air.connect(airBand);
      airBand.connect(airGain);
      airGain.connect(breath);
      air.start();

      // weight: a very low sine
      const weight = ac.createOscillator();
      weight.type = "sine";
      weight.frequency.value = 64;
      const weightGain = ac.createGain();
      weightGain.gain.value = 0.35;
      weight.connect(weightGain);
      weightGain.connect(breath);
      weight.start();

      this.ac = ac;
      this.master = master;
      this.breath = breath;
      return true;
    } catch {
      return false;
    }
  }
}
