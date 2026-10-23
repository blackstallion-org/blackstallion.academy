/**
 * WebGL2 fluid trail used by EmberTrail (adapted from React Bits "GlowCursor").
 * A small stable-fluids solver advects a dye field behind the pointer; a bloom chain makes it glow.
 * Imperative engine: create once, update settings, destroy on unmount.
 */

const VERTEX = `#version 300 es
in vec2 aPosition;
uniform vec2 uTexel;
out vec2 vUv; out vec2 vL; out vec2 vR; out vec2 vT; out vec2 vB;
void main() {
  vUv = aPosition * 0.5 + 0.5;
  vL = vUv - vec2(uTexel.x, 0.0); vR = vUv + vec2(uTexel.x, 0.0);
  vT = vUv + vec2(0.0, uTexel.y); vB = vUv - vec2(0.0, uTexel.y);
  gl_Position = vec4(aPosition, 0.0, 1.0);
}`;

const HEADER = `#version 300 es
precision highp float;
precision highp sampler2D;
in vec2 vUv; in vec2 vL; in vec2 vR; in vec2 vT; in vec2 vB;
out vec4 outColor;
`;

const SPLAT = `${HEADER}
uniform sampler2D uTarget; uniform float uAspect; uniform vec2 uA; uniform vec2 uB;
uniform float uRadius; uniform float uWide; uniform vec3 uValue; uniform float uMode; uniform float uStrength;
float erf(float x) { float x2 = x * x; float a = 0.147; return sign(x) * sqrt(1.0 - exp(-x2 * (1.2732395 + a * x2) / (1.0 + a * x2))); }
float sweep(float along, float len, float across, float radius) {
  return exp(-across * across / (radius * radius)) * 0.5 * (erf(along / radius) - erf((along - len) / radius));
}
void main() {
  vec2 p = vec2(vUv.x * uAspect, vUv.y);
  vec2 a = vec2(uA.x * uAspect, uA.y);
  vec2 ab = vec2(uB.x * uAspect, uB.y) - a;
  float len = length(ab);
  vec2 dir = len > 1e-6 ? ab / len : vec2(1.0, 0.0);
  vec2 ap = p - a;
  vec3 base = texture(uTarget, vUv).xyz;
  if (uMode > 1.5) {
    float along = dot(ap, dir);
    float across = dot(ap, vec2(-dir.y, dir.x));
    if (uMode > 2.5) { outColor = vec4(mix(base, uValue, sweep(along, len, across, uRadius) * uStrength), 1.0); return; }
    vec3 add = vec3(uValue.xy * sweep(along, len, across, uRadius), uValue.z * sweep(along, len, across, uWide));
    outColor = vec4(base + add, 1.0);
    return;
  }
  float h = clamp(dot(ap, ab) / max(dot(ab, ab), 1e-9), 0.0, 1.0);
  vec2 d = ap - ab * h;
  float r2 = dot(d, d);
  float falloff = exp(-r2 / (uRadius * uRadius));
  float wide = exp(-r2 / (uWide * uWide));
  vec3 result = uMode > 0.5 ? mix(base, uValue, falloff * uStrength) : base + vec3(uValue.xy * falloff, uValue.z * wide);
  outColor = vec4(result, 1.0);
}`;

const ADVECT = `${HEADER}
uniform sampler2D uVelocity; uniform sampler2D uSource; uniform vec2 uVelocityTexel; uniform float uDt; uniform vec4 uDecay;
void main() {
  vec2 coord = vUv - uDt * texture(uVelocity, vUv).xy * uVelocityTexel;
  outColor = texture(uSource, coord) * uDecay;
}`;

const DIVERGENCE = `${HEADER}
uniform sampler2D uVelocity;
void main() {
  float left = texture(uVelocity, vL).x; float right = texture(uVelocity, vR).x;
  float top = texture(uVelocity, vT).y; float bottom = texture(uVelocity, vB).y;
  vec2 c = texture(uVelocity, vUv).xy;
  if (vL.x < 0.0) left = -c.x; if (vR.x > 1.0) right = -c.x;
  if (vT.y > 1.0) top = -c.y; if (vB.y < 0.0) bottom = -c.y;
  outColor = vec4(0.5 * (right - left + top - bottom), 0.0, 0.0, 1.0);
}`;

const SCALE = `${HEADER}
uniform sampler2D uSource; uniform float uValue;
void main() { outColor = texture(uSource, vUv) * uValue; }`;

