import * as THREE from "three";
import type { Marwari } from "@/components/3d/marwari";
import { clamp, smoothstep } from "./noise";
import { LIMBS, SOLE_TO_TOE_M, type Limb, type Locomotor } from "./locomotion";

/**
 * Runtime foot-lock. The authored gaits plant each hoof only approximately (the rig cannot reach every point of the stance
 * sweep the stride needs, so a hoof drifts a few centimetres across the ground while the body moves over it). While a hoof is
 * in the middle of its authored stance this layer pins its toe to the place it landed, in world space, and solves the leg back
 * to that point with a small damped CCD: hinge joints about the body's lateral axis, a little abduction at the shoulder or hip
 * for turns, joint limits, and the hoof kept at its authored orientation so it stays flat. It blends in after touchdown and out
 * before lift-off, so the swing is untouched. Like the other additive layers it is removed again before the mixer runs.
 *
 * It also seats the hoof on the surface under it. The authored stance puts the sole on a flat plane at the root's height; the
 * desert has ±3 cm of relief, so over a trough the sole hung a few centimetres above the sand and over a crest the toe sank into
 * it. While a hoof is held, its toe is brought to the terrain height under the anchor (sole on the surface), and at any time a
 * hoof is never left below the surface; the body no longer has to ride up over a crest to keep a hoof out of the ground.
 */
const CHAINS: Record<Limb, string[]> = {
  FL: ["Scapula_L", "Humerus_L", "Forearm_L", "Cannon_F_L", "Pastern_F_L", "Hoof_F_L"],
  FR: ["Scapula_R", "Humerus_R", "Forearm_R", "Cannon_F_R", "Pastern_F_R", "Hoof_F_R"],
  HL: ["Femur_L", "Gaskin_L", "Cannon_B_L", "Pastern_B_L", "Hoof_B_L"],
  HR: ["Femur_R", "Gaskin_R", "Cannon_B_R", "Pastern_B_R", "Hoof_B_R"],
};
/** Hinge limit and abduction limit (radians) of each joint, in chain order (the hoof, last, is not a joint). */
const LIMITS: Record<"F" | "H", { hinge: number; abd: number }[]> = {
  F: [{ hinge: 0.2, abd: 0 }, { hinge: 0.7, abd: 0.22 }, { hinge: 0.75, abd: 0 }, { hinge: 0.5, abd: 0 }, { hinge: 0.45, abd: 0 }],
  H: [{ hinge: 0.7, abd: 0.22 }, { hinge: 0.75, abd: 0 }, { hinge: 0.5, abd: 0 }, { hinge: 0.45, abd: 0 }],
};
const HOOF_LENGTH = 0.14;
/** Seconds after touchdown over which the lock takes hold: the landing decelerates over these few frames instead of stopping in one. */
export const LOCK_RAMP_S = 0.03;
/** Seconds after lift-off over which the lock lets go (the toe leaves the ground from the anchored point). */
export const LOCK_RELEASE_S = 0.05;
/** A hoof is anchored once its stance has begun and its toe is within this height of the surface. Well above the sensor's contact
 *  threshold (4 cm) because the lock then draws the hoof down onto the surface: a stance that starts 5-11 cm up (over a trough, or
 *  on the outside foot of a banked turn) still lands, instead of hanging there. */
export const LOCK_TOUCH_M = 0.15;
const ITERATIONS = 24;
/** Fraction of the straight-leg reach the lock may ask for (keeps the joints off their limits). */
const REACH_FRACTION = 0.97;
/** Residual (m) above which a leg is treated as unable to reach its anchor, and how fast the lock fades out and back in. */
const LOCK_BAD_M = 0.02;
const SAFE_FALL_S = 0.08;
const SAFE_RISE_S = 0.25;

type Joint = { bone: THREE.Bone; q0: THREE.Quaternion; hinge: number; abd: number; hl: THREE.Vector3; fl: THREE.Vector3 };

