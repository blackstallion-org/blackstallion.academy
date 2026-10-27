// Baseline for the academy with the horse standing in the arena (the first baseline stopped it at the start of the tree-lined drive).
// usage: node base_arena.mjs <outdir> <assetsdir> [dpr]
import fs from "node:fs";
import { createRequire } from "node:module";
import { launch, pinAssets, sleep } from "./harness.mjs";
import { newPage, openStage, installCam, camRel, camOff, enterPlace } from "./stage.mjs";
import { CAMS } from "./shots.mjs";
const require = createRequire(import.meta.url);
const sharp = require("sharp");
const OUT = process.argv[2], ASSETS = process.argv[3], DPR = Number(process.argv[4] ?? 1);
fs.mkdirSync(OUT, { recursive: true });
const save = async (page, name) => {
  const buf = await page.screenshot({ type: "png" });
  await sharp(buf).jpeg({ quality: 92, mozjpeg: true }).toFile(`${OUT}/${name}.jpg`);
  console.log("saved", name);
};
const browser = await launch("gpu");
const page = await newPage(browser, { hour: 12, dpr: DPR, assets: (c) => pinAssets(c, ASSETS) });
await openStage(page);
await installCam(page);
await enterPlace(page, 3, { speed: 0 });
await page.waitForFunction(() => window.__stallionFilm.telemetry().speed < 0.04, null, { timeout: 30000 });
// walk the horse to the middle of the arena and stand it there, facing along the arena
await page.evaluate(() => { const f = window.__stallionFilm; f.loco.place(0, 64, 0, 0); f.setManual({ speed: 0, alert: 0 }); });
await sleep(2500);
await camOff(page);
for (const [shot, name] of [["arenaWide", "arena_film_arenaWide"], ["finalWide", "arena_film_finalWide"], ["finalClose", "arena_film_finalClose"], ["campusSide", "arena_film_campusSide"]]) {
  await page.evaluate((s) => window.__stallionFilm.setManual({ speed: 0, shot: s }), shot);
  await sleep(4500);
  await save(page, name);
}
for (const k of ["side", "threeQuarter", "hoofGround", "headEyeMuzzle"]) {
  const c = CAMS[k]; await camRel(page, c.a, c.b, c.fov); await sleep(1400); await save(page, `arena_${k}`);
}
console.log("logs", page._logs.filter((l) => !/hero-main/.test(l)).slice(0, 5));
await browser.close();
