import * as THREE from "three";
import { ATMOSPHERES } from "../sky";
import { Terrain, terrainHeight } from "../terrain";
import { Scatter, PathFollower, type Environment, type Instance, type Quality } from "../environment";
import { grassTuftTexture } from "../textures";
import { hash2, mulberry32, vnoise } from "../noise";
import type { Surface } from "../locomotion";

/** The centre line the horse follows across the dunes: a long gentle S. */
const pathX = (z: number) => 17 * Math.sin(z / 115) * Math.min(1, z / 160);

function merge(geos: THREE.BufferGeometry[]) {
  // tiny local merge (positions/normals/uv/color only) to avoid pulling in the examples utils
  let n = 0;
  let idx = 0;
  for (const g of geos) { n += g.attributes.position.count; idx += g.index ? g.index.count : g.attributes.position.count; }
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
  }
  void idx;
  const out = new THREE.BufferGeometry();
  out.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  out.setAttribute("normal", new THREE.BufferAttribute(nor, 3));
  out.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
  out.setAttribute("color", new THREE.BufferAttribute(col, 3));
  out.setIndex(ind);
  return out;
}

function tint(geo: THREE.BufferGeometry, c: THREE.ColorRepresentation, vary = 0.1, seed = 1) {
  const col = new THREE.Color(c);
  const arr = new Float32Array(geo.attributes.position.count * 3);
  for (let i = 0; i < geo.attributes.position.count; i++) {
    const v = 1 + (hash2(i, seed, 5) - 0.5) * vary * 2;
    arr[i * 3] = col.r * v; arr[i * 3 + 1] = col.g * v; arr[i * 3 + 2] = col.b * v;
  }
  geo.setAttribute("color", new THREE.BufferAttribute(arr, 3));
  return geo;
}

