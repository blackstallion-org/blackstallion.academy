/**
 * Deterministic value noise. The integer hash is written so that the JavaScript and GLSL versions give identical results
 * (32-bit wrap-around); terrain heights are therefore the same on the CPU (hoof contact, prints) and on the GPU (vertex shader).
 */
export function hash2(ix: number, iz: number, seed = 0): number {
  let h = (Math.imul(ix, 374761393) + Math.imul(iz, 668265263) + Math.imul(seed, 2147483647)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h = h ^ (h >>> 16);
  return (h >>> 0) / 4294967295;
}

export function vnoise(x: number, z: number, seed = 0): number {
  const ix = Math.floor(x);
  const iz = Math.floor(z);
  const fx = x - ix;
  const fz = z - iz;
  const u = fx * fx * (3 - 2 * fx);
  const v = fz * fz * (3 - 2 * fz);
  const a = hash2(ix, iz, seed);
  const b = hash2(ix + 1, iz, seed);
  const c = hash2(ix, iz + 1, seed);
  const d = hash2(ix + 1, iz + 1, seed);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}

/** 1-D smooth noise in time, 0..1, for organic micro-motion (never a bare sine). */
export function tnoise(t: number, seed = 0): number {
  return vnoise(t, seed * 17.17 + 0.5, seed + 101);
}

/** Two incommensurate layers, centred on 0 (-1..1). */
export function wobble(t: number, seed = 0): number {
  return (tnoise(t * 0.37, seed) - 0.5) * 1.2 + (tnoise(t * 1.13 + 7.3, seed + 3) - 0.5) * 0.8;
}

export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const smoothstep = (a: number, b: number, x: number) => {
  const t = clamp((x - a) / (b - a || 1), 0, 1);
  return t * t * (3 - 2 * t);
};
export const damp = (current: number, target: number, rate: number, dt: number) => current + (target - current) * (1 - Math.exp(-rate * dt));

/** GLSL mirror of `hash2` / `vnoise` (ES 3.0). */
export const GLSL_NOISE = /* glsl */ `
uint hashU(ivec2 p, int seed) {
  uint h = uint(p.x) * 374761393u + uint(p.y) * 668265263u + uint(seed) * 2147483647u;
  h = (h ^ (h >> 13u)) * 1274126177u;
  h = h ^ (h >> 16u);
  return h;
}
float hash2(ivec2 p, int seed) { return float(hashU(p, seed)) / 4294967295.0; }
float vnoise(vec2 p, int seed) {
  vec2 i = floor(p);
  vec2 f = p - i;
  vec2 u = f * f * (3.0 - 2.0 * f);
  ivec2 ii = ivec2(i);
  float a = hash2(ii, seed);
  float b = hash2(ii + ivec2(1, 0), seed);
  float c = hash2(ii + ivec2(0, 1), seed);
  float d = hash2(ii + ivec2(1, 1), seed);
  return a + (b - a) * u.x + (c - a) * u.y + (a - b - c + d) * u.x * u.y;
}
`;
