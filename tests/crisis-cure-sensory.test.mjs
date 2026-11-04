import { test, beforeEach, after } from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { createJiti } from "jiti";
import { root } from "./helpers/load-ts.mjs";

// The Crisis & Cure slider's breath (WebAudio) and haptics must never sound or buzz unless the visitor has the site's Sound
// toggle on, has interacted, and has not asked for reduced motion. These tests run the real modules against a fake browser.
// One shared module cache so lib/audio/engine.ts is the same instance for the breath cue and the test.
const jiti = createJiti(import.meta.url, { alias: { "@": root }, moduleCache: true, fsCache: false });
const load = (file) => jiti.import(path.join(root, file));

const PEAK_DBFS = 20 * Math.log10(0.05);

class FakeParam {
  constructor(log, name) {
    this.log = log;
    this.name = name;
    this.value = 0;
  }
  setValueAtTime(v, t) { this.value = v; this.log.push({ param: this.name, op: "set", v, t }); }
  linearRampToValueAtTime(v, t) { this.log.push({ param: this.name, op: "ramp", v, t }); }
  setTargetAtTime(v, t, tc) { this.log.push({ param: this.name, op: "target", v, t, tc }); }
  cancelScheduledValues(t) { this.log.push({ param: this.name, op: "cancel", t }); }
}
class FakeNode {
  constructor(ac, kind) {
    this.kind = kind;
    this.gain = new FakeParam(ac.log, `${kind}#${ac.nodes.length}.gain`);
    this.frequency = new FakeParam(ac.log, `${kind}.frequency`);
    this.Q = new FakeParam(ac.log, `${kind}.Q`);
    this.playbackRate = new FakeParam(ac.log, `${kind}.rate`);
    ac.nodes.push(this);
  }
  connect(n) { return n; }
  start() {}
}
const contexts = [];
class FakeAudioContext {
  constructor() {
    this.log = [];
    this.nodes = [];
    this.sampleRate = 8000;
    this.currentTime = 0;
    this.state = "suspended";
    this.destination = {};
    this.calls = [];
    contexts.push(this);
  }
  createGain() { return new FakeNode(this, "gain"); }
  createBiquadFilter() { return new FakeNode(this, "biquad"); }
  createBufferSource() { return new FakeNode(this, "source"); }
  createOscillator() { return new FakeNode(this, "osc"); }
  createBuffer(_c, n) { const data = new Float32Array(n); return { getChannelData: () => data }; }
  async resume() { this.state = "running"; this.calls.push("resume"); }
  async suspend() { this.state = "suspended"; this.calls.push("suspend"); }
  async close() { this.state = "closed"; this.calls.push("close"); }
}

let store;
let reduced;
let videos;
let vibrations;
let activated;
const listeners = new Set();

function installBrowser() {
  store = new Map();
  reduced = false;
  videos = [];
  vibrations = [];
  activated = true;
  contexts.length = 0;
  globalThis.window = {
    AudioContext: FakeAudioContext,
    localStorage: { getItem: (k) => store.get(k) ?? null, setItem: (k, v) => store.set(k, String(v)), removeItem: (k) => store.delete(k) },
    matchMedia: (q) => ({ matches: /reduce/.test(q) ? reduced : false, addEventListener() {}, removeEventListener() {} }),
    addEventListener() {},
    removeEventListener() {},
  };
  globalThis.document = {
    hidden: false,
    querySelectorAll: () => videos,
    addEventListener: (_t, f) => listeners.add(f),
    removeEventListener: (_t, f) => listeners.delete(f),
  };
  Object.defineProperty(globalThis, "navigator", {
    configurable: true,
    value: {
      vibrate: (p) => { vibrations.push(p); return true; },
      get userActivation() { return { hasBeenActive: activated }; },
    },
  });
}

beforeEach(async () => {
  installBrowser();
  const engine = await load("lib/audio/engine.ts");
  // reset the engine's module state: sound ON (the site default) but not yet unlocked by a gesture
  engine.setSound(true);
  engine.disposeSoundscape();
});

after(() => {
  delete globalThis.window;
  delete globalThis.document;
});

test("breath never starts before the visitor's gesture has unlocked sound", async () => {
  const { BreathCue } = await load("lib/audio/breath.ts");
  const cue = new BreathCue();
  assert.equal(cue.engage(), false);
  assert.equal(contexts.length, 0, "no AudioContext may be created before a gesture");
});

test("breath is silent and creates nothing while the site's Sound toggle is off", async () => {
  const engine = await load("lib/audio/engine.ts");
  const { BreathCue } = await load("lib/audio/breath.ts");
  engine.setSound(false);
  engine.unlockSoundFromGesture();
  const cue = new BreathCue();
  assert.equal(cue.engage(), false);
  assert.equal(cue.prime(), false);
  assert.equal(contexts.length, 0);
});

test("breath is silent under reduced motion even with Sound on and a gesture", async () => {
  const engine = await load("lib/audio/engine.ts");
  const { BreathCue } = await load("lib/audio/breath.ts");
  reduced = true;
  engine.unlockSoundFromGesture();
  const cue = new BreathCue();
  assert.equal(cue.engage(), false);
  assert.equal(contexts.length, 0);
});

