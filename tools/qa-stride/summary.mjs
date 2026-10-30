// Dumps the numbers the page shows (from the sampled animation) to a file: node summary.mjs
import fs from "node:fs";
import { launch, openStride, out } from "./lib.mjs";
const browser = await launch("swift");
const page = await (await browser.newContext({ viewport: { width: 1280, height: 800 } })).newPage();
await openStride(page, { query: "?stridedebug" });
await page.waitForFunction(() => !!window.__stride, null, { timeout: 60000 });
const res = await page.evaluate(() => {
  const d = window.__stride.rig.data;
  const r = (v, n = 2) => +v.toFixed(n);
  return {
    strideSeconds: d.strideSeconds, seatCyclesPerMinute: d.seatCyclesPerMinute, seatLagMs: r(d.seatLagMs, 1), seatGain: r(d.seatGain, 3),
    channels: Object.fromEntries(Object.entries(d.channels).map(([k, c]) => [k, { unit: c.unit, horseP2P: r(c.horseP2P), riderP2P: r(c.riderP2P), perStride: c.perStride }])),
    footfalls: Object.fromEntries(Object.entries(d.stance).map(([k, s]) => [k, { touchdown: r(s.touchdown, 3), liftoff: r(s.liftoff, 3), duty: r(s.duty, 3), plantedToeHeightMm: r(s.plantedHeight * 1000, 1) }])),
    touchdownOrder: d.touchdownOrder, touchdownGaps: d.touchdownGaps.map((g) => r(g, 3)), minSupport: d.minSupport, maxSupport: d.maxSupport,
    feet: Object.fromEntries(Object.entries(d.feet).map(([k, f]) => [k, { driftCm: r(f.driftCm, 2), plantedSpeedCmS_authoredTempo: r(f.plantedSpeedMps * 100, 0), toeAboveSoleMm: f.toeAboveSoleMm.map((x) => r(x, 0)) }])),
    feetAuthored: Object.fromEntries(Object.entries(d.feetAuthored).map(([k, f]) => [k, { driftCm: r(f.driftCm, 2), plantedSpeedCmS_authoredTempo: r(f.plantedSpeedMps * 100, 0) }])),
    joints: Object.fromEntries(Object.entries(d.joints).map(([k, j]) => [k, [r(j.min, 1), r(j.max, 1)]])),
  };
});
console.log(JSON.stringify(res, null, 1));
fs.writeFileSync(out("data-summary.json"), JSON.stringify(res, null, 1));
await browser.close();
