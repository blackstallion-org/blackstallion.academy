import * as THREE from "three";
import { AERIAL, AERIAL_PARS } from "./aerial";

/**
 * Meadow grass on the vantage hill: instanced tufts of bent blades (two segments, three triangles each) with a wind shader (a travelling gust field plus a
 * per-blade flutter), root-to-tip colour, golden translucency when the lens looks toward the low sun, and the valley's aerial
 * haze. Two rings: a dense near ring round the horse (12 blades a tuft) and a sparser one out to the hill's shoulders
 * (7 blades). Counts scale with the quality tier's density.
 */
const VS = /* glsl */ `
attribute float aT;
attribute vec2 aRnd;
uniform float uTime;
uniform vec2 uWind;
uniform vec3 uCenter;
uniform float uRadius;
varying float vT;
varying vec3 vW;
varying float vR;
varying vec3 vNrm;
void main() {
  vec4 w = modelMatrix * instanceMatrix * vec4(position, 1.0);
  vec3 base = (modelMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
  // thin out toward the edge of the patch so there is no hard border
  float edge = 1.0 - smoothstep(uRadius * 0.75, uRadius, length(base.xz - uCenter.xz));
  // blades right against the lens fold away instead of filling the frame with slivers
  edge *= smoothstep(1.2, 3.5, length(base - cameraPosition));
  w.xyz = base + (w.xyz - base) * edge;
  float ph = dot(base.xz, vec2(0.21, 0.13)) - uTime * 1.6;
  float gust = 0.55 + 0.45 * sin(ph) * sin(ph * 0.43 + 1.7);
  float bend = (0.1 + 0.32 * gust) * aT * aT * (0.7 + 0.6 * aRnd.x) * edge;
  w.xz += uWind * bend * (w.y - base.y + 0.05) * 2.2;
  w.y -= bend * bend * 0.25;
  w.x += sin(uTime * 5.3 + aRnd.y * 40.0) * 0.012 * aT;
  w.z += cos(uTime * 4.7 + aRnd.x * 31.0) * 0.012 * aT;
  vT = aT;
  vW = w.xyz;
  vR = aRnd.x;
  vNrm = normalize(vec3(uWind.x * 0.4, 1.0, uWind.y * 0.4));
  gl_Position = projectionMatrix * viewMatrix * w;
}`;

const FS = /* glsl */ `
${AERIAL_PARS}
uniform vec3 uSunDir;
uniform vec3 uSunColor;
uniform vec3 uAmbient;
varying float vT;
varying vec3 vW;
varying float vR;
void main() {
  vec3 root = vec3(0.012, 0.02, 0.006);
  vec3 tip = mix(vec3(0.06, 0.115, 0.025), vec3(0.2, 0.17, 0.06), smoothstep(0.82, 1.0, vR)); // a few dry, golden blades
  vec3 albedo = mix(root, tip, pow(vT, 0.8));
  vec3 v = normalize(vW - cameraPosition);
  float back = pow(max(dot(v, normalize(uSunDir)), 0.0), 3.0);
  float occl = mix(0.25, 1.0, vT);
  vec3 col = albedo * (uAmbient * occl + uSunColor * (0.22 + 0.38 * vT) * occl) + albedo * uSunColor * back * vT * 2.0;
  col = aerial(col, vW);
  gl_FragColor = vec4(col, 1.0);
}`;

