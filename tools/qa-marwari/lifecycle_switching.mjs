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
const hitsA = { glb: 0, gaits: 0 };
page.on('request', (r) => { const u = r.url(); if (/marwari-hero(-mobile)?\\.glb/.test(u)) hitsA.glb++; if (/marwari-gaits\\.json/.test(u)) hitsA.gaits++; });
const goto = BASE + "/?stallion=preview&filmdebug=1";
await page.goto(goto, { waitUntil: "domcontentloaded" });
await page.waitForSelector('section[aria-label="The Marwari stallion"]', { timeout: 90000 });
await hideDevChrome(page);
await page.evaluate(() => { const s = document.querySelector('section[aria-label="The Marwari stallion"]'); window.scrollTo(0, s.getBoundingClientRect().top + window.scrollY); });
await page.waitForFunction(() => { const c = document.querySelector('section[aria-label="The Marwari stallion"] canvas'); return c && getComputedStyle(c).opacity === "1" && window.__stallionFilm?.ready; }, null, { timeout: 90000 });
await sleep(1500);
await stage.installCam(page);

/* ---- A. one GLB, one horse, across environment switches */
const snapPage = () => page.evaluate(() => {
  const f = window.__stallionFilm, r = f.ctx.renderer;
  const glb = performance.getEntriesByType("resource").filter((e) => /marwari-hero(-mobile)?\.glb/.test(e.name)).length;
  const gait = performance.getEntriesByType("resource").filter((e) => /marwari-gaits\.json/.test(e.name)).length;
  return { horseRootUuid: f.ctx.horse.root.uuid.slice(0, 8), mixerRoot: f.ctx.mixer.getRoot().uuid.slice(0, 8),  geometries: r.info.memory.geometries, textures: r.info.memory.textures, programs: r.info.programs.length, chapter: f.chapter, env: f.telemetry()?.env, actions: f.ctx.mixer._actions.length, contexts: { ...window.__ctx } };
});
const snap = async () => ({ ...(await snapPage()), glbRequests: hitsA.glb, gaitRequests: hitsA.gaits });
R.switching = [];
R.switching.push({ step: "hero", ...(await snap()), ...(await heap()) });
// frame-time probe during transitions
await page.evaluate(() => { window.__ft = []; let last = performance.now(); const loop = () => { const n = performance.now(); window.__ft.push(n - last); last = n; requestAnimationFrame(loop); }; requestAnimationFrame(loop); });
for (const c of [1, 2, 3, 1, 2, 3, 0, 1]) {
  await page.evaluate(() => (window.__ft = []));
  await page.evaluate((c) => window.__stallionFilm.goTo(c), c);
  await page.waitForFunction((c) => { const f = window.__stallionFilm; return f.chapter === c && f.veilAmount < 0.02 && (c === 0 || f.active); }, c, { timeout: 60000 });
  await sleep(2500);
  const ft = await page.evaluate(() => window.__ft);
  const sorted = [...ft].sort((a, b) => a - b);
  R.switching.push({ step: `goTo(${c})`, maxFrameMs: +Math.max(...ft).toFixed(1), framesOver50ms: ft.filter((x) => x > 50).length, p99: +sorted[Math.floor(sorted.length * 0.99)].toFixed(1), ...(await snap()), ...(await heap()) });
}
console.log("SWITCHING"); R.switching.forEach((s) => console.log(JSON.stringify(s)));

/* ---- B. GPU memory estimate in the desert (textures, render targets) */
await page.evaluate(() => window.__stallionFilm.goTo(1));
await page.waitForFunction(() => { const f = window.__stallionFilm; return f.chapter === 1 && f.veilAmount < 0.02 && f.active; }, null, { timeout: 60000 });
await sleep(2000);
R.gpuMemory = await page.evaluate(() => {
  const f = window.__stallionFilm, r = f.ctx.renderer, scene = f.ctx.scene;
  const seen = new Set(); let texBytes = 0; const list = [];
  const add = (t, label) => {
    if (!t || seen.has(t.uuid) || !t.isTexture) return; seen.add(t.uuid);
    const img = t.image; const w = img?.width || img?.videoWidth || 0, h = img?.height || img?.videoHeight || 0;
    if (!w || !h) return;
    const mip = t.generateMipmaps && t.minFilter !== 1003 && t.minFilter !== 1006 ? 4 / 3 : 1;
    const b = w * h * 4 * mip * (t.isCubeTexture ? 6 : 1);
    texBytes += b; list.push([label, w + "x" + h, Math.round(b / 1024) + " KB"]);
  };
  scene.traverse((o) => { const ms = Array.isArray(o.material) ? o.material : o.material ? [o.material] : []; for (const m of ms) for (const k of Object.keys(m)) if (m[k]?.isTexture) add(m[k], (o.name || o.type) + "." + k); });
  add(scene.environment, "scene.environment (PMREM)");
  const dpr = r.getPixelRatio(), cw = r.domElement.width, ch = r.domElement.height;
  const msaa = r.capabilities.maxSamples >= 4 ? 4 : 1; // antialias:true -> MSAA drawing buffer in ANGLE
  const fb = cw * ch * (4 + 4) * (r.getContext().getContextAttributes().antialias ? 4 : 1) + cw * ch * 4;
  const sm = f.sun.shadow.mapSize.x ** 2 * 4;
  return { canvasPx: [cw, ch], pixelRatio: dpr, antialias: r.getContext().getContextAttributes().antialias, drawingBufferMB: +(fb / 1048576).toFixed(1), shadowMapMB: +(sm / 1048576).toFixed(1), textureMB_sceneMaterials: +(texBytes / 1048576).toFixed(1), top: list.sort((a, b) => parseInt(b[2]) - parseInt(a[2])).slice(0, 8) };
});
console.log("GPU memory", JSON.stringify(R.gpuMemory));


R.logs = page._logs.filter((l) => !/hero-main/.test(l)).slice(0, 10);
fs.writeFileSync(`${OUT}/lifecycle_switching.json`, JSON.stringify(R, null, 1));
await browser.close();
