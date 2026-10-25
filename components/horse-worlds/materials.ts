/**
 * The layers of a world, as three.js objects. Each is camera-independent: it is placed in the world and moves with the ground
 * (distance travelled), so parallax comes out of the perspective camera by itself instead of being faked per layer.
 *
 *   A  sky       a dome that follows the camera: gradient, haze, sun glow, soft clouds
 *   B  distant   a ring of very far dunes / hills / roofs around the camera; it turns by distance / radius (the slowest layer)
 *   C  middle    instanced upright cut-outs (trees, fences, walls) behind the horse
 *   D  foreground small cut-outs (tufts, stones) between the camera and the horse, kept low so the hooves stay clear
 *   E  ground    a large lit plane whose texture slides under the hooves by exactly the distance travelled
 *
 * The backdrop layers (A to D) are drawn as display colours with no tone mapping; the ground is lit with the horse's lights.
 */
import * as THREE from "three";
import { GLSL_NOISE } from "@/components/stallion-film/noise";
import { mediaCrossOrigin } from "@/lib/content/asset";
import { groundAxis } from "./math";
import type { AtlasData, DistantSpec, GroundSpec, SkySpec, SpriteFieldSpec } from "./types";

/** The sRGB numbers of a CSS colour: what the backdrop shaders mix and write, with no colour management in between. */
export function srgbVec3(hex: string, out = new THREE.Vector3()) {
  const c = new THREE.Color(hex);
  const rgb = { r: 0, g: 0, b: 0 };
  c.getRGB(rgb, THREE.SRGBColorSpace);
  return out.set(rgb.r, rgb.g, rgb.b);
}

/** A colour whose raw numbers are the hex's sRGB numbers, for shaders that write straight to the screen (dust, prints). */
export function rawColor(hex: string) {
  const v = srgbVec3(hex);
  return new THREE.Color().setRGB(v.x, v.y, v.z, THREE.LinearSRGBColorSpace);
}

export type WorldUniforms = {
  uFade: { value: number }; // 1 = the world is fully shown, 0 = it has faded to the night colour
  uTime: { value: number };
  uScroll: { value: number }; // metres travelled, wrapped at 65536 (for the soft noise on the ground)
  uNight: { value: THREE.Vector3 };
  uFogColor: { value: THREE.Vector3 };
  uFogDensity: { value: number };
  uSunDir: { value: THREE.Vector3 };
  uWind: { value: THREE.Vector3 };
};

export function makeWorldUniforms(): WorldUniforms {
  return {
    uFade: { value: 0 },
    uTime: { value: 0 },
    uScroll: { value: 0 },
    uNight: { value: srgbVec3("#171513") },
    uFogColor: { value: new THREE.Vector3(0.9, 0.75, 0.55) },
    uFogDensity: { value: 0.006 },
    uSunDir: { value: new THREE.Vector3(0.5, 0.3, -0.8).normalize() },
    uWind: { value: new THREE.Vector3(1, 0, 0) },
  };
}

/* ---------------------------------------------------------------------------------------------- textures */
export type TextureOpts = { srgb?: boolean; repeat?: boolean | "x"; anisotropy?: number; mipmaps?: boolean };

export function loadTexture(url: string, opts: TextureOpts = {}): Promise<THREE.Texture> {
  const loader = new THREE.TextureLoader();
  const cors = mediaCrossOrigin(url);
  if (cors) loader.setCrossOrigin(cors);
  return new Promise((resolve, reject) => {
    loader.load(
      url,
      (t) => {
        // Cut-outs are read as raw numbers (no sRGB decoding): the shaders mix display colours directly.
        t.colorSpace = opts.srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
        t.wrapS = opts.repeat ? THREE.RepeatWrapping : THREE.ClampToEdgeWrapping;
        t.wrapT = opts.repeat === true ? THREE.RepeatWrapping : THREE.ClampToEdgeWrapping;
        t.anisotropy = opts.anisotropy ?? 1;
        t.generateMipmaps = opts.mipmaps ?? true;
        t.minFilter = t.generateMipmaps ? THREE.LinearMipmapLinearFilter : THREE.LinearFilter;
        t.magFilter = THREE.LinearFilter;
        t.needsUpdate = true;
        resolve(t);
      },
      undefined,
      () => reject(new Error(`Could not load ${url}`)),
    );
  });
}

