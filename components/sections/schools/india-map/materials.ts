import * as THREE from "three";
import { mapPalette } from "@/lib/content/india-map";
import type { Meta, River } from "./data";

/**
 * The materials of the sculpture. The land is a lit, rough, matte stone (no gloss): its colour comes from the brief's palette by
 * height and slope, darkened where a valley hides the sky (baked occlusion) and given a fine grain that fades out wherever it would
 * be smaller than a pixel. Countries around India are cast in the same relief in a muted ocean-grey, so the Himalaya runs on
 * unbroken; India's land border is a thin ivory line drawn from the baked signed distance. The ocean is flat, dark and calm.
 */

const GRAIN = /* glsl */ `
  float hash21(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
  float vnoise(vec2 p){
    vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash21(i), hash21(i + vec2(1.0, 0.0)), f.x), mix(hash21(i + vec2(0.0, 1.0)), hash21(i + vec2(1.0, 1.0)), f.x), f.y);
  }
  float band(vec2 p, float freq, float fw){ return mix(0.5, vnoise(p * freq), clamp((1.0 / freq) / (fw * 3.0), 0.0, 1.0)); }
  float grain(vec2 p, float fw){ return band(p, 22.0, fw) * 0.5 + band(p, 64.0, fw) * 0.32 + band(p, 180.0, fw) * 0.18; }
`;

const col = (hex: string) => new THREE.Color(hex);
/** Mix two colours in sRGB (the way a painter mixes), not in linear light, which would drag a dark colour toward the lighter one. */
const mix = (a: THREE.Color, b: THREE.Color, t: number) => {
  const x = a.getRGB({ r: 0, g: 0, b: 0 } as THREE.RGB, THREE.SRGBColorSpace);
  const y = b.getRGB({ r: 0, g: 0, b: 0 } as THREE.RGB, THREE.SRGBColorSpace);
  return new THREE.Color().setRGB(x.r + (y.r - x.r) * t, x.g + (y.g - x.g) * t, x.b + (y.b - x.b) * t, THREE.SRGBColorSpace);
};

export function createTerrainMaterial(meta: Meta) {
  const ocean = col(mapPalette.ocean);
  const land = col(mapPalette.land);
  const uniforms = {
    uLand: { value: land },
    uSand: { value: col(mapPalette.sandstone) },
    uHigh: { value: col(mapPalette.highlight) },
    uShadow: { value: col(mapPalette.shadow) },
    // the neighbouring countries: ocean tinted a little toward the land, so they read as part of the same model but not as India
    uCtxLow: { value: mix(ocean, land, 0.16) },
    uCtxHigh: { value: mix(ocean, col(mapPalette.highlight), 0.34) },
    uSlab: { value: meta.slab },
    uRelief: { value: (meta.exaggeration * meta.max_elevation_m) / meta.unit_m },
  };
  const material = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.92, metalness: 0 });
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nattribute float aAO;\nattribute float aSd;\nvarying float vAO;\nvarying float vSd;\nvarying vec3 vWorld;\nvarying vec3 vWN;")
      .replace("#include <begin_vertex>", "#include <begin_vertex>\nvAO = aAO; vSd = aSd; vWorld = (modelMatrix * vec4(transformed, 1.0)).xyz; vWN = normalize(mat3(modelMatrix) * normal);");
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        `#include <common>
        varying float vAO; varying float vSd; varying vec3 vWorld; varying vec3 vWN;
        uniform vec3 uLand, uSand, uHigh, uShadow, uCtxLow, uCtxHigh; uniform float uSlab, uRelief;
        ${GRAIN}
        vec3 terrainColor() {
          float fw = max(length(fwidth(vWorld.xz)), 1e-5);
          float h = clamp((vWorld.y - uSlab) / uRelief, 0.0, 1.0);
          float steep = smoothstep(0.25, 0.85, 1.0 - clamp(normalize(vWN).y, 0.0, 1.0));
          float g = grain(vWorld.xz, fw);
          vec3 c = mix(uLand, uSand, smoothstep(0.03, 0.22, h));
          c = mix(c, uHigh, smoothstep(0.3, 0.72, h));
          c = mix(c, uShadow, steep * 0.62);
          c *= 0.9 + 0.2 * g;
          vec3 ctx = mix(uCtxLow, uCtxHigh, smoothstep(0.02, 0.62, h));
          ctx = mix(ctx, uCtxLow * 0.7, steep * 0.4) * (0.94 + 0.12 * g);
          float fs = max(fwidth(vSd) * 0.75, 1e-4);
          vec3 base = mix(ctx, c, smoothstep(-fs, fs, vSd));
          // India's land border: a hairline of ivory where the baked signed distance crosses zero
          float line = 1.0 - smoothstep(0.4, 1.0, abs(vSd) / (fwidth(vSd) * 1.25 + 1e-4));
          base = mix(base, uHigh, line * 0.62);
          float inside = smoothstep(-fs, fs, vSd);
          return base * mix(1.0, vAO, mix(0.5, 0.88, inside));
        }`,
      )
      .replace("#include <color_fragment>", "#include <color_fragment>\ndiffuseColor.rgb = terrainColor();")
      .replace(
        "#include <roughnessmap_fragment>",
        "#include <roughnessmap_fragment>\nroughnessFactor = clamp(0.9 + (grain(vWorld.xz, max(length(fwidth(vWorld.xz)), 1e-5)) - 0.5) * 0.16, 0.6, 1.0);",
      );
  };
  material.customProgramCacheKey = () => "india-terrain-v1";
  return material;
}

