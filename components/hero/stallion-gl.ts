/**
 * Minimal WebGL2 renderer for the hero stallion (no three.js; the project has no 3D dependency).
 * Loads a GLB with POSITION/NORMAL/indices primitives and node translations, and draws it with:
 *  - Lambert + Blinn specular + fresnel rim so a black (Kala) coat still reads against obsidian,
 *  - procedural ribcage breathing (vertices pushed along their normals inside the barrel),
 *  - a head/neck "gaze" rotation about the poll, weighted by distance along the neck,
 *  - time-of-day light colour and direction, and a soft blob shadow on the floor.
 * Model space is glTF: +Y up, the horse faces +Z.
 */

export type GazeTarget = { yaw: number; pitch: number };

type Prim = { vao: WebGLVertexArrayObject; count: number; type: number; offset: [number, number, number]; color: [number, number, number]; isEye: boolean };

const VS = `#version 300 es
in vec3 aPos; in vec3 aNor;
uniform mat4 uProj, uView; uniform vec3 uOffset;
uniform float uBreath; uniform vec2 uGaze; uniform float uEye;
out vec3 vN; out vec3 vW;
const vec3 PIVOT = vec3(0.0, 1.62, 0.70);   // base of the poll / top of the neck
const vec3 BARREL = vec3(0.0, 1.07, -0.10); // ribcage centre
mat3 rotY(float a){ float c=cos(a), s=sin(a); return mat3(c,0.,-s, 0.,1.,0., s,0.,c); }
mat3 rotX(float a){ float c=cos(a), s=sin(a); return mat3(1.,0.,0., 0.,c,s, 0.,-s,c); }
void main(){
  vec3 p = aPos + uOffset; vec3 n = aNor;
  // breathing: a gentle swell across the ribcage only
  float d = length((p - BARREL) * vec3(1.0, 1.15, 0.9));
  float wb = (1.0 - smoothstep(0.28, 0.62, d)) * step(p.y, 1.45);
  p += n * uBreath * wb;
  // gaze: rotate the head and upper neck about the poll, more toward the muzzle
  float wg = max(uEye, smoothstep(0.62, 1.25, p.z) * smoothstep(1.25, 1.6, p.y));
  mat3 R = rotY(uGaze.x * wg) * rotX(-uGaze.y * wg);
  p = PIVOT + R * (p - PIVOT); n = R * n;
  vN = n; vW = p;
  gl_Position = uProj * uView * vec4(p, 1.0);
}`;

const FS = `#version 300 es
precision highp float;
in vec3 vN; in vec3 vW; out vec4 o;
uniform vec3 uCam, uKeyDir, uKeyCol, uRimCol, uFillCol, uBase; uniform float uRough;
void main(){
  vec3 N = normalize(vN); if(!gl_FrontFacing) N = -N;
  vec3 V = normalize(uCam - vW); vec3 L = normalize(-uKeyDir);
  float diff = max(dot(N, L), 0.0);
  vec3 H = normalize(L + V); float spec = pow(max(dot(N, H), 0.0), mix(90.0, 18.0, uRough)) * (1.0 - uRough) * 1.6;
  float rim = pow(1.0 - max(dot(N, V), 0.0), 2.6);
  float back = max(dot(N, normalize(vec3(0.4, 0.5, -1.0))), 0.0);
  vec3 c = uBase * (0.25 + diff * 2.2) * uKeyCol + uKeyCol * spec * 0.55 + uRimCol * rim * 0.32 + uFillCol * back * 0.05;
  c = c / (c + vec3(0.9));            // soft tone map
  c = pow(c, vec3(1.0/2.2));
  o = vec4(c, 1.0);
}`;

const SHADOW_VS = `#version 300 es
in vec2 aP; uniform mat4 uProj, uView; uniform vec2 uShift; out vec2 vP;
void main(){ vP = aP; gl_Position = uProj * uView * vec4(aP.x * 1.1 + uShift.x, 0.0, aP.y * 2.0 + uShift.y, 1.0); }`;
const SHADOW_FS = `#version 300 es
precision mediump float; in vec2 vP; out vec4 o; uniform float uK;
void main(){ float r = length(vP); float a = (1.0 - smoothstep(0.15, 1.0, r)) * 0.62 * uK; o = vec4(0.0, 0.0, 0.0, a); }`;

function compile(gl: WebGL2RenderingContext, vs: string, fs: string) {
  const p = gl.createProgram()!;
  for (const [type, src] of [[gl.VERTEX_SHADER, vs], [gl.FRAGMENT_SHADER, fs]] as const) {
    const s = gl.createShader(type)!;
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) ?? "shader");
    gl.attachShader(p, s);
  }
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p) ?? "link");
  return p;
}

