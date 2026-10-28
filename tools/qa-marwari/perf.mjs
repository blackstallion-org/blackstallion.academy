// Frame-time, GPU-time, draw-call and memory measurements on the Mac's GPU (Chrome for Testing, new headless, Metal).
// usage: node perf.mjs <profile desktop1|desktop2|mobile|mobile4x> <assetsdir> <out.json> [baseUrl] [uncapped]
import fs from "node:fs";
import os from "node:os";
import { launch, pinAssets, sleep } from "./harness.mjs";
import { newPage, openStage, installCam, camOff, enterPlace } from "./stage.mjs";
import * as stage from "./stage.mjs";

const PROFILE = process.argv[2] ?? "desktop2";
const ASSETS = process.argv[3];
const OUT = process.argv[4];
const BASE = process.argv[5] ?? "http://localhost:3100";
const UNCAPPED = process.argv[6] === "uncapped";
const WARM = 4500, SAMPLE = 12000;
const cfg = {
  desktop1: { width: 1440, height: 900, dpr: 1, mobile: false },
  desktop2: { width: 1440, height: 900, dpr: 2, mobile: false },
  mobile: { width: 390, height: 844, dpr: 3, mobile: true },
  mobile4x: { width: 390, height: 844, dpr: 3, mobile: true, cpu: 4 },
}[PROFILE];

const load = () => os.loadavg().map((x) => +x.toFixed(2)).join(" ");
const browser = await launch("gpu", UNCAPPED ? ["--disable-frame-rate-limit", "--disable-gpu-vsync"] : []);
const page = await newPage(browser, { ...cfg, hour: 12, assets: (c) => pinAssets(c, ASSETS) });
const client = await page.context().newCDPSession(page);
if (cfg.cpu) await client.send("Emulation.setCPUThrottlingRate", { rate: cfg.cpu });
// the URL helper in stage.mjs points at :3100; allow another origin (production server)
const homeUrl = `${BASE}/?stallion=preview&filmdebug=1`;
const t0 = Date.now();
await page.goto(homeUrl, { waitUntil: "domcontentloaded" });
await page.waitForSelector('section[aria-label="The Marwari stallion"]', { timeout: 90000 });
await stage.hideDevChrome(page);
await page.evaluate(() => { const s = document.querySelector('section[aria-label="The Marwari stallion"]'); window.scrollTo(0, s.getBoundingClientRect().top + window.scrollY); });
await page.waitForFunction(() => { const c = document.querySelector('section[aria-label="The Marwari stallion"] canvas'); return c && getComputedStyle(c).opacity === "1" && window.__stallionFilm && window.__stallionFilm.ready; }, null, { timeout: 90000 });
const readyMs = Date.now() - t0;
const info = await page.evaluate(() => {
  const c = document.createElement("canvas"); const g = c.getContext("webgl2"); const e = g.getExtension("WEBGL_debug_renderer_info");
  return { renderer: g.getParameter(e.UNMASKED_RENDERER_WEBGL), hw: navigator.hardwareConcurrency, dprReal: devicePixelRatio, innerWidth, innerHeight };
});
await installCam(page);

// instrument: rAF intervals, GPU time per frame (timer queries), draw calls, triangles
await page.evaluate(() => {
  const f = window.__stallionFilm, r = f.ctx.renderer, gl = r.getContext();
  const ext = gl.getExtension("EXT_disjoint_timer_query_webgl2");
  const P = (window.__perf = { on: false, raf: [], gpu: [], calls: [], tris: [], heap: [], ratio: [], tier: [], noExt: !ext });
  let pending = [];
  const orig = r.render.bind(r);
  r.render = (s, c) => {
    let q = null;
    if (ext && P.on) { q = gl.createQuery(); gl.beginQuery(ext.TIME_ELAPSED_EXT, q); }
    orig(s, c);
    if (q) { gl.endQuery(ext.TIME_ELAPSED_EXT); pending.push(q); }
    if (P.on) { P.calls.push(r.info.render.calls); P.tris.push(r.info.render.triangles); }
    if (ext && pending.length) {
      const dis = gl.getParameter(ext.GPU_DISJOINT_EXT);
      pending = pending.filter((qq) => {
        if (!gl.getQueryParameter(qq, gl.QUERY_RESULT_AVAILABLE)) return true;
        if (!dis) P.gpu.push(gl.getQueryParameter(qq, gl.QUERY_RESULT) / 1e6);
        gl.deleteQuery(qq);
        return false;
      });
    }
  };
  let last = performance.now();
  const loop = () => { const n = performance.now(); if (P.on) P.raf.push(n - last); last = n; requestAnimationFrame(loop); };
  requestAnimationFrame(loop);
  setInterval(() => { if (P.on) { P.heap.push(performance.memory ? performance.memory.usedJSHeapSize / 1048576 : 0); P.ratio.push(r.getPixelRatio()); P.tier.push(f.quality.tier); } }, 500);
});

