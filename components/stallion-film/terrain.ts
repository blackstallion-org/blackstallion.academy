import * as THREE from "three";
import { GLSL_NOISE, clamp, smoothstep, vnoise } from "./noise";

export type TerrainKind = "desert" | "village" | "campus";
const KIND_INDEX: Record<TerrainKind, number> = { desert: 0, village: 1, campus: 2 };

/** The campus arena rectangle (centre x, centre z, half width, half length), shared by the ground shader and the buildings. */
export const ARENA = { cx: 0, cz: 62, hx: 24, hz: 40 };

/** The village square: a paved circle on the lane, repeating every `period` metres so the street never ends. */
export const PLAZA = { z: 62, r: 12, period: 160 };
/** 0..1 how paved the village ground is at (x, z): the lane down the middle plus the squares. Mirrors the ground shader. */
export function villagePaving(x: number, z: number): number {
  const lane = 1 - smoothstep(2.0, 2.9, Math.abs(x));
  const pz = ((((z - PLAZA.z + PLAZA.period / 2) % PLAZA.period) + PLAZA.period) % PLAZA.period) - PLAZA.period / 2;
  const plaza = 1 - smoothstep(PLAZA.r - 1.6, PLAZA.r, Math.hypot(x, pz));
  return Math.max(lane, plaza);
}

const ridge = (n: number) => 1 - Math.abs(2 * n - 1);

/* ------------------------------------------------------------------ height functions (JS; the GLSL below mirrors them) */
function desertHeight(x: number, z: number): number {
  const wx = x + 44 * (vnoise(x * 0.011, z * 0.011, 1) - 0.5);
  const wz = z + 44 * (vnoise(x * 0.011 + 9.2, z * 0.011 + 3.1, 2) - 0.5);
  const big = (vnoise(wx * 0.0065, wz * 0.0065, 3) - 0.5) * 2;
  const d1 = ridge(vnoise(wx * 0.012 + wz * 0.004, wz * 0.02, 4));
  const d2 = ridge(vnoise(wx * 0.03, wz * 0.045, 5));
  return 8.0 * big + 3.2 * (d1 - 0.5) + 0.9 * (d2 - 0.5) + 0.06 * (vnoise(x * 0.6, z * 0.6, 6) - 0.5);
}
function villageHeight(x: number, z: number): number {
  const crown = Math.max(0, 1 - (x / 2.8) * (x / 2.8));
  return 0.05 * (vnoise(x * 0.2, z * 0.2, 7) - 0.5) + 0.05 * crown + 0.4 * (vnoise(x * 0.02, z * 0.02, 8) - 0.5) * smoothstep(3, 9, Math.abs(x));
}
function arenaOutside(x: number, z: number): number {
  const dx = Math.abs(x - ARENA.cx) - ARENA.hx;
  const dz = Math.abs(z - ARENA.cz) - ARENA.hz;
  return smoothstep(0, 4, Math.max(dx, dz));
}
function campusHeight(x: number, z: number): number {
  const out = arenaOutside(x, z);
  return out * (0.5 * (vnoise(x * 0.03, z * 0.03, 9) - 0.5) + 0.04 * (vnoise(x * 0.3, z * 0.3, 10) - 0.5)) + 0.008 * (vnoise(x * 0.5, z * 0.5, 11) - 0.5);
}

export function terrainHeight(kind: TerrainKind, x: number, z: number): number {
  return kind === "desert" ? desertHeight(x, z) : kind === "village" ? villageHeight(x, z) : campusHeight(x, z);
}

export function terrainNormal(kind: TerrainKind, x: number, z: number, out = new THREE.Vector3()): THREE.Vector3 {
  const e = 0.5;
  const hx = terrainHeight(kind, x + e, z) - terrainHeight(kind, x - e, z);
  const hz = terrainHeight(kind, x, z + e) - terrainHeight(kind, x, z - e);
  return out.set(-hx / (2 * e), 1, -hz / (2 * e)).normalize();
}

