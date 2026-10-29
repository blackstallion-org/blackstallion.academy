// Loading weight of the 3D riding kit and the Data Saver rule for the heavy extras.
// The riding kit is one AI-generated scan with 1.9 million triangles (5.2 MB): a phone has to decode it and redraw it every frame.
// The site serves two simplified copies instead; this guards their size so nobody swaps the original back in.
// Does NOT prove how it looks or how fast it draws on a device: that is checked in a browser (see PROGRESS.md). Run with `npm test`.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, statSync } from "node:fs";
import { loadTs } from "./helpers/load-ts.mjs";

const { isSaveData } = await loadTs("lib/motion/save-data.ts");

/** The JSON chunk of a .glb, and the triangle and vertex counts its accessors declare (they stay valid under Draco). */
function glbInfo(path) {
  const buf = readFileSync(new URL(`../${path}`, import.meta.url));
  assert.equal(buf.toString("ascii", 0, 4), "glTF", `${path} is a binary glTF`);
  const json = JSON.parse(buf.toString("utf8", 20, 20 + buf.readUInt32LE(12)));
  let triangles = 0;
  let vertices = 0;
  for (const mesh of json.meshes) {
    for (const primitive of mesh.primitives) {
      vertices += json.accessors[primitive.attributes.POSITION].count;
      triangles += json.accessors[primitive.indices].count / 3;
    }
  }
  return { triangles, vertices, draco: (json.extensionsUsed ?? []).includes("KHR_draco_mesh_compression"), bytes: statSync(new URL(`../${path}`, import.meta.url)).size };
}

test("the desktop riding kit is at most 300 000 triangles and 2 MB, the phone one at most 100 000 and 1 MB, both Draco-compressed", () => {
  const high = glbInfo("public/models/riding-gear-high.glb");
  const low = glbInfo("public/models/riding-gear-low.glb");
  assert.ok(high.draco && low.draco, "both are Draco-compressed");
  assert.ok(high.triangles <= 300_000, `desktop copy has ${high.triangles} triangles`);
  assert.ok(high.bytes <= 2 * 1024 * 1024, `desktop copy is ${high.bytes} bytes`);
  assert.ok(low.triangles <= 100_000, `phone copy has ${low.triangles} triangles`);
  assert.ok(low.bytes <= 1024 * 1024, `phone copy is ${low.bytes} bytes`);
  assert.ok(low.triangles < high.triangles && low.bytes < high.bytes, "the phone copy is the lighter one");
  assert.ok(high.triangles >= 50_000, "and the desktop copy is not simplified into nothing");
});

test("the stage serves the two copies and never the 1.9-million-triangle original", () => {
  const stage = readFileSync(new URL("../components/sections/equipment/RidingGearStage.tsx", import.meta.url), "utf8");
  const paths = readFileSync(new URL("../components/3d/marwari-paths.ts", import.meta.url), "utf8");
  assert.match(paths, /riding-gear-high\.glb/);
  assert.match(paths, /riding-gear-low\.glb/);
  assert.match(stage, /detectQualityTier\(\) === "low" \|\| saveDataMode\(\)/, "phones, weak devices and data-saver visitors get the light copy");
  for (const source of [stage, paths]) assert.doesNotMatch(source, /\/models\/riding-gear-draco/, "the original scan is not served");
  const config = readFileSync(new URL("../next.config.mjs", import.meta.url), "utf8");
  assert.match(config, /riding-gear-high\.glb/, "the copies are in the model version hash, so their URLs are served immutable");
  assert.match(config, /riding-gear-low\.glb/);
});

test("Data Saver and 2G links count as saving data; a normal connection and a browser without the signal do not", () => {
  assert.equal(isSaveData({ saveData: true }), true);
  assert.equal(isSaveData({ saveData: false, effectiveType: "slow-2g" }), true);
  assert.equal(isSaveData({ effectiveType: "2g" }), true);
  assert.equal(isSaveData({ saveData: false, effectiveType: "4g" }), false);
  assert.equal(isSaveData({ effectiveType: "3g" }), false);
  assert.equal(isSaveData({}), false);
  assert.equal(isSaveData(undefined), false, "Safari and Firefox report nothing");
});

test("the heavy films and the 3D prefetch honour that rule", () => {
  for (const file of ["components/sections/home/HeroFilm.tsx", "components/site/Footer.tsx", "components/sections/equipment/HorseEquipmentSection.tsx"]) {
    assert.match(readFileSync(new URL(`../${file}`, import.meta.url), "utf8"), /saveDataMode\(\)/, `${file} checks Data Saver`);
  }
});
