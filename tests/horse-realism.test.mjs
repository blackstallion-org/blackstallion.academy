// The black Marwari's mane, tail, hair tiers and ground contact (branch feature/horse-realism).
// Geometry and policies are pure (no WebGL), so the shapes and the numbers are checked here; how they look is in docs/qa/horse-realism.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { loadTs, root } from "./helpers/load-ts.mjs";

const hair = await loadTs("components/3d/hair-locks.ts");
const policy = await loadTs("components/stallion-film/ground-policy.ts");
const { DustSystem } = await loadTs("components/stallion-film/effects.ts");
const text = (rel) => fs.readFileSync(path.join(root, rel), "utf8");

/* ------------------------------------------------------------------ a stand-in neck: a straight axis with a circular skin of radius R */
const R = 0.15;
const BONES = ["Neck_1", "Neck_2", "Neck_3", "Head", "Mane_1", "Mane_2", "Mane_3", "Mane_4", "Tail_1", "Tail_2", "Tail_3", "Tail_4", "Pelvis"];
const bone = Object.fromEntries(BONES.map((n, i) => [n, i]));
const norm = (v) => { const l = Math.hypot(...v); return v.map((x) => x / l); };
const A = [0, 1.5, 0.65], B = [0, 1.85, 1.05];
const axisDir = norm([B[0] - A[0], B[1] - A[1], B[2] - A[2]]);
const up = norm([0, 0.65, -0.76]);                       // across the axis toward the crest
const side = [1, 0, 0];                                  // the mane's side (the horse's left)
function stations(n = 14) {
  return Array.from({ length: n }, (_, i) => {
    const t = i / (n - 1);
    return {
      center: [A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t],
      tangent: axisDir, up, side, hull: new Array(hair.HULL_BINS).fill(R),
      neck: [["Neck_2", 1 - t], ["Neck_3", t]], mane: [["Mane_4", 1 - t], ["Mane_3", t]],
    };
  });
}
const distToAxis = (p) => {
  const v = [p[0] - A[0], p[1] - A[1], p[2] - A[2]];
  const d = v[0] * axisDir[0] + v[1] * axisDir[1] + v[2] * axisDir[2];
  return Math.hypot(v[0] - axisDir[0] * d, v[1] - axisDir[1] * d, v[2] - axisDir[2] * d);
};
const vert = (d, i) => [d.position[i * 3], d.position[i * 3 + 1], d.position[i * 3 + 2]];
const chain = [[0, 1.4, -0.56], [0.0626, 1.1011, -0.787], [0.0405, 0.8498, -0.7157], [0.0532, 0.5992, -0.7243]];
const tris = (d) => d.index.length / 3;

/* ------------------------------------------------------------------ the mane */
test("mane: lock count, rows and buffers are consistent at every tier", () => {
  for (const lod of [0, 1, 2]) {
    const d = hair.buildMane({ stations: stations(), bone, lod });
    assert.equal(d.locks, Math.round(hair.MANE_LOCKS * hair.LOCK_SHARE[lod]));
    assert.equal(d.rows, hair.ROWS[lod]);
    assert.equal(d.position.length, d.locks * (d.rows + 1) * 3 * 3);
    assert.equal(d.index.length, d.locks * d.indicesPerLock);
    for (const v of d.position) assert.ok(Number.isFinite(v), "no NaN in the positions");
    let max = 0;
    for (const i of d.index) max = Math.max(max, i);
    assert.ok(max < d.position.length / 3, "indices stay inside the vertex buffer");
  }
});

test("mane: the tiers drop locks and rows (fewer triangles, never more)", () => {
  const t = [0, 1, 2].map((lod) => tris(hair.buildMane({ stations: stations(), bone, lod })));
  assert.ok(t[0] > t[1] && t[1] > t[2], `triangles per tier ${t.join(" > ")}`);
});

