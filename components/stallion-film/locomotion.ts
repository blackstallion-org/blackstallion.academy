import * as THREE from "three";
import type { Marwari } from "@/components/3d/marwari";
import { clamp, damp, smoothstep } from "./noise";

/* ------------------------------------------------------------------ gait data (authored in Blender, see tools/blender/03_animation/stage11_gaits.py) */
export type GaitSpec = {
  v: number;
  T: number;
  strideLength: number;
  strideFrequency: number;
  lead: "R" | "L" | null;
  contacts: Record<string, [number, number]>;
  airborneFraction: number;
};
export type GaitTable = Record<string, GaitSpec>;

export async function loadGaits(url = "/models/marwari-gaits.json"): Promise<GaitTable> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`gaits ${res.status}`);
  return (await res.json()) as GaitTable;
}

export type GaitName = "stand" | "walk" | "trot" | "canter" | "gallop" | "sprint";
export type Limb = "FL" | "FR" | "HL" | "HR";
export const LIMBS: Limb[] = ["FL", "FR", "HL", "HR"];
const HOOF_BONE: Record<Limb, string> = { FL: "Hoof_F_L", FR: "Hoof_F_R", HL: "Hoof_B_L", HR: "Hoof_B_R" };
const ROOT_RATE = 14; // 1/s, how fast the root height follows the terrain
const HOOF_LENGTH = 0.14; // rest bone length of the hoof bones (rig audit)
/** The toe point the sensor measures (hoof bone tail) sits this far above the sole: a hoof resting on the surface reads this height. */
export const SOLE_TO_TOE_M = 0.019;
const BANK_DROP_M = 0.15;

export type GroundSampler = {
  height(x: number, z: number): number;
  normal(x: number, z: number, out?: THREE.Vector3): THREE.Vector3;
};

export type Surface = { dust: number; prints: number; color: THREE.Color; hardness: number };

export type FootEvent = { limb: Limb; kind: "touchdown" | "liftoff"; pos: THREE.Vector3; speed: number; impact: number; surface: Surface; heading: number };

export type HoofState = { toe: THREE.Vector3; contact: boolean; height: number; slip: number; contactTime: number; lastTouchdown: THREE.Vector3; touchdownSpeed: number; grounded: number; stanceSlip: number; lockedSlip: number };

/** Speed bands (m/s) at which one gait hands over to the next; the overlap is the cross-fade. */
const BANDS = { walk: [0.12, 0.55], trot: [1.9, 2.6], canter: [4.0, 4.8], gallop: [6.0, 7.8], sprint: [11.0, 12.2] } as const;
const CLIPS = { walk: "Walk", trot: "Trot", canterR: "Canter_R", canterL: "Canter_L", gallopR: "Gallop_R", gallopL: "Gallop_L", sprintR: "Sprint_R", sprintL: "Sprint_L" } as const;

export type Telemetry = {
  time: number;
  speed: number;
  targetSpeed: number;
  accel: number;
  gait: GaitName;
  weights: Record<string, number>;
  phase: number;
  strideLength: number;
  strideFrequency: number;
  lead: "L" | "R";
  heading: number;
  yawRate: number;
  position: [number, number, number];
  pitch: number;
  roll: number;
  exertion: number;
  hooves: Record<Limb, { height: number; contact: boolean; slip: number }>;
};

export class Locomotor {
  readonly root: THREE.Object3D;
  position = new THREE.Vector3();
  heading = 0;
  speed = 0;
  targetSpeed = 0;
  accel = 0;
  yawRate = 0;
  lead: "L" | "R" = "R";
  phase = 0;
  exertion = 0;
  groundY = 0;
  pitch = 0;
  roll = 0;
  gait: GaitName = "stand";
  readonly velocity = new THREE.Vector3();
  readonly accelLocal = new THREE.Vector2();
  readonly hooves: Record<Limb, HoofState>;
  readonly weights: Record<string, number> = {};
  maxAccel = 2.4;
  comfortDecel = 3.2;
  alertShare = 0;
  /** Set by the director: 0..1 how strongly the horse is "listening" (alert pose). */
  alertTarget = 0;
  /** Steering target (world x, z); null keeps the current heading. */
  steerTo: THREE.Vector2 | null = null;
  /** rad/s. 1.1: a trot's turning radius is about 3 m (1.5 left a forefoot 2-3 cm off the ground in every turn). The lateral-acceleration bound below it already caps the canter and faster at 1.0 and under. */
  maxYawRate = 1.1;