/* ---------------------------------------------------------------------------------------------- A: sky */
const SKY_VS = /* glsl */ `
varying vec3 vDir;
void main() {
  vDir = normalize(position);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  gl_Position.z = gl_Position.w * 0.99999;
}`;

const SKY_FS = /* glsl */ `
${GLSL_NOISE}
uniform vec3 uZenith; uniform vec3 uMid; uniform vec3 uHorizon; uniform vec3 uHaze; uniform vec3 uSunCol; uniform vec3 uSunDir;
uniform float uSunGlow; uniform float uClouds; uniform float uCloudScale; uniform float uHazeAmt; uniform float uHazeFall;
uniform vec3 uCloudCol; uniform vec3 uCloudShade; uniform float uDrift; uniform float uTime; uniform vec3 uNight; uniform float uFade;
varying vec3 vDir;
float cloudField(vec2 p) {
  return vnoise(p, 51) * 0.56 + vnoise(p * 2.07 + 3.1, 52) * 0.29 + vnoise(p * 4.3 + 7.7, 53) * 0.15;
}
void main() {
  vec3 d = normalize(vDir);
  float up = d.y;
  float t = max(up, 0.0);
  vec3 col = mix(uHorizon, uMid, smoothstep(0.0, 0.2, t));
  col = mix(col, uZenith, smoothstep(0.1, 0.85, t));
  col = mix(col, uHaze, uHazeAmt * exp(-t * uHazeFall));
  col = mix(col, uHaze, smoothstep(0.0, -0.05, up));
  vec3 sd = normalize(uSunDir);
  float s = max(dot(d, sd), 0.0);
  col += uSunCol * (pow(s, 700.0) * 1.1 + pow(s, 28.0) * 0.30 * uSunGlow + pow(s, 5.0) * 0.16 * uSunGlow);
  if (uClouds > 0.001 && up > 0.01) {
    vec2 p = d.xz / (up + 0.2) * uCloudScale + vec2(uTime * uDrift, 0.0);
    float n = cloudField(p);
    float cover = mix(0.66, 0.40, uClouds);
    float c = smoothstep(cover, cover + 0.17, n);
    float lit = clamp(0.5 + (cloudField(p + normalize(sd.xz + 1e-4) * 0.06) - n) * 6.0, 0.0, 1.0);
    vec3 cc = mix(uCloudShade, uCloudCol, lit);
    c *= smoothstep(0.01, 0.22, up);
    col = mix(col, cc, c * 0.85);
  }
  col = mix(uNight, col, uFade);
  gl_FragColor = vec4(col, 1.0);
}`;

