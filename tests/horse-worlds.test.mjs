import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { loadTs, root } from "./helpers/load-ts.mjs";

// The one black Marwari in three places (components/horse-worlds). These tests cover the arithmetic that keeps the ground and the
// horse's stride in step, the switch between places, and the data every place is built from (its pictures must exist and agree
// with the rectangles recorded by the generators in scripts/horse-worlds).

const math = await loadTs("components/horse-worlds/math.ts");
const { GAIT_TABLE, AUTHORED_SLIP_RMS } = await loadTs("components/horse-worlds/gait-table.ts");
const { TransitionMachine } = await loadTs("components/horse-worlds/transition.ts");
const { GAIT_SPEED } = await loadTs("components/horse-worlds/types.ts");
const { WORLDS, gaitFor } = await loadTs("components/horse-worlds/worlds.ts");
const { ATLAS } = await loadTs("components/horse-worlds/atlas-data.ts");
const { worldCopy, worldOrder } = await loadTs("lib/content/horse-worlds.ts");
const { buildTuftGeometry, hoofPressure, BLADES_PER_TUFT } = await loadTs("components/horse-worlds/grass.ts");
const { groundGeometry, GROUND_CUTS } = await loadTs("components/horse-worlds/materials.ts");

const MAX_VARIANTS = 12; // components/horse-worlds/materials.ts
const near = (a, b, tol, msg) => assert.ok(Math.abs(a - b) <= tol, `${msg ?? "value"}: ${a} is not within ${tol} of ${b}`);

/* ------------------------------------------------------------------------------------------------ stride and scroll */
test("v = L x f: every gait in the measured table has the ground speed its stride and frequency give (within 1%)", () => {
  for (const [name, g] of Object.entries(GAIT_TABLE)) {
    const v = math.strideSpeed(g.strideLength, g.strideFrequency);
    assert.ok(Math.abs(v - g.v) / g.v < 0.01, `${name}: L x f = ${v.toFixed(3)} but the table says ${g.v}`);
    near(g.strideFrequency * g.T, 1, 0.01, `${name}: frequency x period`);
  }
});

test("each gait the visitor can ask for sits on a measured speed (within 2%), and stand means the ground stops", () => {
  assert.equal(GAIT_SPEED.stand, 0);
  const measured = { walk: "Walk", trot: "Trot", canter: "Canter_R", gallop: "Gallop_R" };
  for (const [gait, clip] of Object.entries(measured)) {
    const v = GAIT_TABLE[clip].v;
    assert.ok(Math.abs(GAIT_SPEED[gait] - v) / v < 0.02, `${gait}: ${GAIT_SPEED[gait]} m/s against ${clip} at ${v} m/s`);
  }
  const speeds = ["stand", "walk", "trot", "canter", "gallop"].map((g) => GAIT_SPEED[g]);
  assert.deepEqual([...speeds].sort((a, b) => a - b), speeds, "faster gaits must be faster");
});

test("the authored clips slip no more than the measured amounts the speed calibration allows for", () => {
  for (const name of Object.keys(GAIT_TABLE)) assert.ok(AUTHORED_SLIP_RMS[name] > 0 && AUTHORED_SLIP_RMS[name] < 1.3, name);
});

test("d(t + dt) = d(t) + v dt: the distance adds up, and a stopped horse stops the whole world", () => {
  let d = 0;
  for (let i = 0; i < 600; i++) d = math.integrateDistance(d, 1.44, 1 / 60);
  near(d, 14.4, 1e-9, "ten seconds of walking");
  const before = d;
  for (let i = 0; i < 300; i++) d = math.integrateDistance(d, 0, 1 / 60);
  assert.equal(d, before, "with v = 0 nothing may move");
  // the speed does not change the sum, only how fast it is reached: one step of 1 s equals sixty of 1/60 s
  near(math.integrateDistance(0, 3.33, 1), (() => { let x = 0; for (let i = 0; i < 60; i++) x = math.integrateDistance(x, 3.33, 1 / 60); return x; })(), 1e-9);
});

