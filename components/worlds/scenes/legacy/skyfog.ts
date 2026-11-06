import * as THREE from "three";

/**
 * Aerial perspective for World 03: height fog whose colour is the sky itself, read from the sky texture in the direction the
 * camera looks (blurred, at the horizon). Distant ridges and the fort melt into the exact colour of the sky behind them, warm
 * toward the sun and cooler away from it, instead of into one flat fog colour. Thick near the ground (exponential falloff
 * with height, integrated along the view ray), thin aloft.
 */
export type SkyFog = {
  uniforms: {
    tSkyFog: THREE.IUniform<THREE.Texture | null>;
    uSkyRotT: THREE.IUniform<THREE.Matrix3>;
    uFogDensity: THREE.IUniform<number>;
    uFogFalloff: THREE.IUniform<number>;
    uFogGain: THREE.IUniform<THREE.Color>;
    uFogLod: THREE.IUniform<number>;
    uFogMax: THREE.IUniform<number>;
  };
  /** Patch a material (call once, before first use). Works for standard/physical/basic materials, skinned and instanced meshes. */
  apply(material: THREE.Material, key?: string): void;
};

export const SKYFOG_PARS = /* glsl */ `
uniform sampler2D tSkyFog;
uniform mat3 uSkyRotT;
uniform float uFogDensity;
uniform float uFogFalloff;
uniform vec3 uFogGain;
uniform float uFogLod;
uniform float uFogMax;
varying vec3 vSkyFogPos;
vec3 skyFogColor(vec3 dir) {
  vec3 d = normalize(vec3(dir.x, max(dir.y, 0.0) * 0.5 + 0.085, dir.z)); // a few degrees above the horizon: the HDRI's own horizon line is dark
  d = uSkyRotT * d;
  vec2 uv = vec2(atan(d.z, d.x) * 0.15915494 + 0.5, asin(clamp(d.y, -1.0, 1.0)) * 0.31830989 + 0.5);
  return textureLod(tSkyFog, uv, uFogLod).rgb * uFogGain;
}
float skyFogAmount(vec3 cam, vec3 p) {
  vec3 r = p - cam;
  float dist = length(r);
  float a = uFogFalloff;
  float hc = cam.y, hp = p.y;
  float dh = hp - hc;
  // integral of exp(-a h) along the ray, divided by its length
  float avg = abs(dh) < 0.05 ? exp(-a * hc) : (exp(-a * hc) - exp(-a * hp)) / (a * dh);
  return min(uFogMax, 1.0 - exp(-uFogDensity * dist * max(avg, 0.0)));
}
`;

export function createSkyFog(): SkyFog {
  const uniforms = {
    tSkyFog: { value: null as THREE.Texture | null },
    uSkyRotT: { value: new THREE.Matrix3() },
    uFogDensity: { value: 0.0016 },
    uFogFalloff: { value: 1 / 90 },
    uFogGain: { value: new THREE.Color(1, 1, 1) },
    uFogLod: { value: 6.5 },
    uFogMax: { value: 0.985 },
  };
  const apply = (material: THREE.Material, key = "") => {
    const prev = material.onBeforeCompile;
    material.onBeforeCompile = (shader, renderer) => {
      prev?.call(material, shader, renderer);
      Object.assign(shader.uniforms, uniforms);
      shader.vertexShader = shader.vertexShader
        .replace("#include <common>", "#include <common>\nvarying vec3 vSkyFogPos;")
        .replace(
          "#include <project_vertex>",
          `#include <project_vertex>
          {
            vec4 sfp = vec4(transformed, 1.0);
            #ifdef USE_INSTANCING
              sfp = instanceMatrix * sfp;
            #endif
            vSkyFogPos = (modelMatrix * sfp).xyz;
          }`,
        );
      shader.fragmentShader = shader.fragmentShader
        .replace("#include <common>", `#include <common>\n${SKYFOG_PARS}`)
        .replace(
          "#include <fog_fragment>",
          `{
            float sfa = skyFogAmount(cameraPosition, vSkyFogPos);
            gl_FragColor.rgb = mix(gl_FragColor.rgb, skyFogColor(normalize(vSkyFogPos - cameraPosition)), sfa);
          }`,
        );
    };
    material.customProgramCacheKey = () => `skyfog|${key}|${material.type}`;
    material.needsUpdate = true;
  };
  return { uniforms, apply };
}

/** The matrix three.js uses to turn a world direction into a sky-texture direction for a scene.backgroundRotation about Y. */
export function skyRotationT(rotY: number, out = new THREE.Matrix3()) {
  const m = new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(0, rotY, 0));
  return out.setFromMatrix4(m).transpose();
}