  onFootEvent: ((e: FootEvent) => void) | null = null;
  surfaceAt: (x: number, z: number) => Surface = () => ({ dust: 0, prints: 0, color: new THREE.Color("#cfae83"), hardness: 0.5 });

  private ground: GroundSampler;
  private actions = new Map<string, THREE.AnimationAction>();
  private clipDuration = new Map<string, number>();
  private specs: GaitTable;
  private leadMix = 0;
  private time = 0;
  private stopPlaying = false;
  private stopCooldown = 0;
  private readonly tmp = new THREE.Vector3();
  private readonly tmpN = new THREE.Vector3();
  private readonly forward = new THREE.Vector3();
  private readonly prevToe: Record<Limb, THREE.Vector3>;
  private readonly bones: Record<Limb, THREE.Object3D | undefined>;
  private prevVel = new THREE.Vector3();
  private lastTouchTime: Record<Limb, number> = { FL: -9, FR: -9, HL: -9, HR: -9 };
  private smoothPitch = 0;
  private smoothRoll = 0;
  private smoothY = 0;
  private bankSmoothed = 0;
  private stopAction: THREE.AnimationAction | undefined;
  private idleSpeed = 1;
  idleTimeScale = 1;

  constructor(private horse: Marwari, private mixer: THREE.AnimationMixer, gaits: GaitTable, ground: GroundSampler) {
    this.root = horse.root;
    this.ground = ground;
    this.specs = gaits;
    this.hooves = Object.fromEntries(LIMBS.map((l) => [l, { toe: new THREE.Vector3(), contact: false, height: 0, slip: 0, contactTime: 0, lastTouchdown: new THREE.Vector3(), touchdownSpeed: 0, grounded: 0, stanceSlip: 0, lockedSlip: 0 }])) as Record<Limb, HoofState>;
    this.prevToe = Object.fromEntries(LIMBS.map((l) => [l, new THREE.Vector3()])) as Record<Limb, THREE.Vector3>;
    this.bones = { FL: horse.bones[HOOF_BONE.FL], FR: horse.bones[HOOF_BONE.FR], HL: horse.bones[HOOF_BONE.HL], HR: horse.bones[HOOF_BONE.HR] };
    for (const name of Object.values(CLIPS)) {
      const clip = horse.clips.get(name);
      if (!clip) continue;
      const a = mixer.clipAction(clip);
      a.setLoop(THREE.LoopRepeat, Infinity);
      a.enabled = true;
      a.timeScale = 0;
      a.setEffectiveWeight(0);
      a.play();
      this.actions.set(name, a);
      this.clipDuration.set(name, clip.duration);
    }
    const stop = horse.clips.get("Stop");
    if (stop) {
      this.stopAction = mixer.clipAction(stop);
      this.stopAction.setLoop(THREE.LoopOnce, 1);
      this.stopAction.clampWhenFinished = true;
      this.stopAction.setEffectiveWeight(0);
    }
    for (const n of ["Alert", "Idle_Breathing", "Tail_Sway", "Ear_Rotate", "Mane_Sway"]) {
      const clip = horse.clips.get(n);
      if (clip) this.actions.set(n, mixer.clipAction(clip));
    }
    const alert = this.actions.get("Alert");
    if (alert) {
      alert.setLoop(THREE.LoopRepeat, Infinity);
      alert.setEffectiveWeight(0);
      alert.play();
    }
  }

  setGround(g: GroundSampler) {
    this.ground = g;
  }

  /** Terrain height (world y) at a point, for the foot-lock to seat a hoof on the surface under it. */
  groundAt(x: number, z: number) {
    return this.ground.height(x, z);
  }

  /** Put the horse somewhere (heading in radians about +Y, 0 = facing +Z). */
  place(x: number, z: number, heading: number, speed = this.speed) {
    this.position.set(x, 0, z);
    this.heading = heading;
    this.speed = speed;
    this.groundY = this.ground.height(x, z);
    this.smoothY = this.groundY;
    this.smoothPitch = 0;
    this.smoothRoll = 0;
    this.yawRate = 0;
    this.bankSmoothed = 0;
    this.bankDropNow = 0;
    this.steerTo = null;
    this.applyRoot();
    for (const l of LIMBS) this.hooves[l].contact = false;
  }

