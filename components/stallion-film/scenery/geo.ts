import * as THREE from "three";
import { hash2 } from "../noise";

/** Small geometry kit shared by the village and the campus: boxes, arches, domes, chhatris, merged and painted with vertex colours. */
export type Geo = THREE.BufferGeometry;

/** Level of detail for the geometry built next: 1 = full, below 1 = the phone profile (fewer curve segments, domes and merlons). */
let LOD = 1;
export function setLod(v: number) {
  LOD = v;
}
const low = () => LOD < 1;

/** Merge geometries (position / normal / uv / colour only) into one indexed buffer. */
export function merge(geos: Geo[]): Geo {
  let n = 0;
  for (const g of geos) n += g.attributes.position.count;
  const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), uv = new Float32Array(n * 2), col = new Float32Array(n * 3).fill(1);
  const ind: number[] = [];
  let o = 0;
  for (const g of geos) {
    const p = g.attributes.position, nn = g.attributes.normal, u = g.attributes.uv, c = g.attributes.color;
    for (let i = 0; i < p.count; i++) {
      pos.set([p.getX(i), p.getY(i), p.getZ(i)], (o + i) * 3);
      if (nn) nor.set([nn.getX(i), nn.getY(i), nn.getZ(i)], (o + i) * 3);
      if (u) uv.set([u.getX(i), u.getY(i)], (o + i) * 2);
      if (c) col.set([c.getX(i), c.getY(i), c.getZ(i)], (o + i) * 3);
    }
    if (g.index) for (let i = 0; i < g.index.count; i++) ind.push(g.index.getX(i) + o);
    else for (let i = 0; i < p.count; i++) ind.push(i + o);
    o += p.count;
    g.dispose();
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  out.setAttribute("normal", new THREE.BufferAttribute(nor, 3));
  out.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
  out.setAttribute("color", new THREE.BufferAttribute(col, 3));
  out.setIndex(ind);
  return out;
}

/** Paint every vertex a colour, with optional per-vertex variation. */
export function paint(geo: Geo, c: THREE.ColorRepresentation, vary = 0, seed = 1): Geo {
  const col = new THREE.Color(c);
  const n = geo.attributes.position.count;
  const arr = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const v = 1 + (hash2(i, seed, 5) - 0.5) * vary * 2;
    arr[i * 3] = col.r * v; arr[i * 3 + 1] = col.g * v; arr[i * 3 + 2] = col.b * v;
  }
  geo.setAttribute("color", new THREE.BufferAttribute(arr, 3));
  return geo;
}

/** Box-projected UVs in world metres, so a tiling texture keeps one density on every face. */
export function worldUV(geo: Geo, scale = 0.25): Geo {
  const p = geo.attributes.position, nm = geo.attributes.normal;
  const uv = new Float32Array(p.count * 2);
  for (let i = 0; i < p.count; i++) {
    const ax = Math.abs(nm.getX(i)), ay = Math.abs(nm.getY(i)), az = Math.abs(nm.getZ(i));
    let u: number, v: number;
    if (ax >= ay && ax >= az) { u = p.getZ(i); v = p.getY(i); }
    else if (az >= ay) { u = p.getX(i); v = p.getY(i); }
    else { u = p.getX(i); v = p.getZ(i); }
    uv[i * 2] = u * scale; uv[i * 2 + 1] = v * scale;
  }
  geo.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
  return geo;
}

/** Box with its base at y. */
export function boxG(w: number, h: number, d: number, x: number, y: number, z: number, color: THREE.ColorRepresentation, ry = 0): Geo {
  const g = new THREE.BoxGeometry(w, h, d);
  if (ry) g.rotateY(ry);
  g.translate(x, y + h / 2, z);
  return paint(g, color);
}

/** Cylinder (or cone frustum) with its base at y. */
export function cylG(rTop: number, rBot: number, h: number, seg: number, x: number, y: number, z: number, color: THREE.ColorRepresentation): Geo {
  const g = new THREE.CylinderGeometry(rTop, rBot, h, seg, 1);
  g.translate(x, y + h / 2, z);
  return paint(g, color);
}

/** A cusped Mughal-style opening in a wall, x in [-w/2, w/2], base at y = 0, apex at y = h. */
export function archShape(w: number, h: number): THREE.Shape {
  const s = new THREE.Shape();
  const hw = w / 2;
  const sp = Math.max(0.1, h - w * 0.46);
  s.moveTo(-hw, 0);
  s.lineTo(hw, 0);
  s.lineTo(hw, sp);
  s.bezierCurveTo(hw, sp + w * 0.3, w * 0.17, h - w * 0.06, 0, h);
  s.bezierCurveTo(-w * 0.17, h - w * 0.06, -hw, sp + w * 0.3, -hw, sp);
  s.lineTo(-hw, 0);
  return s;
}