test("layers scroll in proportion to the ground: flat tiles by distance / tile, rings by distance / (2 pi R) x repeats", () => {
  near(math.flatScroll(7, 3.5), 2, 1e-12);
  near(math.flatScroll(0, 3.5), 0, 0);
  near(math.ringScroll(2 * Math.PI * 700, 700, 4), 4, 1e-9, "a full lap of a 700 m ring shows every repeat once");
  assert.ok(math.ringScroll(100, 320, 2) > math.ringScroll(100, 700, 2), "a nearer ring slides faster");
  assert.ok(math.angularRate(4.9, 12) > math.angularRate(4.9, 120) && math.angularRate(4.9, 120) > math.angularRate(4.9, 700), "nearer scenery crosses the view faster");
  near(math.angularRate(4.9, 49) * 49, 4.9, 1e-9);
});

test("a cut-out recycled along the track stays within one span either side and counts laps", () => {
  const span = 256;
  for (const base of [-120, -3, 0, 5, 127]) {
    for (const scroll of [0, 0.5, 130, 255.9, 256, 1000.25]) {
      const { z, lap } = math.wrapAlongTrack(base, scroll, span);
      assert.ok(z >= -span / 2 - 1e-9 && z < span / 2 + 1e-9, `z = ${z}`);
      near(z + lap * span, base - scroll, 1e-9, "position plus laps gives the unwrapped place");
    }
  }
  assert.equal(math.wrapAlongTrack(0, 130, span).z, 126);
  assert.equal(math.wrapAlongTrack(0, 130, span).lap, -1);
});

test("the world scrolls toward -Z: a horse facing +Z moves from the left of the picture to its right", () => {
  const camera = math.shotPosition({ azimuth: 24, elevation: 5, distance: 7, fov: 32, target: [0, 0.95, 0.2] });
  assert.ok(camera[0] < -5, "the camera is on the horse's right side, at -X");
  // the camera looks along +X; its screen-right is the cross product of that look direction with up, i.e. +Z
  const look = [0 - camera[0], 0, 0.2 - camera[2]];
  const right = [-look[2] * 1, 0, look[0] * 1]; // look x up(0,1,0) = (-lz*... ) for the ground plane: (look.z, 0, -look.x) with sign fixed below
  // screen-right r = look x up = (ly*0 - lz*1, lz*0 - lx*0, lx*1 - ly*0) = (-lz, 0, lx)
  assert.ok(right[2] > 0, "screen-right points along +Z");
  // the ground slides toward -Z, i.e. to the screen-left: a point at z moves to a smaller z as the distance grows
  const { z } = math.wrapAlongTrack(10, 4, 256);
  assert.ok(z < 10, "after 4 m of travel a thing that stood at z = 10 stands at z = 6");
});

test("the ground speed follows the stride and is only trimmed by the measurement, never thrown by it", () => {
  const nominal = 3.33;
  assert.equal(math.calibratedGroundSpeed(nominal, null), nominal, "no planted hoof: the stride decides");
  assert.equal(math.calibratedGroundSpeed(0.5, 2), 0.5, "a crawl is left alone");
  const high = math.calibratedGroundSpeed(nominal, 100);
  const low = math.calibratedGroundSpeed(nominal, -100);
  assert.ok(high <= nominal * 1.15 + 1e-9 && low >= nominal * 0.85 - 1e-9, `limits: ${low} .. ${high}`);
  near(math.calibratedGroundSpeed(nominal, nominal), nominal, 1e-12);
});

/* ------------------------------------------------------------------------------------------------ camera */

test("the hoof measurement is trusted at the asked-for pace only, so the ground never surges while the horse slows or sets off", () => {
  const { steadiness, calibratedGroundSpeed } = math;
  assert.equal(steadiness(0), 1);
  assert.equal(steadiness(0.04), 1, "a hair off the pace still counts as at pace");
  assert.equal(steadiness(0.6), 0, "still braking or setting off: the measurement is ignored");
  assert.equal(steadiness(-4.9), 0, "pressing Stand at a canter");
  assert.equal(steadiness(4.9), 0, "pressing Canter at a standstill");
  let last = 1;
  for (let g = 0; g <= 2; g += 0.02) {
    const s = steadiness(g);
    assert.ok(s <= last + 1e-12, "the further from the pace, the less the measurement counts");
    last = s;
  }
  // the failure seen in the viewer: braking from a canter, the hooves read 25% fast and the world was pushed 12% over the stride speed
  assert.ok(calibratedGroundSpeed(4.4, 5.5, 0.85, 0.15, 1) > 4.4 * 1.1);
  assert.equal(calibratedGroundSpeed(4.4, 5.5, 0.85, 0.15, 0), 4.4);
  // at the pace the measurement still trims by at most 15%
  assert.ok(calibratedGroundSpeed(4.4, 9, 0.85, 0.15, 1) <= 4.4 * 1.15 + 1e-9);
});

