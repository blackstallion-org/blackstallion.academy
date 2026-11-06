import * as THREE from "three";
import { patchAerial } from "./aerial";

/**
 * The valley ground. Geometry and its masks come from Blender (tools/blender/12_worlds/origins/terrain.py): COLOR_0 =
 * (rock, sand/track, lush, sun visibility baked by marching the heightfield toward the key light). Texturing happens here in world space so there are no UVs to stretch on the mountains:
 *   near: Grass004 (ambientCG, CC0) at two scales; mid/far: aerial_grass_rock (Poly Haven, CC0) tinted toward the valley green;
 *   rock: aerial_rocks_02 (Poly Haven, CC0) on steep slopes and mountains; sand on the arena, the track and the river gravel.
 * Two scales of each texture and a very low-frequency tint break up the tiling; normals come from the same maps in a
 * world-space tangent frame (u = +x, v = +z).
 */
export type GroundTextures = {
  grass: THREE.Texture; grassN: THREE.Texture; meadow: THREE.Texture; meadowN: THREE.Texture; rock: THREE.Texture; rockN: THREE.Texture;
};

export function terrainMaterial(t: GroundTextures) {
  const mat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.95, metalness: 0 });
  const uniforms = {
    tGrass: { value: t.grass }, tGrassN: { value: t.grassN }, tMeadow: { value: t.meadow }, tMeadowN: { value: t.meadowN },
    tRock: { value: t.rock }, tRockN: { value: t.rockN },
  };
  patchAerial(
    mat,
    (s) => {
      Object.assign(s.uniforms, uniforms);
      s.vertexShader = s.vertexShader
        .replace("#include <common>", "#include <common>\nattribute vec4 color;\nvarying vec4 vMask;\nvarying vec3 vWPos;\nvarying vec3 vWNormal;")
        .replace(
          "#include <fog_vertex>",
          "#include <fog_vertex>\nvMask = color;\nvWPos = (modelMatrix * vec4(transformed, 1.0)).xyz;\nvWNormal = normalize(mat3(modelMatrix) * objectNormal);",
        );
      s.fragmentShader = s.fragmentShader
        .replace(
          "#include <common>",
          `#include <common>
          uniform sampler2D tGrass; uniform sampler2D tGrassN; uniform sampler2D tMeadow; uniform sampler2D tMeadowN;
          uniform sampler2D tRock; uniform sampler2D tRockN;
          varying vec4 vMask; varying vec3 vWPos; varying vec3 vWNormal;
          vec3 gLayer; float gRough; float gSunVis;
          vec3 nrm(sampler2D t, vec2 uv) { return texture2D(t, uv).xyz * 2.0 - 1.0; }
          float h12(vec2 p) { return fract(sin(dot(p, vec2(41.3, 289.1))) * 43758.5); }
          // triplanar on steep ground (banks, outcrops): planar xz alone smears into vertical streaks there
          vec3 tri(sampler2D t, vec3 p, vec3 n, float s) {
            vec3 w = pow(abs(n), vec3(4.0)); w /= (w.x + w.y + w.z);
            vec3 c = texture2D(t, p.xz / s).rgb * w.y;
            if (w.x > 0.02) c += texture2D(t, p.zy / s).rgb * w.x;
            if (w.z > 0.02) c += texture2D(t, p.xy / s).rgb * w.z;
            return c;
          }
          float vn2(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
            return mix(mix(h12(i), h12(i + vec2(1, 0)), f.x), mix(h12(i + vec2(0, 1)), h12(i + vec2(1, 1)), f.x), f.y); }`,
        )
        .replace(
          "#include <map_fragment>",
          /* glsl */ `
          vec2 xz = vWPos.xz;
          float dist = length(vWPos - cameraPosition);
          float nearW = 1.0 - smoothstep(25.0, 140.0, dist);
          float slope = 1.0 - clamp(vWNormal.y, 0.0, 1.0);
          float rockW = clamp(max(vMask.r, smoothstep(0.32, 0.55, slope)), 0.0, 1.0);
          float sandW = vMask.g * (1.0 - rockW);
          float lush = vMask.b;
          float macro = vn2(xz / 180.0) * 0.6 + vn2(xz / 47.0) * 0.4;
          // grass: two scales of the close texture near the lens, the aerial meadow texture beyond
          vec3 gNear = mix(tri(tGrass, vWPos, vWNormal, 3.1), texture2D(tGrass, xz / 11.7 + 0.37).rgb, 0.45);
          vec3 gFar = mix(texture2D(tMeadow, xz / 70.0).rgb, texture2D(tMeadow, xz / 310.0 + 0.21).rgb, 0.5);
          // the aerial texture is olive: pull it toward the valley's green and keep its light/dark structure
          float gl = dot(gFar, vec3(0.3, 0.55, 0.15));
          gFar = mix(gFar, vec3(0.085, 0.16, 0.035) * (0.55 + gl * 1.6), 0.65);
          vec3 grass = mix(gFar, gNear * vec3(0.55, 0.75, 0.42), nearW);
          grass *= mix(vec3(1.08, 1.0, 0.72), vec3(0.62, 0.86, 0.5), lush) * (0.8 + 0.4 * macro);
          vec3 rock = mix(tri(tRock, vWPos, vWNormal, 23.0), tri(tRock, vWPos + 70.0, vWNormal, 140.0), 0.5) * vec3(0.95, 0.92, 0.88);
          vec3 sand = vec3(0.56, 0.45, 0.32) * (0.85 + 0.3 * vn2(xz * 0.7)) * (0.9 + 0.2 * macro);
          gLayer = mix(mix(grass, sand, sandW), rock, rockW);
          gRough = mix(0.93, 0.85, rockW);
          diffuseColor.rgb *= gLayer;
          gSunVis = smoothstep(0.05, 0.95, vMask.a);`,
        )
        .replace("#include <roughnessmap_fragment>", "float roughnessFactor = gRough;")
        // the baked hill and mountain shadows (alpha of the mask) dim the sun, on top of the live shadow map near the horse
        .replace(/RE_Direct\( directLight,/g, "directLight.color *= gSunVis; RE_Direct( directLight,")
        .replace(
          "#include <normal_fragment_maps>",
          /* glsl */ `
          {
            vec3 nG = mix(nrm(tMeadowN, xz / 70.0), nrm(tGrassN, xz / 3.1), nearW);
            vec3 nR = nrm(tRockN, xz / 23.0);
            vec3 tn = normalize(mix(nG * vec3(0.7, 0.7, 1.0), nR, rockW));
            tn = normalize(mix(vec3(0.0, 0.0, 1.0), tn, smoothstep(0.45, 0.8, abs(vWNormal.y))));
            vec3 N = normalize(vWNormal);
            vec3 T = normalize(vec3(1.0, 0.0, 0.0) - N * N.x);
            vec3 B = normalize(cross(T, N));
            vec3 wn = normalize(T * tn.x + B * tn.y + N * tn.z);
            normal = normalize(mat3(viewMatrix) * wn);
          }`,
        );
    },
    "origins-terrain",
  );
  return mat;
}
