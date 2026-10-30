// "Bronze and Time" (home): the scroll choreography is plain numbers, so it is tested as numbers: when each chapter is on screen,
// how the progress bar and the drifting grid dots follow the scroll, where the camera is, and that the statue steps aside for
// each chapter's text and never comes within reach of the camera. Also the chapters' words against the claims ledger.
// Does NOT prove how it looks or how fast it draws: that is checked in a browser (see PROGRESS.md). Run with `npm test`.
import { test } from "node:test";
import assert from "node:assert/strict";
import { loadTs } from "./helpers/load-ts.mjs";

const C = await loadTs("lib/bronze/choreography.ts");
const S = await loadTs("lib/bronze/shaders.ts");
const { bronze, statuePose } = await loadTs("lib/content/bronze.ts");

const LANDSCAPE = C.framing(1440 / 900);
const PHONE = C.framing(390 / 844);
const near = (a, b, eps = 1e-9) => Math.abs(a - b) <= eps;

test("the four chapters follow one another without overlapping, and the index jumps land inside their own chapter", () => {
  assert.deepEqual(C.BEATS.map((b) => b.id), ["bronze", "stillness", "form", "record"]);
  for (let i = 0; i < C.BEATS.length; i++) {
    const b = C.BEATS[i];
    assert.ok(b.from < b.to, `${b.id} window`);
    assert.ok(b.jump >= b.from && b.jump <= b.to, `${b.id} index jump is inside its window`);
    if (i > 0) assert.ok(C.BEATS[i - 1].to < b.from, `${b.id} starts after ${C.BEATS[i - 1].id} ends`);
    const states = C.beatStates(b.jump);
    assert.deepEqual(states, C.BEATS.map((_, k) => k === i), `only ${b.id} is on screen at its jump`);
  }
  for (const gap of [0.2, 0.5, 0.75]) assert.deepEqual(C.beatStates(gap), [false, false, false, false], `nothing at ${gap}`);
  assert.deepEqual(C.beatStates(0), [true, false, false, false], "the first chapter is there from the very top");
  assert.deepEqual(C.beatStates(1), [false, false, false, true], "the last chapter is still there at the very bottom");
});

test("the stories bar fills one dash per quarter of the track", () => {
  for (let i = 0; i < 4; i++) {
    assert.equal(C.dashFill(i * 0.25, i), 0, `dash ${i} is empty when its quarter starts`);
    assert.ok(near(C.dashFill(i * 0.25 + 0.125, i), 0.5), `dash ${i} is half full half way through its quarter`);
    assert.equal(C.dashFill((i + 1) * 0.25, i), 1, `dash ${i} is full when its quarter ends`);
    assert.equal(C.dashFill(-1, i), 0);
    assert.equal(C.dashFill(2, i), 1);
  }
  assert.equal(C.dashFill(0.6, 0), 1);
  assert.equal(C.dashFill(0.6, 3), 0);
});

test("grid dots start where the reference page puts them, drift both ways and always stay inside the stage", () => {
  for (let i = 0; i < 10; i++) {
    assert.ok(near(C.gridDotTop(i, 0), ((i * 17) % 80) + 10), `dot ${i} start`);
    for (let p = 0; p <= 1.0001; p += 0.05) {
      const y = C.gridDotTop(i, p);
      assert.ok(y >= 0 && y < 100, `dot ${i} at ${p.toFixed(2)} is ${y}`);
    }
  }
  // even dots travel up the stage as the page scrolls (their top decreases) and odd dots down, before wrapping
  assert.ok(C.gridDotTop(1, 0.01) > C.gridDotTop(1, 0));
  assert.ok(C.gridDotTop(2, 0.01) < C.gridDotTop(2, 0));
});

test("framing: a landscape screen gets the reference camera, a phone gets it pulled back with no sideways step", () => {
  assert.deepEqual(LANDSCAPE, { distance: 1, shift: 1, lookY: -0.15 });
  assert.equal(PHONE.shift, 0);
  assert.ok(PHONE.distance > 1.5 && PHONE.distance <= 2.2, `phone distance ${PHONE.distance}`);
  assert.equal(C.framing(0.1).distance, 2.2, "a very narrow window is clamped");
  assert.equal(C.framing(0.99).shift, 0, "just under square is already a one-column layout");
  assert.equal(C.framing(1).shift, 1);
});

test("the camera starts in front of the statue, turns once and ends where it began", () => {
  const start = C.orbit(0, LANDSCAPE);
  assert.ok(near(start.position[0], 0) && near(start.position[1], 0.35) && near(start.position[2], 4.2), `start ${start.position}`);
  assert.ok(near(start.lookAt[0], -0.9) && near(start.lookAt[1], -0.15) && near(start.lookAt[2], 0), `look ${start.lookAt}`);
  const end = C.orbit(1, LANDSCAPE);
  for (let k = 0; k < 3; k++) assert.ok(near(end.position[k], start.position[k], 1e-9), `axis ${k} closes the circle`);
  // a quarter of the way round the camera stands on the statue's side, half way round behind it
  assert.ok(C.orbit(0.25, LANDSCAPE).position[0] > 3);
  assert.ok(C.orbit(0.5, LANDSCAPE).position[2] < -3);
  assert.ok(near(C.orbit(0, PHONE).lookAt[0], 0), "a phone looks straight at the statue");
});

