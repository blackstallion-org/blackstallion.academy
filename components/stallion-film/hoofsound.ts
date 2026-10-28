import { soundReady } from "@/lib/audio/engine";

/**
 * Hoofbeats for the film, synthesized (no audio files): a short filtered noise burst for the strike, a low sine for the weight of
 * the horse, and a high click on hard ground. It plays only while the site's own sound toggle is on and the visitor has interacted
 * with the page; the level is quiet by design, and hits are rate-limited so a gallop reads as a rhythm, not a wall of noise.
 */
export class HoofSound {
  private ac: AudioContext | null = null;
  private master: GainNode | null = null;
  private noise: AudioBuffer | null = null;
  private last = 0;
  private readonly onVisibility = () => {
    if (!this.ac) return;
    if (document.hidden) void this.ac.suspend();
    else void this.ac.resume();
  };

  private ensure(): boolean {
    if (this.ac) return true;
    try {
      const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return false;
      const ac = new AC();
      const master = ac.createGain();
      master.gain.value = 0.2;
      const lp = ac.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.value = 6000;
      master.connect(lp).connect(ac.destination);
      const n = Math.floor(ac.sampleRate * 0.3);
      const buf = ac.createBuffer(1, n, ac.sampleRate);
      const d = buf.getChannelData(0);
      let seed = 12345;
      for (let i = 0; i < n; i++) {
        seed = (seed * 1664525 + 1013904223) >>> 0;
        d[i] = (seed / 4294967296) * 2 - 1;
      }
      this.ac = ac;
      this.master = master;
      this.noise = buf;
      document.addEventListener("visibilitychange", this.onVisibility);
      return true;
    } catch {
      return false;
    }
  }

  /** One hoof landing. impact 0..1.4, hardness 0 (soft sand) .. 1 (stone), pan -1..1, distance in metres from the camera. */
  hit(impact: number, hardness: number, pan: number, distance: number) {
    try {
      this.play(impact, hardness, pan, distance);
    } catch {
      /* sound is optional: never let it break a frame */
    }
  }

  private play(impact: number, hardness: number, pan: number, distance: number) {
    if (!soundReady()) return;
    const now = performance.now();
    if (now - this.last < 45) return;
    this.last = now;
    if (!this.ensure() || !this.ac || !this.master || !this.noise) return;
    const ac = this.ac;
    if (ac.state === "suspended") void ac.resume();
    const t = ac.currentTime;
    const level = Math.max(0.02, Math.min(1.2, impact)) / (1 + distance * 0.1);
    const out = ac.createStereoPanner();
    out.pan.value = Math.max(-1, Math.min(1, pan));
    out.connect(this.master);

    // strike: filtered noise, brighter and shorter on hard ground
    const src = ac.createBufferSource();
    src.buffer = this.noise;
    const f = ac.createBiquadFilter();
    f.type = "lowpass";
    f.frequency.value = 450 + 2600 * hardness;
    f.Q.value = 0.8;
    const g = ac.createGain();
    const decay = 0.05 + 0.08 * (1 - hardness);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, 0.5 * level), t + 0.003);
    g.gain.exponentialRampToValueAtTime(0.0001, t + decay);
    src.connect(f).connect(g).connect(out);
    src.start(t, Math.random() * 0.15);
    src.stop(t + decay + 0.02);

    // weight: a low thump that falls in pitch
    const o = ac.createOscillator();
    o.type = "sine";
    o.frequency.setValueAtTime(110 - 20 * hardness, t);
    o.frequency.exponentialRampToValueAtTime(48, t + 0.1);
    const og = ac.createGain();
    og.gain.setValueAtTime(0.0001, t);
    og.gain.exponentialRampToValueAtTime(Math.max(0.0002, 0.42 * level * (1 - 0.5 * hardness)), t + 0.004);
    og.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
    o.connect(og).connect(out);
    o.start(t);
    o.stop(t + 0.14);

    // on stone: a short bright click
    if (hardness > 0.55) {
      const c = ac.createBufferSource();
      c.buffer = this.noise;
      const hp = ac.createBiquadFilter();
      hp.type = "highpass";
      hp.frequency.value = 2600;
      const cg = ac.createGain();
      cg.gain.setValueAtTime(0.0001, t);
      cg.gain.exponentialRampToValueAtTime(Math.max(0.0002, 0.22 * level * hardness), t + 0.002);
      cg.gain.exponentialRampToValueAtTime(0.0001, t + 0.03);
      c.connect(hp).connect(cg).connect(out);
      c.start(t, Math.random() * 0.1);
      c.stop(t + 0.05);
    }
  }

  dispose() {
    document.removeEventListener("visibilitychange", this.onVisibility);
    void this.ac?.close();
    this.ac = null;
    this.master = null;
    this.noise = null;
  }
}
