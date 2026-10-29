// Ground contact at a canter: a strip of frames low at the hind hooves, and how high the dust ever gets above the ground.
// usage: QA_BASE=http://localhost:3400 node realism/ground_contact.mjs <outDir> <assetsDir> [place 1|2|3]
//   Writes strip_00..09.png and dust-stats.json. The ground is the terrain under each grain (the film's own height function).
import fs from "node:fs";
import path from "node:path";
import { launch, pinAssets, sleep } from "../harness.mjs";
import { newPage, openStage, installCam, enterPlace, camRel } from "../stage.mjs";

const OUT = process.argv[2];
const ASSETS = process.argv[3];
const PLACE = Number(process.argv[4] || 1);
if (!OUT || !ASSETS) throw new Error("usage: node realism/ground_contact.mjs <outDir> <assetsDir> [place]");
fs.mkdirSync(OUT, { recursive: true });

const browser = await launch("gpu");
const page = await newPage(browser, { width: 1440, height: 900, dpr: 1, hour: 12, assets: (c) => pinAssets(c, ASSETS) });
await openStage(page);
await installCam(page);
await enterPlace(page, PLACE, { speed: 0 });
await page.evaluate(() => window.__stallionFilm.setManual({ speed: 5.2, alert: 0 }));
await sleep(4500);
await camRel(page, [-1.5, 1.6, 0.45], [-0.55, 0.1, 0.12], 30); // low, behind-left of the hind legs: hooves and ground are the picture
await sleep(400);

// live grains and the highest one above the ground (the particle system's own arrays; a grain is alive while age < life)
const dustNow = () => page.evaluate(() => {
  const f = window.__stallionFilm, d = f.dust;
  if (!d) return null;
  const ground = (x, z) => (d.groundAt ? d.groundAt(x, z) : f.env && f.env.terrain ? f.env.terrain.height(x, z) : 0);
  let alive = 0, maxRise = 0;
  for (let i = 0; i < d.pos.length / 3; i++) {
    if (d.age[i] >= d.life[i]) continue;
    alive++;
    maxRise = Math.max(maxRise, d.pos[i * 3 + 1] - ground(d.pos[i * 3], d.pos[i * 3 + 2]));
  }
  return { alive, maxRise: +maxRise.toFixed(3) };
});

const strip = [];
const t0 = Date.now();
for (let i = 0; i < 10; i++) {
  await page.screenshot({ path: path.join(OUT, `strip_${String(i).padStart(2, "0")}.png`), clip: { x: 220, y: 250, width: 900, height: 520 } });
  const s = await dustNow();
  strip.push(s && { t: Date.now() - t0, ...s });
  await sleep(60);
}
let worst = 0, peak = 0, samples = 0;
for (let i = 0; i < 80; i++) { // twenty seconds of canter
  const s = await dustNow();
  if (s) { worst = Math.max(worst, s.maxRise); peak = Math.max(peak, s.alive); samples++; }
  await sleep(250);
}
const res = { place: PLACE, strip, longRun: { samples, highestGrainAboveGround_m: +worst.toFixed(3), mostGrainsAlive: peak }, logs: page._logs.slice(0, 6) };
fs.writeFileSync(path.join(OUT, "dust-stats.json"), JSON.stringify(res, null, 1));
console.log(JSON.stringify(res.longRun));
await browser.close();
