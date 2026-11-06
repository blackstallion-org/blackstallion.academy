import * as THREE from "three";
import type { ShotPose } from "./types";

/**
 * The camera director's vocabulary. A world describes its camera as named checkpoints on its own local timeline (0..1);
 * the path between them is a centripetal Catmull-Rom spline through the positions and another through the look targets,
 * so the lens moves in long continuous curves (no corners at checkpoints) and is a pure function of p.
 *
 *   const path = new CameraPath([
 *     key("establish", 0.00, [0, 60, -220], [0, 8, 0], 38),
 *     key("approach",  0.25, [10, 12, -40], [0, 2, 0], 32),
 *     ...orbit("orbit", 0.40, 0.60, { center: [0, 1.4, 0], radius: 6, from: -0.6, to: 0.9, height: 1.8 }, 30),
 *     key("eye",       1.00, [0.2, 1.75, 1.1], [0.15, 1.72, 0.95], 18),
 *   ]);
 *   path.at(p, out);
 *
 * `hold` on a key keeps the camera on that checkpoint for part of the timeline (a story beat to pause on).
 */
export type V3 = [number, number, number];
export type CameraKey = { name: string; t: number; pos: V3; look: V3; fov: number; roll?: number; hold?: number };

export const key = (name: string, t: number, pos: V3, look: V3, fov: number, opts: { roll?: number; hold?: number } = {}): CameraKey => ({ name, t, pos, look, fov, ...opts });

/** Expands an orbit around a centre into several keys (angles in radians, measured from +Z toward +X). */
export function orbit(
  name: string,
  t0: number,
  t1: number,
  o: { center: V3; radius: number | [number, number]; from: number; to: number; height: number | [number, number]; look?: V3 },
  fov: number | [number, number],
  steps = 6,
): CameraKey[] {
  const out: CameraKey[] = [];
  for (let i = 0; i <= steps; i++) {
    const s = i / steps;
    const a = o.from + (o.to - o.from) * s;
    const r = Array.isArray(o.radius) ? o.radius[0] + (o.radius[1] - o.radius[0]) * s : o.radius;
    const h = Array.isArray(o.height) ? o.height[0] + (o.height[1] - o.height[0]) * s : o.height;
    const f = Array.isArray(fov) ? fov[0] + (fov[1] - fov[0]) * s : fov;
    out.push({
      name: i === 0 ? name : `${name}.${i}`,
      t: t0 + (t1 - t0) * s,
      pos: [o.center[0] + Math.sin(a) * r, o.center[1] + h, o.center[2] + Math.cos(a) * r],
      look: o.look ?? o.center,
      fov: f,
    });
  }
  return out;
}

const smooth = (x: number) => x * x * (3 - 2 * x);

export class CameraPath {
  readonly keys: CameraKey[];
  private pos: THREE.CatmullRomCurve3;
  private look: THREE.CatmullRomCurve3;
  /** spline parameter (0..1) of each key: the curves are parametrised by key index, not by arc length */
  private u: number[];
  /** the keys' times used for the move: nudged toward each segment's share of the path length, so the camera's speed stays steady */
  private tm: number[];
  constructor(keys: CameraKey[]) {
    this.keys = [...keys].sort((a, b) => a.t - b.t);
    const v = (a: V3) => new THREE.Vector3(a[0], a[1], a[2]);
    this.pos = new THREE.CatmullRomCurve3(this.keys.map((k) => v(k.pos)), false, "centripetal");
    this.look = new THREE.CatmullRomCurve3(this.keys.map((k) => v(k.look)), false, "centripetal");
    const n = this.keys.length - 1;
    this.u = this.keys.map((_, i) => (n > 0 ? i / n : 0));
    // path length of every segment (the position, plus half the look target's travel)
    const cum = [0];
    for (let i = 0; i < n; i++) {
      let len = 0;
      let a = this.pos.getPoint(this.u[i]);
      let b = this.look.getPoint(this.u[i]);
      for (let s = 1; s <= 12; s++) {
        const u = this.u[i] + (this.u[i + 1] - this.u[i]) * (s / 12);
        const a2 = this.pos.getPoint(u);
        const b2 = this.look.getPoint(u);
        len += a.distanceTo(a2) + 0.5 * b.distanceTo(b2);
        a = a2;
        b = b2;
      }
      cum.push(cum[i] + len);
    }
    const t0 = this.keys[0].t;
    const span = (this.keys[n]?.t ?? t0) - t0;
    this.tm = this.keys.map((k, i) => {
      if (!(cum[n] > 0) || i === 0 || i === n) return k.t;
      const even = t0 + span * (cum[i] / cum[n]);
      return k.t + THREE.MathUtils.clamp((even - k.t) * 0.35, -0.04, 0.04);
    });
  }

