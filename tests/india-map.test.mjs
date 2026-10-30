// The India sculpture on /schools: the baked data (public/data/india-sculpture, built by scripts/build-india-map.py) and the places
// it marks. Run with `npm test`. What this proves: the files decode, the mesh is sound and inside its budget, the rivers the brief names
// are there, every marker sits where an independent implementation of the Survey of India projection puts it, and no marker is
// worded as a campus. What it does NOT prove: that the render looks right (that was checked in a browser) or the accuracy of the sources.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { gunzipSync } from "node:zlib";
import { loadTs, root } from "./helpers/load-ts.mjs";

const dir = path.join(root, "public/data/india-sculpture");
const meta = JSON.parse(await readFile(path.join(dir, "meta.json"), "utf8"));
const places = JSON.parse(await readFile(path.join(root, "lib/content/india-map-places.json"), "utf8"));
const content = await loadTs("lib/content/india-map.ts");
const { network } = await loadTs("lib/content/schools.ts");

/** Reads one of the baked files: header JSON plus typed-array views over a fresh (aligned) buffer. */
async function readBin(file) {
  const gz = await readFile(path.join(dir, file));
  const raw = gunzipSync(gz);
  const buf = raw.buffer.slice(raw.byteOffset, raw.byteOffset + raw.length);
  const view = new DataView(buf);
  assert.equal(String.fromCharCode(...new Uint8Array(buf, 0, 4)), "IND1", `${file}: magic`);
  const headLength = view.getUint32(4, true);
  const header = JSON.parse(new TextDecoder().decode(new Uint8Array(buf, 8, headLength)));
  const types = { uint16: Uint16Array, int8: Int8Array, uint8: Uint8Array, int16: Int16Array, int32: Int32Array, float32: Float32Array };
  const array = (name) => {
    const a = header.arrays[name];
    return new types[a.type](buf, 8 + headLength + a.offset, a.length);
  };
  return { header, array, bytes: gz.length };
}

/** Lambert conformal conic (two standard parallels) on the WGS84 ellipsoid, after Snyder: an independent check of the build's pyproj. */
function lcc(lonDeg, latDeg, { lat1 = 12.472955, lat2 = 35.172805, lat0 = 24, lon0 = 80 } = {}) {
  const a = 6378137, f = 1 / 298.257223563, e = Math.sqrt(2 * f - f * f);
  const rad = (d) => (d * Math.PI) / 180;
  const m = (p) => Math.cos(p) / Math.sqrt(1 - e * e * Math.sin(p) ** 2);
  const t = (p) => Math.tan(Math.PI / 4 - p / 2) / ((1 - e * Math.sin(p)) / (1 + e * Math.sin(p))) ** (e / 2);
  const [p1, p2, p0] = [rad(lat1), rad(lat2), rad(lat0)];
  const n = (Math.log(m(p1)) - Math.log(m(p2))) / (Math.log(t(p1)) - Math.log(t(p2)));
  const F = m(p1) / (n * t(p1) ** n);
  const rho = a * F * t(rad(latDeg)) ** n;
  const rho0 = a * F * t(p0) ** n;
  const theta = n * rad(lonDeg - lon0);
  return { x: rho * Math.sin(theta), y: rho0 - rho * Math.cos(theta) };
}

test("the places in the content, the places file and the baked data are the same set", () => {
  assert.equal(new Set(places.map((p) => p.id)).size, places.length, "ids are unique");
  assert.deepEqual(content.mapPlaces.map((p) => p.id).sort(), places.map((p) => p.id).sort());
  assert.deepEqual(meta.places.map((p) => p.id).sort(), places.map((p) => p.id).sort());
  for (const p of places) {
    const m = meta.places.find((q) => q.id === p.id);
    assert.equal(m.lon, p.lon);
    assert.equal(m.lat, p.lat);
    assert.equal(m.inside_india, true, `${p.id} lies inside India's outline (checked by the build)`);
  }
});

test("every marker is where an independent Lambert conformal conic puts it", () => {
  const [cx, cy] = meta.projection.centre_m;
  for (const p of meta.places) {
    const { x, y } = lcc(p.lon, p.lat);
    const X = (x - cx) / meta.unit_m;
    const Z = -(y - cy) / meta.unit_m;
    assert.ok(Math.abs(X - p.x) < 5e-4 && Math.abs(Z - p.z) < 5e-4, `${p.id}: baked (${p.x.toFixed(4)}, ${p.z.toFixed(4)}) vs independent (${X.toFixed(4)}, ${Z.toFixed(4)})`);
    assert.ok(p.x > meta.plate.x[0] && p.x < meta.plate.x[1] && p.z > meta.plate.z[0] && p.z < meta.plate.z[1], `${p.id} is on the plate`);
    assert.ok(p.x > meta.india.x[0] && p.x < meta.india.x[1] && p.z > meta.india.z[0] && p.z < meta.india.z[1], `${p.id} is inside India's box`);
  }
});

