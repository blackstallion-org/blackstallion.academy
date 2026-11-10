import type { Figure, Limb, P, SceneRig } from "./types";

/**
 * Bone roles. Horse: root, neck, head, tail, and per leg an upper and lower bone. Human: torso, head, and upper and
 * lower bones for each arm and leg.
 */
export type Role =
  | "global"
  | "root"
  | "neck"
  | "head"
  | "tail"
  | `${"FL" | "FR" | "HL" | "HR"}${"u" | "l"}`
  | "torso"
  | "hhead"
  | `${"armA" | "armB" | "legA" | "legB"}${"u" | "l"}`;

export type Bone = {
  role: Role;
  figure: number;
  parent: number;
  depth: number;
  /** Pivot in mesh space (x scaled by the image aspect, y in image heights). */
  pivot: P;
  /** Capsule region a→b with radius r, in mesh space. */
  a?: P;
  b?: P;
  r?: number;
  /** For lower legs: the hoof point, used for contact dust. */
  tip?: P;
};

export type Built = {
  bones: Bone[];
  aspect: number;
  /** Interleaved per vertex: x, y (mesh space), u, v. */
  pos: Float32Array;
  idx: Float32Array;
  wts: Float32Array;
  wave: Float32Array;
  index: Uint32Array;
};

const COLS = 96;
const ROWS = 72;