test("shots put the camera where they say, at the distance they say, looking at the horse", () => {
  for (const [id, world] of Object.entries(WORLDS)) {
    for (const [gait, shot] of Object.entries(world.shots)) {
      const [x, y, z] = math.shotPosition(shot);
      const [tx, ty, tz] = shot.target;
      near(Math.hypot(x - tx, y - ty, z - tz), shot.distance, 1e-9, `${id}/${gait} distance`);
      assert.ok(x < tx, `${id}/${gait}: the camera is on the horse's right side`);
      assert.ok(y > ty - 0.01 && y < ty + 3, `${id}/${gait}: eye level`);
    }
  }
});

test("a narrow screen pulls the camera back so the whole horse stays in; a wide one never moves it closer than the shot", () => {
  const shot = WORLDS.desert.shots.walk;
  const wide = math.fitDistance(shot, 16 / 9);
  const phone = math.fitDistance(shot, 390 / 844);
  assert.equal(wide, shot.distance);
  assert.ok(phone > wide * 1.5, `phone ${phone.toFixed(1)} m against ${wide} m`);
  // at that distance the frame is wide enough for the horse and a margin
  const halfFrame = Math.tan((shot.fov * Math.PI) / 360) * phone * (390 / 844);
  assert.ok(halfFrame >= 2.15, `half frame ${halfFrame.toFixed(2)} m`);
  assert.ok(math.fitDistance(shot, 0.1) <= 40, "never absurdly far");
});

/* ------------------------------------------------------------------------------------------------ switching */
function run(machine, seconds, ready = () => true, dt = 1 / 60) {
  const phases = [];
  let swaps = 0;
  for (let t = 0; t < seconds; t += dt) {
    if (machine.update(dt, ready)) swaps++;
    if (phases[phases.length - 1] !== machine.phase) phases.push(machine.phase);
  }
  return { phases, swaps };
}

test("a switch takes about a second: fade out 0.45 s, swap, fade in 0.55 s, then rest", () => {
  const m = new TransitionMachine("desert");
  assert.equal(m.request("field"), true);
  const { phases, swaps } = run(m, 2);
  assert.deepEqual(phases, ["out", "load", "in", "idle"]);
  assert.equal(swaps, 1);
  assert.equal(m.current, "field");
  assert.ok(m.elapsed > 0.95 && m.elapsed < 1.1, `elapsed ${m.elapsed}`);
  assert.equal(m.fade, 1);
  assert.equal(m.lightMix, 1);
  assert.equal(m.busy, false);
});

test("asking for the world already shown does nothing", () => {
  const m = new TransitionMachine("village");
  assert.equal(m.request("village"), false);
  assert.equal(m.busy, false);
});

test("switches never overlap: a request made mid-switch waits its turn and only the newest is kept", () => {
  const m = new TransitionMachine("desert");
  m.request("field");
  run(m, 0.7); // now fading in
  assert.equal(m.phase, "in");
  m.request("village");
  m.request("desert"); // changed their mind again: the newest wins
  assert.equal(m.queued, "desert");
  const { phases } = run(m, 4);
  assert.equal(m.current, "desert");
  assert.equal(m.busy, false);
  // two complete switches, one after the other, never more than one phase at a time
  assert.deepEqual(phases.filter((p) => p === "out").length, 1, "the second switch had one fade-out");
});

test("a change of mind before the swap fades the same world back in", () => {
  const m = new TransitionMachine("desert");
  m.request("field");
  run(m, 0.2);
  assert.equal(m.phase, "out");
  m.request("desert");
  assert.equal(m.phase, "in");
  const { swaps } = run(m, 2);
  assert.equal(swaps, 0, "nothing was swapped");
  assert.equal(m.current, "desert");
  assert.equal(m.fade, 1);
});

