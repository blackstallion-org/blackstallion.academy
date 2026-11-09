import { BufferAttribute, Color, PlaneGeometry } from "three";

/** Deterministic value noise: the same relief every visit, no randomness at runtime. */
const hash = (x: number, y: number) => {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return s - Math.floor(s);
};
const smooth = (t: number) => t * t * (3 - 2 * t);
export function noise(x: number, y: number) {
  const xi = Math.floor(x), yi = Math.floor(y);
  const xf = smooth(x - xi), yf = smooth(y - yi);
  const a = hash(xi, yi), b = hash(xi + 1, yi), c = hash(xi, yi + 1), d = hash(xi + 1, yi + 1);
  return a + (b - a) * xf + (c - a) * yf + (a - b - c + d) * xf * yf;
}
export function fbm(x: number, y: number, octaves = 4) {
  let v = 0, amp = 0.5, f = 1;
  for (let i = 0; i < octaves; i++) {
    v += amp * noise(x * f, y * f);
    f *= 2;
    amp *= 0.5;
  }
  return v;
}

/**
 * A ground plane of `w` by `d` units, displaced by `height(x, z)` and painted per vertex by `paint(x, z, y)`. Low
 * segment counts and flat shading keep it faceted, like a painted relief rather than a photographed landscape.
 */
export function terrain(w: number, d: number, segX: number, segZ: number, height: (x: number, z: number) => number, paint: (x: number, z: number, y: number) => Color) {
  const g = new PlaneGeometry(w, d, segX, segZ);
  g.rotateX(-Math.PI / 2);
  const pos = g.attributes.position as BufferAttribute;
  const colors = new Float32Array(pos.count * 3);
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i);
    const y = height(x, z);
    pos.setY(i, y);
    const c = paint(x, z, y);
    colors.set([c.r, c.g, c.b], i * 3);
  }
  g.setAttribute("color", new BufferAttribute(colors, 3));
  g.computeVertexNormals();
  return g;
}

export const mix = (a: Color, b: Color, t: number) => a.clone().lerp(b, Math.min(1, Math.max(0, t)));

/** The painter's palette, shared by every relief (docs/history-scrolls/PLAN.md). */
export const P = {
  indigo: new Color("#17284b"),
  malachite: new Color("#174d48"),
  vermilion: new Color("#a63c32"),
  gold: new Color("#c7a15a"),
  ivory: new Color("#f2e9d8"),
  ink: new Color("#182329"),
  ochre: new Color("#c9a462"),
  sand: new Color("#dcc08a"),
  sandstone: new Color("#b7704c"),
  granite: new Color("#a89384"),
  leaf: new Color("#5f7a3e"),
  snow: new Color("#eef0f2"),
  rock: new Color("#7b7f8f"),
  sea: new Color("#3d5f8c"),
  land: new Color("#d8c79a"),
};
