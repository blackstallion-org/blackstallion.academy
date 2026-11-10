import type { Bone } from "./build";
import type { Figure, HorsePreset } from "./types";

/** Local motion of one bone: rotation about its pivot (radians, screen space, y down), vertical scale, translation. */
export type Local = { a: number; sy: number; tx: number; ty: number };

const TAU = Math.PI * 2;
const D = Math.PI / 180;

type Gait = { period: number; phase: Record<"FL" | "FR" | "HL" | "HR", number>; swing: number; fold: number; pitch: number; bob: number; neck: number };

/**
 * Footfall timing as fractions of the stride. Transverse gallop: hind pair then fore pair, each slightly split.
 * Canter: three-beat (one hind, then the diagonal pair, then the leading fore). Walk: four-beat lateral sequence.
 */
const GAITS: Partial<Record<HorsePreset, Gait>> = {
  gallop: { period: 0.46, phase: { HL: 0, HR: 0.09, FL: 0.36, FR: 0.46 }, swing: 3.5, fold: 7, pitch: 1.5, bob: 0.016, neck: 3 },
  canter: { period: 0.64, phase: { HL: 0, HR: 0.3, FL: 0.33, FR: 0.62 }, swing: 3, fold: 5, pitch: 1.2, bob: 0.011, neck: 2.5 },
  walk: { period: 1.2, phase: { HL: 0, FL: 0.25, HR: 0.5, FR: 0.75 }, swing: 2.2, fold: 4, pitch: 0.5, bob: 0.004, neck: 1.8 },
  elephant: { period: 1.9, phase: { HL: 0, FL: 0.25, HR: 0.5, FR: 0.75 }, swing: 1.8, fold: 3, pitch: 0.3, bob: 0.004, neck: 2 },
};

/** A seeded pseudo-random value in 0..1. */
const rnd = (seed: number, k: number) => {
  const x = Math.sin(seed * 127.1 + k * 311.7) * 43758.5453;
  return x - Math.floor(x);
};
/** Smooth periodic noise: a sum of incommensurate sines, so it never visibly repeats. */
const drift = (t: number, seed: number, rate = 1) =>
  (Math.sin(t * 0.61 * rate + seed * 3.1) * 0.6 + Math.sin(t * 1.37 * rate + seed * 7.7) * 0.3 + Math.sin(t * 2.71 * rate + seed) * 0.1);

/** An ear or head flick: mostly still, a quick twitch now and then. */
const flick = (t: number, seed: number, every = 4.5) => {
  const cyc = t / every + rnd(seed, 9);
  const k = cyc - Math.floor(cyc);
  const n = Math.floor(cyc);
  return k < 0.08 && rnd(seed, n) > 0.35 ? Math.sin((k / 0.08) * Math.PI) : 0;
};

export type Pose = { locals: Local[]; contacts: { bone: number; phase: number }[] };

