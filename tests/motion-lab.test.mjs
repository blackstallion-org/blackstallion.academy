// Motion lab: the signal-processing and decoding maths. The signals built here are SYNTHETIC and exist only to check the maths
// (a sine of known frequency and phase must come back as that frequency and phase). They are not tracking results; the real
// models are exercised on real footage by scripts/motion-lab-verify.mjs (docs/MOTION_LAB.md).
import { test } from "node:test";
import assert from "node:assert/strict";
import { loadTs } from "./helpers/load-ts.mjs";

const S = await loadTs("lib/motion-lab/skeleton.ts");
const D = await loadTs("lib/motion-lab/detect.ts");
const P = await loadTs("lib/motion-lab/pose.ts");
const A = await loadTs("lib/motion-lab/analysis.ts");
const T = await loadTs("lib/motion-lab/tracker.ts");
const SP = await loadTs("lib/motion-lab/species.ts");

test("skeleton: 17 AP-10K keypoints, every edge joins two of them, angles use real keypoints", () => {
  assert.equal(S.KEYPOINTS.length, 17);
  assert.equal(new Set(S.KEYPOINTS).size, 17);
  for (const e of S.EDGES) { assert.ok(e.a >= 0 && e.a < 17 && e.b >= 0 && e.b < 17 && e.a !== e.b); }
  assert.equal(S.KP.tail_root, 4);
  assert.equal(S.KP.right_hind_paw, 16);
  for (const a of S.ANGLES) for (const k of [a.a, a.b, a.c]) assert.ok(k >= 0 && k < 17);
});

test("detector: letterbox fits the longer side, the grid has 3549 anchors in the model's order", () => {
  const l = D.letterbox(1280, 720);
  assert.equal(l.w, 416); assert.equal(l.h, 234); assert.ok(Math.abs(l.scale - 0.325) < 1e-9);
  assert.equal(D.GRID.count, 3549);
  assert.equal(D.GRID.st[0], 8); assert.equal(D.GRID.st[52 * 52], 16); assert.equal(D.GRID.st[52 * 52 + 26 * 26], 32);
  assert.equal(D.GRID.gx[1], 1); assert.equal(D.GRID.gy[52], 1);
});

test("detector: a raw head with a confident horse anchor decodes to a box in source pixels; other classes and weak scores are dropped", () => {
  const out = new Float32Array(D.DET_ANCHORS * D.DET_STRIDE);
  const anchor = 52 * 20 + 30;                        // stride-8 grid cell (x=30, y=20)
  const o = anchor * D.DET_STRIDE;
  out[o] = 0.5; out[o + 1] = 0.5; out[o + 2] = Math.log(10); out[o + 3] = Math.log(5);   // centre (30.5, 20.5) cells, 10 x 5 cells wide
  out[o + 4] = 0.9; out[o + HORSE_IDX()] = 0.8;
  const weak = (52 * 40 + 10) * D.DET_STRIDE;
  out[weak + 4] = 0.9; out[weak + 5 + 0] = 0.9;       // a "person"
  const boxes = D.decodeHorses(out, 0.325, 1280, 720);
  assert.equal(boxes.length, 1);
  const b = boxes[0];
  assert.ok(Math.abs(b.score - 0.72) < 1e-6);
  const cx = (30.5 * 8) / 0.325, w = (10 * 8) / 0.325;
  assert.ok(Math.abs((b.x1 + b.x2) / 2 - cx) < 1e-3);
  assert.ok(Math.abs(b.x2 - b.x1 - w) < 1e-3);
});
function HORSE_IDX() { return 5 + D.HORSE_CLASS; }

test("detector: overlapping boxes collapse to the best one (NMS)", () => {
  const boxes = [{ x1: 0, y1: 0, x2: 100, y2: 100, score: 0.9 }, { x1: 5, y1: 5, x2: 105, y2: 105, score: 0.8 }, { x1: 300, y1: 0, x2: 400, y2: 100, score: 0.7 }];
  const kept = D.nms(boxes, 0.45, 5);
  assert.deepEqual(kept.map((b) => b.score), [0.9, 0.7]);
});

