import * as THREE from "three";
import { clamp } from "./noise";

/* ------------------------------------------------------------------ dust: a pooled point cloud, emitted only at hoof impacts */
const DUST_VS = /* glsl */ `
attribute float aSize; attribute float aAlpha; attribute float aTone; attribute float aSeed;
uniform float uPx;
varying float vAlpha; varying float vTone; varying float vSeed;
void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = clamp(aSize * uPx / max(0.1, -mv.z), 0.0, 220.0);
  vAlpha = aAlpha; vTone = aTone; vSeed = aSeed;
}`;
const DUST_FS = /* glsl */ `
uniform vec3 uColor; uniform vec3 uLight;
varying float vAlpha; varying float vTone; varying float vSeed;
float h(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
void main() {
  vec2 c = gl_PointCoord - 0.5;
  float a = cos(vSeed * 6.283), s = sin(vSeed * 6.283);
  c = vec2(a * c.x - s * c.y, s * c.x + a * c.y);
  float d = length(c * vec2(1.0, 1.0 + 0.35 * sin(vSeed * 31.0))) * 2.0;
  float lump = 0.75 + 0.25 * h(floor((c + 0.5) * 6.0) + vSeed * 10.0);
  float alpha = smoothstep(1.0, 0.15, d) * lump * vAlpha;
  if (alpha < 0.004) discard;
  gl_FragColor = vec4(uColor * uLight * (0.82 + 0.36 * vTone), alpha);
}`;

export class DustSystem {
  readonly points: THREE.Points;
  private readonly cap: number;
  private active: number;
  private head = 0;
  private readonly pos: Float32Array;
  private readonly vel: Float32Array;
  private readonly life: Float32Array;
  private readonly age: Float32Array;
  private readonly size: Float32Array;
  private readonly size0: Float32Array;
  private readonly alpha: Float32Array;
  private readonly base: Float32Array;
  private readonly growth: Float32Array;
  private readonly geo: THREE.BufferGeometry;
  readonly uniforms: Record<string, THREE.IUniform>;

  constructor(capacity: number) {
    this.cap = capacity;
    this.active = capacity;
    this.pos = new Float32Array(capacity * 3);
    this.vel = new Float32Array(capacity * 3);
    this.life = new Float32Array(capacity).fill(0);
    this.age = new Float32Array(capacity).fill(1e9);
    this.size = new Float32Array(capacity);
    this.size0 = new Float32Array(capacity);
    this.alpha = new Float32Array(capacity);
    this.base = new Float32Array(capacity);
    this.growth = new Float32Array(capacity);
    const tone = new Float32Array(capacity);
    const seed = new Float32Array(capacity);
    for (let i = 0; i < capacity; i++) {
      tone[i] = Math.random();
      seed[i] = Math.random();
    }
    this.geo = new THREE.BufferGeometry();
    this.geo.setAttribute("position", new THREE.BufferAttribute(this.pos, 3).setUsage(THREE.DynamicDrawUsage));
    this.geo.setAttribute("aSize", new THREE.BufferAttribute(this.size, 1).setUsage(THREE.DynamicDrawUsage));
    this.geo.setAttribute("aAlpha", new THREE.BufferAttribute(this.alpha, 1).setUsage(THREE.DynamicDrawUsage));
    this.geo.setAttribute("aTone", new THREE.BufferAttribute(tone, 1));
    this.geo.setAttribute("aSeed", new THREE.BufferAttribute(seed, 1));
    this.uniforms = { uPx: { value: 600 }, uColor: { value: new THREE.Color("#cfae83") }, uLight: { value: new THREE.Color("#ffffff") } };
    const mat = new THREE.ShaderMaterial({ vertexShader: DUST_VS, fragmentShader: DUST_FS, uniforms: this.uniforms, transparent: true, depthWrite: false, fog: false });
    this.points = new THREE.Points(this.geo, mat);
    this.points.frustumCulled = false;
    this.points.renderOrder = 5;
    this.points.name = "dust";
  }

  /** Quality tiers cap how many pooled particles may be live. */
  setBudget(n: number) {
    this.active = Math.min(this.cap, Math.max(8, n));
    this.geo.setDrawRange(0, this.active);
  }

  setLook(color: THREE.ColorRepresentation, light: THREE.ColorRepresentation) {
    (this.uniforms.uColor.value as THREE.Color).set(color);
    (this.uniforms.uLight.value as THREE.Color).set(light);
  }

  emit(x: number, y: number, z: number, vx: number, vy: number, vz: number, size: number, life: number, alpha: number, growth = 1.6) {
    const i = this.head;
    this.head = (this.head + 1) % this.active;
    this.pos[i * 3] = x; this.pos[i * 3 + 1] = y; this.pos[i * 3 + 2] = z;
    this.vel[i * 3] = vx; this.vel[i * 3 + 1] = vy; this.vel[i * 3 + 2] = vz;
    this.life[i] = life; this.age[i] = 0; this.size0[i] = size; this.size[i] = size; this.base[i] = alpha; this.growth[i] = growth;
  }