test("mane: locks lie on the neck (no floating, no sinking) and fall to the chosen side", () => {
  const d = hair.buildMane({ stations: stations(), bone, lod: 0 });
  let min = Infinity, max = 0, sideSum = 0, n = 0;
  for (let i = 0; i < d.position.length / 3; i++) {
    const p = vert(d, i);
    const r = distToAxis(p);
    min = Math.min(min, r); max = Math.max(max, r);
    if (d.uv[i * 2 + 1] < 0.4) { sideSum += (p[0] - A[0]); n++; } // the free half of each lock
  }
  assert.ok(min >= R - 0.025, `no vertex sinks deeper than 2.5 cm into the skin (min radius ${min.toFixed(3)})`);
  assert.ok(max <= R + 0.1, `no vertex floats more than 10 cm off the skin (max radius ${max.toFixed(3)})`);
  assert.ok(sideSum / n > 0.06, "the free ends hang on the +X (left) side of the neck");
});

test("mane: every lock tapers to a point and is a rounded card, not a flat plank", () => {
  const d = hair.buildMane({ stations: stations(), bone, lod: 0 });
  const rows = d.rows, per = (rows + 1) * 3;
  let tapered = 0, round = 0;
  for (let l = 0; l < d.locks; l++) {
    const base = l * per;
    const w = (row) => Math.hypot(...vert(d, base + row * 3).map((x, k) => x - vert(d, base + row * 3 + 2)[k]));
    if (w(rows) < 0.3 * w(0)) tapered++;
    // the ridge (middle column) is raised off the line between the two edges
    const mid = vert(d, base + 3 * 3 + 1), a = vert(d, base + 3 * 3), b = vert(d, base + 3 * 3 + 2);
    const mx = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2];
    if (Math.hypot(mid[0] - mx[0], mid[1] - mx[1], mid[2] - mx[2]) > 0.002) round++;
  }
  assert.ok(tapered / d.locks > 0.95, `${tapered} of ${d.locks} locks taper to under 30% of their root width`);
  assert.ok(round / d.locks > 0.95, `${round} of ${d.locks} locks have a raised ridge`);
});

test("mane: skin weights are normalised and refer to real bones", () => {
  const d = hair.buildMane({ stations: stations(), bone, lod: 0 });
  for (let i = 0; i < d.position.length / 3; i++) {
    let s = 0;
    for (let k = 0; k < 4; k++) { s += d.skinWeight[i * 4 + k]; assert.ok(d.skinIndex[i * 4 + k] < BONES.length); }
    assert.ok(Math.abs(s - 1) < 1e-5, `weights sum to 1 (got ${s})`);
  }
});

test("mane: the same input builds the same hair (it is rebuilt when the tier changes)", () => {
  const a = hair.buildMane({ stations: stations(), bone, lod: 1 }), b = hair.buildMane({ stations: stations(), bone, lod: 1 });
  assert.deepEqual(Array.from(a.position), Array.from(b.position));
});

test("mane: the roots hug the crest, so no row of square tops can show on the side of the neck", () => {
  const d = hair.buildMane({ stations: stations(), bone, lod: 0 });
  const per = (d.rows + 1) * 3, len = Math.hypot(B[0] - A[0], B[1] - A[1], B[2] - A[2]);
  let worst = 0;
  for (let l = 0; l < d.locks; l++) {
    const p = vert(d, l * per + 1);                      // the middle column of the root row
    const t = ((p[0] - A[0]) * axisDir[0] + (p[1] - A[1]) * axisDir[1] + (p[2] - A[2]) * axisDir[2]);
    const r = [p[0] - A[0] - axisDir[0] * t, p[1] - A[1] - axisDir[1] * t, p[2] - A[2] - axisDir[2] * t];
    const phi = Math.atan2(r[0] * side[0] + r[1] * side[1] + r[2] * side[2], r[0] * up[0] + r[1] * up[1] + r[2] * up[2]);
    worst = Math.max(worst, Math.abs(phi));
  }
  assert.ok(worst < 0.34, `every root starts within 20 degrees of the crest (worst ${(worst * 57.3).toFixed(0)} degrees)`);
  assert.ok(len > 0.3);
});