test("pose: the crop is a padded square centred on the box; its drawing arguments clip to the frame and stay in proportion", () => {
  const c = P.cropFor({ x1: 100, y1: 200, x2: 300, y2: 260, score: 1 });
  assert.equal(c.w, c.h); assert.equal(c.w, 250); assert.equal(c.x + c.w / 2, 200); assert.equal(c.y + c.h / 2, 230);
  const inside = P.cropDrawArgs({ x: 100, y: 100, w: 128, h: 128 }, 640, 480);
  assert.deepEqual([inside.dx, inside.dy, inside.dw, inside.dh], [0, 0, 256, 256]);
  const edge = P.cropDrawArgs({ x: -64, y: 0, w: 128, h: 128 }, 640, 480);
  assert.equal(edge.sx, 0); assert.equal(edge.sw, 64); assert.equal(edge.dx, 128); assert.equal(edge.dw, 128);
});

test("pose: SimCC decoding reads the peak bin / 2 as a model pixel and maps it into the frame; the score is the lower of the two peaks", () => {
  const sx = new Float32Array(17 * 512), sy = new Float32Array(17 * 512);
  sx[3 * 512 + 256] = 0.9; sy[3 * 512 + 128] = 0.6;           // keypoint 3: x = 128 px, y = 64 px of the 256 crop
  const pose = P.decodeSimcc(sx, sy, { x: 1000, y: 500, w: 512, h: 512 });
  assert.equal(pose.x[3], 1000 + (128 / 256) * 512);
  assert.equal(pose.y[3], 500 + (64 / 256) * 512);
  assert.ok(Math.abs(pose.score[3] - 0.6) < 1e-6);
});

test("pose: the tracker box needs enough visible keypoints and stays inside the frame", () => {
  const p = { x: new Float32Array(17), y: new Float32Array(17), score: new Float32Array(17) };
  for (let k = 0; k < 6; k++) { p.x[k] = 100 + k * 20; p.y[k] = 50 + k * 10; p.score[k] = 0.8; }
  const b = P.boxFromPose(p, 0.3, 640, 480);
  assert.ok(b && b.x1 >= 0 && b.x2 <= 640 && b.x1 < 100 && b.x2 > 200);
  assert.equal(P.boxFromPose(p, 0.9, 640, 480), null);
});

test("angles: a straight leg is 180 degrees, a right angle is 90, a hidden point gives nothing", () => {
  const pt = (x, y, s = 1) => ({ x, y, s });
  assert.ok(Math.abs(A.angleAt(pt(0, 0), pt(0, 1), pt(0, 2)) - 180) < 1e-9);
  assert.ok(Math.abs(A.angleAt(pt(0, 0), pt(0, 1), pt(1, 1)) - 90) < 1e-9);
  assert.equal(A.angleAt(pt(0, 0, 0.1), pt(0, 1), pt(0, 2)), null);
});

const HZ = 30;
const sine = (f, phase, n, amp = 0.2) => Array.from({ length: n }, (_, i) => amp * Math.sin(2 * Math.PI * (f * (i / HZ) - phase)));
const limbsFor = (f, ph, n = 120) => ({ lf: sine(f, ph[0], n), rf: sine(f, ph[1], n), lh: sine(f, ph[2], n), rh: sine(f, ph[3], n) });
const extra = { coverage: 1, visibleJoints: 15, windowS: 4 };

test("spectrum: a sine of known frequency and phase is recovered", () => {
  const x = sine(1.4, 0.25, 120);
  const sp = A.spectrum(x, HZ);
  const peak = sp.f[sp.p.indexOf(Math.max(...sp.p))];
  assert.ok(Math.abs(peak - 1.4) <= 0.05, `peak ${peak}`);
  const a = A.dftAt(x, HZ, 1.4), b = A.dftAt(sine(1.4, 0.5, 120), HZ, 1.4);
  assert.ok(Math.abs(A.phaseGap(a.phase, b.phase) - 0.25) < 0.02);
});

test("gait maths: lateral-sequence legs a quarter-cycle apart read as a walk at about 1 stride per second", () => {
  const e = A.classifyLimbs(limbsFor(1.0, [0.25, 0.75, 0, 0.5]), HZ, extra);
  assert.equal(e.gait, "walk");
  assert.ok(Math.abs(e.strideHz - 1.0) < 0.06);
  assert.ok(e.confidence > 0.6);
});

test("gait maths: diagonal legs in step and left/right half a cycle apart read as a trot", () => {
  const e = A.classifyLimbs(limbsFor(1.5, [0, 0.5, 0.5, 0]), HZ, extra);
  assert.equal(e.gait, "trot");
  assert.ok(Math.abs(e.strideHz - 1.5) < 0.06);
});

