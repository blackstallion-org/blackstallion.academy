import * as THREE from "three";
import { ATMOSPHERES } from "../sky";
import { ARENA, Terrain, terrainHeight } from "../terrain";
import { PathFollower, Scatter, type Environment, type Instance, type Quality } from "../environment";
import { foliageTexture, grassTuftTexture, plasterTexture, signTexture, woodTexture } from "../textures";
import { mulberry32, vnoise } from "../noise";
import type { Surface } from "../locomotion";
import { setLod, archFrameG, archedWallG, boxG, chhatriG, crownG, cylG, domeG, jharokhaG, merge, merlonsG, openingG, worldUV, type Geo } from "./geo";

/**
 * Chapter III — "Excellence". The academy, as a concept: a sand riding arena fenced in dark timber, a long arcaded stable block,
 * a sandstone hall at the far end, an avenue of neem trees along the entry drive, and an entry portal with the academy's name.
 * This is an illustrative setting built for the film; it is not a survey of any real facility.
 */
const AX0 = ARENA.cx - ARENA.hx; // -24
const AX1 = ARENA.cx + ARENA.hx; // 24
const AZ0 = ARENA.cz - ARENA.hz; // 22 (the entry end)
const AZ1 = ARENA.cz + ARENA.hz; // 102
const STONE = "#d8b98f";
const TRIM = "#c9a574";
const TIMBER = "#43301f";
const GOLD = "#c9a66b";

const insideArena = (x: number, z: number, m = 0) => x > AX0 - m && x < AX1 + m && z > AZ0 - m && z < AZ1 + m;
/** The stable block runs along the west fence; the hall closes the far end. */
const STABLE = { x0: -43.5, x1: -34, z0: 28, z1: 96 };
const HALL = { z: 140, hw: 28 };

/* ------------------------------------------------------------------ fence */
function fenceGeo(): Geo {
  const P: Geo[] = [];
  const gap = 5.4;
  const post = (x: number, z: number, tall = 1.45) => P.push(boxG(0.17, tall, 0.17, x, 0, z, TIMBER), boxG(0.23, 0.06, 0.23, x, tall, z, GOLD));
  const along = (a: number, b: number, fixed: number, axis: "x" | "z") => {
    const len = b - a;
    const n = Math.max(1, Math.round(len / 3));
    for (let i = 0; i <= n; i++) {
      const t = a + (len * i) / n;
      if (axis === "x") post(t, fixed);
      else post(fixed, t);
    }
    for (const y of [0.32, 0.72, 1.12]) {
      P.push(axis === "x" ? boxG(len, 0.1, 0.06, a + len / 2, y, fixed, TIMBER) : boxG(0.06, 0.1, len, fixed, y, a + len / 2, TIMBER));
    }
    // a kick board along the foot keeps sand in
    P.push(axis === "x" ? boxG(len, 0.2, 0.04, a + len / 2, 0, fixed, "#35271a") : boxG(0.04, 0.2, len, fixed, 0, a + len / 2, "#35271a"));
  };
  along(AX0, -gap, AZ0, "x");
  along(gap, AX1, AZ0, "x");
  along(AX0, AX1, AZ1, "x");
  along(AZ0, AZ1, AX0, "z");
  along(AZ0, AZ1, AX1, "z");
  return worldUV(merge(P), 0.5);
}

/* ------------------------------------------------------------------ entry portal and sign */
function portalGeo(): Geo {
  const P: Geo[] = [];
  const px = 5.9;
  for (const sx of [-1, 1]) {
    P.push(boxG(1.2, 0.5, 1.2, sx * px, 0, 0, TRIM));
    P.push(boxG(0.95, 5.0, 0.95, sx * px, 0.5, 0, "#ffffff"));
    P.push(boxG(1.35, 0.3, 1.35, sx * px, 5.5, 0, TRIM));
    P.push(chhatriG(1.5, sx * px, 5.8, 0, STONE));
  }
  P.push(boxG(2 * px - 0.4, 0.4, 0.6, 0, 5.1, 0, TRIM));
  return worldUV(merge(P), 0.22);
}