export function createSky(u: WorldUniforms) {
  const uniforms = {
    uZenith: { value: new THREE.Vector3() }, uMid: { value: new THREE.Vector3() }, uHorizon: { value: new THREE.Vector3() }, uHaze: { value: new THREE.Vector3() },
    uSunCol: { value: new THREE.Vector3() }, uSunDir: u.uSunDir, uSunGlow: { value: 1 }, uClouds: { value: 0 }, uCloudScale: { value: 1.6 },
    uHazeAmt: { value: 0.8 }, uHazeFall: { value: 7 }, uCloudCol: { value: new THREE.Vector3() }, uCloudShade: { value: new THREE.Vector3() },
    uDrift: { value: 0.004 }, uTime: u.uTime, uNight: u.uNight, uFade: u.uFade,
  };
  const material = new THREE.ShaderMaterial({ vertexShader: SKY_VS, fragmentShader: SKY_FS, uniforms, side: THREE.BackSide, depthWrite: false, depthTest: false, fog: false, toneMapped: false });
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(900, 32, 20), material);
  mesh.frustumCulled = false;
  mesh.renderOrder = -20;
  mesh.name = "sky";
  const set = (s: SkySpec) => {
    srgbVec3(s.zenith, uniforms.uZenith.value);
    srgbVec3(s.mid, uniforms.uMid.value);
    srgbVec3(s.horizon, uniforms.uHorizon.value);
    srgbVec3(s.haze, uniforms.uHaze.value);
    srgbVec3(s.sunColor, uniforms.uSunCol.value);
    srgbVec3(s.cloudColor, uniforms.uCloudCol.value);
    srgbVec3(s.cloudShade, uniforms.uCloudShade.value);
    uniforms.uSunGlow.value = s.sunGlow;
    uniforms.uClouds.value = s.clouds;
    uniforms.uCloudScale.value = s.cloudScale;
    uniforms.uDrift.value = s.drift;
    uniforms.uHazeAmt.value = s.hazeAmount;
    uniforms.uHazeFall.value = s.hazeFalloff;
  };
  return { mesh, material, set };
}

/** A copy of the sky for reflections: the same gradient and sun, always fully shown, drawn into a cube for the horse's environment light. */
export function createSkyEnvironment(spec: SkySpec, sunDir: THREE.Vector3): THREE.Mesh {
  const u = makeWorldUniforms();
  u.uFade.value = 1;
  u.uSunDir.value.copy(sunDir).normalize();
  const sky = createSky(u);
  sky.set(spec);
  sky.material.depthTest = true;
  sky.mesh.geometry.dispose();
  sky.mesh.geometry = new THREE.SphereGeometry(50, 24, 16);
  sky.mesh.renderOrder = 0;
  return sky.mesh;
}

/* ---------------------------------------------------------------------------------------------- B: distant ring */
const RING_VS = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;
const RING_FS = /* glsl */ `
uniform sampler2D uMap; uniform float uRepeat; uniform float uOffset; uniform vec3 uTint; uniform vec3 uNight; uniform float uFade;
uniform vec3 uHaze; uniform float uHazeLow; uniform float uHazeAmt;
varying vec2 vUv;
void main() {
  vec4 t = texture2D(uMap, vec2(vUv.x * uRepeat + uOffset, vUv.y));
  if (t.a < 0.004) discard;
  // the foot of the band melts into the haze that fills the ground at that distance, so there is no seam where they meet
  float foot = (1.0 - smoothstep(0.0, uHazeLow, vUv.y)) * uHazeAmt;
  vec3 col = mix(t.rgb * uTint, uHaze, foot);
  col = mix(uNight, col, uFade);
  gl_FragColor = vec4(col, t.a);
}`;

export function createRing(spec: DistantSpec, map: THREE.Texture, u: WorldUniforms) {
  const uniforms = {
    uMap: { value: map }, uRepeat: { value: spec.repeats }, uOffset: { value: 0 }, uTint: { value: new THREE.Vector3(1, 1, 1) }, uNight: u.uNight, uFade: u.uFade,
    uHaze: u.uFogColor, uHazeLow: { value: spec.hazeLow ?? 0.12 }, uHazeAmt: { value: spec.hazeFoot ?? 0.9 },
  };
  const material = new THREE.ShaderMaterial({ vertexShader: RING_VS, fragmentShader: RING_FS, uniforms, side: THREE.BackSide, transparent: true, depthWrite: false, fog: false, toneMapped: false });
  const geometry = new THREE.CylinderGeometry(spec.radius, spec.radius, spec.height, 160, 1, true);
  geometry.translate(0, spec.height / 2 - spec.base, 0);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.frustumCulled = false;
  mesh.renderOrder = -10;
  mesh.name = "distant";
  return { mesh, uniforms, material };
}