test("the new world is held back for as long as its art takes to arrive, however long that is", () => {
  const m = new TransitionMachine("desert");
  m.request("village");
  let loaded = false;
  run(m, 3, () => loaded);
  assert.equal(m.phase, "load", "still waiting for the pictures");
  assert.equal(m.fade, 0);
  // two minutes on a bad connection: no timer swaps in a place whose art is not here (the old place would be shown under the new name)
  run(m, 120, () => loaded);
  assert.equal(m.phase, "load", "still waiting after two minutes");
  assert.equal(m.fade, 0);
  assert.equal(m.current, "village");
  loaded = true;
  run(m, 1, () => loaded);
  assert.equal(m.phase, "idle");
  assert.equal(m.current, "village");
  assert.equal(m.fade, 1);
});

test("while a place's art is on its way the visitor can choose again: the newest choice is the one waited for", () => {
  const have = new Set(["desert"]);
  const ready = (id) => have.has(id);
  const m = new TransitionMachine("desert");
  m.request("village");
  run(m, 1.5, ready);
  assert.equal(m.phase, "load");
  assert.equal(m.current, "village");
  // the lights had begun to head for the village; they now turn towards the field from the start
  assert.ok(m.lightMix > 0, "the lights were on their way");
  assert.equal(m.request("field"), true);
  assert.equal(m.current, "field");
  assert.equal(m.target, "field");
  assert.equal(m.queued, null, "nothing is queued behind it: there is still only one switch");
  assert.equal(m.phase, "load", "one phase at a time");
  assert.equal(m.lightMix, 0);
  run(m, 30, ready);
  assert.equal(m.phase, "load", "the field's art has not come, so the field is not shown");
  assert.equal(m.fade, 0);
  // asking for the place being waited for again changes nothing
  assert.equal(m.request("field"), true);
  assert.equal(m.current, "field");
  have.add("field");
  const { phases } = run(m, 2, ready);
  assert.deepEqual(phases, ["in", "idle"]);
  assert.equal(m.current, "field");
  assert.equal(m.busy, false);
  assert.equal(m.fade, 1);
  assert.equal(m.lightMix, 1);
});

test("asking for the place that is still on screen while the next one loads brings it straight back, with no second fade-out", () => {
  const have = new Set(["desert"]); // the desert is what was on screen; the village is slow
  const ready = (id) => have.has(id);
  const m = new TransitionMachine("desert");
  m.request("village");
  run(m, 2, ready);
  assert.equal(m.phase, "load");
  m.request("desert");
  assert.equal(m.current, "desert");
  const { phases, swaps } = run(m, 2, ready);
  assert.deepEqual(phases, ["in", "idle"], "straight to the fade-in");
  assert.equal(swaps, 0);
  assert.equal(m.current, "desert");
  assert.equal(m.fade, 1);
  assert.equal(m.lightMix, 1);
  assert.equal(m.busy, false);
  // the village's art arriving afterwards changes nothing on screen
  have.add("village");
  run(m, 2, ready);
  assert.equal(m.current, "desert");
  assert.equal(m.busy, false);
});

test("fade is smooth and monotonic through a switch (no flashes)", () => {
  const m = new TransitionMachine("desert");
  m.request("field");
  let last = 1;
  let wentDown = true;
  for (let t = 0; t < 1.2; t += 1 / 60) {
    m.update(1 / 60, () => true);
    if (wentDown && m.fade > last + 1e-9) wentDown = false;
    if (!wentDown && m.fade < last - 1e-9) assert.fail("the fade went down after it began to come up");
    last = m.fade;
  }
  assert.equal(m.fade, 1);
});

/* ------------------------------------------------------------------------------------------------ the worlds */
test("there are exactly three worlds, in order, named as the buttons say", () => {
  assert.deepEqual(worldOrder, ["desert", "field", "village"]);
  assert.deepEqual(Object.keys(WORLDS), ["desert", "field", "village"]);
  assert.deepEqual(worldOrder.map((id) => worldCopy[id].label), ["Desert", "Horse Field", "Village"]);
  for (const id of worldOrder) {
    assert.equal(WORLDS[id].id, id);
    assert.equal(WORLDS[id].label, worldCopy[id].label);
    assert.ok(worldCopy[id].announce.length > 10 && worldCopy[id].caption.length > 20);
  }
});

