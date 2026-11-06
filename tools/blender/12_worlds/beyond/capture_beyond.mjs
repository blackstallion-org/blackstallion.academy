// QA captures of World 04 for slow software GL: jump, let it render, pause the engine, then screenshot the still canvas.
// NODE_PATH="$(npm root -g)" node tools/blender/12_worlds/beyond/capture_beyond.mjs --p 0.75,0.9,1 --w 1440 --h 900 --out /root/qa/beyond --prefix b
import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const args = Object.fromEntries(process.argv.slice(2).reduce((a, v, i, all) => (v.startsWith("--") ? [...a, [v.slice(2), all[i + 1]]] : a), []));
const base = args.base ?? "http://localhost:3100";
const out = args.out ?? "/root/qa/beyond";
const ps = (args.p ?? "0.9").split(",").map(Number);
const w = Number(args.w ?? 1440), h = Number(args.h ?? 900);
const wait = Number(args.wait ?? 6000);
const tier = args.tier ?? "high";
const prefix = args.prefix ?? `b${w}`;
fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
page.setDefaultTimeout(600000);
const logs = [];
page.on("console", (m) => { if (["error", "warning"].includes(m.type()) && !/GPU stall|LCP|Largest Contentful/.test(m.text())) logs.push(`${m.type()}: ${m.text()}`); });
page.on("pageerror", (e) => logs.push(`pageerror: ${e.message}`));
page.on("response", (r) => { if (r.status() >= 400) logs.push(`http ${r.status()}: ${r.url()}`); });
await page.goto(`${base}/worlds?noload&p=${ps[0]}&freeze=1&tier=${tier}`, { waitUntil: "domcontentloaded", timeout: 300000 });
await page.waitForFunction(() => window.__worlds?.status?.phase === "ready" || window.__worlds?.status?.phase === "failed", null, { timeout: 900000 });
const results = [];
for (const p of ps) {
  await page.evaluate((p) => { window.__worlds.setVisible(true); const el = document.querySelector("section[aria-label^='Four Worlds']"); const top = el.getBoundingClientRect().top + scrollY; window.scrollTo(0, top + (el.offsetHeight - innerHeight) * p); window.__worlds.jump(p); }, p);
  await page.waitForTimeout(wait);
  // wait until a few frames have rendered at this progress
  await page.evaluate(() => new Promise((r) => { let n = 0; const f = () => (++n > 3 ? r(true) : requestAnimationFrame(f)); requestAnimationFrame(f); }));
  // draw calls and triangles of one whole frame (every pass: shadows, scene, transition, bloom, output)
  const frameInfo = await page.evaluate(() => new Promise((r) => { const ren = window.__worlds.renderer;
    // reset after the engine's frame N, read after its frame N+1: exactly one frame (every pass)
    requestAnimationFrame(() => { ren.info.autoReset = false; ren.info.reset();
      requestAnimationFrame(() => { const i = ren.info.render; const o = { calls: i.calls, triangles: i.triangles, geometries: ren.info.memory.geometries, textures: ren.info.memory.textures }; ren.info.autoReset = true; r(o); }); }); }));
  const dbg = await page.evaluate(() => { const d = window.__worlds.debug(); return { progress: d.progress, frame: d.frame, fps: d.fps, calls: d.info.calls, tris: d.info.triangles, pose: d.pose, clearance: window.__beyondClearance }; });
  await page.evaluate(() => window.__worlds.setVisible(false));
  await page.waitForTimeout(300);
  const file = path.join(out, `${prefix}-p${p.toFixed(3)}.png`);
  await page.screenshot({ path: file, timeout: 600000 });
  results.push({ p, file, ...dbg, frameInfo });
  console.error(`captured ${file} frame=${JSON.stringify(frameInfo)}`);
}
console.log(JSON.stringify({ results, logs: logs.slice(0, 30) }, null, 1));
await browser.close();