/* ---------------------------------------------------------------------------------------------- C, D: instanced cut-outs */
export const MAX_VARIANTS = 12;

const SPRITE_VS = /* glsl */ `
${GLSL_NOISE}
#define MAXV ${MAX_VARIANTS}
attribute vec2 aInst; // x: where the cut-out stands along the track (m), y: its index
uniform float uSpan; uniform float uCell; uniform float uFadeLen; uniform float uScrollFrac; uniform float uLapBase;
uniform vec2 uX; uniform vec2 uScale; uniform float uSway; uniform float uTime; uniform float uFacing; uniform float uLayout; uniform vec3 uWind;
uniform vec4 uRect[MAXV]; uniform vec2 uSize[MAXV]; uniform float uCum[MAXV]; uniform int uNumV; uniform vec3 uSunDir;
varying vec2 vUv; varying float vFade; varying float vDist; varying float vTone; varying float vX;
void main() {
  int id = int(aInst.y + 0.5);
  float t = aInst.x - uScrollFrac;
  float lapRel = floor((t + 0.5 * uSpan) / uSpan);
  int lap = int(lapRel) - int(uLapBase + 0.5);
  float z = t - lapRel * uSpan;
  ivec2 key = ivec2(id, lap);
  float r1 = hash2(key, 11); float r2 = hash2(key, 12); float r3 = hash2(key, 13); float r4 = hash2(key, 14); float r5 = hash2(key, 15);
  int vi = 0;
  for (int i = 0; i < MAXV; i++) { if (i < uNumV - 1 && r1 >= uCum[i]) vi = i + 1; }
  vec4 rect = uRect[vi];
  vec2 size = uSize[vi] * mix(uScale.x, uScale.y, r2);
  float x = uLayout < 0.5 ? mix(uX.x, uX.y, pow(r3, 1.35)) : uX.x;
  if (uLayout < 0.5) z += (r4 - 0.5) * uCell;
  vec3 base = vec3(x, 0.0, z);
  vec3 right = vec3(0.0, 0.0, 1.0);
  if (uFacing < 0.5) {
    vec3 tc = cameraPosition - base; tc.y = 0.0;
    tc = normalize(tc + vec3(1e-4, 0.0, 0.0));
    right = vec3(tc.z, 0.0, -tc.x);
  }
  vec2 q = vec2(position.x * size.x, position.y * size.y);
  float bend = position.y * position.y;
  q.x += bend * uSway * size.y * (sin(uTime * 1.3 + base.z * 0.31 + r5 * 6.283) + 0.35 * sin(uTime * 2.9 + base.z * 0.9 + r5 * 17.0)) * (0.5 + 0.5 * clamp(length(uWind.xz) / 2.0, 0.0, 1.5));
#ifdef SHADOW
  float k = max(uSunDir.y, 0.3);
  vec2 shear = uSunDir.xz / k;
  vec3 wp = base + right * q.x;
  wp.xz -= shear * q.y;
  wp.y = 0.02;
#else
  vec3 wp = base + right * q.x + vec3(0.0, q.y, 0.0);
#endif
  vUv = vec2(mix(rect.x, rect.z, position.x + 0.5), mix(rect.y, rect.w, position.y));
  vFade = smoothstep(0.0, uFadeLen, 0.5 * uSpan - abs(z));
  vDist = length(wp - cameraPosition);
  vTone = 0.9 + 0.2 * r5;
  vX = wp.x;
  gl_Position = projectionMatrix * viewMatrix * vec4(wp, 1.0);
}`;

