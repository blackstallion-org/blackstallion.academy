import test from "node:test";
import assert from "node:assert/strict";
import { loadTs } from "./helpers/load-ts.mjs";

// The anatomy atlas rig (lib/anatomy/atlas-rig.ts): hooves stay planted through the stance, clear the ground in the swing,
// every gait loops seamlessly, and the footfall order matches the textbook sequences.
const rig = await loadTs("lib/anatomy/atlas-rig.ts");
const scene = await loadTs("lib/anatomy/atlas-scene.ts");
const { STRUCTURES, LABELS, CONNECTIONS } = await loadTs("lib/content/anatomy-atlas.ts");

const LIMBS = ["LF", "RF", "LH", "RH"];
const soleOf = (pz, id) => {
  const near = id.startsWith("L");
  const base = id.endsWith("F") ? rig.REST.fore.K : rig.REST.hind.K;
  const off = near ? [0, 0] : rig.FAR_OFFSET;
  return { p: rig.place(pz, [`${id}.hoof`, base[0] + off[0] + rig.REST.sole[0], base[1] + off[1] + rig.REST.sole[1]]), ground: rig.GROUND + off[1] };
};

test("stance hooves stay on the ground and do not slide; swing hooves clear it", () => {
  for (const gait of ["walk", "trot", "canter"]) {
    const g = rig.GAITS[gait];
    for (const id of LIMBS) {
      let prev = null;
      for (let i = 0; i < 200; i++) {
        const phase = i / 200;
        const pz = rig.pose(gait, phase);
        const limb = pz.limbs[id];
        const { p, ground } = soleOf(pz, id);
        if (limb.stance && limb.u < 0.75) {
          assert.ok(Math.abs(p[1] - ground) < 1.5, `${gait} ${id} phase ${phase}: sole at ${p[1].toFixed(1)}, ground ${ground}`);
          // the hoof moves back under the body at the body's speed, nothing more (no skating)
          if (prev && prev.stance) {
            const expected = (g.stride / g.duty) * (1 / 200);
            assert.ok(Math.abs(p[0] - prev.x - expected) < 1.2, `${gait} ${id} phase ${phase}: hoof slid`);
          }
        }
        if (!limb.stance && limb.u > 0.15 && limb.u < 0.75) {
          assert.ok(p[1] < ground - 2, `${gait} ${id} phase ${phase}: swing hoof touches the ground (${p[1].toFixed(1)})`);
        }
        prev = { stance: limb.stance && limb.u < 0.75, x: p[0] };
      }
    }
  }
});

test("each gait loops: the pose at the end of a stride is the pose at its start", () => {
  for (const gait of ["walk", "trot", "canter"]) {
    const a = rig.pose(gait, 0);
    const b = rig.pose(gait, 0.99999);
    for (const id of LIMBS) {
      const pa = a.limbs[id].joints.F;
      const pb = b.limbs[id].joints.F;
      assert.ok(Math.hypot(pa[0] - pb[0], pa[1] - pb[1]) < 1, `${gait} ${id} fetlock jumps at the loop`);
    }
  }
});

test("footfall sequences: walk four-beat lateral, trot diagonal pairs, canter three-beat on the right lead", () => {
  const order = (gait) => [...LIMBS].sort((x, y) => rig.GAITS[gait].offset[x] - rig.GAITS[gait].offset[y]);
  assert.deepEqual(order("walk"), ["LH", "LF", "RH", "RF"]);
  const t = rig.GAITS.trot.offset;
  assert.equal(t.LF, t.RH);
  assert.equal(t.RF, t.LH);
  assert.equal(Math.abs(t.LF - t.RF), 0.5);
  const c = rig.GAITS.canter.offset;
  assert.ok(c.LH < c.RH && Math.abs(c.RH - c.LF) < 0.05 && c.RF > c.LF, "canter: LH, then RH + LF, then RF");
  // the walk always has two or three hooves down; the trot and canter have a moment of suspension
  for (let i = 0; i < 100; i++) {
    const n = LIMBS.filter((id) => rig.pose("walk", i / 100).limbs[id].stance).length;
    assert.ok(n >= 2 && n <= 3, `walk phase ${i / 100}: ${n} hooves down`);
  }
  const airborne = (gait) => Array.from({ length: 200 }, (_, i) => LIMBS.every((id) => !rig.pose(gait, i / 200).limbs[id].stance)).some(Boolean);
  assert.ok(airborne("trot"), "trot has suspension");
  assert.ok(airborne("canter"), "canter has suspension");
});

test("every label and connection names a described structure, and every shape has geometry", () => {
  for (const view of Object.keys(LABELS)) for (const l of LABELS[view]) assert.ok(STRUCTURES[l.s], `label ${l.s}`);
  for (const c of CONNECTIONS) for (const s of c.lights) assert.ok(STRUCTURES[s], `connection ${c.id} → ${s}`);
  const g = scene.geometry(rig.pose("walk", 0.3));
  for (const s of scene.SHAPES) {
    if (s.id.startsWith("cart-")) continue;
    assert.ok(g[s.id] && !g[s.id].includes("NaN"), `shape ${s.id}`);
    if (s.structure) assert.ok(STRUCTURES[s.structure], `shape ${s.id} → ${s.structure}`);
  }
});
