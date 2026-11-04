// Campus scale model (Schools page): the data must describe a model that fits its own plot, matches the tier table and the
// configurator copy, and every camera pose must stay outside the architecture. Run with `npm test`.
import { test } from "node:test";
import assert from "node:assert/strict";
import { loadTs } from "./helpers/load-ts.mjs";

const { validateCampus, campusTierList, campusTiers, STALL, basisLabel } = await loadTs("lib/content/campus.ts");
const cam = await loadTs("lib/content/campus-camera.ts");
const { tiers } = await loadTs("lib/content/schools.ts");
const { HUB_DATA, FACILITY_INFO } = await loadTs("components/sections/schools/citadel/citadelData.ts");

test("the layouts fit their plots, match the tier table and do not collide", () => {
  assert.deepEqual(validateCampus(), []);
  assert.equal(campusTierList.length, 3);
});

test("the validator really fails on bad data", () => {
  const t = campusTiers.standard;
  const saved = t.modules[1].rect.x;
  t.modules[1].rect.x = 500;
  assert.ok(validateCampus().some((i) => /outside the site/.test(i.message)));
  t.modules[1].rect.x = saved;
  const arena = t.modules[0];
  const w = arena.arena.w;
  arena.arena.w = 99;
  assert.ok(validateCampus().some((i) => /arena footprint/.test(i.message)));
  arena.arena.w = w;
  assert.deepEqual(validateCampus(), []);
});

test("acreage, stable count and capacity equal the approved tier table", () => {
  for (const tier of tiers) {
    const c = campusTiers[tier.id];
    assert.equal(c.name, tier.name);
    assert.equal(c.site.acresLabel, tier.acres);
    const stalls = c.modules.filter((m) => m.kind === "stable-block").reduce((n, m) => n + m.bays.filter((b) => b === "stall").length, 0);
    assert.equal(stalls, tier.stables, `${tier.id} stalls`);
    assert.ok(c.overview.some((s) => s.value.includes(tier.cadets)), `${tier.id} capacity ${tier.cadets} is shown`);
    assert.ok(c.overview.some((s) => s.value === tier.capexLabel), `${tier.id} capital ${tier.capexLabel} is shown`);
  }
});

test("arena sizes and the 12 ft stall equal the configurator copy on the page", () => {
  for (const id of ["standard", "signature", "royal"]) {
    const [, w, d] = HUB_DATA[id].dimText.match(/(\d+)m × (\d+)m/);
    const arena = campusTiers[id].modules.find((m) => m.kind === "arena").arena;
    assert.equal(arena.w, Number(w), `${id} arena width`);
    assert.equal(arena.d, Number(d), `${id} arena depth`);
  }
  assert.match(FACILITY_INFO.stables.desc, /12ft × 12ft/);
  assert.ok(Math.abs(STALL - 12 * 0.3048) < 0.001);
});

test("every spec row has a known basis and unconfirmed facts are labelled, never invented", () => {
  for (const c of campusTierList) {
    for (const m of c.modules) {
      for (const s of m.specs) {
        assert.ok(basisLabel[s.basis], `${m.id}: ${s.label}`);
        if (s.basis === "tbc") assert.match(s.value, /to be confirmed/i, `${m.id}: ${s.label}`);
      }
    }
  }
});

test("only approved supporting facilities are modelled", () => {
  const allowed = new Set(["arena", "stable-block", "tack-room", "lounge", "pavilion", "vet-suite"]);
  for (const c of campusTierList) for (const m of c.modules) assert.ok(allowed.has(m.kind));
  assert.equal(campusTiers.standard.modules.length, 3);
  assert.ok(!campusTiers.standard.modules.some((m) => m.kind === "lounge" || m.kind === "pavilion" || m.kind === "vet-suite"));
  assert.ok(campusTiers.signature.modules.some((m) => m.kind === "lounge"));
  assert.ok(campusTiers.royal.modules.some((m) => m.kind === "vet-suite"));
  assert.ok(campusTiers.royal.modules.some((m) => m.kind === "pavilion"));
});

test("no camera pose clips through the architecture, at desktop and phone aspects", () => {
  for (const c of campusTierList) {
    for (const aspect of [1.6, 1.0, 0.8]) {
      const poses = [["overview", cam.overviewPose(c, aspect)], ["top", cam.topPose(c, aspect)], ...c.modules.map((m) => [m.id, cam.focusPose(c, m, aspect)])];
      for (const [name, pose] of poses) {
        assert.equal(cam.isClipping(cam.poseToPosition(pose), c), false, `${c.id} ${name} at aspect ${aspect}`);
        const { min, max } = cam.zoomLimits(c, aspect);
        assert.ok(pose.radius > 0 && pose.radius <= max * 1.001 && pose.radius >= min, `${c.id} ${name} radius ${pose.radius}`);
      }
    }
  }
});

test("the clip test catches a camera inside a building and one under the terrain", () => {
  const c = campusTiers.royal;
  const pav = c.modules.find((m) => m.id === "pavilion");
  assert.equal(cam.isClipping([pav.rect.x, 4, pav.rect.z], c), true);
  assert.equal(cam.isClipping([0, 0.5, 60], c), true);
  assert.equal(cam.isClipping([pav.rect.x, 40, pav.rect.z], c), false);
});

test("the flight between any two poses never passes through a building", () => {
  for (const c of campusTierList) {
    for (const aspect of [1.6, 0.8]) {
      const poses = [cam.overviewPose(c, aspect), cam.topPose(c, aspect), ...c.modules.map((m) => cam.focusPose(c, m, aspect))];
      for (const from of poses) {
        for (const to of poses) {
          for (let i = 0; i <= 40; i++) {
            const p = cam.lerpPose(from, to, i / 40);
            assert.equal(cam.isClipping(cam.poseToPosition(p), c), false, `${c.id} aspect ${aspect} t=${i / 40}`);
          }
        }
      }
    }
  }
});
