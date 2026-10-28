// Which stills, 3D models, videos and audio files does each page ask for, and from where? Crawls every route of a PRODUCTION
// build (`npm run build` first) in a real browser at 1440 and 390 px, scrolls each page to the bottom, and records every media
// request with its answer. Proves that switching NEXT_PUBLIC_MEDIA_BASE_URL on moves the files and changes nothing else.
//
//   node scripts/e2e-media.mjs --label baseline
//        build made WITHOUT NEXT_PUBLIC_MEDIA_BASE_URL: media comes from this site's own public/ folder
//   node scripts/e2e-media.mjs --label remote --media-base http://127.0.0.1:4010/storage/v1/object/public/website-media
//        build made WITH the same value (and BSAH_ALLOW_LOCAL_IMAGE_HOST=1 for a loopback stand-in): media must come
//        from that address and never from this site
//   node scripts/e2e-media.mjs --compare
//        reads output/media-proof/baseline.json and remote.json: both runs must ask for the same files, every file must be
//        in scripts/media-manifest.json, and nothing may answer with an error
//
// Options: --port 3124  --only /,/cadets  --parallel 2
//          --shots (reduced motion; a screenshot of the first screen of each page in output/media-proof/<label>/, results in <label>-shots.json)
//          --slow (half a screen per step, longer pauses: for repeating page views whose lazy loads depend on scroll timing)
//          --update (with --only: keep the earlier results of the other pages and replace just these page views)
//          --mobile-all (phone width on every route; by default only the MOBILE_ROUTES below, because a crawl at both widths
//          of all ~40 routes takes about half an hour on a two-core machine; --only also turns it on for the routes it names)
// Results go to output/media-proof/. Synthetic: no real lead, payment or account is touched. Playwright is resolved like
// scripts/e2e-smoke.mjs does (BSAH_PLAYWRIGHT_MODULE, then the project, then a global install).
import { spawn } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";

const require = createRequire(import.meta.url);
const OUT = "output/media-proof";
const PREFIXES = ["/images/", "/media/", "/models/", "/video/", "/audio/"];
const VIEWPORTS = [{ name: "1440", width: 1440, height: 900 }, { name: "390", width: 390, height: 844 }];
// Phone width changes which file a page asks for (smaller crops, no hover-only media), so the routes that carry the most media are
// checked at both widths. Every route is always checked at 1440.
const MOBILE_ROUTES = new Set([
  "/", "/legend", "/lore", "/anatomy", "/statue", "/science", "/why", "/curriculum", "/fleet", "/cadets", "/safety",
  "/schools", "/tournaments", "/command", "/journal",
]);

const args = process.argv.slice(2);
const flag = (name) => args.includes(name);
const value = (name, fallback = "") => (args.includes(name) ? args[args.indexOf(name) + 1] : fallback);

// ----------------------------------------------------------------------------------------------------------------- compare

