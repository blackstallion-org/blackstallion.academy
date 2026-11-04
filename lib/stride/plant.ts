import * as THREE from "three";
import { clamp01, wrap01 } from "./analysis";
import { HOOF_LENGTH_M, LIMBS, type Limb } from "./constants";

/**
 * Keeps a planted hoof where it landed. The authored Walk plants each hoof only approximately (the rig cannot reach every point of
 * the stance sweep), so on the hoof mesh a point that is on the floor drifts 6 to 11 cm across it during the stance. This layer holds
 * the toe at the place it landed, in the ground's frame, and solves the leg back to it with a small damped CCD (hinge joints about
 * the body's lateral axis, a little abduction at the top joint, joint limits, the hoof kept at its authored orientation so the heel
 * still rises and the hoof still rolls). The CCD is the one in components/stallion-film/footlock.ts, kept here as a stateless
 * function of the stride phase so that scrubbing, stepping and playing give the same pose; it leaves the shoulder blade alone so the
 * rider's seat is untouched. Weight ramps in over the first part of the stance and out before lift-off, so the swing is the clip's own.
 */

const CHAINS: Record<Limb, string[]> = {
  FL: ["Humerus_L", "Forearm_L", "Cannon_F_L", "Pastern_F_L", "Hoof_F_L"],
  FR: ["Humerus_R", "Forearm_R", "Cannon_F_R", "Pastern_F_R", "Hoof_F_R"],
  HL: ["Femur_L", "Gaskin_L", "Cannon_B_L", "Pastern_B_L", "Hoof_B_L"],
  HR: ["Femur_R", "Gaskin_R", "Cannon_B_R", "Pastern_B_R", "Hoof_B_R"],
};
/** Hinge and abduction limit (rad) per joint, in chain order (the hoof, last, is not a joint). */
const LIMITS: Record<"F" | "H", { hinge: number; abd: number }[]> = {
  F: [{ hinge: 0.75, abd: 0.45 }, { hinge: 0.75, abd: 0 }, { hinge: 0.5, abd: 0 }, { hinge: 0.7, abd: 0 }],
  H: [{ hinge: 0.7, abd: 0.4 }, { hinge: 0.75, abd: 0 }, { hinge: 0.5, abd: 0 }, { hinge: 0.7, abd: 0 }],
};
const ITERATIONS = 24;
const LATERAL = new THREE.Vector3(1, 0, 0);
const FORWARD = new THREE.Vector3(0, 0, 1);

type Joint = { bone: THREE.Bone; q0: THREE.Quaternion; hinge: number; abd: number; hl: THREE.Vector3; fl: THREE.Vector3 };

export type PlantConfig = {
  /** Phase of touchdown and of lift-off (from the clip's own toe path). */
  touchdown: number;
  liftoff: number;
  /** Where the toe landed, in the horse's model space, taken a little after touchdown when the hoof is flat. */
  anchor: [number, number, number];
  anchorPhase: number;
};

class Leg {
  readonly joints: Joint[] = [];
  readonly hoof: THREE.Bone;
  readonly kind: "F" | "H";
  residual = 0;
  applied = false;
  private readonly hoofQ = new THREE.Quaternion();
  private readonly hoofQ0 = new THREE.Quaternion();
  private readonly pq = new THREE.Quaternion();

  constructor(bones: Record<string, THREE.Bone>, readonly limb: Limb) {
    this.kind = limb[0] as "F" | "H";
    const names = CHAINS[limb];
    for (let i = 0; i < names.length - 1; i++) {
      const bone = bones[names[i]];
      if (!bone) throw new Error(`plant: missing bone ${names[i]}`);
      this.joints.push({ bone, q0: new THREE.Quaternion(), hinge: 0, abd: 0, hl: new THREE.Vector3(), fl: new THREE.Vector3() });
    }
    const hoof = bones[names[names.length - 1]];
    if (!hoof) throw new Error(`plant: missing bone ${names[names.length - 1]}`);
    this.hoof = hoof;
  }

  /**
   * Puts the leg back exactly as the clip wrote it. The animation mixer only writes a bone when the clip's value changes, so a bone
   * moved from outside must be restored before the next evaluation, or the correction leaks into later phases.
   */
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

  private keepHoofFlat() {
    const parent = this.hoof.parent as THREE.Object3D;
    this.pq.setFromRotationMatrix(parent.matrixWorld).invert();
    this.hoof.quaternion.copy(this.pq).multiply(this.hoofQ);
    this.hoof.updateMatrix();
    this.hoof.matrixWorld.multiplyMatrices(parent.matrixWorld, this.hoof.matrix);
  }

  toe(out: THREE.Vector3) {
    return out.set(0, HOOF_LENGTH_M, 0).applyMatrix4(this.hoof.matrixWorld);
  }