test("each world offers the gaits that suit it, with a camera shot for every gait the horse can be asked for", () => {
  assert.deepEqual(WORLDS.desert.gaits, ["stand", "walk", "canter", "gallop"]);
  assert.deepEqual(WORLDS.field.gaits, ["stand", "walk", "trot", "canter"]);
  assert.deepEqual(WORLDS.village.gaits, ["stand", "walk"], "the village is calm and slow");
  for (const [id, w] of Object.entries(WORLDS)) {
    assert.ok(w.gaits.includes(w.defaultGait), `${id}: default gait is one it offers`);
    for (const g of Object.keys(GAIT_SPEED)) {
      const s = w.shots[g];
      assert.ok(s, `${id}: shot for ${g}`);
      assert.ok(s.fov >= 24 && s.fov <= 42 && s.distance >= 5 && s.distance <= 12 && s.elevation >= 0 && s.elevation <= 15, `${id}/${g}: a calm, full-body shot`);
    }
    // the camera is guided, not free: a faster gait never pulls in closer than a slower one
    const order = ["stand", "walk", "trot", "canter", "gallop"];
    for (let i = 1; i < order.length; i++) assert.ok(w.shots[order[i]].distance >= w.shots[order[i - 1]].distance, `${id}: ${order[i]} is no closer than ${order[i - 1]}`);
  }
});

test("asking for a gait a world does not offer gives the nearest one it does, preferring the calmer", () => {
  assert.equal(gaitFor(WORLDS.village, "gallop"), "walk");
  assert.equal(gaitFor(WORLDS.village, "trot"), "walk");
  assert.equal(gaitFor(WORLDS.field, "gallop"), "canter");
  assert.equal(gaitFor(WORLDS.desert, "trot"), "walk", "a tie goes to the calmer gait");
  assert.equal(gaitFor(WORLDS.desert, "gallop"), "gallop");
  assert.equal(gaitFor(WORLDS.field, "stand"), "stand");
});

