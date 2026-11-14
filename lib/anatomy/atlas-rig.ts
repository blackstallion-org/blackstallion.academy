/**
 * BSAH anatomy atlas: a 2D lateral (near-side, the horse's left) horse-and-rider rig.
 *
 * Coordinates are SVG units in a 1200 x 760 drawing, y down, ground at y = 700; roughly 2.9 units to the centimetre for a
 * 150 cm (14.3 hh) Marwari at the withers. Every landmark is authored in a rest pose and belongs to a "frame" (the trunk,
 * the neck, the head, or one limb segment). Each animation frame the rig poses the frames and maps the rest points through
 * them, so bones, muscles and the body outline all move together and stretch across joints instead of floating apart.
 *
 * Limbs are driven from the hoof: a footfall pattern (lib/content/anatomy-atlas.ts) gives each hoof a stance/swing timing,
 * the hoof is placed on the ground during stance and flown along an arc during swing, the distal joints (fetlock, pastern,
 * carpus / hock) are set from gait curves, and the two proximal bones are solved by two-bone inverse kinematics. That keeps
 * stance hooves planted (no sliding) and makes the elbow, carpus, stifle and hock angles come out of the geometry.
 *
 * Proportions and joint-angle curves are approximations from veterinary anatomy and published gait kinematics, idealised for
 * teaching; the page says so, and lists what needs expert review.
 */

export type V = [number, number];