test("the terrain under each marker is plausible for the place (a coarse check against well-known heights)", () => {
  const known = { mumbai: [0, 60], kolkata: [0, 60], "new-delhi": [150, 300], hyderabad: [350, 650], bengaluru: [800, 1000], dehradun: [500, 800], marwar: [150, 320], jaipur: [350, 520] };
  for (const p of meta.places) {
    const [lo, hi] = known[p.id];
    assert.ok(p.elevation_m >= lo && p.elevation_m <= hi, `${p.id}: ${p.elevation_m} m outside ${lo}-${hi} m`);
  }
});

test("the relief exaggeration in the copy is the one the data was built with", () => {
  assert.equal(content.MAP_EXAGGERATION, meta.exaggeration);
  assert.match(content.mapCopy.sources, new RegExp(`exaggerated ${meta.exaggeration} times`));
});

for (const level of ["hi", "lo"]) {
  test(`terrain-${level}: decodes, is a sound mesh, and is inside its budget`, async () => {
    const { header, array, bytes } = await readBin(`terrain-${level}.bin.gz`);
    const c = header.counts;
    const b = header.bounds;
    const [qx, qy, qz] = [array("x"), array("y"), array("z")];
    assert.equal(qx.length, c.vertices);
    assert.equal(qy.length, c.vertices);
    assert.equal(qz.length, c.vertices);
    assert.equal(array("normal").length, c.vertices * 3);
    assert.equal(array("ao").length, c.vertices);
    assert.equal(array("sd").length, c.vertices);
    const delta = array("index_delta");
    assert.equal(delta.length, c.triangles * 3);
    // positions
    const P = new Float32Array(c.vertices * 3);
    for (let i = 0; i < c.vertices; i++) {
      P[i * 3] = b.x[0] + (qx[i] / 65535) * (b.x[1] - b.x[0]);
      P[i * 3 + 1] = b.y[0] + (qy[i] / 65535) * (b.y[1] - b.y[0]);
      P[i * 3 + 2] = b.z[0] + (qz[i] / 65535) * (b.z[1] - b.z[0]);
    }
    // indices (delta coded), in range, no degenerate triangle
    const index = new Uint32Array(delta.length);
    let acc = 0;
    for (let i = 0; i < delta.length; i++) { acc += delta[i]; index[i] = acc; }
    let maxIndex = 0, degenerate = 0, down = 0, upTerrain = 0, slivers = 0;
    for (let t = 0; t < c.triangles; t++) {
      const [i0, i1, i2] = [index[t * 3], index[t * 3 + 1], index[t * 3 + 2]];
      maxIndex = Math.max(maxIndex, i0, i1, i2);
      if (i0 === i1 || i1 === i2 || i0 === i2) degenerate++;
      if (t < c.terrainTriangles) {
        const ax = P[i1 * 3] - P[i0 * 3], az = P[i1 * 3 + 2] - P[i0 * 3 + 2];
        const bx = P[i2 * 3] - P[i0 * 3], bz = P[i2 * 3 + 2] - P[i0 * 3 + 2];
        const ny = az * bx - ax * bz; // y component of (b - a) x (c - a) with the heights ignored: the plan-view orientation
        // positions are quantised to 1/65535 of the plate (about 53 m), which can tip a sliver of under 0.13 km2 over; nothing else may face down
        if (ny > 0) upTerrain++; else if (Math.abs(ny) / 2 < 2e-6) slivers++; else down++;
      }
    }
    assert.ok(maxIndex < c.vertices, "indices are in range");
    assert.equal(degenerate, 0, "no degenerate triangles");
    assert.equal(down, 0, `every terrain triangle faces up (${upTerrain} of ${c.terrainTriangles}; ${slivers} slivers are within the quantisation)`);
    assert.ok(slivers <= 6, `${slivers} slivers`);
    // vertex data
    const ao = array("ao");
    assert.ok(Math.min(...ao.subarray(0, 5000)) >= 0 && Math.max(...ao.subarray(0, 5000)) <= 255);
    const n = array("normal");
    for (let i = 0; i < Math.min(c.vertices, 20000); i++) {
      const l = Math.hypot(n[i * 3], n[i * 3 + 1], n[i * 3 + 2]) / 127;
      assert.ok(l > 0.9 && l < 1.1, `normal ${i} has length ${l.toFixed(2)}`);
    }
    // budget: the budgets are the ones documented in docs/INDIA_MAP.md
    const budget = level === "hi" ? { triangles: 230_000, gz: 1.8e6 } : { triangles: 90_000, gz: 0.7e6 };
    assert.ok(c.triangles <= budget.triangles, `${c.triangles} triangles > ${budget.triangles}`);
    assert.ok(bytes <= budget.gz, `${bytes} bytes > ${budget.gz}`);
    // the maximum height is the highest peak, exaggerated, on the slab
    const yMax = Math.max(...Array.from({ length: c.terrainVertices }, (_, i) => P[i * 3 + 1]));
    const expected = meta.slab + (meta.exaggeration * meta.max_elevation_m) / meta.unit_m;
    assert.ok(yMax <= expected + 0.02 && yMax > expected * 0.6, `highest vertex ${yMax.toFixed(3)} vs the highest peak ${expected.toFixed(3)}`);
  });
}

