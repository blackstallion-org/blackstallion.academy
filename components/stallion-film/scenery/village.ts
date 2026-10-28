import * as THREE from "three";
import { ATMOSPHERES } from "../sky";
import { PLAZA, Terrain, terrainHeight, villagePaving } from "../terrain";
import { PathFollower, Scatter, type Environment, type Instance, type Quality } from "../environment";
import { foliageTexture, grassTuftTexture, plasterTexture, sandstoneTexture } from "../textures";
import { hash2, mulberry32, smoothstep, vnoise } from "../noise";
import type { Surface } from "../locomotion";
import { setLod, archFrameG, archedWallG, boxG, chhatriG, crownG, cylG, domeG, jharokhaG, merge, merlonsG, openingG, paint, potG, worldUV, type Geo } from "./geo";

/**
 * Chapter II — "Identity". A Marwari village street in mid-afternoon: lime-washed havelis and cottages facing a stone-paved lane,
 * a sandstone gateway (pol), and a square with a banyan on a platform and a well. The street repeats along z, so it never ends;
 * everything is placed by cell from a hash, nothing is stored.
 */
const STREET = 7.4; // half width of the street between house fronts
const GATE_Z = 30;
const ROW = 12;

const STONE = "#d2ad7c";
const WASH = ["#f3eee3", "#efe4cd", "#dcb582", "#93b3d0", "#e4bba9", "#f6f0e4"];

function periodic(z: number, at: number, period: number) {
  return ((((z - at + period / 2) % period) + period) % period) - period / 2;
}
const plazaDist = (z: number) => Math.abs(periodic(z, PLAZA.z, PLAZA.period));
const gateDist = (z: number) => Math.abs(periodic(z, GATE_Z, PLAZA.period));
/** Where the house fronts stand: the street widens round the squares. */
const frontLine = (z: number) => STREET + 9.4 * (1 - smoothstep(PLAZA.r + 2, PLAZA.r + 13, plazaDist(z)));

/* ------------------------------------------------------------------ building geometry (local: +z is the front, base at y = 0) */
function haveliGeo(): Geo {
  const W = 10, D = 8, H = 6.4, zf = D / 2;
  const P: Geo[] = [];
  P.push(boxG(W, H, D, 0, 0, 0, "#ffffff"));
  P.push(boxG(W + 0.34, 0.55, D + 0.34, 0, 0, 0, STONE));                         // plinth
  P.push(boxG(W + 0.24, 0.22, D + 0.24, 0, 3.2, 0, STONE));                       // string course between the floors
  P.push(boxG(W + 0.44, 0.3, D + 0.44, 0, H - 0.15, 0, STONE));                   // cornice
  P.push(boxG(W + 0.2, 0.8, 0.3, 0, H + 0.15, zf + 0.05, "#ffffff"), boxG(W + 0.2, 0.8, 0.3, 0, H + 0.15, -zf - 0.05, "#ffffff"));
  P.push(boxG(0.3, 0.8, D + 0.2, W / 2 + 0.05, H + 0.15, 0, "#ffffff"), boxG(0.3, 0.8, D + 0.2, -W / 2 - 0.05, H + 0.15, 0, "#ffffff"));
  P.push(merlonsG(W, 0, H + 0.95, zf + 0.05, STONE), merlonsG(W, 0, H + 0.95, -zf - 0.05, STONE));
  for (const sx of [-1, 1]) P.push(boxG(0.5, H, 0.2, sx * (W / 2 - 0.25), 0, zf + 0.02, STONE));      // quoins
  // ground floor: a pointed doorway and two small barred windows
  P.push(archFrameG(1.7, 2.7, 0.22, 0.22, 0, 0.3, zf, STONE), openingG(1.7, 2.7, 0, 0.3, zf + 0.03));
  for (const sx of [-1, 1]) P.push(archFrameG(0.8, 1.2, 0.14, 0.16, sx * 3.1, 1.15, zf, STONE), openingG(0.8, 1.2, sx * 3.1, 1.15, zf + 0.03, "#241a14"));
  // first floor: two arched windows and the jharokha over the door
  for (const sx of [-1, 1]) {
    P.push(archFrameG(0.95, 1.55, 0.16, 0.18, sx * 3.5, 3.85, zf, STONE), openingG(0.95, 1.55, sx * 3.5, 3.85, zf + 0.03));
    P.push(archFrameG(0.7, 1.15, 0.12, 0.14, sx * 1.95, 4.1, zf, STONE), openingG(0.7, 1.15, sx * 1.95, 4.1, zf + 0.03));
  }
  P.push(jharokhaG(0, 3.55, zf, STONE));
  // roof furniture
  for (const sx of [-1, 1]) P.push(chhatriG(2.0, sx * 3.6, H + 0.3, zf - 1.3, STONE));
  P.push(boxG(2.2, 1.0, 2.2, -2.5, H + 0.3, -1.5, "#ffffff"));                                          // stair head
  return worldUV(merge(P), 0.22);
}

