import * as THREE from "three";
import { AERIAL, AERIAL_PARS } from "./aerial";

/**
 * Low valley mist: large, very soft camera-facing veils lying along the valley floor and round the foot of the hill, lit warm on
 * the sun side and cool away from it (as in the reference, where the hill rises out of a haze). Each veil's alpha comes from
 * drifting noise, falls to zero at its rim and near the lens, so neither the sprite edges nor the lines where a sprite meets the
 * ground read. One draw call, additive-free (normal blending) so it veils rather than glows.
 */
export class Mist {
  readonly mesh: THREE.InstancedMesh;
  readonly uniforms: Record<string, THREE.IUniform>;
  constructor(spots: { x: number; y: number; z: number; w: number; h: number }[], sunDir: THREE.Vector3, sunColor: THREE.Color) {
    const geo = new THREE.PlaneGeometry(1, 1);
    this.uniforms = { ...AERIAL, uTime: { value: 0 }, uSunDir: { value: sunDir }, uSunColor: { value: sunColor } };
    const mat = new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      transparent: true,
      depthWrite: false,
      vertexShader: /* glsl */ `
        attribute float aSeed;
        varying vec2 vUv; varying vec3 vW; varying float vSeed;
        void main() {
          vec3 c = (modelMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
          float sx = length(instanceMatrix[0].xyz);
          float sy = length(instanceMatrix[1].xyz);
          vec3 toCam = cameraPosition - c; toCam.y = 0.0; toCam = normalize(toCam);
          vec3 right = normalize(cross(vec3(0.0, 1.0, 0.0), toCam));
          vec3 w = c + right * position.x * sx + vec3(0.0, 1.0, 0.0) * position.y * sy;
          vUv = uv; vW = w; vSeed = aSeed;
          gl_Position = projectionMatrix * viewMatrix * vec4(w, 1.0);
        }`,
      fragmentShader: /* glsl */ `
        ${AERIAL_PARS}
        uniform float uTime; uniform vec3 uSunDir; uniform vec3 uSunColor;
        varying vec2 vUv; varying vec3 vW; varying float vSeed;
        float h12(vec2 p) { return fract(sin(dot(p, vec2(41.3, 289.1))) * 43758.5); }
        float vn(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
          return mix(mix(h12(i), h12(i + vec2(1, 0)), f.x), mix(h12(i + vec2(0, 1)), h12(i + vec2(1, 1)), f.x), f.y); }
        float fbm(vec2 p) { float s = 0.0, a = 0.5; for (int i = 0; i < 4; i++) { s += a * vn(p); p *= 2.07; a *= 0.5; } return s; }
        void main() {
          vec2 q = vUv * vec2(3.0, 1.2) + vec2(vSeed * 13.0 + uTime * 0.012, vSeed * 7.0);
          float n = fbm(q);
          float rim = smoothstep(0.0, 0.35, vUv.x) * smoothstep(1.0, 0.65, vUv.x) * smoothstep(0.0, 0.25, vUv.y) * smoothstep(1.0, 0.45, vUv.y);
          float d = length(vW - cameraPosition);
          float a = smoothstep(0.4, 0.9, n) * rim * smoothstep(40.0, 260.0, d) * 0.3;
          if (a < 0.004) discard;
          vec3 v = normalize(vW - cameraPosition);
          float s = pow(max(dot(v, normalize(uSunDir)), 0.0), 3.0);
          vec3 col = mix(vec3(0.52, 0.58, 0.68), uSunColor * 0.75, 0.25 + 0.6 * s);
          gl_FragColor = vec4(aerial(col, vW), a);
        }`,
    });
    this.mesh = new THREE.InstancedMesh(geo, mat, spots.length);
    const seeds = new Float32Array(spots.length);
    const m4 = new THREE.Matrix4();
    spots.forEach((sp, i) => {
      m4.makeScale(sp.w, sp.h, 1);
      m4.setPosition(sp.x, sp.y + sp.h * 0.5 - sp.h * 0.18, sp.z);
      this.mesh.setMatrixAt(i, m4);
      seeds[i] = (i * 0.618) % 1;
    });
    geo.setAttribute("aSeed", new THREE.InstancedBufferAttribute(seeds, 1));
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = 5;
  }
  update(time: number) {
    this.uniforms.uTime.value = time;
  }
  dispose() {
    this.mesh.geometry.dispose();
    (this.mesh.material as THREE.Material).dispose();
  }
}