  /** Current maximum comfortable acceleration at speed v (m/s²): gentle push-off, strongest through the canter. */
  private accelLimit(v: number) {
    return this.maxAccel * (0.45 + 0.55 * smoothstep(0, 3, v)) * (1 - 0.35 * smoothstep(9, 13, v));
  }

  /** Advance the physics and set the animation weights/phase. Call BEFORE mixer.update(). */
  update(dt: number) {
    if (dt <= 0) return;
    this.time += dt;
    const prevSpeed = this.speed;

    // ---- speed: jerk-limited approach to the target (v(t+dt) = clamp(v + a dt, 0, target))
    const dv = this.targetSpeed - this.speed;
    let desired = 0;
    if (dv > 0.02) desired = Math.min(this.accelLimit(this.speed), dv * 2.2 + 0.2);
    else if (dv < -0.02) desired = -Math.min(this.comfortDecel * (this.targetSpeed < 0.1 && this.speed < 2 ? 1.1 : 1), -dv * 2.5 + 0.4);
    this.accel = damp(this.accel, desired, 5, dt);
    this.speed = clamp(this.speed + this.accel * dt, 0, 14);
    if (dv > 0 && this.speed > this.targetSpeed) this.speed = this.targetSpeed;
    if (dv < 0 && this.speed < this.targetSpeed) this.speed = this.targetSpeed;
    if (this.speed < 0.02 && this.targetSpeed === 0) this.speed = 0;
    const vMid = 0.5 * (prevSpeed + this.speed);

    // ---- steering: pure pursuit with a yaw-rate limit that falls with speed (lateral acceleration bound)
    if (this.steerTo && this.speed > 0.15) {
      const dx = this.steerTo.x - this.position.x;
      const dz = this.steerTo.y - this.position.z;
      const want = Math.atan2(dx, dz);
      let diff = want - this.heading;
      diff = Math.atan2(Math.sin(diff), Math.cos(diff));
      const limit = Math.min(this.maxYawRate, 5.2 / Math.max(this.speed, 2));
      const wantRate = clamp(diff * 2.0, -limit, limit);
      this.yawRate = damp(this.yawRate, wantRate, 4, dt);
    } else {
      this.yawRate = damp(this.yawRate, 0, 5, dt);
    }
    this.heading += this.yawRate * dt;
    this.forward.set(Math.sin(this.heading), 0, Math.cos(this.heading));
    this.position.addScaledVector(this.forward, vMid * dt);
    this.velocity.copy(this.forward).multiplyScalar(this.speed);
    // acceleration in the horse's frame (for tail/mane dynamics)
    this.tmp.copy(this.velocity).sub(this.prevVel).divideScalar(dt);
    this.prevVel.copy(this.velocity);
    this.accelLocal.set(this.tmp.dot(this.forward), this.tmp.x * Math.cos(this.heading) - this.tmp.z * Math.sin(this.heading));

    // lead follows the direction of the turn (inside leg leads)
    if (this.yawRate > 0.08) this.lead = "L";
    else if (this.yawRate < -0.08) this.lead = "R";
    this.leadMix = damp(this.leadMix, this.lead === "L" ? 1 : 0, 3, dt);

    // ---- gait blend from speed
    const v = this.speed;
    const s0 = smoothstep(BANDS.walk[0], BANDS.walk[1], v);
    const s1 = smoothstep(BANDS.trot[0], BANDS.trot[1], v);
    const s2 = smoothstep(BANDS.canter[0], BANDS.canter[1], v);
    const s3 = smoothstep(BANDS.gallop[0], BANDS.gallop[1], v);
    const s4 = smoothstep(BANDS.sprint[0], BANDS.sprint[1], v);
    const gw = { walk: s0 - s1, trot: s1 - s2, canter: s2 - s3, gallop: s3 - s4, sprint: s4 };
    const moving = s0;
    const lm = this.leadMix;
    const W: Record<string, number> = {
      [CLIPS.walk]: gw.walk, [CLIPS.trot]: gw.trot,
      [CLIPS.canterR]: gw.canter * (1 - lm), [CLIPS.canterL]: gw.canter * lm,
      [CLIPS.gallopR]: gw.gallop * (1 - lm), [CLIPS.gallopL]: gw.gallop * lm,
      [CLIPS.sprintR]: gw.sprint * (1 - lm), [CLIPS.sprintL]: gw.sprint * lm,
    };
    let top = 0;
    let wTotal = 0;
    for (const [name, w] of Object.entries(W)) {
      wTotal += w;
      if (w > top) { top = w; this.dominantClip = name; }
    }
    this.gaitPurity = wTotal > 0 ? top / wTotal : 1;
    // stride length blends with the weights; frequency follows from v = L f
    let Lsum = 0;
    let wsum = 0;
    for (const [name, w] of Object.entries(W)) {
      if (w <= 0) continue;
      const spec = this.specs[name];
      if (!spec) continue;
      Lsum += spec.strideLength * w;
      wsum += w;
    }
    const L = wsum > 0 ? Lsum / wsum : 1.44;
    const f = v / L;
    this.phase = (this.phase + f * dt) % 1;
    for (const [name, w] of Object.entries(W)) {
      const a = this.actions.get(name);
      if (!a) continue;
      a.setEffectiveWeight(w);
      a.timeScale = 0;
      a.time = this.phase * (this.clipDuration.get(name) ?? 1);
    }
    this.weights.Gait = moving;
    this.gait = gw.sprint > 0.5 ? "sprint" : gw.gallop > 0.5 ? "gallop" : gw.canter > 0.5 ? "canter" : gw.trot > 0.5 ? "trot" : gw.walk > 0.5 ? "walk" : "stand";
    this.strideLengthNow = L;
    this.strideFreqNow = f;

    // ---- stand-group layers: idle / alert / stop share (1 - moving)
    const stand = 1 - moving;
    this.alertShare = damp(this.alertShare, this.alertTarget, 2.2, dt);
    // halting: when slowing to a stop, play the weight-transfer clip once
    this.stopCooldown = Math.max(0, this.stopCooldown - dt);
    if (this.stopAction) {
      if (this.targetSpeed < 0.1 && prevSpeed > 0.9 && this.speed <= 0.9 && !this.stopPlaying && this.stopCooldown === 0) {
        this.stopAction.reset().play();
        this.stopPlaying = true;
        this.stopCooldown = 4;
      }
      if (this.stopPlaying && !this.stopAction.isRunning()) this.stopPlaying = false;
      if (this.targetSpeed > 0.5) this.stopAction.stop();
    }
    const stopShare = this.stopPlaying ? 0.85 : 0;
    this.stopAction?.setEffectiveWeight(stand * stopShare);
    const alertW = stand * this.alertShare * (1 - stopShare);
    const idleW = Math.max(0, stand * (1 - this.alertShare) * (1 - stopShare));
    this.actions.get("Alert")?.setEffectiveWeight(alertW);
    const idle = this.actions.get("Idle_Breathing");
    idle?.setEffectiveWeight(idleW);
    if (idle) idle.timeScale = this.idleTimeScale;
    // layers on bones the gaits do not drive
    this.actions.get("Ear_Rotate")?.setEffectiveWeight(0.75 * (1 - 0.8 * smoothstep(3, 9, v)));
    this.actions.get("Mane_Sway")?.setEffectiveWeight(0.8);
    this.actions.get("Tail_Sway")?.setEffectiveWeight(0.8 * stand);

    // ---- exertion (breathing depth): rises with speed squared, recovers slowly
    const exTarget = clamp((v / 12) ** 2, 0, 1);
    this.exertion += (exTarget - this.exertion) * (1 - Math.exp(-dt / (exTarget > this.exertion ? 5 : 16)));

    this.updateRoot(dt);
  }

