// Model size and load time through the real network path (no pinned assets), cold and warm cache, unthrottled and Lighthouse "Slow 4G".
// Uses CDP network events (the Performance API entries were empty in this headless build).
// usage: node loadtime.mjs <baseUrl> <out.json>
import fs from "node:fs";
import os from "node:os";
import { launch } from "./harness.mjs";
import { newPage } from "./stage.mjs";

const BASE = process.argv[2] ?? "http://localhost:3101";
const OUT = process.argv[3];
const profiles = [
  { name: "desktop", width: 1440, height: 900, dpr: 2, mobile: false },
  { name: "mobile", width: 390, height: 844, dpr: 3, mobile: true },
];
const nets = [
  { name: "no throttle (localhost)", net: null },
  { name: "Slow 4G (1.6 Mbit/s, 150 ms RTT)", net: { offline: false, downloadThroughput: (1.6 * 1024 * 1024) / 8, uploadThroughput: (750 * 1024) / 8, latency: 150 } },
];
const browser = await launch("gpu");
const results = [];
for (const p of profiles) {
  for (const n of nets) {
    const page = await newPage(browser, { width: p.width, height: p.height, dpr: p.dpr, mobile: p.mobile, hour: 12 });
    const cdp = await page.context().newCDPSession(page);
    await cdp.send("Network.enable");
    if (n.net) await cdp.send("Network.emulateNetworkConditions", n.net);
    if (p.mobile && n.net) await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
    let reqs = new Map();
    cdp.on("Network.requestWillBeSent", (e) => reqs.set(e.requestId, { url: e.request.url, t0: e.timestamp, type: e.type }));
    cdp.on("Network.responseReceived", (e) => { const r = reqs.get(e.requestId); if (r) { r.status = e.response.status; r.fromCache = e.response.fromDiskCache || e.response.fromServiceWorker; r.mime = e.response.mimeType; r.tHeaders = e.timestamp; } });
    cdp.on("Network.loadingFinished", (e) => { const r = reqs.get(e.requestId); if (r) { r.t1 = e.timestamp; r.enc = e.encodedDataLength; } });
    for (const pass of ["cold", "warm"]) {
      if (pass === "cold") await cdp.send("Network.clearBrowserCache");
      reqs = new Map();
      const t0 = Date.now();
      await page.goto(`${BASE}/?stallion=preview&filmdebug=1`, { waitUntil: "commit" });
      await page.waitForFunction(() => { if (window.__stallionFilm?.ready && !window.__readyAt) window.__readyAt = performance.now(); return !!window.__readyAt; }, null, { timeout: 180000, polling: 100 });
      const readyAt = await page.evaluate(() => Math.round(window.__readyAt));
      const wall = Date.now() - t0;
      const all = [...reqs.values()];
      const doc = all.find((r) => r.type === "Document");
      const base = doc?.t0 ?? Math.min(...all.map((r) => r.t0));
      const ms = (t) => (t == null ? null : Math.round((t - base) * 1000));
      const row = (r) => ({ f: r.url.split("/").slice(-2).join("/").slice(0, 60), status: r.status, bytes: r.enc, startMs: ms(r.t0), endMs: ms(r.t1), durMs: r.t1 ? Math.round((r.t1 - r.t0) * 1000) : null });
      const glb = all.filter((r) => /marwari-hero(-mobile)?\.glb/.test(r.url)).map(row);
      const gaits = all.filter((r) => /marwari-gaits\.json/.test(r.url)).map(row);
      const draco = all.filter((r) => /draco_/.test(r.url)).map(row);
      const js = all.filter((r) => /\.js(\?|$)/.test(r.url) || r.mime === "application/javascript" || r.mime === "text/javascript");
      const media = all.filter((r) => /\.(mp4|webm)(\?|$)/.test(r.url));
      const stageJs = js.filter((r) => /stallion|engine|three/i.test(r.url));
      const out = {
        profile: p.name, network: n.name, pass, load: os.loadavg().map((x) => +x.toFixed(1)), wallMs: wall, filmReadyMsAfterNavStart: readyAt,
        glb, gaits, draco,
        jsKB: Math.round(js.reduce((a, r) => a + (r.enc || 0), 0) / 1024), jsFiles: js.length,
        videoKBBeforeReady: Math.round(media.reduce((a, r) => a + (r.enc || 0), 0) / 1024),
        totalKBBeforeReady: Math.round(all.reduce((a, r) => a + (r.enc || 0), 0) / 1024), requests: all.length,
      };
      results.push(out);
      console.log(`${p.name} | ${n.name} | ${pass} | film ready ${readyAt} ms | glb ${JSON.stringify(glb.map((g) => [g.bytes, g.startMs, g.endMs, g.status]))} | gaits ${gaits.map((g) => g.bytes)} | draco ${draco.map((g) => g.bytes)} | js ${out.jsKB} KB/${out.jsFiles} | video ${out.videoKBBeforeReady} KB | total ${out.totalKBBeforeReady} KB`);
      await page.evaluate(() => { delete window.__readyAt; });
    }
    await page.context().close();
  }
}
fs.writeFileSync(OUT, JSON.stringify({ base: BASE, when: new Date().toString(), results }, null, 1));
await browser.close();
