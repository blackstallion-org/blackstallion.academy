import * as THREE from "three";

/**
 * The horse of light's tail: a few hundred fine golden strands, gathered into locks, streaming back from the dock and falling at the
 * tips, with a slow ripple through them. Drawn as thin ribbons that always face the camera, positioned entirely in the vertex shader
 * (no per-frame CPU work except the root), so it costs one draw call. It replaces the short hanging tail of the exhibit model,
 * which in additive light read as a white blob.
 */
export class TailHair {
  readonly mesh: THREE.Mesh;
  private readonly material: THREE.ShaderMaterial;

  constructor(strands = 760, segs = 22) {
    const rows = segs + 1;
    const n = strands * rows * 2;
    const seed = new Float32Array(n * 4);
    const along = new Float32Array(n);
    const side = new Float32Array(n);
    const index = new Uint32Array(strands * segs * 6);
    let s = 20261107;
    const rnd = () => (s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296;
    const gauss = () => rnd() + rnd() + rnd() - 1.5;
    // locks: strands in a lock share a sideways position and ripple phase, so the tail moves in flowing groups
    const locks = Array.from({ length: 14 }, () => ({ lat: (rnd() - 0.5) * 1.1, ph: rnd(), len: rnd() }));
    let v = 0;
    let ii = 0;
    for (let i = 0; i < strands; i++) {
      const lock = locks[i % locks.length];
      const r = [Math.min(1, Math.max(0, lock.len * 0.55 + rnd() * 0.45)), lock.lat + gauss() * 0.28, (rnd() - 0.5) * 2, lock.ph + gauss() * 0.12];
      const base = v;
      for (let k = 0; k < rows; k++) {
        for (const sd of [-1, 1]) { seed.set(r, v * 4); along[v] = k / segs; side[v] = sd; v++; }
      }
      for (let k = 0; k < segs; k++) {
        const a = base + k * 2;
        index.set([a, a + 1, a + 2, a + 1, a + 3, a + 2], ii);
        ii += 6;
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(n * 3), 3));
    geo.setAttribute("aSeed", new THREE.BufferAttribute(seed, 4));
    geo.setAttribute("aT", new THREE.BufferAttribute(along, 1));
    geo.setAttribute("aSide", new THREE.BufferAttribute(side, 1));
    geo.setIndex(new THREE.BufferAttribute(index, 1));

    this.material = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 }, uLevel: { value: 1 }, uWidth: { value: 0.009 }, uBase: { value: new THREE.Color("#ffa73c") }, uTip: { value: new THREE.Color("#ffe9b8") } },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      vertexShader: /* glsl */ `
        attribute vec4 aSeed; attribute float aT; attribute float aSide;
        uniform float uTime; uniform float uWidth;
        varying float vT; varying float vK;
        vec3 strand(float t, vec4 s) {
          float L = 1.5 + 1.15 * s.x;
          float g = pow(t, 1.2);
          float x = s.y * 1.5 * g + sin(uTime * 1.5 + t * 4.2 + s.w * 6.2831) * 0.27 * pow(t, 1.3);
          float y = s.z * 0.05 * (1.0 - t) + s.z * 0.75 * g + L * (0.10 * t - 0.40 * t * t) + sin(uTime * 1.9 + t * 3.6 + s.w * 5.0) * 0.2 * pow(t, 1.3);
          return vec3(x, y, -L * t);
        }
        void main() {
          vec3 p = strand(aT, aSeed);
          vec3 a = strand(max(aT - 0.015, 0.0), aSeed);
          vec3 b = strand(min(aT + 0.015, 1.0), aSeed);
          vec4 m = modelViewMatrix * vec4(p, 1.0);
          vec2 d = (modelViewMatrix * vec4(b, 1.0)).xy - (modelViewMatrix * vec4(a, 1.0)).xy;
          d = length(d) < 1e-5 ? vec2(1.0, 0.0) : normalize(d);
          m.xy += vec2(-d.y, d.x) * aSide * uWidth * (1.0 - 0.6 * aT);
          gl_Position = projectionMatrix * m;
          vT = aT;
          vK = fract(aSeed.w * 7.31 + aSeed.y * 3.7);
        }`,
      fragmentShader: /* glsl */ `
        uniform float uLevel; uniform vec3 uBase; uniform vec3 uTip;
        varying float vT; varying float vK;
        void main() {
          vec3 c = mix(uBase, uTip, smoothstep(0.05, 0.95, vT));
          float a = (0.04 + 0.07 * vK) * (0.35 + 0.65 * smoothstep(0.0, 0.18, vT)) * (1.0 - 0.85 * smoothstep(0.7, 1.0, vT));
          gl_FragColor = vec4(c * a * uLevel, 1.0);
        }`,
    });
    this.mesh = new THREE.Mesh(geo, this.material);
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = 8;
    this.mesh.name = "light-tail";
  }

  update(time: number, level: number) {
    this.material.uniforms.uTime.value = time;
    this.material.uniforms.uLevel.value = level;
  }
}