function cottageGeo(): Geo {
  const W = 8.4, D = 6.2, H = 3.6, zf = D / 2;
  const WOOD = "#4a3324";
  const P: Geo[] = [];
  P.push(boxG(W, H, D, 0, 0, 0, "#ffffff"));
  P.push(boxG(W + 0.24, 0.42, D + 0.24, 0, 0, 0, STONE));
  P.push(boxG(W + 0.7, 0.28, D + 0.7, 0, H, 0, STONE));                                                  // roof slab with an overhang
  P.push(boxG(W + 0.6, 0.5, 0.22, 0, H + 0.28, zf + 0.3, "#ffffff"), boxG(W + 0.6, 0.5, 0.22, 0, H + 0.28, -zf - 0.3, "#ffffff"));
  P.push(boxG(0.22, 0.5, D + 0.6, W / 2 + 0.3, H + 0.28, 0, "#ffffff"), boxG(0.22, 0.5, D + 0.6, -W / 2 - 0.3, H + 0.28, 0, "#ffffff"));
  // verandah on four posts
  const zp = zf + 1.55;
  P.push(boxG(7.8, 0.22, 1.9, 0, 0, zf + 0.85, STONE));
  for (const x of [-3.3, -1.1, 1.1, 3.3]) P.push(cylG(0.11, 0.13, 2.85, 8, x, 0.22, zp, WOOD));
  P.push(boxG(7.9, 0.24, 0.3, 0, 3.07, zp, WOOD));
  P.push(boxG(8.3, 0.14, 2.1, 0, 3.31, zf + 0.9, STONE));
  P.push(archFrameG(1.5, 2.45, 0.18, 0.2, 0, 0.22, zf, STONE), openingG(1.5, 2.45, 0, 0.22, zf + 0.03, WOOD));
  for (const sx of [-1, 1]) P.push(archFrameG(0.8, 1.25, 0.13, 0.15, sx * 2.7, 1.2, zf, STONE), openingG(0.8, 1.25, sx * 2.7, 1.2, zf + 0.03));
  P.push(cylG(0.5, 0.5, 0.9, 10, 2.6, H + 0.28, -1.2, "#8d6f55"));                                       // roof water drum
  return worldUV(merge(P), 0.22);
}

function hutGeo(): Geo {
  const P: Geo[] = [];
  P.push(cylG(2.4, 2.5, 2.3, 18, 0, 0, 0, "#ffffff"));
  P.push(cylG(2.55, 2.6, 0.38, 18, 0, 0, 0, "#cdb48f"));
  P.push(cylG(0.08, 3.2, 2.5, 18, 0, 2.2, 0, "#bd9d60"));                                                // thatch cone
  const rim = cylG(3.25, 3.25, 0.12, 18, 0, 2.18, 0, "#8d7142");
  P.push(rim);
  P.push(archFrameG(0.95, 1.7, 0.12, 0.14, 0, 0.1, 2.38, "#cdb48f"), openingG(0.95, 1.7, 0, 0.1, 2.41, "#241a14"));
  P.push(merge([cylG(0.05, 0.05, 0.9, 6, 0, 4.55, 0, "#6b4f32")]));
  return worldUV(merge(P), 0.22);
}