function capsuleDist(p: P, a: P, b: P) {
  const ax = p[0] - a[0];
  const ay = p[1] - a[1];
  const bx = b[0] - a[0];
  const by = b[1] - a[1];
  const t = Math.max(0, Math.min(1, (ax * bx + ay * by) / (bx * bx + by * by || 1)));
  return { d: Math.hypot(ax - bx * t, ay - by * t), t };
}
const smooth = (e0: number, e1: number, x: number) => {
  const t = Math.max(0, Math.min(1, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
};

/** Turns a scene rig into bones (in mesh space) and a skinned grid mesh over the whole cutout. */
export function build(rig: SceneRig, aspect: number): Built {
  const S = (p: P): P => [p[0] * aspect, p[1]];
  const bones: Bone[] = [{ role: "global", figure: -1, parent: -1, depth: 0, pivot: [aspect * 0.5, 0.95] }];
  const roots: number[] = [];
  const add = (b: Omit<Bone, "depth">) => {
    bones.push({ ...b, depth: bones[b.parent].depth + 1 });
    return bones.length - 1;
  };
  const limb = (fig: number, parent: number, name: string, l: Limb, r: number, tipIsContact: boolean) => {
    const u = add({ role: `${name}u` as Role, figure: fig, parent, pivot: S(l.top), a: S(l.top), b: S(l.mid), r });
    // The lower region runs a little past the hoof or hand so no painted edge is left behind when it moves.
    const end: P = [l.end[0] + (l.end[0] - l.mid[0]) * 0.18, l.end[1] + (l.end[1] - l.mid[1]) * 0.18];
    add({ role: `${name}l` as Role, figure: fig, parent: u, pivot: S(l.mid), a: S(l.mid), b: S(end), r: r * 0.95, tip: tipIsContact ? S(l.end) : undefined });
  };

  rig.figures.forEach((f: Figure, fi) => {
    if (f.kind === "horse") {
      const r = f.r ?? 0.032;
      const barrel = f.barrel ?? Math.abs(f.body[1] - f.withers[1]) * 1.25;
      const root = add({ role: "root", figure: fi, parent: 0, pivot: S(f.body), a: S(f.tailRoot), b: S(f.withers), r: barrel });
      roots[fi] = root;
      (["FL", "FR", "HL", "HR"] as const).forEach((k) => limb(fi, root, k, f.legs[k], r, true));
      const neck = add({ role: "neck", figure: fi, parent: root, pivot: S(f.withers), a: S(f.withers), b: S(f.poll), r: r * 2.4 });
      add({ role: "head", figure: fi, parent: neck, pivot: S(f.poll), a: S(f.poll), b: S(f.muzzle), r: r * 1.9 });
      add({ role: "tail", figure: fi, parent: root, pivot: S(f.tailRoot), a: S(f.tailRoot), b: S(f.tailTip), r: r * 1.8 });
    } else {
      const parent = f.on !== undefined ? roots[f.on] ?? 0 : 0;
      const r = f.r ?? 0.032;
      const torso = add({ role: "torso", figure: fi, parent, pivot: S(f.hip), a: S(f.hip), b: S(f.neck), r: f.torsoR ?? 0.06 });
      roots[fi] = torso;
      add({ role: "hhead", figure: fi, parent: torso, pivot: S(f.neck), a: S(f.neck), b: S(f.head), r: f.headR ?? 0.05 });
      if (f.armA) limb(fi, torso, "armA", f.armA, r, false);
      if (f.armB) limb(fi, torso, "armB", f.armB, r, false);
      // Legs hang from the hips but are not children of the torso: the torso leans over them.
      if (f.legA) limb(fi, parent === 0 ? 0 : parent, "legA", f.legA, r * 1.2, f.preset === "walk");
      if (f.legB) limb(fi, parent === 0 ? 0 : parent, "legB", f.legB, r * 1.2, f.preset === "walk");
    }
  });

  // Weights: the deepest bones claim first; what is left passes up to their parents and finally to the still global bone.
  const order = bones.map((_, i) => i).filter((i) => i > 0).sort((x, y) => bones[y].depth - bones[x].depth);
  const cloths = rig.figures.flatMap((f) => (f.kind === "human" && f.cloth ? f.cloth : [])).map(([a, b, r]) => [S(a), S(b), r] as const);

  const nv = (COLS + 1) * (ROWS + 1);
  const pos = new Float32Array(nv * 4);
  const idx = new Float32Array(nv * 4);
  const wts = new Float32Array(nv * 4);
  const wave = new Float32Array(nv);
  for (let j = 0; j <= ROWS; j++)
    for (let i = 0; i <= COLS; i++) {
      const v = j * (COLS + 1) + i;
      const u = i / COLS;
      const t = j / ROWS;
      const p: P = [u * aspect, t];
      pos.set([p[0], p[1], u, t], v * 4);
      const w = new Map<number, number>();
      let remaining = 1;
      // Nearest region first (distance relative to its radius): where two legs cross, each pixel follows the leg it
      // belongs to rather than whichever bone is deeper in the tree.
      const near: [number, number][] = [];
      for (const bi of order) {
        const b = bones[bi];
        if (!b.a || !b.b || !b.r) continue;
        const q = capsuleDist(p, b.a, b.b).d / b.r;
        if (q < 1.6) near.push([bi, q]);
      }
      near.sort((x, y) => x[1] - y[1] || bones[y[0]].depth - bones[x[0]].depth);
      for (const [bi, q] of near) {
        if (remaining <= 0.001) break;
        const s = (1 - smooth(0.7, 1.6, q)) * remaining;
        if (s > 0.001) {
          w.set(bi, (w.get(bi) ?? 0) + s);
          remaining -= s;
        }
      }
      if (remaining > 0.001) w.set(0, (w.get(0) ?? 0) + remaining);
      const top = [...w.entries()].sort((x, y) => y[1] - x[1]).slice(0, 4);
      const sum = top.reduce((acc, [, x]) => acc + x, 0) || 1;
      top.forEach(([bi, x], k) => {
        idx[v * 4 + k] = bi;
        wts[v * 4 + k] = x / sum;
      });
      let wv = 0;
      for (const [a, b, r] of cloths) {
        const { d, t: along } = capsuleDist(p, a, b);
        wv = Math.max(wv, (1 - smooth(r * 0.7, r * 1.3, d)) * along);
      }
      wave[v] = wv;
    }
  const index = new Uint32Array(COLS * ROWS * 6);
  let k = 0;
  for (let j = 0; j < ROWS; j++)
    for (let i = 0; i < COLS; i++) {
      const a = j * (COLS + 1) + i;
      const b = a + 1;
      const c = a + COLS + 1;
      const d = c + 1;
      index.set([a, c, b, b, c, d], k);
      k += 6;
    }
  return { bones, aspect, pos, idx, wts, wave, index };
}
