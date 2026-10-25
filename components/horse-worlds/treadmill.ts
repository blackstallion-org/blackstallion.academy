/**
 * The horse stays where it is; the ground moves under it. This wraps the existing motion engine (Locomotor: speed ramps, gait
 * blending by speed, stride length and frequency from the measured gait table, hoof contact) and turns its forward travel into
 * a distance for the world to scroll by:
 *
 *   v = L x f            ground speed = stride length x stride frequency (from the gait table, blended with the clips)
 *   d(t + dt) = d(t) + v dt
 *
 * The speed is then calibrated against what the planted hooves of the running clips really do (the authored clips slip by a
 * measured RMS of 0.2 to 1.2 m/s), so the scenery never skates against a planted hoof by more than the animation itself does.
 * When the horse stops, v is 0 and the whole world stops with it.
 */
import * as THREE from "three";
import type { Marwari } from "@/components/3d/marwari";
import { LifeLayer, SecondaryMotion } from "@/components/stallion-film/life";
import { LIMBS, Locomotor, type FootEvent, type Limb, type Surface } from "@/components/stallion-film/locomotion";
import { GAIT_TABLE } from "./gait-table";
import { calibratedGroundSpeed, clamp, damp, integrateDistance, lerp, steadiness, strideSpeed } from "./math";
import { GAIT_SPEED, type GaitChoice, type SurfaceSpec } from "./types";

export type TreadmillTelemetry = {
  gait: string;
  speed: number;
  /** L x f from the gait table blend. */
  nominal: number;
  /** Mean backward speed of the planted hooves in mid-stance, filtered; null while none is planted or the horse is slow. */
  measured: number | null;
  /** The speed the world is actually scrolled at. */
  groundSpeed: number;
  distance: number;
  strideLength: number;
  strideFrequency: number;
  /** RMS speed (m/s) of planted hooves against the scrolling ground since the last reset. */
  slipRms: number;
  slipSamples: number;
  /** The highest a hoof that counts as planted has been above the ground, and the lowest it has been below it (m). */
  floatMax: number;
  sinkMax: number;
  hooves: Record<Limb, { height: number; contact: boolean; planted: boolean }>;
};

const flatGround = {
  height: () => 0,
  normal: (_x: number, _z: number, out?: THREE.Vector3) => (out ?? new THREE.Vector3()).set(0, 1, 0),
};

/** How long the scripted halt takes while a place is being switched (the fade hides it): from any gait to a stand in this time. */
export const SETTLE_SECONDS = 0.75;

export class Treadmill {
  readonly loco: Locomotor;
  readonly life: LifeLayer;
  readonly secondary: SecondaryMotion;
  distance = 0;
  groundSpeed = 0;
  nominal = 0;
  measured: number | null = null;
  /** Called on every touchdown / lift-off with the hoof position in the horse's frame (the ground slides under it). */
  onFoot: ((e: FootEvent) => void) | null = null;
  /** While true the horse settles quickly (a world is being switched); otherwise it uses its easy comfortable deceleration. */
  settleFast = false;
  private measuredRaw = 0;
  /** While a place is being switched: seconds since the halt began (-1 when not halting) and the speed it began at. */
  private settleT = -1;
  private settleV0 = 0;
  /** The ground speed as a multiple of the stride speed: follows the hooves' measurement at the asked-for pace, eases back to 1 otherwise. */
  private calib = 1;
  private prevToe: Record<Limb, THREE.Vector3> = Object.fromEntries(LIMBS.map((l) => [l, new THREE.Vector3()])) as Record<Limb, THREE.Vector3>;
  private vel: Record<Limb, { x: number; z: number }> = Object.fromEntries(LIMBS.map((l) => [l, { x: 0, z: 0 }])) as Record<Limb, { x: number; z: number }>;
  private havePrev = false;
  private slipSq = 0;
  private slipN = 0;
  private floatMax = 0;
  private sinkMax = 0;
  private planted: Record<Limb, boolean> = { FL: false, FR: false, HL: false, HR: false };
  private surface: Surface = { dust: 1, prints: 0.5, color: new THREE.Color("#cfae83"), hardness: 0.3 };

  constructor(horse: Marwari, private readonly mixer: THREE.AnimationMixer) {
    this.life = new LifeLayer(horse);
    this.secondary = new SecondaryMotion(horse);
    this.loco = new Locomotor(horse, mixer, GAIT_TABLE, flatGround);
    this.loco.maxAccel = 3.4;
    this.loco.surfaceAt = () => this.surface;
    this.loco.onFootEvent = (e) => this.onFoot?.(e);
  }

  /** What the ground under the hooves is like (how much dust and print a strike leaves). */
  setSurface(s: SurfaceSpec) {
    this.surface.dust = s.dust;
    this.surface.prints = s.prints;
    this.surface.hardness = s.hardness;
    this.surface.color.set(s.dustColor);
  }

  setGait(g: GaitChoice) {
    this.loco.targetSpeed = GAIT_SPEED[g];
  }

  /** Stand still straight away (no easing): used for the static pose of reduced motion. */
  stopNow() {
    this.loco.targetSpeed = 0;
    this.loco.speed = 0;
    this.loco.accel = 0;
    this.groundSpeed = 0;
    this.measured = null;
    this.nominal = 0;
    this.calib = 1;
  }

  resetStats() {
    this.slipSq = 0;
    this.slipN = 0;
    this.floatMax = 0;
    this.sinkMax = 0;
  }

