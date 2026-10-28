// Baseline captures, desktop 1440x900. usage: node base_desktop.mjs <outdir> <assetsdir> [dpr]
import fs from "node:fs";
import { createRequire } from "node:module";
import { launch, pinAssets, sleep, SCRATCH } from "./harness.mjs";
import { newPage, openStage, installCam, camRel, camOff, enterPlace, stats, hideDevChrome } from "./stage.mjs";
import { CAMS } from "./shots.mjs";
const require = createRequire(import.meta.url);
const sharp = require("sharp");

const OUT = process.argv[2];
const ASSETS = process.argv[3];
const DPR = Number(process.argv[4] ?? 1);
const ONLY = process.argv[5] ? process.argv[5].split(",") : null; // optional groups: hero,desert,village,campus,plate
fs.mkdirSync(OUT, { recursive: true });
const want = (g) => !ONLY || ONLY.includes(g);

async function save(page, name, clip) {
  const buf = await page.screenshot({ type: "png", ...(clip ? { clip } : {}) });
  const file = `${OUT}/${name}.jpg`;
  await sharp(buf).jpeg({ quality: 92, mozjpeg: true }).toFile(file);
  console.log("saved", name);
}
const log = [];
const meta = { dpr: DPR, assets: ASSETS, shots: {} };

const browser = await launch("gpu");
const page = await newPage(browser, { hour: 12, dpr: DPR, assets: (c) => pinAssets(c, ASSETS) });
const gl = await (async () => { await page.goto("about:blank"); return page.evaluate(() => { const c = document.createElement("canvas"); const g = c.getContext("webgl2"); const e = g.getExtension("WEBGL_debug_renderer_info"); return g.getParameter(e.UNMASKED_RENDERER_WEBGL); }); })();
meta.renderer = gl;
console.log("renderer:", gl);
await openStage(page);
await installCam(page);

/* ---------------- hero studio (chapter 0), noon light, horse turned on its own axis so one camera gives every side */
if (want("hero")) {
  const turn = async (deg) => page.evaluate((d) => { const r = window.__stallionFilm.ctx.horse.root; r.rotation.y = (d * Math.PI) / 180; }, deg);
  await sleep(800);
  await save(page, "hero_3q_noon");
  // camera azimuth is 41 deg toward +X; rotate the horse to show: left side (-49), front (+41), rear (221), right side (131)
  for (const [n, d] of [["hero_side_left_noon", -49], ["hero_front_noon", 41], ["hero_rear_noon", 221], ["hero_side_right_noon", 131]]) {
    await turn(d); await sleep(900); await save(page, n);
  }
  await turn(0);
}

/* ---------------- film places */
async function place(chapter, id, shots, wides) {
  await enterPlace(page, chapter, { speed: 0 });
  // let the horse come to a halt (it arrives at a trot in places 2 and 3)
  await page.waitForFunction(() => window.__stallionFilm.telemetry().speed < 0.04, null, { timeout: 30000 });
  await sleep(1800);
  // the film's own wide shot(s) first
  await camOff(page);
  for (const [shot, name] of wides) {
    await page.evaluate((s) => window.__stallionFilm.setManual({ speed: 0, shot: s }), shot);
    await sleep(4200);
    await save(page, `${id}_${name}`);
  }
  for (const k of shots) {
    const c = CAMS[k];
    await camRel(page, c.a, c.b, c.fov);
    await sleep(1400);
    await save(page, `${id}_${k}`);
  }
  meta.shots[id] = await stats(page);
}

if (want("desert")) await place(1, "desert", ["side", "threeQuarter", "front", "earsClose", "headEyeMuzzle", "eyeExtreme", "maneNeck", "hoofGround", "rear", "shoulder", "barrel", "hindquarter", "tail"], [["wideEstablish", "film_wide"]]);
if (want("village")) await place(2, "village", ["side", "threeQuarter", "headEyeMuzzle"], [["villageReveal", "film_reveal"], ["courtyardWide", "film_courtyard"]]);
if (want("campus")) await place(3, "campus", ["side", "threeQuarter", "headEyeMuzzle", "hoofGround"], [["arenaWide", "film_arena"], ["finalWide", "film_final"]]);

meta.logs = page._logs.slice(0, 30);
fs.writeFileSync(`${OUT}/_meta.json`, JSON.stringify(meta, null, 1));
await browser.close();
console.log("done", JSON.stringify(meta.shots));