  update(dt: number, wind: THREE.Vector3, viewportPx: number, fovDeg: number) {
    this.uniforms.uPx.value = viewportPx / (2 * Math.tan(THREE.MathUtils.degToRad(fovDeg) / 2));
    const drag = Math.exp(-1.7 * dt);
    for (let i = 0; i < this.active; i++) {
      if (this.age[i] >= this.life[i]) {
        if (this.alpha[i] !== 0) this.alpha[i] = 0;
        continue;
      }
      this.age[i] += dt;
      const t = this.age[i] / this.life[i];
      if (t >= 1) { this.alpha[i] = 0; continue; }
      const k = i * 3;
      this.vel[k] = this.vel[k] * drag + wind.x * dt * 0.6;
      this.vel[k + 1] = this.vel[k + 1] * drag - 0.35 * dt;
      this.vel[k + 2] = this.vel[k + 2] * drag + wind.z * dt * 0.6;
      this.pos[k] += this.vel[k] * dt; this.pos[k + 1] += this.vel[k + 1] * dt; this.pos[k + 2] += this.vel[k + 2] * dt;
      this.size[i] = this.size0[i] * (1 + this.growth[i] * t);
      this.alpha[i] = this.base[i] * Math.min(1, t * 9) * (1 - t) * (1 - t);
    }
    (this.geo.getAttribute("position") as THREE.BufferAttribute).needsUpdate = true;
    (this.geo.getAttribute("aSize") as THREE.BufferAttribute).needsUpdate = true;
    (this.geo.getAttribute("aAlpha") as THREE.BufferAttribute).needsUpdate = true;
  }

  clear() {
    this.age.fill(1e9);
    this.alpha.fill(0);
  }

  dispose() {
    this.geo.dispose();
    (this.points.material as THREE.Material).dispose();
  }
}

/* ------------------------------------------------------------------ hoof prints: a ring of fading decals laid on the terrain */
const PRINT_VS = /* glsl */ `
attribute float aBirth;
uniform float uNow; uniform float uLife;
varying vec2 vUv; varying float vA;
void main() {
  vUv = uv;
  float age = uNow - aBirth;
  vA = clamp(1.0 - age / uLife, 0.0, 1.0) * step(0.0, age);
  gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0);
}`;
const PRINT_FS = /* glsl */ `
uniform vec3 uTint; uniform float uStrength;
varying vec2 vUv; varying float vA;
void main() {
  vec2 p = (vUv - 0.5) * 2.0;
  p.y = -p.y;                                   // toe at +y
  float r = length(p * vec2(0.95, 0.88));
  float outer = smoothstep(1.0, 0.82, r);
  float inner = smoothstep(0.50, 0.66, r);
  float heelGap = smoothstep(-0.55, -0.15, p.y);   // open heel
  float dish = smoothstep(0.9, 0.2, r);
  float shoe = outer * mix(0.55, 1.0, inner) * mix(0.55, 1.0, heelGap);
  float a = (shoe * 0.55 + dish * 0.35) * vA * uStrength;
  if (a < 0.01) discard;
  gl_FragColor = vec4(uTint, a);
}`;

export class PrintSystem {
  readonly mesh: THREE.InstancedMesh;
  private readonly birth: Float32Array;
  private head = 0;
  private readonly cap: number;
  private active: number;
  readonly uniforms: Record<string, THREE.IUniform>;
  private readonly m = new THREE.Matrix4();
  private readonly q = new THREE.Quaternion();
  private readonly q2 = new THREE.Quaternion();
  private readonly s = new THREE.Vector3();
  private readonly up = new THREE.Vector3(0, 1, 0);

  constructor(capacity: number) {
    this.cap = capacity;
    this.active = capacity;
    const geo = new THREE.PlaneGeometry(0.22, 0.26);
    geo.rotateX(-Math.PI / 2);
    this.birth = new Float32Array(capacity).fill(-1e9);
    geo.setAttribute("aBirth", new THREE.InstancedBufferAttribute(this.birth, 1).setUsage(THREE.DynamicDrawUsage));
    this.uniforms = { uNow: { value: 0 }, uLife: { value: 14 }, uTint: { value: new THREE.Color("#4d3a28") }, uStrength: { value: 0.5 } };
    const mat = new THREE.ShaderMaterial({ vertexShader: PRINT_VS, fragmentShader: PRINT_FS, uniforms: this.uniforms, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2, fog: false });
    this.mesh = new THREE.InstancedMesh(geo, mat, capacity);
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = 2;
    this.mesh.name = "hoof-prints";
    const hide = new THREE.Matrix4().makeScale(0, 0, 0);
    for (let i = 0; i < capacity; i++) this.mesh.setMatrixAt(i, hide);
  }

  setBudget(n: number) {
    this.active = clamp(Math.floor(n), 4, this.cap);
    this.mesh.count = this.active;
  }

  setLook(tint: THREE.ColorRepresentation, strength: number, life: number) {
    (this.uniforms.uTint.value as THREE.Color).set(tint);
    this.uniforms.uStrength.value = strength;
    this.uniforms.uLife.value = life;
  }

  place(x: number, y: number, z: number, heading: number, normal: THREE.Vector3, now: number, scale = 1) {
    const i = this.head;
    this.head = (this.head + 1) % this.active;
    this.q.setFromUnitVectors(this.up, normal);
    this.q2.setFromAxisAngle(this.up, heading);
    this.q.multiply(this.q2);
    this.s.set(scale, 1, scale);
    this.m.compose(new THREE.Vector3(x, y + 0.006, z), this.q, this.s);
    this.mesh.setMatrixAt(i, this.m);
    this.mesh.instanceMatrix.needsUpdate = true;
    this.birth[i] = now;
    (this.mesh.geometry.getAttribute("aBirth") as THREE.InstancedBufferAttribute).needsUpdate = true;
  }

  update(now: number) {
    this.uniforms.uNow.value = now;
  }

  clear() {
    this.birth.fill(-1e9);
    (this.mesh.geometry.getAttribute("aBirth") as THREE.InstancedBufferAttribute).needsUpdate = true;
  }

  dispose() {
    this.mesh.geometry.dispose();
    (this.mesh.material as THREE.Material).dispose();
    this.mesh.dispose();
  }
}
