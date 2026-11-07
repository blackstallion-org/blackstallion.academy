import * as THREE from "three";

/**
 * Wings of light for the horse of light: two wings of golden feathers (coverts, secondaries and long primaries) that unfold from the
 * withers as the horse leaves the ground and beat slowly while it flies. Each feather is a thin camera-facing ribbon with a bright
 * shaft; everything is placed in the vertex shader (one draw call, nothing per frame on the CPU but four uniforms).
 * Horse frame: +Z forward, +Y up, X to the side. The mesh sits at the withers.
 */
export class LightWings {
  readonly mesh: THREE.Mesh;
  private readonly material: THREE.ShaderMaterial;

  constructor(perRow = 34, segs = 10) {
    const rows = 3;
    const strands = perRow * rows * 2;
    const n = strands * (segs + 1) * 2;
    const fea = new Float32Array(n * 4);
    const along = new Float32Array(n);
    const side = new Float32Array(n);
    const index = new Uint32Array(strands * segs * 6);
    let s = 7110;
    const rnd = () => (s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296;
    let v = 0;
    let ii = 0;
    for (const wing of [-1, 1]) {
      for (let row = 0; row < rows; row++) {
        for (let i = 0; i < perRow; i++) {
          const f = [(i + 0.5 * row / rows + rnd() * 0.3) / perRow, row, wing, rnd()];
          const base = v;
          for (let k = 0; k <= segs; k++) {
            for (const sd of [-1, 1]) { fea.set(f, v * 4); along[v] = k / segs; side[v] = sd; v++; }
          }
          for (let k = 0; k < segs; k++) {
            const a = base + k * 2;
            index.set([a, a + 1, a + 2, a + 1, a + 3, a + 2], ii);
            ii += 6;
          }
        }
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(n * 3), 3));
    geo.setAttribute("aF", new THREE.BufferAttribute(fea, 4));
    geo.setAttribute("aT", new THREE.BufferAttribute(along, 1));
    geo.setAttribute("aSide", new THREE.BufferAttribute(side, 1));
    geo.setIndex(new THREE.BufferAttribute(index, 1));

    this.material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 }, uLevel: { value: 0 }, uOpen: { value: 0 }, uBeat: { value: 0 },
        uBase: { value: new THREE.Color("#ff9a2a") }, uTip: { value: new THREE.Color("#ffe2a0") },
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      vertexShader: /* glsl */ `
        attribute vec4 aF; attribute float aT; attribute float aSide;
        uniform float uTime; uniform float uOpen; uniform float uBeat;
        varying float vT; varying float vS; varying float vRow;
        vec3 feather(float t, vec4 f) {
          float s = f.x; float row = f.y; float r = f.w;
          // the leading edge, laid out flat along +X, swept forward a little in the middle
          vec3 e = vec3(1.3 * uOpen * s, 0.04 * sin(3.1416 * s), 0.2 * s - 0.55 * s * s);
          // the feather points back and fans outward toward the wing tip; primaries (row 2) are long at the tip
          float L = (0.24 + 0.06 * r) + row * (0.17 + 0.12 * s) + row * row * 0.2 * pow(s, 1.3);
          L *= 0.35 + 0.65 * uOpen;
          vec3 dir = normalize(vec3(0.15 + 2.0 * s * s, -0.1 * (1.0 - s), -1.0));
          vec3 p = e + dir * L * t - vec3(0.0, 0.05 * t * t * L, 0.0) - vec3(0.0, 0.0, row * 0.035);
          // raise and beat: rotate about the body's long axis, the wave running out to the tip
          float a = mix(-0.25, 1.28 + uBeat * 0.4 * sin(uTime * 2.4 - s * 1.4), uOpen);
          float c = cos(a); float sn = sin(a);
          p = vec3(p.x * c - p.y * sn, p.x * sn + p.y * c, p.z);
          p.x *= f.z;
          // sweep the tips back a little, each wing to its own side, so the two never sit exactly on top of each other on screen
          float y = 0.2 * f.z; float cy = cos(y); float sy = sin(y);
          p = vec3(p.x * cy + p.z * sy, p.y, -p.x * sy + p.z * cy);
          return p;
        }
        void main() {
          vec3 p = feather(aT, aF);
          vec3 a = feather(max(aT - 0.05, 0.0), aF);
          vec3 b = feather(min(aT + 0.05, 1.0), aF);
          vec4 m = modelViewMatrix * vec4(p, 1.0);
          vec2 d = (modelViewMatrix * vec4(b, 1.0)).xy - (modelViewMatrix * vec4(a, 1.0)).xy;
          d = length(d) < 1e-5 ? vec2(1.0, 0.0) : normalize(d);
          float w = (0.04 + 0.016 * aF.y) * (1.0 - 0.75 * aT * aT) * (0.3 + 0.7 * uOpen);
          m.xy += vec2(-d.y, d.x) * aSide * w;
          gl_Position = projectionMatrix * m;
          vT = aT; vS = aSide; vRow = aF.y;
        }`,
      fragmentShader: /* glsl */ `
        uniform float uLevel; uniform vec3 uBase; uniform vec3 uTip;
        varying float vT; varying float vS; varying float vRow;
        void main() {
          float shaft = exp(-vS * vS * 30.0);
          float vane = 0.35 + 0.65 * (1.0 - vS * vS);
          vec3 c = mix(uBase, uTip, smoothstep(0.0, 1.0, vT) * 0.7 + shaft * 0.3);
          float a = (0.065 * vane + 0.14 * shaft) * (1.0 - 0.8 * smoothstep(0.65, 1.0, vT)) * (0.7 + 0.15 * vRow) * (0.3 + 0.7 * smoothstep(0.0, 0.3, vT));
          gl_FragColor = vec4(c * a * uLevel, 1.0);
        }`,
    });
    this.mesh = new THREE.Mesh(geo, this.material);
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = 8;
    this.mesh.name = "light-wings";
  }

  /** open: 0 folded away .. 1 spread; beat: 0 still .. 1 full wing-beats */
  update(time: number, level: number, open: number, beat: number) {
    const u = this.material.uniforms;
    u.uTime.value = time;
    u.uLevel.value = level;
    u.uOpen.value = open;
    u.uBeat.value = beat;
    this.mesh.visible = level > 0.001 && open > 0.001;
  }
}
