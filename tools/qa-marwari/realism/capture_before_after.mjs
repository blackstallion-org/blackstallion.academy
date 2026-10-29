// Matched stills of the Marwari in the film's three places, for before/after comparison (hair, coat, ground contact).
// usage: QA_BASE=http://localhost:3500 node realism/capture_before_after.mjs <outDir> <assetsDir> [desktop|mobile|both] [places 1,2,3] [views a,b,c]
//   Run it once against a clean checkout (the "before") and once against the branch (the "after") with the same pinned assets, then
//   `python3 realism/pairs.py <before> <after> <out>` makes the contact sheets.
//   MSIDE="fwd,left,up" and MFOV override the phone's side camera (the village is too narrow for the default 9.2 m).
import fs from "node:fs";
import path from "node:path";
import { launch, pinAssets, sleep } from "../harness.mjs";
import { newPage, openStage, installCam, camRel, camBone, enterPlace, stats } from "../stage.mjs";
import { CAMS } from "../shots.mjs";

const OUT = process.argv[2];
const ASSETS = process.argv[3];
const WHICH = process.argv[4] || "both";
const PLACES = (process.argv[5] || "1,2,3").split(",").map(Number);
const ONLY = process.argv[6] ? process.argv[6].split(",") : null;
if (!OUT || !ASSETS) throw new Error("usage: node realism/capture_before_after.mjs <outDir> <assetsDir> [desktop|mobile|both] [places] [views]");
fs.mkdirSync(OUT, { recursive: true });
const NAMES = { 1: "desert", 2: "village", 3: "field" };

const mobileSide = process.env.MSIDE
  ? { a: process.env.MSIDE.split(",").map(Number), b: [0.25, 0, 0.95], fov: Number(process.env.MFOV || 30) }
  : { a: [0.3, 9.2, 1.4], b: [0.25, 0, 0.95], fov: 30 };
// [name, camera, speed in m/s]; a camera is { a, b, fov } in the horse's frame or { bone: { cam, look }, fov } anchored to a bone
const VIEWS = (mobile) => [
  ["side", mobile ? mobileSide : CAMS.side, 0],
  ["mane", CAMS.maneNeck, 0],
  ["tail", CAMS.tail, 0],
  ["hooves", CAMS.hoofGround, 0],
  ["trot_side", mobile ? mobileSide : CAMS.side, 6.5],
  ["trot_hooves", { a: [1.2, 1.9, 0.5], b: [-0.2, 0, 0.12], fov: 28 }, 6.5],
  ["trot_tail", { a: [-2.8, 1.7, 1.25], b: [-0.7, 0, 0.9], fov: 26 }, 6.5],
  ["trot_mane", { a: [0.9, 2.6, 1.9], b: [0.7, 0, 1.7], fov: 26 }, 6.5],
  ["forelock", { bone: { cam: ["Head", [1.0, 0.75, 0.55]], look: ["Head", [0.12, 0.0, 0.1]] }, fov: 20 }, 0],
  ["forelock_side", { bone: { cam: ["Head", [0.15, 1.3, 0.25]], look: ["Head", [0.15, 0.0, 0.1]] }, fov: 17 }, 0],
  ["ears", CAMS.front, 0],
  ["eye_muzzle", CAMS.headEyeMuzzle, 0],
  ["shoulder", CAMS.shoulder, 0],
];

const browser = await launch("gpu");
const profiles = WHICH === "both" ? ["desktop", "mobile"] : [WHICH];
for (const prof of profiles) {
  const mobile = prof === "mobile";
  const cfg = mobile ? { width: 390, height: 844, dpr: 2, mobile: true } : { width: 1440, height: 900, dpr: 1, mobile: false };
  const page = await newPage(browser, { ...cfg, hour: 12, assets: (c) => pinAssets(c, ASSETS) });
  await openStage(page);
  await installCam(page);
  for (const chapter of PLACES) {
    await enterPlace(page, chapter, { speed: 0 });
    let lastSpeed = 0;
    for (const [name, cam, speed] of VIEWS(mobile)) {
      if (ONLY && !ONLY.includes(name)) continue;
      if (speed !== lastSpeed) {
        await page.evaluate((sp) => window.__stallionFilm.setManual({ speed: sp, alert: 0 }), speed);
        await sleep(speed > 0 ? 4500 : 2500);
        lastSpeed = speed;
      }
      if (cam.bone) await camBone(page, cam.bone.cam, cam.bone.look, cam.fov);
      else await camRel(page, cam.a, cam.b, cam.fov);
      await sleep(speed > 0 ? 700 : 1200);
      const file = path.join(OUT, `${NAMES[chapter]}_${prof}_${name}.png`);
      await page.screenshot({ path: file });
      console.log("saved", path.basename(file));
    }
    await page.evaluate(() => window.__stallionFilm.setManual({ speed: 0, alert: 0 }));
    await sleep(800);
  }
  console.log(prof, JSON.stringify(await stats(page)), "logs", JSON.stringify(page._logs.slice(0, 4)));
  await page.context().close();
}
await browser.close();