class LimbLock {
  readonly joints: Joint[] = [];
  readonly hoof: THREE.Bone;
  readonly kind: "F" | "H";
  engaged = false;
  /** Seconds since this stance began (touchdown). */
  tStance = 0;
  /** Seconds since the stance ended (lift-off), while the lock is still letting go. */
  releaseT = 0;
  weight = 0;
  readonly anchor = new THREE.Vector3();
  /** Straight-leg reach from the top joint to the toe (m): the lock never asks a leg for more than this. */
  readonly reach: number;
  /** 0..1 how much of the lock this leg is allowed to hold; drops while the leg cannot reach its anchor. */
  safe = 1;
  /** How far the toe is from the lock target after solving (m), for QA. */
  residual = 0;
  /** Largest joint offset applied this frame (rad), for QA. */
  maxOffset = 0;
  applied = false;
  private readonly hoofQ0 = new THREE.Quaternion();
  private readonly hoofWorldQ = new THREE.Quaternion();

  constructor(horse: Marwari, readonly limb: Limb) {
    this.kind = limb[0] as "F" | "H";
    const names = CHAINS[limb];
    for (let i = 0; i < names.length - 1; i++) {
      const bone = horse.bones[names[i]];
      if (!bone) throw new Error(`footlock: missing bone ${names[i]}`);
      this.joints.push({ bone, q0: new THREE.Quaternion(), hinge: 0, abd: 0, hl: new THREE.Vector3(), fl: new THREE.Vector3() });
    }
    const hoof = horse.bones[names[names.length - 1]];
    if (!hoof) throw new Error(`footlock: missing bone ${names[names.length - 1]}`);
    this.hoof = hoof;
    // segment lengths below the top joint, plus the toe: the leg's reach when fully straight
    let reach = HOOF_LENGTH + hoof.position.length();
    for (let k = 1; k < this.joints.length; k++) reach += this.joints[k].bone.position.length();
    this.reach = reach;
  }

  /** Put the leg back exactly as the mixer left it. */
  undo() {
    if (!this.applied) return;
    for (const j of this.joints) j.bone.quaternion.copy(j.q0);
    this.hoof.quaternion.copy(this.hoofQ0);
    this.applied = false;
  }

  private refresh(from: number) {
    for (let k = from; k < this.joints.length; k++) {
      const b = this.joints[k].bone;
      b.updateMatrix();
      b.matrixWorld.multiplyMatrices((b.parent as THREE.Object3D).matrixWorld, b.matrix);
    }
    this.hoof.updateMatrix();
    this.hoof.matrixWorld.multiplyMatrices((this.hoof.parent as THREE.Object3D).matrixWorld, this.hoof.matrix);
  }

  private readonly pq = new THREE.Quaternion();
  private keepHoofFlat() {
    const parent = this.hoof.parent as THREE.Object3D;
    // the leg bones carry unit scale, so the rotation taken from the matrix is exact
    this.pq.setFromRotationMatrix(parent.matrixWorld).invert();
    this.hoof.quaternion.copy(this.pq).multiply(this.hoofWorldQ);
    this.hoof.updateMatrix();
    this.hoof.matrixWorld.multiplyMatrices(parent.matrixWorld, this.hoof.matrix);
  }

  private toe(out: THREE.Vector3) {
    return out.set(0, HOOF_LENGTH, 0).applyMatrix4(this.hoof.matrixWorld);
  }

