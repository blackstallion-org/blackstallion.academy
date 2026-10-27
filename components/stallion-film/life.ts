import * as THREE from "three";
import type { Marwari } from "@/components/3d/marwari";
import { clamp, mulberry32, wobble } from "./noise";

type Q = THREE.Quaternion;
const DEG = Math.PI / 180;

/**
 * Micro-motion that sits on top of the authored clips: irregular breathing, independent ear flicks, small head and neck
 * corrections, pelvis settling. Noise-driven and event-driven (never one global sine), additive, and removed again before
 * the mixer runs so nothing accumulates. Rotations are in bone-local axes, the same convention the clips were authored in.
 */
export class LifeLayer {
  private bones: Record<string, THREE.Bone | undefined>;
  private applied: { bone: THREE.Bone; q: Q }[] = [];
  private ribScale = new THREE.Vector3(1, 1, 1);
  private ribBone: THREE.Bone | undefined;
  private rng = mulberry32(7);
  private time = 0;
  private breathPhase = 0;
  private flick = { L: { t: 9, amp: 0, dir: 1, next: 1.4 }, R: { t: 9, amp: 0, dir: 1, next: 2.6 } };
  private tailSwishNext = 6;
  flare = 0;
  breathing = 0;
  idleTimeScale = 1;
  /** Set each frame by the director: 0 (resting) .. 1 (running). */
  moving = 0;
  exertion = 0;
  speed = 0;
  /** Request for the tail dynamics: an impulse (rad/s) the secondary motion applies. */
  tailImpulse = 0;
  /** Gaze/attention scale: reduces head corrections while the head is being driven by a clip. */
  headQuiet = 0;

  constructor(horse: Marwari) {
    this.bones = horse.bones;
    this.ribBone = horse.bones.Ribcage;
  }

  private push(name: string, x: number, y: number, z: number) {
    const bone = this.bones[name];
    if (!bone) return;
    const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(x, y, z, "XYZ"));
    bone.quaternion.multiply(q);
    this.applied.push({ bone, q });
  }

  undo() {
    for (const { bone, q } of this.applied) bone.quaternion.multiply(q.clone().invert());
    this.applied.length = 0;
    if (this.ribBone) this.ribBone.scale.divide(this.ribScale);
    this.ribScale.set(1, 1, 1);
  }

  /** Advance the stochastic state (call once per frame, before `undo`/mixer if you like; order does not matter). */
  update(dt: number) {
    this.time += dt;
    const t = this.time;
    // ear flicks: independent Poisson events with a damped swivel, faster and more frequent when the horse is alert or resting
    for (const side of ["L", "R"] as const) {
      const f = this.flick[side];
      f.t += dt;
      f.next -= dt;
      if (f.next <= 0) {
        f.t = 0;
        f.amp = (0.14 + this.rng() * 0.2) * (1 - 0.6 * this.moving);
        f.dir = this.rng() < 0.5 ? -1 : 1;
        f.next = 1.2 + this.rng() * 5.5 / (1 + this.moving * 2);
      }
    }
    // breathing: slightly irregular rate; deeper and coupled to effort when running
    const restRate = 0.24 + 0.05 * wobble(t * 0.2, 4);
    const rate = restRate + this.exertion * (0.75 + 0.5 * this.moving) + 0.08 * this.moving;
    this.breathPhase += rate * dt;
    this.idleTimeScale = 1 + 0.16 * wobble(t * 0.13, 5) + this.exertion * 1.6;
    // occasional tail swish while standing
    this.tailSwishNext -= dt;
    this.tailImpulse = 0;
    if (this.tailSwishNext <= 0 && this.moving < 0.2) {
      this.tailImpulse = (this.rng() < 0.5 ? -1 : 1) * (1.2 + this.rng() * 1.6);
      this.tailSwishNext = 5 + this.rng() * 12;
    }
  }

  apply() {
    const t = this.time;
    const q = 1 - this.moving * 0.85;
    // head and neck: slow corrections on two incommensurate noise layers
    const quiet = 1 - 0.75 * this.headQuiet;
    this.push("Head", wobble(t * 0.45, 11) * 1.3 * DEG * q * quiet, 0, wobble(t * 0.33, 12) * 2.0 * DEG * q * quiet);
    this.push("Neck_2", 0, wobble(t * 0.21, 13) * 0.9 * DEG * q, wobble(t * 0.27, 14) * 1.4 * DEG * q * quiet);
    this.push("Neck_1", wobble(t * 0.19, 15) * 0.8 * DEG * q, 0, 0);
    // pelvis settles from one hip to the other
    this.push("Pelvis", 0, wobble(t * 0.11, 16) * 0.9 * DEG * (1 - this.moving), 0);
    // ears: noise + flick events, independently
    for (const [side, sgn] of [["L", 1], ["R", -1]] as const) {
      const f = this.flick[side];
      const ev = f.amp * Math.exp(-f.t / 0.1) * Math.sin((2 * Math.PI * f.t) / 0.24) * f.dir;
      const drift = wobble(t * 0.8, side === "L" ? 21 : 22) * 0.12 * (1 - this.moving * 0.7);
      // at speed the ears lean back
      const back = this.moving * 0.32 * (0.6 + 0.4 * clamp(this.speed / 12, 0, 1));
      this.push(`Ear_${side}`, ev * 0.35 + back, (ev + drift) * sgn, 0);
    }
    // breathing: ribcage swell (the idle clip supplies the resting baseline), plus extra depth with effort
    const b = 0.5 - 0.5 * Math.cos(2 * Math.PI * this.breathPhase);
    const amp = 0.011 * this.moving + 0.05 * this.exertion;
    this.breathing = b;
    if (this.ribBone && amp > 0) {
      this.ribScale.set(1 + amp * b, 1 + amp * 0.34 * b, 1 + amp * 0.4 * b);
      this.ribBone.scale.multiply(this.ribScale);
    }
    this.flare = clamp((0.12 + 0.88 * this.exertion) * (0.35 + 0.65 * b), 0, 1);
  }
}