test("gait maths: legs of a pair that do not alternate are a canter below 1.95 strides/s and a gallop above", () => {
  assert.equal(A.classifyLimbs(limbsFor(1.7, [0, 0.2, 0.1, 0.3]), HZ, extra).gait, "canter");
  assert.equal(A.classifyLimbs(limbsFor(2.4, [0, 0.2, 0.1, 0.3]), HZ, extra).gait, "gallop");
});

test("gait maths: a stride frequency far outside a gait's range withdraws the label", () => {
  const e = A.classifyLimbs(limbsFor(0.45, [0, 0.5, 0.5, 0]), HZ, extra);    // a "trot" at 0.45 strides/s is not a trot
  assert.equal(e.gait, "unclear");
  assert.equal(e.confidence, 0);
});

test("gait maths: legs that do not move relative to the body are standing, with no stride frequency", () => {
  const still = { lf: sine(1, 0, 120, 0.005), rf: sine(1, 0.5, 120, 0.005), lh: sine(1, 0, 120, 0.005), rh: sine(1, 0.5, 120, 0.005) };
  const e = A.classifyLimbs(still, HZ, extra);
  assert.equal(e.gait, "standing"); assert.equal(e.strideHz, null);
});

test("gait maths: the confidence drops when the legs disagree about the frequency", () => {
  const good = A.classifyLimbs(limbsFor(1.5, [0, 0.5, 0.5, 0]), HZ, extra);
  const l = limbsFor(1.5, [0, 0.5, 0.5, 0]); l.rh = sine(0.7, 0, 120);
  const bad = A.classifyLimbs(l, HZ, extra);
  assert.ok(bad.confidence < good.confidence);
});

/** Samples whose paws move as the given limb signals (body axis along x, 100 px long), to exercise estimateGait end to end. */
function samplesFor(f, ph, seconds, fps = 15) {
  const out = [];
  for (let i = 0; i < seconds * fps; i++) {
    const t = (i / fps) * 1000, s = i / fps;
    const kp = new Array(51).fill(0);
    const set = (k, x, y) => { kp[k * 3] = x; kp[k * 3 + 1] = y; kp[k * 3 + 2] = 0.9; };
    set(S.KP.neck, 300, 200); set(S.KP.tail_root, 400, 200);       // body axis: neck -> tail along +x, L = 100
    const leg = (k, p) => set(k, 350 + 100 * 0.25 * Math.sin(2 * Math.PI * (f * s - p)), 290);
    leg(S.KP.left_front_paw, ph[0]); leg(S.KP.right_front_paw, ph[1]); leg(S.KP.left_hind_paw, ph[2]); leg(S.KP.right_hind_paw, ph[3]);
    out.push({ t, det: 0.8, box: null, kp, detMs: 5, poseMs: 20, totalMs: 25 });
  }
  return out;
}

test("estimateGait: samples at an irregular 15 fps with a walk pattern give a walk; too short a window gives 'unclear'", () => {
  const samples = samplesFor(1.0, [0.25, 0.75, 0, 0.5], 6);
  const e = A.estimateGait(samples, samples.at(-1).t);
  assert.equal(e.gait, "walk");
  assert.ok(Math.abs(e.strideHz - 1.0) < 0.1);
  const early = A.estimateGait(samples, samples[10].t);
  assert.equal(early.gait, "unclear");
});

test("summary: counts frames, coverage and latency from the samples and lists the gait shares", () => {
  const samples = samplesFor(1.5, [0, 0.5, 0.5, 0], 8);
  samples.push({ t: samples.at(-1).t + 70, det: 0, box: null, kp: [], detMs: 4, poseMs: 0, totalMs: 4 });
  const sum = A.summarize(samples, 9000);
  assert.equal(sum.frames, samples.length);
  assert.equal(sum.framesWithHorse, samples.length - 1);
  assert.ok(sum.coveragePct > 99 && sum.coveragePct < 100);
  assert.ok(Math.abs(sum.meanFps - samples.length / 9) < 1e-9);
  assert.equal(sum.dominantGait, "trot");
  assert.ok(Math.abs(sum.strideHzMedian - 1.5) < 0.1);
  assert.deepEqual(sum.angleRanges, {}, "the fixture has no elbows or knees, so no angle is invented");
});