const PRESSURE = `${HEADER}
uniform sampler2D uPressure; uniform sampler2D uDivergence;
void main() {
  float l = texture(uPressure, vL).x; float r = texture(uPressure, vR).x;
  float t = texture(uPressure, vT).x; float b = texture(uPressure, vB).x;
  outColor = vec4((l + r + b + t - texture(uDivergence, vUv).x) * 0.25, 0.0, 0.0, 1.0);
}`;

const GRADIENT = `${HEADER}
uniform sampler2D uPressure; uniform sampler2D uVelocity;
void main() {
  float l = texture(uPressure, vL).x; float r = texture(uPressure, vR).x;
  float t = texture(uPressure, vT).x; float b = texture(uPressure, vB).x;
  outColor = vec4(texture(uVelocity, vUv).xy - vec2(r - l, t - b), 0.0, 1.0);
}`;

const SHADE = `
uniform vec3 uColor; uniform vec3 uSecondary; uniform float uIntensity; uniform float uHotspot;
vec3 shade(vec3 dye) {
  float energy = max(dye.x, 0.0);
  float heat = clamp(dye.y, 0.0, energy);
  float gas = max(dye.z, 0.0);
  vec3 tint = mix(uSecondary, uColor, heat / max(energy, 0.0001));
  return (tint * energy + uSecondary * gas + vec3(heat * heat * 0.3 * uHotspot)) * uIntensity;
}
`;

const PREFILTER = `${HEADER}${SHADE}
uniform sampler2D uDye; uniform vec2 uDyeTexel;
void main() {
  vec2 o = uDyeTexel * 0.5;
  vec3 light = shade(texture(uDye, vUv + vec2(-o.x, -o.y)).xyz) + shade(texture(uDye, vUv + vec2(o.x, -o.y)).xyz)
    + shade(texture(uDye, vUv + vec2(-o.x, o.y)).xyz) + shade(texture(uDye, vUv + vec2(o.x, o.y)).xyz);
  outColor = vec4(light * 0.25, 1.0);
}`;

const DOWN = `${HEADER}
uniform sampler2D uSource; uniform vec2 uSourceTexel;
void main() {
  vec2 o = uSourceTexel;
  vec3 c = texture(uSource, vUv).rgb * 4.0 + texture(uSource, vUv + vec2(-o.x, -o.y)).rgb + texture(uSource, vUv + vec2(o.x, -o.y)).rgb
    + texture(uSource, vUv + vec2(-o.x, o.y)).rgb + texture(uSource, vUv + vec2(o.x, o.y)).rgb;
  outColor = vec4(c / 8.0, 1.0);
}`;

const UP = `${HEADER}
uniform sampler2D uSource; uniform vec2 uSourceTexel;
void main() {
  vec2 o = uSourceTexel;
  vec3 c = texture(uSource, vUv + vec2(-o.x * 2.0, 0.0)).rgb + texture(uSource, vUv + vec2(o.x * 2.0, 0.0)).rgb
    + texture(uSource, vUv + vec2(0.0, -o.y * 2.0)).rgb + texture(uSource, vUv + vec2(0.0, o.y * 2.0)).rgb
    + (texture(uSource, vUv + vec2(-o.x, -o.y)).rgb + texture(uSource, vUv + vec2(o.x, -o.y)).rgb
    + texture(uSource, vUv + vec2(-o.x, o.y)).rgb + texture(uSource, vUv + vec2(o.x, o.y)).rgb) * 2.0;
  outColor = vec4(c / 12.0, 1.0);
}`;

const DISPLAY = `${HEADER}${SHADE}
uniform sampler2D uDye; uniform sampler2D uBloom; uniform float uGlow;
void main() {
  vec3 light = shade(texture(uDye, vUv).xyz);
  vec3 bloom = texture(uBloom, vUv).rgb * uGlow;
  float edge = smoothstep(0.0, 0.02, min(min(vUv.x, 1.0 - vUv.x), min(vUv.y, 1.0 - vUv.y)));
  vec3 color = (1.0 - exp(-(light + bloom))) * edge;
  outColor = vec4(color, max(color.r, max(color.g, color.b)));
}`;

const SIM = 128;
const DYE = 512;
const PRESSURE_STEPS = 20;
const BLOOM_LEVELS = 5;