/** Poses every bone of a rig at time t (seconds). Each figure runs on its own clock offset from its seed. */
export function pose(bones: Bone[], figures: Figure[], t: number): Pose {
  const locals: Local[] = bones.map(() => ({ a: 0, sy: 1, tx: 0, ty: 0 }));
  const contacts: Pose["contacts"] = [];
  const horsePitch: number[] = [];

  figures.forEach((f, fi) => {
    const tt = t + rnd(f.seed, 1) * 10;
    if (f.kind !== "horse") return;
    const fwd = -f.dir; // a negative screen rotation swings a hanging limb toward +x
    const g = GAITS[f.preset];
    const B = (role: string) => bones.findIndex((b) => b.figure === fi && b.role === role);
    if (g) {
      const speed = 0.94 + rnd(f.seed, 2) * 0.12;
      const ph = (tt * speed) / g.period;
      (["FL", "FR", "HL", "HR"] as const).forEach((k) => {
        const p = ph - g.phase[k];
        const s = Math.sin(TAU * p);
        const c = Math.cos(TAU * p);
        // Upper limb swings forward and back; the lower limb folds only while the hoof is in the air (swinging forward).
        locals[B(`${k}u`)].a = fwd * g.swing * D * s;
        const fold = Math.pow(Math.max(0, c), 1.4) * g.fold * D;
        locals[B(`${k}l`)].a = (k[0] === "F" ? -fwd : fwd) * fold * (k[0] === "F" ? 1 : 0.7);
        contacts.push({ bone: B(`${k}l`), phase: (((p - 0.25) % 1) + 1) % 1 });
      });
      const body = Math.sin(TAU * ph * 2 - 1.1);
      const pitch = Math.sin(TAU * ph) * g.pitch * D * fwd;
      horsePitch[fi] = pitch;
      // The whole painting rides the stride: it rises and leans as one piece, so nothing stretches.
      locals[0].a += pitch * 0.9;
      locals[0].ty += -Math.abs(body) * g.bob;
      locals[B("root")].a = pitch * 0.25;
      locals[B("neck")].a = -fwd * Math.sin(TAU * ph + 0.6) * g.neck * D + drift(tt, f.seed, 0.4) * D;
      locals[B("head")].a = -fwd * Math.sin(TAU * ph + 1.4) * g.neck * 0.5 * D;
      locals[B("tail")].a = -fwd * (Math.sin(TAU * ph + 2) * 5 + drift(tt, f.seed + 4, 0.8) * 4) * D;
      return;
    }
    // Still horses: weight shift, a slow head, an ear and tail flick, breathing.
    const breathe = Math.sin(tt * (f.preset === "lying" ? 1.1 : 1.6));
    locals[B("root")].sy = 1 + breathe * 0.006;
    horsePitch[fi] = 0;
    if (f.preset === "rear") {
      // The whole horse rocks back on its hind legs; the forelegs paddle.
      const rise = (Math.sin(tt * 1.7) * 0.5 + 0.5) * 5 * D;
      locals[B("root")].a = -fwd * rise;
      horsePitch[fi] = -fwd * rise;
      (["FL", "FR"] as const).forEach((k, i) => {
        locals[B(`${k}u`)].a = fwd * Math.sin(tt * 4.2 + i * 1.8) * 14 * D;
        locals[B(`${k}l`)].a = -fwd * (Math.sin(tt * 4.2 + i * 1.8 + 1) * 0.5 + 0.5) * 22 * D;
      });
    } else if (f.preset !== "lying") {
      const shift = drift(tt, f.seed, 0.35);
      locals[B("root")].a = shift * 0.6 * D;
      // One hind leg rests and re-takes the weight now and then.
      locals[B("HLl")].a = fwd * Math.max(0, Math.sin(tt * 0.31 + f.seed)) * 10 * D;
    }
    const still = f.preset === "lying" ? 0.4 : 1;
    locals[B("neck")].a = (drift(tt, f.seed + 2, 0.5) * 3.5 + flick(tt, f.seed + 3, 6) * 4 * -fwd) * D * still;
    locals[B("head")].a = (drift(tt, f.seed + 5, 0.7) * 3 + flick(tt, f.seed + 6, 3.2) * 5) * D * still;
    locals[B("tail")].a = (drift(tt, f.seed + 7, 1.6) * 7 + flick(tt, f.seed + 8, 2.6) * 10) * D;
  });

  figures.forEach((f, fi) => {
    if (f.kind !== "human") return;
    const tt = t + rnd(f.seed, 1) * 10;
    const B = (role: string) => bones.findIndex((b) => b.figure === fi && b.role === role);
    const set = (role: string, a: number) => {
      const i = B(role);
      if (i > 0) locals[i].a = a * D;
    };
    const torso = B("torso");
    const breathe = Math.sin(tt * (1.4 + rnd(f.seed, 3) * 0.4));
    switch (f.preset) {
      case "ride": {
        const hp = f.on !== undefined ? horsePitch[f.on] ?? 0 : 0;
        // The rider's seat absorbs the horse: the torso counters most of its pitch and sways a little.
        locals[torso].a = -hp * 0.75 + drift(tt, f.seed, 0.9) * 1.2 * D;
        locals[torso].sy = 1 + breathe * 0.004;
        set("hhead", drift(tt, f.seed + 1, 0.6) * 3);
        // The weapon arm moves least: a lance or sword painted past the hand does not travel with it.
        set("armAu", Math.sin(tt * 2.1 + f.seed) * 2.5 + drift(tt, f.seed + 2) * 1.5);
        set("armAl", Math.sin(tt * 2.1 + f.seed + 0.8) * 2.5);
        set("armBu", drift(tt, f.seed + 3, 1.2) * 4);
        set("armBl", drift(tt, f.seed + 4, 1.2) * 4);
        set("legAl", Math.sin(tt * 2.6 + f.seed) * 3);
        set("legBl", Math.sin(tt * 2.6 + f.seed + 1) * 3);
        break;
      }
      case "walk": {
        const ph = tt / 1.15;
        locals[torso].ty = -Math.abs(Math.sin(TAU * ph)) * 0.004;
        locals[torso].a = drift(tt, f.seed, 0.5) * 1 * D;
        set("legAu", Math.sin(TAU * ph) * 13);
        set("legAl", Math.max(0, Math.cos(TAU * ph)) * 16);
        set("legBu", -Math.sin(TAU * ph) * 13);
        set("legBl", Math.max(0, -Math.cos(TAU * ph)) * 16);
        set("armAu", -Math.sin(TAU * ph) * 4);
        set("armBu", Math.sin(TAU * ph) * 7);
        set("hhead", drift(tt, f.seed + 1, 0.6) * 3);
        break;
      }
      case "work":
      case "crew": {
        const rate = f.preset === "work" ? 2.4 : 1.3;
        locals[torso].a = (Math.sin(tt * rate * 0.5) * 1.6 + drift(tt, f.seed, 0.4)) * D;
        locals[torso].sy = 1 + breathe * 0.005;
        set("armAu", Math.sin(tt * rate) * (f.preset === "work" ? 10 : 9));
        set("armAl", Math.sin(tt * rate + 0.9) * 9);
        set("armBu", Math.sin(tt * rate * 0.5 + 2) * 4);
        set("armBl", Math.sin(tt * rate * 0.5 + 2.6) * 5);
        set("hhead", drift(tt, f.seed + 1, 0.8) * 3.5);
        break;
      }
      default: {
        // Standing or seated: breathing, a slow weight shift, a head that turns now and then, small hand movements.
        locals[torso].a = drift(tt, f.seed, 0.3) * (f.preset === "seated" ? 0.8 : 1.4) * D;
        locals[torso].sy = 1 + breathe * 0.007;
        set("hhead", drift(tt, f.seed + 1, 0.45) * 4 + flick(tt, f.seed + 2, 5.5) * 5);
        set("armAu", drift(tt, f.seed + 3, 0.6) * 3.5);
        set("armAl", drift(tt, f.seed + 4, 0.8) * 4);
        set("armBu", drift(tt, f.seed + 5, 0.6) * 3);
        set("armBl", drift(tt, f.seed + 6, 0.8) * 3.5);
      }
    }
  });
  return { locals, contacts };
}
