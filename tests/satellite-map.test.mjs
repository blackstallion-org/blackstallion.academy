// The satellite map in the Zones section of /schools: its data, honesty and wiring. Run with `npm test`.
// What this proves: the three Hyderabad markers lie inside Hyderabad, the eight national markers inside India, no marker is worded as an
// operating campus, ids are unique, the MapTiler key is read from the environment and never written into source, and the security policy
// lets the map's origin through. What it does NOT prove: that the imagery renders (checked in a browser) or the accuracy of the coordinates
// beyond the bounding boxes below.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { loadTs, root } from "./helpers/load-ts.mjs";

const data = await loadTs("lib/content/satellite-map.ts");
const read = (f) => readFile(path.join(root, f), "utf8");

const inBox = ([lon, lat], [w, s, e, n]) => lon >= w && lon <= e && lat >= s && lat <= n;
const HYDERABAD = [78.2, 17.25, 78.6, 17.6];
const INDIA = [68, 6, 98, 36];

test("three Hyderabad hubs, inside Hyderabad, one per Zone 01 sub-zone", () => {
  assert.equal(data.hubPlaces.length, 3);
  assert.deepEqual(data.hubPlaces.map((p) => p.hubId).sort(), ["01A", "01B", "01C"]);
  for (const p of data.hubPlaces) assert.ok(inBox(p.lonLat, HYDERABAD), `${p.id} lies outside Hyderabad`);
});

test("six circuits and two heritage places, inside India", () => {
  assert.equal(data.nationalPlaces.filter((p) => p.kind === "circuit").length, 6);
  assert.equal(data.nationalPlaces.filter((p) => p.kind === "heritage").length, 2);
  for (const p of data.nationalPlaces) assert.ok(inBox(p.lonLat, INDIA), `${p.id} lies outside India`);
});

test("ids are unique and the tour visits every hub once", () => {
  const ids = data.allPlaces.map((p) => p.id);
  assert.equal(new Set(ids).size, ids.length);
  assert.deepEqual([...data.tourOrder].sort(), ["01A", "01B", "01C"]);
});

test("no marker is worded as an operating campus or a signed agreement", () => {
  for (const p of data.allPlaces) {
    assert.match(p.status, /proposed|planned|heritage|not /i, `${p.id}: status "${p.status}" must say what it is not`);
    assert.doesNotMatch(`${p.status} ${p.body}`, /\b(operating campus|now open|enrolling|signed partner)\b/i, p.id);
  }
  for (const p of data.hubPlaces) assert.match(p.status, /proposed/i);
});

test("the key comes from the environment and is not in source; the policy lets MapTiler through", async () => {
  const files = ["components/sections/schools/SatelliteZoneMap.tsx", "lib/content/satellite-map.ts", "next.config.mjs", ".env.example"];
  const src = await Promise.all(files.map(read));
  assert.match(src[0], /process\.env\.NEXT_PUBLIC_MAPTILER_KEY/);
  for (const [i, text] of src.entries()) assert.doesNotMatch(text, /key=[A-Za-z0-9]{16,}/, `${files[i]} holds a literal key`);
  const config = src[2];
  assert.match(config, /const MAPTILER = "https:\/\/api\.maptiler\.com"/);
  assert.match(config, /img-src[^\n]*\$\{MAPTILER\}/);
  assert.match(config, /connect-src[^\n]*\$\{MAPTILER\}/);
});

test("attribution stays on: the control is added and not switched off", async () => {
  const src = await read("components/sections/schools/SatelliteZoneMap.tsx");
  assert.match(src, /new AttributionControl\(\{ compact: false \}\)/);
  assert.match(src, /maptiler\.com/);
});
