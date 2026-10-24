import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

// Use an installed Playwright package or the Codex bundled module; no app dependency is needed.
const { chromium } = await import(process.env.BSAH_PLAYWRIGHT_MODULE || "playwright");
const base = process.env.BSAH_TEST_URL || "http://localhost:3100";
const output = resolve(process.env.BSAH_TEST_OUTPUT || "scratch/audit/anatomy-stability");
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: process.env.BSAH_BROWSER_CHANNEL || "chrome", headless: true });
const results = [];
const errors = [];
let currentScenario = "initialization";

async function newPage(options = {}) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, ...options });
  await context.addInitScript(() => {
    window.__anatomyDraws = new WeakMap();
    for (const type of [window.WebGLRenderingContext, window.WebGL2RenderingContext]) {
      if (!type) continue;
      for (const name of ["drawElements", "drawArrays", "drawElementsInstanced", "drawArraysInstanced"]) {
        const original = type.prototype[name];
        if (!original) continue;
        type.prototype[name] = function (...args) {
          window.__anatomyDraws.set(this.canvas, (window.__anatomyDraws.get(this.canvas) || 0) + 1);
          return original.apply(this, args);
        };
      }
    }
  });
  const page = await context.newPage();
  page.setDefaultTimeout(15000);
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error" && /hydrat|Minified React error|Maximum update depth|Cannot update a component/i.test(message.text())) errors.push(message.text());
  });
  return page;
}

async function openPlate(page, route = "/anatomy") {
  await page.goto(`${base}${route}?noload`, { waitUntil: "networkidle", timeout: 45000 });
  const plate = page.getByText("Specimen Plate 02 · Conformation Study", { exact: true });
  await plate.scrollIntoViewIfNeeded();
  return page.locator(route === "/anatomy" ? 'section[aria-labelledby="plate-h"]' : 'section[aria-labelledby="instrument-h"]');
}

async function readyCanvas(section) {
  const canvas = section.locator("canvas");
  await canvas.waitFor();
  await section.page().waitForFunction(() => document.querySelector('canvas.opacity-100') !== null);
  return canvas;
}

const drawCount = (canvas) => canvas.evaluate((element) => window.__anatomyDraws.get(element) || 0);
async function drawDelta(canvas, duration = 450) {
  const before = await drawCount(canvas);
  await canvas.page().waitForTimeout(duration);
  return (await drawCount(canvas)) - before;
}

async function expectArchive(section) {
  const page = section.page();
  await section.getByRole("status").filter({ hasText: "3D view is unavailable" }).waitFor({ timeout: 25000 });
  assert.equal(await section.getByRole("button", { name: "2D Archive Plate", exact: true }).getAttribute("aria-pressed"), "true");
  assert.equal(await section.locator("canvas").count(), 0);
  await page.waitForFunction(() => [...document.querySelectorAll('section[aria-labelledby="plate-h"] img')].some((img) => img.complete && img.naturalWidth > 0));
  await section.getByRole("group", { name: "Choose a point" }).getByRole("button").nth(1).click();
  assert.equal(await section.getByRole("group", { name: "Choose a point" }).getByRole("button").nth(1).getAttribute("aria-pressed"), "true");
}