  private dominantClip = "";
  /** 1 while one gait clip carries the walk, falling toward 0.5 in the middle of a cross-fade between two. */
  gaitPurity = 1;

  /** Where the hoof is in its authored stance (0 touchdown .. 1 lift-off), or null while it should be in the air or no gait clip leads. */
  stancePhase(l: Limb): number | null {
    const c = this.specs[this.dominantClip]?.contacts[l];
    if (!c) return null;
    const x = (((this.phase - c[0]) % 1) + 1) % 1;
    return x < c[1] ? x / c[1] : null;
  }

  strideLengthNow = 1.44;
  strideFreqNow = 0;

  /** Fit the root to the terrain under the four feet (height, pitch, roll) and lean into turns. */
  private updateRoot(dt: number) {
    const x = this.position.x;
    const z = this.position.z;
    const fx = Math.sin(this.heading);
    const fz = Math.cos(this.heading);
    const rx = fz; // the horse's left in world xz (+X when heading is +Z)
    const rz = -fx;
    // the follow filters lag by speed / rate along the slope; sampling that far ahead cancels the lag (first order)
    const ahead = Math.min(1.0, this.speed / ROOT_RATE);
    const ax = x + fx * ahead;
    const az = z + fz * ahead;
    const hF = this.ground.height(ax + fx * 0.9, az + fz * 0.9);
    const hH = this.ground.height(ax - fx * 0.9, az - fz * 0.9);
    const hL = this.ground.height(ax + rx * 0.35, az + rz * 0.35);
    const hR = this.ground.height(ax - rx * 0.35, az - rz * 0.35);
    const h0 = this.ground.height(ax, az);
    const target = 0.5 * h0 + 0.125 * (hF + hH + hL + hR);
    const pitchT = -Math.atan2(hF - hH, 1.8);
    const rollT = Math.atan2(hL - hR, 0.7);
    this.smoothY = damp(this.smoothY, target, ROOT_RATE, dt);
    this.smoothPitch = damp(this.smoothPitch, pitchT, 10, dt);
    this.smoothRoll = damp(this.smoothRoll, rollT, 10, dt);
    const bankT = Math.atan((this.speed * this.yawRate) / 9.81) * this.bankGain;
    this.bankSmoothed = damp(this.bankSmoothed, bankT, 5, dt);
    this.bankDropNow = this.bankDrop * Math.abs(Math.sin(this.bankSmoothed));
    this.groundY = this.smoothY;
    this.pitch = this.smoothPitch;
    this.roll = this.smoothRoll - this.bankSmoothed;
    this.position.y = this.groundY;
    this.applyRoot();
  }

