// End-to-end smoke test against a PRODUCTION build (`npm run build` first). Synthetic data only.
// Starts `next start` itself with a loopback lead receiver as LEAD_WEBHOOK_URL, so no external system is contacted.
// Checks: every sitemap route + private/sample/404 routes respond; no page errors or CSP violations; security
// headers; robots default; lead form consent, delivery, attribution and double-click de-duplication; verify states;
// skip link is the first keyboard stop; mobile menu opens at 390 px.
// Playwright is resolved from BSAH_PLAYWRIGHT_MODULE, then from the project, then from a global install.
//   usage: node scripts/e2e-smoke.mjs            (writes output/e2e/results.json and screenshots)
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { mkdir, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
async function loadPlaywright() {
  for (const id of [process.env.BSAH_PLAYWRIGHT_MODULE, "playwright", "/opt/npm-tools/node_modules/playwright"].filter(Boolean)) {
    try { return require(id); } catch {}
  }
  throw new Error("Playwright not found. Set BSAH_PLAYWRIGHT_MODULE to an installed playwright package.");
}
const { chromium } = await loadPlaywright();
const OUT = "output/e2e";
await mkdir(OUT, { recursive: true });
const PORT = Number(process.env.BSAH_E2E_PORT || 3123);
const BASE = `http://127.0.0.1:${PORT}`;

// ---- loopback lead receiver
const leads = [];
const receiver = createServer(async (req, res) => {
  let body = "";
  for await (const c of req) body += c;
  try { leads.push(JSON.parse(body)); } catch { leads.push(body); }
  res.writeHead(200, { "content-type": "application/json" });
  res.end("{}");
});
await new Promise((r) => receiver.listen(0, "127.0.0.1", r));
const hookUrl = `http://127.0.0.1:${receiver.address().port}/lead`;

// ---- production server (refuse to reuse a stale server: its build and in-memory rate limits would skew results)
try { await fetch(`${BASE}/robots.txt`); throw new Error(`port ${PORT} is already in use; stop that server first`); } catch (e) { if (String(e.message).includes("already in use")) throw e; }
const server = spawn("npx", ["next", "start", "-p", String(PORT), "-H", "127.0.0.1"], {
  detached: true, // own process group, so the whole tree (npx → next-server) is stopped at the end
  env: { ...process.env, LEAD_WEBHOOK_URL: hookUrl, SUPABASE_URL: "", SUPABASE_PUBLISHABLE_KEY: "", NEXT_PUBLIC_ALLOW_INDEXING: "", NODE_ENV: "production" },
  stdio: ["ignore", "pipe", "pipe"],
});
let serverLog = "";
server.stdout.on("data", (d) => (serverLog += d));
server.stderr.on("data", (d) => (serverLog += d));
for (let i = 0; i < 120; i++) {
  try { if ((await fetch(`${BASE}/robots.txt`)).ok) break; } catch {}
  await new Promise((r) => setTimeout(r, 500));
}

const results = [];
const record = (name, pass, detail = "") => { results.push({ name, pass, detail }); console.log(`${pass ? "PASS" : "FAIL"}  ${name}${detail ? `  [${detail}]` : ""}`); };
const check = async (name, fn) => { try { const d = await fn(); record(name, true, typeof d === "string" ? d : ""); } catch (e) { record(name, false, e.message.split("\n")[0]); } };

const browser = await chromium.launch();
const newPage = async (viewport = { width: 1440, height: 900 }, reducedMotion = "no-preference") => {
  const context = await browser.newContext({ viewport, reducedMotion });
  await context.addInitScript(() => { try { sessionStorage.setItem("bsah-loaded", "1"); } catch {} });
  // External media/fonts are not needed for these checks and may be unreachable from CI; fail them fast.
  await context.route(/^https?:\/\/(?!127\.0\.0\.1)/, (route) => route.abort());
  const page = await context.newPage();
  const problems = { errors: [], csp: [] };
  page.on("pageerror", (e) => problems.errors.push(e.message));
  page.on("console", (m) => { const t = m.text(); if (/Content Security Policy|Refused to (load|execute|connect|frame|apply)/i.test(t)) problems.csp.push(t.slice(0, 200)); });
  return { page, context, problems };
};

try {
  // ---- headers and robots
  await check("security headers present on /", async () => {
    const h = (await fetch(`${BASE}/`)).headers;
    for (const k of ["content-security-policy", "x-content-type-options", "x-frame-options", "referrer-policy", "permissions-policy", "strict-transport-security"]) assert.ok(h.get(k), `missing ${k}`);
    assert.equal(h.get("x-powered-by"), null);
    assert.match(h.get("content-security-policy"), /frame-ancestors 'none'/);
  });
  await check("robots.txt blocks indexing unless NEXT_PUBLIC_ALLOW_INDEXING=1", async () => {
    assert.match(await (await fetch(`${BASE}/robots.txt`)).text(), /Disallow: \//);
  });

  // ---- route sweep
  const xml = await (await fetch(`${BASE}/sitemap.xml`)).text();
  const routes = [...xml.matchAll(/<loc>https:\/\/blackstallion\.academy([^<]*)<\/loc>/g)].map((m) => m[1] || "/");
  await check(`sitemap lists routes (${routes.length})`, async () => assert.ok(routes.length >= 30));
  const extra = ["/verify/BSAH-2026-HYD-042", "/schools/access", "/admissions", "/pay"];
  const sweep = [];
  for (const path of [...routes, ...extra]) {
    const { page, context, problems } = await newPage();
    let status = 0;
    try {
      const res = await page.goto(BASE + path, { waitUntil: "domcontentloaded", timeout: 45000 });
      status = res?.status() ?? 0;
      await page.waitForTimeout(1200);
    } catch (e) { problems.errors.push(`navigation: ${e.message.split("\n")[0]}`); }
    sweep.push({ path, status, errors: problems.errors, csp: problems.csp });
    await context.close();
  }
  // A 3D model that is simply absent from this checkout (media is not in git) is an environment gap, not a code
  // failure: the scenes now degrade without crashing. Anything else is a failure.
  const { existsSync } = await import("node:fs");
  const missingAsset = (msg) => { const m = /Could not load (\/models\/[^:]+):/.exec(msg); return m && !existsSync(`public${m[1]}`); };
  const envNotes = new Set();
  for (const r of sweep) r.errors = r.errors.filter((e) => (missingAsset(e) ? (envNotes.add(/\/models\/[^:]+/.exec(e)[0]), false) : true));
  if (envNotes.size) record(`environment: ${envNotes.size} 3D model file(s) absent from this checkout (pages degraded without crashing)`, true, [...envNotes].join(", "));
  const bad = sweep.filter((r) => r.status !== 200 || r.errors.length || r.csp.length);
  record(`route sweep: ${sweep.length} routes 200 with no page errors or CSP violations`, bad.length === 0, bad.map((b) => `${b.path} ${b.status} ${[...b.errors, ...b.csp].join(" | ").slice(0, 160)}`).join(" ; "));
  await check("no route fell back to the error boundary", async () => {
    const crashed = [];
    for (const path of routes) {
      const { page, context } = await newPage();
      await page.goto(BASE + path, { waitUntil: "domcontentloaded" });
      for (let i = 0; i < 4; i++) { await page.mouse.wheel(0, 1600); await page.waitForTimeout(400); }
      if (await page.getByText("slipped the gate").count()) crashed.push(path);
      await context.close();
    }
    assert.deepEqual(crashed, []);
  });
  await check("unknown route returns 404 with the 'was cut' page", async () => {
    const { page, context } = await newPage();
    const res = await page.goto(`${BASE}/no-such-reel`, { waitUntil: "domcontentloaded" });
    assert.equal(res.status(), 404);
    assert.ok(await page.getByText("was cut.").first().isVisible());
    await context.close();
  });

  // ---- lead form on the MOU generator: consent required, delivered once, attribution recorded
  await check("MOU form: refused without consent, nothing delivered", async () => {
    const { page, context } = await newPage();
    await page.goto(`${BASE}/schools/mou?utm_source=qa_flyer&utm_medium=qr`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1500);
    await page.fill("#mou-school", "Synthetic QA School");
    await page.fill("#mou-trustee", "QA Trustee");
    await page.fill("#mou-email", "qa@example.test");
    const before = leads.length;
    await page.getByRole("button", { name: /Send to the BSAH board office/i }).click();
    await page.waitForTimeout(1500);
    const consentBox = page.locator('input[name="consent"]');
    const invalidNative = await consentBox.evaluate((el) => !el.checkValidity());
    assert.ok(invalidNative || (await page.getByText(/confirm consent/i).count()) > 0, "consent not enforced");
    assert.equal(leads.length, before);
    await context.close();
  });
  await check("MOU form: consented submission delivered exactly once (double click) with attribution", async () => {
    const { page, context } = await newPage();
    await page.goto(`${BASE}/schools/mou?utm_source=qa_flyer&utm_medium=qr`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1500);
    await page.fill("#mou-school", "Synthetic QA School");
    await page.fill("#mou-trustee", "QA Trustee");
    await page.fill("#mou-email", "qa@example.test");
    await page.check('input[name="consent"]');
    const before = leads.length;
    const button = page.getByRole("button", { name: /Send to the BSAH board office/i });
    await button.dblclick();
    await page.getByText(/Received|Already received/).first().waitFor({ timeout: 15000 });
    await page.waitForTimeout(1000);
    const delivered = leads.slice(before);
    assert.equal(delivered.length, 1, `delivered ${delivered.length}`);
    assert.equal(delivered[0].consent, true);
    assert.equal(delivered[0].attribution.utm_source, "qa_flyer");
    assert.equal(delivered[0].attribution.path, "/schools/mou");
    assert.match(delivered[0].idempotencyKey, /^[a-f0-9]{36}$/);
    await page.screenshot({ path: `${OUT}/mou-sent-1440.png` });
    await context.close();
    return `1 delivery, idem ${delivered[0].idempotencyKey.slice(0, 8)}…`;
  });

  // ---- verify
  await check("verify: sample code shows the labelled sample record", async () => {
    const { page, context } = await newPage();
    await page.goto(`${BASE}/verify`, { waitUntil: "domcontentloaded" });
    const input = page.getByLabel("Passport code").first();
    await input.fill("BSAH-2026-HYD-042");
    await page.getByRole("button", { name: /^Verify$/ }).first().click();
    await page.getByText(/Sample record · demo data/).first().waitFor({ timeout: 15000 });
    await context.close();
  });
  await check("verify: unknown code says the registry is not connected (no invented record)", async () => {
    const { page, context } = await newPage();
    await page.goto(`${BASE}/verify`, { waitUntil: "domcontentloaded" });
    await page.getByLabel("Passport code").first().fill("BP-0123456789ABCDEF");
    await page.getByRole("button", { name: /^Verify$/ }).first().click();
    await page.getByText(/live registry is not connected yet/).first().waitFor({ timeout: 15000 });
    await context.close();
  });

  // ---- homepage film frame: the film's own ratio at every width, controls attached under the frame
  await check("hero film: scope ratio frame (no black bars) with attached controls at 360/390/430/1440", async () => {
    const out = [];
    for (const [w, h] of [[360, 740], [390, 844], [430, 932], [1440, 900]]) {
      const { page, context } = await newPage({ width: w, height: h });
      await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(800);
      const m = await page.evaluate(() => {
        const frame = document.querySelector("#top > div");
        const bar = frame?.nextElementSibling;
        const f = frame.getBoundingClientRect(), b = bar.getBoundingClientRect();
        return { fw: f.width, fh: f.height, ftop: f.top, fbottom: f.bottom, btop: b.top, vw: window.innerWidth };
      });
      assert.ok(Math.abs(m.fw - m.vw) <= 1, `${w}: frame spans the viewport`);
      assert.ok(Math.abs(m.fh - (m.fw * 518) / 1284) <= 2, `${w}: frame ratio ${m.fw}x${m.fh}`);
      assert.ok(Math.abs(m.btop - m.fbottom) <= 1, `${w}: control bar attached to the frame`);
      assert.ok(m.ftop >= 63, `${w}: frame starts below the fixed navigation`);
      out.push(`${w}:${Math.round(m.fh)}px`);
      await context.close();
    }
    return out.join(" ");
  });

  await check("doctrine: one statement in the editorial serif, two non-overlapping sentences", async () => {
    const { page, context } = await newPage({ width: 390, height: 844 });
    await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
    await page.locator("h1.doctrine-statement").scrollIntoViewIfNeeded();
    await page.waitForTimeout(1800);
    const r = await page.evaluate(() => {
      const h1 = document.querySelector("h1.doctrine-statement");
      const lines = [...h1.querySelectorAll(":scope > span > span")].map((n) => n.getBoundingClientRect());
      return { text: h1.textContent.replace(/\s+/g, " ").trim(), family: getComputedStyle(h1).fontFamily, a: lines[0], b: lines[1], overflow: document.documentElement.scrollWidth - innerWidth };
    });
    assert.equal(r.text, "We do not teach children to ride. We forge them to lead.");
    assert.match(r.family, /serifDisplay|Serif_Display|serif_display|Noto/i);
    assert.ok(r.b.top >= r.a.bottom - 2, "sentences do not collide");
    assert.ok(r.overflow <= 1);
  });

  await check("navigation: letter-roll animation on reel titles (hover)", async () => {
    const { page, context } = await newPage();
    await page.goto(`${BASE}/parents`, { waitUntil: "domcontentloaded" });
    await page.getByRole("button", { name: /Reels/ }).click();
    const link = page.getByRole("dialog").getByRole("link", { name: "The Marwari" });
    await link.hover();
    await page.waitForTimeout(900);
    const rolled = await link.evaluate((el) => {
      const rows = el.querySelectorAll("span[aria-hidden] > span");
      const last = rows[rows.length - 1];
      return getComputedStyle(last).transform;
    });
    assert.ok(rolled === "none" || /matrix\(1, 0, 0, 1, 0, 0\)/.test(rolled), `second row in place after hover: ${rolled}`);
    assert.equal(await link.getAttribute("href"), "/legend");
    await context.close();
  });

  await check("moodboard: house palette section with five stills and five swatches", async () => {
    const { page, context } = await newPage();
    await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
    const section = page.locator("section[aria-labelledby='atelier-h']");
    await section.scrollIntoViewIfNeeded();
    assert.equal(await section.locator("figure .relative.w-full").count(), 5);
    assert.equal(await section.getByRole("list", { name: "House colours" }).locator("li").count(), 5);
    await context.close();
  });

  await check("MOU: Download PDF returns a real PDF built from the draft", async () => {
    const { page, context } = await newPage();
    await page.goto(`${BASE}/schools/mou`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1200);
    await page.fill("#mou-school", "Synthetic QA School");
    await page.fill("#mou-trustee", "QA Trustee");
    const [download] = await Promise.all([page.waitForEvent("download", { timeout: 20000 }), page.getByRole("button", { name: "Download PDF" }).click()]);
    const path = await download.path();
    const { readFile } = await import("node:fs/promises");
    const bytes = await readFile(path);
    assert.equal(bytes.subarray(0, 5).toString(), "%PDF-");
    assert.match(download.suggestedFilename(), /^bsah-mou-draft-synthetic-qa-school\.pdf$/);
    await context.close();
    return `${bytes.length} bytes`;
  });

  await check("staff console: signed-out visitors are redirected to login; login is noindex", async () => {
    const res = await fetch(`${BASE}/admin`, { redirect: "manual" });
    assert.equal(res.status, 307);
    assert.match(res.headers.get("location"), /\/admin\/login/);
    const login = await fetch(`${BASE}/admin/login`);
    assert.equal(login.status, 200);
    assert.equal(login.headers.get("x-robots-tag"), "noindex, nofollow");
    const { page, context } = await newPage({ width: 390, height: 844 });
    await page.goto(`${BASE}/admin/login?e=unconfigured`, { waitUntil: "domcontentloaded" });
    await page.getByRole("heading", { name: "Sign in" }).waitFor();
    await page.getByText(/not configured on this deployment/).waitFor();
    await page.screenshot({ path: `${OUT}/admin-login-390.png` });
    await context.close();
  });

  // ---- keyboard and mobile
  await check("keyboard: first Tab stop is the skip link", async () => {
    const { page, context } = await newPage();
    await page.goto(`${BASE}/parents`, { waitUntil: "domcontentloaded" });
    await page.keyboard.press("Tab");
    assert.match(await page.evaluate(() => document.activeElement?.textContent ?? ""), /Skip to content/);
    await context.close();
  });
  await check("mobile 390: home and parents render without horizontal overflow; screenshots saved", async () => {
    const { page, context } = await newPage({ width: 390, height: 844 }, "reduce");
    for (const path of ["/", "/parents", "/schools/mou", "/verify"]) {
      await page.goto(BASE + path, { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(800);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      assert.ok(overflow <= 1, `${path} overflows by ${overflow}px`);
      await page.screenshot({ path: `${OUT}/${path === "/" ? "home" : path.slice(1).replace(/\//g, "-")}-390.png` });
    }
    await context.close();
  });
} finally {
  await browser.close();
  try { process.kill(-server.pid, "SIGTERM"); } catch { server.kill("SIGTERM"); }
  receiver.close();
  const failed = results.filter((r) => !r.pass).length;
  await writeFile(`${OUT}/results.json`, JSON.stringify({ when: new Date().toISOString(), base: BASE, passed: results.length - failed, failed, results, syntheticLeadsReceived: leads.length, limits: ["Chromium emulation on a Linux build machine", "Loopback webhook only; database persistence not exercised", "Remote CDN media may be unreachable from CI; CSP violations are still detected"] }, null, 2));
  console.log(`---- ${results.length - failed} passed, ${failed} failed`);
  if (failed) { console.log(serverLog.slice(-2000)); process.exitCode = 1; }
}
