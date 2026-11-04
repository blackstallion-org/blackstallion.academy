// How the stride page performs, measured in the page: CPU time of the one render loop, a no-vsync benchmark (render plus a one-pixel readback so the GPU is waited for),
// frame pacing, draw calls, memory, what is transferred, and that nothing renders while the stage is off screen or paused.
// node perf.mjs [width] [height] [dpr] [out.json]   Uses the Mac's Metal GPU in headless Chrome: a desktop-class number, not a phone.
import fs from "node:fs";
import { launch, sleep, out, glInfo, BASE } from "./lib.mjs";

const [w = "1440", h = "900", dpr = "2", file = "perf.json"] = process.argv.slice(2);
const mobile = +w < 700;
const browser = await launch("gpu");
const ctx = await browser.newContext({ viewport: { width: +w, height: +h }, deviceScaleFactor: +dpr, hasTouch: mobile, isMobile: mobile });
const page = await ctx.newPage();
const t0 = Date.now();
await page.goto(`${BASE}/stride?stridedebug`, { waitUntil: "domcontentloaded", timeout: 120000 });
await page.waitForFunction(() => !!window.__stride, null, { timeout: 120000 });
const readyMs = Date.now() - t0;
await page.evaluate(() => document.querySelector("#laboratory").scrollIntoView({ block: "start" }));
await sleep(3000);
const res = { viewport: `${w}x${h} @${dpr}x`, gl: await glInfo(page), readyMsFromNavigation: readyMs };

res.transfer = await page.evaluate(() => performance.getEntriesByType("resource").filter((r) => /\.(glb|wasm)|draco|marwari|cadet|anatomy-exhibit/.test(r.name)).map((r) => ({ name: r.name.split("/").slice(-2).join("/"), kB: +(r.transferSize / 1024).toFixed(0), ms: +r.duration.toFixed(0) })));
res.dataBuildMs = await page.evaluate(() => { const t = performance.now(); window.__stride.rig.setPhase(0.5); return +(performance.now() - t).toFixed(2); });

// 1. playing: the loop's own CPU time per frame and the pace
res.playing = await page.evaluate(
  () =>
    new Promise((resolve) => {
      const { clock, ctrl } = window.__stride;
      clock.set(0);
      clock.play();
      const before = { ...ctrl.stats };
      const stamps = [];
      const off = clock.subscribe(() => stamps.push(performance.now()));
      setTimeout(() => {
        off();
        clock.pause();
        const frames = ctrl.stats.frames - before.frames;
        const dts = stamps.slice(1).map((t, i) => t - stamps[i]).sort((a, b) => a - b);
        resolve({ seconds: 6, frames, cpuMsPerFrame: +((ctrl.stats.cpuMs - before.cpuMs) / frames).toFixed(2), worstCpuMs: +ctrl.stats.maxMs.toFixed(1), frameMsMedian: +dts[Math.floor(dts.length / 2)].toFixed(1), frameMsP95: +dts[Math.floor(dts.length * 0.95)].toFixed(1), frameMsMax: +dts[dts.length - 1].toFixed(1) });
      }, 6000);
    }),
);
// 2. no-vsync benchmark
res.benchmark = await page.evaluate(() => { const { ctrl } = window.__stride; ctrl.benchmark(20); const a = ctrl.benchmark(120); const b = ctrl.benchmark(120); return { ...a, ms: +((a.ms + b.ms) / 2).toFixed(2) }; });
// 3. nothing renders while paused, or while off screen
const idle = await page.evaluate(async () => { const { ctrl, clock } = window.__stride; clock.pause(); await new Promise((r) => setTimeout(r, 400)); const f0 = ctrl.stats.frames; await new Promise((r) => setTimeout(r, 1500)); return ctrl.stats.frames - f0; });
res.framesRenderedWhilePaused1_5s = idle;
await page.evaluate(() => window.__stride.clock.play());
await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
await sleep(1200);
const off = await page.evaluate(async () => { const { ctrl } = window.__stride; const f0 = ctrl.stats.frames; await new Promise((r) => setTimeout(r, 1500)); return ctrl.stats.frames - f0; });
res.framesRenderedWhileOffScreen1_5s = off;
// 4. memory and contexts
res.heapMB = await page.evaluate(() => (performance.memory ? +(performance.memory.usedJSHeapSize / 1048576).toFixed(0) : null));
res.glInfo = await page.evaluate(() => { const { ctrl } = window.__stride; const i = ctrl.renderer.info; return { geometries: i.memory.geometries, textures: i.memory.textures, programs: i.programs?.length }; });
res.dprNow = await page.evaluate(() => window.__stride.ctrl.renderer.getPixelRatio());
console.log(JSON.stringify(res, null, 1));
fs.writeFileSync(out(file), JSON.stringify(res, null, 1));
await browser.close();