try {
  currentScenario = "mobile lifecycle";
  const page = await newPage();
  let modelRequests = 0;
  page.on("request", (request) => { if (request.url().includes("marwari-animated-home.glb")) modelRequests++; });
  const section = await openPlate(page);
  const canvas = await readyCanvas(section);
  await page.waitForTimeout(300);
  const dimensions = await canvas.evaluate((element) => ({ dpr: element.width / element.clientWidth, touchAction: getComputedStyle(element).touchAction }));
  assert.equal(dimensions.dpr, 1.5);
  assert.equal(dimensions.touchAction, "pan-y");
  assert.ok(await drawDelta(canvas) > 0, "Automatic orbit should render");
  await section.getByRole("button", { name: "Pause Orbit", exact: true }).click();
  await page.waitForTimeout(2200);
  const idleDrawCalls = await drawDelta(canvas);
  assert.equal(idleDrawCalls, 0, "Paused, settled view must stop drawing");
  await section.getByRole("group", { name: "Choose a point" }).getByRole("button").nth(1).click();
  await canvas.scrollIntoViewIfNeeded();
  assert.ok(await drawDelta(canvas) > 0, "Hotspot selection must render when the viewer is visible again");
  await section.getByRole("button", { name: "Reset View", exact: true }).click();
  assert.ok(await drawDelta(canvas) > 0, "Reset must wake the renderer");
  assert.equal(modelRequests, 1, "Controls must not reload the model");
  await section.getByRole("button", { name: "Auto Orbit", exact: true }).click();
  await page.evaluate(() => { Object.defineProperty(document, "hidden", { configurable: true, get: () => true }); document.dispatchEvent(new Event("visibilitychange")); });
  const hiddenDrawCalls = await drawDelta(canvas);
  assert.equal(hiddenDrawCalls, 0, "Hidden tab must stop drawing");
  await page.evaluate(() => { delete document.hidden; document.dispatchEvent(new Event("visibilitychange")); });
  assert.ok(await drawDelta(canvas) > 0, "Visible tab must resume");
  await page.locator("#spec-h").scrollIntoViewIfNeeded();
  await page.waitForTimeout(350);
  const offscreenDrawCalls = await drawDelta(canvas);
  assert.equal(offscreenDrawCalls, 0, "Offscreen viewer must stop drawing");
  await canvas.scrollIntoViewIfNeeded();
  assert.ok(await drawDelta(canvas) > 0, "Re-entering viewport must resume");
  await canvas.screenshot({ path: `${output}/mobile-3d.png` });

  // Dispatch real touch input, rather than calling scroll methods, to test pan-y.
  const cdp = await page.context().newCDPSession(page);
  const box = await canvas.boundingBox();
  const beforeSwipe = await page.evaluate(() => scrollY);
  await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: box.x + box.width / 2, y: box.y + box.height * 0.8 }] });
  for (let i = 1; i <= 8; i++) await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: box.x + box.width / 2, y: box.y + box.height * 0.8 - i * 18 }] });
  await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await page.waitForTimeout(350);
  assert.ok(await page.evaluate(() => scrollY) > beforeSwipe, "Vertical swipe must scroll the page");
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  results.push({ scenario: "mobile controls and lifecycle", pass: true, modelRequests, dimensions, idleDrawCalls, hiddenDrawCalls, offscreenDrawCalls, verticalSwipe: true });

  await canvas.evaluate((element) => element.dispatchEvent(new Event("webglcontextlost", { cancelable: true })));
  await expectArchive(section);
  await section.screenshot({ path: `${output}/context-loss-archive.png` });
  results.push({ scenario: "context-loss event switches to usable archive", pass: true });
  await page.context().close();

  currentScenario = "reduced motion";
  const reducedPage = await newPage({ reducedMotion: "reduce", viewport: { width: 360, height: 800 } });
  let reducedRequests = 0;
  reducedPage.on("request", (request) => { if (request.url().includes("marwari-animated-home.glb")) reducedRequests++; });
  const reducedSection = await openPlate(reducedPage);
  await reducedPage.waitForTimeout(500);
  assert.equal(reducedRequests, 0, "Reduced motion should default to archive without downloading the model");
  assert.equal(await reducedSection.getByRole("button", { name: "2D Archive Plate", exact: true }).getAttribute("aria-pressed"), "true");
  await reducedSection.getByRole("button", { name: "3D Living Model", exact: true }).click();
  const stillCanvas = await readyCanvas(reducedSection);
  await reducedPage.waitForTimeout(500);
  assert.equal(await drawDelta(stillCanvas), 0, "Explicit reduced-motion 3D must stay still");
  const stillBeforeSelection = await drawCount(stillCanvas);
  await reducedSection.getByRole("group", { name: "Choose a point" }).getByRole("button").nth(1).click();
  await stillCanvas.scrollIntoViewIfNeeded();
  await reducedPage.waitForTimeout(150);
  assert.ok(await drawCount(stillCanvas) > stillBeforeSelection, "Still 3D must respond to user selection");
  assert.equal(await drawDelta(stillCanvas), 0, "Still 3D must return to idle");
  assert.equal(await reducedSection.getByRole("button", { name: "Motion reduced", exact: true }).isDisabled(), true);
  await reducedSection.screenshot({ path: `${output}/reduced-motion-360.png` });
  results.push({ scenario: "reduced motion defaults to archive; explicit still 3D works", pass: true });
  await reducedPage.context().close();

  for (const failure of ["renderer", "model", "decoder", "timeout"]) {
    currentScenario = `${failure} failure`;
    const failurePage = await newPage();
    if (failure === "renderer") await failurePage.addInitScript(() => {
      const original = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (type, ...args) { return type.startsWith("webgl") ? null : original.call(this, type, ...args); };
    });
    if (failure === "model") await failurePage.route("**/models/marwari-animated-home.glb", (route) => route.abort());
    if (failure === "decoder") await failurePage.route("**/draco/draco_decoder.wasm", (route) => route.abort());
    if (failure === "timeout") {
      await failurePage.addInitScript(() => {
        const original = window.setTimeout;
        window.setTimeout = (callback, delay, ...args) => original(callback, delay === 20000 ? 100 : delay, ...args);
      });
      await failurePage.route("**/models/marwari-animated-home.glb", async (route) => { await new Promise((resolveDelay) => setTimeout(resolveDelay, 600)); await route.abort(); });
    }
    const failureSection = await openPlate(failurePage);
    await expectArchive(failureSection);
    if (failure === "timeout") await failurePage.waitForTimeout(700);
    if (failure === "model") {
      await failurePage.unroute("**/models/marwari-animated-home.glb");
      await failureSection.getByRole("button", { name: "3D Living Model", exact: true }).click();
      await readyCanvas(failureSection);
      assert.equal(await failureSection.getByText("The 3D view is unavailable.", { exact: false }).count(), 0);
    }
    results.push({ scenario: `${failure} failure${failure === "timeout" ? " (accelerated deadline)" : ""} uses archive${failure === "model" ? "; retry recovers" : ""}`, pass: true });
    await failurePage.context().close();
  }

  currentScenario = "cancel an in-flight load";
  const cancelPage = await newPage();
  await cancelPage.route("**/models/marwari-animated-home.glb", async (route) => {
    await new Promise((resolveDelay) => setTimeout(resolveDelay, 900));
    await route.fulfill({ path: resolve("public/models/marwari-animated-home.glb") });
  });
  const modelStarted = cancelPage.waitForRequest((request) => request.url().includes("marwari-animated-home.glb"));
  const cancelSection = await openPlate(cancelPage);
  await modelStarted;
  const modelSettled = cancelPage.waitForEvent("requestfinished", { predicate: (request) => request.url().includes("marwari-animated-home.glb"), timeout: 3000 });
  await cancelSection.getByRole("button", { name: "2D Archive Plate", exact: true }).click();
  await modelSettled;
  await cancelPage.waitForTimeout(1100);
  assert.equal(await cancelSection.locator("canvas").count(), 0);
  assert.equal(await cancelSection.getByText("The 3D view is unavailable.", { exact: false }).count(), 0);
  results.push({ scenario: "switching to archive disposes the late model result without stale UI or aborting a shared request", pass: true });
  await cancelPage.context().close();

  currentScenario = "desktop";
  const desktopPage = await newPage({ viewport: { width: 1440, height: 1000 }, isMobile: false, hasTouch: false, deviceScaleFactor: 1 });
  const desktopSection = await openPlate(desktopPage);
  const desktopCanvas = await readyCanvas(desktopSection);
  await desktopSection.getByRole("button", { name: "Pause Orbit", exact: true }).click();
  await desktopSection.getByRole("group", { name: "Choose a point" }).getByRole("button").nth(1).focus();
  await desktopPage.keyboard.press("Enter");
  assert.equal(await desktopSection.getByRole("group", { name: "Choose a point" }).getByRole("button").nth(1).getAttribute("aria-pressed"), "true");
  await desktopPage.waitForTimeout(1500);
  await desktopSection.screenshot({ path: `${output}/desktop.png` });
  assert.equal(await desktopPage.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  const desktopDpr = await desktopCanvas.evaluate((element) => element.width / element.clientWidth);
  results.push({ scenario: "desktop layout and keyboard", pass: true, dpr: desktopDpr });
  await desktopPage.context().close();

  currentScenario = "shared homepage";
  const homePage = await newPage({ reducedMotion: "reduce" });
  const homeSection = await openPlate(homePage, "/");
  assert.equal(await homeSection.getByRole("button", { name: "2D Archive Plate", exact: true }).getAttribute("aria-pressed"), "true");
  assert.equal(await homePage.locator(".home-page").evaluate((element) => getComputedStyle(element).backgroundColor), "rgb(239, 223, 198)");
  results.push({ scenario: "shared homepage viewer and cream background", pass: true });
  await homePage.context().close();
  assert.deepEqual(errors, [], "No uncaught page errors");
  await writeFile(`${output}/results.json`, JSON.stringify({ date: new Date().toISOString(), base, results, errors, limitations: ["Chromium emulation; physical iOS/Android not tested", "Visibility and context loss tested by dispatched events", "Loading deadline accelerated in timeout test", "GPU draw counts are lifecycle checks, not FPS benchmarks"] }, null, 2));
  console.log(JSON.stringify({ scenarios: results.length, results, errors }, null, 2));
} catch (error) {
  await writeFile(`${output}/failure.json`, JSON.stringify({ currentScenario, results, errors, error: String(error) }, null, 2));
  throw error;
} finally {
  await browser.close();
}
