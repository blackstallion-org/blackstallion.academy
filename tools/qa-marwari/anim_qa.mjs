// Gait verification on the current clips: run the film's own qaRun (synchronous, no rendering) with the foot-lock on and off,
// then render deterministic one-stride frame strips for walk / trot / canter / gallop.
// usage: node anim_qa.mjs <outdir> <assetsdir>
import fs from "node:fs";
import { createRequire } from "node:module";
import { launch, pinAssets, sleep } from "./harness.mjs";
import { newPage, openStage, installCam, camRel, enterPlace } from "./stage.mjs";
const require = createRequire(import.meta.url);
const sharp = require("sharp");
const OUT = process.argv[2], ASSETS = process.argv[3];
fs.mkdirSync(OUT, { recursive: true });
const browser = await launch("gpu");
const page = await newPage(browser, { hour: 12, dpr: 1, assets: (c) => pinAssets(c, ASSETS) });
await openStage(page);
await installCam(page);
await enterPlace(page, 1, { speed: 0 });

/* ---------- numbers: lock on, then lock off */
const steps = [[0, 2], [1.44, 14], [3.33, 14], [4.83, 14], [10, 14], [12, 14]];
const on = await page.evaluate((s) => window.__stallionFilm.qaRun(s), steps);
await page.evaluate(() => { const f = window.__stallionFilm; f.__applyOrig = f.footLock.apply.bind(f.footLock); f.footLock.apply = () => {}; });
const off = await page.evaluate((s) => window.__stallionFilm.qaRun(s), steps);
await page.evaluate(() => { const f = window.__stallionFilm; f.footLock.apply = f.__applyOrig; });
fs.writeFileSync(`${OUT}/qarun.json`, JSON.stringify({ on, off, steps }, null, 1));
const row = (r) => ({ target: r.target, gait: r.gait, speed: r.speed, strideM: r.strideLengthM, hz: r.strideFrequencyHz, slipPct: +(r.slipFractionOfSpeed * 100).toFixed(1), lockedSlipMps: r.lock?.lockedSlipRmsMps, stances: r.lock?.stances, held: r.lock?.fullyLocked, never: r.lock?.neverEngaged, airborne: r.airborneFraction, penBeforeFixCm: +(r.maxPenetrationBeforeFixM * 100).toFixed(1), tdSpeed: r.touchdownSpeedMps, order: r.footfallOrder });
console.log("LOCK ON"); on.forEach((r) => console.log(JSON.stringify(row(r))));
console.log("LOCK OFF"); off.forEach((r) => console.log(JSON.stringify(row(r))));

/* ---------- strips: freeze the stage's own stepping and drive the simulation by hand */
await page.evaluate(() => {
  const f = window.__stallionFilm, mixer = f.ctx.mixer;
  const o = { bm: f.beforeMixer.bind(f), am: f.afterMixer.bind(f), un: f.undo.bind(f), mu: mixer.update.bind(mixer) };
  f.beforeMixer = () => {}; f.afterMixer = () => {}; f.undo = () => {}; mixer.update = () => mixer;
  window.__step = (dt) => { let n = Math.max(1, Math.ceil(dt / (1 / 120))); const h = dt / n; for (let i = 0; i < n; i++) { o.un(); o.bm(h, f.aspect); o.mu(h); o.am(h); } };
  window.__speed = () => f.telemetry().speed;
});
const GAITS = [["walk", 1.44, 1.25], ["trot", 3.33, 1.34], ["canter", 4.83, 1.66], ["gallop", 10, 2.38]];
for (const [name, speed, hz] of GAITS) {
  await page.evaluate((sp) => { window.__stallionFilm.setManual({ speed: sp, alert: 0 }); }, speed);
  await camRel(page, [0.4, 5.6, 1.15], [0.4, 0, 1.0], 30);
  // settle by simulation only (no rendering): up to 25 simulated seconds
  await page.evaluate(({ sp }) => { for (let i = 0; i < 25 * 60 && Math.abs(window.__speed() - sp) > 0.04; i++) window.__step(1 / 60); for (let i = 0; i < 120; i++) window.__step(1 / 60); }, { sp: speed });
  const N = 8, T = 1 / hz;
  const frames = [];
  for (let k = 0; k < N; k++) {
    await sleep(160); // let the render loop draw the paused pose
    const buf = await page.screenshot({ type: "png", clip: { x: 170, y: 190, width: 1100, height: 520 } });
    await sharp(buf).resize(550).jpeg({ quality: 88 }).toFile(`${OUT}/strip_${name}_${k}.jpg`);
    frames.push(`${OUT}/strip_${name}_${k}.jpg`);
    await page.evaluate((dt) => window.__step(dt), T / N);
  }
  console.log("strip", name, "speed", await page.evaluate(() => window.__speed()), "T", T.toFixed(3));
}
console.log("logs", page._logs.slice(0, 5));
await browser.close();