const fieldsOf = (w) => [w.mid, ...(w.extra ?? []), w.fore];
const publicFile = (url) => path.join(root, "public", url.replace(/^\//, ""));

test("every picture a world names exists, in full size and for phones", () => {
  for (const [id, w] of Object.entries(WORLDS)) {
    const files = [w.ground.albedo, w.ground.albedoMobile, w.ground.normal, w.ground.normalMobile, w.distant.image, w.distant.imageMobile];
    for (const f of fieldsOf(w)) files.push(f.image, f.imageMobile);
    for (const f of files.filter(Boolean)) {
      assert.ok(f.startsWith(`/images/horse-worlds/${id}/`), `${id}: ${f} belongs in its own folder`);
      assert.ok(existsSync(publicFile(f)), `${id}: ${f} is missing`);
    }
    if (w.ground.normal) {
      assert.ok(w.ground.normalMobile, `${id}: phones need a lighter detail map`);
      const [nw, nh] = webpSize(publicFile(w.ground.normal));
      const [mw, mh] = webpSize(publicFile(w.ground.normalMobile));
      assert.ok(Math.abs(mw * 2 - nw) <= 1 && Math.abs(mh * 2 - nh) <= 1, `${id}: the phone detail map is half size`);
      assert.ok(statSync(publicFile(w.ground.normalMobile)).size < statSync(publicFile(w.ground.normal)).size, `${id}: the phone detail map is lighter`);
    }
    for (const f of [w.ground.albedo, w.distant.image, ...fieldsOf(w).map((x) => x.image)]) assert.ok(existsSync(publicFile(f.replace(/\.webp$/, "-m.webp"))), `${id}: no phone copy of ${f}`);
  }
  for (const id of worldOrder) assert.ok(existsSync(path.join(root, "public/images/horse-worlds/posters", `${id}.webp`)), `still for ${id}`);
});

test("the scenery is original: no file name hints at a supplied reference image or a horse", () => {
  const dir = path.join(root, "public/images/horse-worlds");
  const walk = (d) => readdirSync(d).flatMap((n) => (statSync(path.join(d, n)).isDirectory() ? walk(path.join(d, n)) : [path.join(d, n)]));
  for (const f of walk(dir)) assert.ok(!/ref|reference|stallion|marwari|horse(?!-worlds)|amigos/i.test(path.relative(dir, f)), f);
});

// a WebP file's size, read from its header (lossy VP8, lossless VP8L, extended VP8X)
function webpSize(file) {
  const b = readFileSync(file);
  assert.equal(b.toString("ascii", 0, 4), "RIFF");
  assert.equal(b.toString("ascii", 8, 12), "WEBP");
  const kind = b.toString("ascii", 12, 16);
  if (kind === "VP8X") return [1 + b.readUIntLE(24, 3), 1 + b.readUIntLE(27, 3)];
  if (kind === "VP8L") {
    const v = b.readUInt32LE(21);
    return [1 + (v & 0x3fff), 1 + ((v >> 14) & 0x3fff)];
  }
  return [b.readUInt16LE(26) & 0x3fff, b.readUInt16LE(28) & 0x3fff];
}

test("the cut-out rectangles recorded by the generators lie inside their pictures, which are the size they say", () => {
  const image = new Map();
  for (const w of Object.values(WORLDS)) for (const f of fieldsOf(w)) image.set(f.atlas, f.image);
  for (const [key, data] of Object.entries(ATLAS)) {
    const file = image.get(key);
    if (!file) continue;
    const [w, h] = webpSize(publicFile(file));
    assert.deepEqual([w, h], data.size, `${key}: the picture is ${w} x ${h}`);
    const [mw, mh] = webpSize(publicFile(file.replace(/\.webp$/, "-m.webp")));
    assert.ok(Math.abs(mw * 2 - w) <= 1 && Math.abs(mh * 2 - h) <= 1, `${key}: the phone copy is half size`);
    for (const v of data.variants) {
      const [x, y, rw, rh] = v.rect;
      assert.ok(x >= 0 && y >= 0 && x + rw <= w && y + rh <= h, `${key}/${v.name}: rectangle ${v.rect} inside ${w} x ${h}`);
      assert.ok(v.width > 0 && v.height > 0 && v.weight > 0, `${key}/${v.name}`);
      // the picture's pixels per metre match the size the cut-out is given in the world: nothing is visibly stretched
      // (a few percent is allowed for the tiny hand-sized ground cover)
      near(rw / v.width, rh / v.height, Math.max(rw / v.width, rh / v.height) * 0.05, `${key}/${v.name} pixels per metre`);
    }
  }
});

test("every field draws only cut-outs that exist, and no more than the shader can hold", () => {
  for (const [id, w] of Object.entries(WORLDS)) {
    for (const f of fieldsOf(w)) {
      const data = ATLAS[f.atlas];
      assert.ok(data, `${id}: atlas ${f.atlas}`);
      const names = new Set(data.variants.map((v) => v.name));
      for (const p of f.pick ?? []) assert.ok(names.has(p), `${id}: ${f.atlas} has no ${p}`);
      const used = f.pick ? f.pick.length : data.variants.length;
      assert.ok(used >= 1 && used <= MAX_VARIANTS, `${id}: ${f.atlas} uses ${used} variants`);
      assert.ok(f.span >= 64 && f.fade > 0 && f.fade < f.span / 4, `${id}: ${f.atlas} span and fade`);
      assert.ok(f.shadow >= 0 && f.shadow <= 1 && f.sway >= 0 && f.sway <= 0.05);
      if (f.layout === "scatter") assert.ok(f.count > 0 && (f.countMobile ?? f.count) <= f.count, `${id}: ${f.atlas} counts`);
    }
  }
});

test("house fronts are rows exactly one house wide, so a street is continuous with no gaps and no overlap", () => {
  let rows = 0;
  for (const [id, w] of Object.entries(WORLDS)) {
    for (const f of fieldsOf(w).filter((x) => x.layout === "row")) {
      rows++;
      assert.ok(f.spacing > 0, `${id}: a row needs its spacing`);
      assert.equal(f.scale[0], f.scale[1], `${id}: a row keeps one size`);
      const data = ATLAS[f.atlas];
      const picked = data.variants.filter((v) => !f.pick || f.pick.includes(v.name));
      for (const v of picked) near(v.width * f.scale[0], f.spacing, 0.02, `${id}: ${v.name} is ${v.width * f.scale[0]} m wide in a ${f.spacing} m row`);
      near(f.span / f.spacing, Math.round(f.span / f.spacing), 1e-9, `${id}: the span holds a whole number of cut-outs`);
    }
  }
  assert.ok(rows >= 3, "the village has two streets and the field its fence");
});

test("the horse keeps clear of walls and trees, and the foreground stays low and out of the way of the hooves", () => {
  for (const [id, w] of Object.entries(WORLDS)) {
    for (const f of [w.mid, ...(w.extra ?? [])]) assert.ok(f.x[0] >= 5 && f.x[1] >= f.x[0], `${id}: ${f.atlas} starts at ${f.x[0]} m`);
    for (const f of (w.extra ?? []).filter((x) => x.layout === "row" || x.facing === "track")) assert.ok(f.x[0] >= 5);
    assert.ok(w.fore.x[0] < -1.8 && w.fore.x[1] < -1.8 && w.fore.x[0] > -6, `${id}: foreground between the camera and the horse, not on it`);
  }
  // walls of the village stand well back of the lane
  assert.ok(WORLDS.village.mid.x[0] >= 9);
  for (const v of ATLAS["village.fore"].variants) assert.ok(v.height <= 0.7, `${v.name} is low`);
});

test("light, fog and the ground are set for every world, and the village's low sun lies behind its roofs", () => {
  for (const [id, w] of Object.entries(WORLDS)) {
    const [x, y, z] = w.light.sunDir;
    assert.ok(Math.hypot(x, y, z) > 0.5 && y > 0 && y < 0.7, `${id}: the sun is above the horizon and fairly low`);
    assert.ok(w.fog.density > 0.001 && w.fog.density < 0.02, `${id}: fog`);
    assert.ok(w.ground.tileMetres >= 2 && w.ground.tileMetres <= 6, `${id}: tile`);
    assert.ok(w.light.exposure > 0.8 && w.light.exposure < 1.5, `${id}: exposure`);
    assert.match(w.fog.color, /^#[0-9a-f]{6}$/i);
    assert.ok(w.distant.radius >= 200 && w.distant.height > 20 && w.distant.repeats >= 1);
  }
  assert.ok(WORLDS.village.light.sunDir[0] > 0.4, "the village sun is on the far side of the roofs, so their shadows fall across the lane");
  assert.ok(WORLDS.village.light.sunDir[1] < 0.4, "and it is low");
});

/* ------------------------------------------------------------------------------------------------ the grass */
test("the field has short grass, kept low enough to leave the hooves in view; the other places have dust instead", () => {
  const g = WORLDS.field.grass;
  assert.ok(g, "the field has grass");
  assert.ok(g.height > 0.04 && g.height <= 0.12, `blades of ${g.height} m`);
  assert.ok(g.countMobile < g.count && g.countMobile > 500);
  assert.ok(g.bend > 0 && g.bend <= 1.2 && g.sway >= 0 && g.sway <= 1);
  assert.ok(g.area[0] >= 3 && g.area[1] >= 6, "the patch reaches past the frame on both sides");
  assert.equal(WORLDS.desert.grass, undefined);
  assert.equal(WORLDS.village.grass, undefined);
  assert.ok(WORLDS.desert.surface.dust > WORLDS.field.surface.dust, "sand kicks up more than turf");
});

test("a hoof presses the grass fully while planted, a little while it brushes past, and not at all once it is high", () => {
  assert.equal(hoofPressure(true, 0), 1);
  assert.equal(hoofPressure(true, 0.5), 1);
  assert.equal(hoofPressure(false, 0.2), 0);
  assert.equal(hoofPressure(false, 0.02), 0.5);
  let last = 0.5;
  for (let h = 0.02; h <= 0.16; h += 0.01) {
    const p = hoofPressure(false, h);
    assert.ok(p <= last + 1e-9, "pressure only falls as the hoof rises");
    last = p;
  }
});

test("a tuft is a handful of tapering blades, built the same way every time", () => {
  const a = buildTuftGeometry();
  const b = buildTuftGeometry();
  assert.equal(a.getAttribute("position").count, BLADES_PER_TUFT * 7);
  assert.equal(a.index.count, BLADES_PER_TUFT * 15);
  assert.deepEqual(Array.from(a.getAttribute("position").array), Array.from(b.getAttribute("position").array));
  const uv = a.getAttribute("uv");
  const pos = a.getAttribute("position");
  for (let i = 0; i < pos.count; i++) {
    assert.ok(uv.getY(i) >= 0 && uv.getY(i) <= 1);
    assert.ok(pos.getY(i) >= 0 && pos.getY(i) <= 1.3, "unit height, a little over for the longest blade");
  }
  for (let i = 0; i < a.getAttribute("normal").count; i++) assert.equal(a.getAttribute("normal").getY(i), 1);
});

test("the ground is a fine grid about the hooves, level and facing up, not two huge triangles", () => {
  // Two triangles 1.8 km across make the GPU interpolate texture and shadow coordinates over a triangle thousands of times larger
  // than the picture; the rounding moved the sand 2-3 cm on every third or fourth frame. The grid keeps every triangle small.
  const size = 1800;
  const g = groundGeometry(size);
  const pos = g.getAttribute("position");
  const index = g.index;
  assert.equal(pos.count, (2 * GROUND_CUTS + 1) ** 2);
  assert.equal(index.count / 3, 2 * (2 * GROUND_CUTS) ** 2);
  let xmin = 1e9, xmax = -1e9, zmin = 1e9, zmax = -1e9, hasOrigin = false;
  for (let i = 0; i < pos.count; i++) {
    assert.equal(pos.getY(i), 0, "the ground is exactly level, so a planted hoof can meet it");
    xmin = Math.min(xmin, pos.getX(i)); xmax = Math.max(xmax, pos.getX(i));
    zmin = Math.min(zmin, pos.getZ(i)); zmax = Math.max(zmax, pos.getZ(i));
    if (pos.getX(i) === 0 && pos.getZ(i) === 0) hasOrigin = true;
  }
  assert.ok(hasOrigin, "the point under the horse is a grid point");
  near(xmin, -size / 2, 1e-6, "west edge"); near(xmax, size / 2, 1e-6, "east edge");
  near(zmin, -size / 2, 1e-6, "south edge"); near(zmax, size / 2, 1e-6, "north edge");
  // every triangle faces up (counter-clockwise seen from above), is never huge, and the ones at the hooves are about a metre across
  let nearest = 1e9, biggest = 0, area = 0;
  for (let t = 0; t < index.count; t += 3) {
    const [a, b, c] = [index.getX(t), index.getX(t + 1), index.getX(t + 2)];
    const ax = pos.getX(a), az = pos.getZ(a);
    const e1 = [pos.getX(b) - ax, pos.getZ(b) - az], e2 = [pos.getX(c) - ax, pos.getZ(c) - az];
    const upward = e2[0] * e1[1] - e2[1] * e1[0]; // y component of (c - a) x (b - a) with y up
    assert.ok(upward > 0, `triangle ${t / 3} faces down`);
    area += upward / 2;
    biggest = Math.max(biggest, Math.hypot(...e1), Math.hypot(...e2), Math.hypot(e2[0] - e1[0], e2[1] - e1[1]));
    const cx = (ax + pos.getX(b) + pos.getX(c)) / 3, cz = (az + pos.getZ(b) + pos.getZ(c)) / 3;
    nearest = Math.min(nearest, Math.hypot(cx, cz));
  }
  near(area, size * size, 1, "the triangles tile the whole square exactly");
  assert.ok(biggest < 110, `no triangle edge longer than 110 m (longest ${biggest.toFixed(1)} m)`);
  assert.ok(nearest < 1.5, "triangles reach right in to the hooves");
  const n = g.getAttribute("normal");
  for (let i = 0; i < n.count; i++) near(n.getY(i), 1, 1e-6, "normals point up");
});
