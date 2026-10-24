import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

// Reuse installed browser tooling; never download a runtime or change app dependencies.
const { chromium } = await import(process.env.BSAH_PLAYWRIGHT_MODULE || "playwright");
const base = process.env.BSAH_TEST_URL || "http://localhost:3100";
const output = resolve(process.env.BSAH_TEST_OUTPUT || "scratch/audit/editorial-motion");
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: process.env.BSAH_BROWSER_CHANNEL || "chrome", headless: true });
const results = [];
const errors = [];
let scenario = "startup";

async function open(route, options = {}, expectFailure = false) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, ...options });
  const page = await context.newPage();
  page.on("pageerror", (error) => { if (!expectFailure) errors.push({ scenario, message: error.message }); });
  page.on("console", (message) => {
    if (!expectFailure && message.type() === "error" && /hydrat|Maximum update|Cannot update a component/i.test(message.text())) errors.push({ scenario, message: message.text() });
  });
  if (options.javaScriptEnabled !== false) await page.addInitScript(() => {
    window.__editorialCLS = 0;
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) if (!entry.hadRecentInput) window.__editorialCLS += entry.value;
    }).observe({ type: "layout-shift", buffered: true });
  });
  await page.goto(`${base}${route}?noload`, { waitUntil: "load" });
  if (options.javaScriptEnabled !== false) {
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(1500);
  }
  return page;
}

async function noOverflow(page) {
  const dimensions = await page.evaluate(() => ({ width: innerWidth, content: document.documentElement.scrollWidth }));
  assert.ok(dimensions.content <= dimensions.width + 1, JSON.stringify(dimensions));
}