if (flag("--compare")) {
  const read = (label) => JSON.parse(readFileSync(path.join(OUT, `${label}.json`), "utf8"));
  const base = read("baseline");
  const remote = read("remote");
  const listed = JSON.parse(readFileSync("scripts/media-manifest.json", "utf8")).files;
  const manifest = new Set(listed.map((f) => f.path));
  const bytesOf = new Map(listed.map((f) => [f.path, f.bytes]));
  const key = (r) => `${r.path} @${r.viewport}`;
  const remoteBy = new Map(remote.pages.map((r) => [key(r), r]));
  const lines = [];
  let failures = 0;
  const all = new Set();
  let brokenBefore = new Set();
  for (const page of base.pages) {
    const other = remoteBy.get(key(page));
    if (!other) { lines.push(`MISSING in remote run: ${key(page)}`); failures++; continue; }
    const a = new Set(page.media.filter((m) => m.status < 400).map((m) => m.file));
    const b = new Set(other.media.filter((m) => m.status < 400).map((m) => m.file));
    for (const m of page.media) { if (m.status >= 400) brokenBefore.add(`${m.file} (${m.status})`); else all.add(m.file); }
    for (const m of other.media) if (m.status < 400) all.add(m.file);
    const onlyBase = [...a].filter((f) => !b.has(f));
    const onlyRemote = [...b].filter((f) => !a.has(f));
    if (onlyBase.length || onlyRemote.length) lines.push(`${key(page)}: only before ${JSON.stringify(onlyBase)}, only after ${JSON.stringify(onlyRemote)}`);
  }
  const notListed = [...all].filter((f) => !manifest.has(f));
  console.log(`Pages compared: ${base.pages.length}. Distinct media files requested: ${all.size}.`);
  console.log(`Requests that already failed before the switch (not caused by it): ${brokenBefore.size ? [...brokenBefore].join(", ") : "none"}`);
  console.log(notListed.length ? `NOT IN THE LIST (would fail from the bucket): ${notListed.join(", ")}` : "Every requested file is in scripts/media-manifest.json.");
  if (notListed.length) failures++;
  // What a visit can download at most: the listed sizes of the distinct files the page asked for. An upper bound, because a browser
  // reads only the first part of a video it does not play to the end.
  const weights = base.pages.map((page) => {
    const files = new Set(page.media.filter((m) => m.status < 400).map((m) => m.file));
    return { key: key(page), files: files.size, bytes: [...files].reduce((sum, f) => sum + (bytesOf.get(f) ?? 0), 0) };
  }).sort((a, b) => b.bytes - a.bytes);
  const mbOf = (bytes) => `${(bytes / 1048576).toFixed(1)} MB`;
  const sorted = [...weights].sort((a, b) => a.bytes - b.bytes);
  const half = sorted.length / 2;
  const medianBytes = sorted.length % 2 ? sorted[Math.floor(half)].bytes : (sorted[half - 1].bytes + sorted[half].bytes) / 2;
  const under = (mb) => weights.filter((w) => w.bytes < mb * 1048576).length;
  console.log(`Media per page view, at most (listed sizes of the distinct files asked for): lightest ${sorted[0].key} ${mbOf(sorted[0].bytes)}, median ${mbOf(medianBytes)}, heaviest ${weights[0].key} ${mbOf(weights[0].bytes)}.`);
  console.log(`   Under 5 MB: ${under(5)} of ${weights.length} page views; under 10 MB: ${under(10)}; under 15 MB: ${under(15)}.`);
  for (const w of weights.slice(0, 8)) console.log(`   ${w.key}: ${mbOf(w.bytes)} in ${w.files} files`);
  const askedBytes = [...all].reduce((sum, f) => sum + (bytesOf.get(f) ?? 0), 0);
  const listedBytes = listed.reduce((sum, f) => sum + f.bytes, 0);
  console.log(`The ${all.size} distinct files asked for add up to ${mbOf(askedBytes)} of the ${listed.length} listed files (${mbOf(listedBytes)}).`);
  const unrequested = [...manifest].filter((f) => !all.has(f));
  console.log(`Listed files no page asked for in this crawl (scene-only or interaction-only files can be among them): ${unrequested.length}`);
  for (const f of unrequested) console.log(`   ${f}`);
  console.log(lines.length ? `Differences between the two runs (timing can cause a few):\n  ${lines.join("\n  ")}` : "Both runs asked for exactly the same files on every page.");
  console.log(`Remote run problems: ${remote.problems.length}`);
  for (const p of remote.problems.slice(0, 40)) console.log(`   ${p}`);
  if (remote.problems.length) failures++;
  process.exit(failures ? 1 : 0);
}

// -------------------------------------------------------------------------------------------------------------- the crawl

async function loadPlaywright() {
  for (const id of [process.env.BSAH_PLAYWRIGHT_MODULE, "playwright", "/opt/npm-tools/node_modules/playwright"].filter(Boolean)) {
    try { return require(id); } catch { /* try the next place */ }
  }
  throw new Error("Playwright not found. Set BSAH_PLAYWRIGHT_MODULE to an installed playwright package.");
}

const label = value("--label");
if (!["baseline", "remote"].includes(label)) throw new Error("Use --label baseline or --label remote (or --compare).");
const mediaBase = label === "remote" ? value("--media-base").replace(/\/+$/, "") : "";
if (label === "remote" && !mediaBase) throw new Error("--label remote needs --media-base <the address the build was made with>.");
const PORT = Number(value("--port", "3124"));
const SITE = `http://127.0.0.1:${PORT}`;
await mkdir(path.join(OUT, label), { recursive: true });
const { chromium } = await loadPlaywright();

try { await fetch(`${SITE}/robots.txt`); throw new Error(`port ${PORT} is already in use; stop that server first`); } catch (error) { if (String(error.message).includes("already in use")) throw error; }
const server = spawn("npx", ["next", "start", "-p", String(PORT), "-H", "127.0.0.1"], {
  detached: true,
  env: {
    ...process.env, SUPABASE_URL: "", SUPABASE_PUBLISHABLE_KEY: "", LEAD_WEBHOOK_URL: "", NEXT_PUBLIC_ALLOW_INDEXING: "", NODE_ENV: "production",
    NEXT_PUBLIC_MEDIA_BASE_URL: mediaBase,
    ...(mediaBase && /^http:\/\/(127\.0\.0\.1|localhost)[:/]/.test(mediaBase) ? { BSAH_ALLOW_LOCAL_IMAGE_HOST: "1" } : {}),
  },
  stdio: ["ignore", "pipe", "pipe"],
});
let serverLog = "";
server.stdout.on("data", (d) => { serverLog += d; });
server.stderr.on("data", (d) => { serverLog += d; });
const stopServer = () => { try { process.kill(-server.pid, "SIGTERM"); } catch { /* already gone */ } };
process.on("exit", stopServer);
for (let i = 0; i < 120; i++) {
  try { if ((await fetch(`${SITE}/robots.txt`)).ok) break; } catch { /* not up yet */ }
  await new Promise((resolve) => setTimeout(resolve, 500));
}

