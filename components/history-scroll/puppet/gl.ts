import type { Built } from "./build";
import type { Local } from "./motion";

/**
 * One WebGL2 context for the whole page. Each visible puppet draws into it and copies the result into its own 2D canvas,
 * so a page of eight scenes never holds eight GPU contexts.
 */
const MAX_BONES = 48;

const VS = `#version 300 es
in vec4 aPos; in vec4 aIdx; in vec4 aW; in float aWave;
uniform mat3 uB[${MAX_BONES}];
uniform vec4 uBox; // mesh-space left, top, width, height of the canvas
uniform float uT; uniform float uSway; uniform float uWaveAmp; uniform float uAspect;
out vec2 vUv;
void main() {
  vec3 p = vec3(aPos.xy, 1.0);
  vec2 q = vec2(0.0);
  for (int k = 0; k < 4; k++) q += aW[k] * (uB[int(aIdx[k])] * p).xy;
  // Cloth: a travelling ripple that grows toward the free end.
  q.y += aWave * uWaveAmp * sin(aPos.x * 38.0 - uT * 5.2);
  q.x += aWave * uWaveAmp * 0.6 * cos(aPos.y * 31.0 - uT * 4.4);
  // Foreground plants: rooted at the bottom edge, swaying more toward their tops.
  float h = pow(1.0 - aPos.w, 1.6);
  q.x += uSway * h * (sin(uT * 1.3 + aPos.x * 5.0) * 0.7 + sin(uT * 2.9 + aPos.x * 13.0) * 0.3);
  vUv = aPos.zw;
  vec2 c = (q - uBox.xy) / uBox.zw;
  gl_Position = vec4(c.x * 2.0 - 1.0, 1.0 - c.y * 2.0, 0.0, 1.0);
}`;
const FS = `#version 300 es
precision highp float;
in vec2 vUv; uniform sampler2D uTex; out vec4 o;
void main() { o = texture(uTex, vUv); }`;

type Mesh = { vao: WebGLVertexArrayObject; count: number; tex: WebGLTexture };

let shared: { gl: WebGL2RenderingContext; canvas: HTMLCanvasElement; prog: WebGLProgram; loc: Record<string, WebGLUniformLocation | null> } | null = null;
let failed = false;

function compile(gl: WebGL2RenderingContext, type: number, src: string) {
  const s = gl.createShader(type)!;
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) ?? "shader");
  return s;
}

export function getGL() {
  if (shared || failed) return shared;
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl2", { premultipliedAlpha: true, alpha: true, antialias: true, preserveDrawingBuffer: false });
    if (!gl) throw new Error("no webgl2");
    const prog = gl.createProgram()!;
    gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, VS));
    gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, FS));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog) ?? "link");
    const loc: Record<string, WebGLUniformLocation | null> = {};
    for (const n of ["uB", "uBox", "uT", "uSway", "uWaveAmp", "uAspect", "uTex"]) loc[n] = gl.getUniformLocation(prog, n);
    canvas.addEventListener("webglcontextlost", () => {
      shared = null;
      failed = true;
    });
    shared = { gl, canvas, prog, loc };
  } catch (e) {
    console.warn("puppet: WebGL unavailable", e);
    failed = true;
  }
  return shared;
}

export function createMesh(b: Built, image: HTMLImageElement): Mesh | null {
  const s = getGL();
  if (!s) return null;
  const { gl } = s;
  const vao = gl.createVertexArray()!;
  gl.bindVertexArray(vao);
  const attr = (name: string, data: Float32Array, size: number) => {
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    const l = gl.getAttribLocation(s.prog, name);
    gl.enableVertexAttribArray(l);
    gl.vertexAttribPointer(l, size, gl.FLOAT, false, 0, 0);
  };
  attr("aPos", b.pos, 4);
  attr("aIdx", b.idx, 4);
  attr("aW", b.wts, 4);
  attr("aWave", b.wave, 1);
  const ib = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ib);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, b.index, gl.STATIC_DRAW);
  gl.bindVertexArray(null);
  const tex = gl.createTexture()!;
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
  gl.generateMipmap(gl.TEXTURE_2D);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  return { vao, count: b.index.length, tex };
}

/** World matrices (column-major mat3) from local bone motions, parents first (bones are built parents-first). */
export function worldMatrices(b: Built, locals: Local[], out: Float32Array) {
  const n = b.bones.length;
  const m: number[][] = new Array(n);
  for (let i = 0; i < n; i++) {
    const bone = b.bones[i];
    const L = locals[i] ?? { a: 0, sy: 1, tx: 0, ty: 0 };
    const [px, py] = bone.pivot;
    const c = Math.cos(L.a);
    const s = Math.sin(L.a);
    // T(pivot + t) * R * S(1, sy) * T(-pivot), as [a b c d e f] for x' = a x + c y + e, y' = b x + d y + f.
    const la = c;
    const lb = s;
    const lc = -s * L.sy;
    const ld = c * L.sy;
    const le = px + L.tx - (la * px + lc * py);
    const lf = py + L.ty - (lb * px + ld * py);
    const local = [la, lb, lc, ld, le, lf];
    const P = bone.parent >= 0 ? m[bone.parent] : null;
    m[i] = P
      ? [
          P[0] * local[0] + P[2] * local[1],
          P[1] * local[0] + P[3] * local[1],
          P[0] * local[2] + P[2] * local[3],
          P[1] * local[2] + P[3] * local[3],
          P[0] * local[4] + P[2] * local[5] + P[4],
          P[1] * local[4] + P[3] * local[5] + P[5],
        ]
      : local;
    out.set([m[i][0], m[i][1], 0, m[i][2], m[i][3], 0, m[i][4], m[i][5], 1], i * 9);
  }
  return m;
}

export type DrawOpts = { box: [number, number, number, number]; t: number; sway: number; waveAmp: number };

/** Draws one mesh into the shared context at w×h pixels and copies it into `target`. */
export function draw(mesh: Mesh, mats: Float32Array, target: CanvasRenderingContext2D, w: number, h: number, o: DrawOpts) {
  const s = getGL();
  if (!s) return false;
  const { gl, canvas, loc } = s;
  if (canvas.width < w || canvas.height < h) {
    canvas.width = Math.max(canvas.width, w);
    canvas.height = Math.max(canvas.height, h);
  }
  gl.viewport(0, canvas.height - h, w, h);
  gl.enable(gl.SCISSOR_TEST);
  gl.scissor(0, canvas.height - h, w, h);
  gl.clearColor(0, 0, 0, 0);
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
  gl.useProgram(s.prog);
  gl.uniformMatrix3fv(loc.uB, false, mats);
  gl.uniform4f(loc.uBox, ...o.box);
  gl.uniform1f(loc.uT, o.t);
  gl.uniform1f(loc.uSway, o.sway);
  gl.uniform1f(loc.uWaveAmp, o.waveAmp);
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, mesh.tex);
  gl.uniform1i(loc.uTex, 0);
  gl.bindVertexArray(mesh.vao);
  gl.drawElements(gl.TRIANGLES, mesh.count, gl.UNSIGNED_INT, 0);
  gl.bindVertexArray(null);
  target.clearRect(0, 0, w, h);
  target.drawImage(canvas, 0, 0, w, h, 0, 0, w, h);
  return true;
}

export function disposeMesh(mesh: Mesh) {
  const s = getGL();
  if (!s) return;
  s.gl.deleteVertexArray(mesh.vao);
  s.gl.deleteTexture(mesh.tex);
}

export { MAX_BONES };