test("mane: the locks at the withers and the poll are shorter and finer than the middle ones (a long lock folds where the neck turns)", () => {
  const d = hair.buildMane({ stations: stations(), bone, lod: 0 });
  const per = (d.rows + 1) * 3, len = Math.hypot(B[0] - A[0], B[1] - A[1], B[2] - A[2]);
  const mean = (a) => a.reduce((s, x) => s + x, 0) / Math.max(1, a.length);
  const ends = [], middle = [], endHalf = [], midHalf = [];
  for (let l = 0; l < d.locks; l++) {
    const root = vert(d, l * per + 1);
    const t = ((root[0] - A[0]) * axisDir[0] + (root[1] - A[1]) * axisDir[1] + (root[2] - A[2]) * axisDir[2]) / len;
    let length = 0;                                       // along the lock, not the chord (a lock curls round the neck)
    for (let r = 1; r <= d.rows; r++) { const a = vert(d, l * per + (r - 1) * 3 + 1), b = vert(d, l * per + r * 3 + 1); length += Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]); }
    const a = vert(d, l * per + 3 * 3), b = vert(d, l * per + 3 * 3 + 2), half = Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]) / 2;
    if (t < 0.12 || t > 0.88) { ends.push(length); endHalf.push(half); } else if (t > 0.4 && t < 0.6) { middle.push(length); midHalf.push(half); }
  }
  assert.ok(ends.length >= 8 && middle.length >= 8, `${ends.length} end locks, ${middle.length} middle locks`);
  assert.ok(mean(ends) < 0.88 * mean(middle), `end locks ${mean(ends).toFixed(3)} m against ${mean(middle).toFixed(3)} m in the middle`);
  assert.ok(mean(endHalf) < mean(midHalf), "and narrower");
});

test("forelock: a fan of tapered locks from the poll, short, and it stays below the ears' tips", () => {
  const profile = [[0.016, 2.055, 1.15], [0.016, 2.03, 1.18], [0.016, 2.007, 1.21], [0.016, 1.972, 1.24], [0.016, 1.927, 1.27], [0.016, 1.8, 1.3], [0.016, 1.72, 1.33]];
  for (const lod of [0, 1, 2]) {
    const d = hair.buildForelock({ profile, left: [1, 0, 0], weights: [["Head", 1]], bone, lod });
    assert.ok(d.locks >= 4 && d.locks <= hair.FORELOCK_LOCKS, `${d.locks} locks at tier ${lod}`);
  }
  const d = hair.buildForelock({ profile, left: [1, 0, 0], weights: [["Head", 1]], bone, lod: 0 });
  assert.equal(d.locks, hair.FORELOCK_LOCKS);
  let maxLen = 0, minX = Infinity, maxX = -Infinity;
  for (let l = 0; l < d.locks; l++) {
    const base = l * (d.rows + 1) * 3;
    maxLen = Math.max(maxLen, Math.hypot(...vert(d, base + 1).map((x, k) => x - vert(d, base + d.rows * 3 + 1)[k])));
  }
  for (let i = 0; i < d.position.length / 3; i++) {
    const p = vert(d, i);
    assert.ok(p[1] < 2.12, `nothing rises to the height of the ear tips (${p[1].toFixed(3)} m)`);
    minX = Math.min(minX, p[0]); maxX = Math.max(maxX, p[0]);
  }
  assert.ok(maxLen < 0.32, `the forelock is short (longest lock spans ${maxLen.toFixed(2)} m)`);
  assert.ok(maxX - minX > 0.1, `it fans across the poll (${(maxX - minX).toFixed(2)} m wide)`);
  // turned about their own axes, the cards do not all face the same way: seen from the side the forelock is a mass, not one edge-on wisp
  const faces = new Set();
  for (let l = 0; l < d.locks; l++) faces.add(Math.round(d.normal[(l * (d.rows + 1) * 3 + 4) * 3] * 4));
  assert.ok(faces.size >= 3, "the locks face in different directions");
});