/* ------------------------------------------------------------------ the GPU ground */
const HEIGHT_GLSL = /* glsl */ `
${GLSL_NOISE}
uniform int uKind;
uniform vec2 uCenter;
uniform vec4 uArena;
float ridge(float n) { return 1.0 - abs(2.0 * n - 1.0); }
float heightDesert(vec2 p) {
  float wx = p.x + 44.0 * (vnoise(p * 0.011, 1) - 0.5);
  float wz = p.y + 44.0 * (vnoise(p * 0.011 + vec2(9.2, 3.1), 2) - 0.5);
  float big = (vnoise(vec2(wx, wz) * 0.0065, 3) - 0.5) * 2.0;
  float d1 = ridge(vnoise(vec2(wx * 0.012 + wz * 0.004, wz * 0.02), 4));
  float d2 = ridge(vnoise(vec2(wx * 0.03, wz * 0.045), 5));
  return 8.0 * big + 3.2 * (d1 - 0.5) + 0.9 * (d2 - 0.5) + 0.06 * (vnoise(p * 0.6, 6) - 0.5);
}
float heightVillage(vec2 p) {
  float crown = max(0.0, 1.0 - (p.x / 2.8) * (p.x / 2.8));
  return 0.05 * (vnoise(p * 0.2, 7) - 0.5) + 0.05 * crown + 0.4 * (vnoise(p * 0.02, 8) - 0.5) * smoothstep(3.0, 9.0, abs(p.x));
}
float arenaOutside(vec2 p) {
  float dx = abs(p.x - uArena.x) - uArena.z;
  float dz = abs(p.y - uArena.y) - uArena.w;
  return smoothstep(0.0, 4.0, max(dx, dz));
}
float heightCampus(vec2 p) {
  float o = arenaOutside(p);
  return o * (0.5 * (vnoise(p * 0.03, 9) - 0.5) + 0.04 * (vnoise(p * 0.3, 10) - 0.5)) + 0.008 * (vnoise(p * 0.5, 11) - 0.5);
}
float terrainH(vec2 p) {
  if (uKind == 0) return heightDesert(p);
  if (uKind == 1) return heightVillage(p);
  return heightCampus(p);
}
`;

export type GroundStyle = {
  sandLight: THREE.ColorRepresentation;
  sandDark: THREE.ColorRepresentation;
  accent: THREE.ColorRepresentation;
  windDir: THREE.Vector2;
};

export class Terrain {
  readonly mesh: THREE.Mesh;
  readonly uniforms: Record<string, THREE.IUniform>;
  private readonly cell: number;
  private readonly half: number;

  private readonly yOffset: number;