/** A compound wall with a timber gate and the roof of the house behind it. The wall's front face is at z = 0. */
function compoundGeo(): Geo {
  const W = 10, T = 0.55, H = 2.7;
  const WOOD = "#4a3324";
  const P: Geo[] = [];
  P.push(archedWallG(W, H, T, [{ x: 0, y: 0.002, w: 2.3, h: 2.35 }], -T, "#ffffff"));
  P.push(boxG(W + 0.1, 0.22, T + 0.2, 0, H, -T / 2, STONE));
  P.push(openingG(2.3, 2.35, 0, 0, 0.02, WOOD));
  for (const sx of [-1, 1]) {
    P.push(boxG(0.7, 3.5, 0.75, sx * 1.65, 0, -T / 2, "#ffffff"));
    P.push(boxG(0.9, 0.2, 0.95, sx * 1.65, 3.5, -T / 2, STONE));
    P.push(domeG(0.42, sx * 1.65, 3.7, -T / 2, STONE));
  }
  P.push(boxG(7.2, 3.4, 5.0, 0.4, 0, -4.2, "#ffffff"));                                                  // the house behind
  P.push(boxG(7.8, 0.26, 5.6, 0.4, 3.4, -4.2, STONE));
  return worldUV(merge(P), 0.22);
}

/** The pol: a sandstone gateway across the street, a wide pointed arch under a parapet with chhatris. z = 0 is the passage's middle. */
function gateGeo(): Geo {
  const W = STREET * 2 + 1.6, H = 9.4, T = 3.2, AW = 11, AH = 7.2;
  const STN = "#e2c395", DARK = "#c9a574";
  const P: Geo[] = [];
  P.push(archedWallG(W, H, T, [{ x: 0, y: 0.002, w: AW, h: AH }], -T / 2, "#ffffff"));
  P.push(archFrameG(AW, AH, 0.5, 0.5, 0, 0, T / 2, DARK));
  P.push(archFrameG(AW, AH, 0.5, 0.5, 0, 0, -T / 2 - 0.5, DARK));
  P.push(boxG(W + 0.5, 0.5, T + 0.5, 0, H - 0.2, 0, DARK));
  P.push(boxG(W, 1.0, 0.36, 0, H + 0.3, T / 2 - 0.1, STN), boxG(W, 1.0, 0.36, 0, H + 0.3, -T / 2 + 0.1, STN));
  P.push(merlonsG(W, 0, H + 1.3, T / 2 - 0.1, STN, 1.3, 0.62), merlonsG(W, 0, H + 1.3, -T / 2 + 0.1, STN, 1.3, 0.62));
  for (const sx of [-1, 1]) {
    P.push(boxG(2.2, 1.6, 2.4, sx * (W / 2 - 1.3), H + 0.3, 0, DARK));
    P.push(chhatriG(2.2, sx * (W / 2 - 1.3), H + 1.9, 0, STN));
    P.push(chhatriG(1.7, sx * 3.6, H + 0.3, 0, STN));
  }
  P.push(chhatriG(2.7, 0, H + 0.3, 0, STN));
  return worldUV(merge(P), 0.2);
}

/** The square's centrepiece: a banyan on a round stone platform, and a well on the other side of the lane. Origin = square's centre. */
function squareGeo(): Geo {
  const P: Geo[] = [];
  const BX = -6.6;
  P.push(cylG(3.55, 3.7, 0.2, 28, BX, 0, 0, "#c9a574"));
  P.push(cylG(3.0, 3.15, 0.6, 28, BX, 0.2, 0, STONE));
  P.push(cylG(0.5, 0.82, 4.8, 12, BX, 0.8, 0, "#4a3a2b"));
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2 + 0.3;
    const r = 1.6 + 1.7 * hash2(i, 5, 1);
    P.push(cylG(0.05, 0.1, 4.4 + hash2(i, 5, 2), 5, BX + Math.cos(a) * r, 0.8, Math.sin(a) * r, "#4a3a2b"));
  }
  for (let i = 0; i < 3; i++) P.push(potG(0.5, BX + 1.7 - i * 0.9, 0.8, 2.1 - i * 0.3, "#a8623b"));
  // the well
  const WX = 7.4, WZ = -2.0;
  P.push(cylG(1.2, 1.3, 1.0, 16, WX, 0, WZ, STONE));
  P.push(cylG(0.82, 0.82, 0.05, 16, WX, 0.98, WZ, "#0c0a08"));
  for (const sz of [-1, 1]) P.push(boxG(0.16, 2.6, 0.16, WX, 0, WZ + sz * 1.05, "#4a3324"));
  P.push(boxG(0.14, 0.14, 2.4, WX, 2.5, WZ, "#4a3324"));
  P.push(cylG(0.2, 0.2, 0.18, 10, WX, 2.43, WZ, "#33261b"));
  P.push(boxG(0.06, 0.06, 0.06, WX, 1.2, WZ, "#33261b"));
  P.push(potG(0.5, WX - 1.7, 0, WZ + 0.6, "#a8623b"), potG(0.46, WX - 1.3, 0, WZ - 0.6, "#b6704a"));
  return worldUV(merge(P), 0.22);
}