  /** Solve this limb toward `target` (world); `lateral` and `forward` are the body's axes in world space. */
  solve(lateral: THREE.Vector3, forward: THREE.Vector3, target: THREE.Vector3) {
    const limits = LIMITS[this.kind];
    const n = this.joints.length;
    // remember the authored pose
    for (let k = 0; k < n; k++) {
      const j = this.joints[k];
      j.q0.copy(j.bone.quaternion);
      j.hinge = 0;
      j.abd = 0;
    }
    this.hoofQ0.copy(this.hoof.quaternion);
    this.hoof.getWorldQuaternion(this.hoofWorldQ);
    this.applied = true;
    this.maxOffset = 0;
    // local copies of the two axes per joint (they stay valid because we only post-multiply about them)
    const wq = new THREE.Quaternion();
    for (let k = 0; k < n; k++) {
      const j = this.joints[k];
      j.bone.getWorldQuaternion(wq).invert();
      j.hl.copy(lateral).applyQuaternion(wq);
      j.fl.copy(forward).applyQuaternion(wq);
    }
    const toe = new THREE.Vector3();
    const pj = new THREE.Vector3();
    const v1 = new THREE.Vector3();
    const v2 = new THREE.Vector3();
    const cr = new THREE.Vector3();
    const qa = new THREE.Quaternion();
    const qb = new THREE.Quaternion();
    const rot = (jn: Joint) => {
      jn.bone.quaternion.copy(jn.q0);
      if (jn.hinge !== 0) jn.bone.quaternion.multiply(qa.setFromAxisAngle(jn.hl, jn.hinge));
      if (jn.abd !== 0) jn.bone.quaternion.multiply(qb.setFromAxisAngle(jn.fl, jn.abd));
    };
    const angleAbout = (axis: THREE.Vector3) => {
      // signed angle from v1 to v2 about `axis`, both projected to the plane normal to it
      v1.addScaledVector(axis, -v1.dot(axis));
      v2.addScaledVector(axis, -v2.dot(axis));
      cr.crossVectors(v1, v2);
      return Math.atan2(cr.dot(axis), v1.dot(v2));
    };
    this.keepHoofFlat();
    for (let it = 0; it < ITERATIONS; it++) {
      for (let k = n - 1; k >= 0; k--) {
        const jn = this.joints[k];
        pj.setFromMatrixPosition(jn.bone.matrixWorld);
        this.toe(toe);
        v1.copy(toe).sub(pj);
        v2.copy(target).sub(pj);
        if (v1.lengthSq() < 1e-8 || v2.lengthSq() < 1e-8) continue;
        const a = angleAbout(lateral);
        const hinge = clamp(jn.hinge + clamp(a * 0.85, -0.25, 0.25), -limits[k].hinge, limits[k].hinge);
        jn.hinge = hinge;
        rot(jn);
        this.refresh(k);
        this.keepHoofFlat();
      }
      // abduction at the top joint corrects the sideways part (turning, a path that is not straight)
      const kt = this.kind === "F" ? 1 : 0;
      const top = this.joints[kt];
      if (limits[kt].abd > 0) {
        pj.setFromMatrixPosition(top.bone.matrixWorld);
        this.toe(toe);
        v1.copy(toe).sub(pj);
        v2.copy(target).sub(pj);
        const a = angleAbout(forward);
        top.abd = clamp(top.abd + clamp(a * 0.85, -0.15, 0.15), -limits[kt].abd, limits[kt].abd);
        rot(top);
        this.refresh(kt);
        this.keepHoofFlat();
      }
    }
    this.toe(toe);
    this.residual = toe.distanceTo(target);
    for (const j of this.joints) this.maxOffset = Math.max(this.maxOffset, Math.abs(j.hinge), Math.abs(j.abd));
  }
}

export class FootLock {
  readonly legs: Record<Limb, LimbLock>;
  private readonly lateral = new THREE.Vector3();
  private readonly forward = new THREE.Vector3();
  private readonly target = new THREE.Vector3();
  private readonly tmp = new THREE.Vector3();
  private readonly pivot = new THREE.Vector3();
  private readonly reachVec = new THREE.Vector3();
  enabled = true;
  /** Seat the hoof on the surface under it (see the header); false is the sideways-only lock of the first pass, for QA comparison. */
  seat = true;
  /** QA readout per limb. */
  readonly debug: Record<Limb, { weight: number; residual: number; maxOffset: number }>;

  constructor(private readonly horse: Marwari, private readonly loco: Locomotor) {
    this.legs = Object.fromEntries(LIMBS.map((l) => [l, new LimbLock(horse, l)])) as Record<Limb, LimbLock>;
    this.debug = Object.fromEntries(LIMBS.map((l) => [l, { weight: 0, residual: 0, maxOffset: 0 }])) as FootLock["debug"];
  }

  undo() {
    for (const l of LIMBS) this.legs[l].undo();
  }