  /** Moves the toe toward `target` (model space) from the pose the clip just wrote. */
  solve(target: THREE.Vector3) {
    const limits = LIMITS[this.kind];
    const n = this.joints.length;
    for (const j of this.joints) {
      j.q0.copy(j.bone.quaternion);
      j.hinge = 0;
      j.abd = 0;
    }
    this.hoofQ0.copy(this.hoof.quaternion);
    this.hoof.getWorldQuaternion(this.hoofQ);
    this.applied = true;
    const wq = new THREE.Quaternion();
    for (const j of this.joints) {
      j.bone.getWorldQuaternion(wq).invert();
      j.hl.copy(LATERAL).applyQuaternion(wq);
      j.fl.copy(FORWARD).applyQuaternion(wq);
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
      v1.addScaledVector(axis, -v1.dot(axis));
      v2.addScaledVector(axis, -v2.dot(axis));
      cr.crossVectors(v1, v2);
      return Math.atan2(cr.dot(axis), v1.dot(v2));
    };
    const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
    this.keepHoofFlat();
    for (let it = 0; it < ITERATIONS; it++) {
      for (let k = n - 1; k >= 0; k--) {
        const jn = this.joints[k];
        pj.setFromMatrixPosition(jn.bone.matrixWorld);
        this.toe(toe);
        v1.copy(toe).sub(pj);
        v2.copy(target).sub(pj);
        if (v1.lengthSq() < 1e-8 || v2.lengthSq() < 1e-8) continue;
        jn.hinge = clamp(jn.hinge + clamp(angleAbout(LATERAL) * 0.85, -0.25, 0.25), -limits[k].hinge, limits[k].hinge);
        rot(jn);
        this.refresh(k);
        this.keepHoofFlat();
      }
      const top = this.joints[0];
      if (limits[0].abd > 0) {
        pj.setFromMatrixPosition(top.bone.matrixWorld);
        this.toe(toe);
        v1.copy(toe).sub(pj);
        v2.copy(target).sub(pj);
        top.abd = clamp(top.abd + clamp(angleAbout(FORWARD) * 0.85, -0.15, 0.15), -limits[0].abd, limits[0].abd);
        rot(top);
        this.refresh(0);
        this.keepHoofFlat();
      }
    }
    this.toe(toe);
    this.residual = toe.distanceTo(target);
  }
}

const smooth = (a: number, b: number, v: number) => {
  const t = clamp01((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};

/** Share of the stance, from touchdown, over which the hold takes hold, and over which it lets go before lift-off (in strides). */
const RAMP_IN = 0.05;
const RAMP_OUT = 0.04;

export class PlantLayer {
  private readonly legs: Record<Limb, Leg>;
  private readonly config: Partial<Record<Limb, PlantConfig>> = {};
  /** The ground moves back this far under the horse in one stride (m). */
  constructor(bones: Record<string, THREE.Bone>, private readonly strideLength: number) {
    this.legs = Object.fromEntries(LIMBS.map((l) => [l, new Leg(bones, l)])) as Record<Limb, Leg>;
  }

  configure(limb: Limb, config: PlantConfig) {
    this.config[limb] = config;
  }

  enabled = true;
  /** Largest distance (m) between the toe and its hold target in the last `apply`, for checks. */
  worstResidual = 0;
  private readonly target = new THREE.Vector3();
  private readonly raw = new THREE.Vector3();

  /** Weight of the hold for a limb at a phase (0 in the swing, 1 in the middle of the stance). */
  weight(limb: Limb, phase: number) {
    const c = this.config[limb];
    if (!c) return 0;
    const into = wrap01(phase - c.touchdown);
    const stance = wrap01(c.liftoff - c.touchdown) || 1;
    if (into >= stance) return 0;
    return smooth(0, RAMP_IN, into) * (1 - smooth(stance - RAMP_OUT, stance, into));
  }

  /** Call before the clip is evaluated: restores every leg the last `apply` moved. */
  undo() {
    for (const l of LIMBS) this.legs[l].undo();
  }

  /** Call after the clip has been evaluated and the world matrices updated. Moves the planted legs; the caller updates the skeleton. */
  apply(phase: number) {
    if (!this.enabled) return;
    this.worstResidual = 0;
    for (const limb of LIMBS) {
      const c = this.config[limb];
      const w = this.weight(limb, phase);
      if (!c || w <= 0.001) continue;
      const leg = this.legs[limb];
      leg.toe(this.raw);
      // the ground slides back under the horse by one stride length per stride: the anchor does the same in the horse's frame,
      // counted from the moment the anchor was taken (a little after touchdown) along the stance
      const along = wrap01(phase - c.touchdown) - wrap01(c.anchorPhase - c.touchdown);
      this.target.set(c.anchor[0], c.anchor[1], c.anchor[2] - this.strideLength * along);
      this.target.lerpVectors(this.raw, this.target, w);
      leg.solve(this.target);
      this.worstResidual = Math.max(this.worstResidual, leg.residual);
    }
  }
}
