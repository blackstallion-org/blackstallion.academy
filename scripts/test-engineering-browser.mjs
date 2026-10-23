import assert from "node:assert/strict";
import { createServer } from "node:http";
import { createHash, randomBytes } from "node:crypto";
import { spawn, execFile } from "node:child_process";
import { promisify } from "node:util";
import { createWriteStream } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";

const { chromium } = await import(process.env.BSAH_PLAYWRIGHT_MODULE || "playwright");
const output = "output/engineering/browser";
await mkdir(output, { recursive: true });
const results = [], pageErrors = [], expectedPageErrors = [], deliveries = [];
const mode = process.env.BSAH_CHECK || "all";
const selected = (group) => mode === "all" || mode === group;
const receiver = createServer(async (request, response) => {
  let body = ""; for await (const part of request) body += part;
  deliveries.push(JSON.parse(body));
  await new Promise((resolve) => setTimeout(resolve, 300));
  response.writeHead(200, { "content-type": "application/json" }); response.end('{"received":true}');
});
await new Promise((resolve) => receiver.listen(0, "127.0.0.1", resolve));
const port = Number(process.env.BSAH_TEST_PORT || 3104), base = `http://localhost:${port}`;
const code = randomBytes(24).toString("hex");
const server = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "-p", String(port)], { env: { ...process.env, SUPABASE_URL: "", SUPABASE_PUBLISHABLE_KEY: "", LEAD_WEBHOOK_SECRET: "", LEAD_WEBHOOK_URL: `http://127.0.0.1:${receiver.address().port}`, TRUSTEE_SESSION_SECRET: randomBytes(48).toString("hex"), TRUSTEE_INVITATIONS_JSON: JSON.stringify([{ id: "synthetic-qa", institution: "Synthetic QA Institution", codeHash: createHash("sha256").update(code).digest("hex"), expiresAt: new Date(Date.now() + 3600000).toISOString() }]) }, stdio: ["ignore", "pipe", "pipe"] });
const serverLog = createWriteStream(`${output}/server-${mode}.log`); server.stdout.pipe(serverLog); server.stderr.pipe(serverLog);
for (let attempt = 0; attempt < 100; attempt++) { try { const response = await fetch(base); if (response.ok) break; } catch {} await new Promise((resolve) => setTimeout(resolve, 200)); }
const browser = await chromium.launch({ channel: "chrome", headless: true });
async function page(options = {}) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, ...options });
  const p = await context.newPage(); p.setDefaultTimeout(15000);
  p.on("pageerror", (error) => pageErrors.push({ url: p.url(), message: error.message }));
  return p;
}
async function test(name, run) {
  try { const evidence = await run(); results.push({ name, status: "pass", evidence }); console.log(`PASS ${name}`); }
  catch (error) { results.push({ name, status: "fail", error: String(error) }); console.log(`FAIL ${name}: ${String(error).slice(0, 500)}`); }
}
const open = (p, route) => p.goto(`${base}${route}${route.includes("?") ? "&" : "?"}noload`, { waitUntil: "load", timeout: 45000 });
const fit = async (p) => { const value = await p.evaluate(() => ({ width: innerWidth, scrollWidth: document.documentElement.scrollWidth })); assert.ok(value.scrollWidth <= value.width + 1, JSON.stringify(value)); return value; };
const snap = (p, name) => p.screenshot({ path: `${output}/${name}.png` });
async function touchSwipe(p, x, y, dx, dy) {
  const session = await p.context().newCDPSession(p);
  await session.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x, y }] });
  for (let index = 1; index <= 8; index++) { await session.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: x + dx * index / 8, y: y + dy * index / 8 }] }); await p.waitForTimeout(20); }
  await session.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] }); await session.detach(); await p.waitForTimeout(300);
}

