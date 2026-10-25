/**
 * The grass of a world (layer E, with the ground): short tufts standing on the ground around the horse. They are real geometry,
 * so they take the sun and the horse's shadow like the ground does, and they react to the horse in two ways:
 *
 *  - the wind leans them a little, in slow waves that ride on the ground;
 *  - a hoof on or just above the ground pushes the blades near it aside and presses them down, and they spring back as it lifts.
 *
 * The patch moves with the ground: each tuft has a fixed place along the track and the patch wraps around by the distance the
 * world has travelled, so the grass slides under the hooves at exactly the speed the ground does. Tufts shrink to nothing at the
 * ends of the patch, so nothing pops. Everything (placement, wrap, wind, hoof pressure) is computed in the vertex shader; the CPU
 * only hands over four hoof positions a frame.
 */
import * as THREE from "three";
import { mulberry32 } from "@/components/stallion-film/noise";
import type { WorldUniforms } from "./materials";
import type { GrassSpec } from "./types";

/** Blades in one tuft, and the rows each blade is built from (foot, two stops, tip). */
export const BLADES_PER_TUFT = 5;
const ROWS = [0, 0.4, 0.75] as const;
const VERTS_PER_BLADE = ROWS.length * 2 + 1;

/** How far from a hoof (m) the blades feel it. */
const HOOF_RADIUS = 0.28;

export type HoofPress = { x: number; z: number; press: number };

/** How hard a hoof presses on the grass, 0..1: fully while it is planted, a little while it brushes just above the blades. */
export function hoofPressure(contact: boolean, height: number): number {
  if (contact) return 1;
  const t = Math.min(1, Math.max(0, (height - 0.02) / (0.16 - 0.02)));
  return 0.5 * (1 - t * t * (3 - 2 * t));
}

