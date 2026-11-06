import { soundEnabled } from "@/lib/audio/engine";
import { effectsBus } from "@/lib/audio/mixer";
import type { WorldId } from "./types";

/**
 * The film's own sound effects, synthesised (no files to load): a glitch/hover tick for each word of a headline and a softer one
 * for the sentence, and one opening cue per world. They go through the site's effects bus, so they follow the site's sound
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

const CUES: Record<WorldId, (r: Rig, t: number) => void> = {
  // dawn: a low swell with air rising through it
  origins(r, t) {
    const a = env(r, t, 2.4, 2.2, 0.22);
    tone(r, a.g, a.end, "sine", t, 46, 62);
    const b = env(r, t + 0.3, 2.2, 2.4, 0.07);
    tone(r, b.g, b.end, "triangle", t + 0.3, 98);
    tone(r, b.g, b.end, "triangle", t + 0.3, 147);
    const n = env(r, t, 2.6, 1.8, 0.05);
    hiss(r, n.g, n.end, t, "bandpass", 220, 2400, 0.8);
  },
  // life: two heartbeats and a shimmer of light
  life(r, t) {
    for (const at of [0, 0.24, 1.05, 1.29]) {
      const { g, end } = env(r, t + at, 0.012, 0.22, at % 1 < 0.1 ? 0.3 : 0.2);
      tone(r, g, end, "sine", t + at, 72, 38);
    }
    [880, 1318.5, 1760, 2637].forEach((f, i) => {
      const at = t + 0.5 + i * 0.16;
      const { g, end } = env(r, at, 0.02, 1.9, 0.03);
      tone(r, g, end, "sine", at, f);
    });
  },
  // legacy: a deep stone boom, dust and a ring of metal
  legacy(r, t) {
    const a = env(r, t, 0.02, 1.7, 0.34);
    tone(r, a.g, a.end, "sine", t, 64, 30);
    const n = env(r, t, 0.01, 1.3, 0.14);
    hiss(r, n.g, n.end, t, "lowpass", 900, 140, 0.6);
    [1, 2.76, 5.4].forEach((m, i) => {
      const { g, end } = env(r, t + 0.04, 0.01, 2.6 - i * 0.6, 0.03 / (i + 1));
      tone(r, g, end, "sine", t + 0.04, 196 * m);
    });
  },
  // beyond: stacked fifths opening upward, a rising sweep and a last spark
  beyond(r, t) {
    [220, 329.6, 440, 659.3].forEach((f, i) => {
      const at = t + i * 0.18;
      const { g, end } = env(r, at, 1.6, 2.4, 0.05 - i * 0.006);
      tone(r, g, end, "sine", at, f);
      tone(r, g, end, "sine", at, f * 1.004);
    });
    const n = env(r, t, 2, 1.4, 0.045);
    hiss(r, n.g, n.end, t, "bandpass", 400, 5200, 1.2);
    const s = env(r, t + 2.1, 0.01, 1.8, 0.035);
    tone(r, s.g, s.end, "sine", t + 2.1, 2637);
  },
};

export const sfx = {
  story,
  world(id: WorldId) {
    const r = rig();
    if (r) CUES[id](r, r.c.currentTime + 0.05);
  },
  /** fade everything that is sounding or scheduled (skip, leaving the page) */
  stop() {
    const r = rig();
    if (!r) return;
    live.forEach((g) => { g.gain.cancelScheduledValues(r.c.currentTime); g.gain.setTargetAtTime(0, r.c.currentTime, 0.08); });
  },
};