/* ------------------------------------------------------------------ secondary motion: tail and mane as damped springs */
type Seg = { bone: THREE.Bone; k: number; c: number; x: number; z: number; vx: number; vz: number; applied?: Q };

export class SecondaryMotion {
  private tail: Seg[] = [];
  private mane: Seg[] = [];
  private wind = new THREE.Vector3();
  private time = 0;
  /** Sign conventions are fixed here once, against the authored clips (tail raise = -X, streaming back = +X for the tail). */
  private tailStream = 1;

  constructor(horse: Marwari) {
    const mk = (prefix: string, n: number, k: number, kd: number, c: number) => {
      const out: Seg[] = [];
      for (let i = 1; i <= n; i++) {
        const bone = horse.bones[`${prefix}_${i}`];
        if (bone) out.push({ bone, k: k - kd * (i - 1), c: c, x: 0, z: 0, vx: 0, vz: 0 });
      }
      return out;
    };
    this.tail = mk("Tail", 4, 46, 7, 5.2);
    this.mane = mk("Mane", 4, 70, 6, 6.4);
  }

  setWind(w: THREE.Vector3) {
    this.wind.copy(w);
  }

  undo() {
    for (const s of [...this.tail, ...this.mane]) {
      if (s.applied) s.bone.quaternion.multiply(s.applied.clone().invert());
      s.applied = undefined;
    }
  }

  /**
   * dt in seconds. `aF`/`aL`: horse acceleration (m/s²) forward and to the left; `speed` m/s; `impulse` rad/s for a tail swish.
   * Frame-rate independent: fixed sub-steps of at most 1/120 s, semi-implicit Euler.
   */
  step(dt: number, aF: number, aL: number, speed: number, impulse: number) {
    this.time += dt;
    const gust = 0.5 + 0.5 * wobble(this.time * 0.6, 31);
    const wx = this.wind.x * gust;
    const stream = clamp((speed / 12) ** 1.3, 0, 1);
    let remaining = Math.min(dt, 0.1);
    while (remaining > 1e-6) {
      const h = Math.min(remaining, 1 / 120);
      remaining -= h;
      this.tail.forEach((s, i) => {
        // target: the tail streams back (+X) and lifts with speed; reaction to acceleration swings it the other way
        const tx = this.tailStream * (0.03 + 0.2 * stream) * (1 + 0.1 * i); // at a gallop the dock lifts and the hair streams back (about 50 degrees over the four bones)
        const ax = s.k * (tx - s.x) - s.c * s.vx - 0.018 * aF * (1 + i * 0.4);
        const az = s.k * (0 - s.z) - s.c * s.vz - 0.02 * aL * (1 + i * 0.4) + 0.004 * wx * (1 + i * 0.3);
        s.vx += ax * h;
        s.vz += az * h;
        if (i === 0 && impulse !== 0) s.vz += impulse * 0.5;
        s.x = clamp(s.x + s.vx * h, -0.9, 0.9);
        s.z = clamp(s.z + s.vz * h, -0.9, 0.9);
      });
      this.mane.forEach((s, i) => {
        const tx = (0.015 + 0.14 * stream) * (1 + 0.2 * i);
        const ax = s.k * (tx - s.x) - s.c * s.vx - 0.012 * aF;
        const az = s.k * (0.02 * (1 + i) - s.z) - s.c * s.vz - 0.014 * aL + 0.006 * wx;
        s.vx += ax * h;
        s.vz += az * h;
        s.x = clamp(s.x + s.vx * h, -0.7, 0.7);
        s.z = clamp(s.z + s.vz * h, -0.7, 0.7);
      });
    }
  }

  apply() {
    for (const s of [...this.tail, ...this.mane]) {
      const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(s.x, 0, s.z, "XYZ"));
      s.bone.quaternion.multiply(q);
      s.applied = q;
    }
  }
}