  /** Index of the segment containing p and the eased fraction through it. */
  private locate(p: number): { i: number; f: number } {
    const k = this.keys;
    const tm = this.tm;
    if (p <= tm[0]) return { i: 0, f: 0 };
    if (p >= tm[k.length - 1]) return { i: Math.max(0, k.length - 2), f: 1 };
    let i = 0;
    while (i < k.length - 2 && p > tm[i + 1]) i++;
    const a = k[i];
    // a hold keeps the camera on key a for the first `hold` share of the segment
    const start = tm[i] + (tm[i + 1] - tm[i]) * (a.hold ?? 0);
    const raw = p <= start ? 0 : (p - start) / Math.max(1e-6, tm[i + 1] - start);
    // nearly linear, so the speed does not drop and pick up again at every checkpoint; a touch of ease keeps it from feeling mechanical
    const f = 0.12 * smooth(raw) + 0.88 * raw;
    return { i, f };
  }

  at(p: number, out: ShotPose): ShotPose {
    const { i, f } = this.locate(THREE.MathUtils.clamp(p, 0, 1));
    const u = this.u[i] + (this.u[Math.min(i + 1, this.u.length - 1)] - this.u[i]) * f;
    this.pos.getPoint(u, out.pos);
    this.look.getPoint(u, out.look);
    const a = this.keys[i];
    const b = this.keys[Math.min(i + 1, this.keys.length - 1)];
    out.fov = a.fov + (b.fov - a.fov) * f;
    out.roll = (a.roll ?? 0) + ((b.roll ?? 0) - (a.roll ?? 0)) * f;
    return out;
  }

  /** The local time of a named checkpoint (for overlays and snapping). */
  timeOf(name: string) {
    return this.keys.find((k) => k.name === name)?.t ?? 0;
  }
}

/**
 * Narrow screens: widen the vertical field of view so the horizontal framing holds (a 16:9 composition shown on a 9:19 phone would
 * otherwise crop the horse). Blends 70 % of the way toward keeping the 16:9 horizontal angle, capped so it never fish-eyes.
 */
export function fitFov(fov: number, aspect: number) {
  const ref = 16 / 9;
  if (aspect >= ref * 0.95) return fov;
  const h = 2 * Math.atan(Math.tan(THREE.MathUtils.degToRad(fov) / 2) * ref);
  const v = THREE.MathUtils.radToDeg(2 * Math.atan(Math.tan(h / 2) / aspect));
  return Math.min(fov + (v - fov) * 0.7, Math.max(fov, 78));
}

export function makePose(): ShotPose {
  return { pos: new THREE.Vector3(), look: new THREE.Vector3(), fov: 35, roll: 0 };
}

export function applyPose(camera: THREE.PerspectiveCamera, pose: ShotPose, aspect: number) {
  camera.position.copy(pose.pos);
  camera.up.set(Math.sin(pose.roll), Math.cos(pose.roll), 0);
  camera.lookAt(pose.look);
  const fov = fitFov(pose.fov, aspect);
  if (Math.abs(camera.fov - fov) > 1e-4 || camera.aspect !== aspect) {
    camera.fov = fov;
    camera.aspect = aspect;
    camera.updateProjectionMatrix();
  }
}

/** Blend two poses (used where one shot hands over to a live target, e.g. the horse's eye). */
export function lerpPose(a: ShotPose, b: ShotPose, t: number, out: ShotPose) {
  out.pos.lerpVectors(a.pos, b.pos, t);
  out.look.lerpVectors(a.look, b.look, t);
  out.fov = a.fov + (b.fov - a.fov) * t;
  out.roll = a.roll + (b.roll - a.roll) * t;
  return out;
}
