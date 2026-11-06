import * as THREE from "three";

/**
 * Aerial perspective for the valley: distance haze that thins with altitude and warms toward the low sun, applied to every
 * Origins material in linear light (before the post chain's tone curve). Colours were measured from the sky panorama's
 * horizon band (tools/blender/12_worlds/origins/README.md), so the mountains fade into the same air the sky shows.
 */
export const AERIAL = {
  uAerialColor: { value: new THREE.Color(0.46, 0.55, 0.68) },
  uAerialSun: { value: new THREE.Color(1.55, 1.05, 0.62) },
  uAerialSunDir: { value: new THREE.Vector3(0.5, 0.08, 0.86).normalize() },
  uAerialDensity: { value: 1.05e-4 },
  uAerialFalloff: { value: 1 / 1400 },
  uAerialBase: { value: 0 },
};

export const AERIAL_PARS = /* glsl */ `
uniform vec3 uAerialColor; uniform vec3 uAerialSun; uniform vec3 uAerialSunDir;
uniform float uAerialDensity; uniform float uAerialFalloff; uniform float uAerialBase;
vec3 aerial(vec3 col, vec3 wpos) {
  vec3 ray = wpos - cameraPosition;
  float d = length(ray);
  vec3 v = ray / max(d, 1e-3);
  // optical depth through an exponential atmosphere between the eye and the point
  float h0 = max(cameraPosition.y - uAerialBase, 0.0);
  float h1 = max(wpos.y - uAerialBase, 0.0);
  float dh = h1 - h0;
  float k = uAerialFalloff;
  float od = abs(dh) > 1.0 ? (exp(-k * h0) - exp(-k * h1)) / (k * dh) : exp(-k * h0);
  float f = 1.0 - exp(-d * uAerialDensity * od);
  float s = max(dot(v, normalize(uAerialSunDir)), 0.0);
  vec3 fc = mix(uAerialColor, uAerialSun, pow(s, 8.0) * 0.8 + pow(s, 60.0) * 0.4);
  return mix(col, fc, f);
}`;

/** Patches a built-in material (Standard/Physical/Basic/Lambert) so its fog is the valley's aerial perspective. */
/** `key` must differ between materials whose `extra` patches differ (it is part of the program cache key). */
export function patchAerial(mat: THREE.Material, extra?: (s: THREE.WebGLProgramParametersWithUniforms) => void, key = "") {
  // a cached GLB can hand back a material that was already patched (a revisited world): patch once
  if (mat.userData.aerial) return;
  mat.userData.aerial = true;
  const prev = mat.onBeforeCompile;
  mat.onBeforeCompile = (shader, renderer) => {
    prev?.call(mat, shader, renderer);
    Object.assign(shader.uniforms, AERIAL);
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vAerialW;")
      .replace(
        "#include <fog_vertex>",
        `#include <fog_vertex>
        { vec4 aw = vec4(transformed, 1.0);
          #ifdef USE_INSTANCING
          aw = instanceMatrix * aw;
          #endif
          vAerialW = (modelMatrix * aw).xyz; }`,
      );
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", `#include <common>\nvarying vec3 vAerialW;\n${AERIAL_PARS}`)
      .replace("#include <fog_fragment>", "gl_FragColor.rgb = aerial(gl_FragColor.rgb, vAerialW);");
    extra?.(shader);
  };
  mat.customProgramCacheKey = () => `aerial-${mat.type}-${key}`;
  mat.needsUpdate = true;
}