test("forelock: the profile is found geometrically, because the skin between the ears is weighted to the ear bones", async () => {
  const THREE = await import("three");
  const { forelockProfile } = await loadTs("components/3d/marwari-hair-locks.ts");
  // the midline of the real head (measured on marwari-hero.glb): ear tip over the midline at z 1.12, then the poll and the forehead
  const pts = [[1.03, 2.033], [1.06, 2.053], [1.09, 2.081], [1.12, 2.169], [1.15, 2.055], [1.18, 2.03], [1.21, 2.007], [1.24, 1.972], [1.27, 1.927], [1.3, 1.782], [1.33, 1.72], [1.36, 1.654]];
  const verts = [];
  for (const [z, y] of pts) for (const x of [0.005, 0.016, 0.028]) verts.push([x, y, z]);
  verts.push([0.06, 2.2, 1.2]); // an ear off the midline strip
  const coat = { geometry: { attributes: { position: { count: verts.length, getX: (i) => verts[i][0], getY: (i) => verts[i][1], getZ: (i) => verts[i][2] } } } };
  const prof = forelockProfile(coat, new THREE.Vector3(0.0164, 1.8538, 1.0888));
  assert.ok(prof && prof.length >= 4, `a profile of ${prof?.length} points`);
  for (let i = 1; i < prof.length; i++) assert.ok(prof[i][1] <= prof[i - 1][1] + 0.005, "it only descends: the ears' tips are not part of it");
  assert.ok(prof[0][2] > 1.14, "it starts in front of the ears' bases");
  assert.ok(prof.every((p) => p[0] === 0.0164), "on the midline");
  assert.equal(forelockProfile({ geometry: { attributes: { position: { count: 0, getX: () => 0, getY: () => 0, getZ: () => 0 } } } }, new THREE.Vector3(0, 1.85, 1.09)), null, "no skin, no forelock (the exported ribbons stay)");
});

/* ------------------------------------------------------------------ the tail and dock */
test("tail: dense and overlapping at the root, separate strands toward the tip", () => {
  const d = hair.buildTail({ chain, bone, lod: 0 });
  assert.equal(d.locks, Math.round(hair.TAIL_STRANDS));
  const per = (d.rows + 1) * 3;
  const col = (l, row, c) => vert(d, l * per + row * 3 + c);
  const gap = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
  // mean nearest-neighbour gap between strand centres at a row, and the mean width of a strand card there
  const at = (row) => {
    let g = 0, w = 0;
    for (let a = 0; a < d.locks; a++) {
      let best = Infinity;
      for (let b = 0; b < d.locks; b++) if (a !== b) best = Math.min(best, gap(col(a, row, 1), col(b, row, 1)));
      g += best; w += gap(col(a, row, 0), col(a, row, 2));
    }
    return { gap: g / d.locks, width: w / d.locks };
  };
  const root = at(1), tip = at(d.rows);
  assert.ok(root.width / root.gap > 2, `at the root the cards overlap (width ${root.width.toFixed(4)} m, gap ${root.gap.toFixed(4)} m)`);
  assert.ok(tip.width / tip.gap < 0.8, `at the tip the strands are apart (width ${tip.width.toFixed(4)} m, gap ${tip.gap.toFixed(4)} m)`);
  // and the bundle opens out: strands sit further from the axis at the tip than at the root
  const radius = (row) => { let s = 0; for (let l = 0; l < d.locks; l++) s += Math.hypot(...col(l, row, 1).map((x, k) => x - hair.tailCurve([...chain, chain[3]]).at(row / d.rows)[k])); return s / d.locks; };
  assert.ok(radius(d.rows) > radius(1), "the bundle is wider at the tip than at the root");
  for (const v of d.position) assert.ok(Number.isFinite(v));
});

