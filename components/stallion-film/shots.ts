import * as THREE from "three";
import { clamp, damp, lerp, smoothstep, wobble } from "./noise";

export type ShotCtx = {
  P: THREE.Vector3; // horse position (ground, world)
  heading: number;
  speed: number;
  aspect: number;
  /** seconds since this shot began */
  t: number;
  groundAt: (x: number, z: number) => number;
};
export type ShotPose = { pos: THREE.Vector3; look: THREE.Vector3; fov: number };

/**
 * One camera idea, expressed in the horse's own frame. `alpha` is where the camera sits around the horse
 * (0 = in front looking back, 90 = its left, 180 = behind, 270 = its right), `dist` how far, `fit` the horse extents
 * (m) that must stay inside the frame, so the whole animal is visible at any aspect ratio.
 */
export type ShotSpec = {
  alpha: number;
  dist: number;
  height: number;
  lookAhead: number;
  lookHeight: number;
  fov: number;
  /** 1 = rides with the horse, 0 = stays where it was placed when the shot began */
  follow: number;
  fit: { w: number; h: number };
  driftAlpha?: number;
  driftDist?: number;
  driftHeight?: number;
  /** replacements used on tall/narrow screens (portrait phones) */
  portrait?: Partial<Omit<ShotSpec, "portrait">>;
};

export function fitDistance(fovDeg: number, aspect: number, w: number, h: number) {
  const half = Math.tan(THREE.MathUtils.degToRad(fovDeg) / 2);
  return Math.max(h / (2 * half), w / (2 * half * aspect));
}

export class Shot {
  private anchor: THREE.Vector3 | null = null;
  private readonly F = new THREE.Vector3();
  private readonly L = new THREE.Vector3();
  constructor(readonly id: string, readonly spec: ShotSpec) {}

  begin(ctx: Omit<ShotCtx, "t">) {
    this.anchor = null;
    if (this.spec.follow < 1) {
      const p = new THREE.Vector3();
      this.place({ ...ctx, t: 0 }, 1, p);
      this.anchor = p;
    }
  }

  private effective(aspect: number): ShotSpec {
    return aspect < 0.85 && this.spec.portrait ? { ...this.spec, ...this.spec.portrait } : this.spec;
  }

  private place(ctx: ShotCtx, follow: number, out: THREE.Vector3) {
    const s = this.effective(ctx.aspect);
    const a = THREE.MathUtils.degToRad(s.alpha + (s.driftAlpha ?? 0) * ctx.t);
    const need = fitDistance(s.fov, ctx.aspect, s.fit.w, s.fit.h);
    const d = Math.max(s.dist + (s.driftDist ?? 0) * ctx.t, need);
    this.F.set(Math.sin(ctx.heading), 0, Math.cos(ctx.heading));
    this.L.set(Math.cos(ctx.heading), 0, -Math.sin(ctx.heading));
    out.copy(ctx.P).addScaledVector(this.F, Math.cos(a) * d).addScaledVector(this.L, Math.sin(a) * d);
    out.y = ctx.P.y + s.height + (s.driftHeight ?? 0) * ctx.t;
    void follow;
    return out;
  }

  compute(ctx: ShotCtx, out: ShotPose) {
    const s = this.effective(ctx.aspect);
    this.place(ctx, 1, out.pos);
    if (this.anchor && s.follow < 1) out.pos.lerpVectors(this.anchor, out.pos, s.follow);
    // a little slow drift so a held shot is never dead still
    out.pos.x += wobble(ctx.t * 0.2, 91) * 0.12;
    out.pos.y += wobble(ctx.t * 0.17, 92) * 0.05;
    const floor = ctx.groundAt(out.pos.x, out.pos.z) + 0.45;
    if (out.pos.y < floor) out.pos.y = floor;
    out.look.set(Math.sin(ctx.heading), 0, Math.cos(ctx.heading)).multiplyScalar(s.lookAhead).add(ctx.P);
    out.look.y = ctx.P.y + s.lookHeight;
    out.fov = s.fov;
  }
}

