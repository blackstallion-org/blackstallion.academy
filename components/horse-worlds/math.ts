/**
 * The arithmetic of the treadmill and of the layered scenery, kept free of three.js so it can be tested on its own
 * (tests/horse-worlds.test.mjs). Everything here is in metres and seconds.
 */
import type { ShotSpec, Vec3Tuple } from "./types";

export const DEG = Math.PI / 180;
export const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const smoothstep = (a: number, b: number, x: number) => {
  const t = clamp((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};
/** Frame-rate independent exponential approach: `lambda` is 1 / time constant (per second). */
export const damp = (current: number, target: number, lambda: number, dt: number) => lerp(current, target, 1 - Math.exp(-lambda * dt));
export const mod = (x: number, m: number) => ((x % m) + m) % m;

/** v = L x f: the ground speed (m/s) that goes with a stride of `strideLength` metres taken `strideFrequency` times a second. */
export const strideSpeed = (strideLength: number, strideFrequency: number) => strideLength * strideFrequency;

/** d(t + dt) = d(t) + v dt: how far the ground has travelled under the hooves. */
export const integrateDistance = (distance: number, v: number, dt: number) => distance + v * dt;

/** Apparent angular speed (rad/s) of scenery `depth` metres away when the ground moves sideways at `v`. */
export const angularRate = (v: number, depth: number) => v / Math.max(depth, 1e-3);

/** How many texture tiles have slid past after `distance` metres, for a flat layer whose tile covers `tileMetres`. */
export const flatScroll = (distance: number, tileMetres: number) => distance / tileMetres;

/** How many tiles of a ring layer (radius R, `repeats` tiles around it) have slid past: the ring turns by distance / R. */
export const ringScroll = (distance: number, radius: number, repeats: number) => (distance / (2 * Math.PI * radius)) * repeats;

/**
 * Where the ground's grid lines fall along one axis (2 x cuts + 1 of them across `size` metres): the origin, where the hooves are,
 * is always a line, and the lines are close together there and spread out toward the edge (spacing grows with `power`; 1 = even).
 * A flat plane 1.8 km wide drawn as two triangles makes the GPU interpolate the texture and shadow coordinates over a triangle
 * thousands of times bigger than the picture, and the rounding then moves the sand by a few centimetres from one frame to the
 * next as the camera drifts. Cutting it into small triangles near the horse removes that, for a few thousand triangles.
 */
export function groundAxis(size: number, cuts: number, power: number): number[] {
  const half = size / 2;
  const out: number[] = [];
  for (let i = -cuts; i <= cuts; i++) out.push(Math.sign(i) * Math.pow(Math.abs(i) / cuts, power) * half);
  return out;
}

/** Where a recycled sprite sits: its base position along the track after the world has moved `scroll` metres, wrapped into +-span/2. */
export const wrapAlongTrack = (base: number, scroll: number, span: number) => {
  const t = base - scroll;
  const lap = Math.floor((t + span / 2) / span);
  return { z: t - lap * span, lap };
};

/**
 * The ground speed to scroll the world at. `nominal` is L x f from the gait table; `measured` is what the planted hooves of the
 * running clips actually do (m/s, or null while no hoof is in mid-stance). The measurement may move the result by at most
 * +-`limit` of the nominal speed, so a noisy frame can never throw the scenery. `steady` (0 to 1, see `steadiness`) scales how much
 * of the measurement is used.
 */
export const calibratedGroundSpeed = (nominal: number, measured: number | null, weight = 0.85, limit = 0.15, steady = 1) => {
  if (measured === null || nominal < 0.6) return nominal;
  const ratio = clamp(measured / nominal, 1 - limit, 1 + limit);
  return nominal * lerp(1, ratio, weight * steady);
};

/**
 * How far the hooves' measured speed should be trusted: 1 while the horse is at the pace it was asked for, falling to 0 once it is
 * more than half a metre per second off it (still braking or still setting off). While the clips blend into one another the
 * planted hooves briefly seem to move 25 % faster than the stride says, and following that made the ground surge while the horse
 * was slowing down. `gap` is the asked-for speed minus the actual speed. (The treadmill eases its trust toward this, slowly.)
 */
export const steadiness = (gap: number) => 1 - smoothstep(0.05, 0.5, Math.abs(gap));

/** Where a shot puts the camera: spherical about its target (azimuth 0 = the horse's right side, +Z toward the front). */
export function shotPosition(shot: ShotSpec, distance = shot.distance): Vec3Tuple {
  const az = shot.azimuth * DEG;
  const el = shot.elevation * DEG;
  const [tx, ty, tz] = shot.target;
  return [tx - Math.cos(az) * Math.cos(el) * distance, ty + Math.sin(el) * distance, tz + Math.sin(az) * Math.cos(el) * distance];
}

/**
 * The distance at which a frame `aspect` wide shows at least `halfWidth` metres either side of the target (the whole horse
 * with a margin), so the horse is never cropped on a narrow screen. Never closer than the shot asks for.
 */
export function fitDistance(shot: ShotSpec, aspect: number, halfWidth = 2.2) {
  const halfV = Math.tan((shot.fov * DEG) / 2);
  const needed = halfWidth / Math.max(halfV * aspect, 1e-3);
  return Math.max(shot.distance, Math.min(needed, 40));
}

/** The screen-right component (0..1) of a horse travelling along +Z seen from azimuth `azimuthDeg`: how much of its speed shows sideways. */
export const lateralShare = (azimuthDeg: number) => Math.cos(azimuthDeg * DEG);
