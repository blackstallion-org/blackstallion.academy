// Baseline close-ups at devicePixelRatio 2 (the engine caps its own render scale at 1.5, as it does on a retina Mac).
// usage: node base_2x.mjs <outdir> <assetsdir>
import fs from "node:fs";
import { createRequire } from "node:module";
import { launch, pinAssets, sleep } from "./harness.mjs";
import { newPage, openStage, installCam, camRel, camBone, camOff, enterPlace, stats } from "./stage.mjs";
import { CAMS, BONE_CAMS } from "./shots.mjs";
const require = createRequire(import.meta.url);
const sharp = require("sharp");
const OUT = process.argv[2], ASSETS = process.argv[3];
fs.mkdirSync(OUT, { recursive: true });
const save = async (page, name) => {
  const buf = await page.screenshot({ type: "png" });
  await sharp(buf).jpeg({ quality: 90, mozjpeg: true }).toFile(`${OUT}/${name}.jpg`);
  console.log("saved", name);
};
const browser = await launch("gpu");
const page = await newPage(browser, { hour: 12, dpr: 2, assets: (c) => pinAssets(c, ASSETS) });
await openStage(page);
await sleep(800);
await save(page, "hero_3q_noon");
await installCam(page);
await enterPlace(page, 1, { speed: 0 });
for (const k of ["side", "threeQuarter", "front", "maneNeck", "shoulder", "barrel", "hindquarter", "hoofGround", "tail"]) {
  const c = CAMS[k]; await camRel(page, c.a, c.b, c.fov); await sleep(1300); await save(page, `desert_${k}`);
}
for (const [k, c] of Object.entries(BONE_CAMS)) {
  await camBone(page, c.cam, c.look, c.fov); await sleep(1300); await save(page, `desert_${k}`);
}
console.log("stats", JSON.stringify(await stats(page)), "logs", page._logs.slice(0, 6));
await browser.close();