test("the coast walls take their own country's colour: its owner changes only where India's coast meets a neighbour's", () => {
  // With the sea counted as "not India" the walls flickered between the two tints along the whole coast: 498 owner changes on the high mesh
  // and 304 on the low. With each cell owned by its nearest land they are 26 and 18 (the Rann of Kutch, the Bengal delta, the Pakistan junction).
  for (const level of ["hi", "lo"]) assert.ok(meta.variants[level].coast_sign_flips <= 60, `${level}: ${meta.variants[level].coast_sign_flips} owner changes along the walls`);
});

test("both posters (wide and tall) exist, are WebP and are light", async () => {
  for (const name of ["india-sculpture-poster.webp", "india-sculpture-poster-narrow.webp"]) {
    const bytes = await readFile(path.join(root, "public/images/schools", name));
    assert.equal(bytes.subarray(0, 4).toString("latin1"), "RIFF", name);
    assert.equal(bytes.subarray(8, 12).toString("latin1"), "WEBP", name);
    assert.ok(bytes.length < 120_000, `${name} is ${bytes.length} bytes`);
  }
});

test("the high mesh is the more detailed one", () => {
  assert.ok(meta.variants.hi.triangles > 1.8 * meta.variants.lo.triangles);
  assert.ok(meta.variants.hi.error.india_p95_m < meta.variants.lo.error.india_p95_m);
  assert.ok(meta.variants.hi.error.india_p99_m < 150, `the high mesh keeps 99% of India within 150 m of the 2 km grid (was ${meta.variants.hi.error.india_p99_m.toFixed(0)} m)`);
});

test("rivers: the ones the brief names are there, on the plate, and long enough to read", async () => {
  const { header, array } = await readBin("lines.bin.gz");
  const pts = array("points");
  const total = header.rivers.reduce((s, r) => s + r.count, 0);
  assert.equal(pts.length, total * 4);
  const ids = new Set(header.rivers.map((r) => r.id));
  for (const need of ["ganges", "yamuna", "brahmaputra", "godavari", "krishna", "narmada"]) assert.ok(ids.has(need), `${need} is in the data`);
  for (const r of header.rivers) {
    assert.ok(r.count >= 6, `${r.id} has ${r.count} points`);
    for (let i = r.start; i < r.start + r.count; i++) {
      const [x, y, z] = [pts[i * 4], pts[i * 4 + 1], pts[i * 4 + 2]];
      assert.ok(x > meta.plate.x[0] && x < meta.plate.x[1] && z > meta.plate.z[0] && z < meta.plate.z[1], `${r.id} stays on the plate`);
      assert.ok(y >= meta.slab - 0.001, `${r.id} lies on the land, not below it`);
    }
    // arc length is increasing along the line (the flow animation depends on it)
    for (let i = r.start + 1; i < r.start + r.count; i++) assert.ok(pts[i * 4 + 3] >= pts[(i - 1) * 4 + 3], `${r.id}: distance along the line grows`);
  }
});

test("the markers are targets and heritage, never campuses", () => {
  const circuits = content.mapPlaces.filter((p) => p.kind === "circuit");
  const heritage = content.mapPlaces.filter((p) => p.kind === "heritage");
  assert.equal(circuits.length, network.length, "one marker for each circuit of the Pan-India network");
  assert.equal(heritage.length, 2);
  for (const zone of network) {
    const p = circuits.find((c) => c.title === zone.name);
    assert.ok(p, `${zone.name} has a marker`);
    assert.deepEqual(p.facts.map((f) => f.v), zone.subzones.map((s) => s.name), "its facts are the circuit's own corridors");
  }
  for (const p of circuits) assert.match(p.status, /not a campus/i, p.id);
  for (const p of content.mapPlaces) {
    assert.ok(p.status.length > 20, `${p.id} states what it is not`);
    assert.doesNotMatch(`${p.body} ${p.title}`, /\b(opening soon|now open|our campus|enrol now)\b/i, `${p.id} does not claim an operating campus`);
  }
  assert.match(content.mapCopy.sources, /India point of view/);
  assert.match(content.mapCopy.sources, /Natural Earth/);
});