export function buildTuftGeometry(blades = BLADES_PER_TUFT, seed = 7): THREE.BufferGeometry {
  const rnd = mulberry32(seed);
  const pos: number[] = [];
  const lean: number[] = [];
  const uv: number[] = [];
  const ids: number[] = []; // per vertex: blade index (to colour blades differently)
  const index: number[] = [];
  for (let b = 0; b < blades; b++) {
    const a = rnd() * Math.PI * 2;
    const r = 0.045 * Math.sqrt(rnd());
    const rx = Math.cos(a) * r;
    const rz = Math.sin(a) * r;
    const face = rnd() * Math.PI;
    const fx = Math.cos(face);
    const fz = Math.sin(face);
    const len = 0.72 + rnd() * 0.55;
    const leanDir = rnd() * Math.PI * 2;
    const leanAmt = 0.12 + rnd() * 0.4;
    const half = 0.0042 + rnd() * 0.0018;
    const base = pos.length / 3;
    ROWS.forEach((t) => {
      const w = half * (1 - 0.8 * Math.pow(t, 1.5));
      for (const side of [-1, 1]) {
        pos.push(rx + fx * w * side, t * len, rz + fz * w * side);
        lean.push(Math.cos(leanDir) * leanAmt * t * t, Math.sin(leanDir) * leanAmt * t * t);
        uv.push(side * 0.5 + 0.5, t);
        ids.push(b / blades);
      }
    });
    // the tip: one point, leaning furthest
    pos.push(rx, len, rz);
    lean.push(Math.cos(leanDir) * leanAmt, Math.sin(leanDir) * leanAmt);
    uv.push(0.5, 1);
    ids.push(b / blades);
    // two quads and a triangle
    for (let row = 0; row < ROWS.length - 1; row++) {
      const i = base + row * 2;
      index.push(i, i + 1, i + 2, i + 1, i + 3, i + 2);
    }
    const last = base + (ROWS.length - 1) * 2;
    index.push(last, last + 1, base + VERTS_PER_BLADE - 1);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("aLean", new THREE.Float32BufferAttribute(lean, 2));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  g.setAttribute("aBlade", new THREE.Float32BufferAttribute(ids, 1));
  // every blade is lit as if it faced up, so the grass takes the light the ground does
  const n = pos.length / 3;
  g.setAttribute("normal", new THREE.Float32BufferAttribute(Array.from({ length: n * 3 }, (_, i) => (i % 3 === 1 ? 1 : 0)), 3));
  g.setIndex(index);
  return g;
}

const GRASS_VS_COMMON = /* glsl */ `
#include <common>
attribute vec4 aInst;   // x, y: where the tuft stands in the patch (0..1), z: its height scale, w: its phase in the wind
attribute vec4 aTuft;   // x: yaw, y: tone, z: dry, w: unused
attribute vec2 aLean;   // how far this vertex leans, in blade lengths
attribute float aBlade;
uniform vec2 uArea; uniform vec2 uCenter; uniform float uHeight; uniform float uScrollD; uniform float uTime; uniform vec3 uWind;
uniform float uBend; uniform float uSway; uniform vec4 uHoof[4]; uniform vec3 uDryCol;
`;

const GRASS_BEGIN_VERTEX = /* glsl */ `
float gL = 2.0 * uArea.y;
float gux = aInst.x * 2.0 - 1.0;
float gbx = uCenter.x + sign(gux) * pow(abs(gux), 1.3) * uArea.x;
float gs = gL * (fract(aInst.y - uScrollD / gL) - 0.5);
float gbz = uCenter.y + gs;
float gGrow = smoothstep(0.0, 0.07, 0.5 - abs(gs) / gL) * (1.0 - smoothstep(0.7, 1.0, abs(gux)));
float gH = uHeight * aInst.z * gGrow;
float gt = uv.y;
float gt2 = gt * gt;
float gc = cos(aTuft.x);
float gsn = sin(aTuft.x);
vec2 gloc = vec2(gc * position.x - gsn * position.z, gsn * position.x + gc * position.z);
vec2 glean = vec2(gc * aLean.x - gsn * aLean.y, gsn * aLean.x + gc * aLean.y);

// wind: slow waves that ride on the ground, a quicker flutter on top
vec2 gwd = normalize(uWind.xz + vec2(1e-4, 0.0));
float gstr = clamp(length(uWind.xz) * 0.5, 0.3, 1.0) * uSway;
float gw1 = sin(uTime * 1.5 + gbx * 0.3 + aInst.y * gL * 0.22 + aInst.w);
float gw2 = sin(uTime * 3.3 + aInst.w * 2.7 + gbx * 0.9 + aBlade * 5.0);
vec2 gwind = (gwd * (0.55 + 0.45 * gw1) * 0.24 + vec2(-gwd.y, gwd.x) * 0.05 * gw2) * gstr * gH * gt2;

// hooves: blades near a hoof lean away from it and are pressed down
vec2 gpush = vec2(0.0);
float gpress = 0.0;
for (int i = 0; i < 4; i++) {
  vec2 gd = vec2(gbx, gbz) - uHoof[i].xy;
  float gdl = length(gd);
  float gk = (1.0 - smoothstep(0.0, uHoof[i].z, gdl)) * uHoof[i].w;
  gpush += gd / max(gdl, 0.04) * gk;
  gpress = max(gpress, gk);
}
vec2 gdisp = gpush * uBend * gH * gt2;

vec3 transformed = vec3(
  gbx + gloc.x + glean.x * gH + gwind.x + gdisp.x,
  position.y * gH * (1.0 - 0.55 * gpress * gt),
  gbz + gloc.y + glean.y * gH + gwind.y + gdisp.y
);
vColor.rgb *= 0.8 + 0.4 * aTuft.y;
vColor.rgb = mix(vColor.rgb, uDryCol * (0.55 + 0.6 * gt), aTuft.z * smoothstep(0.0, 0.3, gt + 0.15));
`;

export type GrassField = {
  mesh: THREE.Mesh;
  /** The four hooves, in the horse's frame (the horse stays at the origin). */
  setHooves(hooves: readonly HoofPress[]): void;
  update(distance: number): void;
  dispose(): void;
};

export function createGrass(spec: GrassSpec, u: WorldUniforms, opts: { mobile: boolean }): GrassField {
  const count = Math.max(1, Math.round(opts.mobile ? spec.countMobile : spec.count));
  const geometry = new THREE.InstancedBufferGeometry();
  const tuft = buildTuftGeometry();
  geometry.index = tuft.index;
  for (const name of ["position", "normal", "uv", "aLean", "aBlade"]) geometry.setAttribute(name, tuft.getAttribute(name));
  // a low-discrepancy scatter (the R2 sequence), so the patch is even without clumping, and a hash for the rest
  const rnd = mulberry32(31);
  const inst = new Float32Array(count * 4);
  const per = new Float32Array(count * 4);
  for (let i = 0; i < count; i++) {
    inst[i * 4] = (0.5 + (i + 1) * 0.7548776662466927) % 1;
    inst[i * 4 + 1] = (0.5 + (i + 1) * 0.5698402909980532) % 1;
    inst[i * 4 + 2] = 0.65 + 0.75 * rnd();
    inst[i * 4 + 3] = rnd() * Math.PI * 2;
    per[i * 4] = rnd() * Math.PI * 2;
    per[i * 4 + 1] = rnd();
    per[i * 4 + 2] = rnd() < spec.dry ? 1 : 0;
  }
  geometry.setAttribute("aInst", new THREE.InstancedBufferAttribute(inst, 4));
  geometry.setAttribute("aTuft", new THREE.InstancedBufferAttribute(per, 4));
  geometry.instanceCount = count;

  // blade colours: a dark foot to a bright tip, in the colour space the lights work in
  const foot = new THREE.Color(spec.color);
  const tip = new THREE.Color(spec.tipColor);
  const colours: number[] = [];
  const bladeIds = geometry.getAttribute("aBlade");
  const uvs = geometry.getAttribute("uv");
  const c = new THREE.Color();
  for (let i = 0; i < bladeIds.count; i++) {
    const t = uvs.getY(i);
    const jitter = 0.88 + 0.24 * ((bladeIds.getX(i) * 7.3) % 1);
    c.copy(foot).lerp(tip, Math.pow(t, 0.85)).multiplyScalar(jitter);
    colours.push(c.r, c.g, c.b);
  }
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colours, 3));

  const hoofs = [0, 1, 2, 3].map(() => new THREE.Vector4(0, 0, HOOF_RADIUS, 0));
  const dry = new THREE.Color(spec.dryColor);
  const uniforms = {
    uArea: { value: new THREE.Vector2(spec.area[0], spec.area[1]) }, uCenter: { value: new THREE.Vector2(spec.center[0], spec.center[1]) },
    uHeight: { value: spec.height }, uScrollD: { value: 0 }, uTime: u.uTime, uWind: u.uWind, uBend: { value: spec.bend }, uSway: { value: spec.sway },
    uHoof: { value: hoofs }, uDryCol: { value: new THREE.Vector3(dry.r, dry.g, dry.b) }, uNight: u.uNight, uFade: u.uFade,
  };
  const material = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.92, metalness: 0, side: THREE.DoubleSide });
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader.replace("#include <common>", GRASS_VS_COMMON).replace("#include <begin_vertex>", GRASS_BEGIN_VERTEX);
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", "#include <common>\nuniform vec3 uNight; uniform float uFade;")
      // blades are lit as if they faced up whichever side shows: a blade is not a wall
      .replace("#include <normal_fragment_begin>", THREE.ShaderChunk.normal_fragment_begin.replace("float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;", "float faceDirection = 1.0;"))
      .replace("#include <dithering_fragment>", "#include <dithering_fragment>\n gl_FragColor.rgb = mix(uNight, gl_FragColor.rgb, uFade);");
  };
  material.customProgramCacheKey = () => "horse-worlds-grass-v1";
  const mesh = new THREE.Mesh(geometry, material);
  mesh.frustumCulled = false;
  mesh.receiveShadow = true;
  mesh.name = "grass";
  return {
    mesh,
    setHooves(h) {
      for (let i = 0; i < 4; i++) {
        const v = hoofs[i];
        const s = h[i];
        if (!s) v.set(0, 0, HOOF_RADIUS, 0);
        else v.set(s.x, s.z, HOOF_RADIUS, s.press);
      }
    },
    update(distance) {
      uniforms.uScrollD.value = distance;
    },
    dispose() {
      geometry.dispose();
      tuft.dispose();
      material.dispose();
    },
  };
}