test("tail: no kinks where the axis runs straight down (the frame is transported, not recomputed)", () => {
  const d = hair.buildTail({ chain, bone, lod: 0 });
  const per = (d.rows + 1) * 3;
  let worst = 0;
  for (let l = 0; l < d.locks; l++) {
    // the strand's centre line should bend by only a little between consecutive rows
    for (let r = 1; r < d.rows; r++) {
      const a = vert(d, l * per + (r - 1) * 3 + 1), b = vert(d, l * per + r * 3 + 1), c = vert(d, l * per + (r + 1) * 3 + 1);
      const u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], v = [c[0] - b[0], c[1] - b[1], c[2] - b[2]];
      const cos = (u[0] * v[0] + u[1] * v[1] + u[2] * v[2]) / (Math.hypot(...u) * Math.hypot(...v) || 1);
      worst = Math.max(worst, Math.acos(Math.min(1, Math.max(-1, cos))));
    }
  }
  // the rig's own bind pose has an S-bend at Tail_2 (about 56 degrees); a flipped frame would show as a zigzag of well over 90
  assert.ok(worst < 0.9, `the sharpest bend along any strand is ${(worst * 57.3).toFixed(0)} degrees between rows`);
});

test("dock: a short tapered tube that starts inside the rump, not a rod", () => {
  const d = hair.buildDock({ chain, bone, lod: 0 });
  assert.ok(d.position.length > 0);
  let zMax = -Infinity;
  const first = vert(d, 0), last = vert(d, d.position.length / 3 - 1);
  const len = Math.hypot(last[0] - first[0], last[1] - first[1], last[2] - first[2]);
  for (let i = 0; i < d.position.length / 3; i++) zMax = Math.max(zMax, vert(d, i)[2]);
  const radii = ringRadii(d);
  assert.ok(Math.max(...radii) <= 0.05, `the root is at most 5 cm in radius (${Math.max(...radii).toFixed(3)})`);
  assert.ok(len < 0.45, `the tube is short (${len.toFixed(2)} m)`);
  assert.ok(zMax > chain[0][2] - 0.02, "it starts at or inside the croup, where the tail root is");
  assert.ok(radii[radii.length - 1] < radii[2], "and it tapers toward the hair");
});

/** Mean distance of each ring's vertices from the ring's centre (the dock is built in rings of 12 sides at the top tier). */
function ringRadii(d, sides = 12) {
  const rings = d.position.length / 3 / sides;
  return Array.from({ length: rings }, (_, r) => {
    const c = [0, 0, 0];
    for (let k = 0; k < sides; k++) { const p = vert(d, r * sides + k); c[0] += p[0] / sides; c[1] += p[1] / sides; c[2] += p[2] / sides; }
    let s = 0;
    for (let k = 0; k < sides; k++) { const p = vert(d, r * sides + k); s += Math.hypot(p[0] - c[0], p[1] - c[1], p[2] - c[2]); }
    return s / sides;
  });
}

test("dock: it closes in a rounded cap (no flat end can stand above the croup) and its root follows the pelvis, as the croup does", () => {
  const d = hair.buildDock({ chain, bone, lod: 0 });
  const radii = ringRadii(d);
  assert.ok(radii[0] < 0.002, `the first ring is a point (${radii[0].toFixed(4)} m): the end is closed`);
  assert.ok(radii[1] > 0.7 * radii[2] && radii[1] < radii[2], "the next ring is most of the way to full width: a dome, not a cone");
  const share = (ring, name) => { let s = 0; for (let k = 0; k < 12; k++) for (let q = 0; q < 4; q++) if (d.skinIndex[(ring * 12 + k) * 4 + q] === bone[name]) s += d.skinWeight[(ring * 12 + k) * 4 + q]; return s / 12; };
  assert.ok(share(0, "Pelvis") > 0.6, `the root ring is mostly pelvis (${share(0, "Pelvis").toFixed(2)})`);
  assert.ok(share(2, "Pelvis") < share(0, "Pelvis"), "the pelvis lets go toward the tail");
  assert.ok(share(7, "Pelvis") < 0.05 && share(7, "Tail_2") > 0.05, "past the root the dock is the tail's");
  assert.equal(hair.DOCK_ROOT_PELVIS, 0.69, "the share measured on the coat round the tail root");
  // on a rig with no pelvis bone the dock still builds, on the tail bones alone
  const { Pelvis, ...noPelvis } = bone;
  const e = hair.buildDock({ chain, bone: noPelvis, lod: 0 });
  assert.equal(e.position.length, d.position.length);
  assert.ok(Pelvis !== undefined);
});

