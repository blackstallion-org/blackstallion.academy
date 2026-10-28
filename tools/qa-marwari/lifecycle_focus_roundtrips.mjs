// Lifecycle checks: one GLB load across environment switches, program/texture growth, route-navigation leak test, GPU memory estimate, keyboard focus.
// usage: node lifecycle.mjs <outdir> <assetsdir> [baseUrl]
import fs from "node:fs";
import os from "node:os";
import { createRequire } from "node:module";
import { launch, pinAssets, sleep } from "./harness.mjs";
import { newPage, hideDevChrome } from "./stage.mjs";
import * as stage from "./stage.mjs";
const require = createRequire(import.meta.url);
const sharp = require("sharp");
const OUT = process.argv[2], ASSETS = process.argv[3], BASE = process.argv[4] ?? "http://localhost:3100";
fs.mkdirSync(OUT, { recursive: true });
const R = { base: BASE, when: new Date().toString(), load: os.loadavg().map((x) => +x.toFixed(1)) };
const browser = await launch("gpu", ["--js-flags=--expose-gc"]);
const page = await newPage(browser, { hour: 12, dpr: 1, assets: (c) => pinAssets(c, ASSETS) });
const cdp = await page.context().newCDPSession(page);
await page.addInitScript(() => {
  // count WebGL contexts created and lost
  window.__ctx = { created: 0, lost: 0 };
  const orig = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function (t, ...a) {
    const c = orig.call(this, t, ...a);
    if (c && /webgl/.test(String(t)) && !this.__counted) { this.__counted = true; window.__ctx.created++; this.addEventListener("webglcontextlost", () => window.__ctx.lost++); }
    return c;
  };
});
const heap = async () => { await cdp.send("HeapProfiler.collectGarbage"); const m = await cdp.send("Performance.getMetrics"); const g = Object.fromEntries(m.metrics.map((x) => [x.name, x.value])); return { heapMB: +(g.JSHeapUsedSize / 1048576).toFixed(1), nodes: g.Nodes, listeners: g.JSEventListeners, docs: g.Documents }; };
await cdp.send("Performance.enable");
const goto = BASE + "/?stallion=preview&filmdebug=1";
await page.goto(goto, { waitUntil: "domcontentloaded" });
await page.waitForSelector('section[aria-label="The Marwari stallion"]', { timeout: 90000 });
await hideDevChrome(page);
await page.evaluate(() => { const s = document.querySelector('section[aria-label="The Marwari stallion"]'); window.scrollTo(0, s.getBoundingClientRect().top + window.scrollY); });
await page.waitForFunction(() => { const c = document.querySelector('section[aria-label="The Marwari stallion"] canvas'); return c && getComputedStyle(c).opacity === "1" && window.__stallionFilm?.ready; }, null, { timeout: 90000 });
await sleep(1500);
await stage.installCam(page);

/* ---- C. keyboard focus on the stage controls (chapter 0): tab until inside the stage, then through it */
await page.evaluate(() => { const s = document.querySelector('section[aria-label="The Marwari stallion"]'); window.scrollTo(0, s.getBoundingClientRect().top + window.scrollY); document.activeElement?.blur(); });
await sleep(1000);
const focusOrder = [];
let inStageCount = 0;
for (let i = 0; i < 60 && inStageCount < 7; i++) {
  await page.keyboard.press("Tab");
  const a = await page.evaluate(() => { const e = document.activeElement; if (!e) return null; const cs = getComputedStyle(e); const r = e.getBoundingClientRect(); return { tag: e.tagName, text: (e.textContent || e.getAttribute("aria-label") || "").trim().slice(0, 40), outline: cs.outlineStyle + " " + cs.outlineWidth + " " + cs.outlineColor, inStage: !!e.closest('section[aria-label="The Marwari stallion"]'), onScreen: r.top >= 0 && r.bottom <= innerHeight && r.width > 0 }; });
  if (a?.inStage) { inStageCount++; focusOrder.push(a); const b = await page.screenshot({ type: "png" }); await sharp(b).resize(900).jpeg({ quality: 85 }).toFile(`${OUT}/focus_${inStageCount}.jpg`); }
}
R.focusOrder = focusOrder;
console.log("FOCUS in stage", JSON.stringify(focusOrder));

/* ---- D. route round trips: / -> /cadets -> back (client-side), ten times */
const hits = { glb: 0, gaits: 0, draco: 0 };
page.on("request", (r) => { const u = r.url(); if (/marwari-hero(-mobile)?\.glb/.test(u)) hits.glb++; if (/marwari-gaits\.json/.test(u)) hits.gaits++; if (/draco_(wasm_wrapper|decoder)/.test(u)) hits.draco++; });
R.roundTrips = [];
R.roundTrips.push({ cycle: 0, ...(await heap()), contexts: await page.evaluate(() => ({ ...window.__ctx })) });
for (let i = 1; i <= 10; i++) {
  const link = page.locator('a[href="/cadets"]').first();
  await link.evaluate((el) => el.click());
  await page.waitForURL(/cadets/, { timeout: 30000 });
  await sleep(1500);
  await page.goBack();
  await page.waitForSelector('section[aria-label="The Marwari stallion"]', { timeout: 30000 });
  await page.evaluate(() => { const s = document.querySelector('section[aria-label="The Marwari stallion"]'); window.scrollTo(0, s.getBoundingClientRect().top + window.scrollY); });
  await sleep(2200);
  const ready = await page.evaluate(() => !!window.__stallionFilm?.ready);
  R.roundTrips.push({ cycle: i, filmReady: ready, ...(await heap()), contexts: await page.evaluate(() => ({ ...window.__ctx })), requests: { ...hits } });
}
console.log("ROUND TRIPS"); R.roundTrips.forEach((s) => console.log(JSON.stringify(s)));
R.logs = page._logs.filter((l) => !/hero-main/.test(l)).slice(0, 20);
console.log("LOGS", JSON.stringify(R.logs));
fs.writeFileSync(`${OUT}/lifecycle2.json`, JSON.stringify(R, null, 1));
await browser.close();