/** The dark of a doorway or window, as a flat shape set a hair in front of the wall. */
export function openingG(w: number, h: number, x: number, y: number, z: number, color: THREE.ColorRepresentation = "#1b1511"): Geo {
  const g = new THREE.ShapeGeometry(archShape(w, h), low() ? 5 : 10);
  g.translate(x, y, z);
  return paint(g, color);
}

/** A raised stone frame round an arched opening (the hole is real, so the frame reads in light and shadow). */
export function archFrameG(w: number, h: number, border: number, depth: number, x: number, y: number, z: number, color: THREE.ColorRepresentation): Geo {
  const outer = archShape(w + border * 2, h + border * 2);
  outer.holes.push(new THREE.Path(archShape(w, h).getPoints(low() ? 6 : 14).map((p) => new THREE.Vector2(p.x, p.y + border))));
  const g = new THREE.ExtrudeGeometry(outer, { depth, bevelEnabled: false, curveSegments: low() ? 4 : 10 });
  g.translate(x, y - border, z);
  return paint(g, color);
}

/** A wall panel (x from -w/2..w/2, y from 0..h, thickness along +z) with any number of arched openings cut through it. */
export function archedWallG(w: number, h: number, thick: number, holes: { x: number; y: number; w: number; h: number }[], z: number, color: THREE.ColorRepresentation, x0 = 0, y0 = 0): Geo {
  const s = new THREE.Shape();
  s.moveTo(-w / 2, 0); s.lineTo(w / 2, 0); s.lineTo(w / 2, h); s.lineTo(-w / 2, h); s.lineTo(-w / 2, 0);
  for (const o of holes) {
    const pts = archShape(o.w, o.h).getPoints(low() ? 6 : 12).map((p) => new THREE.Vector2(p.x + o.x, p.y + o.y));
    s.holes.push(new THREE.Path(pts));
  }
  const g = new THREE.ExtrudeGeometry(s, { depth: thick, bevelEnabled: false, curveSegments: low() ? 4 : 8 });
  g.translate(x0, y0, z);
  return paint(g, color);
}

/** Half-sphere dome on a short drum, with a finial. Base at y. */
export function domeG(r: number, x: number, y: number, z: number, color: THREE.ColorRepresentation, finial: THREE.ColorRepresentation = "#c9a66b"): Geo {
  const parts: Geo[] = [];
  const drum = new THREE.CylinderGeometry(r * 0.96, r, r * 0.3, low() ? 10 : 18, 1);
  drum.translate(x, y + r * 0.15, z);
  parts.push(paint(drum, color));
  const d = new THREE.SphereGeometry(r, low() ? 10 : 18, low() ? 5 : 9, 0, Math.PI * 2, 0, Math.PI / 2);
  d.scale(1, 0.95, 1);
  d.translate(x, y + r * 0.3, z);
  parts.push(paint(d, color));
  const f = new THREE.ConeGeometry(r * 0.07, r * 0.6, low() ? 5 : 8);
  f.translate(x, y + r * 0.3 + r * 0.95 + r * 0.25, z);
  parts.push(paint(f, finial));
  return merge(parts);
}

/** A pavilion on four columns under a dome: the chhatri of Rajasthani skylines. Base at y, side `s`. */
export function chhatriG(s: number, x: number, y: number, z: number, stone: THREE.ColorRepresentation, domeColor: THREE.ColorRepresentation = stone): Geo {
  const parts: Geo[] = [];
  const colH = s * 0.95;
  parts.push(boxG(s + 0.3, 0.16, s + 0.3, x, y, z, stone));
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) parts.push(cylG(0.09, 0.11, colH, 8, x + sx * s * 0.42, y + 0.16, z + sz * s * 0.42, stone));
  parts.push(boxG(s + 0.4, 0.18, s + 0.4, x, y + 0.16 + colH, z, stone));
  parts.push(domeG(s * 0.46, x, y + 0.34 + colH, z, domeColor));
  return merge(parts);
}

/** A row of merlons along +x at height y. */
export function merlonsG(len: number, x: number, y: number, z: number, color: THREE.ColorRepresentation, step0 = 1.1, size = 0.5, along: "x" | "z" = "x"): Geo {
  const parts: Geo[] = [];
  const step = low() ? step0 * 1.8 : step0;
  const n = Math.max(1, Math.floor(len / step));
  for (let i = 0; i < n; i++) {
    const o = -len / 2 + (i + 0.5) * (len / n);
    parts.push(along === "x" ? boxG(size, size * 1.05, 0.3, x + o, y, z, color) : boxG(0.3, size * 1.05, size, x, y, z + o, color));
  }
  return merge(parts);
}

