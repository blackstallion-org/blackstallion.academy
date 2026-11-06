import * as THREE from "three";

/**
 * World 03 ground: the height field authored in Python/Blender (tools/blender/12_worlds/legacy/legacy_field.py) and shipped as a
 * 16-bit height map packed into a PNG (R = high byte, G = low byte, B = rock mask). The mesh is built here on a non-uniform grid,
 * dense where the camera flies (the flats, the cavalry track, the hero) and on the ridge, coarse toward the distant hills.
 * The ground shader blends CC0 sand (planar) and layered rock (tri-planar) by the rock mask and the slope, with a large-scale
 * variation so the tiling never reads.
 */
export type HeightMeta = { x0: number; x1: number; z0: number; z1: number; n: number; hoff: number; hscale: number };

export class Heightfield {
  private h!: Float32Array;
  private rock!: Uint8Array;
  constructor(readonly meta: HeightMeta) {}

  async load(url: string) {
    const blob = await (await fetch(url)).blob();
    const bmp = await createImageBitmap(blob, { premultiplyAlpha: "none", colorSpaceConversion: "none" });
    const n = this.meta.n;
    const canvas: OffscreenCanvas | HTMLCanvasElement = typeof OffscreenCanvas !== "undefined" ? new OffscreenCanvas(n, n) : Object.assign(document.createElement("canvas"), { width: n, height: n });
    const g = canvas.getContext("2d", { willReadFrequently: true }) as CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;
    g.drawImage(bmp, 0, 0);
    bmp.close();
    const px = g.getImageData(0, 0, n, n).data;
    this.h = new Float32Array(n * n);
    this.rock = new Uint8Array(n * n);
    for (let i = 0; i < n * n; i++) {
      this.h[i] = (px[i * 4] * 256 + px[i * 4 + 1]) / this.meta.hscale - this.meta.hoff;
      this.rock[i] = px[i * 4 + 2];
    }
  }

  private sample(arr: Float32Array | Uint8Array, x: number, z: number) {
    const m = this.meta;
    const fx = THREE.MathUtils.clamp(((x - m.x0) / (m.x1 - m.x0)) * (m.n - 1), 0, m.n - 1.001);
    const fz = THREE.MathUtils.clamp(((z - m.z0) / (m.z1 - m.z0)) * (m.n - 1), 0, m.n - 1.001);
    const ix = Math.floor(fx);
    const iz = Math.floor(fz);
    const tx = fx - ix;
    const tz = fz - iz;
    const i = iz * m.n + ix;
    const a = arr[i] + (arr[i + 1] - arr[i]) * tx;
    const b = arr[i + m.n] + (arr[i + m.n + 1] - arr[i + m.n]) * tx;
    return a + (b - a) * tz;
  }
  height = (x: number, z: number) => this.sample(this.h, x, z);
  rockAt = (x: number, z: number) => this.sample(this.rock, x, z) / 255;
}

/** Breakpoints [from, to, step] -> sorted coordinates. */
function axis(spans: [number, number, number][], k: number) {
  const out: number[] = [];
  for (const [a, b, s] of spans) {
    const step = s * k;
    for (let v = a; v < b - 1e-6; v += step) out.push(v);
  }
  out.push(spans[spans.length - 1][1]);
  return out;
}

const hash = (x: number, z: number) => {
  const s = Math.sin(x * 127.1 + z * 311.7) * 43758.5453;
  return s - Math.floor(s);
};
function vnoise(x: number, z: number) {
  const ix = Math.floor(x), iz = Math.floor(z);
  const fx = x - ix, fz = z - iz;
  const ux = fx * fx * (3 - 2 * fx), uz = fz * fz * (3 - 2 * fz);
  const a = hash(ix, iz), b = hash(ix + 1, iz), c = hash(ix, iz + 1), d = hash(ix + 1, iz + 1);
  return (a * (1 - ux) + b * ux) * (1 - uz) + (c * (1 - ux) + d * ux) * uz;
}