/* ---------------------------------------------------------------- math */
export type M4 = Float32Array;
export function perspective(fovy: number, aspect: number, near: number, far: number): M4 {
  const f = 1 / Math.tan(fovy / 2), nf = 1 / (near - far);
  return new Float32Array([f / aspect, 0, 0, 0, 0, f, 0, 0, 0, 0, (far + near) * nf, -1, 0, 0, 2 * far * near * nf, 0]);
}
export function lookAt(e: number[], c: number[], up = [0, 1, 0]): M4 {
  let zx = e[0] - c[0], zy = e[1] - c[1], zz = e[2] - c[2];
  let l = Math.hypot(zx, zy, zz); zx /= l; zy /= l; zz /= l;
  let xx = up[1] * zz - up[2] * zy, xy = up[2] * zx - up[0] * zz, xz = up[0] * zy - up[1] * zx;
  l = Math.hypot(xx, xy, xz); xx /= l; xy /= l; xz /= l;
  const yx = zy * xz - zz * xy, yy = zz * xx - zx * xz, yz = zx * xy - zy * xx;
  return new Float32Array([xx, yx, zx, 0, xy, yy, zy, 0, xz, yz, zz, 0,
    -(xx * e[0] + xy * e[1] + xz * e[2]), -(yx * e[0] + yy * e[1] + yz * e[2]), -(zx * e[0] + zy * e[1] + zz * e[2]), 1]);
}

/* ---------------------------------------------------------------- time of day */
export type Daylight = { key: [number, number, number]; rim: [number, number, number]; fill: [number, number, number]; dir: [number, number, number]; name: string };
const mix3 = (a: number[], b: number[], t: number) => a.map((v, i) => v + (b[i] - v) * t) as [number, number, number];
/** Light by local hour: copper dawn, pale gold day, burnished dusk, low silver night. */
export function daylight(hour: number): Daylight {
  const stops: { h: number; key: number[]; rim: number[]; fill: number[]; elev: number; name: string }[] = [
    { h: 0, key: [0.35, 0.38, 0.48], rim: [0.45, 0.52, 0.66], fill: [0.2, 0.24, 0.34], elev: 0.6, name: "night" },
    { h: 6, key: [1.0, 0.55, 0.3], rim: [0.95, 0.6, 0.35], fill: [0.35, 0.3, 0.32], elev: 0.25, name: "dawn" },
    { h: 12, key: [1.05, 0.95, 0.82], rim: [0.85, 0.7, 0.4], fill: [0.4, 0.42, 0.48], elev: 1.0, name: "day" },
    { h: 18, key: [1.0, 0.62, 0.28], rim: [0.83, 0.69, 0.22], fill: [0.3, 0.22, 0.2], elev: 0.2, name: "dusk" },
    { h: 24, key: [0.35, 0.38, 0.48], rim: [0.45, 0.52, 0.66], fill: [0.2, 0.24, 0.34], elev: 0.6, name: "night" },
  ];
  const i = Math.max(0, stops.findIndex((s) => s.h > hour) - 1);
  const a = stops[i], b = stops[i + 1];
  const t = (hour - a.h) / (b.h - a.h);
  const az = ((hour / 24) * Math.PI * 2) - Math.PI / 2; // sun travels around the horse through the day
  const elev = a.elev + (b.elev - a.elev) * t;
  const dir: [number, number, number] = [-Math.cos(az) * 0.8, -Math.max(0.35, elev), -0.55];
  return { key: mix3(a.key, b.key, t), rim: mix3(a.rim, b.rim, t), fill: mix3(a.fill, b.fill, t), dir, name: t < 0.5 ? a.name : b.name };
}

/* ---------------------------------------------------------------- GLB */
export async function loadGlb(url: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`model ${res.status}`);
  const buf = await res.arrayBuffer();
  const dv = new DataView(buf);
  if (dv.getUint32(0, true) !== 0x46546c67) throw new Error("not a GLB");
  const jsonLen = dv.getUint32(12, true);
  const json = JSON.parse(new TextDecoder().decode(new Uint8Array(buf, 20, jsonLen)));
  const binStart = 20 + jsonLen + 8;
  return { json, bin: buf.slice(binStart) };
}

export class StallionRenderer {
  gl: WebGL2RenderingContext;
  prog: WebGLProgram; shadowProg: WebGLProgram; shadowVao: WebGLVertexArrayObject;
  prims: Prim[] = [];
  loc: Record<string, WebGLUniformLocation | null> = {};