// ---------------------------------------------------------------- multi-animal logic (synthetic boxes: these check the code, they are not results)
const rawWith = (anchors) => {
  const out = new Float32Array(D.DET_ANCHORS * D.DET_STRIDE);
  for (const { i, cls, p, obj = 0.9, w = 10, h = 10 } of anchors) { const o = i * D.DET_STRIDE; out[o + 2] = Math.log(w); out[o + 3] = Math.log(h); out[o + 4] = obj; out[o + 5 + cls] = p; }
  return out;
};

test("detector: every animal species is named by its own class; a person, or a person-like anchor, is never called an animal", () => {
  const out = rawWith([{ i: 100, cls: SP.SPECIES.dog.cls, p: 0.8 }, { i: 1500, cls: SP.SPECIES.cat.cls, p: 0.7 }, { i: 2500, cls: 0, p: 0.95 }]);
  out[100 * D.DET_STRIDE + 5 + SP.SPECIES.cat.cls] = 0.3;    // runner-up on the dog anchor
  out[2500 * D.DET_STRIDE + 5 + SP.SPECIES.dog.cls] = 0.4;   // a person anchor that also smells a little of dog
  const boxes = D.decodeAnimals(out, 1, 416, 416);
  assert.deepEqual(boxes.map((b) => b.cls).sort(), [SP.SPECIES.cat.cls, SP.SPECIES.dog.cls].sort());
  const dog = boxes.find((b) => b.cls === SP.SPECIES.dog.cls);
  assert.equal(dog.alt.cls, SP.SPECIES.cat.cls);
});

test("detector: one patch of the frame gets one species (class-agnostic NMS), the more probable one", () => {
  const out = rawWith([{ i: 100, cls: SP.SPECIES.dog.cls, p: 0.9 }, { i: 101, cls: SP.SPECIES.cat.cls, p: 0.6 }]);
  const boxes = D.decodeAnimals(out, 1, 416, 416);
  assert.equal(boxes.length, 1);
  assert.equal(boxes[0].cls, SP.SPECIES.dog.cls);
});

const det = (x, y, cls, score = 0.8, extra = {}) => ({ x1: x, y1: y, x2: x + 100, y2: y + 60, score, cls, p: score, ...extra });
const colour = (bin) => { const h = new Float32Array(T.HIST_BINS); h[bin] = 1; return h; };

test("tracker: two animals that cross keep their own IDs when their coats differ", () => {
  const tr = new T.AnimalTracker();
  const sp = SP.SPECIES.dog.cls;
  let a, b;
  for (let f = 0; f < 6; f++) {
    const t = f * 100;
    // A moves right, B moves left; at f=3 they overlap almost completely.
    const ax = 100 + f * 40, bx = 340 - f * 40;
    const ids = tr.associate([det(ax, 100, sp), det(bx, 110, sp)], [colour(5), colour(40)], t);
    if (f === 0) [a, b] = [ids[0].id, ids[1].id];
    else { assert.equal(ids[0].id, a, `A at frame ${f}`); assert.equal(ids[1].id, b, `B at frame ${f}`); }
  }
});

test("tracker: a single frame calling a dog a cat does not rename it, and a split vote is never named", () => {
  const tr = new T.AnimalTracker();
  const dog = SP.SPECIES.dog.cls, cat = SP.SPECIES.cat.cls;
  let t0;
  for (let f = 0; f < 8; f++) {
    const cls = f === 4 ? cat : dog;
    const [x] = tr.associate([det(100 + f * 5, 100, cls, 0.8)], [colour(3)], f * 100);
    t0 = x;
  }
  assert.equal(tr.species(t0).key, "dog");
  // A box the detector keeps splitting between horse and cow stays unnamed.
  const tr2 = new T.AnimalTracker();
  let u;
  for (let f = 0; f < 8; f++) [u] = tr2.associate([det(100, 100, f % 2 ? SP.SPECIES.horse.cls : SP.SPECIES.cow.cls, 0.8)], [colour(3)], f * 100);
  assert.equal(tr2.species(u).key, null);
  assert.equal(tr2.species(u).unsure, true);
});

test("tracker: a weak detection (score under 0.4) is not named, however consistent", () => {
  const tr = new T.AnimalTracker();
  let u;
  for (let f = 0; f < 8; f++) [u] = tr.associate([det(100, 100, SP.SPECIES.horse.cls, 0.3)], [colour(3)], f * 100);
  assert.equal(tr.species(u).key, null);
});