test("the camera never comes within reach of the statue (it is 2.7 units long, centred on the origin)", () => {
  for (const view of [LANDSCAPE, PHONE]) {
    for (let p = 0; p <= 1.0001; p += 0.005) {
      const [x, y, z] = C.orbit(p, view).position;
      const distance = Math.hypot(x, y, z);
      assert.ok(distance >= 3.6 * view.distance - 1e-9, `at ${p.toFixed(3)} the camera is ${distance.toFixed(2)} from the statue's centre`);
    }
  }
});

test("the statue stands clear of each chapter's text: right, right, left, right, measured along the camera's own right-hand axis", () => {
  const where = (p) => {
    const { position, lookAt } = C.orbit(p, LANDSCAPE);
    const phi = Math.atan2(position[0], position[2]);
    const right = [Math.cos(phi), 0, -Math.sin(phi)];
    // the statue is at the origin: how far right of the middle of the picture it stands, in world units
    return -(lookAt[0] * right[0] + lookAt[2] * right[2]);
  };
  const expected = [C.BEATS[0].jump, C.BEATS[1].jump, C.BEATS[2].jump, C.BEATS[3].jump].map((p) => ({ p, side: C.sideOffset(p) }));
  assert.ok(expected[0].side > 0 && expected[1].side > 0 && expected[2].side < 0 && expected[3].side > 0, JSON.stringify(expected));
  for (const { p, side } of expected) assert.ok(near(where(p), side, 1e-9), `at ${p} the statue stands ${where(p)} right, wanted ${side}`);
  assert.ok(near(where(0), 0.9, 1e-9), "the first screen is the reference page's own offset");
  // a phone has no room beside the statue: it stays in the middle all the way
  for (let p = 0; p <= 1; p += 0.1) assert.ok(near(C.orbit(p, PHONE).lookAt[0], 0) && near(C.orbit(p, PHONE).lookAt[2], 0), `phone at ${p.toFixed(1)}`);
});

test("the side offset glides: no jumps between neighbouring scroll positions, and it is clamped outside the track", () => {
  let last = C.sideOffset(0);
  for (let p = 0.001; p <= 1.0001; p += 0.001) {
    const now = C.sideOffset(p);
    assert.ok(Math.abs(now - last) < 0.02, `jump of ${Math.abs(now - last)} at ${p.toFixed(3)}`);
    last = now;
  }
  assert.equal(C.sideOffset(-5), C.sideOffset(0));
  assert.equal(C.sideOffset(5), C.sideOffset(1));
});

test("easing is frame-rate independent: two half steps are one whole step", () => {
  const k = 0.025;
  assert.ok(near(C.lerpFactor(k, 1 / 60), k, 1e-12));
  const half = C.lerpFactor(k, 1 / 120);
  assert.ok(near(1 - (1 - half) * (1 - half), C.lerpFactor(k, 1 / 60), 1e-12));
  assert.ok(C.lerpFactor(k, 0.05) > C.lerpFactor(k, 1 / 60), "a slower frame moves further");
  assert.equal(C.lerpFactor(k, 0), 0);
});

test("the liquid-bronze shader keeps its contract with the engine", () => {
  for (const uniform of ["uTime", "uResolution", "uMouse", "uScroll"]) assert.match(S.WAVE_FRAGMENT, new RegExp(`uniform\\s+\\w+\\s+${uniform}\\b`));
  assert.match(S.WAVE_FRAGMENT, /gl_FragColor\s*=/);
  assert.match(S.WAVE_VERTEX, /gl_Position/);
});

test("the chapters: one per beat, in order, two-line titles, and nothing the claims ledger forbids", () => {
  assert.deepEqual(bronze.beats.map((b) => b.id), C.BEATS.map((b) => b.id));
  const words = [];
  for (const b of bronze.beats) {
    assert.equal(b.title.length, 2, `${b.id} title is two lines`);
    assert.ok(b.title.every((t) => t.trim().length > 0));
    assert.ok(b.nav.length > 0 && b.body.length >= 1 && b.body.every((t) => t.trim().length > 40), `${b.id} copy`);
    words.push(...b.title, ...b.body, ...(b.links ?? []).map((l) => l.label));
  }
  const text = [...words, bronze.note, bronze.describe].join(" \n ");
  for (const banned of [/40\s*%\s*cortisol/i, /300\s*\+\s*muscles/i, /tech[- ]?neck/i, /zero joint impact/i, /110 pelvic/i, /guarantee/i, /\bproven\b/i, /\b\d+\s*%/]) {
    assert.doesNotMatch(text, banned, `chapter copy must not make the claim ${banned}`);
  }
  assert.match(bronze.note, /not a real statue/i, "the bronze is a rendering and says so");
  assert.match(text, /eight hundred years/i);
  const last = bronze.beats[3];
  assert.deepEqual(last.links.map((l) => l.href), ["/cadets#passport", "/legend"]);
});

test("the statue is cast from one instant of a clip the model has", () => {
  assert.equal(statuePose.clip, "Walk");
  assert.ok(statuePose.time >= 0 && statuePose.time < 0.8, "inside the 0.8 s walk");
});
