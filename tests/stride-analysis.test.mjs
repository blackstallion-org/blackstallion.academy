// The maths behind /stride: periodic filter, harmonics, stance detection. Run with `npm test`.
import { test } from "node:test";
import assert from "node:assert/strict";
import { loadTs } from "./helpers/load-ts.mjs";

const a = await loadTs("lib/stride/analysis.ts");
const N = 240;
const wave = (cycles, amp = 1, phase = 0) => Array.from({ length: N }, (_, i) => amp * Math.sin(2 * Math.PI * (cycles * i / N + phase)));

test("harmonic amplitudes find the cycles per stride and their size", () => {
  const s = wave(2, 3.5).map((v, i) => v + 0.4 * Math.sin((2 * Math.PI * i) / N) + 9);
  const { harmonic, amplitude } = a.dominantHarmonic(s);
  assert.equal(harmonic, 2);
  assert.ok(Math.abs(amplitude - 3.5) < 1e-6);
  assert.ok(Math.abs(a.harmonicAmplitudes(s)[0] - 0.4) < 1e-6);
});

test("the periodic low-pass keeps the mean, and matches the analytic gain and delay of the filter", () => {
  const period = 1.2;
  const fn = 5;
  const zeta = 0.7;
  const x = wave(2, 2, 0).map((v) => v + 5);
  const y = a.periodicSecondOrder(x, period, fn, zeta);
  assert.ok(Math.abs(a.mean(y) - 5) < 1e-9);
  const { gain, delaySeconds } = a.secondOrderResponse(2 / period, fn, zeta);
  // the output is the input scaled by `gain` and delayed by `delaySeconds`
  const expected = x.map((_, i) => 5 + 2 * gain * Math.sin(2 * Math.PI * (2 * ((i / N) - delaySeconds / period))));
  const err = Math.max(...y.map((v, i) => Math.abs(v - expected[i])));
  assert.ok(err < 1e-6, `max error ${err}`);
  assert.ok(delaySeconds > 0.03 && delaySeconds < 0.06, `delay ${delaySeconds}`);
  assert.ok(gain > 0.98 && gain < 1.02);
});

test("the filter is deterministic: the same input gives the same output however often it is asked", () => {
  const x = wave(1, 7).map((v, i) => v + 0.3 * Math.sin((4 * Math.PI * i) / N));
  const first = a.periodicSecondOrder(x, 1.2, 4, 0.6);
  const second = a.periodicSecondOrder(x, 1.2, 4, 0.6);
  assert.deepEqual(Array.from(first), Array.from(second));
});

test("sampleCyclic wraps and interpolates", () => {
  const s = [0, 10, 20, 30];
  assert.equal(a.sampleCyclic(s, 0.125), 5);
  assert.equal(a.sampleCyclic(s, 1.125), 5);
  assert.equal(a.sampleCyclic(s, -0.875), 5);
  assert.equal(a.sampleCyclic(s, 0.875), 15); // between 30 and the wrapped 0
});

test("stance detection ignores a hoof that is low but still arriving", () => {
  // A toe planted from phase 0.25 to 0.75 (it moves back at exactly the ground speed), then carried forward twice as fast
  // over the other half; the last part of the swing is low (0.02 m) but still moving forward, so it has not landed yet.
  const stride = 1.2;
  const cycle = 1;
  const v = stride / cycle;
  const y = [];
  const z = [];
  let pos = 0;
  for (let i = 0; i < N; i++) {
    const p = i / N;
    const planted = p >= 0.25 && p < 0.75;
    y.push(planted ? 0.02 : p >= 0.9 || p < 0.25 ? 0.02 : 0.02 + 0.08);
    pos += (planted ? -v : v) * (cycle / N);
    z.push(pos);
  }
  const st = a.detectStance(y, z, { strideLength: stride, cycleSeconds: cycle, clearance: 0.025, approachMax: 0.5, plantedSpeed: 0.15 });
  assert.ok(Math.abs(st.touchdown - 0.25) < 0.02, `touchdown ${st.touchdown}`);
  assert.ok(Math.abs(st.liftoff - 0.75) < 0.02, `liftoff ${st.liftoff}`);
  assert.ok(Math.abs(st.duty - 0.5) < 0.02, `duty ${st.duty}`);
  assert.ok(Math.abs(st.plantedHeight - 0.02) < 1e-9);
});

test("footfall order lists the hooves by touchdown and the gaps add up to one stride", () => {
  const { order, gaps } = a.footfallOrder({ FR: 0.77, HL: 0.02, FL: 0.26, HR: 0.51 });
  assert.deepEqual(order, ["HL", "FL", "HR", "FR"]);
  assert.ok(Math.abs(gaps.reduce((s, g) => s + g, 0) - 1) < 1e-9);
});

test("nice ticks include zero and stay inside the range", () => {
  const t = a.niceTicks(-1.7, 1.9, 5);
  assert.ok(t.includes(0));
  assert.ok(t.every((v) => v >= -1.7 - 1e-9 && v <= 1.9 + 1e-9));
});

test("support count adds the hooves on the ground", () => {
  const hooves = [[true, true, false], [true, false, false], [false, true, false]]; // one row per hoof, one column per sample
  assert.deepEqual(a.supportCount(hooves), [2, 2, 0]);
});