/* ------------------------------------------------------------------ vector helpers */
const add = (a: V, b: V): V => [a[0] + b[0], a[1] + b[1]];
const sub = (a: V, b: V): V => [a[0] - b[0], a[1] - b[1]];
const mul = (a: V, k: number): V => [a[0] * k, a[1] * k];
const len = (a: V) => Math.hypot(a[0], a[1]);
const D2R = Math.PI / 180;
/** rotate by degrees; y is down, so a positive angle turns clockwise on screen (a downward vector swings to the left, forward) */
export const rot = (a: V, deg: number): V => {
  const r = deg * D2R;
  const c = Math.cos(r);
  const s = Math.sin(r);
  return [a[0] * c - a[1] * s, a[0] * s + a[1] * c];
};
const ang = (a: V) => Math.atan2(a[1], a[0]) / D2R;
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const lerpV = (a: V, b: V, t: number): V => [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const smooth = (t: number) => t * t * (3 - 2 * t);
const wrap = (v: number) => ((v % 1) + 1) % 1;

/** piecewise smooth interpolation through [x, y] keys (x ascending) */
function keys(points: [number, number][], x: number) {
  if (x <= points[0][0]) return points[0][1];
  for (let i = 1; i < points.length; i++) {
    const [x1, y1] = points[i];
    const [x0, y0] = points[i - 1];
    if (x <= x1) return lerp(y0, y1, smooth((x - x0) / (x1 - x0 || 1)));
  }
  return points[points.length - 1][1];
}

/* ------------------------------------------------------------------ frames */
export type Xf = (p: V) => V;
/** a rigid frame that takes the rest segment a0→b0 onto the posed segment a→b (rotation + translation, no stretch) */
const segXf = (a0: V, b0: V, a: V, b: V): Xf => {
  const d = ang(sub(b, a)) - ang(sub(b0, a0));
  return (p) => add(a, rot(sub(p, a0), d));
};
const pivotXf = (pivot0: V, pivot: V, deg: number): Xf => (p) => add(pivot, rot(sub(p, pivot0), deg));

/* ------------------------------------------------------------------ rest skeleton (near side) */
export const GROUND = 700;
const NECK_SCALE = 1.12;
const NECK_CARRIAGE = 15;
const HEAD_SET = -24;
export const FAR_OFFSET: V = [12, -6];

export const REST = {
  trunkPivot: [580, 360] as V,
  neckPivot: [392, 345] as V, // C7–T1, the base of the neck
  poll: [238, 262] as V, // atlanto-occipital joint
  tailPivot: [768, 300] as V,
  scapPivot: [428, 316] as V, // the scapula swings about its upper third
  fore: { S: [365, 385] as V, E: [412, 450] as V, C: [392, 557] as V, F: [393, 628] as V, K: [372, 664] as V },
  hind: { H: [750, 385] as V, St: [706, 468] as V, Ho: [760, 548] as V, F: [757, 632] as V, K: [741, 667] as V },
  /** hoof, in the hoof frame, origin at the coronet; sole centre and toe */
  sole: [-8, 34] as V,
  toe: [-30, 36] as V,
  seat: [540, 286] as V, // the rider's hip joints
};

const FORE_L = { hum: len(sub(REST.fore.E, REST.fore.S)), rad: len(sub(REST.fore.C, REST.fore.E)) };
const HIND_L = { fem: len(sub(REST.hind.St, REST.hind.H)), tib: len(sub(REST.hind.Ho, REST.hind.St)) };

/* ------------------------------------------------------------------ gaits */
export type GaitId = "halt" | "walk" | "trot" | "canter";
export type LimbId = "LF" | "RF" | "LH" | "RH";

export type GaitDef = {
  /** stride seconds at 1x (real speed) */
  period: number;
  /** horizontal hoof travel during stance, units */
  stride: number;
  duty: number;
  /** footfall start of each limb, fraction of the stride */
  offset: Record<LimbId, number>;
  lift: { fore: number; hind: number };
  /** peak carpal / hock flexion in swing (degrees the cannon swings back) */
  flex: { fore: number; hind: number };
  bob: number;
  bobsPerStride: number;
  pitch: number;
  /** where in the stride the forehand is highest (canter: during the hind stance, coming down onto the leading fore) */
  pitchAt?: number;
  nod: number;
  nodsPerStride: number;
  /** fetlock drop (pastern extension) under load */
  load: number;
};

export const GAITS: Record<GaitId, GaitDef> = {
  halt: { period: 1, stride: 0, duty: 1, offset: { LH: 0, LF: 0, RH: 0, RF: 0 }, lift: { fore: 0, hind: 0 }, flex: { fore: 0, hind: 0 }, bob: 0, bobsPerStride: 0, pitch: 0, nod: 0, nodsPerStride: 0, load: 4 },
  // four-beat lateral sequence: LH, LF, RH, RF; two or three hooves always on the ground
  walk: { period: 1.15, stride: 150, duty: 0.63, offset: { LH: 0, LF: 0.25, RH: 0.5, RF: 0.75 }, lift: { fore: 46, hind: 36 }, flex: { fore: 62, hind: 38 }, bob: 3, bobsPerStride: 2, pitch: 0.6, nod: 3.2, nodsPerStride: 2, load: 9 },
  // two-beat diagonal: LF + RH together, then RF + LH, with a moment of suspension between
  trot: { period: 0.74, stride: 172, duty: 0.42, offset: { LF: 0, RH: 0, RF: 0.5, LH: 0.5 }, lift: { fore: 92, hind: 70 }, flex: { fore: 92, hind: 55 }, bob: 7, bobsPerStride: 2, pitch: 0.8, nod: 1, nodsPerStride: 2, load: 15 },
  // three-beat canter on the right lead: LH, then RH + LF together, then RF (the leading fore), then suspension
  canter: { period: 0.62, stride: 188, duty: 0.38, offset: { LH: 0, RH: 0.27, LF: 0.3, RF: 0.47 }, lift: { fore: 86, hind: 70 }, flex: { fore: 88, hind: 52 }, bob: 11, bobsPerStride: 1, pitch: 4.5, pitchAt: 0.0, nod: 6, nodsPerStride: 1, load: 16 },
};

/* ------------------------------------------------------------------ IK */
/** two-bone IK from root a to target t; returns the middle joint on the same side of a→t as `side` (+1 / -1) */
function ik2(a: V, t: V, l1: number, l2: number, side: number): { j: V; end: V } {
  const v = sub(t, a);
  const d = clamp(len(v), Math.abs(l1 - l2) + 0.5, l1 + l2 - 0.5);
  const base = ang(v);
  const cosA = clamp((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d), -1, 1);
  const A = Math.acos(cosA) / D2R;
  const j = add(a, rot([l1, 0], base + side * A));
  const end = add(a, rot([d, 0], base));
  return { j, end };
}
const cross = (a: V, b: V) => a[0] * b[1] - a[1] * b[0];
const FORE_SIDE = Math.sign(cross(sub(REST.fore.C, REST.fore.S), sub(REST.fore.E, REST.fore.S))) || 1;
const HIND_SIDE = Math.sign(cross(sub(REST.hind.Ho, REST.hind.H), sub(REST.hind.St, REST.hind.H))) || 1;

/* ------------------------------------------------------------------ pose */
export type LimbPose = {
  /** frames for this limb, keyed by segment name */
  xf: Record<string, Xf>;
  joints: Record<string, V>;
  stance: boolean;
  /** 0..1 progress through stance or swing */
  u: number;
};

export type Pose = {
  gait: GaitId;
  phase: number;
  xf: Record<string, Xf>;
  limbs: Record<LimbId, LimbPose>;
  rider: RiderPose;
  /** saddle vertical displacement from rest, units (+ = up) */
  saddleRise: number;
  /** ground scroll, units travelled since phase 0 */
  travel: number;
  pitch: number;
};

const NEAR: Record<LimbId, boolean> = { LF: true, LH: true, RF: false, RH: false };

type Chain = { root: V; mid: V; C: V; F: V; K: V; hoofAng: number; protr: number };
type Deltas = { m: number; c: number; f: number; p: number; hoof: number; protr: number };

/** the limb's rest geometry (near or far side) */
function restOf(id: LimbId) {
  const fore = id.endsWith("F");
  const off: V = NEAR[id] ? [0, 0] : FAR_OFFSET;
  const R = fore ? REST.fore : REST.hind;
  const root = add(fore ? REST.fore.S : REST.hind.H, off);
  const mid = add(fore ? REST.fore.E : REST.hind.St, off);
  const C = add(fore ? REST.fore.C : REST.hind.Ho, off);
  const F = add(R.F, off);
  const K = add(R.K, off);
  return { fore, off, root, mid, C, F, K, sole: add(K, REST.sole), toe: add(K, REST.toe), ground: GROUND + off[1] };
}

/**
 * Stance: the hoof is planted (sole centre on the ground, moving back under the body as the horse goes forward), the column
 * from fetlock to carpus/hock follows the limb's inclination, the fetlock sinks under load, the heel lifts at breakover, and the
 * two proximal bones are solved by IK.
 */
function stanceChain(id: LimbId, g: GaitDef, halt: boolean, u: number, trunk: Xf, scapRot: (p: number) => Xf): Chain {
  const r = restOf(id);
  const half = g.stride / 2;
  // the forefoot lands a little closer under the body than it leaves behind it (more of its stance is behind the vertical)
  const sole: V = [r.sole[0] - (r.fore ? 0.8 : 1) * half + g.stride * u, r.ground];
  const tilt = !halt && u > 0.78 ? keys([[0.78, 0], [1, r.fore ? 34 : 28]], u) : 0;
  const protr = r.fore ? clamp((r.sole[0] - sole[0]) / (half || 1), -1.2, 1.2) * (halt ? 0 : 7) : 0;
  // hoof: flat on the ground, rotated about the toe at breakover
  const toeW: V = add(sub(r.toe, r.sole), sole);
  const K = add(toeW, rot(sub(r.K, r.toe), -tilt));
  const root0 = (r.fore ? scapRot(protr) : trunk)(r.root);
  const incl = ang(sub(sole, root0)) - ang(sub(r.sole, r.root));
  const load = halt ? 0.3 : Math.sin(Math.PI * u);
  const dCan = (r.fore ? 1 : 0.85) * incl;
  let dPas = dCan + g.load * load - tilt * 0.55;
  const l1 = r.fore ? FORE_L.hum : HIND_L.fem;
  const l2 = r.fore ? FORE_L.rad : HIND_L.tib;
  let F = sub(K, rot(sub(r.K, r.F), dPas));
  let Ct = sub(F, rot(sub(r.F, r.C), dCan));
  // out of reach (a long stride, the back high): the pastern lands more upright, the fetlock less sunk, as at first contact
  for (let k = 0; k < 40 && len(sub(Ct, root0)) > l1 + l2 - 1.5; k++) {
    dPas -= 1;
    F = sub(K, rot(sub(r.K, r.F), dPas));
    Ct = sub(F, rot(sub(r.F, r.C), dCan));
  }
  const root = root0;
  const mid = ik2(root, Ct, l1, l2, r.fore ? FORE_SIDE : HIND_SIDE).j;
  const dir = sub(Ct, mid);
  const C = add(mid, mul(dir, l2 / (len(dir) || 1)));
  const sh = sub(C, Ct);
  return { root, mid, C, F: add(F, sh), K: add(K, sh), hoofAng: -tilt, protr };
}

const deltasOf = (id: LimbId, ch: Chain): Deltas => {
  const r = restOf(id);
  const d = (a: V, b: V, a0: V, b0: V) => normDeg(ang(sub(b, a)) - ang(sub(b0, a0)));
  return { m: d(ch.root, ch.mid, r.root, r.mid), c: d(ch.mid, ch.C, r.mid, r.C), f: d(ch.C, ch.F, r.C, r.F), p: d(ch.F, ch.K, r.F, r.K), hoof: ch.hoofAng, protr: ch.protr };
};
const normDeg = (a: number) => ((((a + 180) % 360) + 360) % 360) - 180;

/** swing flexion added on top of the lift-off → landing interpolation (degrees; + swings the lower end forward) */
function swingBumps(fore: boolean, g: GaitDef, s: number) {
  const b = (peak: number, at: number) => Math.sin(Math.PI * Math.pow(s, Math.log(0.5) / Math.log(at))) ** 1.2 * peak;
  if (fore)
    return {
      m: b(12, 0.55), // the elbow travels forward
      c: b(g.flex.fore * 0.32, 0.6), // the forearm reaches forward
      f: -b(g.flex.fore, 0.4), // the carpus folds: cannon swings back
      p: -b(28, 0.35), // the fetlock folds
      hoof: b(30, 0.4),
    };
  return {
    m: b(16, 0.55), // hip flexion: the stifle comes forward
    c: b(8, 0.55), // the gaskin swings forward with it
    f: -b(g.flex.hind, 0.32), // hock flexion folds the cannon back early in the swing (stifle and hock flex together)
    p: -b(26, 0.35),
    hoof: b(24, 0.4),
  };
}

function limbPose(id: LimbId, g: GaitDef, gait: GaitId, phase: number, trunk: Xf, scapRot: (protraction: number) => Xf): LimbPose {
  const r = restOf(id);
  const halt = gait === "halt";
  const p = halt ? 0 : wrap(phase - g.offset[id]);
  const stance = halt || p < g.duty;
  const u = halt ? 0.5 : stance ? p / g.duty : (p - g.duty) / (1 - g.duty);

  let ch: Chain;
  if (stance) {
    ch = stanceChain(id, g, halt, u, trunk, scapRot);
  } else {
    // swing: interpolate every segment angle from lift-off to landing, add the flexion wave, rebuild the chain forward
    const lift = deltasOf(id, stanceChain(id, g, halt, 1, trunk, scapRot));
    const land = deltasOf(id, stanceChain(id, g, halt, 0, trunk, scapRot));
    const e = smooth(clamp(u, 0, 1));
    const bump = swingBumps(r.fore, g, u);
    const L = (k: keyof Deltas) => lerp(lift[k], land[k], e);
    const protr = L("protr");
    const root = (r.fore ? scapRot(protr) : trunk)(r.root);
    const mid = add(root, rot(sub(r.mid, r.root), L("m") + bump.m));
    const C = add(mid, rot(sub(r.C, r.mid), L("c") + bump.c));
    const F = add(C, rot(sub(r.F, r.C), L("f") + bump.f));
    const K = add(F, rot(sub(r.K, r.F), L("p") + bump.p));
    ch = { root, mid, C, F, K, hoofAng: L("hoof") + bump.hoof, protr };
  }

  const hoof: Xf = (q) => add(ch.K, rot(sub(q, r.K), ch.hoofAng));
  const xf: Record<string, Xf> = r.fore
    ? {
        scap: scapRot(ch.protr),
        hum: segXf(r.root, r.mid, ch.root, ch.mid),
        rad: segXf(r.mid, r.C, ch.mid, ch.C),
        can: segXf(r.C, r.F, ch.C, ch.F),
        pas: segXf(r.F, r.K, ch.F, ch.K),
        hoof,
      }
    : {
        fem: segXf(r.root, r.mid, ch.root, ch.mid),
        tib: segXf(r.mid, r.C, ch.mid, ch.C),
        can: segXf(r.C, r.F, ch.C, ch.F),
        pas: segXf(r.F, r.K, ch.F, ch.K),
        hoof,
      };
  return { xf, joints: { root: ch.root, mid: ch.mid, C: ch.C, F: ch.F, K: ch.K }, stance, u };
}

/* ------------------------------------------------------------------ rider */
export type RiderPose = { xf: Record<string, Xf>; joints: Record<string, V> };

export const RIDER_REST = {
  hip: REST.seat,
  lumbar: [539, 226] as V, // T12–L1
  c7: [536, 166] as V,
  shoulder: [533, 176] as V,
  head: [535, 124] as V,
  elbow: [541, 236] as V,
  hand: [486, 262] as V,
  knee: [506, 396] as V,
  ankle: [529, 500] as V,
  toe: [503, 510] as V,
};
const R_L = {
  upper: len(sub(RIDER_REST.elbow, RIDER_REST.shoulder)),
  fore: len(sub(RIDER_REST.hand, RIDER_REST.elbow)),
  thigh: len(sub(RIDER_REST.knee, RIDER_REST.hip)),
  shin: len(sub(RIDER_REST.ankle, RIDER_REST.knee)),
};
const ARM_SIDE = Math.sign(cross(sub(RIDER_REST.hand, RIDER_REST.shoulder), sub(RIDER_REST.elbow, RIDER_REST.shoulder))) || 1;
const LEG_SIDE = Math.sign(cross(sub(RIDER_REST.ankle, RIDER_REST.hip), sub(RIDER_REST.knee, RIDER_REST.hip))) || 1;

function riderPose(g: GaitDef, gait: GaitId, phase: number, trunk: Xf, neck: Xf, pitch: number): RiderPose {
  const halt = gait === "halt";
  const w = (n: number, ph = 0) => (halt ? 0 : Math.sin(2 * Math.PI * (n * phase + ph)));
  // the seat follows the saddle; the pelvis rocks with the horse's back, the trunk stays near vertical
  const tilt = gait === "canter" ? 7 * w(1, 0.1) : gait === "trot" ? 2.5 * w(2) : 4 * w(2, 0.15);
  const hip = trunk(RIDER_REST.hip);
  const pelvisAng = pitch + tilt; // pelvis rotates with the back plus the following motion
  const lumbarAng = pitch * 0.35 + tilt * 0.45;
  const thoraxAng = pitch * 0.1 + tilt * 0.1 + (gait === "trot" ? 1.2 * w(2, 0.08) : 0);
  const lumbar = add(hip, rot(sub(RIDER_REST.lumbar, RIDER_REST.hip), lumbarAng));
  const c7 = add(lumbar, rot(sub(RIDER_REST.c7, RIDER_REST.lumbar), thoraxAng));
  const head = add(c7, rot(sub(RIDER_REST.head, RIDER_REST.c7), thoraxAng * 0.5));
  const shoulder = add(c7, rot(sub(RIDER_REST.shoulder, RIDER_REST.c7), thoraxAng));
  // hands keep an elastic contact: they follow about half of the horse's head and neck motion
  const handRest = trunk(RIDER_REST.hand);
  const handNeck = neck(RIDER_REST.hand);
  const hand = lerpV(handRest, handNeck, 0.55);
  const arm = ik2(shoulder, hand, R_L.upper, R_L.fore, ARM_SIDE);
  // the leg hangs from the hip to a stirrup that swings slightly with the horse
  const ankleT = add(trunk(RIDER_REST.ankle), [halt ? 0 : 2.5 * w(gait === "canter" ? 1 : 2, 0.3), 0]);
  const leg = ik2(hip, ankleT, R_L.thigh, R_L.shin, LEG_SIDE);
  const ankle = add(leg.j, mul(sub(ankleT, leg.j), R_L.shin / (len(sub(ankleT, leg.j)) || 1)));
  const xf: Record<string, Xf> = {
    pelvis: pivotXf(RIDER_REST.hip, hip, pelvisAng),
    lumbar: segXf(RIDER_REST.hip, RIDER_REST.lumbar, hip, lumbar),
    thorax: segXf(RIDER_REST.lumbar, RIDER_REST.c7, lumbar, c7),
    head: segXf(RIDER_REST.c7, RIDER_REST.head, c7, head),
    upper: segXf(RIDER_REST.shoulder, RIDER_REST.elbow, shoulder, arm.j),
    fore: segXf(RIDER_REST.elbow, RIDER_REST.hand, arm.j, hand),
    thigh: segXf(RIDER_REST.hip, RIDER_REST.knee, hip, leg.j),
    shin: segXf(RIDER_REST.knee, RIDER_REST.ankle, leg.j, ankle),
    foot: pivotXf(RIDER_REST.ankle, ankle, pitch * 0.5),
  };
  return { xf, joints: { hip, lumbar, c7, head, shoulder, elbow: arm.j, hand, knee: leg.j, ankle } };
}

/* ------------------------------------------------------------------ whole pose */
export function pose(gait: GaitId, phase: number): Pose {
  const g = GAITS[gait];
  const halt = gait === "halt";
  const ph = wrap(phase);
  // the back rises and falls; in trot the low point is mid-stance of each diagonal
  const bobWave = halt ? 0 : Math.cos(2 * Math.PI * g.bobsPerStride * (ph - g.duty / 2));
  const bob = g.bob * bobWave; // + = lower (y down)
  const pitch = halt ? 0 : g.pitch * Math.cos(2 * Math.PI * (ph - (g.pitchAt ?? 0.37)));
  const trunk = (p: V): V => add(rot(sub(p, REST.trunkPivot), pitch), add(REST.trunkPivot, [0, bob]));
  const nod = halt ? 0 : g.nod * Math.sin(2 * Math.PI * g.nodsPerStride * (ph + 0.05));
  const neckPivotW = trunk(REST.neckPivot);
  // the Marwari carries its neck high: the authored neck is lengthened 12% and raised about its base
  const neck: Xf = (p) => add(neckPivotW, rot(mul(sub(p, REST.neckPivot), NECK_SCALE), pitch + nod + NECK_CARRIAGE));
  const pollW = neck(REST.poll);
  const head = pivotXf(REST.poll, pollW, pitch + nod * 0.4 + NECK_CARRIAGE + HEAD_SET);
  const tail = pivotXf(REST.tailPivot, trunk(REST.tailPivot), pitch + (halt ? 0 : 3 * Math.sin(2 * Math.PI * (ph + 0.2))));
  const scapRot = (protraction: number): Xf => pivotXf(REST.scapPivot, trunk(REST.scapPivot), pitch + protraction);
  const farScap = (protraction: number): Xf => pivotXf(add(REST.scapPivot, FAR_OFFSET), trunk(add(REST.scapPivot, FAR_OFFSET)), pitch + protraction);

  const limbs = {
    LF: limbPose("LF", g, gait, ph, trunk, scapRot),
    LH: limbPose("LH", g, gait, ph, trunk, scapRot),
    RF: limbPose("RF", g, gait, ph, trunk, farScap),
    RH: limbPose("RH", g, gait, ph, trunk, farScap),
  } as Record<LimbId, LimbPose>;

  const xf: Record<string, Xf> = { trunk, neck, head, tail };
  for (const id of Object.keys(limbs) as LimbId[]) for (const [k, f] of Object.entries(limbs[id].xf)) xf[`${id}.${k}`] = f;
  const rider = riderPose(g, gait, ph, trunk, neck, pitch);
  for (const [k, f] of Object.entries(rider.xf)) xf[`R.${k}`] = f;

  const travel = halt ? 0 : (g.stride / g.duty) * ph;
  return { gait, phase: ph, xf, limbs, rider, saddleRise: -bob, travel, pitch };
}

/* ------------------------------------------------------------------ shape builders */
/** a point authored in a frame: [frame, x, y] */
export type FP = [string, number, number];

export const place = (pz: Pose, fp: FP): V => {
  const f = pz.xf[fp[0]];
  return f ? f([fp[1], fp[2]]) : [fp[1], fp[2]];
};

/** a smooth closed (or open) Catmull-Rom path through points */
export function spline(pts: V[], closed = true, tension = 0.5): string {
  const n = pts.length;
  if (n < 2) return "";
  const f = (v: number) => Math.round(v * 10) / 10;
  const P = (i: number) => (closed ? pts[(i + n) % n] : pts[clamp(i, 0, n - 1)]);
  let d = `M${f(pts[0][0])},${f(pts[0][1])}`;
  const last = closed ? n : n - 1;
  for (let i = 0; i < last; i++) {
    const p0 = P(i - 1);
    const p1 = P(i);
    const p2 = P(i + 1);
    const p3 = P(i + 2);
    const t = tension / 3;
    const c1: V = [p1[0] + (p2[0] - p0[0]) * t, p1[1] + (p2[1] - p0[1]) * t];
    const c2: V = [p2[0] - (p3[0] - p1[0]) * t, p2[1] - (p3[1] - p1[1]) * t];
    d += `C${f(c1[0])},${f(c1[1])} ${f(c2[0])},${f(c2[1])} ${f(p2[0])},${f(p2[1])}`;
  }
  return closed ? `${d}Z` : d;
}

export const poly = (pts: V[]) => `M${pts.map((p) => `${Math.round(p[0] * 10) / 10},${Math.round(p[1] * 10) / 10}`).join("L")}Z`;
export const line = (a: V, b: V) => `M${a[0].toFixed(1)},${a[1].toFixed(1)}L${b[0].toFixed(1)},${b[1].toFixed(1)}`;

/**
 * A long bone between two joint centres: a shaft that flares into rounded epiphyses. rA / rB are the end half-widths,
 * w the shaft half-width; bumps add tuberosities (t along the bone, side +1 = left of a→b, height).
 */
export function longBone(a: V, b: V, rA: number, w: number, rB: number, bumps: { t: number; side: number; h: number; s?: number }[] = []): string {
  const L = len(sub(b, a)) || 1;
  const dir = mul(sub(b, a), 1 / L);
  const nrm: V = [-dir[1], dir[0]];
  const N = 22;
  const hw = (t: number, side: number) => {
    let h = w + (rA - w) * Math.exp(-((t / 0.13) ** 2)) + (rB - w) * Math.exp(-(((1 - t) / 0.13) ** 2));
    for (const bp of bumps) if (bp.side === side) h += bp.h * Math.exp(-(((t - bp.t) / (bp.s ?? 0.07)) ** 2));
    return h;
  };
  const left: V[] = [];
  const right: V[] = [];
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const c = add(a, mul(dir, t * L));
    left.push(add(c, mul(nrm, hw(t, 1))));
    right.push(add(c, mul(nrm, -hw(t, -1))));
  }
  const capA = add(a, mul(dir, -rA * 0.75));
  const capB = add(b, mul(dir, rB * 0.75));
  return spline([capA, ...left, capB, ...right.reverse()], true, 0.5);
}

/** a tapered capsule between two points (for soft-tissue masses and the rider's limbs) */
export function capsule(a: V, b: V, ra: number, rb: number): string {
  const L = len(sub(b, a)) || 1;
  const dir = mul(sub(b, a), 1 / L);
  const nrm: V = [-dir[1], dir[0]];
  const pts: V[] = [];
  const k = 6;
  for (let i = 0; i <= k; i++) {
    const t = Math.PI / 2 + (Math.PI * i) / k;
    pts.push(add(a, add(mul(nrm, Math.sin(t) * ra), mul(dir, Math.cos(t) * ra))));
  }
  for (let i = 0; i <= k; i++) {
    const t = -Math.PI / 2 + (Math.PI * i) / k;
    pts.push(add(b, add(mul(nrm, Math.sin(t) * rb), mul(dir, Math.cos(t) * rb))));
  }
  return spline(pts, true, 0.45);
}

export const vec = { add, sub, mul, len, rot, lerpV, ang };
