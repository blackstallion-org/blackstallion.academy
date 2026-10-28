// Baseline: mobile portrait set, anatomy plate (desktop + mobile), reduced-motion and no-WebGL fallbacks.
// usage: node base_misc.mjs <outdir> <assetsdir> [groups]
import fs from "node:fs";
import { createRequire } from "node:module";
import { launch, pinAssets, sleep } from "./harness.mjs";
import { newPage, openStage, installCam, camRel, camOff, enterPlace, stats, hideDevChrome, URL_HOME } from "./stage.mjs";
const require = createRequire(import.meta.url);
const sharp = require("sharp");
const OUT = process.argv[2], ASSETS = process.argv[3];
const GROUPS = (process.argv[4] ?? "mobile,plate,fallback").split(",");
fs.mkdirSync(OUT, { recursive: true });
const save = async (page, name, el) => {
  const buf = el ? await el.screenshot({ type: "png" }) : await page.screenshot({ type: "png" });
  await sharp(buf).jpeg({ quality: 90, mozjpeg: true }).toFile(`${OUT}/${name}.jpg`);
  console.log("saved", name);
};
const meta = {};
const browser = await launch("gpu");

/* ------------------------------------------------ mobile portrait */
if (GROUPS.includes("mobile")) {
  const page = await newPage(browser, { width: 390, height: 844, dpr: 2, mobile: true, hour: 12, assets: (c) => pinAssets(c, ASSETS) });
  await openStage(page);
  await sleep(800);
  await save(page, "hero_mobile_noon");
  meta.mobileModel = await page.evaluate(() => performance.getEntriesByType("resource").filter((r) => /marwari-hero/.test(r.name)).map((r) => ({ url: r.name.split("/").pop(), enc: r.encodedBodySize, dur: Math.round(r.duration) })));
  await installCam(page);
  await enterPlace(page, 1, { speed: 0 });
  await camOff(page);
  await page.evaluate(() => window.__stallionFilm.setManual({ speed: 0, shot: "wideEstablish" }));
  await sleep(4200); await save(page, "desert_film_wide_mobile");
  await camRel(page, [0.3, 8.0, 1.3], [0.25, 0, 1.0], 40); await sleep(1300); await save(page, "desert_side_mobile");
  await camRel(page, [5.6, 5.2, 2.2], [0.2, 0, 1.0], 40); await sleep(1300); await save(page, "desert_threeQuarter_mobile");
  meta.mobileDesert = await stats(page);
  await enterPlace(page, 2, { speed: 0 });
  await page.waitForFunction(() => window.__stallionFilm.telemetry().speed < 0.04, null, { timeout: 30000 });
  await camOff(page);
  await page.evaluate(() => window.__stallionFilm.setManual({ speed: 0, shot: "villageReveal" }));
  await sleep(4200); await save(page, "village_film_reveal_mobile");
  meta.mobileVillage = await stats(page);
  await enterPlace(page, 3, { speed: 0 });
  await page.waitForFunction(() => window.__stallionFilm.telemetry().speed < 0.04, null, { timeout: 30000 });
  await page.evaluate(() => window.__stallionFilm.setManual({ speed: 0, shot: "finalWide" }));
  await sleep(4200); await save(page, "campus_film_final_mobile");
  meta.mobileCampus = await stats(page);
  meta.mobileLogs = page._logs.slice(0, 10);
  await page.context().close();
}

