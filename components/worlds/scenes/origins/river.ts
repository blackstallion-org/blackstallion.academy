import * as THREE from "three";
import { AERIAL, AERIAL_PARS } from "./aerial";
import { SKY_PARS } from "./sky";

/**
 * The river: a ribbon along the Blender centre line (origins-layout.json) laid in the carved channel. The surface reflects the
 * same sky panorama the viewer sees (so it burns gold toward the sun, as in the reference), with Fresnel, two scrolling layers
 * of procedural ripples, a sun glint and the valley haze; looking straight down it shows a dark, slightly green body of water.
 */
export class River {
  readonly mesh: THREE.Mesh;
  constructor(points: number[][], level: number, skyTex: THREE.Texture, sunDir: THREE.Vector3, sunColor: THREE.Color) {
    const pos: number[] = [];
    const uv: number[] = [];
    const idx: number[] = [];
    let acc = 0;
    for (let i = 0; i < points.length; i++) {
      const [x, z, w] = points[i];
      const a = points[Math.max(0, i - 1)];
      const b = points[Math.min(points.length - 1, i + 1)];
      let tx = b[0] - a[0];
      let tz = b[1] - a[1];
      const l = Math.hypot(tx, tz) || 1;
      tx /= l;
      tz /= l;
      const hw = w * 0.5;
      if (i > 0) acc += Math.hypot(x - points[i - 1][0], z - points[i - 1][1]);
      pos.push(x - tz * hw, level, z + tx * hw, x + tz * hw, level, z - tx * hw);
      uv.push(0, acc, 1, acc);
      if (i > 0) {
        const k = i * 2;
        idx.push(k - 2, k, k - 1, k - 1, k, k + 1);
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
    g.setIndex(idx);
    g.computeVertexNormals();
    const mat = new THREE.ShaderMaterial({
      uniforms: { ...AERIAL, uSky: { value: skyTex }, uSkyCrop: { value: 0.5625 }, uSkyGain: { value: 0.45 }, uTime: { value: 0 }, uSunDir: { value: sunDir }, uSunColor: { value: sunColor } },
      vertexShader: /* glsl */ `
        varying vec3 vW; varying vec2 vUv;
        void main() { vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; vUv = uv; gl_Position = projectionMatrix * viewMatrix * w; }`,
      fragmentShader: /* glsl */ `
        ${SKY_PARS}
        ${AERIAL_PARS}
        uniform float uTime; uniform vec3 uSunDir; uniform vec3 uSunColor;
        varying vec3 vW; varying vec2 vUv;
        float h12(vec2 p) { return fract(sin(dot(p, vec2(41.3, 289.1))) * 43758.5); }
        float vn(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
          return mix(mix(h12(i), h12(i + vec2(1, 0)), f.x), mix(h12(i + vec2(0, 1)), h12(i + vec2(1, 1)), f.x), f.y); }
        vec2 grad(vec2 p) { float e = 0.05; return vec2(vn(p + vec2(e, 0)) - vn(p - vec2(e, 0)), vn(p + vec2(0, e)) - vn(p - vec2(0, e))) / (2.0 * e); }
        void main() {
          vec2 p = vW.xz;
          vec2 g1 = grad(p * 0.35 + vec2(0.0, uTime * 0.25));
          vec2 g2 = grad(p * 1.3 - vec2(uTime * 0.31, uTime * 0.12));
          vec3 n = normalize(vec3(-(g1.x * 0.05 + g2.x * 0.025), 1.0, -(g1.y * 0.05 + g2.y * 0.025)));
          vec3 v = normalize(vW - cameraPosition);
          vec3 r = reflect(v, n);
          r.y = abs(r.y);
          float cosT = clamp(dot(-v, n), 0.0, 1.0);
          float F = 0.02 + 0.98 * pow(1.0 - cosT, 5.0);
          vec3 refl = skyLookup(r);
          vec3 body = vec3(0.008, 0.016, 0.012);
          float glint = pow(max(dot(r, normalize(uSunDir)), 0.0), 600.0) * 40.0;
          vec3 col = mix(body, refl, F) + uSunColor * glint;
          // soft banks
          float edge = smoothstep(0.0, 0.12, vUv.x) * smoothstep(1.0, 0.88, vUv.x);
          col = mix(body * 2.0, col, edge);
          gl_FragColor = vec4(aerial(col, vW), 1.0);
        }`,
    });
    this.mesh = new THREE.Mesh(g, mat);
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = 1;
  }
  update(time: number) {
    (this.mesh.material as THREE.ShaderMaterial).uniforms.uTime.value = time;
  }
  dispose() {
    this.mesh.geometry.dispose();
    (this.mesh.material as THREE.Material).dispose();
  }
}