  /**
   * The body sits lower in a banked turn. The roll lifts the outside feet (they are about 0.2 m from the roll axis) and sinks the
   * inside ones, so the outside legs, already near full stretch, have to reach 4-6 cm farther: the root drops by BANK_DROP_M per
   * unit of sin(bank), 4 cm at the 17 degrees of a sprint turn. Measured: 0.15 left the least hover; 0.30 sank the feet.
   */
  bankDrop = BANK_DROP_M;
  /** Share of the lateral-acceleration lean (atan(v * yaw rate / g)) the body takes. */
  bankGain = 0.6;
  private bankDropNow = 0;

  private applyRoot() {
    this.root.position.copy(this.position);
    this.root.position.y -= this.bankDropNow;
    this.root.rotation.set(this.pitch, this.heading, this.roll, "YXZ");
    this.root.updateMatrixWorld(true);
  }

  /** Deepest toe penetration measured on the last `sense` (m) before the correction, and the correction applied. */
  penetration = 0;
  groundCorrection = 0;

  /** Measure hoof contact from the skeleton itself and emit touchdown/lift-off events. Call AFTER mixer.update(). */
  sense(dt: number) {
    let pen = 0;
    for (const l of LIMBS) {
      const bone = this.bones[l];
      const h = this.hooves[l];
      if (!bone) continue;
      bone.updateWorldMatrix(true, false);
      this.prevToe[l].copy(h.toe);
      h.toe.set(0, HOOF_LENGTH, 0).applyMatrix4(bone.matrixWorld);
      h.height = h.toe.y - this.ground.height(h.toe.x, h.toe.z);
      pen = Math.max(pen, -h.height);
    }
    // terrain contact: a hoof that would sink into the ground pushes the body up (instant), and the follow filter lets it settle back
    this.penetration = pen;
    this.groundCorrection = 0;
    if (pen > 0.003) {
      const k = Math.min(pen, 0.25);
      this.groundCorrection = k;
      this.smoothY += k;
      this.groundY += k;
      this.position.y += k;
      this.root.position.y += k;
      this.root.updateMatrixWorld(true);
      for (const l of LIMBS) {
        this.hooves[l].toe.y += k;
        this.hooves[l].height += k;
      }
    }
    for (const l of LIMBS) {
      const h = this.hooves[l];
      if (!this.bones[l]) continue;
      const was = h.contact;
      const now = was ? h.height < 0.085 : h.height < 0.04;
      // slip: horizontal world speed of the toe while it is planted on the ground (below 2.5 cm for at least three frames);
      // the landing and the take-off are excluded because the hoof is rolling over the ground there, not sliding
      const planarSpeed = Math.hypot(h.toe.x - this.prevToe[l].x, h.toe.z - this.prevToe[l].z) / dt;
      h.grounded = h.height < 0.025 ? h.grounded + 1 : 0;
      h.slip = h.grounded >= 3 ? planarSpeed : 0;
      // slip against the authored stance: through the middle of its stance window the hoof must stand still on the ground
      const u = this.stancePhase(l);
      h.stanceSlip = this.speed > 0.4 && u !== null && u > 0.12 && u < 0.88 && h.height < 0.04 ? planarSpeed : 0;
      // the middle of the stance, where the foot-lock holds the toe fully: the slip that is left once the lock is on
      h.lockedSlip = this.speed > 0.4 && u !== null && u > 0.16 && u < 0.82 && h.height < 0.04 ? planarSpeed : 0;
      if (now && !was) {
        h.contact = true;
        h.contactTime = 0;
        h.touchdownSpeed = planarSpeed;
        h.lastTouchdown.copy(h.toe);
        this.lastTouchTime[l] = this.time;
        const impact = clamp(this.speed / 12 + Math.max(0, -(h.toe.y - this.prevToe[l].y)) / dt / 8, 0, 1.4);
        this.onFootEvent?.({ limb: l, kind: "touchdown", pos: h.toe.clone(), speed: this.speed, impact, surface: this.surfaceAt(h.toe.x, h.toe.z), heading: this.heading });
      } else if (!now && was) {
        h.contact = false;
        this.onFootEvent?.({ limb: l, kind: "liftoff", pos: h.toe.clone(), speed: this.speed, impact: clamp(this.speed / 12, 0, 1), surface: this.surfaceAt(h.toe.x, h.toe.z), heading: this.heading });
      } else if (now) {
        h.contactTime += dt;
      }
    }
  }