try {
  if (process.env.BSAH_MOTION_SKIP_LAYOUT !== "1") {
  for (const width of (process.env.BSAH_MOTION_WIDTHS || "1440,768,390,320").split(",").map(Number)) {
    for (const route of (process.env.BSAH_MOTION_ROUTES || "/legend,/anatomy,/statue").split(",")) {
      scenario = `${route} at ${width}px`;
      const page = await open(route, { viewport: { width, height: width < 768 ? 844 : 1000 }, isMobile: width < 768, hasTouch: width < 768 });
      await noOverflow(page);
      assert.equal(await page.locator("main h1").count(), 1, "One semantic primary heading");
      if (route === "/statue") {
        await page.locator('[data-motion="ready"]').waitFor();
        await page.locator("canvas").waitFor();
        // Buttons must select the matching chapter and retain an unobscured reading hold.
        const nav = width >= 1024 ? page.getByRole("navigation", { name: "Statue Chapters Navigation" }) : page.locator('[data-monument] button').filter({ hasText: /^0[1-6]$/ }).first().locator("..");
        const buttons = nav.getByRole("button");
        for (const index of [1, 3, 5, 0]) {
          await buttons.nth(index).click();
          await page.waitForTimeout(1800);
          const headings = page.locator('[data-monument] h1, [data-monument] h2');
          const card = headings.nth(index).locator("..");
          assert.ok(await card.evaluate((node) => Number(getComputedStyle(node).opacity) > 0.95), "Selected chapter must be readable");
        }
      } else {
        for (const id of route === "/legend" ? ["ocean-h", "marwar-h", "bred-h", "honour-h", "today-h"] : ["plate-h", "grams-h", "dial-h", "spec-h"]) {
          await page.locator(`#${id}`).scrollIntoViewIfNeeded();
          await page.waitForTimeout(1200);
          await noOverflow(page);
          assert.ok(await page.locator(`#${id}`).evaluate((node) => node.scrollWidth <= node.clientWidth + 2), `${id} heading must fit`);
        }
        await page.evaluate(() => scrollTo({ top: 0, behavior: "instant" }));
        await page.waitForTimeout(1000);
      }
      await page.screenshot({ path: `${output}/${route.slice(1)}-${width}.png` });
      const metrics = await page.evaluate(() => ({ cls: window.__editorialCLS, images: [...document.querySelectorAll("main img")].filter((img) => img.complete && !img.naturalWidth).map((img) => img.getAttribute("src")), resources: performance.getEntriesByType("resource").length }));
      assert.deepEqual(metrics.images, [], "No failed image elements");
      results.push({ scenario, pass: true, metrics });
      console.log(`${scenario}: passed; observed CLS ${metrics.cls}`);
      await page.context().close();
    }
  }
  }

  if (process.env.BSAH_MOTION_LAYOUT_ONLY !== "1") {
  for (const route of ["/legend", "/anatomy", "/statue"]) {
    scenario = `${route} reduced motion`;
    const page = await open(route, { viewport: { width: 390, height: 844 }, reducedMotion: "reduce" });
    assert.equal(await page.locator('[data-editorial-headline] [aria-hidden="true"]').count(), 0, "No split-text decoration under reduced motion");
    if (route === "/statue") {
      assert.equal(await page.locator("canvas").count(), 0);
      assert.equal(await page.locator('[data-motion="ready"]').count(), 0);
      const chapterPositions = await page.locator('[data-monument] h1, [data-monument] h2').evaluateAll((nodes) => nodes.map((node) => node.getBoundingClientRect().top));
      assert.ok(chapterPositions.every((top, index) => index === 0 || top > chapterPositions[index - 1]), "Chapters use natural document flow");
    }
    if (route === "/anatomy") {
      const dial = page.getByRole("slider", { name: "Ear rotation" });
      await dial.focus();
      await page.keyboard.press("ArrowRight");
      assert.equal(await dial.getAttribute("aria-valuenow"), "10", "Keyboard ear control remains usable");
    }
    await noOverflow(page);
    await page.screenshot({ path: `${output}/${route.slice(1)}-reduced.png` });
    results.push({ scenario, pass: true });
    await page.context().close();

    scenario = `${route} JavaScript disabled`;
    const staticPage = await open(route, { viewport: { width: 390, height: 844 }, javaScriptEnabled: false });
    const primary = staticPage.locator("main h1");
    assert.equal(await primary.count(), 1);
    assert.ok(await primary.isVisible());
    await primary.scrollIntoViewIfNeeded();
    assert.ok(await primary.evaluate((node) => {
      const rect = node.getBoundingClientRect();
      return node.contains(document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2));
    }), "Primary heading must be unobscured, including by the global loader");
    const hiddenText = await staticPage.locator("main h1, main h2, main p").evaluateAll((nodes) => nodes.filter((node) => {
      if (!node.textContent.trim() || node.closest('[aria-hidden="true"]')) return false;
      for (let current = node; current && current.id !== "main"; current = current.parentElement) {
        const style = getComputedStyle(current);
        // Responsive alternate presentations (e.g. desktop timeline/mobile dates)
        // are intentionally hidden at this viewport, independently of JavaScript.
        if (style.display === "none" && /(?:^|\s)(?:hidden|\S+:hidden)(?:\s|$)/.test(current.className)) return false;
        if (style.visibility === "hidden" || style.opacity === "0" || style.display === "none") return true;
      }
      return false;
    }).map((node) => node.textContent.trim()));
    assert.deepEqual(hiddenText, [], "Headings and narrative copy must not depend on JavaScript visibility");
    await noOverflow(staticPage);
    await staticPage.screenshot({ path: `${output}/${route.slice(1)}-no-js.png` });
    results.push({ scenario, pass: true });
    await staticPage.context().close();
  }

  scenario = "Monument failed model";
  const failureContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await failureContext.route("**/models/statue-mobile.glb", (route) => route.abort());
  const failurePage = await failureContext.newPage();
  const failedRequest = failurePage.waitForRequest("**/models/statue-mobile.glb");
  await failurePage.goto(`${base}/statue?noload`);
  await failedRequest;
  await failurePage.waitForFunction(() => document.querySelector('[data-monument] canvas') === null && document.querySelector('[data-motion="ready"]') === null);
  await failurePage.getByRole("heading", { name: "360° ORBIT", exact: true }).scrollIntoViewIfNeeded();
  await noOverflow(failurePage);
  await failurePage.screenshot({ path: `${output}/statue-model-fallback.png` });
  results.push({ scenario, pass: true });
  await failureContext.close();

  scenario = "Monument loading deadline (accelerated)";
  const timeoutContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await timeoutContext.addInitScript(() => {
    const original = window.setTimeout;
    window.setTimeout = (callback, delay, ...args) => original(callback, delay === 20000 ? 150 : delay, ...args);
  });
  await timeoutContext.route("**/models/statue-mobile.glb", async (route) => {
    await new Promise((resolveDelay) => setTimeout(resolveDelay, 800));
    await route.abort();
  });
  const timeoutPage = await timeoutContext.newPage();
  await timeoutPage.goto(`${base}/statue?noload`);
  await timeoutPage.waitForTimeout(1200);
  assert.equal(await timeoutPage.locator('[data-motion="ready"], canvas').count(), 0);
  assert.ok(await timeoutPage.getByRole("heading", { name: "360° ORBIT", exact: true }).isVisible());
  results.push({ scenario, pass: true });
  await timeoutContext.close();

  scenario = "Route transitions and restoration";
  const navPage = await open("/legend");
  await navPage.locator('main a[href="/anatomy"]').last().scrollIntoViewIfNeeded();
  await navPage.waitForTimeout(1000);
  const previousPosition = await navPage.evaluate(() => scrollY);
  await navPage.locator('main a[href="/anatomy"]').last().click();
  await navPage.waitForURL("**/anatomy");
  await navPage.waitForTimeout(1200);
  assert.ok(await navPage.evaluate(() => scrollY) < 100, "New route starts at top");
  await navPage.goBack();
  await navPage.waitForTimeout(1500);
  assert.ok(Math.abs(await navPage.evaluate(() => scrollY) - previousPosition) < 100, "Back navigation restores position");
  await navPage.goto(`${base}/statue?noload`);
  await navPage.locator('[data-motion="ready"]').waitFor();
  await navPage.getByRole("link", { name: "BSAH · Sovereign Citadel" }).click();
  await navPage.waitForURL(`${base}/`);
  // Next Cache Components may retain inactive routes in hidden Activity trees.
  assert.equal(await navPage.locator('[data-editorial-headline]:visible, [data-monument]:visible').count(), 0, "No editorial presentation appears on homepage");
  results.push({ scenario, pass: true });
  await navPage.context().close();

  scenario = "Legacy Monument alias remains unchanged";
  const legacy = await open("/lithos");
  assert.equal(await legacy.locator('[data-monument], [data-motion="ready"], [data-monument-word]').count(), 0);
  assert.equal(await legacy.locator('main h1').count(), 0, "Preserve legacy heading structure");
  assert.equal(await legacy.locator('main > div').evaluate((node) => node.classList.contains("select-none")), true);
  await legacy.screenshot({ path: `${output}/lithos-preserved.png` });
  results.push({ scenario, pass: true });
  await legacy.context().close();
  }
  assert.deepEqual(errors, []);
  await writeFile(`${output}/results.json`, JSON.stringify({ date: new Date().toISOString(), base, results, errors, limitations: ["Chromium emulation, not physical iOS/Android", "CLS observations include test-driven scroll and initialization; no comparable before baseline", "No hardware FPS, Lighthouse or field Core Web Vitals benchmark"] }, null, 2));
  console.log(JSON.stringify({ passed: results.length, results, errors }, null, 2));
} catch (error) {
  await writeFile(`${output}/failure.json`, JSON.stringify({ scenario, error: String(error), results, errors }, null, 2));
  throw error;
} finally {
  await browser.close();
}
