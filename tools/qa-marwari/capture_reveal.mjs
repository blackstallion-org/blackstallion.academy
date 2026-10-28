// Plays the hero's guided reveal and saves a frame at each beat. Frames carry the caption text read from the page.
// usage: node capture_reveal.mjs <outdir> <assetsdir> [desktop|mobile]
import fs from "node:fs";
import { createRequire } from "node:module";
import { launch, pinAssets, sleep } from "./harness.mjs";
import { newPage, openStage } from "./stage.mjs";
const require = createRequire(import.meta.url);
const sharp = require("sharp");
const OUT = process.argv[2], ASSETS = process.argv[3], MODE = process.argv[4] ?? "desktop";
fs.mkdirSync(OUT, { recursive: true });
const browser = await launch("gpu");
const mobile = MODE === "mobile";
const page = await newPage(browser, { width: mobile ? 390 : 1440, height: mobile ? 844 : 900, mobile, dpr: mobile ? 2 : 1, hour: 12, assets: (c) => pinAssets(c, ASSETS) });
await openStage(page);
const button = page.getByRole("button", { name: /play the reveal/i });
await button.waitFor({ state: "visible", timeout: 20000 });
await sleep(800);
await sharp(await page.screenshot({ type: "png" })).jpeg({ quality: 90 }).toFile(`${OUT}/${MODE}_00_before.jpg`);
await button.click();
const marks = [0.5, 1.4, 2.2, 3.6, 5, 6.6, 8.6, 10.6, 13, 15.8, 18.4, 20.4, 22.6, 24.8, 27, 29.5, 33, 36.5, 40.6];
const start = Date.now();
let i = 1;
for (const m of marks) {
  const wait = start + m * 1000 - Date.now();
  if (wait > 0) await sleep(wait);
  const label = await page.evaluate(() => document.querySelector('[aria-live="polite"].label.text-brass')?.textContent ?? "");
  const name = `${MODE}_${String(i++).padStart(2, "0")}_t${String(m).replace(".", "p")}`;
  await sharp(await page.screenshot({ type: "png" })).jpeg({ quality: 90 }).toFile(`${OUT}/${name}.jpg`);
  console.log(name, JSON.stringify(label));
}
await sleep(1500);
console.log("button text after:", await page.getByRole("button", { name: /reveal|stop/i }).first().textContent());
// interruption: start again, wait 3 s, wheel, and check it returns
await page.getByRole("button", { name: /play the reveal/i }).click();
await sleep(3000);
await page.mouse.wheel(0, 40);
await sleep(300);
await sharp(await page.screenshot({ type: "png" })).jpeg({ quality: 90 }).toFile(`${OUT}/${MODE}_zz_interrupt_mid.jpg`);
await sleep(1600);
await sharp(await page.screenshot({ type: "png" })).jpeg({ quality: 90 }).toFile(`${OUT}/${MODE}_zz_interrupt_after.jpg`);
console.log("logs", page._logs.filter((l) => !/hero-main|server caches/.test(l)).slice(0, 8));
await browser.close();
