import * as THREE from "three";
import { AERIAL, AERIAL_PARS } from "./aerial";

/**
 * Valley trees. They are seen from 200 m to several kilometres away, so each is a camera-facing impostor: a crown sprite drawn
 * once on a canvas (leaf clumps, each carrying its own sphere normal in RG and occlusion in B), lit in the shader by the same
 * low sun and sky as everything else, with a back-lit rim when the lens looks toward the sun. Placements come from Blender
 * (origins-layout.json: along the river and in clumps across the floor). One draw call.
 */
function crownSprite(size = 256) {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const g = c.getContext("2d")!;
  g.clearRect(0, 0, size, size);
  let s = 99;
  const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  // trunk
  g.fillStyle = "rgb(128,128,40)";
  g.fillRect(size * 0.47, size * 0.62, size * 0.06, size * 0.38);
  // clumps, back to front, bottom-up so the top ones overlap
  const clumps: [number, number, number][] = [];
  for (let i = 0; i < 46; i++) {
    const a = r() * Math.PI * 2;
    const rr = Math.sqrt(r());
    const cx = 0.5 + Math.cos(a) * rr * 0.34;
    const cy = 0.4 + Math.sin(a) * rr * 0.3;
    clumps.push([cx, cy, 0.07 + r() * 0.07]);
  }
  clumps.sort((a, b) => b[1] - a[1]);
  for (const [cx, cy, cr] of clumps) {
    const R = cr * size;
    const x0 = cx * size;
    const y0 = cy * size;
    const img = g.getImageData(Math.max(0, x0 - R) | 0, Math.max(0, y0 - R) | 0, Math.ceil(R * 2) + 1, Math.ceil(R * 2) + 1);
    const ox = Math.max(0, x0 - R) | 0;
    const oy = Math.max(0, y0 - R) | 0;
    for (let y = 0; y < img.height; y++) {
      for (let x = 0; x < img.width; x++) {
        const dx = (ox + x - x0) / R;
        const dy = (oy + y - y0) / R;
        const d2 = dx * dx + dy * dy;
        // ragged edge: leaf-scale noise on the radius
        const jag = 0.82 + 0.18 * Math.sin(Math.atan2(dy, dx) * 9 + cx * 40) * Math.sin(d2 * 30 + cy * 20);
        if (d2 > jag) continue;
        const nz = Math.sqrt(Math.max(0, 1 - d2));
        // crown-scale normal: blend the clump normal with the whole crown's sphere
        const gx = (ox + x) / size - 0.5;
        const gy = (oy + y) / size - 0.42;
        const nx = dx * 0.55 + gx * 1.4;
        const ny = -dy * 0.55 - gy * 1.6;
        const i = (y * img.width + x) * 4;
        img.data[i] = Math.round((Math.max(-1, Math.min(1, nx)) * 0.5 + 0.5) * 255);
        img.data[i + 1] = Math.round((Math.max(-1, Math.min(1, ny)) * 0.5 + 0.5) * 255);
        img.data[i + 2] = Math.round((0.45 + 0.55 * nz) * 255);
        img.data[i + 3] = 255;
      }
    }
    g.putImageData(img, ox, oy);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.NoColorSpace;
  t.generateMipmaps = true;
  t.minFilter = THREE.LinearMipmapLinearFilter;
  return t;
}

export class Trees {
  readonly mesh: THREE.InstancedMesh;
  private tex: THREE.Texture;
  constructor(list: number[][], sun: { dir: THREE.Vector3; color: THREE.Color; ambient: THREE.Color }, density: number) {
    this.tex = crownSprite();
    const geo = new THREE.PlaneGeometry(1, 1);
    geo.translate(0, 0.5, 0);
    const n = Math.max(1, Math.round(list.length * Math.max(0.35, density)));
    const tint = new Float32Array(n * 3);
    const vis = new Float32Array(n);
    const mat = new THREE.ShaderMaterial({
      uniforms: { ...AERIAL, tCrown: { value: this.tex }, uSunDir: { value: sun.dir }, uSunColor: { value: sun.color }, uAmbient: { value: sun.ambient } },
      alphaToCoverage: true,
      vertexShader: /* glsl */ `
        attribute vec3 aTint;
        attribute float aVis;
        varying float vVis;
        varying vec2 vUv; varying vec3 vW; varying vec3 vTint; varying vec3 vRight; varying vec3 vUp; varying vec3 vFwd;
        void main() {
          vec3 c = (modelMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
          vec3 sx = vec3(length(instanceMatrix[0].xyz), length(instanceMatrix[1].xyz), 0.0);
          vec3 toCam = cameraPosition - c; toCam.y = 0.0; toCam = normalize(toCam);
          vec3 right = normalize(cross(vec3(0.0, 1.0, 0.0), toCam));
          vec3 w = c + right * position.x * sx.x + vec3(0.0, 1.0, 0.0) * position.y * sx.y;
          vUv = uv; vW = w; vTint = aTint; vVis = aVis; vRight = right; vUp = vec3(0.0, 1.0, 0.0); vFwd = toCam;
          gl_Position = projectionMatrix * viewMatrix * vec4(w, 1.0);
        }`,
      fragmentShader: /* glsl */ `
        ${AERIAL_PARS}
        uniform sampler2D tCrown; uniform vec3 uSunDir; uniform vec3 uSunColor; uniform vec3 uAmbient;
        varying vec2 vUv; varying vec3 vW; varying vec3 vTint; varying vec3 vRight; varying vec3 vUp; varying vec3 vFwd; varying float vVis;
        void main() {
          vec4 s = texture2D(tCrown, vUv);
          if (s.a < 0.5) discard;
          bool trunk = s.b < 0.2;
          vec2 nn = s.rg * 2.0 - 1.0;
          vec3 n = normalize(vRight * nn.x + vUp * nn.y + vFwd * sqrt(max(0.05, 1.0 - dot(nn, nn))));
          vec3 L = normalize(uSunDir);
          float diff = max(dot(n, L), 0.0) * vVis;
          float ao = s.b;
          vec3 v = normalize(vW - cameraPosition);
          float back = pow(max(dot(v, L), 0.0), 4.0) * (1.0 - abs(nn.x)) * vVis;
          vec3 alb = trunk ? vec3(0.05, 0.035, 0.025) : vTint;
          vec3 col = alb * (uAmbient * (0.3 + 0.7 * ao) + uSunColor * diff * 0.75 * ao) + alb * uSunColor * back * 0.6;
          gl_FragColor = vec4(aerial(col, vW), 1.0);
        }`,
    });
    this.mesh = new THREE.InstancedMesh(geo, mat, n);
    const m4 = new THREE.Matrix4();
    const c = new THREE.Color();
    for (let i = 0; i < n; i++) {
      const [x, y, z, sc, kind, v] = list[i];
      vis[i] = v ?? 1;
      const h = (8 + kind * 1.6) * sc;
      m4.makeScale(h * (0.8 + 0.1 * kind), h, 1);
      m4.setPosition(x, y - 0.4, z);
      this.mesh.setMatrixAt(i, m4);
      c.setRGB(0.018 + 0.008 * kind, 0.042 + 0.008 * ((i * 7) % 5), 0.012 + 0.004 * (i % 3));
      tint.set([c.r, c.g, c.b], i * 3);
    }
    geo.setAttribute("aTint", new THREE.InstancedBufferAttribute(tint, 3));
    geo.setAttribute("aVis", new THREE.InstancedBufferAttribute(vis, 1));
    this.mesh.frustumCulled = false;
  }
  dispose() {
    this.mesh.geometry.dispose();
    (this.mesh.material as THREE.Material).dispose();
    this.tex.dispose();
  }
}