export type GlowSettings = {
  color: [number, number, number];
  secondary: [number, number, number];
  intensity: number;
  trailWidth: number;
  linger: number;
  glow: number;
  hotspot: number;
  followSpeed: number;
};

type Pass = { program: WebGLProgram; u: Record<string, WebGLUniformLocation | null> };
type Target = { texture: WebGLTexture; fbo: WebGLFramebuffer; width: number; height: number; texel: [number, number] };
type Pair = { read: Target; write: Target; swap: () => void; all: () => Target[] };

export function createGlowTrail(container: HTMLElement, canvas: HTMLCanvasElement, getSettings: () => GlowSettings, reduce: boolean) {
  const gl = canvas.getContext("webgl2", { alpha: true, premultipliedAlpha: true, antialias: false, depth: false, stencil: false });
  if (!gl || !gl.getExtension("EXT_color_buffer_float")) return null;

  const compile = (type: number, src: string) => {
    const s = gl.createShader(type);
    if (!s) return null;
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (gl.getShaderParameter(s, gl.COMPILE_STATUS)) return s;
    gl.deleteShader(s);
    return null;
  };
  const vs = compile(gl.VERTEX_SHADER, VERTEX);
  if (!vs) return null;
  const build = (src: string): Pass | null => {
    const fs = compile(gl.FRAGMENT_SHADER, src);
    const program = gl.createProgram();
    if (!fs || !program) return null;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.bindAttribLocation(program, 0, "aPosition");
    gl.linkProgram(program);
    gl.deleteShader(fs);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return null;
    const u: Pass["u"] = {};
    const n = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS) as number;
    for (let i = 0; i < n; i++) {
      const info = gl.getActiveUniform(program, i);
      if (info) u[info.name] = gl.getUniformLocation(program, info.name);
    }
    return { program, u };
  };
  const built = {
    splat: build(SPLAT), advect: build(ADVECT), divergence: build(DIVERGENCE), scale: build(SCALE),
    pressure: build(PRESSURE), gradient: build(GRADIENT), prefilter: build(PREFILTER), down: build(DOWN), up: build(UP), display: build(DISPLAY),
  };
  if (Object.values(built).some((p) => !p)) return null;
  const P = built as Record<keyof typeof built, Pass>;

  const vao = gl.createVertexArray();
  const buffer = gl.createBuffer();
  gl.bindVertexArray(vao);
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

  const target = (w: number, h: number, internal: number, format: number, filter: number): Target => {
    const texture = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, internal, w, h, 0, format, gl.HALF_FLOAT, null);
    const fbo = gl.createFramebuffer()!;
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
    gl.viewport(0, 0, w, h);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    return { texture, fbo, width: w, height: h, texel: [1 / w, 1 / h] };
  };
  const pair = (w: number, h: number, i: number, f: number, filter: number): Pair => {
    let read = target(w, h, i, f, filter);
    let write = target(w, h, i, f, filter);
    return {
      get read() { return read; },
      get write() { return write; },
      swap() { const t = read; read = write; write = t; },
      all() { return [read, write]; },
    };
  };

  type Targets = { velocity: Pair; dye: Pair; pressure: Pair; divergence: Target; bloom: Target[] };
  const state = {
    width: 1, height: 1, ratio: 1, allocated: "",
    targets: null as Targets | null,
    pointer: { x: 0, y: 0 },
    emitter: { x: 0, y: 0, vx: 0, vy: 0, px: 0, py: 0 },
    ready: false, active: -Infinity, bursts: [] as [number, number][],
  };

  const destroyTarget = (t: Target) => { gl.deleteTexture(t.texture); gl.deleteFramebuffer(t.fbo); };
  const release = () => {
    const t = state.targets;
    if (!t) return;
    [...t.velocity.all(), ...t.dye.all(), ...t.pressure.all(), t.divergence, ...t.bloom].forEach(destroyTarget);
    state.targets = null;
  };
  const allocate = () => {
    const key = `${state.width}|${state.height}|${canvas.width}|${canvas.height}`;
    if (key === state.allocated && state.targets) return;
    release();
    state.allocated = key;
    const aspect = state.width / state.height;
    const dims = (b: number) => (aspect >= 1 ? [Math.round(b * aspect), b] : [b, Math.round(b / aspect)]);
    const [sw, sh] = dims(SIM);
    let [dw, dh] = dims(DYE);
    const shrink = Math.min(1, canvas.width / dw, canvas.height / dh);
    dw = Math.max(2, Math.round(dw * shrink));
    dh = Math.max(2, Math.round(dh * shrink));
    const bloom: Target[] = [];
    let bw = dw >> 1;
    let bh = dh >> 1;
    for (let i = 0; i < BLOOM_LEVELS; i++) {
      bloom.push(target(Math.max(1, bw), Math.max(1, bh), gl.RGBA16F, gl.RGBA, gl.LINEAR));
      bw >>= 1;
      bh >>= 1;
    }
    state.targets = {
      velocity: pair(sw, sh, gl.RG16F, gl.RG, gl.LINEAR),
      dye: pair(dw, dh, gl.RGBA16F, gl.RGBA, gl.LINEAR),
      pressure: pair(sw, sh, gl.R16F, gl.RED, gl.NEAREST),
      divergence: target(sw, sh, gl.R16F, gl.RED, gl.NEAREST),
      bloom,
    };
  };
  const resize = () => {
    const w = Math.max(1, container.clientWidth);
    const h = Math.max(1, container.clientHeight);
    const ratio = Math.min(window.devicePixelRatio || 1, 1.75);
    const pw = Math.round(w * ratio);
    const ph = Math.round(h * ratio);
    if (canvas.width !== pw || canvas.height !== ph) {
      canvas.width = pw;
      canvas.height = ph;
    }
    state.width = w;
    state.height = h;
    state.ratio = ratio;
    allocate();
  };

  const draw = (t: Target | null) => {
    if (t) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, t.fbo);
      gl.viewport(0, 0, t.width, t.height);
    } else {
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, canvas.width, canvas.height);
    }
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };
  const program = (p: Pass, texel: [number, number]) => {
    gl.useProgram(p.program);
    if (p.u.uTexel) gl.uniform2f(p.u.uTexel, texel[0], texel[1]);
    return p.u;
  };
  const bind = (unit: number, t: Target) => {
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, t.texture);
    return unit;
  };
  const splat = (p: Pair, ax: number, ay: number, bx: number, by: number, radius: number, value: number[], mode: number, strength: number, wide = radius) => {
    const u = program(P.splat, p.read.texel);
    gl.uniform1i(u.uTarget, bind(0, p.read));
    gl.uniform1f(u.uAspect, state.width / state.height);
    gl.uniform2f(u.uA, ax / state.width, 1 - ay / state.height);
    gl.uniform2f(u.uB, bx / state.width, 1 - by / state.height);
    gl.uniform1f(u.uRadius, radius / state.height);
    gl.uniform1f(u.uWide, wide / state.height);
    gl.uniform3f(u.uValue, value[0], value[1], value[2]);
    gl.uniform1f(u.uMode, mode);
    gl.uniform1f(u.uStrength, strength);
    draw(p.write);
    p.swap();
  };
  const toGrid = (vx: number, vy: number) => {
    const v = state.targets!.velocity;
    return [(vx * v.read.width) / state.width, (-vy * v.read.height) / state.height];
  };
  const lightRadius = (s: GlowSettings) => Math.max(s.trailWidth * 0.5, (state.height / state.targets!.dye.read.height) * 0.9);

  const emit = (s: GlowSettings, dt: number, now: number) => {
    const { emitter: e, pointer: p } = state;
    const { velocity, dye } = state.targets!;
    e.px = e.x;
    e.py = e.y;
    if (reduce) {
      e.x = p.x;
      e.y = p.y;
    } else {
      const omega = 10 + s.followSpeed * 50;
      const steps = Math.max(1, Math.ceil(dt / 0.004));
      const h = dt / steps;
      for (let k = 0; k < steps; k++) {
        e.vx += (omega * omega * (p.x - e.x) - 2 * omega * e.vx) * h;
        e.vy += (omega * omega * (p.y - e.y) - 2 * omega * e.vy) * h;
        e.x += e.vx * h;
        e.y += e.vy * h;
      }
    }
    const dx = e.x - e.px;
    const dy = e.y - e.py;
    if (Math.hypot(dx, dy) < 0.05) return;
    const radius = lightRadius(s);
    if (!reduce) {
      const g = toGrid(dx / Math.max(dt, 1e-3), dy / Math.max(dt, 1e-3));
      splat(velocity, e.px, e.py, e.x, e.y, radius * 4 + 18, [g[0], g[1], 0], 3, 0.45);
    }
    splat(dye, e.px, e.py, e.x, e.y, radius, [5.6, 5.6, 0.7], 2, 1, radius * 5 + 6);
    state.active = now;
  };

  const burst = (s: GlowSettings, x: number, y: number, now: number) => {
    const { velocity, dye } = state.targets!;
    const radius = lightRadius(s);
    const base = Math.random() * Math.PI * 2;
    for (let k = 0; k < 6; k++) {
      const angle = base + (k / 6) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
      const cx = Math.cos(angle);
      const cy = Math.sin(angle);
      const reach = 20 + Math.random() * 14;
      if (!reduce) {
        const g = toGrid(Math.cos(angle + 0.6) * 760, Math.sin(angle + 0.6) * 760);
        splat(velocity, x + cx * 3, y + cy * 3, x + cx * reach, y + cy * reach, 18, [g[0], g[1], 0], 1, 0.9);
      }
      splat(dye, x + cx * 3, y + cy * 3, x + cx * reach, y + cy * reach, radius * 1.1, [2.4, 2.4, 0.3], 0, 1, radius * 5 + 6);
    }
    state.active = now;
  };

  const step = (s: GlowSettings, dt: number) => {
    const { velocity, dye, pressure, divergence } = state.targets!;
    if (!reduce) {
      let u = program(P.divergence, velocity.read.texel);
      gl.uniform1i(u.uVelocity, bind(0, velocity.read));
      draw(divergence);
      u = program(P.scale, pressure.read.texel);
      gl.uniform1i(u.uSource, bind(0, pressure.read));
      gl.uniform1f(u.uValue, 0.8);
      draw(pressure.write);
      pressure.swap();
      u = program(P.pressure, pressure.read.texel);
      gl.uniform1i(u.uDivergence, bind(1, divergence));
      for (let i = 0; i < PRESSURE_STEPS; i++) {
        gl.uniform1i(u.uPressure, bind(0, pressure.read));
        draw(pressure.write);
        pressure.swap();
      }
      u = program(P.gradient, velocity.read.texel);
      gl.uniform1i(u.uPressure, bind(0, pressure.read));
      gl.uniform1i(u.uVelocity, bind(1, velocity.read));
      draw(velocity.write);
      velocity.swap();
      u = program(P.advect, velocity.read.texel);
      gl.uniform2f(u.uVelocityTexel, velocity.read.texel[0], velocity.read.texel[1]);
      gl.uniform1i(u.uVelocity, bind(0, velocity.read));
      gl.uniform1i(u.uSource, bind(0, velocity.read));
      gl.uniform1f(u.uDt, dt);
      const calm = Math.exp(-dt * 1.2);
      gl.uniform4f(u.uDecay, calm, calm, 1, 1);
      draw(velocity.write);
      velocity.swap();
    }
    const u = program(P.advect, dye.read.texel);
    gl.uniform2f(u.uVelocityTexel, velocity.read.texel[0], velocity.read.texel[1]);
    gl.uniform1i(u.uVelocity, bind(0, velocity.read));
    gl.uniform1i(u.uSource, bind(1, dye.read));
    gl.uniform1f(u.uDt, reduce ? 0 : dt);
    gl.uniform4f(u.uDecay, Math.exp((-dt * 4.6) / (s.linger * 0.8)), Math.exp((-dt * 4.6) / (s.linger * 0.2)), Math.exp((-dt * 4.6) / (s.linger * 1.2)), 1);
    draw(dye.write);
    dye.swap();
  };

  const setShade = (u: Pass["u"], s: GlowSettings) => {
    gl.uniform3f(u.uColor, ...s.color);
    gl.uniform3f(u.uSecondary, ...s.secondary);
    gl.uniform1f(u.uIntensity, s.intensity);
    gl.uniform1f(u.uHotspot, s.hotspot);
  };

  const render = (s: GlowSettings) => {
    const { dye, bloom } = state.targets!;
    let u = program(P.prefilter, bloom[0].texel);
    gl.uniform1i(u.uDye, bind(0, dye.read));
    gl.uniform2f(u.uDyeTexel, dye.read.texel[0], dye.read.texel[1]);
    setShade(u, s);
    draw(bloom[0]);
    u = program(P.down, bloom[0].texel);
    for (let i = 1; i < bloom.length; i++) {
      gl.uniform1i(u.uSource, bind(0, bloom[i - 1]));
      gl.uniform2f(u.uSourceTexel, bloom[i - 1].texel[0], bloom[i - 1].texel[1]);
      draw(bloom[i]);
    }
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE);
    u = program(P.up, bloom[0].texel);
    for (let i = bloom.length - 1; i > 0; i--) {
      gl.uniform1i(u.uSource, bind(0, bloom[i]));
      gl.uniform2f(u.uSourceTexel, bloom[i].texel[0], bloom[i].texel[1]);
      draw(bloom[i - 1]);
    }
    gl.disable(gl.BLEND);
    u = program(P.display, [1 / canvas.width, 1 / canvas.height]);
    gl.uniform1i(u.uDye, bind(0, dye.read));
    gl.uniform1i(u.uBloom, bind(1, bloom[0]));
    setShade(u, s);
    gl.uniform1f(u.uGlow, (s.glow * 1.4) / BLOOM_LEVELS);
    draw(null);
  };

  const clearAll = () => {
    const t = state.targets;
    gl.clearColor(0, 0, 0, 0);
    if (t) {
      [...t.velocity.all(), ...t.dye.all(), ...t.pressure.all()].forEach((x) => {
        gl.bindFramebuffer(gl.FRAMEBUFFER, x.fbo);
        gl.clear(gl.COLOR_BUFFER_BIT);
      });
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clear(gl.COLOR_BUFFER_BIT);
  };

  let raf = 0;
  let last = 0;
  let alive = true;
  let visible = true;

  const frame = (now: number) => {
    raf = 0;
    if (!alive || !visible || document.hidden) return;
    const s = getSettings();
    const dt = last ? Math.min(1 / 30, (now - last) / 1000) : 1 / 60;
    last = now;
    allocate();
    gl.bindVertexArray(vao);
    gl.disable(gl.BLEND);
    if (state.ready) emit(s, dt, now);
    while (state.bursts.length) {
      const [x, y] = state.bursts.shift()!;
      burst(s, x, y, now);
    }
    step(s, dt);
    render(s);
    const quiet = now - state.active > s.linger * 1200 + 900;
    if (quiet && Math.hypot(state.emitter.vx, state.emitter.vy) < 1) {
      clearAll();
      last = 0;
      return;
    }
    raf = requestAnimationFrame(frame);
  };
  const wake = () => {
    if (!raf && alive && visible && !document.hidden) raf = requestAnimationFrame(frame);
  };

  const local = (e: PointerEvent) => {
    const rect = container.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    return { x, y, inside: x >= 0 && y >= 0 && x <= rect.width && y <= rect.height };
  };
  const onMove = (e: PointerEvent) => {
    if (e.pointerType !== "mouse") return;
    const { x, y, inside } = local(e);
    if (!inside) {
      state.ready = false;
      return;
    }
    if (!state.ready) {
      Object.assign(state.emitter, { x, y, px: x, py: y, vx: 0, vy: 0 });
      state.ready = true;
    }
    state.pointer.x = x;
    state.pointer.y = y;
    wake();
  };
  const onDown = (e: PointerEvent) => {
    if (e.pointerType !== "mouse") return;
    const { x, y, inside } = local(e);
    if (!inside) return;
    state.bursts.push([x, y]);
    wake();
  };
  const onVis = () => {
    last = 0;
    wake();
  };

  const ro = new ResizeObserver(() => {
    resize();
    wake();
  });
  ro.observe(container);
  const io = new IntersectionObserver((entries) => {
    visible = entries.some((en) => en.isIntersecting);
    if (visible) {
      last = 0;
      wake();
    }
  });
  io.observe(container);
  window.addEventListener("pointermove", onMove, { passive: true });
  window.addEventListener("pointerdown", onDown, { passive: true });
  document.addEventListener("visibilitychange", onVis);
  resize();
  clearAll();

  return () => {
    alive = false;
    cancelAnimationFrame(raf);
    ro.disconnect();
    io.disconnect();
    window.removeEventListener("pointermove", onMove);
    window.removeEventListener("pointerdown", onDown);
    document.removeEventListener("visibilitychange", onVis);
    release();
    Object.values(P).forEach((p) => gl.deleteProgram(p.program));
    gl.deleteShader(vs);
    gl.deleteBuffer(buffer);
    gl.deleteVertexArray(vao);
  };
}
