// Screenshots of /stride at a viewport and a list of scroll fractions: node shots.mjs <width> <height> <prefix> [gpu|swift] [query]
import { launch, openStride, watch, glInfo, sleep, out } from "./lib.mjs";

const [w = "1440", h = "900", prefix = "d", mode = "gpu", query = ""] = process.argv.slice(2);
const browser = await launch(mode, process.env.NOWEBGL ? ["--disable-3d-apis", "--disable-gpu"] : []);
const ctx = await browser.newContext({ viewport: { width: +w, height: +h }, deviceScaleFactor: +(process.env.DPR || 1), hasTouch: +w < 700, isMobile: +w < 700, reducedMotion: process.env.REDUCED ? "reduce" : "no-preference" });
const page = await ctx.newPage();
const log = watch(page);
console.log("gl", JSON.stringify(await glInfo(page).catch(() => ({}))));
await openStride(page, { query, canvas: !(process.env.NOWEBGL || process.env.REDUCED) });
console.log("gl", JSON.stringify(await glInfo(page)));
const total = await page.evaluate(() => document.documentElement.scrollHeight);
console.log("page height", total);
const stops = (process.env.STOPS || "0,0.08,0.2,0.32,0.44,0.56,0.68,0.8").split(",").map(Number);
for (const f of stops) {
  const y = Math.round(f * (total - +h));
  await page.evaluate((y) => window.scrollTo(0, y), y);
  await sleep(1700);
  await page.screenshot({ path: out(`${prefix}-${String(Math.round(f * 100)).padStart(3, "0")}.png`) });
}
console.log("errors", JSON.stringify(log.errors.slice(0, 8)));
console.log("warnings", JSON.stringify(log.warnings.slice(0, 5)));
await browser.close();