  telemetry(): Telemetry {
    const w: Record<string, number> = {};
    for (const [k, v] of Object.entries(this.weights)) w[k] = +v.toFixed(3);
    for (const name of Object.values(CLIPS)) {
      const a = this.actions.get(name);
      if (a) w[name] = +a.getEffectiveWeight().toFixed(3);
    }
    return {
      time: this.time, speed: this.speed, targetSpeed: this.targetSpeed, accel: this.accel, gait: this.gait, weights: w, phase: this.phase,
      strideLength: this.strideLengthNow, strideFrequency: this.strideFreqNow, lead: this.lead, heading: this.heading, yawRate: this.yawRate,
      position: [this.position.x, this.position.y, this.position.z], pitch: this.pitch, roll: this.roll, exertion: this.exertion,
      hooves: Object.fromEntries(LIMBS.map((l) => [l, { height: +this.hooves[l].height.toFixed(3), contact: this.hooves[l].contact, slip: +this.hooves[l].slip.toFixed(3) }])) as Telemetry["hooves"],
    };
  }

  /** Hand the mixer back to the hero (idle layers only). */
  release() {
    for (const [name, a] of this.actions) {
      if (Object.values(CLIPS).includes(name as (typeof CLIPS)[keyof typeof CLIPS])) a.setEffectiveWeight(0);
    }
    this.stopAction?.stop();
    this.stopPlaying = false;
    this.actions.get("Alert")?.setEffectiveWeight(0);
    this.actions.get("Idle_Breathing")?.setEffectiveWeight(1);
    this.actions.get("Tail_Sway")?.setEffectiveWeight(0.8);
    this.actions.get("Ear_Rotate")?.setEffectiveWeight(0.7);
    this.actions.get("Mane_Sway")?.setEffectiveWeight(0.8);
    const idle = this.actions.get("Idle_Breathing");
    if (idle) idle.timeScale = 1;
    this.speed = 0;
    this.targetSpeed = 0;
    this.accel = 0;
    this.position.set(0, 0, 0);
    this.heading = 0;
    this.pitch = 0;
    this.roll = 0;
    this.groundY = 0;
    this.bankDropNow = 0;
    this.root.position.set(0, 0, 0);
    this.root.rotation.set(0, 0, 0);
    this.root.updateMatrixWorld(true);
  }
}
