import * as THREE from "three";
import type { HeightField } from "./heightfield";

/**
 * The camera of the sculpture: it orbits a target on the surface, always looking roughly north, and cannot be taken anywhere that
 * would disorient: the turn is limited to either side of north, the tilt keeps the map below the horizon, the zoom has a floor
 * and a ceiling, the target stays on the plate and the camera never goes below the terrain.
 */
export type Pose = {
  /** Turn from due north, radians; positive swings the camera towards the east. */
  az: number;
  /** Angle from straight down, radians. */
  pol: number;
  dist: number;
  tx: number;
  tz: number;
  /** Screen-space shift of the picture as a fraction of width and height, to leave room for the card. */
  sx: number;
  sy: number;
};

export const FOV = 28;
const AZ = 0.72;
const POL: [number, number] = [0.2, 1.02];
const CLEARANCE = 0.55;

export class CameraRig {
  pose: Pose;
  private fit = 20;
  private inset = { top: 0, bottom: 0 };
  private readonly target = new THREE.Vector3();
  private readonly overview: Pose;

  constructor(
    readonly camera: THREE.PerspectiveCamera,
    private readonly bounds: { x: [number, number]; z: [number, number] },
    private readonly india: { x: [number, number]; z: [number, number] },
    private readonly heights: HeightField,
  ) {
    const cx = (india.x[0] + india.x[1]) / 2;
    const cz = (india.z[0] + india.z[1]) / 2;
    this.overview = { az: 0, pol: 0.74, dist: 20, tx: cx, tz: cz + 0.15, sx: 0, sy: 0 };
    this.pose = { ...this.overview };
  }

  get minDist() { return 3.4; }
  get maxDist() { return this.fit * 1.12; }
  get fitDistance() { return this.fit; }

  /** Pixels at the top (the site's navigation) and the bottom (the controls) that the picture must keep clear. */
  setInset(top: number, bottom: number) {
    this.inset = { top, bottom };
  }

  /** Distance at which India's whole outline fits the clear part of the view at the overview tilt. */
  setAspect(aspect: number, viewH: number) {
    // a narrow frame looks more nearly straight down, so the country fills its height instead of a thin band across the middle
    const narrow = THREE.MathUtils.clamp((1.3 - aspect) / 0.8, 0, 1);
    this.overview.pol = 0.74 - 0.32 * narrow;
    const tan = Math.tan(THREE.MathUtils.degToRad(FOV) / 2);
    const w = (this.india.x[1] - this.india.x[0]) * 1.03;
    const d = (this.india.z[1] - this.india.z[0]) * 1.02;
    const depth = d * Math.cos(this.overview.pol) + 1.1 * Math.sin(this.overview.pol);
    const clear = THREE.MathUtils.clamp((viewH - this.inset.top - this.inset.bottom) / viewH, 0.55, 1);
    this.fit = Math.max(depth / 2 / tan / clear, w / 2 / (tan * aspect)) * 1.0;
    this.overview.dist = this.fit;
    // centre the country in the clear band: the picture moves down by half the difference of the insets
    this.overview.sy = -(this.inset.top - this.inset.bottom) / 2 / viewH;
    this.pose.dist = Math.min(this.pose.dist, this.maxDist);
  }

  overviewPose(): Pose {
    return { ...this.overview };
  }

  /** The pose for looking at a marker. */
  focusPose(x: number, z: number, shift: { sx: number; sy: number }): Pose {
    return { az: THREE.MathUtils.clamp(this.pose.az * 0.4, -AZ, AZ), pol: 0.7, dist: Math.max(this.minDist, this.fit * 0.4), tx: x, tz: z, sx: shift.sx, sy: shift.sy + this.overview.sy };
  }

  clamp() {
    const p = this.pose;
    p.az = THREE.MathUtils.clamp(p.az, -AZ, AZ);
    p.pol = THREE.MathUtils.clamp(p.pol, POL[0], POL[1]);
    p.dist = THREE.MathUtils.clamp(p.dist, this.minDist, this.maxDist);
    // the target may roam over the plate, and only just beyond India's outline
    p.tx = THREE.MathUtils.clamp(p.tx, this.india.x[0] - 0.4, this.india.x[1] + 0.4);
    p.tz = THREE.MathUtils.clamp(p.tz, this.india.z[0] - 0.4, this.india.z[1] + 0.4);
    p.sx = THREE.MathUtils.clamp(p.sx, -0.3, 0.3);
    p.sy = THREE.MathUtils.clamp(p.sy, -0.3, 0.3);
  }

  /** Writes the pose to the camera. Returns true once it is final (no clearance adjustment pending). */
  apply(viewW: number, viewH: number) {
    this.clamp();
    const p = this.pose;
    const ty = this.heights.maxNear(p.tx, p.tz, 0.12);
    this.target.set(p.tx, ty, p.tz);
    let pol = p.pol;
    const place = () => {
      const s = Math.sin(pol);
      this.camera.position.set(this.target.x + p.dist * s * Math.sin(p.az), this.target.y + p.dist * Math.cos(pol), this.target.z + p.dist * s * Math.cos(p.az));
    };
    place();
    // never below the terrain: tip the camera up until it clears whatever is under it
    for (let i = 0; i < 24; i++) {
      const floor = this.heights.maxNear(this.camera.position.x, this.camera.position.z, 0.2) + CLEARANCE;
      if (this.camera.position.y >= floor) break;
      pol = Math.max(0.05, pol - 0.04);
      place();
    }
    this.camera.lookAt(this.target);
    if (Math.abs(p.sx) > 1e-4 || Math.abs(p.sy) > 1e-4) {
      this.camera.setViewOffset(viewW, viewH, p.sx * viewW, p.sy * viewH, viewW, viewH);
    } else if (this.camera.view?.enabled) {
      this.camera.clearViewOffset();
    }
    this.camera.updateMatrixWorld();
  }

  orbit(dAz: number, dPol: number) {
    this.pose.az += dAz;
    this.pose.pol += dPol;
  }

  zoom(factor: number) {
    this.pose.dist *= factor;
  }

  /** Move the target over the ground by a screen-space drag of (dx, dy) pixels. */
  pan(dx: number, dy: number, viewH: number) {
    const p = this.pose;
    const perPx = (2 * p.dist * Math.tan(THREE.MathUtils.degToRad(FOV) / 2)) / viewH;
    const rx = Math.cos(p.az), rz = -Math.sin(p.az);
    const fx = -Math.sin(p.az), fz = -Math.cos(p.az);
    const depth = perPx / Math.max(0.4, Math.cos(p.pol));
    p.tx += -dx * perPx * rx + dy * depth * fx;
    p.tz += -dx * perPx * rz + dy * depth * fz;
  }
}