try {
  if (selected("interactions")) {
    await test("pixel prototype: silhouette, independent joints, periodic loop and render cost", async () => {
      const p = await page(); await p.goto(`${base}/prototypes/pixel-horse.html?phase=0`);
      const evidence = await p.evaluate(() => {
        const canvas = document.querySelector("canvas"), horse = new window.PixelHorseAnimation({ canvas, cycleDuration: 510 });
        const fingerprint = (phase) => { horse.gridState.fill(0); horse.cellLum.fill(0); horse.renderFrame(phase, 0, 1000); return Array.from(horse.gridState).join(""); };
        const a = fingerprint(0), b = fingerprint(1); const poses = [0.05, 0.25, 0.45, 0.65, 0.85].map((phase) => horse.computePose(phase, 0));
        const start = performance.now(); for (let index = 0; index < 120; index++) horse.renderFrame(index / 120, 0, 1000);
        const millisecondsPerFrame = (performance.now() - start) / 120;
        const value = { periodic: a === b, litCells: [...a].filter((cell) => cell === "1").length, independentFore: poses.some((pose) => pose.nfForearm !== pose.ffForearm), independentHind: poses.some((pose) => pose.nhGaskin !== pose.fhGaskin), movingTorso: new Set(poses.map((pose) => pose.torsoDy)).size, movingNeck: new Set(poses.map((pose) => pose.neckAngleDeg)).size, movingTail: new Set(poses.map((pose) => pose.tailWhip)).size, millisecondsPerFrame };
        horse.destroy(); return value;
      });
      assert.ok(evidence.periodic && evidence.litCells > 300 && evidence.independentFore && evidence.independentHind); assert.ok(evidence.movingTorso > 1 && evidence.movingTail > 1 && evidence.movingNeck > 1);
      await snap(p, "pixel-prototype-reviewed"); await p.context().close(); return evidence;
    });
    await test("initial loader and route handoff exit; interrupted navigation deadline", async () => {
      const p = await page({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
      await p.goto(base, { waitUntil: "domcontentloaded" });
      await p.locator(".bsah-loader").waitFor({ state: "hidden", timeout: 8000 });
      await open(p, "/anatomy");
      await p.locator('a[href="/legend"]:visible').first().click(); await p.waitForURL("**/legend");
      await p.locator(".bsah-loader").waitFor({ state: "hidden", timeout: 8000 });
      assert.ok(await p.locator(".bsah-loader").count() <= 1);
      await p.evaluate(() => document.addEventListener("click", (event) => event.preventDefault(), { once: true }));
      await p.locator('a[href="/curriculum"]:visible').first().click();
      await p.locator(".bsah-loader").waitFor({ state: "hidden", timeout: 8500 });
      await snap(p, "loader-navigation-released"); await p.context().close(); return { initialExit: true, routeExit: true, cancelledClickExit: true };
    });
    for (const width of [390, 1440]) await test(`hero ${width}: selected media, controls, progress and skip`, async () => {
      const p = await page({ viewport: { width, height: 900 }, isMobile: width < 768, hasTouch: width < 768 }); await open(p, "/");
      const video = p.locator('#top video'); await p.waitForFunction(() => document.querySelector('#top video')?.readyState >= 2, { timeout: 30000 });
      const src = await video.evaluate((element) => element.currentSrc); assert.ok(src.includes(width < 768 ? "hero-main-mobile.mp4" : "hero-main-desktop.mp4"));
      await p.getByRole("button", { name: "Pause video", exact: true }).click(); assert.ok(await video.evaluate((element) => element.paused));
      await p.getByRole("button", { name: "Sound OFF — Unmute video sound", exact: true }).click(); assert.equal(await video.evaluate((element) => element.muted), false);
      await p.getByRole("button", { name: "Play video", exact: true }).click(); await p.waitForTimeout(400); assert.equal(await video.evaluate((element) => element.paused), false);
      const progress = await p.locator('#top > div[aria-hidden="true"] span').last().getAttribute("style"); assert.ok(progress?.includes("scaleX"));
      await snap(p, `hero-${width}`); await p.getByRole("button", { name: "Skip Intro", exact: true }).click(); await p.waitForTimeout(250);
      const top = await p.locator("#doctrine").evaluate((element) => element.getBoundingClientRect().top); assert.ok(Math.abs(top) < 120, `doctrine top ${top}`); assert.ok(await video.evaluate((element) => element.paused));
      await fit(p); await p.context().close(); return { selectedSource: src.split("/").at(-1), skipTargetTop: top, controls: true, progress };
    });
    await test("hero failures and autoplay rejection retain useful poster", async () => {
      const p = await page({ viewport: { width: 390, height: 844 } }); await p.route("**/video/hero-main-*.mp4", (route) => route.abort()); await open(p, "/");
      await p.getByText("The film is unavailable.", { exact: false }).waitFor(); assert.equal(await p.locator('#top picture img').evaluate((element) => element.complete && element.naturalWidth > 0), true); await snap(p, "hero-failure-poster"); await p.context().close();
      const blocked = await page(); await blocked.addInitScript(() => { HTMLMediaElement.prototype.play = () => Promise.reject(new DOMException("Synthetic autoplay block", "NotAllowedError")); }); await open(blocked, "/"); await blocked.getByText("Press play to watch the opening film.").waitFor(); await blocked.context().close(); return { failedPoster: true, blockedPoster: true };
    });
    await test("Academy mobile pagination and horizontal swipe", async () => {
      const p = await page({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, reducedMotion: "reduce" }); await open(p, "/");
      const figures = p.getByRole("group", { name: "Choose an academy figure" }); await figures.scrollIntoViewIfNeeded(); await figures.getByRole("button").nth(2).click();
      await p.waitForTimeout(300); assert.equal(await figures.getByRole("button").nth(2).getAttribute("aria-pressed"), "true");
      const box = await p.locator('[aria-roledescription="carousel"] dl').boundingBox(); await touchSwipe(p, box.x + box.width * 0.2, box.y + 50, box.width * 0.65, 0); assert.ok(await p.locator('[aria-roledescription="carousel"] dl').evaluate((element) => element.scrollLeft) < 500);
      await snap(p, "academy-mobile"); await fit(p); await p.context().close(); return { pagination: true, touchSwipe: true };
    });
    await test("Somatic six nodes and Matrix tabs, modal focus and reduced motion", async () => {
      const p = await page({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce" }); await open(p, "/");
      const map = p.getByRole("group", { name: "Interactive rider and horse pathways" });
      for (const label of ["Cervical alignment", "Ears & attention", "Core posture", "Withers & seat", "Lumbar balance", "Reins & contact"]) { const node = map.getByRole("button", { name: label, exact: true }); await node.focus(); await p.keyboard.press("Enter"); assert.equal(await node.getAttribute("aria-pressed"), "true"); }
      assert.equal(await p.locator(".somatic-pulse").count(), 0);
      await p.locator("#bsah-tab-brain").focus(); await p.keyboard.press("ArrowRight"); assert.equal(await p.locator("#bsah-tab-spine").getAttribute("aria-selected"), "true");
      const opener = p.getByRole("button", { name: "SEE THE EVIDENCE", exact: false }); await opener.click();
      const dialog = p.getByRole("dialog"); assert.equal(await dialog.count(), 1); await p.keyboard.press("Shift+Tab"); assert.ok(await dialog.evaluate((element) => element.contains(document.activeElement)));
      await p.keyboard.press("Escape"); assert.equal(await dialog.count(), 0); await snap(p, "somatic-mobile"); await fit(p); await p.context().close(); return { sixNodes: true, keyboard: true, reducedPulseAbsent: true, modalFocus: true };
    });
    await test("Council disclosures and Trojan drag, keyboard, native touch scrolling", async () => {
      const p = await page({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, reducedMotion: "reduce" }); await open(p, "/schools");
      assert.equal(await p.getByText(/Anjani|Shivadhar/).count(), 0);
      const council = p.locator('section[aria-labelledby="council-h"]'); await council.locator("summary").first().click(); assert.ok(await council.locator("details").first().getAttribute("open") !== null); await council.screenshot({ path: `${output}/council-mobile.png` });
      const slider = p.locator("#trojan-angle"); await slider.scrollIntoViewIfNeeded(); const before = await slider.inputValue(); await slider.focus(); await p.keyboard.press("ArrowRight"); assert.notEqual(await slider.inputValue(), before);
      const stage = p.locator(".trojan-stage"); await stage.scrollIntoViewIfNeeded(); const box = await stage.boundingBox(); const transform = await p.locator(".trojan-box").getAttribute("style");
      await touchSwipe(p, box.x + 70, box.y + 120, 140, 0); assert.notEqual(await p.locator(".trojan-box").getAttribute("style"), transform);
      const y = await p.evaluate(() => scrollY); await touchSwipe(p, 195, Math.min(box.y + 200, 650), 0, -200); assert.ok(await p.evaluate(() => scrollY) > y + 50);
      await snap(p, "trojan-mobile"); await p.context().close(); return { council: true, keyboardRotation: true, touchRotation: true, verticalPan: true };
    });
    for (const gate of ["parents", "schools", "audit"]) await test(`${gate} wizard: validation, review, pending, delivery and duplicate prevention`, async () => {
      const p = await page({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce" }); await open(p, `/contact?gate=${gate}`); await p.waitForTimeout(250);
      const form = p.locator("form"); await form.getByRole("button", { name: "Continue", exact: false }).click(); assert.equal(await form.locator('input[name="name"]').evaluate((element) => element.validity.valid), false);
      for (let step = 0; step < 2; step++) {
        for (const input of await form.locator('input:not([type="hidden"]):visible, textarea:visible').all()) { const name = await input.getAttribute("name"); if (name === "date") await input.fill("2099-12-01"); else await input.fill(name === "email" ? "browser-qa@example.test" : name === "phone" ? "+919999999999" : "Synthetic QA only"); }
        for (const select of await form.locator("select:visible").all()) await select.selectOption({ index: 1 });
        await form.getByRole("button", { name: "Continue", exact: false }).click();
      }
      assert.ok(await form.getByRole("definition", { name: "Application review" }).count() || await form.locator('dl[aria-label="Application review"]').count());
      const count = deliveries.length; const submit = form.locator('button[type="submit"]'); await submit.dblclick({ delay: 20 });
      await p.getByText("Received. The Office", { exact: false }).waitFor(); assert.equal(deliveries.length, count + 1); assert.equal(deliveries.at(-1).gate, gate);
      await snap(p, `form-${gate}-received`); await p.context().close(); return { actualLoopbackDelivery: true, receivedCount: 1, invalidRequired: true };
    });
    await test("configurator MOU delivers; native dialog labels and focus work", async () => {
      const p = await page({ reducedMotion: "reduce" }); await open(p, "/schools"); await p.getByRole("button", { name: /Request.*MOU|Draft.*MOU/i }).first().click();
      const dialog = p.getByRole("dialog", { name: "Request a Draft MOU" }); await dialog.getByLabel("Institution / School Name", { exact: false }).fill("Synthetic QA Institution"); await dialog.getByLabel("Board Representative / Principal", { exact: false }).fill("Synthetic QA only"); await dialog.getByLabel("Official Email", { exact: false }).fill("browser-qa@example.test");
      const count = deliveries.length; await dialog.locator('button[type="submit"]').click(); await dialog.getByRole("status").waitFor(); assert.equal(deliveries.length, count + 1); assert.equal(deliveries.at(-1).gate, "mou"); await snap(p, "configurator-mou-delivered"); await p.keyboard.press("Escape"); assert.equal(await dialog.count(), 0); await p.context().close(); return { actualLoopbackDelivery: true, escape: true };
    });
    await test("trustee server validation, anonymous exclusion, scoped session and signout", async () => {
      const p = await page({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce" }); await open(p, "/schools/access"); assert.equal(await p.getByText("Private institutional proposal").count(), 0);
      await p.getByLabel("Enter Institutional Passcode").fill("wrong-synthetic-code-for-test"); await p.getByRole("button", { name: "Unlock institutional proposal" }).click(); await p.getByRole("alert").waitFor(); assert.equal(await p.getByText("Private institutional proposal").count(), 0);
      await p.waitForTimeout(150);
      const submitted = [];
      p.on("request", (request) => { if (request.method() === "POST") submitted.push({ containsExpectedCode: request.postData()?.includes(code) ?? false }); });
      await p.getByLabel("Enter Institutional Passcode").fill(code); assert.equal(await p.getByLabel("Enter Institutional Passcode").inputValue(), code); await p.getByRole("button", { name: "Unlock institutional proposal" }).click();
      try { await p.getByRole("heading", { name: "Synthetic QA Institution", exact: true }).waitFor(); }
      catch (error) { await snap(p, "trustee-session-failure"); await writeFile(`${output}/trustee-session-failure.json`, JSON.stringify({ url: p.url(), submitted, body: (await p.locator("main").innerText()).slice(0, 1800), cookies: (await p.context().cookies()).map(({ name, path, secure, sameSite, httpOnly }) => ({ name, path, secure, sameSite, httpOnly })) }, null, 2)); throw error; }
      const cookie = (await p.context().cookies()).find((item) => item.name === "bsah-trustee"); assert.ok(cookie?.httpOnly && cookie.secure && cookie.sameSite === "Strict" && cookie.path === "/schools/access");
      await snap(p, "trustee-authorized-synthetic"); await p.getByRole("button", { name: "Lock & sign out" }).click(); await p.getByLabel("Enter Institutional Passcode").waitFor(); assert.equal(await p.getByText("Private institutional proposal").count(), 0); await p.context().close(); return { invalidRejected: true, validServerSession: true, cookieFlags: true, signout: true, productionRateLimiting: "BLOCKED" };
    });
  }

  if (selected("responsive")) for (const route of ["/", "/schools", "/anatomy", "/statue", "/contact", "/schools/mou", "/schools/access"]) for (const width of [320, 375, 390, 430, 768, 1024, 1440, 1920]) await test(`${route} responsive ${width}`, async () => {
    const p = await page({ viewport: { width, height: width < 768 ? 844 : 1000 }, reducedMotion: "reduce", isMobile: width < 768, hasTouch: width < 768 }); await open(p, route); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(200); await fit(p);
    const sections = p.locator("main > section, main > div > section, main section[aria-labelledby]");
    let inspected = 0;
    for (const section of await sections.all()) { if (!await section.isVisible()) continue; await section.scrollIntoViewIfNeeded({ timeout: 5000 }); await p.waitForTimeout(50); await fit(p); inspected++; }
    const broken = await p.evaluate(() => [...document.querySelectorAll("main img")].filter((img) => img.complete && !img.naturalWidth).map((img) => ({ src: img.getAttribute("src")?.slice(0, 120), alt: img.alt })));
    assert.deepEqual(broken, []); await p.locator("footer").last().scrollIntoViewIfNeeded(); await fit(p);
    if (width === 390 || width === 1440) { await snap(p, `${route.replaceAll("/", "-") || "home"}-${width}-footer`); await p.evaluate(() => scrollTo(0, 0)); await p.waitForTimeout(150); await snap(p, `${route.replaceAll("/", "-") || "home"}-${width}-top`); }
    await p.context().close(); return { sectionsInspected: inspected, overflow: false, brokenImages: [] };
  });

  if (selected("anatomy")) await test("3D anatomy: lifecycle, gestures, reduced motion, failures, retry and late disposal", async () => {
    const result = await promisify(execFile)(process.execPath, ["scripts/test-anatomy-browser.mjs"], { env: { ...process.env, BSAH_TEST_URL: base, BSAH_TEST_OUTPUT: `${output}/anatomy` }, timeout: 240000 });
    await writeFile(`${output}/anatomy.log`, result.stdout + result.stderr);
    return JSON.parse(await readFile(`${output}/anatomy/results.json`, "utf8"));
  });

  if (selected("extras")) {
    await test("footer film stays deferred until visible and retains its poster", async () => {
      const p = await page({ viewport: { width: 390, height: 844 } }); const requests = [];
      p.on("request", (request) => { if (request.url().includes("footer-ambient") && request.url().includes(".mp4")) requests.push(request.url()); });
      await open(p, "/"); await p.waitForTimeout(300); assert.equal(requests.length, 0);
      const video = p.locator("footer video"); assert.ok(await video.getAttribute("poster")); await video.scrollIntoViewIfNeeded();
      await p.waitForFunction(() => document.querySelector("footer video")?.readyState >= 2, { timeout: 20000 }); assert.ok(requests.length > 0); await p.context().close();
      return { deferredWhileOffscreen: true, playbackLoadsWhenVisible: true, posterRetained: true };
    });
    await test("loader releases without JavaScript and when horse engine fails", async () => {
      const plain = await page({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
      await plain.goto(base, { waitUntil: "load" }); await plain.locator(".bsah-loader").waitFor({ state: "hidden", timeout: 10000 }); assert.ok(await plain.locator("main h1").innerText()); await plain.context().close();
      const broken = await page(); await broken.route("**/animations/pixel-horse.js", (route) => route.abort());
      await broken.goto(base, { waitUntil: "domcontentloaded" }); await broken.locator(".bsah-loader").waitFor({ state: "hidden", timeout: 10000 }); assert.ok(await broken.locator("main h1").innerText()); await broken.context().close();
      return { noJavaScriptExit: true, failedEngineExit: true };
    });
    await test("monument loads, chapter controls work and offscreen WebGL stops", async () => {
      const p = await page({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 2 });
      await p.addInitScript(() => { window.__draws = new WeakMap(); for (const type of [WebGLRenderingContext, WebGL2RenderingContext]) for (const method of ["drawElements", "drawArrays"]) { const original = type.prototype[method]; type.prototype[method] = function (...args) { window.__draws.set(this.canvas, (window.__draws.get(this.canvas) || 0) + 1); return original.apply(this, args); }; } });
      await open(p, "/statue"); const canvas = p.locator("[data-monument] canvas"); await canvas.waitFor(); await p.waitForTimeout(2000);
      const size = await canvas.evaluate((element) => ({ dpr: element.width / element.clientWidth, draws: window.__draws.get(element) || 0 })); assert.ok(size.dpr >= 1.49 && size.dpr <= 1.5, "Drawing buffer rounding must respect the DPR cap"); assert.ok(size.draws > 0);
      await p.getByRole("button", { name: "Jump to Chapter 06: 360° ORBIT" }).click(); await p.waitForTimeout(1600); await snap(p, "monument-orbit-desktop");
      await p.locator("footer").last().scrollIntoViewIfNeeded(); await p.waitForTimeout(500); const before = await canvas.evaluate((element) => window.__draws.get(element) || 0); await p.waitForTimeout(300); assert.equal(await canvas.evaluate((element) => window.__draws.get(element) || 0), before);
      await p.context().close(); return { ...size, chapterNavigation: true, offscreenDraws: 0 };
    });
    await test("monument asset failure and both reduced-motion routes have readable still fallback", async () => {
      const p = await page(); await p.route("**/models/horse-statue-monument.glb", (route) => route.abort()); await open(p, "/statue"); await p.waitForTimeout(1000); assert.ok(await p.locator('[data-monument] img').count()); await snap(p, "monument-model-fallback"); await p.context().close();
      for (let index = pageErrors.length - 1; index >= 0; index--) if (pageErrors[index].message === "Could not load /models/horse-statue-monument.glb: Failed to fetch") expectedPageErrors.push({ ...pageErrors.splice(index, 1)[0], reason: "Deliberately aborted model request; readable fallback asserted" });
      for (const route of ["/statue", "/lithos"]) { const still = await page({ reducedMotion: "reduce" }); await open(still, route); assert.equal(await still.locator("[data-monument] canvas").count(), 0); assert.ok(await still.locator("main").innerText()); await still.context().close(); }
      return { modelFailureFallback: true, reducedRoutes: ["/statue", "/lithos"] };
    });
    await test("journal replay reaches the opening film; grid/lightbox keyboard works", async () => {
      const p = await page({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce" }); await open(p, "/journal");
      const replay = p.getByRole("link", { name: "Replay opening film" }); assert.equal(await replay.getAttribute("href"), "/#top"); await p.getByRole("button", { name: "Grid View", exact: true }).click();
      const photo = p.getByRole("button", { name: /^Open photo:/ }).first(); await photo.focus(); await p.keyboard.press("Enter"); const dialog = p.getByRole("dialog", { name: /^Photo:/ }); await dialog.waitFor(); await p.keyboard.press("Escape"); await p.waitForTimeout(600); assert.equal(await dialog.count(), 0);
      await replay.click(); await p.waitForURL(`${base}/#top`); await p.locator("#top video").waitFor(); await p.context().close(); return { replayWorks: true, keyboardGridLightbox: true };
    });
  }

  if (selected("mou")) await test("MOU generator validates, previews and delivers one acknowledged request", async () => {
    const p = await page({ viewport: { width: 390, height: 844 } }); await open(p, "/schools/mou");
    const form = p.locator("form[aria-busy]"); assert.equal(await form.evaluate((element) => element.checkValidity()), false);
    await p.getByLabel("School name", { exact: true }).fill("Synthetic QA Academy"); await p.getByLabel("Trustee / principal", { exact: true }).fill("Synthetic QA Trustee"); await p.getByLabel("Email", { exact: true }).fill("synthetic@example.invalid");
    assert.ok((await p.getByRole("article", { name: "Draft memorandum of understanding" }).innerText()).includes("Synthetic QA Academy"));
    const before = deliveries.length; await p.getByRole("button", { name: "Send to the BSAH board office", exact: true }).dblclick(); await form.getByRole("status").waitFor(); await p.waitForTimeout(500); assert.equal(deliveries.length - before, 1); assert.equal(await p.getByLabel("School name", { exact: true }).inputValue(), "Synthetic QA Academy");
    await snap(p, "mou-generator-acknowledged"); await p.context().close(); return { requiredValidation: true, previewUpdates: true, actualLoopbackDelivery: true, duplicateClickCount: 1, valuesRetained: true };
  });

  if (selected("site-matrix")) {
    const manifest = JSON.parse(await readFile(".next/prerender-manifest.json", "utf8"));
    const routes = [...new Set([...Object.keys(manifest.routes), "/schools/access"])].filter((route) => !route.startsWith("/_") && !/\.(png|ico|xml|txt)$/.test(route));
    for (const route of routes) for (const width of [320, 375, 390, 430, 768, 1024, 1440, 1920]) await test(`site matrix ${route} ${width}`, async () => {
      const p = await page({ viewport: { width, height: width < 768 ? 844 : 1000 }, reducedMotion: "reduce", isMobile: width < 768, hasTouch: width < 768 });
      await open(p, route); await p.evaluate(() => document.fonts.ready); await fit(p);
      let sections = 0;
      for (const section of await p.locator("#main section").all()) { if (!await section.isVisible()) continue; await section.scrollIntoViewIfNeeded({ timeout: 5000 }); await p.waitForTimeout(35); await fit(p); sections++; }
      await p.locator("footer").last().scrollIntoViewIfNeeded(); await fit(p);
      const broken = await p.evaluate(() => [...document.querySelectorAll("#main img")].filter((img) => img.complete && !img.naturalWidth).map((img) => ({ src: img.getAttribute("src")?.slice(0, 120), alt: img.alt })));
      assert.deepEqual(broken, []); assert.equal(await p.locator("main").count(), 1);
      const canonical = await p.locator('link[rel="canonical"]').getAttribute("href"); assert.equal(new URL(canonical).pathname, route);
      if (width === 390 || width === 1440) { await snap(p, `site-${route.replaceAll("/", "-") || "home"}-${width}-footer`); await p.evaluate(() => scrollTo(0, 0)); await p.waitForTimeout(150); await snap(p, `site-${route.replaceAll("/", "-") || "home"}-${width}-top`); }
      await p.context().close(); return { sectionsInspected: sections, noOverflow: true, canonical, brokenImages: [] };
    });
  }

  if (selected("final-layout")) for (const route of ["/about", "/cadets", "/command", "/curriculum", "/fleet", "/journal", "/legend", "/lore", "/science", "/tournaments", "/verify", "/why"]) for (const width of [320, 390, 768, 1440]) await test(`final layout ${route} ${width}`, async () => {
    const p = await page({ viewport: { width, height: 900 }, reducedMotion: "reduce" }); await open(p, route); await fit(p);
    for (const section of await p.locator("#main section").all()) { if (await section.isVisible()) { await section.scrollIntoViewIfNeeded(); await fit(p); } }
    await p.evaluate(() => scrollTo(0, 0)); await p.waitForTimeout(200);
    if ((route === "/journal" || route === "/command") && (width === 390 || width === 1440)) await snap(p, `final-${route.slice(1)}-${width}`);
    await p.context().close(); return { noOverflow: true, inspectedAfterAccessibilityRepairs: true };
  });

  if (selected("routes")) {
    const manifest = JSON.parse(await readFile(".next/prerender-manifest.json", "utf8"));
    const routes = [...new Set([...Object.keys(manifest.routes), "/schools/access"])].filter((route) => !route.startsWith("/_") && !/\.(png|ico|xml|txt)$/.test(route) && !/\/(opengraph-image|twitter-image|icon|apple-icon)$/.test(route));
    for (const route of routes) await test(`route ${route}`, async () => {
      const p = await page({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce" }); const response = await open(p, route); assert.equal(response.status(), 200); await fit(p); assert.ok(await p.locator("main").innerText());
      const headingCount = await p.locator("main h1").count(); assert.equal(await p.locator("main").count(), 1, "Exactly one main landmark");
      const canonical = await p.locator('link[rel="canonical"]').getAttribute("href"); assert.equal(new URL(canonical).pathname, route);
      await p.context().close(); return { http: 200, headingCount, canonical };
    });
  }

  const accessibilityRoutes = mode === "accessibility-all" ? [...new Set([...Object.keys(JSON.parse(await readFile(".next/prerender-manifest.json", "utf8")).routes), "/schools/access"])].filter((route) => !route.startsWith("/_") && !/\.(png|ico|xml|txt)$/.test(route)) : ["/", "/schools", "/contact", "/anatomy", "/statue", "/schools/access", "/schools/mou"];
  if (selected("accessibility") || mode === "accessibility-all") for (const route of accessibilityRoutes) await test(`axe accessibility ${route}`, async () => {
    const p = await page({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce" }); await open(p, route); await fit(p); await p.waitForTimeout(500); await p.addScriptTag({ path: "output/engineering/tooling/package/axe.min.js" });
    const findings = await p.evaluate(async () => { const result = await window.axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"] } }); return result.violations.map((item) => ({ id: item.id, impact: item.impact, description: item.description, nodes: item.nodes.map((node) => ({ target: node.target, summary: node.failureSummary })) })); });
    await writeFile(`${output}/axe-${route.replaceAll("/", "-") || "home"}.json`, JSON.stringify(findings, null, 2)); await p.context().close(); assert.equal(findings.length, 0, `Automated accessibility violations: ${findings.map((item) => item.id).join(", ")}`); return { violations: findings.length, critical: findings.filter((item) => item.impact === "critical").length, findings };
  });

  if (selected("performance")) await test("mobile CPU/network trace and scroll performance sample", async () => {
    const p = await page({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 3 });
    const session = await p.context().newCDPSession(p); await session.send("Network.enable"); await session.send("Network.emulateNetworkConditions", { offline: false, latency: 100, downloadThroughput: 200000, uploadThroughput: 93750 }); await session.send("Emulation.setCPUThrottlingRate", { rate: 4 });
    await p.addInitScript(() => { window.__engineering = { longTasks: [], shifts: [], lcp: 0 }; new PerformanceObserver((list) => list.getEntries().forEach((entry) => window.__engineering.longTasks.push({ start: entry.startTime, duration: entry.duration }))).observe({ type: "longtask", buffered: true }); new PerformanceObserver((list) => list.getEntries().forEach((entry) => { if (!entry.hadRecentInput) window.__engineering.shifts.push(entry.value); })).observe({ type: "layout-shift", buffered: true }); new PerformanceObserver((list) => list.getEntries().forEach((entry) => window.__engineering.lcp = entry.startTime)).observe({ type: "largest-contentful-paint", buffered: true }); });
    await session.send("Tracing.start", { categories: "devtools.timeline,blink.user_timing", transferMode: "ReturnAsStream" });
    await p.goto(`${base}/?noload`, { waitUntil: "domcontentloaded", timeout: 60000 }); await p.waitForTimeout(20000); for (let index = 0; index < 8; index++) { await p.mouse.wheel(0, 600); await p.waitForTimeout(120); }
    const metrics = await p.evaluate(() => ({ ...window.__engineering, domElements: document.querySelectorAll("*").length, canvases: document.querySelectorAll("canvas").length, resourceBytes: performance.getEntriesByType("resource").reduce((sum, resource) => sum + resource.transferSize, 0), navigation: performance.getEntriesByType("navigation")[0]?.toJSON(), resources: performance.getEntriesByType("resource").map((entry) => ({ name: entry.name.replace(location.origin, ""), bytes: entry.transferSize, duration: entry.duration, initiator: entry.initiatorType })).sort((a, b) => b.bytes - a.bytes).slice(0, 15) }));
    const traceComplete = new Promise((resolve) => session.once("Tracing.tracingComplete", resolve)); await session.send("Tracing.end"); const { stream } = await traceComplete;
    let trace = ""; while (true) { const part = await session.send("IO.read", { handle: stream }); trace += part.data; if (part.eof) break; } await session.send("IO.close", { handle: stream }); await writeFile(`${output}/mobile-trace.json`, trace); await writeFile(`${output}/mobile-metrics.json`, JSON.stringify(metrics, null, 2)); await session.detach(); await p.context().close(); return { ...metrics, limitations: "Desktop Chromium mobile emulation, 4x CPU and 1.6 Mbps/100ms; not physical device FPS or field Core Web Vitals" };
  });
} finally {
  await writeFile(`${output}/results-${mode}.json`, JSON.stringify({ date: new Date().toISOString(), results, pageErrors, expectedPageErrors, syntheticDeliveries: deliveries.length }, null, 2));
  await browser.close(); server.kill("SIGTERM"); await new Promise((resolve) => receiver.close(resolve)); serverLog.end();
}
if (results.some((result) => result.status === "fail") || pageErrors.length) process.exitCode = 1;
console.log(JSON.stringify({ pass: results.filter((item) => item.status === "pass").length, fail: results.filter((item) => item.status === "fail").length, pageErrors: pageErrors.length }));