const q = (a, p) => { if (!a.length) return null; const s = [...a].sort((x, y) => x - y); return +s[Math.min(s.length - 1, Math.floor(p * s.length))].toFixed(2); };
const mean = (a) => (a.length ? +(a.reduce((x, y) => x + y, 0) / a.length).toFixed(2) : null);
async function measure(name, setup) {
  await setup();
  await sleep(WARM);
  const l0 = load();
  await page.evaluate(() => { const P = window.__perf; P.raf = []; P.gpu = []; P.calls = []; P.tris = []; P.heap = []; P.ratio = []; P.tier = []; P.on = true; });
  await sleep(SAMPLE);
  const d = await page.evaluate(() => { const P = window.__perf; P.on = false; const f = window.__stallionFilm; return { raf: P.raf, gpu: P.gpu, calls: P.calls, tris: P.tris, heap: P.heap, ratio: P.ratio, tier: P.tier, programs: f.ctx.renderer.info.programs?.length, geometries: f.ctx.renderer.info.memory.geometries, textures: f.ctx.renderer.info.memory.textures, telemetry: f.telemetry(), canvas: [f.ctx.renderer.domElement.width, f.ctx.renderer.domElement.height], noExt: P.noExt }; });
  // synchronous render cost: render + readPixels sync, no vsync, nothing else on the main thread (3 passes of 60 frames)
  const bench = await page.evaluate(() => {
    const f = window.__stallionFilm, r = f.ctx.renderer, gl = r.getContext(), px = new Uint8Array(4);
    const run = (n) => { const t = []; for (let i = 0; i < n; i++) { const a = performance.now(); r.render(f.ctx.scene, f.ctx.camera); gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px); t.push(performance.now() - a); } return t; };
    run(10);
    const all = [run(60), run(60), run(60)];
    const pass = all.map((t) => { const s = [...t].sort((a, b) => a - b); return { min: +s[0].toFixed(2), median: +s[30].toFixed(2), p90: +s[54].toFixed(2) }; });
    return pass;
  });
  const r = d.raf;
  const res = {
    syncRenderMs: bench,
    scenario: name, loadBefore: l0, loadAfter: load(),
    frames: r.length, fps: r.length ? +(1000 / mean(r)).toFixed(1) : null, frameMs: { mean: mean(r), p50: q(r, 0.5), p95: q(r, 0.95), p99: q(r, 0.99), max: q(r, 1) },
    over20ms: r.filter((x) => x > 20).length, over33ms: r.filter((x) => x > 33.4).length,
    gpuMs: d.gpu.length ? { mean: mean(d.gpu), p50: q(d.gpu, 0.5), p95: q(d.gpu, 0.95), max: q(d.gpu, 1), samples: d.gpu.length } : { unavailable: d.noExt },
    drawCalls: { min: Math.min(...d.calls), median: q(d.calls, 0.5), max: Math.max(...d.calls) }, triangles: { median: q(d.tris, 0.5), max: Math.max(...d.tris) },
    heapMB: { start: +(d.heap[0] ?? 0).toFixed(1), end: +(d.heap[d.heap.length - 1] ?? 0).toFixed(1) },
    pixelRatio: [Math.min(...d.ratio), Math.max(...d.ratio)], tier: [Math.min(...d.tier), Math.max(...d.tier)], canvasPx: d.canvas,
    programs: d.programs, geometries: d.geometries, textures: d.textures, gait: d.telemetry?.gait, speed: d.telemetry?.speed && +d.telemetry.speed.toFixed(2), env: d.telemetry?.env,
  };
  console.log(name, JSON.stringify({ sync: res.syncRenderMs.map((b) => b.median).join("|"), fps: res.fps, p95: res.frameMs.p95, gpu: res.gpuMs.p50 ?? res.gpuMs, calls: res.drawCalls.median, tris: res.triangles.median, ratio: res.pixelRatio, tier: res.tier }));
  return res;
}

const results = { profile: PROFILE, baseUrl: BASE, uncapped: UNCAPPED, device: info, readyMs, when: new Date().toString(), cfg, scenarios: [] };
const S = results.scenarios;
const SC = process.env.SCEN ? process.env.SCEN.split(",") : null;
const want = (n) => !SC || SC.some((k) => n.includes(k));
if (want("hero idle (chapter 0)")) S.push(await measure("hero idle (chapter 0)", async () => {}));
if (want("desert, standing")) S.push(await measure("desert, standing", async () => { await enterPlace(page, 1, { speed: 0 }); await camOff(page); await page.evaluate(() => window.__stallionFilm.setManual({ speed: 0, shot: "wideEstablish" })); }));
if (want("desert, gallop 10 m/s (side track)")) S.push(await measure("desert, gallop 10 m/s (side track)", async () => { await page.evaluate(() => window.__stallionFilm.setManual({ speed: 10, shot: "sideTrack" })); }));
if (want("village, trot 3.4 m/s")) S.push(await measure("village, trot 3.4 m/s", async () => { await enterPlace(page, 2, { speed: 3.4 }); await camOff(page); await page.evaluate(() => window.__stallionFilm.setManual({ speed: 3.4, shot: "villageSide" })); }));
if (want("campus, canter 5.2 m/s")) S.push(await measure("campus, canter 5.2 m/s", async () => { await enterPlace(page, 3, { speed: 5.2 }); await camOff(page); await page.evaluate(() => window.__stallionFilm.setManual({ speed: 5.2, shot: "campusSide" })); }));
results.logs = page._logs.slice(0, 12);
fs.writeFileSync(OUT, JSON.stringify(results, null, 1));
await browser.close();
console.log("wrote", OUT);