/** Blends from one shot to the next over a couple of seconds and smooths the result; the camera never cuts. */
export class CameraRig {
  private a: Shot | null = null;
  private b: Shot | null = null;
  private tA = 0;
  private tB = 0;
  private blend = 1;
  private blendDur = 2.2;
  readonly pose: ShotPose = { pos: new THREE.Vector3(), look: new THREE.Vector3(), fov: 30 };
  private readonly pa: ShotPose = { pos: new THREE.Vector3(), look: new THREE.Vector3(), fov: 30 };
  private readonly pb: ShotPose = { pos: new THREE.Vector3(), look: new THREE.Vector3(), fov: 30 };
  private smoothPos = new THREE.Vector3();
  private smoothLook = new THREE.Vector3();
  private smoothFov = 30;
  private initialised = false;
  get current() {
    return this.b ?? this.a;
  }

  /** Start (or continue) a shot. `instant` snaps straight to it. */
  cut(shot: Shot, ctx: Omit<ShotCtx, "t">, instant = false, blendDur = 2.2) {
    if (this.b?.id === shot.id) return;
    shot.begin(ctx);
    if (instant || !this.initialised || !this.b) {
      this.a = shot;
      this.b = shot;
      this.tA = this.tB = 0;
      this.blend = 1;
      this.initialised = false;
      return;
    }
    this.a = this.b;
    this.tA = this.tB;
    this.b = shot;
    this.tB = 0;
    this.blend = 0;
    this.blendDur = blendDur;
  }

  update(dt: number, ctx: Omit<ShotCtx, "t">) {
    if (!this.b) return this.pose;
    this.tB += dt;
    this.tA += dt;
    this.blend = Math.min(1, this.blend + dt / this.blendDur);
    this.b.compute({ ...ctx, t: this.tB }, this.pb);
    if (this.blend < 1 && this.a && this.a !== this.b) {
      this.a.compute({ ...ctx, t: this.tA }, this.pa);
      const k = smoothstep(0, 1, this.blend);
      this.pose.pos.lerpVectors(this.pa.pos, this.pb.pos, k);
      this.pose.look.lerpVectors(this.pa.look, this.pb.look, k);
      this.pose.fov = lerp(this.pa.fov, this.pb.fov, k);
    } else {
      this.pose.pos.copy(this.pb.pos);
      this.pose.look.copy(this.pb.look);
      this.pose.fov = this.pb.fov;
    }
    if (!this.initialised) {
      this.smoothPos.copy(this.pose.pos);
      this.smoothLook.copy(this.pose.look);
      this.smoothFov = this.pose.fov;
      this.initialised = true;
    } else {
      // a loose follow: the camera trails a fast horse a little, which is what a tracking vehicle does
      const rate = 4.5 + clamp(ctx.speed, 0, 12) * 0.12;
      this.smoothPos.x = damp(this.smoothPos.x, this.pose.pos.x, rate, dt);
      this.smoothPos.y = damp(this.smoothPos.y, this.pose.pos.y, rate, dt);
      this.smoothPos.z = damp(this.smoothPos.z, this.pose.pos.z, rate, dt);
      this.smoothLook.x = damp(this.smoothLook.x, this.pose.look.x, rate * 1.3, dt);
      this.smoothLook.y = damp(this.smoothLook.y, this.pose.look.y, rate * 1.3, dt);
      this.smoothLook.z = damp(this.smoothLook.z, this.pose.look.z, rate * 1.3, dt);
      this.smoothFov = damp(this.smoothFov, this.pose.fov, 3, dt);
    }
    return { pos: this.smoothPos, look: this.smoothLook, fov: this.smoothFov };
  }

  /** Jump the smoothed state to a place (after a teleport between environments). */
  snap() {
    this.initialised = false;
  }
}

