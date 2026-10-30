// Joint angles of the right fore and hind limbs over the stride, with the stance hold off (the clip as authored) and on, and the largest change the hold makes.
import fs from "node:fs";
import { launch, openStride, out } from "./lib.mjs";

const browser = await launch("swift");
const page = await (await browser.newContext({ viewport: { width: 1280, height: 800 } })).newPage();
await openStride(page, { query: "?stridedebug" });
await page.waitForFunction(() => !!window.__stride, null, { timeout: 60000 });
const res = await page.evaluate(() => {
  const { rig } = window.__stride;
  window.__stride.clock.pause();
  const J = { elbow: ["Humerus_R", "Forearm_R", "Cannon_F_R"], carpus: ["Forearm_R", "Cannon_F_R", "Pastern_F_R"], fetlockF: ["Cannon_F_R", "Pastern_F_R", "Hoof_F_R"], stifle: ["Femur_R", "Gaskin_R", "Cannon_B_R"], hock: ["Gaskin_R", "Cannon_B_R", "Pastern_B_R"], fetlockH: ["Cannon_B_R", "Pastern_B_R", "Hoof_B_R"] };
  const run = (plant) => {
    rig.setPlanting(plant);
    const s = Object.fromEntries(Object.keys(J).map((k) => [k, []]));
    for (let i = 0; i < 240; i++) { rig.setPhase(i / 240); for (const k of Object.keys(J)) s[k].push(rig.joint(...J[k])); }
    return s;
  };
  const a = run(false);
  const b = run(true);
  const r = {};
  for (const k of Object.keys(J)) {
    r[k] = { authored: [Math.min(...a[k]), Math.max(...a[k])].map((v) => +v.toFixed(1)), held: [Math.min(...b[k]), Math.max(...b[k])].map((v) => +v.toFixed(1)), maxChangeDeg: +Math.max(...a[k].map((v, i) => Math.abs(v - b[k][i]))).toFixed(1) };
  }
  rig.setPlanting(true);
  return r;
});
console.log(JSON.stringify(res, null, 1));
fs.writeFileSync(out("joints.json"), JSON.stringify(res, null, 1));
await browser.close();