export function createDesert(quality: Quality): Environment {
  const group = new THREE.Group();
  group.name = "env-desert";
  const style = { sandLight: "#e2bf90", sandDark: "#b78a5c", accent: "#86654a", windDir: new THREE.Vector2(1, 0.35) };
  const near = new Terrain("desert", style, { size: 200, segments: quality.terrainSegments });
  const far = new Terrain("desert", style, { size: 1400, segments: 170, yOffset: -0.35 });
  group.add(far.mesh, near.mesh);

  // ---- grass tufts (crossed alpha cards)
  const tuftTex = grassTuftTexture();
  const cards: THREE.BufferGeometry[] = [];
  for (let k = 0; k < 3; k++) {
    const g = new THREE.PlaneGeometry(1, 0.8);
    g.translate(0, 0.4, 0);
    g.rotateY((k * Math.PI) / 3);
    cards.push(g);
  }
  const tuftMat = new THREE.MeshStandardMaterial({ map: tuftTex, alphaTest: 0.45, side: THREE.DoubleSide, roughness: 1, color: 0xffffff });
  const tufts = new Scatter(merge(cards), tuftMat, 900, 10, 80, (ci, cj) => {
    const r = mulberry32(((ci * 73856093) ^ (cj * 19349663)) >>> 0);
    const out: Instance[] = [];
    const n = 3 + Math.floor(r() * 7);
    for (let i = 0; i < n; i++) {
      const x = (ci + r()) * 10, z = (cj + r()) * 10;
      if (Math.abs(x - pathX(z)) < 1.6) continue;
      if (vnoise(x * 0.02, z * 0.02, 70) < 0.42) continue;              // grass grows in patches
      const sc = 0.28 + r() * 0.5;
      out.push({ x, y: terrainHeight("desert", x, z) - 0.02, z, rotY: r() * 6.28, sx: sc * 1.1, sy: sc, sz: sc * 1.1, color: new THREE.Color().setHSL(0.115 + r() * 0.025, 0.28, 0.58 + r() * 0.12) });
    }
    return out;
  }, { colored: true, receiveShadow: false });

  // ---- shrubs (kair / aak): low, grey-green, irregular
  const shrubGeo = (() => {
    const g = new THREE.IcosahedronGeometry(0.7, 2);
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const v = new THREE.Vector3(p.getX(i), p.getY(i), p.getZ(i));
      v.multiplyScalar(0.7 + 0.7 * hash2(Math.round(v.x * 30), Math.round(v.z * 30) + Math.round(v.y * 17), 9));
      v.y *= 0.72;
      p.setXYZ(i, v.x, Math.max(v.y, -0.05) + 0.3, v.z);
    }
    g.computeVertexNormals();
    return tint(g, "#8b8d63", 0.2, 4);
  })();
  const shrubs = new Scatter(shrubGeo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1 }), 220, 22, 120, (ci, cj) => {
    const r = mulberry32(((ci * 83492791) ^ (cj * 25283)) >>> 0);
    const out: Instance[] = [];
    const n = Math.floor(r() * 3.2);
    for (let i = 0; i < n; i++) {
      const x = (ci + r()) * 22, z = (cj + r()) * 22;
      if (Math.abs(x - pathX(z)) < 4) continue;
      const sc = 0.35 + r() * 0.75;
      out.push({ x, y: terrainHeight("desert", x, z) - 0.05, z, rotY: r() * 6.28, sx: sc * 1.4, sy: sc * 0.8, sz: sc * 1.4, color: new THREE.Color().setHSL(0.16 + r() * 0.05, 0.16, 0.55 + r() * 0.14) });
    }
    return out;
  }, { colored: true, castShadow: false });

  // ---- khejri trees: thin trunk, wide flat canopy
  const trunkGeo = tint(new THREE.CylinderGeometry(0.1, 0.2, 3, 6, 2).translate(0, 1.5, 0), "#4b3a2b", 0.12, 2);
  const canopyGeo = (() => {
    const parts: THREE.BufferGeometry[] = [];
    for (const [x, y, z, s] of [[0, 3.2, 0, 1.4], [0.9, 3.0, 0.4, 1.0], [-0.8, 3.1, -0.5, 1.1]] as const) {
      const g = new THREE.IcosahedronGeometry(s, 1);
      g.scale(1.7, 0.7, 1.7);
      g.translate(x, y, z);
      parts.push(tint(g, "#6d7b4b", 0.16, 6));
    }
    return merge(parts);
  })();
  const treePlace = (ci: number, cj: number) => {
    const r = mulberry32(((ci * 49979687) ^ (cj * 1299721)) >>> 0);
    const out: Instance[] = [];
    if (r() < 0.32) {
      const x = (ci + r()) * 70, z = (cj + r()) * 70;
      if (Math.abs(x - pathX(z)) > 7) {
        const sc = 0.9 + r() * 0.7;
        out.push({ x, y: terrainHeight("desert", x, z) - 0.05, z, rotY: r() * 6.28, sx: sc, sy: sc, sz: sc, rotZ: (r() - 0.5) * 0.12, color: new THREE.Color(1, 1, 1) });
      }
    }
    return out;
  };
  const trunks = new Scatter(trunkGeo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1 }), 40, 70, 260, treePlace, { castShadow: true, colored: true });
  const canopies = new Scatter(canopyGeo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95, flatShading: false }), 40, 70, 260, treePlace, { castShadow: true, colored: true });

  // ---- distant sandstone buttes on the horizon (fogged silhouettes)
  const butteGeo = (() => {
    const g = new THREE.CylinderGeometry(0.72, 1, 1, 10, 5, false);
    const p = g.attributes.position;
    const col = new Float32Array(p.count * 3);
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
      const a = Math.atan2(z, x);
      const rug = 0.82 + 0.3 * vnoise(Math.cos(a) * 3 + y * 2, Math.sin(a) * 3, 81) + 0.12 * Math.sin(y * 18);
      const top = y > 0.45 ? 0.92 : 1;
      p.setXYZ(i, x * rug * top, y, z * rug * top);
      const band = 0.8 + 0.25 * Math.sin((y + 0.5) * 14 + a * 0.5) + 0.12 * vnoise(y * 5, a * 4, 82);
      col[i * 3] = 0.72 * band; col[i * 3 + 1] = 0.46 * band; col[i * 3 + 2] = 0.3 * band;
    }
    g.setAttribute("color", new THREE.BufferAttribute(col, 3));
    g.translate(0, 0.5, 0);
    g.computeVertexNormals();
    return g;
  })();
  const buttes = new Scatter(butteGeo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, flatShading: true }), 40, 180, 700, (ci, cj) => {
    const r = mulberry32(((ci * 2654435761) ^ (cj * 40503)) >>> 0);
    const out: Instance[] = [];
    if (r() < 0.22) {
      const x = (ci + r()) * 180, z = (cj + r()) * 180;
      const sx = 30 + r() * 80, sy = 22 + r() * 55;
      out.push({ x, y: terrainHeight("desert", x, z) - 4, z, rotY: r() * 6.28, sx, sy, sz: sx * (0.7 + r() * 0.6) });
    }
    return out;
  }, { receiveShadow: false });
  for (const s of [tufts, shrubs, trunks, canopies, buttes]) group.add(s.mesh);

  // ---- path and start: the horse begins on the highest dune crest near the start of the track
  let best = 0, bestH = -1e9;
  for (let z = 20; z <= 260; z += 2) { const h = terrainHeight("desert", pathX(z), z); if (h > bestH) { bestH = h; best = z; } }
  const pts: THREE.Vector2[] = [];
  for (let z = best; z < best + 6000; z += 4) pts.push(new THREE.Vector2(pathX(z), z));
  const path = new PathFollower(pts);
  const heading = Math.atan2(pathX(best + 2) - pathX(best), 2);

  const surface: Surface = { dust: 1, prints: 1, color: new THREE.Color("#d0ae80"), hardness: 0.25 };
  const env: Environment = {
    id: "desert", group, terrain: near, atmosphere: ATMOSPHERES.desert, wind: new THREE.Vector3(4.4, 0, 1.2),
    start: { x: pathX(best), z: best, heading }, path, shadowRadius: 9,
    surface: () => surface,
    update(_dt, focus, time, q) {
      near.update(focus.x, focus.z, time);
      far.update(focus.x, focus.z, time);
      tufts.update(focus.x, focus.z, q.scatter);
      shrubs.update(focus.x, focus.z, q.scatter);
      trunks.update(focus.x, focus.z, 1);
      canopies.update(focus.x, focus.z, 1);
      buttes.update(focus.x, focus.z, 1);
    },
    dispose() {
      near.dispose(); far.dispose();
      for (const s of [tufts, shrubs, trunks, canopies, buttes]) { s.mesh.geometry.dispose(); (s.mesh.material as THREE.Material).dispose(); s.dispose(); }
      tuftTex.dispose();
    },
  };
  return env;
}