test("coat: texels the normal map never painted no longer bend the normal (they showed as a pale flap at the tail root)", () => {
  for (const rel of ["components/3d/marwari-coat.ts"]) {
    const src = text(rel);
    assert.match(src, /USE_NORMALMAP_TANGENTSPACE/, "only where there is a tangent-space normal map");
    assert.match(src, /float painted = smoothstep\(0\.42, 0\.56, texture2D\(normalMap, vNormalMapUv\)\.z\)/, "the blue channel of an empty texel is 0");
    assert.match(src, /normal = normalize\(mix\(nonPerturbedNormal, normal, painted\)\)/, "the geometry's own normal is used where it is empty");
    assert.match(src, /customProgramCacheKey = \(\) => "marwari-coat-v1\d"/, "the cache key moved on with the shader");
  }
});

test("hair shader: the mane and forelock fade in at the root; the tail's roots stay solid inside the dock", () => {
  const src = text("components/3d/marwari-hair-locks.ts");
  assert.match(src, /float rampOn = step\(vKind, 0\.5\) \+ step\(1\.5, vKind\) \* \(1\.0 - step\(2\.5, vKind\)\)/, "kind 0 (mane) and kind 2 (forelock) only");
  assert.match(src, /cov \*= mix\(1\.0, rootRamp, rampOn\)/);
  assert.match(src, /if \(vKind > 2\.5\) cov = 1\.0/, "the dock is opaque");
  assert.match(src, /reflectedLight\.directSpecular \*= 0\.2;/, "the stock isotropic highlight (a light grey wash under a studio key) is cut; the strand lobes carry the sheen");
  assert.match(src, /float strandId = floor\(fract\(vMapUv\.x \* 8\.0\) \* 16\.0\)/, "every strand of the atlas has its own tilt, so the highlight is a scatter of glints and not one bar");
  // a studio rig (key, rim and fill) once made the mane and tail white: the strand highlight is summed and then bounded by a soft shoulder
  assert.match(src, /strandSpec \+= directionalLights\[i\]\.color/, "the highlights of all the lights are summed first");
  assert.match(src, /strandSpec = vec3\(0\.09\) \* \(vec3\(1\.0\) - exp\(-strandSpec \/ vec3\(0\.09\)\)\)/, "and bounded: linear when small, never above 0.09");
  assert.match(src, /core\.alphaToCoverage = lod !== 0/, "alpha to coverage (dither) is used only below the top tier");
});

/* ------------------------------------------------------------------ tiers and reduced motion */
test("tiers: the film's quality tier maps to the hair tier (top two keep every lock)", () => {
  assert.deepEqual([0, 1, 2, 3].map(hair.hairLodForTier), [0, 0, 1, 2]);
});

test("tiers: a weak or data-saving device starts on a simpler hair before any frame is timed", () => {
  assert.equal(hair.hairLodForDevice({ cores: 8, memoryGb: 8 }), 0);
  assert.equal(hair.hairLodForDevice({}), 0);
  assert.equal(hair.hairLodForDevice({ cores: 4, memoryGb: 8 }), 1);
  assert.equal(hair.hairLodForDevice({ cores: 8, memoryGb: 4 }), 1);
  assert.equal(hair.hairLodForDevice({ cores: 8, memoryGb: 8, saveData: true }), 1);
  assert.equal(hair.hairLodForDevice({ cores: 6, coarse: true, width: 390 }), 1);
  assert.equal(hair.hairLodForDevice({ cores: 2 }), 2);
  assert.equal(hair.hairLodForDevice({ memoryGb: 2 }), 2);
});

