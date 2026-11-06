// Captures frames of /worlds from a running dev server (headless Chromium, ANGLE/SwiftShader when there is no GPU).
// node tools/qa-worlds/capture.mjs --base http://localhost:3100 --out scratch/worlds --p 0,0.1,0.2 [--w 1440 --h 900] [--tier high] [--wait 2500]
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
// the project does not depend on playwright: run with NODE_PATH="$(npm root -g)"
const { chromium } = require("playwright");
import fs from "node:fs";
import path from "node:path";
const args = Object.fromEntries(process.argv.slice(2).reduce((a, v, i, all) => (v.startsWith("--") ? [...a, [v.slice(2), all[i + 1]]] : a), []));
const base = args.base ?? "http://localhost:3100";
const out = args.out ?? "scratch/worlds";
const ps = (args.p ?? "0").split(",").map(Number);
const w = Number(args.w ?? 1440), h = Number(args.h ?? 900);
const wait = Number(args.wait ?? 2500);
const tier = args.tier ?? "high";
const prefix = args.prefix ?? `${w}`;
fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
const logs = [];
page.on("console", (m) => { if (["error", "warning"].includes(m.type())) logs.push(`${m.type()}: ${m.text()}`); });
page.on("pageerror", (e) => logs.push(`pageerror: ${e.message}`));
await page.goto(`${base}/worlds?noload&debug&p=${ps[0]}&freeze=1&tier=${tier}`, { waitUntil: "domcontentloaded", timeout: 180000 });
await page.waitForFunction(() => window.__worlds?.status?.phase === "ready" || window.__worlds?.status?.phase === "failed", null, { timeout: 900000 });
// --clean 1: hide the overlay and the site navigation (stills for the static version of the page)
if (args.clean === "1") await page.addStyleTag({ content: "header, nav, [class*='overlay'], [class*='finalShade'] { display: none !important; } nextjs-portal { display: none !important; }" });
const results = [];
for (const p of ps) {
  await page.evaluate((p) => { const el = document.querySelector("section[aria-label^='Four Worlds']"); const top = el.getBoundingClientRect().top + scrollY; window.scrollTo(0, top + (el.offsetHeight - innerHeight) * p); window.__worlds.jump(p); }, p);
  // let the world load and a few frames render
  await page.waitForTimeout(wait);
  await page.waitForFunction(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => r(true)))), null, { timeout: 400000 });
  const dbg = await page.evaluate(() => { const d = window.__worlds.debug(); return { progress: d.progress, frame: d.frame, fps: d.fps, cpuMs: d.cpuMs, calls: d.info.calls, tris: d.info.triangles, pose: d.pose }; });
  const file = path.join(out, `${prefix}-p${p.toFixed(3)}.png`);
  await page.screenshot({ path: file, timeout: 600000 });
  results.push({ p, file, ...dbg });
}
console.log(JSON.stringify({ results, logs: logs.slice(0, 30) }, null, 1));
await browser.close();