export function createOceanMaterials(meta: Meta, coast: THREE.Texture) {
  const uniforms = {
    uCoast: { value: coast },
    uPlate: { value: new THREE.Vector4(meta.plate.x[0], meta.plate.x[1], meta.plate.z[0], meta.plate.z[1]) },
    uGlow: { value: new THREE.Color(mapPalette.river).multiplyScalar(0.2) },
  };
  const top = new THREE.MeshStandardMaterial({ color: mapPalette.ocean, roughness: 0.5, metalness: 0 });
  top.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vWorld;")
      .replace("#include <begin_vertex>", "#include <begin_vertex>\nvWorld = (modelMatrix * vec4(transformed, 1.0)).xyz;");
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vWorld; uniform sampler2D uCoast; uniform vec4 uPlate; uniform vec3 uGlow;")
      .replace(
        "#include <color_fragment>",
        `#include <color_fragment>
        vec2 cuv = vec2((vWorld.x - uPlate.x) / (uPlate.y - uPlate.x), (uPlate.w - vWorld.z) / (uPlate.w - uPlate.z));
        float shallow = texture2D(uCoast, cuv).r;
        diffuseColor.rgb += uGlow * shallow;
        // the sea darkens slightly toward the edges of the plate
        vec2 e = abs(cuv - 0.5) * 2.0;
        diffuseColor.rgb *= 1.0 - 0.28 * smoothstep(0.55, 1.0, max(e.x, e.y));`,
      );
  };
  top.customProgramCacheKey = () => "india-ocean-v1";
  const side = new THREE.MeshStandardMaterial({ color: new THREE.Color(mapPalette.ocean).multiplyScalar(0.55), roughness: 0.7, metalness: 0 });
  return { top, side };
}

export type RiverMaterial = ReturnType<typeof createRiverMaterial>;

/**
 * Rivers: thin ribbons laid on the surface. The centre line and the sideways direction are baked; the width is set here, never
 * thinner than about a pixel and a half on screen so a river stays visible when the whole country is in view. A restrained packet
 * of light travels along the selected rivers (it stops under reduced motion).
 */