test("reduced motion: the hair's own movement is off (and full otherwise)", () => {
  assert.equal(hair.hairMotion(true, 1), 0);
  assert.equal(hair.hairMotion(true, 0.8), 0);
  assert.equal(hair.hairMotion(false, 1), 1);
  assert.equal(hair.hairMotion(false, 0.5), 0.5);
  assert.equal(hair.hairMotion(false, -1), 0);
  const src = text("components/3d/marwari-hair-locks.ts");
  assert.match(src, /prefers-reduced-motion: reduce/, "the system setting is read");
  assert.match(src, /uMotion/, "the shader scales its extra movement by one factor");
});

test("anatomy exhibit: its layer switch drives the new hair and never turns the exported ribbons back on over it", () => {
  const ex = text("public/anatomy/exhibit.js");
  const locks = text("components/3d/marwari-hair-locks.ts");
  assert.match(locks, /m\.name = name/, "the new meshes are named");
  assert.match(locks, /"Marwari_HairLocks_fringe"/);
  assert.match(locks, /legacy\.userData\.replacedByLocks = true/, "the hidden ribbons carry a flag");
  assert.match(ex, /n\.startsWith\("Marwari_HairLocks"\) \|\| \(n === "Marwari_Hair" && !o\.userData\.replacedByLocks\)/, "the hair layer is the new locks, or the ribbons only when they are showing");
  assert.match(ex, /n === "Marwari_HairLocks_fringe"/, "the blended fringe pass casts no shadow");
  assert.match(ex, /horse\.hair\.setReducedMotion/, "reduced motion reaches the new hair");
  // the vendored copy of the helpers the exhibit imports is current
  assert.match(text("public/anatomy/vendor/marwari/marwari-hair-locks.js"), /Marwari_HairLocks_fringe/);
});

test("exported ribbons come back if the new hair cannot be built", () => {
  const src = text("components/3d/marwari.ts");
  assert.match(src, /catch \(error\)[\s\S]{0,200}exported ribbons/, "a build failure is caught and the ribbons stay");
  assert.match(text("components/3d/marwari-hair-locks.ts"), /legacy\.visible = false/);
});