const SPRITE_FS = /* glsl */ `
uniform sampler2D uMap; uniform vec3 uTint; uniform vec3 uNight; uniform float uFade; uniform vec3 uFogColor; uniform float uFogDensity;
uniform vec3 uShadowCol; uniform float uShadowK;
varying vec2 vUv; varying float vFade; varying float vDist; varying float vTone; varying float vX;
void main() {
#ifdef SHADOW
  float a = texture2D(uMap, vUv, 2.5).a * vFade * uShadowK * smoothstep(2.4, 5.6, abs(vX)) * uFade;
  float f = 1.0 - exp(-uFogDensity * uFogDensity * vDist * vDist);
  a *= 1.0 - f;
  if (a < 0.01) discard;
  gl_FragColor = vec4(uShadowCol, a);
#else
  vec4 t = texture2D(uMap, vUv);
  float a = t.a * vFade;
  if (a < 0.3) discard;
  vec3 col = t.rgb * uTint * vTone;
  float f = 1.0 - exp(-uFogDensity * uFogDensity * vDist * vDist);
  col = mix(col, uFogColor, f);
  col = mix(uNight, col, uFade);
  gl_FragColor = vec4(col, a);
#endif
}`;

export type SpriteField = {
  group: THREE.Group;
  /** Moves the field: `distance` is the total metres travelled. */
  update(distance: number, time: number): void;
  setSun(dir: THREE.Vector3): void;
  dispose(): void;
};

/**
 * One field of cut-outs. The positions live in a GPU attribute (where each stands along the track, and its index); everything
 * else, including which cut-out it is on each lap, comes from a hash, so a lap costs nothing on the CPU and nothing pops.
 */
export function createSpriteField(spec: SpriteFieldSpec, data: AtlasData, map: THREE.Texture, u: WorldUniforms, opts: { mobile: boolean; shadows: boolean; shadowColor: string }): SpriteField {
  const picked = (spec.pick ? data.variants.filter((v) => spec.pick!.includes(v.name)) : data.variants).slice(0, MAX_VARIANTS);
  if (!picked.length) throw new Error(`Sprite atlas ${spec.atlas} has no variants`);
  const [W, H] = data.size;
  const rects: THREE.Vector4[] = [];
  const sizes: THREE.Vector2[] = [];
  const cum: number[] = [];
  const total = picked.reduce((s, v) => s + v.weight, 0);
  let acc = 0;
  for (let i = 0; i < MAX_VARIANTS; i++) {
    const v = picked[Math.min(i, picked.length - 1)];
    // a half-texel inside the rectangle, so neighbours in the atlas never bleed in
    const px = 0.75;
    const [x, y, w, h] = v.rect;
    rects.push(new THREE.Vector4((x + px) / W, 1 - (y + h - px) / H, (x + w - px) / W, 1 - (y + px) / H));
    sizes.push(new THREE.Vector2(v.width, v.height));
    if (i < picked.length) acc += v.weight / total;
    cum.push(i < picked.length ? acc : 1);
  }
  const row = spec.layout === "row";
  const count = row ? Math.max(1, Math.round(spec.span / (spec.spacing ?? 8))) : Math.max(1, Math.round(opts.mobile && spec.countMobile ? spec.countMobile : spec.count));
  const cell = spec.span / count;
  const inst = new Float32Array(count * 2);
  for (let i = 0; i < count; i++) {
    inst[i * 2] = -spec.span / 2 + (i + 0.5) * cell;
    inst[i * 2 + 1] = i;
  }
  const geometry = new THREE.InstancedBufferGeometry();
  const quad = new THREE.PlaneGeometry(1, 1);
  quad.translate(0, 0.5, 0);
  geometry.index = quad.index;
  geometry.setAttribute("position", quad.getAttribute("position"));
  geometry.setAttribute("aInst", new THREE.InstancedBufferAttribute(inst, 2));
  geometry.instanceCount = count;

  const tint = srgbVec3(spec.tint);
  const shared = {
    uMap: { value: map }, uSpan: { value: spec.span }, uCell: { value: cell }, uFadeLen: { value: spec.fade }, uScrollFrac: { value: 0 }, uLapBase: { value: 0 },
    uX: { value: new THREE.Vector2(spec.x[0], spec.x[1]) }, uScale: { value: new THREE.Vector2(spec.scale[0], spec.scale[1]) }, uSway: { value: spec.sway },
    uTime: u.uTime, uFacing: { value: spec.facing === "camera" ? 0 : 1 }, uLayout: { value: row ? 1 : 0 }, uWind: u.uWind, uRect: { value: rects }, uSize: { value: sizes },
    uCum: { value: cum }, uNumV: { value: picked.length }, uSunDir: u.uSunDir, uTint: { value: tint }, uNight: u.uNight, uFade: u.uFade, uFogColor: u.uFogColor, uFogDensity: u.uFogDensity,
    uShadowCol: { value: srgbVec3(opts.shadowColor) }, uShadowK: { value: spec.shadow },
  };
  const group = new THREE.Group();
  group.name = `sprites-${spec.atlas}`;
  const body = new THREE.ShaderMaterial({ vertexShader: SPRITE_VS, fragmentShader: SPRITE_FS, uniforms: shared, side: THREE.DoubleSide, alphaToCoverage: true, fog: false, toneMapped: false });
  const bodyMesh = new THREE.Mesh(geometry, body);
  bodyMesh.frustumCulled = false;
  bodyMesh.renderOrder = -5;
  group.add(bodyMesh);
  let shadow: THREE.ShaderMaterial | null = null;
  if (opts.shadows && spec.shadow > 0) {
    shadow = new THREE.ShaderMaterial({
      vertexShader: SPRITE_VS, fragmentShader: SPRITE_FS, uniforms: shared, defines: { SHADOW: "" }, side: THREE.DoubleSide, transparent: true, depthWrite: false,
      polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -4, fog: false, toneMapped: false,
    });
    const shadowMesh = new THREE.Mesh(geometry, shadow);
    shadowMesh.frustumCulled = false;
    shadowMesh.renderOrder = 1;
    group.add(shadowMesh);
  }
  return {
    group,
    update(distance, time) {
      const lap = Math.floor(distance / spec.span);
      shared.uLapBase.value = lap;
      shared.uScrollFrac.value = distance - lap * spec.span;
      void time;
    },
    setSun() {},
    dispose() {
      geometry.dispose();
      quad.dispose();
      body.dispose();
      shadow?.dispose();
    },
  };
}

