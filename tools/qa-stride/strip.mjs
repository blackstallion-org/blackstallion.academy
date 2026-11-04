// A motion preview as a frame strip: one stride in twelve frames (side view, horse and rider), and the right fore hoof close up with the stance hold off and on.
import { launch, openStride, sleep, out } from "./lib.mjs";
import fs from "node:fs";

const browser = await launch("gpu");
const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 })).newPage();
await openStride(page, { query: "?stridedebug" });
await page.waitForFunction(() => !!window.__stride, null, { timeout: 90000 });
await page.evaluate(() => document.querySelector("#laboratory").scrollIntoView({ block: "start" }));
await sleep(2500);
const set = async (p) => { await page.evaluate((p) => { const { clock } = window.__stride; clock.pause(); clock.set(p + 1e-5); clock.set(p); }, p); await sleep(260); };
const dir = out("strip");
fs.mkdirSync(dir, { recursive: true });
await page.click('[aria-label="Camera angle"] button:text-is("Side")');
await sleep(1800);
const clip = { x: 190, y: 100, width: 600, height: 520 };
for (let i = 0; i < 12; i++) {
  await set(i / 12);
  await page.screenshot({ path: `${dir}/stride-${String(i).padStart(2, "0")}.png`, clip });
}
// the hoof, close up, over the stance of the right fore (touchdown 0.75, lift-off 0.33)
await page.click("ul button:has(span.font-mono:text-is(\"06\"))");
await sleep(2200);
const clip2 = { x: 200, y: 160, width: 640, height: 420 };
const phases = [0.8, 0.9, 0.0, 0.1, 0.2, 0.28];
for (const [mode, on] of [["authored", false], ["held", true]]) {
  await page.evaluate((on) => window.__stride.rig.setPlanting(on), on);
  for (const [i, p] of phases.entries()) {
    await set(p);
    await page.screenshot({ path: `${dir}/hoof-${mode}-${i}.png`, clip: clip2 });
  }
}
await page.evaluate(() => window.__stride.rig.setPlanting(true));
await browser.close();
console.log("ok");