function tuftGeometry(blades: number, seed: number) {
  let s = seed;
  const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  const pos: number[] = [];
  const t: number[] = [];
  const idx: number[] = [];
  const rows = [0, 0.5];
  for (let b = 0; b < blades; b++) {
    const a = r() * Math.PI * 2;
    const rad = Math.sqrt(r()) * 0.26;
    const bx = Math.cos(a) * rad;
    const bz = Math.sin(a) * rad;
    const h = 0.13 + r() * r() * 0.36;
    const w = 0.014 + r() * 0.012;
    const yaw = r() * Math.PI;
    const lean = 0.1 + r() * 0.35;
    const lx = Math.cos(a) * lean;
    const lz = Math.sin(a) * lean;
    const px = Math.cos(yaw);
    const pz = Math.sin(yaw);
    const start = pos.length / 3;
    for (const row of rows) {
      const y = row * h;
      const off = row * row * h;
      const ww = w * (1 - row * 0.55);
      pos.push(bx + lx * off - px * ww, y, bz + lz * off - pz * ww);
      pos.push(bx + lx * off + px * ww, y, bz + lz * off + pz * ww);
      t.push(row, row);
    }
    pos.push(bx + lx * h, h, bz + lz * h);
    t.push(1);
    for (let k = 0; k < rows.length - 1; k++) {
      const a0 = start + k * 2;
      idx.push(a0, a0 + 1, a0 + 2, a0 + 1, a0 + 3, a0 + 2);
    }
    const last = start + (rows.length - 1) * 2;
    idx.push(last, last + 1, last + 2);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("aT", new THREE.Float32BufferAttribute(t, 1));
  g.setIndex(idx);
  return g;
}

export type HeightFn = (x: number, z: number) => number;
export type SlopeFn = (x: number, z: number) => number;

export class Grass {
  readonly group = new THREE.Group();
  readonly uniforms: Record<string, THREE.IUniform>;
  private meshes: THREE.InstancedMesh[] = [];
  private mat: THREE.ShaderMaterial;
  constructor(
    private height: HeightFn,
    private slope: SlopeFn,
    private avoid: (x: number, z: number) => boolean,
    sun: { dir: THREE.Vector3; color: THREE.Color; ambient: THREE.Color },
  ) {
    this.uniforms = {
      ...AERIAL,
      uTime: { value: 0 },
      uWind: { value: new THREE.Vector2(0.8, 0.6) },
      uCenter: { value: new THREE.Vector3() },
      uRadius: { value: 62 },
      uSunDir: { value: sun.dir },
      uSunColor: { value: sun.color },
      uAmbient: { value: sun.ambient },
    };
    this.mat = new THREE.ShaderMaterial({ vertexShader: VS, fragmentShader: FS, uniforms: this.uniforms, side: THREE.DoubleSide });
  }

  /** Builds (or rebuilds) both rings for a density 0..1. */
  build(density: number) {
    for (const m of this.meshes) { this.group.remove(m); m.geometry.dispose(); m.dispose(); }
    this.meshes = [];
    let s = 4242;
    const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    const rings: { r0: number; r1: number; n: number; blades: number }[] = [
      { r0: 0, r1: 15, n: Math.round(4200 * density), blades: 12 },
      { r0: 13, r1: 62, n: Math.round(5000 * density), blades: 7 },
    ];
    const m4 = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const up = new THREE.Vector3(0, 1, 0);
    const p = new THREE.Vector3();
    const sc = new THREE.Vector3();
    for (const ring of rings) {
      if (ring.n <= 0) continue;
      const geo = tuftGeometry(ring.blades, 17 + ring.blades);
      const rnd = new Float32Array(ring.n * 2);
      const mesh = new THREE.InstancedMesh(geo, this.mat, ring.n);
      let k = 0;
      let guard = 0;
      while (k < ring.n && guard++ < ring.n * 6) {
        // area-uniform in the ring
        const a = r() * Math.PI * 2;
        const rr = Math.sqrt(ring.r0 * ring.r0 + r() * (ring.r1 * ring.r1 - ring.r0 * ring.r0));
        const x = Math.cos(a) * rr;
        const z = Math.sin(a) * rr;
        if (this.slope(x, z) > 0.75 || this.avoid(x, z)) continue;
        // sparser and patchier further out
        if (rr > 20 && r() < 0.25 + 0.25 * Math.sin(x * 0.21) * Math.cos(z * 0.17)) continue;
        p.set(x, this.height(x, z) - 0.02, z);
        q.setFromAxisAngle(up, r() * Math.PI * 2);
        const size = 0.75 + r() * 0.5;
        sc.set(size, size * (0.8 + r() * 0.5), size);
        m4.compose(p, q, sc);
        mesh.setMatrixAt(k, m4);
        rnd[k * 2] = r();
        rnd[k * 2 + 1] = r();
        k++;
      }
      mesh.count = k;
      geo.setAttribute("aRnd", new THREE.InstancedBufferAttribute(rnd, 2));
      mesh.frustumCulled = false;
      mesh.castShadow = false;
      mesh.receiveShadow = false;
      this.meshes.push(mesh);
      this.group.add(mesh);
    }
  }

  update(time: number) {
    this.uniforms.uTime.value = time;
  }

  dispose() {
    for (const m of this.meshes) { m.geometry.dispose(); m.dispose(); }
    this.mat.dispose();
  }
}
