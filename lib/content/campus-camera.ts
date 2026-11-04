import { bottom, left, right, top, type CampusModule, type CampusTier, type Side } from "./campus";

/**
 * Camera poses for the campus scale model, as pure maths so the test can check them without WebGL. A pose is spherical about
 * a target: `az` is measured from +z (south) towards +x (east), `polar` from straight up. Metres, radians.
 */
export type Pose = { az: number; polar: number; radius: number; target: [number, number, number] };

export const FOV = 28;
/** The aspect the base radii are fitted for; narrower stages pull the camera back so the whole plot still fits. */
export const REFERENCE_ASPECT = 1.5;
/** Orbit limits: never under the horizon, never past straight down. */
export const MIN_POLAR = 0.05;
export const MAX_POLAR = 1.3;
/** From the south-west: the stall fronts, the lounge, tack room and pavilion all face this way. */
export const ISO_AZ = -0.62;
export const ISO_POLAR = 0.98;

const FACE: Record<Side, number> = { s: 0, e: Math.PI / 2, n: Math.PI, w: -Math.PI / 2 };

export const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/** Pull-back for a stage narrower than the reference aspect. */
export const aspectFactor = (aspect: number) => clamp(REFERENCE_ASPECT / Math.max(0.3, aspect), 1, 2.4);

export function poseToPosition(p: Pose): [number, number, number] {
  const s = Math.sin(p.polar);
  return [p.target[0] + p.radius * s * Math.sin(p.az), p.target[1] + p.radius * Math.cos(p.polar), p.target[2] + p.radius * s * Math.cos(p.az)];
}

/** Camera distance that fits the whole plot at the reference aspect, from the plot's screen span at this azimuth. */
export function overviewRadius(t: CampusTier, az = ISO_AZ): number {
  // The plinth adds 1.6 m a side; the near corner is closer to the lens than the middle, so it looms a little larger.
  const span = (t.site.w + 3.2) * Math.abs(Math.cos(az)) + (t.site.d + 3.2) * Math.abs(Math.sin(az));
  const halfH = Math.tan((FOV * Math.PI) / 360) * REFERENCE_ASPECT;
  return ((span * 0.5) / halfH) * 1.2;
}

export function overviewPose(t: CampusTier, aspect = REFERENCE_ASPECT): Pose {
  return { az: ISO_AZ, polar: ISO_POLAR, radius: overviewRadius(t) * aspectFactor(aspect), target: [0, 1, 0] };
}

export function topPose(t: CampusTier, aspect = REFERENCE_ASPECT): Pose {
  // Rotated a quarter turn from the plan so the long side of the plot runs across a landscape stage.
  return { az: 0, polar: MIN_POLAR, radius: overviewRadius(t, 0) * 0.92 * aspectFactor(aspect), target: [0, 0, 0] };
}

export function focusPose(t: CampusTier, m: CampusModule, aspect = REFERENCE_ASPECT): Pose {
  const base = overviewRadius(t);
  const diag = Math.hypot(m.rect.w, m.rect.d);
  const k = aspectFactor(aspect);
  const isArena = m.kind === "arena";
  const radius = clamp(diag * 2.6 + 10, 30, base * 0.82) * (1 + (k - 1) * 0.75);
  return {
    az: isArena ? ISO_AZ : FACE[m.facing] + 0.6,
    // Low enough to read the facades, high enough to see over the neighbours.
    polar: m.kind === "arena" ? ISO_POLAR : m.kind === "lounge" ? 0.9 : m.kind === "pavilion" ? 1.08 : 1.12,
    radius,
    target: [m.rect.x, Math.min(m.height * 0.45, 3.2), m.rect.z],
  };
}

/** Shortest signed turn from a to b, radians. */
export const turn = (a: number, b: number) => Math.atan2(Math.sin(b - a), Math.cos(b - a));

/** Linear blend of two poses (the azimuth takes the short way round). t runs 0..1. */
export function lerpPose(a: Pose, b: Pose, t: number): Pose {
  const l = (x: number, y: number) => x + (y - x) * t;
  return {
    az: a.az + turn(a.az, b.az) * t,
    polar: l(a.polar, b.polar),
    radius: l(a.radius, b.radius),
    target: [l(a.target[0], b.target[0]), l(a.target[1], b.target[1]), l(a.target[2], b.target[2])],
  };
}

export const zoomLimits = (t: CampusTier, aspect = REFERENCE_ASPECT) => {
  const base = overviewRadius(t);
  return { min: base * 0.14, max: base * aspectFactor(aspect) * 1.35 };
};

/* ------------------------------------------------------------ clipping */

const HORIZONTAL_PAD = 1.5;
const VERTICAL_PAD = 1.3;
/** Nearest the camera may come to the terrain top. */
export const MIN_CAMERA_HEIGHT = 1.6;

/** True when the camera would sit inside a building (or its safety margin) or under the terrain. */
export function isClipping(position: readonly [number, number, number], t: CampusTier): boolean {
  const [x, y, z] = position;
  if (y < MIN_CAMERA_HEIGHT) return true;
  for (const m of t.modules) {
    const r = m.rect;
    if (x > left(r) - HORIZONTAL_PAD && x < right(r) + HORIZONTAL_PAD && z > top(r) - HORIZONTAL_PAD && z < bottom(r) + HORIZONTAL_PAD && y < m.height + VERTICAL_PAD) return true;
  }
  return false;
}