/* ---------------------------------------------------------------------------------------------- E: ground */
export type GroundTextures = { albedo: THREE.Texture; normal?: THREE.Texture };

/**
 * The ground the hooves meet: a lit plane (so the horse's shadow and the sun's colour fall on it) whose texture coordinates are
 * the world position plus the distance travelled. The plane never moves; the sand slides under the horse by v x dt.
 */
// The ground's colour and normal map are read with a growing mip bias with distance, and the normal map fades out, so far sand
// settles to a calm tone instead of shimmering into a lattice of ripples at a grazing angle.
const GROUND_MAP_CHUNK = THREE.ShaderChunk.map_fragment.split("texture2D( map, vMapUv )").join("texture2D( map, vMapUv, gBias )");
const GROUND_NORMAL_CHUNK = THREE.ShaderChunk.normal_fragment_maps
  .split("texture2D( normalMap, vNormalMapUv )").join("texture2D( normalMap, vNormalMapUv, gBias )")
  .split("mapN.xy *= normalScale;").join("mapN.xy *= normalScale * gDetail;");

/** 24 cuts either side of the horse, growing from 1.6 m apart at the horse to 73 m at the edge: 4 608 triangles. */
export const GROUND_CUTS = 24;
export const GROUND_CUT_POWER = 2;

/**
 * The ground as a flat grid facing up. One 1.8 km quad made of two triangles looks the same but is not stable: the texture, world
 * position and shadow coordinates are all interpolated across a triangle thousands of times larger than the picture, and in the
 * tests the sand jumped by 2-3 cm on every third or fourth frame as the camera drifted a tenth of a millimetre. Cut into a grid
 * that is fine at the hooves (even 6 cuts a side is enough) the same sequence stays within the noise of the measurement.
 */