/* ------------------------------------------------------------------ ground contact */
test("ground: no contact discs while the sun casts the real shadow; a fallback only with no cast shadow", () => {
  assert.equal(policy.contactBlobStrength(true), 0);
  assert.ok(policy.contactBlobStrength(false) > 0 && policy.contactBlobStrength(false) <= 0.6);
  const engine = text("components/stallion-film/engine.ts");
  assert.match(engine, /contactBlobStrength\(/);
  assert.doesNotMatch(engine, /contacts\.strength = 0\.[1-9]/, "no fixed dark strength is set any more");
});

test("ground: the drifting ambient dust is gone (one dust system, fed only by hooves)", () => {
  const engine = text("components/stallion-film/engine.ts");
  assert.doesNotMatch(engine, /emitAmbient|this\.ambient/);
  assert.equal((engine.match(/new DustSystem\(/g) ?? []).length, 1);
});

test("ground: a kick is small, low and brief at every speed, and absent on a surface with no dust", () => {
  for (let speed = 0; speed <= 14; speed += 0.5) {
    for (const impact of [0, 0.5, 1, 1.5]) {
      for (const k of [policy.touchdownKick(speed, impact, 1, 1), policy.liftKick(speed, 1, 1)]) {
        assert.ok(k.count >= 0 && k.count <= 12, `count ${k.count}`);
        assert.ok(k.rise[1] <= 0.5, `rise ${k.rise[1]}`);
        assert.ok(k.size[1] <= 0.15, `size ${k.size[1]}`);
        assert.ok(k.life[1] <= 1.1, `life ${k.life[1]}`);
        assert.ok(k.alpha[1] <= 0.25, `alpha ${k.alpha[1]}`);
        assert.ok(k.speed[1] <= 3, `speed ${k.speed[1]}`);
      }
      assert.equal(policy.touchdownKick(speed, impact, 0, 1).count, 0);
      assert.equal(policy.liftKick(speed, 0, 1).count, 0);
    }
  }
});

test("ground: dust stays on the ground, never above the cap, and has faded out within its life", () => {
  const dust = new DustSystem(300);
  const ground = (x, z) => 0.3 + 0.05 * Math.sin(x * 3) * Math.cos(z * 2);
  dust.configure({ groundAt: ground, maxRise: policy.KICK_MAX_RISE, gravity: policy.KICK_GRAVITY });
  const wind = { x: 1, y: 0, z: 0.4 };
  // the worst case: grains thrown hard upward and sideways
  for (let i = 0; i < 200; i++) dust.emit(i * 0.01, ground(i * 0.01, 0) + 0.02, 0, 3, 6, 2, 0.1, 0.5 + (i % 5) * 0.1, 0.2, 1);
  const pos = dust.points.geometry.getAttribute("position").array, alpha = dust.points.geometry.getAttribute("aAlpha").array;
  for (let step = 0; step < 90; step++) {
    dust.update(1 / 60, wind, 900, 32);
    for (let i = 0; i < 200; i++) {
      if (!(alpha[i] > 0)) continue;
      const y = pos[i * 3 + 1], g = ground(pos[i * 3], pos[i * 3 + 2]);
      assert.ok(y >= g + 0.012 - 1e-5, `grain ${i} is above the ground (y ${y.toFixed(3)} vs ${g.toFixed(3)})`);
      assert.ok(y <= g + policy.KICK_MAX_RISE + 1e-5, `grain ${i} stays under the cap (${(y - g).toFixed(3)} m up)`);
    }
  }
  for (let step = 0; step < 60; step++) dust.update(1 / 60, wind, 900, 32);
  for (let i = 0; i < 200; i++) assert.equal(alpha[i], 0, "every grain has faded out after its life");
});

test("ground: a print is laid clear of the drawn ground, which in a dune hollow stands above the true height (it was half buried)", () => {
  const terrain = text("components/stallion-film/terrain.ts");
  const engine = text("components/stallion-film/engine.ts");
  assert.match(terrain, /facetClearance\(x: number, z: number\)/);
  assert.match(terrain, /terrainHeight\(this\.kind, x \+ c, z\) - 2 \* h \+ terrainHeight\(this\.kind, x - c, z\)/, "the second difference over one cell");
  assert.match(terrain, /\/ 8\) \* 1\.25 \+ 0\.004/, "a chord's sag is one eighth of the second difference, with a margin and a floor");
  assert.match(engine, /terrain\.height\(e\.pos\.x, e\.pos\.z\) \+ this\.env!\.terrain\.facetClearance\(e\.pos\.x, e\.pos\.z\)/, "prints use it");
});

test("ground: hoof prints are faint and the sand has its own texture terms", () => {
  for (const [place, s] of Object.entries(policy.PRINTS.strength)) assert.ok(s > 0 && s <= 0.3, `${place} prints are faint (${s})`);
  assert.ok(policy.PRINTS.strength.village < policy.PRINTS.strength.desert, "stone shows fewer prints than sand");
  const terrain = text("components/stallion-film/terrain.ts");
  // drifts, scuffed tracks, fine grain, glinting grains and a micro-bump, the fine ones faded with distance
  for (const term of ["grainFade", "vnoise(p * 0.55, 52)", "vnoise(p * 1.8 + 11.0, 53)", "vnoise(p * 38.0, 54)", "vnoise(p * 70.0, 55)", "vnoise(p * 26.0, 56)"]) assert.ok(terrain.includes(term), `the arena sand has ${term}`);
});
