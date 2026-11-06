import * as THREE from "three";
import { SKYFOG_PARS, type SkyFog } from "./skyfog";

/**
 * Soft dust for World 03: billboarded quads (not GL points, whose size is capped by the driver and whose square edge shows on
 * large sprites) with a round falloff, a little internal noise, sun-side brightening (forward scattering: dust glows when you
 * look toward the sun) and the world's aerial perspective. Particles drift and wrap inside a box around a centre.
 */
const VS = /* glsl */ `
attribute vec3 aOffset;
attribute vec2 aRnd;
uniform float uTime; uniform vec3 uBox; uniform vec3 uCenter; uniform vec3 uDrift; uniform float uSwirl; uniform vec2 uSize;
varying vec2 vQ; varying float vA; varying vec3 vSkyFogPos; varying float vSeed; varying float vY;
void main() {
  vec3 p = aOffset + uDrift * uTime * (0.7 + 0.6 * aRnd.y);
  p.x += sin(uTime * (0.2 + aRnd.x * 0.3) + aRnd.y * 40.0) * uSwirl;
  p.y += cos(uTime * (0.17 + aRnd.y * 0.2) + aRnd.x * 17.0) * uSwirl * 0.4;
  p = mod(p - uCenter + uBox * 0.5, uBox) - uBox * 0.5 + uCenter;
  vec3 e = abs(p - uCenter) / (uBox * 0.5);
  float size = mix(uSize.x, uSize.y, aRnd.x * aRnd.x);
  vec4 mv = viewMatrix * vec4(p, 1.0);
  float ang = aRnd.y * 6.2831 + uTime * 0.05 * (aRnd.x - 0.5);
  vec2 c = position.xy;
  c = vec2(c.x * cos(ang) - c.y * sin(ang), c.x * sin(ang) + c.y * cos(ang));
  mv.xy += c * size;
  gl_Position = projectionMatrix * mv;
  // world height of this corner: a sprite never shows the straight line where the ground cuts it
  vY = (inverse(viewMatrix) * mv).y;
  vQ = position.xy * 2.0;
  vSeed = aRnd.x * 13.7 + aRnd.y * 3.1;
  vA = (1.0 - smoothstep(0.75, 1.0, max(e.x, max(e.y, e.z)))) * smoothstep(0.3, 2.0 + size, -mv.z) * (0.45 + 0.55 * aRnd.y);
  vSkyFogPos = p;
}`;

const FS = /* glsl */ `
uniform vec3 uColor; uniform float uOpacity; uniform vec3 uSunDir; uniform float uTime; uniform vec2 uGroundFade;
varying vec2 vQ; varying float vA; varying float vSeed; varying float vY;
${SKYFOG_PARS}
float h21(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float vn(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(h21(i), h21(i + vec2(1, 0)), f.x), mix(h21(i + vec2(0, 1)), h21(i + vec2(1, 1)), f.x), f.y); }
void main() {
  float r = length(vQ);
  if (r > 1.0) discard;
  float n = vn(vQ * 2.3 + vSeed) * 0.6 + vn(vQ * 5.1 - vSeed) * 0.4;
  float a = pow(1.0 - r, 1.6) * (0.55 + 0.9 * n) * vA * uOpacity * smoothstep(uGroundFade.x, uGroundFade.y, vY);
  if (a < 0.003) discard;
  vec3 V = normalize(vSkyFogPos - cameraPosition);
  float fwd = pow(max(dot(V, uSunDir), 0.0), 6.0);
  vec3 col = uColor * (0.75 + 1.6 * fwd);
  float sfa = skyFogAmount(cameraPosition, vSkyFogPos);
  col = mix(col, skyFogColor(V), sfa * 0.85);
  gl_FragColor = vec4(col, a);
}`;

export class Dust {
  readonly mesh: THREE.Mesh;
  readonly uniforms: Record<string, THREE.IUniform>;
  constructor(opts: { groundFade?: [number, number]; count: number; box: [number, number, number]; center: THREE.Vector3Like; size: [number, number]; color: THREE.ColorRepresentation; drift?: [number, number, number]; swirl?: number; opacity?: number; seed?: number; fog: SkyFog; sunDir: THREE.Vector3; additive?: boolean }) {
    const g = new THREE.InstancedBufferGeometry();
    const quad = new THREE.PlaneGeometry(1, 1);
    g.index = quad.index;
    g.setAttribute("position", quad.getAttribute("position"));
    const n = opts.count;
    const off = new Float32Array(n * 3);
    const rnd = new Float32Array(n * 2);
    let s = opts.seed ?? 11;
    const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < n; i++) {
      off[i * 3] = opts.center.x + (r() - 0.5) * opts.box[0];
      off[i * 3 + 1] = opts.center.y + (r() - 0.5) * opts.box[1];
      off[i * 3 + 2] = opts.center.z + (r() - 0.5) * opts.box[2];
      rnd[i * 2] = r();
      rnd[i * 2 + 1] = r();
    }
    g.setAttribute("aOffset", new THREE.InstancedBufferAttribute(off, 3));
    g.setAttribute("aRnd", new THREE.InstancedBufferAttribute(rnd, 2));
    g.instanceCount = n;
    this.uniforms = {
      uTime: { value: 0 },
      uBox: { value: new THREE.Vector3(...opts.box) },
      uCenter: { value: new THREE.Vector3(opts.center.x, opts.center.y, opts.center.z) },
      uDrift: { value: new THREE.Vector3(...(opts.drift ?? [0, 0, 0])) },
      uSwirl: { value: opts.swirl ?? 0.5 },
      uSize: { value: new THREE.Vector2(...opts.size) },
      uColor: { value: new THREE.Color(opts.color) },
      uOpacity: { value: opts.opacity ?? 1 },
      uSunDir: { value: opts.sunDir },
      uGroundFade: { value: new THREE.Vector2(...(opts.groundFade ?? [-0.5, 2.5])) },
      ...opts.fog.uniforms,
    };
    const mat = new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      vertexShader: VS,
      fragmentShader: FS,
      transparent: true,
      depthWrite: false,
      blending: opts.additive ? THREE.AdditiveBlending : THREE.NormalBlending,
    });
    this.mesh = new THREE.Mesh(g, mat);
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = 3;
  }
  set opacity(v: number) {
    this.uniforms.uOpacity.value = v;
    this.mesh.visible = v > 0.002;
  }
  update(time: number) {
    this.uniforms.uTime.value = time;
  }
  dispose() {
    this.mesh.geometry.dispose();
    (this.mesh.material as THREE.Material).dispose();
  }
}