  constructor(readonly kind: TerrainKind, style: GroundStyle, opts: { size?: number; segments?: number; yOffset?: number } = {}) {
    this.yOffset = opts.yOffset ?? 0;
    const size = opts.size ?? 240;
    const segments = opts.segments ?? 192;
    this.cell = size / segments;
    this.half = size / 2;
    const geo = new THREE.PlaneGeometry(size, size, segments, segments);
    geo.rotateX(-Math.PI / 2);
    this.uniforms = {
      uKind: { value: KIND_INDEX[kind] },
      uCenter: { value: new THREE.Vector2() },
      uArena: { value: new THREE.Vector4(ARENA.cx, ARENA.cz, ARENA.hx, ARENA.hz) },
      uPlaza: { value: new THREE.Vector3(PLAZA.z, PLAZA.r, PLAZA.period) },
      uSandLight: { value: new THREE.Color(style.sandLight) },
      uSandDark: { value: new THREE.Color(style.sandDark) },
      uAccent: { value: new THREE.Color(style.accent) },
      uWind: { value: style.windDir.clone().normalize() },
      uTime: { value: 0 },
    };
    const material = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.95, metalness: 0 });
    material.onBeforeCompile = (shader) => {
      Object.assign(shader.uniforms, this.uniforms);
      shader.vertexShader = shader.vertexShader
        .replace("#include <common>", `#include <common>\n${HEIGHT_GLSL}\nvarying vec2 vTP; varying float vTH;`)
        .replace(
          "#include <beginnormal_vertex>",
          `vec2 wp = position.xz + uCenter;
          float e = 0.5;
          float hxd = terrainH(wp + vec2(e, 0.0)) - terrainH(wp - vec2(e, 0.0));
          float hzd = terrainH(wp + vec2(0.0, e)) - terrainH(wp - vec2(0.0, e));
          vec3 objectNormal = normalize(vec3(-hxd / (2.0 * e), 1.0, -hzd / (2.0 * e)));
          #ifdef USE_TANGENT
          vec3 objectTangent = vec3(tangent.xyz);
          #endif`,
        )
        .replace(
          "#include <begin_vertex>",
          `float th = terrainH(wp);
          vec3 transformed = vec3(position.x, th, position.z);
          vTP = wp; vTH = th;`,
        );
      shader.fragmentShader = shader.fragmentShader
        .replace(
          "#include <common>",
          `#include <common>
          ${HEIGHT_GLSL.split("uniform int uKind;")[0]}
          uniform int uKind; uniform vec4 uArena; uniform vec3 uPlaza; uniform vec3 uSandLight; uniform vec3 uSandDark; uniform vec3 uAccent; uniform vec2 uWind;
          varying vec2 vTP; varying float vTH;
          float fbm2(vec2 p, int s) { return 0.5 * vnoise(p, s) + 0.28 * vnoise(p * 2.03, s + 1) + 0.14 * vnoise(p * 4.1, s + 2) + 0.08 * vnoise(p * 8.3, s + 3); }
          vec3 groundColor(vec2 p, out float rough, out vec2 bump) {
            rough = 0.95; bump = vec2(0.0);
            if (uKind == 0) {
              // wind ripples across the dune face + fine sand variation
              vec2 w = normalize(uWind); vec2 pw = vec2(-w.y, w.x);
              float warp = vnoise(p * 0.35, 21) * 3.0;
              float rip = sin(dot(p, w) * 5.2 + warp * 2.0 + vnoise(p * 0.12, 22) * 6.0);
              float ripFade = 0.5 + 0.5 * vnoise(p * 0.05, 23);
              bump = pw * rip * 0.05 * ripFade + w * rip * 0.015;
              float n = fbm2(p * 0.045, 24);
              float patchN = vnoise(p * 0.012, 25);
              vec3 c = mix(uSandLight, uSandDark, clamp(n * 1.1 + (patchN - 0.5) * 0.5, 0.0, 1.0));
              c = mix(c, uAccent, smoothstep(0.62, 0.9, vnoise(p * 0.03, 26)) * 0.5);   // darker mineral-stained hardpan
              c *= 0.94 + 0.12 * vnoise(p * 6.0, 27);
              return c;
            }
            if (uKind == 1) {
              float lane0 = 1.0 - smoothstep(2.0, 2.9, abs(p.x));
              float pz = mod(p.y - uPlaza.x + uPlaza.z * 0.5, uPlaza.z) - uPlaza.z * 0.5;
              float plaza = 1.0 - smoothstep(uPlaza.y - 1.6, uPlaza.y, length(vec2(p.x, pz)));
              float lane = max(lane0, plaza);
              vec2 q = p * vec2(1.6, 2.1); q.x += 0.5 * mod(floor(q.y), 2.0);
              vec2 cell = floor(q); vec2 f = fract(q);
              float joint = smoothstep(0.0, 0.07, min(min(f.x, 1.0 - f.x), min(f.y, 1.0 - f.y)));
              float stone = 0.85 + 0.3 * float(hashU(ivec2(cell), 31) & 255u) / 255.0;
              vec3 paved = mix(uSandDark * 0.62, uSandLight * 0.95, stone - 0.55) * (0.55 + 0.45 * joint);
              vec3 earth = mix(uSandLight, uSandDark, fbm2(p * 0.2, 32));
              earth *= 0.9 + 0.2 * vnoise(p * 3.0, 33);
              bump = vec2(vnoise(p * 4.0, 34) - 0.5, vnoise(p * 4.0 + 7.0, 35) - 0.5) * 0.05 * (1.0 - lane) + (vec2(f.x - 0.5, f.y - 0.5) * 0.04) * lane;
              rough = mix(0.97, 0.82, lane * joint);
              return mix(earth, paved, lane);
            }
            float dx = abs(p.x - uArena.x) - uArena.z;
            float dz = abs(p.y - uArena.y) - uArena.w;
            float out_ = smoothstep(0.0, 1.2, max(dx, dz));
            float rake = sin(p.x * 14.0 + vnoise(p * 0.4, 41) * 4.0) * 0.5 + 0.5;
            // arena sand is not one tone: broad drifts of drier and damper sand, scuffed tracks where hooves have turned it over, a fine
            // grain and the odd glinting grain; the fine terms fade out with distance so they cannot shimmer
            float grainFade = 1.0 - smoothstep(0.015, 0.07, length(fwidth(p)));
            vec3 sand = mix(uSandLight, uSandDark, 0.3 + 0.35 * fbm2(p * 0.3, 42) + 0.3 * (vnoise(p * 0.55, 52) - 0.5)) * (0.965 + 0.05 * rake * (0.5 + vnoise(p * 0.2, 51)));
            sand *= 1.0 - 0.13 * smoothstep(0.5, 0.82, vnoise(p * 1.8 + 11.0, 53));
            sand *= 1.0 + (vnoise(p * 38.0, 54) - 0.5) * 0.24 * grainFade;
            sand += vec3(0.011, 0.009, 0.006) * (vnoise(p * 70.0, 55) - 0.5) * 2.0 * grainFade;
            vec3 grass = mix(uAccent * 0.8, uAccent * 1.25, fbm2(p * 0.7, 43)) * (0.9 + 0.2 * vnoise(p * 9.0, 44));
            // a paddock is not one green: patches of sun-bleached grass and darker ones where it stands long
            grass = mix(grass, grass * vec3(1.4, 1.14, 0.62), smoothstep(0.45, 0.8, vnoise(p * 0.018, 60)) * 0.6);
            grass *= 1.0 - 0.16 * smoothstep(0.55, 0.85, vnoise(p * 0.045 + 17.0, 61));
            bump = vec2(vnoise(p * 7.0, 45) - 0.5, vnoise(p * 7.0 + 5.0, 46) - 0.5) * 0.04 * out_ + vec2(0.0, (rake - 0.5) * 0.018) * (1.0 - out_);
            bump += vec2(vnoise(p * 26.0, 56) - 0.5, vnoise(p * 26.0 + 9.0, 57) - 0.5) * 0.035 * (1.0 - out_) * grainFade;
            rough = mix(0.98, 0.93, out_);
            float drive = (1.0 - smoothstep(2.6, 3.5, abs(p.x))) * (1.0 - smoothstep(uArena.y - uArena.w - 1.5, uArena.y - uArena.w + 0.2, p.y));
            vec3 gravel = mix(vec3(0.27, 0.215, 0.15), vec3(0.43, 0.345, 0.24), fbm2(p * 1.6, 47)) * (0.92 + 0.16 * vnoise(p * 9.0, 48));
            bump += vec2(vnoise(p * 11.0, 49) - 0.5, vnoise(p * 11.0 + 3.0, 50) - 0.5) * 0.05 * drive;
            return mix(mix(sand, grass, out_), gravel, drive);
          }`,
        )
        .replace(
          "#include <color_fragment>",
          `#include <color_fragment>
          float gRough; vec2 gBump;
          diffuseColor.rgb = groundColor(vTP, gRough, gBump);`,
        )
        .replace("#include <roughnessmap_fragment>", `#include <roughnessmap_fragment>\nroughnessFactor = gRough;`)
        .replace(
          "#include <normal_fragment_maps>",
          `#include <normal_fragment_maps>
          normal = normalize(normal + (viewMatrix * vec4(gBump.x, 0.0, gBump.y, 0.0)).xyz);`,
        );
    };
    this.mesh = new THREE.Mesh(geo, material);
    this.mesh.frustumCulled = false;
    this.mesh.receiveShadow = true;
    this.mesh.name = `terrain-${kind}`;
  }

  /** Re-centre the mesh on the focus point, snapped to the grid so vertices never swim. */
  update(x: number, z: number, time: number) {
    const cx = Math.round(x / this.cell) * this.cell;
    const cz = Math.round(z / this.cell) * this.cell;
    this.mesh.position.set(cx, this.yOffset, cz);
    (this.uniforms.uCenter.value as THREE.Vector2).set(cx, cz);
    this.uniforms.uTime.value = time;
  }

  height(x: number, z: number) {
    return terrainHeight(this.kind, x, z);
  }

  /**
   * How far the drawn ground can stand above the true height at (x, z). The mesh is straight between its vertices (one cell is 1.25 m), so
   * in a hollow it sits above the curve by about the second difference over a cell, divided by eight. A decal laid at the true height there
   * is half buried: the clearance lifts it clear of the facet (a few millimetres on flat sand, a couple of centimetres in a dune hollow).
   */
  facetClearance(x: number, z: number) {
    const c = this.cell, h = terrainHeight(this.kind, x, z);
    const dx = Math.abs(terrainHeight(this.kind, x + c, z) - 2 * h + terrainHeight(this.kind, x - c, z));
    const dz = Math.abs(terrainHeight(this.kind, x, z + c) - 2 * h + terrainHeight(this.kind, x, z - c));
    return (Math.max(dx, dz) / 8) * 1.25 + 0.004;
  }

  normal(x: number, z: number, out?: THREE.Vector3) {
    return terrainNormal(this.kind, x, z, out);
  }

  get extent() {
    return this.half;
  }

  dispose() {
    this.mesh.geometry.dispose();
    (this.mesh.material as THREE.Material).dispose();
  }
}

export { clamp };