/** A little oriel balcony (jharokha) projecting from a wall at z = 0 toward +z. Centre x, floor at y. */
export function jharokhaG(x: number, y: number, z: number, stone: THREE.ColorRepresentation, dark: THREE.ColorRepresentation = "#1b1511"): Geo {
  const parts: Geo[] = [];
  const W = 2.5, D = 0.95, H = 1.7;
  parts.push(boxG(W + 0.2, 0.18, D + 0.1, x, y, z + D / 2, stone));                            // floor slab
  parts.push(boxG(0.14, H, D, x - W / 2 + 0.07, y + 0.18, z + D / 2, stone));                 // side panels
  parts.push(boxG(0.14, H, D, x + W / 2 - 0.07, y + 0.18, z + D / 2, stone));
  parts.push(boxG(W, 0.5, 0.14, x, y + 0.18, z + D - 0.07, stone));                            // front rail
  for (let i = -1; i <= 1; i++) {                                                              // three small arches above the rail
    parts.push(boxG(0.1, H - 0.5, 0.12, x + i * 0.82, y + 0.68, z + D - 0.07, stone));
  }
  parts.push(boxG(W, 0.14, 0.14, x, y + 0.18 + H - 0.14, z + D - 0.07, stone));
  parts.push(boxG(W + 0.3, 0.16, D + 0.3, x, y + 0.18 + H, z + D / 2, stone));                 // roof slab
  parts.push(domeG(0.62, x, y + 0.34 + H, z + D / 2, stone));
  parts.push(boxG(W - 0.3, H - 0.5, 0.05, x, y + 0.68, z + 0.02, dark));                       // the dark behind the screen
  return merge(parts);
}

/** A lathe pot (matka): bulging belly, narrow neck, flared lip. `h` is its height in metres. */
export function potG(h: number, x: number, y: number, z: number, color: THREE.ColorRepresentation): Geo {
  const pts = [[0, 0], [0.5, 0.02], [0.82, 0.26], [1, 0.62], [0.88, 1.0], [0.52, 1.3], [0.42, 1.52], [0.5, 1.62], [0.38, 1.66]].map(([a, b]) => new THREE.Vector2(a * h * 0.45, (b * h) / 1.66));
  const g = new THREE.LatheGeometry(pts, low() ? 8 : 14);
  g.translate(x, y, z);
  return paint(g, color, 0.08);
}

/** A tree crown: squashed icospheres with leaf-cluster relief, darker underneath (baked occlusion). UVs tile a foliage texture. */
export function crownG(radius: number, blobs0: number, x: number, y: number, z: number, color: THREE.ColorRepresentation, seed = 3, flat = 0.62): Geo {
  const parts: Geo[] = [];
  const base = new THREE.Color(color);
  const blobs = low() ? Math.max(4, Math.round(blobs0 * 0.7)) : blobs0;
  for (let i = 0; i < blobs; i++) {
    const a = (i / blobs) * Math.PI * 2 + hash2(i, seed, 1) * 2;
    const d = i === 0 ? 0 : radius * (0.45 + 0.35 * hash2(i, seed, 2));
    const s = radius * (i === 0 ? 1 : 0.62 + 0.3 * hash2(i, seed, 3));
    const g = new THREE.SphereGeometry(s, low() ? 10 : 16, low() ? 7 : 10);
    const p = g.attributes.position, uv = g.attributes.uv;
    const col = new Float32Array(p.count * 3);
    for (let k = 0; k < p.count; k++) {
      const vx = p.getX(k), vy = p.getY(k), vz = p.getZ(k);
      // clumpy, leafy silhouette
      const n = 1 + 0.16 * (hash2(Math.round(vx * 5), Math.round(vy * 5), Math.round(vz * 5) + seed) - 0.5) + 0.1 * Math.sin(vx * 3.1 + seed) * Math.sin(vz * 2.7);
      p.setXYZ(k, vx * 1.15 * n, vy * flat * n, vz * 1.15 * n);
      const under = 0.5 + 0.5 * Math.min(1, Math.max(0, (vy / s + 0.9) / 1.6));
      const v = under * (0.9 + 0.2 * hash2(k, seed, 7 + i));
      col[k * 3] = base.r * v; col[k * 3 + 1] = base.g * v; col[k * 3 + 2] = base.b * v;
      if (uv) uv.setXY(k, uv.getX(k) * 5, uv.getY(k) * 5);
    }
    g.setAttribute("color", new THREE.BufferAttribute(col, 3));
    g.translate(x + Math.cos(a) * d, y + (hash2(i, seed, 4) - 0.5) * radius * 0.35, z + Math.sin(a) * d);
    parts.push(g);
  }
  return merge(parts);
}
