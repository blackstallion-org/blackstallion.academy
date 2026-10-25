import * as THREE from "three";
import type { Atmosphere } from "./sky";
import type { Surface } from "./locomotion";
import type { Terrain } from "./terrain";

export type EnvId = "desert" | "village" | "campus";

/** Adaptive quality: the runtime moves between tiers when frames run long (or short). Tier 0 is the richest. */
export type Quality = {
  tier: 0 | 1 | 2 | 3;
  dpr: number;
  shadows: boolean;
  shadowSize: number;
  scatter: number; // 0..1 multiplier on vegetation / prop density
  dust: number; // 0..1 multiplier on the pooled dust budget
  terrainSegments: number;
};

export const QUALITY_TIERS: Quality[] = [
  { tier: 0, dpr: 1.5, shadows: true, shadowSize: 2048, scatter: 1, dust: 1, terrainSegments: 192 },
  { tier: 1, dpr: 1.25, shadows: true, shadowSize: 1024, scatter: 0.7, dust: 0.7, terrainSegments: 160 },
  { tier: 2, dpr: 1, shadows: true, shadowSize: 1024, scatter: 0.45, dust: 0.45, terrainSegments: 128 },
  { tier: 3, dpr: 0.85, shadows: false, shadowSize: 512, scatter: 0.25, dust: 0.25, terrainSegments: 96 },
];

export interface Environment {
  id: EnvId;
  group: THREE.Group;
  terrain: Terrain;
  atmosphere: Atmosphere;
  wind: THREE.Vector3;
  /** Where the horse enters this place (world x, z) and which way it faces (radians about +Y). */
  start: { x: number; z: number; heading: number };
  path: PathFollower;
  /** Half-size (m) of the shadow frustum that follows the horse. */
  shadowRadius: number;
  surface(x: number, z: number): Surface;
  /** Optional: nudge a camera position out of solid things (walls, gate piers) so the camera never ends up inside the set. */
  avoidCamera?(p: THREE.Vector3): void;
  update(dt: number, focus: THREE.Vector3, time: number, q: Quality): void;
  dispose(): void;
}

/* ------------------------------------------------------------------ a densely sampled path and a pure-pursuit target on it */
export class PathFollower {
  private pts: THREE.Vector2[] = [];
  private dist: number[] = [];
  private idx = 0;
  readonly spacing = 0.5;
  constructor(points: THREE.Vector2[], private loopStart = -1) {
    // resample the polyline at a fixed spacing
    let carry = 0;
    this.pts.push(points[0].clone());
    for (let i = 1; i < points.length; i++) {
      const a = points[i - 1];
      const b = points[i];
      const len = a.distanceTo(b);
      let d = this.spacing - carry;
      while (d <= len) {
        this.pts.push(a.clone().lerp(b, d / len));
        d += this.spacing;
      }
      carry = len - (d - this.spacing);
    }
    this.dist = this.pts.map((_, i) => i * this.spacing);
    if (this.loopStart >= 0) this.loopStart = Math.floor(this.loopStart / this.spacing);
  }
  reset() {
    this.idx = 0;
  }
  get length() {
    return this.pts.length * this.spacing;
  }
  /** Progress along the path in metres (nearest sample). */
  get progress() {
    return this.idx * this.spacing;
  }
  /** The point `lookahead` metres ahead of the horse's nearest point on the path. */
  target(x: number, z: number, lookahead: number, out = new THREE.Vector2()) {
    const n = this.pts.length;
    let best = this.idx;
    let bd = Infinity;
    for (let k = 0; k < 40; k++) {
      let i = this.idx + k - 6;
      if (i < 0) i += n;
      i %= n;
      const d = (this.pts[i].x - x) ** 2 + (this.pts[i].y - z) ** 2;
      if (d < bd) { bd = d; best = i; }
    }
    this.idx = best;
    let ti = best + Math.round(lookahead / this.spacing);
    if (ti >= n) ti = this.loopStart >= 0 ? this.loopStart + ((ti - n) % (n - this.loopStart)) : n - 1;
    return out.copy(this.pts[ti]);
  }
  pointAt(s: number, out = new THREE.Vector2()) {
    const i = Math.min(this.pts.length - 1, Math.max(0, Math.round(s / this.spacing)));
    return out.copy(this.pts[i]);
  }
}

/* ------------------------------------------------------------------ cell-based scatter: instanced objects around a moving focus */
export type Instance = { x: number; y: number; z: number; rotY: number; sx: number; sy: number; sz: number; color?: THREE.Color; rotX?: number; rotZ?: number };

export class Scatter {
  readonly mesh: THREE.InstancedMesh;
  private cache = new Map<string, Instance[]>();
  private lastKey = "";
  private lastDensity = -1;
  private readonly m = new THREE.Matrix4();
  private readonly e = new THREE.Euler();
  private readonly qq = new THREE.Quaternion();
  constructor(
    geometry: THREE.BufferGeometry,
    material: THREE.Material | THREE.Material[],
    readonly max: number,
    private readonly cellSize: number,
    private readonly radius: number,
    private readonly place: (cx: number, cz: number) => Instance[],
    opts: { castShadow?: boolean; receiveShadow?: boolean; colored?: boolean } = {},
  ) {
    this.mesh = new THREE.InstancedMesh(geometry, material, max);
    this.mesh.frustumCulled = false;
    this.mesh.castShadow = !!opts.castShadow;
    this.mesh.receiveShadow = opts.receiveShadow ?? true;
    this.mesh.count = 0;
    if (opts.colored) {
      this.mesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(max * 3), 3);
    }
  }
  update(fx: number, fz: number, density: number) {
    const ci = Math.floor(fx / this.cellSize);
    const cj = Math.floor(fz / this.cellSize);
    const key = `${ci},${cj}`;
    if (key === this.lastKey && density === this.lastDensity) return;
    this.lastKey = key;
    this.lastDensity = density;
    const r = Math.ceil(this.radius / this.cellSize);
    let n = 0;
    for (let i = ci - r; i <= ci + r && n < this.max; i++) {
      for (let j = cj - r; j <= cj + r && n < this.max; j++) {
        const dx = (i + 0.5) * this.cellSize - fx;
        const dz = (j + 0.5) * this.cellSize - fz;
        if (dx * dx + dz * dz > (this.radius + this.cellSize) ** 2) continue;
        const k = `${i},${j}`;
        let list = this.cache.get(k);
        if (!list) {
          list = this.place(i, j);
          this.cache.set(k, list);
        }
        const take = Math.max(0, Math.ceil(list.length * density));
        for (let t = 0; t < take && n < this.max; t++) {
          const it = list[t];
          this.e.set(it.rotX ?? 0, it.rotY, it.rotZ ?? 0);
          this.qq.setFromEuler(this.e);
          this.m.compose(new THREE.Vector3(it.x, it.y, it.z), this.qq, new THREE.Vector3(it.sx, it.sy, it.sz));
          this.mesh.setMatrixAt(n, this.m);
          if (this.mesh.instanceColor && it.color) this.mesh.setColorAt(n, it.color);
          n++;
        }
      }
    }
    this.mesh.count = n;
    this.mesh.instanceMatrix.needsUpdate = true;
    if (this.mesh.instanceColor) this.mesh.instanceColor.needsUpdate = true;
    if (this.cache.size > 900) this.cache.clear();
  }
  dispose() {
    this.mesh.dispose();
  }
}