  constructor(canvas: HTMLCanvasElement) {
    const gl = canvas.getContext("webgl2", { antialias: true, alpha: true, premultipliedAlpha: true, powerPreference: "low-power" });
    if (!gl) throw new Error("webgl2 unavailable");
    this.gl = gl;
    this.prog = compile(gl, VS, FS);
    this.shadowProg = compile(gl, SHADOW_VS, SHADOW_FS);
    for (const n of ["uProj", "uView", "uOffset", "uBreath", "uGaze", "uEye", "uCam", "uKeyDir", "uKeyCol", "uRimCol", "uFillCol", "uBase", "uRough"]) this.loc[n] = gl.getUniformLocation(this.prog, n);
    this.shadowVao = gl.createVertexArray()!;
    gl.bindVertexArray(this.shadowVao);
    const b = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, b);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const a = gl.getAttribLocation(this.shadowProg, "aP");
    gl.enableVertexAttribArray(a);
    gl.vertexAttribPointer(a, 2, gl.FLOAT, false, 0, 0);
    gl.bindVertexArray(null);
  }

  upload(glb: { json: any; bin: ArrayBuffer }) { // eslint-disable-line @typescript-eslint/no-explicit-any
    const { gl } = this;
    const { json, bin } = glb;
    const view = (acc: number) => {
      const a = json.accessors[acc];
      const bv = json.bufferViews[a.bufferView];
      const off = (bv.byteOffset ?? 0) + (a.byteOffset ?? 0);
      const comps = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4 }[a.type as string] ?? 1;
      if (a.componentType === 5126) return new Float32Array(bin, off, a.count * comps);
      if (a.componentType === 5123) return new Uint16Array(bin, off, a.count);
      return new Uint32Array(bin, off, a.count);
    };
    const aPos = gl.getAttribLocation(this.prog, "aPos");
    const aNor = gl.getAttribLocation(this.prog, "aNor");
    for (const node of json.nodes) {
      if (node.mesh === undefined) continue;
      const mesh = json.meshes[node.mesh];
      for (const p of mesh.primitives) {
        const vao = gl.createVertexArray()!;
        gl.bindVertexArray(vao);
        for (const [attr, loc] of [["POSITION", aPos], ["NORMAL", aNor]] as const) {
          const b = gl.createBuffer();
          gl.bindBuffer(gl.ARRAY_BUFFER, b);
          gl.bufferData(gl.ARRAY_BUFFER, view(p.attributes[attr]), gl.STATIC_DRAW);
          gl.enableVertexAttribArray(loc);
          gl.vertexAttribPointer(loc, 3, gl.FLOAT, false, 0, 0);
        }
        const idx = view(p.indices);
        const ib = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ib);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, idx, gl.STATIC_DRAW);
        gl.bindVertexArray(null);
        const isEye = /eye/i.test(node.name ?? "");
        const base = json.materials?.[p.material]?.pbrMetallicRoughness?.baseColorFactor ?? [0.02, 0.02, 0.02, 1];
        this.prims.push({
          vao, count: idx.length, type: idx instanceof Uint16Array ? gl.UNSIGNED_SHORT : gl.UNSIGNED_INT,
          offset: (node.translation ?? [0, 0, 0]) as [number, number, number],
          color: isEye ? [0.004, 0.003, 0.003] : [base[0] * 1.6 + 0.01, base[1] * 1.6 + 0.009, base[2] * 1.6 + 0.008],
          isEye,
        });
      }
    }
  }

  draw(o: { proj: M4; view: M4; cam: number[]; breath: number; gaze: GazeTarget; light: Daylight }) {
    const { gl, loc } = this;
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    // blob shadow, pushed away from the key light
    gl.disable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.useProgram(this.shadowProg);
    gl.uniformMatrix4fv(gl.getUniformLocation(this.shadowProg, "uProj"), false, o.proj);
    gl.uniformMatrix4fv(gl.getUniformLocation(this.shadowProg, "uView"), false, o.view);
    gl.uniform2f(gl.getUniformLocation(this.shadowProg, "uShift"), o.light.dir[0] * 0.35, 0.1 + o.light.dir[2] * 0.2);
    gl.uniform1f(gl.getUniformLocation(this.shadowProg, "uK"), Math.min(1, 0.55 + -o.light.dir[1] * 0.4));
    gl.bindVertexArray(this.shadowVao);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    gl.disable(gl.BLEND);
    // horse
    gl.enable(gl.DEPTH_TEST);
    gl.useProgram(this.prog);
    gl.uniformMatrix4fv(loc.uProj, false, o.proj);
    gl.uniformMatrix4fv(loc.uView, false, o.view);
    gl.uniform3fv(loc.uCam, o.cam);
    gl.uniform1f(loc.uBreath, o.breath);
    gl.uniform2f(loc.uGaze, o.gaze.yaw, o.gaze.pitch);
    gl.uniform3fv(loc.uKeyDir, o.light.dir);
    gl.uniform3fv(loc.uKeyCol, o.light.key);
    gl.uniform3fv(loc.uRimCol, o.light.rim);
    gl.uniform3fv(loc.uFillCol, o.light.fill);
    for (const p of this.prims) {
      gl.uniform3fv(loc.uOffset, p.offset);
      gl.uniform3fv(loc.uBase, p.color);
      gl.uniform1f(loc.uRough, p.isEye ? 0.05 : 0.34);
      gl.uniform1f(loc.uEye, p.isEye ? 1 : 0);
      gl.bindVertexArray(p.vao);
      gl.drawElements(gl.TRIANGLES, p.count, p.type, 0);
    }
    gl.bindVertexArray(null);
  }
}