/* ------------------------------------------------ anatomy plate */
async function plate(page, prefix) {
  const canvas = page.locator('canvas[aria-label^="A rotatable 3D model"]');
  // the plate mounts its WebGL view only when it is near the viewport: bring its heading into view first
  await page.getByText("Specimen Plate 02", { exact: false }).first().waitFor({ state: "attached", timeout: 60000 });
  await page.evaluate(() => { const el = [...document.querySelectorAll("span")].find((e) => /Specimen Plate 02/.test(e.textContent || "")); el?.scrollIntoView({ block: "center" }); });
  await sleep(800);
  await canvas.waitFor({ state: "attached", timeout: 60000 });
  await canvas.scrollIntoViewIfNeeded();
  await page.evaluate(() => { const c = document.querySelector('canvas[aria-label^="A rotatable 3D model"]'); c.scrollIntoView({ block: "center" }); });
  await page.waitForFunction(() => { const c = document.querySelector('canvas[aria-label^="A rotatable 3D model"]'); return c && getComputedStyle(c).opacity === "1"; }, null, { timeout: 60000 });
  await sleep(1500);
  const box = canvas.locator("xpath=..");
  const pause = page.getByRole("button", { name: /pause orbit/i });
  if (await pause.count()) await pause.first().click();
  await page.getByRole("button", { name: /reset view/i }).first().click();
  await sleep(2500);
  await save(page, `${prefix}_overview`, box);
  const markers = page.locator('ul[aria-label="Points on the horse"] button');
  const n = await markers.count();
  meta[`${prefix}Markers`] = [];
  for (let i = 0; i < n; i++) {
    const m = markers.nth(i);
    const label = (await m.getAttribute("aria-label")) ?? `p${i}`;
    meta[`${prefix}Markers`].push(label);
    const vis = await m.evaluate((el) => getComputedStyle(el).visibility);
    let reach = "clickable";
    await page.evaluate(() => { const c = document.querySelector('canvas[aria-label^="A rotatable 3D model"]'); c.scrollIntoView({ block: "center" }); });
    const rb = await m.evaluate((el) => { const r = el.getBoundingClientRect(); return { x: r.x, y: r.y, vw: innerWidth, vh: innerHeight, vis: getComputedStyle(el).visibility }; });
    if (rb.x < 0 || rb.x > rb.vw || rb.y < 0 || rb.y > rb.vh || rb.vis === "hidden") reach = "marker not on screen at overview (selected by script)";
    await m.evaluate((el) => el.click());
    meta[`${prefix}Markers`][i] += ` [${reach}]`;
    await sleep(5500);
    const slug = label.split(":")[0].toLowerCase().replace(/[^a-z]+/g, "");
    await save(page, `${prefix}_${slug}`, box);
    meta[`${prefix}Markers`][i] += vis === "visible" ? "" : " (marker hidden off-frame at overview)";
  }
  await page.evaluate(() => window.scrollBy(0, 0));
  await save(page, `${prefix}_page`);
}
if (GROUPS.includes("plate")) {
  const d = await newPage(browser, { width: 1440, height: 900, dpr: 1, hour: 12, assets: (c) => pinAssets(c, ASSETS) });
  await d.goto(URL_HOME.replace("&filmdebug=1", ""), { waitUntil: "domcontentloaded" });
  await hideDevChrome(d);
  await plate(d, "plate");
  meta.plateLogs = d._logs.slice(0, 10);
  await d.context().close();
  const m = await newPage(browser, { width: 390, height: 844, dpr: 2, mobile: true, hour: 12, assets: (c) => pinAssets(c, ASSETS) });
  await m.goto(URL_HOME.replace("&filmdebug=1", ""), { waitUntil: "domcontentloaded" });
  await hideDevChrome(m);
  await plate(m, "plate_mobile");
  meta.plateMobileLogs = m._logs.slice(0, 10);
  await m.context().close();
}

/* ------------------------------------------------ fallbacks */
if (GROUPS.includes("fallback")) {
  // reduced motion: one still frame, no film
  const r = await newPage(browser, { width: 1440, height: 900, dpr: 1, hour: 12, reduced: true, assets: (c) => pinAssets(c, ASSETS) });
  await r.goto(URL_HOME.replace("&filmdebug=1", ""), { waitUntil: "domcontentloaded" });
  await r.waitForSelector('section[aria-label="The Marwari stallion"]', { timeout: 60000 });
  await hideDevChrome(r);
  await r.evaluate(() => { const s = document.querySelector('section[aria-label="The Marwari stallion"]'); window.scrollTo(0, s.getBoundingClientRect().top + window.scrollY); });
  await r.waitForFunction(() => { const c = document.querySelector('section[aria-label="The Marwari stallion"] canvas'); return c && getComputedStyle(c).opacity === "1"; }, null, { timeout: 60000 });
  await sleep(1500);
  await save(r, "fallback_reduced_motion");
  meta.reducedFilm = await r.evaluate(() => ({ film: typeof window.__stallionFilm, sections: document.querySelectorAll('section[aria-label="The Marwari stallion"]').length, sectionHeight: Math.round(document.querySelector('section[aria-label="The Marwari stallion"]').getBoundingClientRect().height) }));
  await r.context().close();
  // no WebGL: the poster
  const n = await newPage(browser, { width: 1440, height: 900, dpr: 1, hour: 12, assets: (c) => pinAssets(c, ASSETS) });
  await n.addInitScript(() => {
    const orig = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type, ...rest) { if (/webgl/i.test(String(type))) return null; return orig.call(this, type, ...rest); };
  });
  await n.goto(URL_HOME.replace("&filmdebug=1", ""), { waitUntil: "domcontentloaded" });
  await n.waitForSelector('section[aria-label="The Marwari stallion"]', { timeout: 60000 });
  await hideDevChrome(n);
  await n.evaluate(() => { const s = document.querySelector('section[aria-label="The Marwari stallion"]'); window.scrollTo(0, s.getBoundingClientRect().top + window.scrollY); });
  await n.waitForSelector('img[alt^="A black Marwari stallion"]', { timeout: 30000 });
  await sleep(1500);
  await save(n, "fallback_no_webgl");
  meta.noWebglLogs = n._logs.slice(0, 6);
  await n.context().close();
}
fs.writeFileSync(`${OUT}/_meta_misc.json`, JSON.stringify(meta, null, 1));
await browser.close();
console.log(JSON.stringify(meta, null, 1).slice(0, 3000));