/** Where a request goes: this site, or the media address; null for anything that is not a media file. */
function classify(rawUrl) {
  let u;
  try { u = new URL(rawUrl); } catch { return null; }
  if (u.origin === SITE && u.pathname === "/_next/image") {
    const inner = u.searchParams.get("url");
    const found = inner ? classify(new URL(inner, SITE).href) : null;
    return found ? { ...found, via: "optimizer" } : null;
  }
  if (u.origin === SITE && PREFIXES.some((p) => u.pathname.startsWith(p))) return { where: "site", file: decodeURIComponent(u.pathname.slice(1)) };
  if (mediaBase && `${u.origin}${u.pathname}`.startsWith(`${mediaBase}/`)) return { where: "bucket", file: decodeURIComponent(`${u.origin}${u.pathname}`.slice(mediaBase.length + 1)) };
  return null;
}

const browser = await chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist", "--autoplay-policy=no-user-gesture-required"] });

async function visit(route, viewport) {
  const reduced = flag("--shots");
  const context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height }, reducedMotion: reduced ? "reduce" : "no-preference" });
  await context.addInitScript(() => { try { sessionStorage.setItem("bsah-loaded", "1"); } catch { /* storage unavailable */ } });
  // Everything outside this computer (the provider's CDN, analytics) is refused, as in scripts/e2e-smoke.mjs.
  await context.route(/^https?:\/\/(?!127\.0\.0\.1)/, (r) => r.abort());
  const page = await context.newPage();
  const requests = new Map();
  const problems = [];
  page.on("response", (res) => {
    const found = classify(res.url());
    if (found) requests.set(res.url(), { ...found, status: res.status(), type: res.headers()["content-type"] || "" });
  });
  page.on("request", (req) => {
    const found = classify(req.url());
    if (found && !requests.has(req.url())) requests.set(req.url(), { ...found, status: 0, type: "" });
  });
  page.on("requestfailed", (req) => {
    const found = classify(req.url());
    const why = req.failure()?.errorText || "failed";
    // A video the browser stops reading once it has what it needs is reported as aborted; that is not a failure.
    if (found && !/ERR_ABORTED/.test(why)) problems.push(`${route} @${viewport.name}: request failed (${why}): ${req.url().slice(0, 140)}`);
  });
  page.on("pageerror", (error) => problems.push(`${route} @${viewport.name}: page error: ${error.message.split("\n")[0].slice(0, 200)}`));
  page.on("console", (message) => {
    const text = message.text();
    if (/Content Security Policy|Refused to (load|execute|connect|frame|apply)|Access-Control|CORS|blocked by CORS|cross-origin/i.test(text)) problems.push(`${route} @${viewport.name}: console: ${text.slice(0, 220)}`);
  });
  let status = 0;
  try {
    const res = await page.goto(SITE + route, { waitUntil: "domcontentloaded", timeout: 60000 });
    status = res?.status() ?? 0;
    await page.waitForTimeout(1500);
    // A page keeps growing while it hydrates and streams its last sections (and a busy machine does that slowly), so measure again
    // until the height has held still for two checks. Measuring once could stop the scroll after the first screen.
    const heightNow = () => page.evaluate(() => document.documentElement.scrollHeight);
    let height = await heightNow();
    for (let i = 0, still = 0; i < 12 && still < 2; i++) {
      await page.waitForTimeout(350);
      const grown = await heightNow();
      still = grown === height ? still + 1 : 0;
      height = grown;
    }
    const slow = flag("--slow"); // half a screen at a time and longer pauses, for lazy loads that a fast scroll can skip
    const step = Math.round(viewport.height * (slow ? 0.5 : 0.9));
    for (let y = step; y < Math.min(await heightNow(), 60000); y += step) {
      await page.evaluate((to) => window.scrollTo(0, to), y);
      await page.waitForTimeout(slow ? 450 : 160);
    }
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight)); // the footer and its video
    await page.waitForTimeout(slow ? 1800 : 1100);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(900);
    if (flag("--shots")) {
      // The navigation slides back in over 0.6 s once the page is at the top; on a busy machine that takes much longer, and a screenshot
      // taken before it has settled would differ for a reason that has nothing to do with media.
      await page.waitForFunction(() => { const bar = document.querySelector("header.fixed"); return !bar || Math.abs(new DOMMatrixReadOnly(getComputedStyle(bar).transform).m42) < 1; }, null, { timeout: 20000 }).catch(() => {});
      await page.waitForTimeout(400);
    }
    if (flag("--shots")) await page.screenshot({ path: path.join(OUT, label, `${route === "/" ? "home" : route.slice(1).replace(/\//g, "_")}-${viewport.name}.png`), timeout: 120000 }); // a busy machine can need longer than the default 30 s
  } catch (error) {
    problems.push(`${route} @${viewport.name}: navigation: ${error.message.split("\n")[0]}`);
  }
  await context.close();
  const media = [...requests.values()].map(({ where, file, status: s, type, via }) => ({ where, file, status: s, type, via })).sort((a, b) => a.file.localeCompare(b.file));
  if (status !== 200) problems.push(`${route} @${viewport.name}: page answered ${status}`);
  for (const m of media) {
    if (m.status >= 400) problems.push(`${route} @${viewport.name}: ${m.where} answered ${m.status} for ${m.file}${m.via ? " (through the image optimizer)" : ""}`);
    if (label === "remote" && m.where === "site") problems.push(`${route} @${viewport.name}: still loaded from the site: ${m.file}`);
  }
  return { path: route, viewport: viewport.name, status, media, problems };
}

