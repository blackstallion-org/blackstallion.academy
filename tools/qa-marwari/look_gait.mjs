// Look at the horse moving: set a speed, wait until it settles, take N frames at a fixed interval. usage: node look_gait.mjs <outdir> <assets> <speed m/s> <frames> [shot]
import fs from "node:fs";
import { createRequire } from "node:module";
import { launch, pinAssets, sleep } from "./harness.mjs";
import { newPage, openStage, installCam, camRel, enterPlace } from "./stage.mjs";
const require = createRequire(import.meta.url);
const sharp = require("sharp");
const [OUT, ASSETS, SPEED, N] = process.argv.slice(2, 6);
fs.mkdirSync(OUT, { recursive: true });
const browser = await launch("gpu");
const page = await newPage(browser, { hour: 12, dpr: 1, assets: (c) => pinAssets(c, ASSETS) });
await openStage(page);
await installCam(page);
await enterPlace(page, 1, { speed: 0 });
await page.evaluate((s) => window.__stallionFilm.setManual({ speed: Number(s), alert: 0 }), SPEED);
await camRel(page, [0.4, 6.2, 1.25], [0.4, 0, 1.0], 30);
await page.waitForFunction((s) => Math.abs(window.__stallionFilm.telemetry().speed - Number(s)) < 0.1, SPEED, { timeout: 40000 });
await sleep(1500);
for (let i = 0; i < Number(N); i++) {
  const buf = await page.screenshot({ type: "png", clip: { x: 170, y: 190, width: 1100, height: 520 } });
  await sharp(buf).resize(700).jpeg({ quality: 88 }).toFile(`${OUT}/gait_${SPEED}_${i}.jpg`);
  await sleep(180);
}
await browser.close();