test("tracker: a lost animal that returns nearby, same species and look, gets its old ID back; a different species does not", () => {
  const tr = new T.AnimalTracker();
  const dog = SP.SPECIES.dog.cls;
  let id;
  for (let f = 0; f < 4; f++) [{ id }] = tr.associate([det(100, 100, dog)], [colour(7)], f * 100);
  const t = tr.tracks[0]; t.lost = true;                         // hidden behind a fence
  const [back] = tr.associate([det(160, 100, dog)], [colour(7)], 1500);
  assert.equal(back.id, id);
  const tr2 = new T.AnimalTracker();
  for (let f = 0; f < 4; f++) tr2.associate([det(100, 100, dog)], [colour(7)], f * 100);
  tr2.tracks[0].lost = true;
  const [other] = tr2.associate([det(160, 100, SP.SPECIES.cat.cls)], [colour(7)], 1500);
  assert.notEqual(other.id, tr2.tracks[0].id);
});

test("species: only horse, dog and cat are offered a skeleton; the rest are detect-only", () => {
  assert.deepEqual(SP.SPECIES_LIST.filter((s) => s.status === "tested").map((s) => s.key).sort(), ["cat", "dog", "horse"]);
  assert.equal(SP.poseSupported("sheep"), false);
  assert.equal(SP.poseSupported(null), false);
});

test("gait: dogs and cats are never given a named walk, trot or run; horses can be", () => {
  // Diagonal legs in step, left/right half a cycle apart: a trot for a horse, only "moving" for a dog.
  const hz = 30, n = 120, f = 1.5;
  const sine = (ph) => Array.from({ length: n }, (_, i) => 0.3 * Math.sin(2 * Math.PI * (f * i / hz - ph)));
  const limbs = { lf: sine(0), rf: sine(0.5), lh: sine(0.5), rh: sine(0) };
  const extra = { coverage: 1, visibleJoints: 15, windowS: 4, sampleHz: 15 };
  assert.equal(A.classifyLimbs(limbs, hz, { ...extra, species: "horse" }).gait, "trot");
  assert.equal(A.classifyLimbs(limbs, hz, { ...extra, species: "dog" }).gait, "moving");
  assert.equal(A.classifyLimbs(limbs, hz, { ...extra, species: "cat" }).gait, "moving");
});

test("gait: slow drift and a body seen end-on do not produce a rhythm", () => {
  const hz = 30, n = 120;
  const drift = Array.from({ length: n }, (_, i) => i / 20);       // a ramp: something large and slow
  const r = A.classifyLimbs({ lf: drift, rf: drift, lh: drift, rh: drift }, hz, { coverage: 1, visibleJoints: 15, windowS: 4, sampleHz: 15 });
  assert.equal(r.gait === "unclear" || r.gait === "standing", true);
  assert.notEqual(r.gait, "canter"); assert.notEqual(r.gait, "gallop");
});

test("tracker: two live tracks on the same animal become one; separate animals stay separate", () => {
  const tr = new T.AnimalTracker();
  const dog = SP.SPECIES.dog.cls;
  for (let f = 0; f < 4; f++) tr.associate([det(100, 100, dog), det(400, 100, dog)], [colour(1), colour(9)], f * 100);
  // A stray second box lands on the first animal and starts its own track.
  tr.tracks.push({ ...tr.tracks[0], id: 99, hits: 1, box: { ...tr.tracks[0].box, x1: tr.tracks[0].box.x1 + 4, x2: tr.tracks[0].box.x2 + 4 }, votes: new Map() });
  assert.equal(tr.tracks.length, 3);
  tr.dedupe();
  assert.equal(tr.tracks.length, 2);
  assert.ok(!tr.tracks.some((t) => t.id === 99));
});

test("tracker: in a crowd of four or more a moderately sure species is not named; alone it is", () => {
  const horse = SP.SPECIES.horse.cls;
  const make = (n) => {
    const tr = new T.AnimalTracker();
    for (let f = 0; f < 6; f++) tr.associate(Array.from({ length: n }, (_, i) => det(100 + i * 300, 100, horse, 0.5)), Array.from({ length: n }, (_, i) => colour(i)), f * 100);
    return tr;
  };
  const solo = make(1), crowd = make(5);
  assert.equal(solo.species(solo.tracks[0]).key, "horse");
  assert.equal(crowd.species(crowd.tracks[0]).key, null);
});