function bayanCrownGeo(): Geo {
  return crownG(4.3, 8, -6.6, 7.2, 0, "#5f7f45", 11, 0.5);
}

/* ------------------------------------------------------------------ street props */
function potsGeo(): Geo {
  const P: Geo[] = [];
  P.push(boxG(2.4, 0.5, 0.7, 0, 0, 0, "#c9a574"));
  for (let i = 0; i < 4; i++) P.push(potG(0.42 + 0.1 * hash2(i, 3, 1), -0.8 + i * 0.55, 0.5, 0.0, i % 2 ? "#a8623b" : "#b6704a"));
  P.push(potG(0.62, 1.3, 0, 0.9, "#a8623b"), potG(0.55, 1.85, 0, 0.5, "#b6704a"));
  return merge(P);
}
function hayGeo(): Geo {
  const P: Geo[] = [];
  const g = new THREE.SphereGeometry(1.15, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2);
  g.scale(1, 1.25, 1);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) p.setXYZ(i, p.getX(i) * (1 + 0.1 * (hash2(i, 2, 1) - 0.5)), p.getY(i), p.getZ(i) * (1 + 0.1 * (hash2(i, 2, 2) - 0.5)));
  g.computeVertexNormals();
  P.push(paint(g, "#c4a560", 0.14, 3));
  for (const sx of [-1, 1]) P.push(cylG(0.07, 0.08, 1.2, 6, sx * 2.1, 0, 0.2, "#4a3324"));
  P.push(boxG(4.4, 0.08, 0.1, 0, 0.55, 0.2, "#4a3324"), boxG(4.4, 0.08, 0.1, 0, 0.95, 0.2, "#4a3324"));
  return merge(P);
}
function charpoyGeo(): Geo {
  const P: Geo[] = [];
  P.push(boxG(2.0, 0.08, 1.05, 0, 0.42, 0, "#5b4330"));
  P.push(boxG(1.84, 0.02, 0.9, 0, 0.5, 0, "#b79a6a"));
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) P.push(boxG(0.1, 0.46, 0.1, sx * 0.92, 0, sz * 0.46, "#5b4330"));
  P.push(boxG(1.0, 0.1, 0.6, 2.0, 0, 0.1, "#9d8a6a"));
  P.push(potG(0.45, 2.1, 0.1, 0.1, "#a8623b"));
  return merge(P);
}
function neemCrownGeo(): Geo {
  return crownG(3.2, 6, 0, 5.2, 0, "#648a43", 21, 0.66);
}
function neemGeo(): Geo {
  const P: Geo[] = [];
  P.push(cylG(0.2, 0.34, 3.4, 7, 0, 0, 0, "#4b3a2b"));
  P.push(cylG(0.1, 0.16, 2.0, 6, 0.5, 2.4, 0.2, "#4b3a2b"));
  return merge(P);
}

function makeScatter(geo: Geo, mat: THREE.Material, max: number, cell: number, radius: number, place: (cj: number) => Instance[], castShadow = true, colored = true) {
  return new Scatter(geo, mat, max, cell, radius, (ci, cj) => (ci === 0 ? place(cj) : []), { castShadow, colored });
}