try {
  const xml = await (await fetch(`${SITE}/sitemap.xml`)).text();
  let routes = [...xml.matchAll(/<loc>https:\/\/blackstallion\.academy([^<]*)<\/loc>/g)].map((m) => m[1] || "/");
  routes = [...new Set([...routes, "/verify/BSAH-2026-HYD-042", "/schools/access", "/admissions", "/pay"])];
  const only = value("--only");
  if (only) routes = routes.filter((r) => only.split(",").includes(r));
  const phoneToo = (route) => flag("--mobile-all") || Boolean(only) || MOBILE_ROUTES.has(route);
  const jobs = routes.flatMap((route) => VIEWPORTS.filter((viewport) => viewport.name === "1440" || phoneToo(route)).map((viewport) => ({ route, viewport })));
  if (!jobs.length) throw new Error("No route to visit: check --only.");
  console.log(`${label}: ${jobs.length} page views (${routes.length} routes), ${Number(value("--parallel", "2"))} at a time.`);
  const pages = [];
  let next = 0;
  const worker = async () => {
    for (;;) {
      const i = next++;
      if (i >= jobs.length) return;
      const result = await visit(jobs[i].route, jobs[i].viewport);
      pages.push(result);
      console.log(`${result.problems.length ? "PROBLEM" : "ok     "} ${result.path} @${result.viewport}: ${result.media.length} media requests (${new Set(result.media.map((m) => m.where)).size ? [...new Set(result.media.map((m) => m.where))].join("+") : "none"})`);
    }
  };
  await Promise.all(Array.from({ length: Number(value("--parallel", "2")) }, worker));
  // --update keeps the earlier results of the pages that were not visited this time and replaces the ones that were, so a few
  // page views can be repeated (for example with --only /,/legend) without throwing the rest of the crawl away.
  const resultFile = path.join(OUT, `${label}${flag("--shots") ? "-shots" : ""}.json`); // a screenshot run never overwrites the full crawl
  if (flag("--update") && existsSync(resultFile)) {
    const earlier = JSON.parse(readFileSync(resultFile, "utf8"));
    const again = new Set(pages.map((p) => `${p.path} @${p.viewport}`));
    pages.push(...earlier.pages.filter((p) => !again.has(`${p.path} @${p.viewport}`)));
  }
  pages.sort((a, b) => a.path.localeCompare(b.path) || a.viewport.localeCompare(b.viewport));
  const problems = pages.flatMap((p) => p.problems);
  await writeFile(resultFile, `${JSON.stringify({ label, mediaBase, site: SITE, when: new Date().toISOString(), pages, problems }, null, 2)}\n`);
  const distinct = new Set(pages.flatMap((p) => p.media.map((m) => m.file)));
  console.log(`\n${label}: ${pages.length} page views, ${distinct.size} distinct media files, ${problems.length} problem(s).`);
  for (const p of problems.slice(0, 60)) console.log(`  - ${p}`);
  if (!existsSync(".next")) console.log("(no .next folder: run npm run build first)");
  process.exitCode = problems.length ? 1 : 0;
} finally {
  await browser.close();
  stopServer();
  if (process.exitCode) await writeFile(path.join(OUT, `${label}-server.log`), serverLog);
}