function signMesh(): THREE.Group {
  const g = new THREE.Group();
  const tex = signTexture(["THE BLACK STALLION ACADEMY", "OF HORSEMANSHIP"]);
  const mat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.55, metalness: 0.2 });
  const plane = new THREE.PlaneGeometry(10.2, 1.9);
  const a = new THREE.Mesh(plane, mat);
  a.position.set(0, 3.7, -0.34);
  a.rotation.y = Math.PI;
  const b = new THREE.Mesh(plane, mat);
  b.position.set(0, 3.7, 0.34);
  const back = new THREE.Mesh(new THREE.BoxGeometry(10.3, 2.0, 0.6), new THREE.MeshStandardMaterial({ color: "#1a1714", roughness: 0.6 }));
  back.position.set(0, 3.7, 0);
  g.add(back, a, b);
  g.traverse((o) => { if ((o as THREE.Mesh).isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  g.userData.dispose = () => { tex.dispose(); mat.dispose(); plane.dispose(); back.geometry.dispose(); (back.material as THREE.Material).dispose(); };
  return g;
}

/* ------------------------------------------------------------------ stable block (local: front +z, centred on x) */
function stableGeo(): Geo {
  const L = 66, H = 4.8, D = 9.4, bays = 15;
  const pitch = L / bays;
  const P: Geo[] = [];
  const holes: { x: number; y: number; w: number; h: number }[] = [];
  for (let i = 0; i < bays; i++) holes.push({ x: -L / 2 + (i + 0.5) * pitch, y: 0.002, w: 2.5, h: 3.3 });
  P.push(archedWallG(L, H, 0.7, holes, -0.7, "#ffffff"));
  P.push(boxG(L + 0.4, 0.45, 0.95, 0, 0, -0.34, TRIM));
  P.push(boxG(L + 0.5, 0.4, D + 0.9, 0, H, -D / 2 + 0.2, TRIM));
  P.push(boxG(L + 0.4, 0.9, 0.3, 0, H + 0.4, 0.05, "#ffffff"));
  P.push(merlonsG(L, 0, H + 1.3, 0.05, STONE, 1.6, 0.7));
  P.push(boxG(L, H, 0.6, 0, 0, -D, "#5a5045"), boxG(0.6, H, D, -L / 2, 0, -D / 2, "#5a5045"), boxG(0.6, H, D, L / 2, 0, -D / 2, "#5a5045"));
  P.push(boxG(L, 0.08, D, 0, 0, -D / 2, "#5d4d3b"));
  for (let i = 0; i <= bays; i++) {
    const x = -L / 2 + i * pitch;
    P.push(boxG(0.45, H, 0.3, x, 0, 0.0, "#ffffff"));
    if (i > 0 && i < bays) P.push(boxG(0.1, 2.3, D - 1.2, x, 0, -D / 2 - 0.2, "#4a3426"));
  }
  for (let i = 0; i < bays; i++) {
    const x = -L / 2 + (i + 0.5) * pitch;
    P.push(archFrameG(2.5, 3.3, 0.2, 0.22, x, 0, 0, TRIM));
  }
  for (const sx of [-1, 1]) P.push(chhatriG(2.2, sx * (L / 2 - 2.4), H + 0.4, -1.6, STONE));
  for (const x of [-16, -8, 8, 16]) P.push(chhatriG(1.7, x, H + 0.4, -1.4, STONE));
  // a central clock tower over the main bay
  P.push(boxG(6.4, 4.2, 5.2, 0, H + 0.4, -3.6, "#ffffff"), boxG(7.0, 0.35, 5.8, 0, H + 4.6, -3.6, TRIM));
  P.push(domeG(2.6, 0, H + 4.95, -3.6, STONE));
  P.push(archFrameG(1.8, 2.6, 0.18, 0.2, 0, H + 1.0, -1.0, TRIM), openingG(1.8, 2.6, 0, H + 1.0, -0.98));
  return worldUV(merge(P), 0.2);
}

/* ------------------------------------------------------------------ the hall (local: front +z, centred on x) */
function hallGeo(): Geo {
  const W = HALL.hw * 2, H = 11.5, D = 17, T = 1.0;
  const P: Geo[] = [];
  const holes: { x: number; y: number; w: number; h: number }[] = [];
  const dark: Geo[] = [];
  for (const sx of [-1, 1]) {
    for (let i = 0; i < 5; i++) {
      const x = sx * (11 + i * 3.8);
      holes.push({ x, y: 0.002, w: 1.7, h: 3.4 }, { x, y: 6.0, w: 1.6, h: 3.0 });
      dark.push(openingG(1.7, 3.4, x, 0.002, -T + 0.02), openingG(1.6, 3.0, x, 6.0, -T + 0.02));
    }
  }
  P.push(archedWallG(W, H, T, holes, -T, "#ffffff"), ...dark);
  P.push(boxG(W, H, D, 0, 0, -T - D, "#ffffff"));
  P.push(boxG(W + 0.6, 0.7, 1.4, 0, 0, -0.1, TRIM));
  P.push(boxG(W + 0.8, 0.45, D + 1.4, 0, 3.55, -D / 2 - 0.3, TRIM));
  P.push(boxG(W + 0.9, 0.55, D + 1.6, 0, H - 0.1, -D / 2 - 0.3, TRIM));
  P.push(boxG(W + 0.5, 1.2, 0.42, 0, H + 0.45, -0.05, "#ffffff"));
  P.push(merlonsG(W, 0, H + 1.65, -0.05, STONE, 1.6, 0.8));
  for (const sx of [-1, 1]) for (let i = 0; i < 5; i++) {
    const x = sx * (11 + i * 3.8);
    P.push(archFrameG(1.7, 3.4, 0.2, 0.2, x, 0, 0, TRIM), archFrameG(1.6, 3.0, 0.18, 0.2, x, 6.0, 0, TRIM));
  }
  for (const sx of [-1, 1]) {
    P.push(chhatriG(2.8, sx * (W / 2 - 2.2), H + 0.5, -2.2, STONE));
    P.push(chhatriG(2.2, sx * 19, H + 0.5, -2.0, STONE));
    P.push(jharokhaG(sx * 7.4, 5.2, 0, STONE));
  }
  // central pavilion with the great door, a dome and finials
  const cw = 15, ch = 17, cd = 5;
  P.push(archedWallG(cw, ch, cd, [{ x: 0, y: 0.002, w: 6.4, h: 9.6 }], 0, STONE));
  P.push(archFrameG(6.4, 9.6, 0.5, 0.5, 0, 0, cd, TRIM));
  P.push(openingG(6.4, 9.6, 0, 0, -0.2, "#17110d"));
  P.push(boxG(cw + 0.6, 0.6, cd + 0.6, 0, ch - 0.2, cd / 2, TRIM));
  P.push(merlonsG(cw, 0, ch + 0.4, cd - 0.15, STONE, 1.5, 0.75));
  P.push(domeG(5.2, 0, ch + 0.4, cd / 2 - 0.5, STONE));
  for (const sx of [-1, 1]) {
    P.push(chhatriG(2.6, sx * (cw / 2 - 1.1), ch + 0.4, cd - 1.4, STONE));
    P.push(boxG(2.0, 1.0, 1.8, sx * 5.4, 11.5, cd - 0.2, TRIM));
  }
  P.push(archFrameG(2.0, 3.6, 0.22, 0.22, 0, 11.6, cd, TRIM), openingG(2.0, 3.6, 0, 11.6, cd + 0.02));
  // steps
  for (let i = 0; i < 5; i++) P.push(boxG(13 + i * 1.6, 0.18, 6 - i * 0.9, 0, i * 0.18, cd + 0.4 + 3 - (6 - i * 0.9) / 2 + 0.8, "#cdbd9f"));
  return worldUV(merge(P), 0.18);
}

/* ------------------------------------------------------------------ arena furniture */
function poleX(len: number, y: number, x: number, z: number, parts = 6): Geo[] {
  const out: Geo[] = [];
  for (let i = 0; i < parts; i++) {
    const g = new THREE.CylinderGeometry(0.055, 0.055, len / parts, 8, 1);
    g.rotateZ(Math.PI / 2);
    g.translate(x - len / 2 + (i + 0.5) * (len / parts), y, z);
    out.push(paintColor(g, i % 2 ? GOLD : "#2a211a"));
  }
  return out;
}
function paintColor(g: Geo, c: string): Geo {
  const col = new THREE.Color(c);
  const n = g.attributes.position.count;
  const arr = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { arr[i * 3] = col.r; arr[i * 3 + 1] = col.g; arr[i * 3 + 2] = col.b; }
  g.setAttribute("color", new THREE.BufferAttribute(arr, 3));
  return g;
}
function jumpsGeo(): Geo {
  const P: Geo[] = [];
  // a vertical with wings, and a spread fence behind it
  for (const [z, spread] of [[56, false], [74, true]] as const) {
    for (const sx of [-1, 1]) {
      P.push(boxG(0.22, 1.7, 0.22, sx * 1.75, 0, z, TIMBER), boxG(0.3, 0.08, 0.3, sx * 1.75, 1.7, z, GOLD));
      if (spread) P.push(boxG(0.22, 1.5, 0.22, sx * 1.75, 0, z + 1.3, TIMBER), boxG(0.3, 0.08, 0.3, sx * 1.75, 1.5, z + 1.3, GOLD));
    }
    for (const y of [0.55, 0.95, 1.35]) P.push(...poleX(3.5, y, 0, z));
    if (spread) for (const y of [0.8, 1.2]) P.push(...poleX(3.5, y, 0, z + 1.3));
    P.push(boxG(2.6, 0.3, 0.12, 0, 0.25, z - 0.02, "#33261b"));
  }
  // cavaletti at both sides of the arena, outside the track
  for (const x of [-19.5, 19.5]) {
    for (let i = 0; i < 4; i++) {
      const z = 58 + i * 1.35;
      P.push(...poleX(3.0, 0.2, x, z, 4));
      for (const sx of [-1, 1]) P.push(boxG(0.18, 0.16, 0.18, x + sx * 1.4, 0, z, TIMBER));
    }
  }
  // a mounting block near the gate
  P.push(boxG(1.3, 0.25, 1.0, 8.5, 0, 26.5, "#9a8a70"), boxG(0.9, 0.25, 0.7, 8.5, 0.25, 26.5, "#8a7a62"), boxG(0.5, 0.25, 0.4, 8.5, 0.5, 26.5, "#7a6a54"));
  return merge(P);
}

function letterMesh(): THREE.Group {
  const g = new THREE.Group();
  const spots: [string, number, number, number][] = [
    ["A", 0, AZ0 + 0.1, 0], ["K", AX0 + 0.1, 32, Math.PI / 2], ["E", AX0 + 0.1, 62, Math.PI / 2], ["H", AX0 + 0.1, 92, Math.PI / 2],
    ["C", 0, AZ1 - 0.1, Math.PI], ["M", AX1 - 0.1, 92, -Math.PI / 2], ["B", AX1 - 0.1, 62, -Math.PI / 2], ["F", AX1 - 0.1, 32, -Math.PI / 2],
  ];
  const geo = new THREE.PlaneGeometry(0.55, 0.55);
  const texes: THREE.Texture[] = [];
  for (const [ch, x, z, ry] of spots) {
    const c = document.createElement("canvas");
    c.width = c.height = 96;
    const k = c.getContext("2d")!;
    k.fillStyle = "#f3ecde"; k.fillRect(0, 0, 96, 96);
    k.strokeStyle = "#2a211a"; k.lineWidth = 5; k.strokeRect(5, 5, 86, 86);
    k.fillStyle = "#2a211a"; k.font = "600 62px Georgia, serif"; k.textAlign = "center"; k.textBaseline = "middle"; k.fillText(ch, 48, 52);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    texes.push(t);
    const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: t, roughness: 0.8 }));
    m.position.set(x, 1.15, z);
    m.rotation.y = ry;
    // letters face into the arena from just inside the fence
    m.position.x += Math.sin(ry) * 0.14;
    m.position.z += Math.cos(ry) * 0.14;
    g.add(m);
  }
  g.userData.dispose = () => { geo.dispose(); texes.forEach((t) => t.dispose()); g.children.forEach((c) => ((c as THREE.Mesh).material as THREE.Material).dispose()); };
  return g;
}