export function createVillage(quality: Quality): Environment {
  setLod(quality.tier >= 2 ? 0.5 : 1);
  const group = new THREE.Group();
  group.name = "env-village";
  const style = { sandLight: "#dcc39b", sandDark: "#b79568", accent: "#7b6a45", windDir: new THREE.Vector2(1, 0.3) };
  const near = new Terrain("village", style, { size: 200, segments: quality.terrainSegments });
  const far = new Terrain("village", style, { size: 1400, segments: 120, yOffset: -0.06 });
  group.add(far.mesh, near.mesh);

  const plaster = plasterTexture(7);
  const plasterMat = new THREE.MeshStandardMaterial({ map: plaster, vertexColors: true, roughness: 0.96 });
  const vertexMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95 });
  const sandstone = sandstoneTexture(5);
  sandstone.repeat.set(1, 1);
  const stoneMat = new THREE.MeshStandardMaterial({ map: sandstone, vertexColors: true, roughness: 0.93 });
  const leaves = foliageTexture(23);
  const leafMat = new THREE.MeshStandardMaterial({ map: leaves, vertexColors: true, roughness: 0.9 });

  /* ---- house rows. One spec per (row, side); each building type picks up the specs that chose it. */
  type Spec = { type: 0 | 1 | 2 | 3; x: number; z: number; rotY: number; sx: number; sy: number; sz: number; color: THREE.Color; back: boolean };
  const specs = new Map<string, Spec[]>();
  const rowSpecs = (cj: number): Spec[] => {
    const hit = specs.get(String(cj));
    if (hit) return hit;
    const out: Spec[] = [];
    const zc = (cj + 0.5) * ROW;
    const gd = gateDist(zc);
    for (const side of [-1, 1]) {
      const r = mulberry32(((cj * 73856093) ^ ((side + 2) * 19349663) ^ 0x9e3779b9) >>> 0);
      const rot = side > 0 ? -Math.PI / 2 : Math.PI / 2;
      const wash = () => {
        const u = r();
        return new THREE.Color(WASH[u < 0.3 ? 0 : u < 0.5 ? 1 : u < 0.65 ? 2 : u < 0.85 ? 3 : u < 0.93 ? 4 : 5]);
      };
      const front = frontLine(zc);
      if (gd > 9) {
        const u = r();
        const type = u < 0.36 ? 0 : u < 0.66 ? 1 : u < 0.8 ? 2 : 3;
        const z = zc + (r() - 0.5) * 2.2;
        if (type === 0) { const sy = 0.84 + r() * 0.34, sz = 0.92 + r() * 0.2; out.push({ type, x: side * (front + 4 * sz + r() * 0.8), z, rotY: rot, sx: 0.88 + r() * 0.18, sy, sz, color: wash(), back: false }); }
        else if (type === 1) { const sz = 0.95 + r() * 0.18; out.push({ type, x: side * (front + 3.1 * sz + r() * 0.6), z, rotY: rot, sx: 0.95 + r() * 0.18, sy: 0.92 + r() * 0.25, sz, color: wash(), back: false }); }
        else if (type === 2) out.push({ type, x: side * (front + 3.6), z, rotY: rot, sx: 1, sy: 0.95 + r() * 0.2, sz: 1, color: new THREE.Color("#e6d4b4").multiplyScalar(0.85 + r() * 0.2), back: false });
        else out.push({ type, x: side * (front + 0.2), z, rotY: rot, sx: 0.95 + r() * 0.15, sy: 0.9 + r() * 0.2, sz: 1, color: wash(), back: false });
      }
      // a second row behind, taller, visible over and between the front buildings
      if (r() < 0.8) {
        const u = r();
        const type = u < 0.55 ? 0 : 1;
        const z = zc + (r() - 0.5) * 4;
        out.push({ type, x: side * (front + 15 + r() * 9), z, rotY: rot + (r() - 0.5) * 0.12, sx: 1 + r() * 0.35, sy: 1.0 + r() * 0.5, sz: 1 + r() * 0.3, color: wash(), back: true });
      }
    }
    specs.set(String(cj), out);
    if (specs.size > 400) specs.clear();
    return out;
  };
  const byType = (type: number) => (cj: number): Instance[] =>
    rowSpecs(cj).filter((s) => s.type === type).map((s) => ({ x: s.x, y: terrainHeight("village", s.x, s.z) - 0.04, z: s.z, rotY: s.rotY, sx: s.sx, sy: s.sy, sz: s.sz, color: s.color }));

  const haveli = makeScatter(haveliGeo(), plasterMat, 90, ROW, 160, byType(0));
  const cottage = makeScatter(cottageGeo(), plasterMat, 90, ROW, 160, byType(1));
  const hut = makeScatter(hutGeo(), plasterMat, 40, ROW, 130, byType(2));
  const compound = makeScatter(compoundGeo(), plasterMat, 60, ROW, 140, byType(3));

  /* ---- gates and squares: one per period, found by cell */
  const periodic1 = (at: number) => (cj: number): Instance[] => {
    const z = cj * PLAZA.period + at;
    return [{ x: 0, y: terrainHeight("village", 0, z), z, rotY: 0, sx: 1, sy: 1, sz: 1, color: new THREE.Color(1, 1, 1) }];
  };
  const gate = new Scatter(gateGeo(), stoneMat, 4, PLAZA.period, 360, (ci, cj) => (ci === 0 ? periodic1(GATE_Z)(cj) : []), { castShadow: true, colored: true });
  const square = new Scatter(squareGeo(), plasterMat, 4, PLAZA.period, 360, (ci, cj) => (ci === 0 ? periodic1(PLAZA.z)(cj) : []), { castShadow: true, colored: true });
  const banyan = new Scatter(bayanCrownGeo(), leafMat, 4, PLAZA.period, 360, (ci, cj) => (ci === 0 ? periodic1(PLAZA.z)(cj) : []), { castShadow: true, colored: true });
  // the cell of a periodic scatter is [cj*period, (cj+1)*period); the gate at +40 and square at +74 both live in the cell that starts at k*160 - the instance z is cj*period + at

  /* ---- street dressing */
  const dress = (geo: Geo, seedBase: number, p: number, spread: [number, number]) =>
    makeScatter(geo, vertexMat, 60, ROW, 100, (cj) => {
      const out: Instance[] = [];
      const zc = (cj + 0.5) * ROW;
      if (gateDist(zc) < 5 || plazaDist(zc) < PLAZA.r - 2) return out;
      for (const side of [-1, 1]) {
        const r = mulberry32(((cj * 83492791) ^ ((side + 2) * seedBase)) >>> 0);
        if (r() > p) continue;
        const x = side * (frontLine(zc) - spread[0] - r() * spread[1]);
        const z = zc + (r() - 0.5) * (ROW - 3);
        out.push({ x, y: terrainHeight("village", x, z) - 0.02, z, rotY: (side > 0 ? -Math.PI / 2 : Math.PI / 2) + (r() - 0.5) * 0.5, sx: 1, sy: 1, sz: 1, color: new THREE.Color(1, 1, 1) });
      }
      return out;
    }, true, true);
  const pots = dress(potsGeo(), 1013, 0.45, [0.9, 1.0]);
  const hay = dress(hayGeo(), 2027, 0.3, [1.6, 1.4]);
  const charpoy = dress(charpoyGeo(), 3041, 0.28, [1.8, 1.6]);

  const neemPlace = (cj: number) => {
    const out: Instance[] = [];
    for (const side of [-1, 1]) {
      const r = mulberry32(((cj * 49979687) ^ ((side + 2) * 1299721)) >>> 0);
      if (r() > 0.6) continue;
      const zc = (cj + 0.5) * ROW * 2 + (r() - 0.5) * 14;
      if (plazaDist(zc) < PLAZA.r + 6) continue;
      const x = side * (frontLine(zc) + 9 + r() * 11);
      const sc = 0.85 + r() * 0.6;
      out.push({ x, y: terrainHeight("village", x, zc) - 0.05, z: zc, rotY: r() * 6.28, sx: sc, sy: sc, sz: sc, color: new THREE.Color().setHSL(0.26 + r() * 0.04, 0.4, 0.9 + r() * 0.2) });
    }
    return out;
  };
  const neem = makeScatter(neemGeo(), vertexMat, 50, ROW * 2, 170, neemPlace);
  const neemLeaves = makeScatter(neemCrownGeo(), leafMat, 50, ROW * 2, 170, neemPlace);
  const tuftTex = grassTuftTexture();
  const tuftCards: Geo[] = [];
  for (let k = 0; k < 3; k++) { const g = new THREE.PlaneGeometry(1, 0.8); g.translate(0, 0.4, 0); g.rotateY((k * Math.PI) / 3); tuftCards.push(g); }
  const tufts = new Scatter(merge(tuftCards), new THREE.MeshStandardMaterial({ map: tuftTex, alphaTest: 0.45, side: THREE.DoubleSide, roughness: 1 }), 500, 10, 60, (ci, cj) => {
    const r = mulberry32(((ci * 73856093) ^ (cj * 19349663)) >>> 0);
    const out: Instance[] = [];
    const n = 2 + Math.floor(r() * 4);
    for (let i = 0; i < n; i++) {
      const x = (ci + r()) * 10, z = (cj + r()) * 10;
      const edge = frontLine(z) - 0.6;
      if (Math.abs(x) < 3.4 || Math.abs(x) > edge || plazaDist(z) < PLAZA.r) continue;
      if (vnoise(x * 0.05, z * 0.05, 71) < 0.45) continue;
      const sc = 0.2 + r() * 0.34;
      out.push({ x, y: terrainHeight("village", x, z) - 0.02, z, rotY: r() * 6.28, sx: sc * 1.1, sy: sc, sz: sc * 1.1, color: new THREE.Color().setHSL(0.12 + r() * 0.03, 0.26, 0.55 + r() * 0.12) });
    }
    return out;
  }, { colored: true, receiveShadow: false });

  const scatters = [haveli, cottage, hut, compound, gate, square, banyan, pots, hay, charpoy, neem, neemLeaves, tufts];
  for (const s of scatters) group.add(s.mesh);

  const pts = [new THREE.Vector2(0, 0), new THREE.Vector2(0, 6000)];
  const stone: Surface = { dust: 0.35, prints: 0.12, color: new THREE.Color("#cdb48c"), hardness: 0.9 };
  const earth: Surface = { dust: 0.8, prints: 0.6, color: new THREE.Color("#c8ab7e"), hardness: 0.35 };
  const env: Environment = {
    id: "village", group, terrain: near, atmosphere: ATMOSPHERES.village, wind: new THREE.Vector3(1.6, 0, 0.5),
    start: { x: 0, z: 0, heading: 0 }, path: new PathFollower(pts), shadowRadius: 13,
    surface: (x, z) => (villagePaving(x, z) > 0.5 ? stone : earth),
    avoidCamera(p) {
      // stay in the street, and inside the arch when level with a gate
      if (p.y < 9) {
        const lim = frontLine(p.z) - 1.1;
        if (Math.abs(p.x) > lim) p.x = Math.sign(p.x) * lim;
        if (Math.abs(periodic(p.z, GATE_Z, PLAZA.period)) < 2.6 && p.y < 9.8 && Math.abs(p.x) > 4.6) p.x = Math.sign(p.x) * 4.6;
      }
    },
    update(_dt, focus, time, q) {
      near.update(focus.x, focus.z, time);
      far.update(focus.x, focus.z, time);
      for (const s of [haveli, cottage, hut, compound]) s.update(focus.x, focus.z, 1);
      gate.update(focus.x, focus.z, 1);
      square.update(focus.x, focus.z, 1);
      banyan.update(focus.x, focus.z, 1);
      pots.update(focus.x, focus.z, q.scatter);
      hay.update(focus.x, focus.z, q.scatter);
      charpoy.update(focus.x, focus.z, q.scatter);
      neem.update(focus.x, focus.z, q.scatter);
      neemLeaves.update(focus.x, focus.z, q.scatter);
      tufts.update(focus.x, focus.z, q.scatter);
    },
    dispose() {
      near.dispose(); far.dispose();
      for (const s of scatters) { s.mesh.geometry.dispose(); (s.mesh.material as THREE.Material).dispose?.(); s.dispose(); }
      plaster.dispose(); sandstone.dispose(); leaves.dispose(); tuftTex.dispose();
    },
  };
  return env;
}
