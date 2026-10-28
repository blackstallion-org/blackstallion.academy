// Quick look at the hero stage at chosen hours, with a luminance / chroma read-out of the animal. usage: node look_hero.mjs <outdir> <assetsdir> <hours, e.g. 0,6,12,18> [dpr]
import fs from "node:fs";
import { createRequire } from "node:module";
import { launch, pinAssets, sleep } from "./harness.mjs";
import { newPage, openStage } from "./stage.mjs";
const require = createRequire(import.meta.url);
const sharp = require("sharp");
const OUT = process.argv[2], ASSETS = process.argv[3];
const HOURS = (process.argv[4] ?? "0,6,12,18").split(",").map(Number);
const DPR = Number(process.argv[5] ?? 1);
fs.mkdirSync(OUT, { recursive: true });
const browser = await launch("gpu");
const rows = [];
for (const hour of HOURS) {
  const page = await newPage(browser, { hour, dpr: DPR, assets: (c) => pinAssets(c, ASSETS) });
  await openStage(page);
  await sleep(900);
  const file = `${OUT}/hero_h${String(hour).padStart(2, "0")}.jpg`;
  const buf = await page.screenshot({ type: "png", clip: { x: 340, y: 20, width: 760, height: 860 } });
  await sharp(buf).jpeg({ quality: 92 }).toFile(file);
  // the horse: pixels clearly brighter than the stage background (#171513 is luma ~21), read colour balance on the darker half of those
  const raw = await sharp(buf).raw().toBuffer({ resolveWithObject: true });
  const ch = raw.info.channels; let n = 0, sr = 0, sg = 0, sb = 0, bright = 0;
  for (let i = 0; i < raw.data.length; i += ch) {
    const r = raw.data[i], g = raw.data[i + 1], b = raw.data[i + 2]; const l = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    if (l > 30 && l < 90) { sr += r; sg += g; sb += b; n++; }
    if (l > 200) bright++;
  }
  rows.push({ hour, darkCoatRGB: n ? [sr / n, sg / n, sb / n].map((v) => +v.toFixed(1)) : null, redMinusBlue: n ? +((sr - sb) / n).toFixed(1) : null, pixelsOver200: bright });
  console.log(JSON.stringify(rows[rows.length - 1]));
  await page.context().close();
}
fs.writeFileSync(`${OUT}/_look.json`, JSON.stringify(rows, null, 1));
await browser.close();