/* ------------------------------------------------------------------ drive dressing */
function lampGeo(): Geo {
  const P: Geo[] = [];
  P.push(cylG(0.07, 0.11, 3.6, 8, 0, 0, 0, "#2a2420"), boxG(0.4, 0.5, 0.4, 0, 3.6, 0, "#c9a66b"), boxG(0.5, 0.08, 0.5, 0, 4.1, 0, "#2a2420"), boxG(0.3, 0.3, 0.3, 0, 3.65, 0, "#fff0c8"));
  return merge(P);
}
function railGeo(): Geo {
  // one six-metre bay of a timber post-and-rail paddock fence (posts at both ends, shared with the next bay)
  const P: Geo[] = [];
  for (const x of [-3, 3]) P.push(boxG(0.14, 1.3, 0.14, x, 0, 0, TIMBER), boxG(0.19, 0.05, 0.19, x, 1.3, 0, TRIM));
  for (const y of [0.52, 0.98]) P.push(boxG(6, 0.12, 0.07, 0, y, 0.03, TIMBER));
  return merge(P);
}
function treeTrunkGeo(): Geo {
  return merge([cylG(0.22, 0.4, 4.2, 8, 0, 0, 0, "#4b3a2b"), cylG(0.12, 0.2, 2.4, 6, 0.6, 3.0, 0.3, "#4b3a2b"), cylG(0.1, 0.18, 2.2, 6, -0.5, 3.2, -0.3, "#4b3a2b")]);
}
function treeCrownGeo(): Geo {
  return crownG(3.6, 7, 0, 6.4, 0, "#5a8a3e", 31, 0.7);
}