export function groundGeometry(size: number, cuts = GROUND_CUTS, power = GROUND_CUT_POWER) {
  const geometry = new THREE.PlaneGeometry(size, size, 2 * cuts, 2 * cuts);
  geometry.rotateX(-Math.PI / 2);
  const axis = groundAxis(size, cuts, power);
  const row = axis.length;
  const pos = geometry.getAttribute("position");
  // rows run along z in the order the rotated plane lists them, so the winding (and the up-facing normals) are unchanged
  for (let i = 0; i < pos.count; i++) pos.setXYZ(i, axis[i % row], 0, axis[Math.floor(i / row)]);
  pos.needsUpdate = true;
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  return geometry;
}

export function createGround(spec: GroundSpec, tex: GroundTextures, u: WorldUniforms, opts: { size?: number } = {}) {
  const size = opts.size ?? 1800;
  const material = new THREE.MeshStandardMaterial({ map: tex.albedo, normalMap: tex.normal ?? null, roughness: spec.roughness, metalness: 0, color: new THREE.Color(spec.tint) });
  if (tex.normal) material.normalScale.set(spec.normalScale, spec.normalScale);
  const uniforms = {
    uTile: { value: spec.tileMetres }, uTilePhase: { value: 0 }, uScroll: u.uScroll, uMacro: { value: spec.macro },
    uMacroTint: { value: new THREE.Vector3(1.03, 0.97, 0.9) }, uNight: u.uNight, uFade: u.uFade,
  };
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nuniform float uTile; uniform float uTilePhase; varying vec3 vGroundW;")
      .replace(
        "#include <uv_vertex>",
        `#include <uv_vertex>
        {
          vec4 gpos = modelMatrix * vec4(position, 1.0);
          vGroundW = gpos.xyz;
          vec2 guv = vec2(gpos.x / uTile, -(gpos.z / uTile + uTilePhase));
          #ifdef USE_MAP
            vMapUv = guv;
          #endif
          #ifdef USE_NORMALMAP
            vNormalMapUv = guv;
          #endif
        }`,
      );
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        `#include <common>
        ${GLSL_NOISE}
        uniform float uScroll; uniform float uMacro; uniform vec3 uMacroTint; uniform vec3 uNight; uniform float uFade; varying vec3 vGroundW;`,
      )
      .replace("#include <normal_fragment_maps>", GROUND_NORMAL_CHUNK)
      .replace(
        "#include <map_fragment>",
        `float gDist = length(vViewPosition);
        float gBias = clamp((gDist - 10.0) / 16.0, 0.0, 3.5);
        float gDetail = 1.0 - smoothstep(18.0, 85.0, gDist);
        ${GROUND_MAP_CHUNK}
        {
          vec2 g = vec2(vGroundW.x, vGroundW.z + uScroll);
          float m = vnoise(g * 0.052, 71) * 0.55 + vnoise(g * 0.17 + 9.1, 72) * 0.30 + vnoise(g * 0.61 + 2.3, 73) * 0.15;
          float h = vnoise(g * 0.031 + 40.0, 74);
          diffuseColor.rgb *= (1.0 + (m - 0.5) * 2.0 * uMacro) * mix(vec3(1.0), uMacroTint, smoothstep(0.35, 0.8, h) * min(1.0, uMacro * 4.0));
        }`,
      )
      .replace("#include <dithering_fragment>", "#include <dithering_fragment>\n gl_FragColor.rgb = mix(uNight, gl_FragColor.rgb, uFade);");
  };
  material.customProgramCacheKey = () => "horse-worlds-ground-v2";
  const geometry = groundGeometry(size);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.receiveShadow = true;
  mesh.name = "ground";
  mesh.frustumCulled = false;
  return {
    mesh,
    material,
    update(distance: number) {
      uniforms.uTilePhase.value = distance / spec.tileMetres - Math.floor(distance / spec.tileMetres);
    },
  };
}
