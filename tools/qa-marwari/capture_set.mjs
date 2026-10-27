// The standard matched set, taken after each Gate A step with the same cameras as the baseline.
// usage: node capture_set.mjs <outdir> <assetsdir> [groups: hero,desert,village,arena,plate,mobile]
// Frames are named like the baseline frames so a before / after pair is two files with the same name.
import fs from "node:fs";
import { createRequire } from "node:module";
import { launch, pinAssets, sleep } from "./harness.mjs";
import { newPage, openStage, installCam, camRel, camBone, camOff, enterPlace, hideDevChrome, URL_HOME } from "./stage.mjs";
import { CAMS, BONE_CAMS } from "./shots.mjs";
const require = createRequire(import.meta.url);
const sharp = require("sharp");
const OUT = process.argv[2], ASSETS = process.argv[3];
const GROUPS = (process.argv[4] ?? "hero,desert,village,arena,plate").split(",");
fs.mkdirSync(OUT, { recursive: true });
const browser = await launch("gpu");
const log = [];
const jpg = async (buf, name) => { await sharp(buf).jpeg({ quality: 92, mozjpeg: true }).toFile(`${OUT}/${name}.jpg`); console.log("saved", name); };

/* ---- hero stage at four hours (crop around the horse) */
if (GROUPS.includes("hero")) {
  for (const hour of [0, 6, 12, 18]) {
    const page = await newPage(browser, { hour, dpr: 1, assets: (c) => pinAssets(c, ASSETS) });
    await openStage(page);
    await sleep(1000);
    await jpg(await page.screenshot({ type: "png", clip: { x: 340, y: 20, width: 760, height: 860 } }), `hero_h${String(hour).padStart(2, "0")}`);
    if (hour === 12) await jpg(await page.screenshot({ type: "png" }), "hero_3q_noon");
    log.push(...page._logs.filter((l) => !/hero-main|server caches/.test(l)));
    await page.context().close();
  }
}

/* ---- the film's places */
async function place(id, chapter, items, { dpr = 1, arena = false } = {}) {
  const page = await newPage(browser, { hour: 12, dpr, assets: (c) => pinAssets(c, ASSETS) });
  await openStage(page);
  await installCam(page);
  await enterPlace(page, chapter, { speed: 0 });
  await page.waitForFunction(() => window.__stallionFilm.telemetry().speed < 0.04, null, { timeout: 30000 });
  if (arena) await page.evaluate(() => { const f = window.__stallionFilm; f.loco.place(0, 64, 0, 0); f.setManual({ speed: 0, alert: 0 }); });
  await sleep(2200);
  for (const name of items) {
    if (name.startsWith("film:")) {
      await camOff(page);
      await page.evaluate((s) => window.__stallionFilm.setManual({ speed: 0, shot: s }), name.slice(5));
      await sleep(4500);
    } else if (BONE_CAMS[name]) {
      const c = BONE_CAMS[name]; await camBone(page, c.cam, c.look, c.fov); await sleep(1500);
    } else {
      const c = CAMS[name]; await camRel(page, c.a, c.b, c.fov); await sleep(1500);
    }
    await jpg(await page.screenshot({ type: "png" }), `${id}_${name.replace("film:", "film_")}${dpr === 2 ? "_2x" : ""}`);
  }
  log.push(...page._logs.filter((l) => !/hero-main|server caches/.test(l)));
  await page.context().close();
}
if (GROUPS.includes("desert")) {
  await place("desert", 1, ["side", "threeQuarter", "front", "hoofGround", "maneNeck", "headEyeMuzzle", "film:wideEstablish"]);
  await place("desert", 1, ["eye", "muzzle", "ears", "shoulder", "barrel"], { dpr: 2 });
}
if (GROUPS.includes("village")) await place("village", 2, ["side", "film:villageReveal"]);
if (GROUPS.includes("arena")) await place("arena", 3, ["threeQuarter", "hoofGround", "side", "film:finalWide"], { arena: true });

/* ---- the anatomy plate */
if (GROUPS.includes("plate")) {
  const page = await newPage(browser, { width: 1440, height: 900, dpr: 1, hour: 12, assets: (c) => pinAssets(c, ASSETS) });
  await page.goto(URL_HOME.replace("&filmdebug=1", ""), { waitUntil: "domcontentloaded" });
  await hideDevChrome(page);
  await page.getByText("Specimen Plate 02", { exact: false }).first().waitFor({ state: "attached", timeout: 60000 });
  await page.evaluate(() => { const el = [...document.querySelectorAll("span")].find((e) => /Specimen Plate 02/.test(e.textContent || "")); el?.scrollIntoView({ block: "center" }); });
  const canvas = page.locator('canvas[aria-label^="A rotatable 3D model"]');
  await canvas.waitFor({ state: "attached", timeout: 60000 });
  await page.waitForFunction(() => { const c = document.querySelector('canvas[aria-label^="A rotatable 3D model"]'); return c && getComputedStyle(c).opacity === "1"; }, null, { timeout: 60000 });
  await sleep(1500);
  const box = canvas.locator("xpath=..");
  const pause = page.getByRole("button", { name: /pause orbit/i });
  if (await pause.count()) await pause.first().click();
  await page.getByRole("button", { name: /reset view/i }).first().click();
  await sleep(3000);
  await jpg(await box.screenshot({ type: "png" }), "plate_overview");
  const markers = page.locator('ul[aria-label="Points on the horse"] button');
  const n = await markers.count();
  for (let i = 0; i < n; i++) {
    const m = markers.nth(i);
    const slug = ((await m.getAttribute("aria-label")) ?? `p${i}`).split(":")[0].toLowerCase().replace(/[^a-z]+/g, "");
    if (!["ears", "neck", "hoof"].includes(slug)) continue;
    await page.evaluate(() => { document.querySelector('canvas[aria-label^="A rotatable 3D model"]').scrollIntoView({ block: "center" }); });
    await m.evaluate((el) => el.click());
    await sleep(5500);
    await jpg(await box.screenshot({ type: "png" }), `plate_${slug}`);
  }
  log.push(...page._logs.filter((l) => !/hero-main|server caches/.test(l)));
  await page.context().close();
}
fs.writeFileSync(`${OUT}/_log.json`, JSON.stringify(log, null, 1));
console.log("logs", log.slice(0, 6));
await browser.close();
