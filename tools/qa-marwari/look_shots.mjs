// Quick look at chosen cameras in one place. usage: node look_shots.mjs <outdir> <assetsdir> <desert|village|campus|arena> <names> [dpr] [hour]
// names: CAMS presets (side, threeQuarter, hoofGround, ...), BONE_CAMS (eye, muzzle, ears) or film shots prefixed "film:" (film:arenaWide).
import fs from "node:fs";
import { createRequire } from "node:module";
import { launch, pinAssets, sleep } from "./harness.mjs";
import { newPage, openStage, installCam, camRel, camBone, camOff, enterPlace } from "./stage.mjs";
import { CAMS, BONE_CAMS } from "./shots.mjs";
const require = createRequire(import.meta.url);
const sharp = require("sharp");
const [OUT, ASSETS, PLACE, NAMES] = process.argv.slice(2, 6);
const DPR = Number(process.argv[6] ?? 1);
const HOUR = Number(process.argv[7] ?? 12);
fs.mkdirSync(OUT, { recursive: true });
const chapter = { desert: 1, village: 2, campus: 3, arena: 3 }[PLACE];
const browser = await launch("gpu");
const page = await newPage(browser, { hour: HOUR, dpr: DPR, assets: (c) => pinAssets(c, ASSETS) });
await openStage(page);
await installCam(page);
await enterPlace(page, chapter, { speed: 0 });
await page.waitForFunction(() => window.__stallionFilm.telemetry().speed < 0.04, null, { timeout: 30000 });
if (PLACE === "arena") await page.evaluate(() => { const f = window.__stallionFilm; f.loco.place(0, 64, 0, 0); f.setManual({ speed: 0, alert: 0 }); });
await sleep(2200);
for (const name of NAMES.split(",")) {
  if (name.startsWith("film:")) {
    await camOff(page);
    await page.evaluate((s) => window.__stallionFilm.setManual({ speed: 0, shot: s }), name.slice(5));
    await sleep(4500);
  } else if (BONE_CAMS[name]) {
    const c = BONE_CAMS[name]; await camBone(page, c.cam, c.look, c.fov); await sleep(1500);
  } else {
    const c = CAMS[name]; await camRel(page, c.a, c.b, c.fov); await sleep(1500);
  }
  const buf = await page.screenshot({ type: "png" });
  await sharp(buf).jpeg({ quality: 92, mozjpeg: true }).toFile(`${OUT}/${PLACE}_${name.replace(":", "_")}.jpg`);
  console.log("saved", `${PLACE}_${name}`);
}
console.log("logs", page._logs.filter((l) => !/hero-main|server caches/.test(l)).slice(0, 6));
await browser.close();