/* ------------------------------------------------------------------ the shot library */
const S = (spec: ShotSpec) => spec;
export const SHOT_SPECS: Record<string, ShotSpec> = {
  // CHAPTER I
  wideEstablish: S({ alpha: 125, dist: 14, height: 3.4, lookAhead: 0.4, lookHeight: 1.1, fov: 30, follow: 0, fit: { w: 3, h: 2.6 }, driftAlpha: -1.2, driftDist: -0.25, portrait: { alpha: 150, dist: 11 } }),
  pushIn: S({ alpha: 118, dist: 9.5, height: 2.0, lookAhead: 0.6, lookHeight: 1.15, fov: 30, follow: 0.35, fit: { w: 3.2, h: 2.6 }, driftAlpha: -1.6, driftDist: -0.5, portrait: { alpha: 150 } }),
  lowProfile: S({ alpha: 88, dist: 5.6, height: 0.75, lookAhead: 1.0, lookHeight: 1.0, fov: 34, follow: 1, fit: { w: 3.8, h: 2.8 }, driftAlpha: 0.4, portrait: { alpha: 140, dist: 7 } }),
  sideTrack: S({ alpha: 90, dist: 5.2, height: 1.35, lookAhead: 1.2, lookHeight: 1.0, fov: 32, follow: 1, fit: { w: 3.9, h: 2.8 }, driftAlpha: 0.5, portrait: { alpha: 125, dist: 6 } }),
  rearTrack: S({ alpha: 192, dist: 7.4, height: 1.9, lookAhead: 1.4, lookHeight: 1.05, fov: 32, follow: 1, fit: { w: 2.8, h: 2.8 }, driftAlpha: 2.0, portrait: { alpha: 200 } }),
  wideTrack: S({ alpha: 100, dist: 17, height: 3.8, lookAhead: 2.0, lookHeight: 0.9, fov: 32, follow: 0.55, fit: { w: 4.2, h: 3 }, driftAlpha: -1.5, portrait: { alpha: 125, dist: 15 } }),
  // CHAPTER II
  villageSide: S({ alpha: 82, dist: 5.4, height: 1.45, lookAhead: 1.0, lookHeight: 1.05, fov: 34, follow: 1, fit: { w: 3.6, h: 2.7 }, driftAlpha: 0.8, portrait: { alpha: 120, dist: 5.8 } }),
  villageReveal: S({ alpha: 150, dist: 8.0, height: 2.1, lookAhead: 0.5, lookHeight: 1.2, fov: 34, follow: 1, fit: { w: 3.0, h: 2.7 }, driftAlpha: -3.2, portrait: { alpha: 160, dist: 8 } }),
  villageGate: S({ alpha: 12, dist: 9.0, height: 1.7, lookAhead: 0.0, lookHeight: 1.2, fov: 36, follow: 0.8, fit: { w: 2.2, h: 2.6 }, driftDist: -0.4, portrait: { alpha: 20 } }),
  courtyardWide: S({ alpha: 105, dist: 13, height: 2.6, lookAhead: 0.5, lookHeight: 1.1, fov: 34, follow: 0.45, fit: { w: 3.6, h: 2.8 }, driftAlpha: -1.0, portrait: { alpha: 140, dist: 12 } }),
  // CHAPTER III
  campusFollow: S({ alpha: 28, dist: 7.2, height: 1.2, lookAhead: 0.4, lookHeight: 1.1, fov: 32, follow: 1, fit: { w: 3.0, h: 2.8 }, driftAlpha: 1.4, portrait: { alpha: 30 } }),
  campusSide: S({ alpha: 85, dist: 7.6, height: 1.6, lookAhead: 0.8, lookHeight: 1.05, fov: 32, follow: 1, fit: { w: 3.8, h: 2.8 }, driftAlpha: -0.6, portrait: { alpha: 125, dist: 8 } }),
  arenaWide: S({ alpha: 100, dist: 22, height: 6.0, lookAhead: 0.0, lookHeight: 0.8, fov: 32, follow: 0.3, fit: { w: 4.2, h: 3 }, driftAlpha: 1.0, portrait: { alpha: 130, dist: 20 } }),
  finalWide: S({ alpha: 32, dist: 12, height: 1.9, lookAhead: 0.0, lookHeight: 1.1, fov: 30, follow: 0, fit: { w: 3.4, h: 3.0 }, driftDist: -0.45, portrait: { alpha: 28, dist: 11 } }),
  // QA only: a close look at the muzzle, used to check the face materials
  qaMuzzle: S({ alpha: 4, dist: 2.0, height: 1.22, lookAhead: 1.25, lookHeight: 1.22, fov: 14, follow: 1, fit: { w: 0.05, h: 0.05 } }),
  qaEye: S({ alpha: 70, dist: 1.0, height: 1.85, lookAhead: 1.06, lookHeight: 1.84, fov: 14, follow: 1, fit: { w: 0.05, h: 0.05 } }),
  finalClose: S({ alpha: 24, dist: 5.4, height: 1.55, lookAhead: 0.0, lookHeight: 1.35, fov: 30, follow: 0, fit: { w: 2.3, h: 2.8 }, driftDist: -0.25, portrait: { alpha: 20 } }),
};

export function buildShots() {
  const out: Record<string, Shot> = {};
  for (const [id, spec] of Object.entries(SHOT_SPECS)) out[id] = new Shot(id, spec);
  return out;
}
