import * as THREE from "three";

export type WireOptions = {
  body?: THREE.ColorRepresentation;
  line?: THREE.ColorRepresentation;
  /** Meridians around the body axis. */
  meridians?: number;
  /** Rings per metre along the body. */
  rings?: number;
  /** Height of the body axis in model space (metres). */
  axisY?: number;
  /** Line width in pixels. */
  width?: number;
};

/**
 * A near-black body with a white latitude/longitude grid. Built on MeshBasicMaterial so skinning and morphs still work;
 * the grid is computed from the bind-pose position, so it stretches with the muscles. Meridians run around the body's
 * long axis (z), rings cross it. Anti-aliased with screen-space derivatives.
 */
export function wireMaterial(o: WireOptions = {}) {
  const m = new THREE.MeshBasicMaterial({ color: new THREE.Color(o.body ?? 0x09090b), side: THREE.DoubleSide });
  const uniforms = {
    uLine: { value: new THREE.Color(o.line ?? 0xffffff) },
    uMer: { value: o.meridians ?? 28 },
    uRing: { value: o.rings ?? 9 },
    uAxisY: { value: o.axisY ?? 1.25 },
    uWidth: { value: o.width ?? 1.1 },
    uGlow: { value: 1 },
  };
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, uniforms);
    sh.vertexShader = sh.vertexShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vBind;")
      .replace("#include <begin_vertex>", "#include <begin_vertex>\nvBind = position;");
    sh.fragmentShader = sh.fragmentShader
      .replace(
        "#include <common>",
        `#include <common>
varying vec3 vBind;
uniform vec3 uLine; uniform float uMer; uniform float uRing; uniform float uAxisY; uniform float uWidth; uniform float uGlow;
float gridLine(float v, float fw) { float d = abs(fract(v - 0.5) - 0.5); return 1.0 - smoothstep(0.0, fw * uWidth, d); }`,
      )
      .replace(
        "#include <dithering_fragment>",
        `#include <dithering_fragment>
{
  vec2 r = vec2(vBind.x, vBind.y - uAxisY);
  // Two angle readings with their seams on opposite sides: the smaller derivative is the true one, so no seam line.
  float a = atan(r.y, r.x) / 6.2831853 * uMer;
  float b = atan(-r.y, -r.x) / 6.2831853 * uMer;
  float fwm = min(fwidth(a), fwidth(b));
  float lon = gridLine(a, fwm);
  float z = vBind.z * uRing;
  float lat = gridLine(z, fwidth(z));
  float line = max(lon, lat);
  gl_FragColor.rgb = mix(gl_FragColor.rgb, uLine, line * uGlow);
}`,
      );
  };
  m.customProgramCacheKey = () => "runway-wire";
  return { material: m, uniforms };
}
