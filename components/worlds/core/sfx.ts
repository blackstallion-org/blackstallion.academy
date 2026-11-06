import { soundEnabled } from "@/lib/audio/engine";
import { effectsBus } from "@/lib/audio/mixer";

/**
 * The film's own text sound, synthesised (no files to load): a glitch/hover tick for each word of a headline and a softer one
 * for the sentence. (The per-world opening cues were removed 7 Nov 2026: only the text sound stays.) It goes through the site's effects bus, so they follow the site's sound
 * setting, and stay silent until the browser has allowed audio (the first click, key or touch).
 */
type Rig = { c: AudioContext; out: GainNode };
const live = new Set<GainNode>();
const noiseFor = new WeakMap<AudioContext, AudioBuffer>();

function rig(): Rig | null {
  if (!soundEnabled()) return null;
  const b = effectsBus();
  return b && b.context.state === "running" ? { c: b.context, out: b.node } : null;
}

/** an enveloped gain into the bus: fast attack to `peak`, exponential release */
function env(r: Rig, t: number, attack: number, release: number, peak: number) {
  const g = r.c.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + attack + release);
  g.connect(r.out);
  live.add(g);
  return { g, end: t + attack + release + 0.1 };
}

function tone(r: Rig, g: GainNode, end: number, type: OscillatorType, t: number, f0: number, f1 = f0) {
  const o = r.c.createOscillator();
  o.type = type;
  o.frequency.setValueAtTime(f0, t);
  if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(f1, t + (end - t) * 0.8);
  o.connect(g);
  o.start(t);
  o.stop(end);
  o.onended = () => { o.disconnect(); live.delete(g); g.disconnect(); };
}

function hiss(r: Rig, g: GainNode, end: number, t: number, type: BiquadFilterType, f0: number, f1: number, q = 1) {
  let buf = noiseFor.get(r.c);
  if (!buf) {
    buf = r.c.createBuffer(1, r.c.sampleRate * 2, r.c.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    noiseFor.set(r.c, buf);
  }
  const s = r.c.createBufferSource();
  s.buffer = buf;
  s.loop = true;
  const f = r.c.createBiquadFilter();
  f.type = type;
  f.Q.value = q;
  f.frequency.setValueAtTime(f0, t);
  if (f1 !== f0) f.frequency.exponentialRampToValueAtTime(f1, end - 0.1);
  s.connect(f).connect(g);
  s.start(t);
  s.stop(end);
  s.onended = () => { s.disconnect(); f.disconnect(); };
}

/** a short glitch tick: a stuttered square chirp and a flick of high noise */
function glitch(r: Rig, t: number, peak: number, base: number) {
  for (let i = 0; i < 3; i++) {
    const at = t + i * 0.042;
    const { g, end } = env(r, at, 0.004, 0.03, peak * (1 - i * 0.22));
    tone(r, g, end, "square", at, base * [1, 1.5, 0.75][i], base * [1.2, 1.9, 0.6][i]);
  }
  const n = env(r, t, 0.003, 0.09, peak * 0.9);
  hiss(r, n.g, n.end, t, "highpass", 5200, 9000, 0.7);
}

/** a soft hover tick */
function hover(r: Rig, t: number, peak: number, f: number) {
  const { g, end } = env(r, t, 0.006, 0.12, peak);
  tone(r, g, end, "sine", t, f, f * 1.3);
  const n = env(r, t, 0.002, 0.04, peak * 0.6);
  hiss(r, n.g, n.end, t, "bandpass", f * 3, f * 4, 4);
}

/** a headline pops up word by word, then its sentence follows (the same delays as the CSS) */
function story(words: number) {
  const r = rig();
  if (!r) return;
  const t = r.c.currentTime + 0.04;
  for (let i = 0; i < Math.min(words, 6); i++) {
    const at = t + 0.2 + i * 0.14;
    if (i === 0) glitch(r, at, 0.05, 1900);
    else hover(r, at, 0.045, 1500 + ((i * 370) % 900));
  }
  hover(r, t + 1.25, 0.03, 2300);
}

export const sfx = {
  story,
  /** fade everything that is sounding or scheduled (skip, leaving the page) */
  stop() {
    const r = rig();
    if (!r) return;
    live.forEach((g) => { g.gain.cancelScheduledValues(r.c.currentTime); g.gain.setTargetAtTime(0, r.c.currentTime, 0.08); });
  },
};