  /** Call after the mixer and the other additive layers, before `loco.sense`. `dt` is the frame time in seconds. */
  apply(dt: number) {
    const loco = this.loco;
    const root = this.horse.root;
    root.updateMatrixWorld(true);
    this.lateral.setFromMatrixColumn(root.matrixWorld, 0).normalize();
    this.forward.setFromMatrixColumn(root.matrixWorld, 2).normalize();
    const moving = this.enabled && loco.speed > 0.4;
    for (const l of LIMBS) {
      const leg = this.legs[l];
      const d = this.debug[l];
      const u = moving ? loco.stancePhase(l) : null;
      const hoof = leg.hoof;
      hoof.updateWorldMatrix(true, false);
      this.tmp.set(0, HOOF_LENGTH, 0).applyMatrix4(hoof.matrixWorld);
      const gate = smoothstep(0.6, 0.85, loco.gaitPurity);
      let w = 0;
      if (u !== null) {
        // stance: the toe where it first reaches the ground is the point the lock holds (the phase can start while the hoof
        // is still in the air), blended in over LOCK_RAMP_S
        if (!leg.engaged) {
          if (loco.hooves[l].height < (this.seat ? LOCK_TOUCH_M : 0.04)) {
            leg.anchor.copy(this.tmp);
            leg.engaged = true;
            leg.tStance = 0;
            leg.releaseT = 0;
          }
        } else {
          leg.tStance += dt;
          leg.releaseT = 0;
        }
        if (leg.engaged) w = smoothstep(0, LOCK_RAMP_S, leg.tStance) * gate;
      } else if (leg.engaged) {
        // swing: hold the anchored toe while it leaves the ground, then let go over LOCK_RELEASE_S
        leg.releaseT += dt;
        if (leg.releaseT >= LOCK_RELEASE_S) {
          leg.engaged = false;
          leg.tStance = 0;
          leg.releaseT = 0;
        } else {
          w = (1 - smoothstep(0, LOCK_RELEASE_S, leg.releaseT)) * gate;
        }
      }
      // a leg that cannot reach its anchor (the joints are at their limits) lets the lock go gradually rather than
      // pulling the toe up off the ground; it takes hold again once the anchor is reachable
      leg.safe = leg.residual > LOCK_BAD_M ? Math.max(0, leg.safe - dt / SAFE_FALL_S) : Math.min(1, leg.safe + dt / SAFE_RISE_S);
      w *= leg.safe;
      leg.weight = w;
      d.weight = w;
      // height: while held, the toe goes to the surface under the anchor (sole on it); whenever it moves, never below the surface
      let ty = this.tmp.y;
      if (this.seat && w > 0.001) {
        const surfAnchor = loco.groundAt(leg.anchor.x, leg.anchor.z) + SOLE_TO_TOE_M;
        ty += (surfAnchor - ty) * w;
      }
      if (this.seat && moving) ty = Math.max(ty, loco.groundAt(this.tmp.x, this.tmp.z) + SOLE_TO_TOE_M);
      const dy = ty - this.tmp.y;
      if (w <= 0.001 && Math.abs(dy) < 0.001) {
        leg.residual = 0;
        d.residual = 0;
        d.maxOffset = 0;
        continue;
      }
      this.target.set(
        this.tmp.x + (leg.anchor.x - this.tmp.x) * w,
        ty,
        this.tmp.z + (leg.anchor.z - this.tmp.z) * w,
      );
      // beyond reach the toe slides a little at the end of the stance instead of being pulled up off the ground
      const top = leg.joints[0].bone.matrixWorld;
      this.pivot.setFromMatrixPosition(top);
      this.reachVec.subVectors(this.target, this.pivot);
      const dist = this.reachVec.length();
      const maxDist = leg.reach * REACH_FRACTION;
      if (dist > maxDist) this.target.copy(this.pivot).addScaledVector(this.reachVec, maxDist / dist);
      leg.solve(this.lateral, this.forward, this.target);
      d.residual = leg.residual;
      d.maxOffset = leg.maxOffset;
    }
  }
}
