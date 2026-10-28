// Hero stage at different local hours (the studio light follows the visitor's clock). usage: node base_tod.mjs <outdir> <assetsdir>
import fs from "node:fs";
import { createRequire } from "node:module";
import { launch, pinAssets, sleep } from "./harness.mjs";
import { newPage, openStage } from "./stage.mjs";
const require = createRequire(import.meta.url);
const sharp = require("sharp");
const OUT = process.argv[2], ASSETS = process.argv[3];
fs.mkdirSync(OUT, { recursive: true });
const browser = await launch("gpu");
for (const hour of [0, 3, 6, 9, 12, 15, 18, 21]) {
  const page = await newPage(browser, { hour, dpr: 1, assets: (c) => pinAssets(c, ASSETS) });
  await openStage(page);
  await sleep(900);
  const lum = await page.evaluate(() => { const f = window.__stallionFilm; return f ? "ok" : "none"; });
  const buf = await page.screenshot({ type: "png" });
  await sharp(buf).jpeg({ quality: 90 }).toFile(`${OUT}/hero_h${String(hour).padStart(2, "0")}.jpg`);
  // mean luminance of the horse region (crop around the animal) as a readability figure
  const crop = await sharp(buf).extract({ left: 400, top: 120, width: 600, height: 760 }).raw().toBuffer({ resolveWithObject: true });
  let max = 0, sum = 0, n = 0;
  for (let i = 0; i < crop.data.length; i += crop.info.channels) { const l = 0.2126 * crop.data[i] + 0.7152 * crop.data[i + 1] + 0.0722 * crop.data[i + 2]; sum += l; n++; if (l > max) max = l; }
  const bg = await sharp(buf).extract({ left: 40, top: 300, width: 200, height: 300 }).raw().toBuffer({ resolveWithObject: true });
  let bs = 0, bn = 0; for (let i = 0; i < bg.data.length; i += bg.info.channels) { bs += 0.2126 * bg.data[i] + 0.7152 * bg.data[i + 1] + 0.0722 * bg.data[i + 2]; bn++; }
  console.log(`hour ${hour}: crop mean luma ${(sum / n).toFixed(1)}/255, brightest ${max.toFixed(0)}, background luma ${(bs / bn).toFixed(1)}`);
  await page.context().close();
}
await browser.close();