export function createCampus(quality: Quality): Environment {
  setLod(quality.tier >= 2 ? 0.5 : 1);
  const group = new THREE.Group();
  group.name = "env-campus";
  const style = { sandLight: "#d6bb92", sandDark: "#b5966a", accent: "#587a3c", windDir: new THREE.Vector2(1, 0.3) };
  const near = new Terrain("campus", style, { size: 200, segments: quality.terrainSegments });
  const far = new Terrain("campus", style, { size: 1400, segments: 120, yOffset: -0.06 });
  group.add(far.mesh, near.mesh);

  const plaster = plasterTexture(11);
  const wood = woodTexture(4, [70, 48, 32]);
  wood.repeat.set(1, 1);
  const leaves = foliageTexture(31);
  const plasterMat = new THREE.MeshStandardMaterial({ map: plaster, vertexColors: true, roughness: 0.95 });
  const woodMat = new THREE.MeshStandardMaterial({ map: wood, vertexColors: true, roughness: 0.85 });
  const plainMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9 });
  const leafMat = new THREE.MeshStandardMaterial({ map: leaves, vertexColors: true, roughness: 0.9 });

  const solids: THREE.Mesh[] = [];
  const solid = (geo: Geo, mat: THREE.Material, x: number, z: number, ry: number, shadow = true) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, terrainHeight("campus", x, z), z);
    m.rotation.y = ry;
    m.castShadow = shadow;
    m.receiveShadow = true;
    solids.push(m);
    group.add(m);
    return m;
  };
  solid(fenceGeo(), woodMat, 0, 0, 0);
  solid(portalGeo(), plasterMat, 0, AZ0, 0);
  const sign = signMesh();
  sign.position.set(0, 0, AZ0);
  group.add(sign);
  solid(stableGeo(), plasterMat, STABLE.x1, 62, Math.PI / 2);
  solid(hallGeo(), plasterMat, 0, HALL.z, Math.PI);
  solid(jumpsGeo(), plainMat, 0, 0, 0);
  const letters = letterMesh();
  group.add(letters);

  /* ---- avenue trees, lamps and paddock rails along the drive; scattered trees round the grounds */
  const drive = (place: (cj: number) => Instance[]) => (ci: number, cj: number) => (ci === 0 ? place(cj) : []);
  const AVENUE = 14; // lamp spacing
  const TREE_GAP = 28; // a tree every 28 m: the avenue was a dark tunnel at 14, and its shadow swallowed the horse's hooves
  const avenue = (cj: number): Instance[] => {
    const z = (cj + 0.5) * TREE_GAP;
    if (z > AZ0 - 4) return [];
    return [-1, 1].map((s, i) => {
      const k = 0.88 + 0.1 * Math.sin(z * 1.3 + i * 2.1);
      return { x: s * 10.5, y: terrainHeight("campus", s * 10.5, z) - 0.05, z, rotY: z * 1.7, sx: k, sy: k, sz: k, color: new THREE.Color(1.08, 1, 0.88) };
    });
  };
  const trunks = new Scatter(treeTrunkGeo(), plainMat, 60, TREE_GAP, 150, drive(avenue), { castShadow: true, colored: true });
  const crowns = new Scatter(treeCrownGeo(), leafMat, 60, TREE_GAP, 150, drive(avenue), { castShadow: true, colored: true });
  const lamps = new Scatter(lampGeo(), plainMat, 60, AVENUE, 130, drive((cj) => {
    const z = (cj + 0.5) * AVENUE + 7;
    if (z > AZ0 - 3) return [];
    return [-1, 1].map((s) => ({ x: s * 4.9, y: terrainHeight("campus", s * 4.9, z), z, rotY: 0, sx: 1, sy: 1, sz: 1, color: new THREE.Color(1, 1, 1) }));
  }), { castShadow: true, colored: true });
  const rails = new Scatter(railGeo(), woodMat, 80, 6, 130, (ci, cj) => {
    if (ci !== 0) return [];
    const z = (cj + 0.5) * 6;
    if (z > AZ0 - 2) return [];
    return [-1, 1].map((s) => ({ x: s * 5.8, y: terrainHeight("campus", s * 5.8, z) - 0.02, z, rotY: Math.PI / 2, sx: 1, sy: 1, sz: 1, color: new THREE.Color(1, 1, 1) }));
  }, { castShadow: true, colored: true });
  // grounds: trees outside the arena, away from the buildings and the drive
  const groundTrees = (ci: number, cj: number): Instance[] => {
    const r = mulberry32(((ci * 49979687) ^ (cj * 1299721) ^ 0x51ed27) >>> 0);
    const out: Instance[] = [];
    const n = r() < 0.7 ? 1 + Math.floor(r() * 2) : 0;
    for (let i = 0; i < n; i++) {
      const x = (ci + r()) * 36, z = (cj + r()) * 36;
      if (insideArena(x, z, 7) || Math.abs(x) < 17 && z < AZ0 + 2) continue;
      if (x > STABLE.x0 - 8 && x < STABLE.x1 + 8 && z > STABLE.z0 - 8 && z < STABLE.z1 + 8) continue;
      if (Math.abs(x) < HALL.hw + 8 && z > HALL.z - 8 && z < HALL.z + 26) continue;
      const sc = 0.8 + r() * 0.7;
      out.push({ x, y: terrainHeight("campus", x, z) - 0.05, z, rotY: r() * 6.28, sx: sc, sy: sc, sz: sc, color: new THREE.Color().setHSL(0.27 + r() * 0.03, 0.42, 0.9 + r() * 0.25) });
    }
    return out;
  };
  const gTrunks = new Scatter(treeTrunkGeo(), plainMat, 70, 36, 220, groundTrees, { castShadow: true, colored: true });
  const gCrowns = new Scatter(treeCrownGeo(), leafMat, 70, 36, 220, groundTrees, { castShadow: true, colored: true });

  // distant ridges: low rounded hills in the haze
  const hillGeo = (() => {
    const g = new THREE.SphereGeometry(1, 18, 8, 0, Math.PI * 2, 0, Math.PI / 2);
    const p = g.attributes.position;
    const col = new Float32Array(p.count * 3);
    for (let i = 0; i < p.count; i++) {
      const n = 0.82 + 0.35 * vnoise(p.getX(i) * 2.2, p.getZ(i) * 2.2, 61);
      p.setY(i, p.getY(i) * n);
      const h = p.getY(i);
      col[i * 3] = 0.42 + 0.12 * h; col[i * 3 + 1] = 0.5 + 0.1 * h; col[i * 3 + 2] = 0.36 + 0.1 * h;
    }
    g.setAttribute("color", new THREE.BufferAttribute(col, 3));
    g.computeVertexNormals();
    return g;
  })();
  const hills = new Scatter(hillGeo, plainMat, 40, 260, 1000, (ci, cj) => {
    const r = mulberry32(((ci * 2654435761) ^ (cj * 40503) ^ 77) >>> 0);
    const x = (ci + r()) * 260, z = (cj + r()) * 260;
    if (Math.hypot(x, z - 60) < 520 || r() < 0.3) return [];
    const sx = 140 + r() * 220, sy = 32 + r() * 70;
    return [{ x, y: -3, z, rotY: r() * 6.28, sx, sy, sz: sx * (0.5 + r() * 0.5), color: new THREE.Color(1, 1, 1) }];
  }, { receiveShadow: false, colored: true });

  const tuftTex = grassTuftTexture();
  const cards: Geo[] = [];
  for (let k = 0; k < 3; k++) { const g = new THREE.PlaneGeometry(1, 0.7); g.translate(0, 0.35, 0); g.rotateY((k * Math.PI) / 3); cards.push(g); }
  const tufts = new Scatter(merge(cards), new THREE.MeshStandardMaterial({ map: tuftTex, alphaTest: 0.45, side: THREE.DoubleSide, roughness: 1 }), 600, 10, 70, (ci, cj) => {
    const r = mulberry32(((ci * 73856093) ^ (cj * 19349663) ^ 0x1234) >>> 0);
    const out: Instance[] = [];
    const n = 2 + Math.floor(r() * 4);
    for (let i = 0; i < n; i++) {
      const x = (ci + r()) * 10, z = (cj + r()) * 10;
      if (insideArena(x, z, 3) || Math.abs(x) < 6.5 || vnoise(x * 0.05, z * 0.05, 71) < 0.42) continue;
      const sc = 0.25 + r() * 0.4;
      out.push({ x, y: terrainHeight("campus", x, z) - 0.02, z, rotY: r() * 6.28, sx: sc, sy: sc, sz: sc, color: new THREE.Color().setHSL(0.2 + r() * 0.04, 0.35, 0.45 + r() * 0.12) });
    }
    return out;
  }, { colored: true, receiveShadow: false });

  const scatters = [trunks, crowns, lamps, rails, gTrunks, gCrowns, hills, tufts];
  for (const s of scatters) group.add(s.mesh);

  /* ---- the track: down the drive, in through the gate, then a clockwise oval round the arena */
  const pts: THREE.Vector2[] = [];
  for (let z = 0; z <= AZ0; z += 2) pts.push(new THREE.Vector2(0, z));
  const C = new THREE.Vector2(0, 64), ax = 14, az = 24;
  const west = new THREE.Vector2(C.x - ax, C.y);
  // a smooth S from the gate to the west side of the oval (cubic Bezier, tangent +z at both ends)
  const bez = new THREE.CubicBezierCurve(new THREE.Vector2(0, AZ0), new THREE.Vector2(0, AZ0 + 18), new THREE.Vector2(west.x, west.y - 16), west);
  for (const p of bez.getSpacedPoints(24).slice(1)) pts.push(p);
  let loopAt = 0;
  {
    let len = 0;
    for (let i = 1; i < pts.length; i++) len += pts[i].distanceTo(pts[i - 1]);
    loopAt = len;
  }
  for (let k = 1; k <= 160; k++) {
    const phi = Math.PI - (k / 160) * Math.PI * 2;
    pts.push(new THREE.Vector2(C.x + ax * Math.cos(phi), C.y + az * Math.sin(phi)));
  }
  const path = new PathFollower(pts, loopAt);

  const arena: Surface = { dust: 0.8, prints: 0.8, color: new THREE.Color("#cdb088"), hardness: 0.3 };
  const gravel: Surface = { dust: 0.45, prints: 0.25, color: new THREE.Color("#a89b84"), hardness: 0.8 };
  const lawn: Surface = { dust: 0.1, prints: 0.2, color: new THREE.Color("#9aa57a"), hardness: 0.5 };

  const env: Environment = {
    id: "campus", group, terrain: near, atmosphere: ATMOSPHERES.campus, wind: new THREE.Vector3(1.4, 0, 0.5),
    start: { x: 0, z: 0, heading: 0 }, path, shadowRadius: 14,
    surface: (x, z) => (insideArena(x, z) ? arena : Math.abs(x) < 3.2 && z < AZ0 ? gravel : lawn),
    avoidCamera(p) {
      // keep the lens out of the stable block and the hall, and off the sign
      if (p.y < 7.2 && p.x < STABLE.x1 - 0.8 && p.x > STABLE.x0 - 1 && p.z > STABLE.z0 - 1 && p.z < STABLE.z1 + 1) p.x = STABLE.x1 - 0.8;
      if (p.y < 18 && p.z > HALL.z - 20 && Math.abs(p.x) < HALL.hw + 2) p.z = HALL.z - 20;
      if (Math.abs(p.z - AZ0) < 1.4 && p.y < 5.9 && Math.abs(p.x) > 5.1) p.x = Math.sign(p.x) * 5.1;
      // the avenue: neem crowns (3.6 m radius, from 2.8 m up) and trunks every 14 m at x = ±10.5, lamp posts at x = ±4.9 halfway between
      if (p.z < AZ0 && p.y < 10.4) {
        const tz = (Math.round(p.z / TREE_GAP - 0.5) + 0.5) * TREE_GAP;
        const lz = (Math.round((p.z - 7) / AVENUE - 0.5) + 0.5) * AVENUE + 7;
        const keep = (cx: number, cz: number, r: number) => {
          const dx = p.x - cx, dz = p.z - cz, d = Math.hypot(dx, dz);
          if (d >= r) return;
          if (d < 0.01) {
            p.x = cx + Math.sign(cx) * r; // dead centre: out toward the verge
            return;
          }
          p.x = cx + (dx * r) / d;
          p.z = cz + (dz * r) / d;
        };
        if (tz <= AZ0 - 4) for (const s of [-1, 1]) keep(s * 10.5, tz, p.y > 2.8 ? 4.4 : 2);
        if (lz <= AZ0 - 3 && p.y < 4.4) for (const s of [-1, 1]) keep(s * 4.9, lz, 2.4);
      }
    },
    update(_dt, focus, time, q) {
      near.update(focus.x, focus.z, time);
      far.update(focus.x, focus.z, time);
      trunks.update(focus.x, focus.z, Math.max(0.55, q.scatter));
      crowns.update(focus.x, focus.z, Math.max(0.55, q.scatter));
      lamps.update(focus.x, focus.z, q.scatter);
      rails.update(focus.x, focus.z, q.scatter);
      gTrunks.update(focus.x, focus.z, q.scatter);
      gCrowns.update(focus.x, focus.z, q.scatter);
      hills.update(focus.x, focus.z, 1);
      tufts.update(focus.x, focus.z, q.scatter);
    },
    dispose() {
      near.dispose(); far.dispose();
      for (const s of scatters) { s.mesh.geometry.dispose(); s.dispose(); }
      for (const m of solids) m.geometry.dispose();
      (sign.userData.dispose as () => void)();
      (letters.userData.dispose as () => void)();
      for (const m of [plasterMat, woodMat, plainMat, leafMat]) m.dispose();
      plaster.dispose(); wood.dispose(); leaves.dispose(); tuftTex.dispose();
    },
  };
  return env;
}