test("an unmuted film keeps the sound stage: no breath over it", async () => {
  const engine = await load("lib/audio/engine.ts");
  const { BreathCue } = await load("lib/audio/breath.ts");
  engine.unlockSoundFromGesture();
  videos = [{ paused: false, muted: false, volume: 1 }];
  const cue = new BreathCue();
  assert.equal(cue.engage(), false);
  assert.equal(contexts.length, 0);
});

test("with Sound on and a gesture the breath fades in under its ceiling, then fades out and parks", async (t) => {
  t.mock.timers.enable({ apis: ["setTimeout", "setInterval"] });
  const engine = await load("lib/audio/engine.ts");
  const { BreathCue, BREATH_PEAK } = await load("lib/audio/breath.ts");
  engine.unlockSoundFromGesture();
  const cue = new BreathCue();
  assert.equal(cue.engage(1), true);
  assert.equal(contexts.length, 1);
  const ac = contexts[0];
  assert.ok(ac.calls.includes("resume"), "context is resumed inside the gesture");

  const masters = ac.log.filter((e) => e.op === "target");
  assert.ok(masters.length >= 1, "master gain is ramped, never jumped");
  for (const e of masters) {
    assert.ok(e.v <= BREATH_PEAK + 1e-9, `target ${e.v} exceeds the ceiling`);
    assert.ok(e.tc > 0, "every level change has a time constant (a fade)");
  }
  assert.ok(20 * Math.log10(BREATH_PEAK) <= PEAK_DBFS + 0.01 && BREATH_PEAK <= 0.05, "ceiling is at most about -26 dBFS");
  // the inhale/exhale envelope is scheduled on the audio clock and stays within 0..1
  const ramps = ac.log.filter((e) => e.op === "ramp");
  assert.ok(ramps.length > 0 && ramps.every((e) => e.v >= 0 && e.v <= 1));

  cue.release();
  const last = ac.log.filter((e) => e.op === "target").at(-1);
  assert.equal(last.v, 0, "release fades the master gain to zero");
  assert.ok(last.tc >= 0.2, "and not abruptly");
  t.mock.timers.tick(1000);
  assert.ok(ac.calls.includes("suspend"), "the context is parked after the fade");
  assert.equal(cue.active, false);
  cue.dispose();
});

test("switching Sound off mid-breath fades it out at once", async (t) => {
  t.mock.timers.enable({ apis: ["setTimeout", "setInterval"] });
  const engine = await load("lib/audio/engine.ts");
  const { BreathCue } = await load("lib/audio/breath.ts");
  engine.unlockSoundFromGesture();
  const cue = new BreathCue();
  assert.equal(cue.engage(0.5), true);
  engine.setSound(false);
  assert.equal(cue.active, false);
  const last = contexts[0].log.filter((e) => e.op === "target").at(-1);
  assert.equal(last.v, 0);
  t.mock.timers.tick(400);
  assert.ok(contexts[0].calls.includes("suspend"));
  cue.dispose();
});

test("drive() does nothing unless the cue was engaged, and respects the ceiling", async (t) => {
  t.mock.timers.enable({ apis: ["setTimeout", "setInterval"] });
  const engine = await load("lib/audio/engine.ts");
  const { BreathCue, BREATH_PEAK } = await load("lib/audio/breath.ts");
  engine.unlockSoundFromGesture();
  const cue = new BreathCue();
  cue.drive(1);
  assert.equal(contexts.length, 0);
  assert.equal(cue.engage(0.2), true);
  cue.drive(50); // out-of-range input is clamped
  for (const e of contexts[0].log.filter((x) => x.op === "target")) assert.ok(e.v <= BREATH_PEAK + 1e-9);
  cue.dispose();
});

test("haptics: short, only where supported, only with Sound on and no reduced motion", async () => {
  const engine = await load("lib/audio/engine.ts");
  const { haptic, hapticsAllowed, HAPTIC_MAX_MS } = await load("lib/sensory.ts");

  assert.equal(haptic(6), true);
  assert.deepEqual(vibrations, [6]);
  haptic(500);
  assert.equal(vibrations.at(-1), HAPTIC_MAX_MS, "a pulse is capped");

  vibrations.length = 0;
  reduced = true;
  assert.equal(hapticsAllowed(), false);
  assert.equal(haptic(6), false);
  reduced = false;

  engine.setSound(false);
  assert.equal(haptic(6), false, "Sound off means no haptics either");
  engine.setSound(true);

  activated = false;
  assert.equal(haptic(6), false, "no vibration before the page has had any user activation");
  activated = true;

  Object.defineProperty(globalThis, "navigator", { configurable: true, value: {} });
  assert.equal(hapticsAllowed(), false, "no Vibration API, no haptics");
  assert.equal(haptic(6), false);
  assert.equal(vibrations.length, 0);
});

test("reduced-motion check fails closed when the preference cannot be read", async () => {
  const { prefersReducedMotion } = await load("lib/sensory.ts");
  globalThis.window.matchMedia = () => { throw new Error("blocked"); };
  assert.equal(prefersReducedMotion(), true);
});