  /**
   * One frame. The order matters and mirrors the film engine: the layers that sit on top of the clips are lifted off the bones
   * before the mixer runs and put back after it, and the hoof contact is read last, from the final pose.
   */
  step(dt: number) {
    if (dt <= 0) return;
    const { loco, life, secondary } = this;
    life.undo();
    secondary.undo();
    loco.comfortDecel = this.settleFast ? 8 : 3.2;
    if (this.settleFast) {
      if (this.settleT < 0) {
        this.settleT = 0;
        this.settleV0 = loco.speed;
      }
    } else this.settleT = -1;
    loco.update(dt);
    if (this.settleT >= 0) {
      // The engine's own easy stop has a long tail (a gallop is still trotting a second later). During a switch the horse is
      // brought to a stand on a fixed script, whatever it was doing, so the new place fades in around a calm horse; the engine's
      // braking is kept wherever it is already faster.
      this.settleT += dt;
      const p = clamp(this.settleT / SETTLE_SECONDS);
      const cap = this.settleV0 * (1 - p * p * (3 - 2 * p));
      if (loco.speed > cap) {
        loco.accel = clamp((cap - loco.speed) / dt, -25, 0);
        loco.speed = cap;
      }
    }
    // Treadmill: the engine moved the root forward along +Z; put it back and let the world do the travelling instead.
    loco.position.x = 0;
    loco.position.z = 0;
    loco.heading = 0;
    loco.root.position.set(0, loco.position.y, 0);
    loco.root.rotation.set(loco.pitch, 0, loco.roll, "YXZ");
    loco.root.updateMatrixWorld(true);

    life.moving = loco.weights.Gait ?? 0;
    life.exertion = loco.exertion;
    life.speed = loco.speed;
    life.headQuiet = 0;
    life.update(dt);
    loco.idleTimeScale = life.idleTimeScale;
    this.mixer.update(dt);
    life.apply();
    secondary.step(dt, loco.accelLocal.x, loco.accelLocal.y, loco.speed, life.tailImpulse);
    secondary.apply();
    loco.sense(dt);

    this.measure(dt);
    this.nominal = strideSpeed(loco.strideLengthNow, loco.strideFreqNow);
    // The hooves' measurement trims the speed only at the pace the horse was asked for. While it brakes or sets off the clips blend
    // and the hooves read up to 25% fast, so the multiple eases back toward 1 slowly (slower than any braking, so the ground never
    // surges) instead of following the reading, and it follows the measurement again once the pace is reached.
    const want = steadiness(loco.targetSpeed - loco.speed);
    const ratioNow = this.nominal > 0.05 ? calibratedGroundSpeed(this.nominal, this.measured) / this.nominal : 1;
    this.calib = loco.speed < 0.3 ? 1 : damp(this.calib, lerp(1, ratioNow, want), lerp(1.5, 8, want), dt);
    const target = this.nominal * this.calib;
    // follow the target a little smoothly (the measurement is noisy frame to frame), but never lag a stop
    this.groundSpeed = this.nominal < 0.05 ? 0 : damp(this.groundSpeed, target, 14, dt);
    this.distance = integrateDistance(this.distance, this.groundSpeed, dt);
    this.accumulateSlip();
  }

  /** The backward speed of the hooves that are planted in mid-stance: what the ground must do to hold them still. */
  private measure(dt: number) {
    const { loco } = this;
    let sum = 0;
    let n = 0;
    for (const l of LIMBS) {
      const h = loco.hooves[l];
      const prev = this.prevToe[l];
      const vx = this.havePrev ? (h.toe.x - prev.x) / dt : 0;
      const vz = this.havePrev ? (h.toe.z - prev.z) / dt : 0;
      this.vel[l].x = vx;
      this.vel[l].z = vz;
      const u = loco.stancePhase(l);
      this.planted[l] = h.contact && h.grounded >= 3;
      if (this.planted[l] && this.havePrev && u !== null && u > 0.15 && u < 0.85) {
        sum += -vz;
        n++;
      }
      prev.copy(h.toe);
    }
    this.havePrev = true;
    if (n > 0 && loco.speed > 0.6) {
      this.measuredRaw = sum / n;
      this.measured = this.measured === null ? this.measuredRaw : damp(this.measured, this.measuredRaw, 10, dt);
    } else if (loco.speed <= 0.6) {
      this.measured = null;
    }
  }

  /** Quality figures over the middle of each stance: how fast a planted hoof slides against the scrolling ground, and how high or low it sits. */
  private accumulateSlip() {
    const { loco } = this;
    if (loco.speed < 0.4) return;
    for (const l of LIMBS) {
      const u = loco.stancePhase(l);
      if (u === null || u <= 0.15 || u >= 0.85) continue;
      const h = loco.hooves[l];
      this.floatMax = Math.max(this.floatMax, h.height);
      this.sinkMax = Math.min(this.sinkMax, h.height);
      if (this.planted[l]) {
        const v = this.vel[l];
        const slip = Math.hypot(v.x, v.z + this.groundSpeed);
        this.slipSq += slip * slip;
        this.slipN++;
      }
    }
  }

  telemetry(): TreadmillTelemetry {
    const { loco } = this;
    return {
      gait: loco.gait,
      speed: loco.speed,
      nominal: this.nominal,
      measured: this.measured,
      groundSpeed: this.groundSpeed,
      distance: this.distance,
      strideLength: loco.strideLengthNow,
      strideFrequency: loco.strideFreqNow,
      slipRms: this.slipN ? Math.sqrt(this.slipSq / this.slipN) : 0,
      slipSamples: this.slipN,
      floatMax: this.floatMax,
      sinkMax: this.sinkMax,
      hooves: Object.fromEntries(LIMBS.map((l) => [l, { height: loco.hooves[l].height, contact: loco.hooves[l].contact, planted: this.planted[l] }])) as TreadmillTelemetry["hooves"],
    };
  }

  /** The speed the horse is asked for in a gait, for the UI and the tests. */
  static speedOf(g: GaitChoice) {
    return clamp(GAIT_SPEED[g], 0, 14);
  }
}