export function createRiverMaterial() {
  const uniforms = {
    uTime: { value: 0 },
    uPixel: { value: 0.002 },
    uFlow: { value: 1 },
    uColor: { value: new THREE.Color(mapPalette.river) },
  };
  const material = new THREE.ShaderMaterial({
    uniforms,
    transparent: true,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -4,
    polygonOffsetUnits: -4,
    vertexShader: /* glsl */ `
      attribute vec2 aPerp; attribute float aSide; attribute float aWidth; attribute float aDist; attribute float aFlow;
      uniform float uPixel;
      varying float vSide; varying float vDist; varying float vFlow;
      void main() {
        float d = distance(cameraPosition, position);
        float w = max(aWidth, uPixel * d * 1.7);
        vec3 p = position + vec3(aPerp.x, 0.0, aPerp.y) * aSide * 0.5 * w;
        vSide = aSide; vDist = aDist; vFlow = aFlow;
        gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0);
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor; uniform float uTime; uniform float uFlow;
      varying float vSide; varying float vDist; varying float vFlow;
      void main() {
        float edge = 1.0 - smoothstep(0.35, 1.0, abs(vSide));
        float p = fract(vDist * 0.16 - uTime * 0.03);
        float packet = smoothstep(0.0, 0.05, p) * (1.0 - smoothstep(0.05, 0.2, p));
        vec3 c = uColor * (0.92 + 0.5 * packet * vFlow * uFlow);
        gl_FragColor = vec4(c, edge * 0.92);
        #include <colorspace_fragment>
      }`,
  });
  return { material, uniforms };
}

const WIDTH = [0, 0.013, 0.019, 0.026];

/** One ribbon mesh for all rivers. `lift` raises it off the surface (the low-detail mesh is a little further from the true surface). */
export function buildRivers(rivers: River[], lift: number) {
  let count = 0;
  for (const r of rivers) count += r.points.length / 4;
  const position = new Float32Array(count * 2 * 3);
  const perp = new Float32Array(count * 2 * 2);
  const side = new Float32Array(count * 2);
  const width = new Float32Array(count * 2);
  const dist = new Float32Array(count * 2);
  const flow = new Float32Array(count * 2);
  const index: number[] = [];
  let v = 0;
  for (const r of rivers) {
    const n = r.points.length / 4;
    const w = WIDTH[r.rank] ?? WIDTH[1];
    for (let i = 0; i < n; i++) {
      const x = r.points[i * 4], y = r.points[i * 4 + 1], z = r.points[i * 4 + 2], s = r.points[i * 4 + 3];
      const px = r.points[Math.max(0, i - 1) * 4], pz = r.points[Math.max(0, i - 1) * 4 + 2];
      const nx = r.points[Math.min(n - 1, i + 1) * 4], nz = r.points[Math.min(n - 1, i + 1) * 4 + 2];
      let tx = nx - px, tz = nz - pz;
      const l = Math.hypot(tx, tz) || 1;
      tx /= l; tz /= l;
      for (let k = 0; k < 2; k++) {
        const o = (v + i * 2 + k);
        position.set([x, y + lift, z], o * 3);
        perp.set([-tz, tx], o * 2);
        side[o] = k === 0 ? -1 : 1;
        width[o] = w;
        dist[o] = s;
        flow[o] = r.flow ? 1 : 0;
      }
      if (i < n - 1) {
        const a = v + i * 2;
        index.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
      }
    }
    v += n * 2;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(position, 3));
  geometry.setAttribute("aPerp", new THREE.BufferAttribute(perp, 2));
  geometry.setAttribute("aSide", new THREE.BufferAttribute(side, 1));
  geometry.setAttribute("aWidth", new THREE.BufferAttribute(width, 1));
  geometry.setAttribute("aDist", new THREE.BufferAttribute(dist, 1));
  geometry.setAttribute("aFlow", new THREE.BufferAttribute(flow, 1));
  geometry.setIndex(index);
  return geometry;
}
