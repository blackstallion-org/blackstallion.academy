/**
 * A guided camera: it does not roam. Each gait has a shot (azimuth, elevation, distance, field of view, target), the rig eases
 * between shots with critically damped springs (no overshoot, no overlap of moves), and the visitor may only nudge the angle a
 * little; the nudge springs back. The distance is never shorter than what keeps the whole horse in frame at the current aspect.
 */
import * as THREE from "three";
import { clamp, DEG, fitDistance, shotPosition } from "./math";
import type { ShotSpec } from "./types";

/** Unity-style critically damped spring: reaches the target in about `smoothTime` seconds with no overshoot. */
export function smoothDamp(current: number, target: number, vel: { v: number }, smoothTime: number, dt: number) {
  const omega = 2 / Math.max(smoothTime, 1e-4);
  const x = omega * dt;
  const e = 1 / (1 + x + 0.48 * x * x + 0.235 * x * x * x);
  const change = current - target;
  const temp = (vel.v + omega * change) * dt;
  vel.v = (vel.v - omega * temp) * e;
  return target + (change + temp) * e;
}

const MAX_NUDGE_AZ = 32; // degrees the visitor may swing the camera either way
const MAX_NUDGE_EL = 5;

export class CameraRig {
  azimuth = 24;
  elevation = 5;
  distance = 7;
  fov = 32;
  readonly target = new THREE.Vector3(0, 0.95, 0.2);
  /** Visitor's nudge (degrees); decays back to 0 a moment after they let go. */
  nudgeAz = 0;
  nudgeEl = 0;
  private goal: ShotSpec | null = null;
  private v = { az: { v: 0 }, el: { v: 0 }, d: { v: 0 }, fov: { v: 0 }, tx: { v: 0 }, ty: { v: 0 }, tz: { v: 0 }, nz: { v: 0 }, ne: { v: 0 } };
  private held = false;
  private idle = 0;
  private snapNext = true;
  /** Seconds a move takes (about); a shot change reads as one calm move. */
  smoothTime = 0.85;
  /** 1 lets the camera drift a hair off its mark (a living shot); 0 holds it dead still (reduced motion). */
  life = 1;

  setShot(shot: ShotSpec) {
    this.goal = shot;
  }

  /** The next update jumps straight to the shot (first frame, reduced motion). */
  snap() {
    this.snapNext = true;
  }

  /** The visitor drags: `dx`, `dy` in pixels across a canvas `width` px wide. */
  nudge(dx: number, dy: number, width: number) {
    this.held = true;
    this.idle = 0;
    const k = 60 / Math.max(width, 200); // a drag across the whole canvas is 60 degrees
    this.nudgeAz = clamp(this.nudgeAz - dx * k, -MAX_NUDGE_AZ, MAX_NUDGE_AZ);
    this.nudgeEl = clamp(this.nudgeEl + dy * k * 0.35, -MAX_NUDGE_EL, MAX_NUDGE_EL);
  }

  release() {
    this.held = false;
    this.idle = 0;
  }

  /** Back to the shot, now (the Reset View button). */
  resetNudge() {
    this.held = false;
    this.nudgeAz = 0;
    this.nudgeEl = 0;
  }

  get settled() {
    const g = this.goal;
    if (!g) return true;
    return (
      Math.abs(this.azimuth - (g.azimuth + this.nudgeAz)) < 0.02 && Math.abs(this.elevation - g.elevation) < 0.02 &&
      Math.abs(this.fov - g.fov) < 0.02 && Math.abs(this.nudgeAz) < 0.02 && Math.abs(this.nudgeEl) < 0.02 && !this.held
    );
  }

  update(dt: number, aspect: number, time: number) {
    const g = this.goal;
    if (!g) return;
    if (!this.held) {
      this.idle += dt;
      if (this.idle > 1.2) {
        this.nudgeAz = smoothDamp(this.nudgeAz, 0, this.v.nz, 1.1, dt);
        this.nudgeEl = smoothDamp(this.nudgeEl, 0, this.v.ne, 1.1, dt);
        if (Math.abs(this.nudgeAz) < 0.01) this.nudgeAz = 0;
        if (Math.abs(this.nudgeEl) < 0.01) this.nudgeEl = 0;
      }
    }
    const drift = this.life * (0.55 * Math.sin(time * 0.17) + 0.3 * Math.sin(time * 0.31 + 1.3));
    const az = g.azimuth + this.nudgeAz + drift;
    const el = g.elevation + this.nudgeEl + this.life * 0.15 * Math.sin(time * 0.23 + 0.4);
    const dist = fitDistance(g, aspect);
    if (this.snapNext) {
      this.snapNext = false;
      this.azimuth = az;
      this.elevation = el;
      this.distance = dist;
      this.fov = g.fov;
      this.target.set(...g.target);
      for (const k of Object.values(this.v)) k.v = 0;
      return;
    }
    const t = this.smoothTime;
    this.azimuth = smoothDamp(this.azimuth, az, this.v.az, this.held ? 0.18 : t, dt);
    this.elevation = smoothDamp(this.elevation, el, this.v.el, this.held ? 0.18 : t, dt);
    this.distance = smoothDamp(this.distance, dist, this.v.d, t, dt);
    this.fov = smoothDamp(this.fov, g.fov, this.v.fov, t, dt);
    this.target.set(smoothDamp(this.target.x, g.target[0], this.v.tx, t, dt), smoothDamp(this.target.y, g.target[1], this.v.ty, t, dt), smoothDamp(this.target.z, g.target[2], this.v.tz, t, dt));
  }

  apply(camera: THREE.PerspectiveCamera) {
    const shot: ShotSpec = { azimuth: this.azimuth, elevation: this.elevation, distance: this.distance, fov: this.fov, target: [this.target.x, this.target.y, this.target.z] };
    const [x, y, z] = shotPosition(shot, this.distance);
    camera.position.set(x, y, z);
    camera.lookAt(this.target);
    if (Math.abs(camera.fov - this.fov) > 1e-4) {
      camera.fov = this.fov;
      camera.updateProjectionMatrix();
    }
  }

  /** The unit direction the camera looks along on the ground plane (for placing things relative to the view). */
  viewYaw() {
    return -this.azimuth * DEG;
  }
}