export function buildTerrainGeometry(hf: Heightfield, coarse: number) {
  const xs = axis([[-2600, -1200, 60], [-1200, -650, 16], [-650, -120, 8], [-120, 120, 4], [120, 400, 8], [400, 1200, 18], [1200, 2600, 60]], coarse);
  const zs = axis([[-2300, -700, 60], [-700, -320, 14], [-320, 80, 4], [80, 560, 12], [560, 950, 7], [950, 1600, 20], [1600, 2900, 60]], coarse);
  const nx = xs.length, nz = zs.length;
  const pos = new Float32Array(nx * nz * 3);
  const col = new Float32Array(nx * nz * 3);
  for (let j = 0; j < nz; j++) {
    for (let i = 0; i < nx; i++) {
      const x = xs[i], z = zs[j];
      const k = (j * nx + i) * 3;
      pos[k] = x;
      pos[k + 1] = hf.height(x, z);
      pos[k + 2] = z;
      col[k] = hf.rockAt(x, z);
      col[k + 1] = vnoise(x / 260, z / 260) * 0.5 + vnoise(x / 61, z / 61) * 0.3 + vnoise(x / 17, z / 17) * 0.2; // macro variation
      col[k + 2] = 1;
    }
  }
  const idx = new Uint32Array((nx - 1) * (nz - 1) * 6);
  let t = 0;
  for (let j = 0; j < nz - 1; j++) {
    for (let i = 0; i < nx - 1; i++) {
      const a = j * nx + i, b = a + 1, c = a + nx, d = c + 1;
      idx[t++] = a; idx[t++] = c; idx[t++] = b;
      idx[t++] = b; idx[t++] = c; idx[t++] = d;
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  g.setAttribute("color", new THREE.BufferAttribute(col, 3));
  g.setIndex(new THREE.BufferAttribute(idx, 1));
  g.computeVertexNormals();
  g.computeBoundingSphere();
  return g;
}

/** The ground material: MeshStandardMaterial with the sand/rock blend and world-space normal mapping patched in. */
export function terrainMaterial(tex: { sand: THREE.Texture; sandN: THREE.Texture; rock: THREE.Texture; rockN: THREE.Texture }) {
  const m = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.94, metalness: 0, vertexColors: false });
  const uniforms = {
    tSand: { value: tex.sand }, tSandN: { value: tex.sandN }, tRock: { value: tex.rock }, tRockN: { value: tex.rockN },
    uSandTint: { value: new THREE.Color(1.45, 1.05, 0.72) },
    uRockTint: { value: new THREE.Color(1.04, 0.96, 0.9) },
  };
  m.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nattribute vec3 color;\nvarying vec3 vTW;\nvarying vec3 vTN;\nvarying vec3 vTC;")
      .replace("#include <begin_vertex>", "#include <begin_vertex>\nvTW = (modelMatrix * vec4(position, 1.0)).xyz;\nvTN = normalize(mat3(modelMatrix) * normal);\nvTC = color;");
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        `#include <common>
        uniform sampler2D tSand; uniform sampler2D tSandN; uniform sampler2D tRock; uniform sampler2D tRockN;
        uniform vec3 uSandTint; uniform vec3 uRockTint;
        varying vec3 vTW; varying vec3 vTN; varying vec3 vTC;
        float tRockW; vec3 tWN;`,
      )
      .replace(
        "#include <map_fragment>",
        `{
          vec3 n = normalize(vTN);
          float dist = length(vTW - cameraPosition);
          // sand: two scales to break the repeat, faded to the large one with distance
          vec2 uvA = vTW.xz / 4.0;
          vec2 uvB = vTW.xz / 41.0 + 0.37;
          vec3 sA = texture2D(tSand, uvA).rgb;
          vec3 sB = texture2D(tSand, uvB).rgb;
          vec3 sand = mix(sA, sB, 0.35 + 0.45 * smoothstep(40.0, 260.0, dist));
          float macro = vTC.g;
          sand *= uSandTint * mix(0.9, 1.07, macro);
          // rock: tri-planar, layered sandstone face
          vec3 w = pow(abs(n), vec3(4.0)); w /= (w.x + w.y + w.z);
          float rs = 18.0;
          vec3 rk = texture2D(tRock, vTW.zy / rs).rgb * w.x + texture2D(tRock, vTW.xz / rs).rgb * w.y + texture2D(tRock, vTW.xy / rs).rgb * w.z;
          // keep the rock's detail but give it the sand's hue, so a rock face reads as weathered sandstone, not a dark patch
          float rl = dot(rk, vec3(0.2126, 0.7152, 0.0722));
          float sl = max(dot(sand, vec3(0.2126, 0.7152, 0.0722)), 1e-3);
          rk = sand / sl * rl * 1.55 * uRockTint * mix(0.92, 1.05, macro);
          float slope = 1.0 - n.y;
          tRockW = clamp(max(vTC.r, smoothstep(0.22, 0.5, slope)), 0.0, 1.0);
          // sand settles on the gentler parts of the rock
          tRockW *= mix(1.0, 0.45, smoothstep(0.35, 0.05, slope) * (1.0 - vTC.r * 0.5));
          diffuseColor.rgb *= mix(sand, rk, tRockW);
          tWN = n;
        }`,
      )
      .replace(
        "#include <normal_fragment_maps>",
        `{
          vec3 n = tWN;
          vec3 ns = texture2D(tSandN, vTW.xz / 4.0).xyz * 2.0 - 1.0;
          vec3 w = pow(abs(n), vec3(4.0)); w /= (w.x + w.y + w.z);
          float rs = 18.0;
          vec3 nr = (texture2D(tRockN, vTW.xz / rs).xyz * 2.0 - 1.0);
          vec3 nrx = (texture2D(tRockN, vTW.zy / rs).xyz * 2.0 - 1.0);
          vec3 nrz = (texture2D(tRockN, vTW.xy / rs).xyz * 2.0 - 1.0);
          vec3 T = normalize(vec3(1.0, 0.0, 0.0) - n * n.x);
          vec3 Bt = normalize(vec3(0.0, 0.0, 1.0) - n * n.z);
          float dist = length(vTW - cameraPosition);
          float near = 1.0 - smoothstep(60.0, 400.0, dist);
          vec3 pS = normalize(n + (T * ns.x + Bt * -ns.y) * 0.9 * near);
          // rock: world-space perturbation from the three projections (x: zy, y: xz, z: xy)
          vec3 pR = normalize(n + (vec3(0.0, nrx.y, nrx.x) * w.x + vec3(nr.x, 0.0, -nr.y) * w.y + vec3(nrz.x, nrz.y, 0.0) * w.z) * 0.8);
          vec3 wn = normalize(mix(pS, pR, tRockW));
          normal = normalize((viewMatrix * vec4(wn, 0.0)).xyz);
        }`,
      );
  };
  m.customProgramCacheKey = () => "legacy-terrain";
  return m;
}
