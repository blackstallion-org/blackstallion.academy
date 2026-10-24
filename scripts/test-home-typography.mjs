import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const { chromium } = await import(process.env.BSAH_PLAYWRIGHT_MODULE || "playwright");
const base = process.env.BSAH_TEST_URL || "http://localhost:3101";
const output = resolve(process.env.BSAH_TEST_OUTPUT || "scratch/audit/home-typography");
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: "chrome", headless: true });
const results = [], errors = [];
const headings = ["doctrine-primary", "instrument-h", "matrix-h", "crisis-h", "doors-h", "ledger-h", "studbook-h", "schools-h", "verify-h", "circuit-h", "shield-h", "command-h", "chronicle-h"];
let scenario;

async function open(options = {}) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, ...options });
  const page = await context.newPage();
  page.on("pageerror", (error) => errors.push({ scenario, message: error.message }));
  await page.addInitScript(() => {
    window.__homeCLS = 0;
    let first = 0, last = 0, session = 0;
    new PerformanceObserver((list) => { for (const entry of list.getEntries()) if (!entry.hadRecentInput) {
      if (entry.startTime - last < 1000 && entry.startTime - first < 5000) session += entry.value;
      else { first = entry.startTime; session = entry.value; }
      last = entry.startTime;
      window.__homeCLS = Math.max(window.__homeCLS, session);
    } }).observe({ type: "layout-shift", buffered: true });
  });
  await page.goto(`${base}/?noload`, { waitUntil: "load" });
  await page.evaluate(() => document.fonts.ready);
  return page;
}
async function fit(page) {
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), "No horizontal page overflow");
}

try {
  for (const width of [1440, 768, 390, 320]) {
    scenario = `Homepage ${width}px`;
    const page = await open({ viewport: { width, height: width < 768 ? 844 : 1000 }, isMobile: width < 768, hasTouch: width < 768 });
    assert.equal(await page.locator("main h1").count(), 1);
    assert.equal(await page.locator("[data-home-typography]").evaluate((node) => getComputedStyle(node).backgroundColor), "rgb(239, 223, 198)");
    for (const id of headings) {
      await page.locator(`#${id}`).scrollIntoViewIfNeeded();
      await page.waitForTimeout(1000);
      await fit(page);
      assert.ok(await page.locator(`#${id}`).evaluate((node) => node.scrollWidth <= node.clientWidth + 2), `${id} fits its text column`);
    }
    await page.locator('[data-home-final-title]').scrollIntoViewIfNeeded();
    await page.waitForTimeout(1600);
    await fit(page);
    await page.screenshot({ path: `${output}/finale-${width}.png` });
    await page.locator('#doctrine').scrollIntoViewIfNeeded();
    await page.waitForTimeout(1600);
    await page.screenshot({ path: `${output}/manifesto-${width}.png` });
    const metrics = await page.evaluate(() => ({ cls: window.__homeCLS, brokenImages: [...document.querySelectorAll('main img')].filter((img) => img.complete && !img.naturalWidth).map((img) => img.getAttribute('src')) }));
    assert.deepEqual(metrics.brokenImages, []);
    if (width === 1440 || width === 390) {
      await page.getByRole('tab', { name: '02 Spine', exact: true }).click();
      assert.equal(await page.getByRole('tab', { name: '02 Spine', exact: true }).getAttribute('aria-selected'), 'true');
      const doors = page.getByRole('tablist', { name: 'The Three Doors' });
      await doors.getByRole('tab').nth(1).click();
      assert.equal(await doors.getByRole('tab').nth(1).getAttribute('aria-selected'), 'true');
      const ranks = page.getByRole('group', { name: 'Ranks', exact: true });
      await ranks.getByRole('button').nth(1).click();
      assert.equal(await ranks.getByRole('button').nth(1).getAttribute('aria-pressed'), 'true');
      const hub = page.getByRole('radiogroup', { name: 'Hub tier' });
      await hub.getByRole('radio').nth(1).click();
      assert.equal(await hub.getByRole('radio').nth(1).getAttribute('aria-checked'), 'true');
      const horses = page.locator('section[aria-labelledby="studbook-h"] button');
      await horses.nth(1).click();
      assert.equal(await horses.nth(1).getAttribute('aria-pressed'), 'true');
      await fit(page);
    }
    results.push({ scenario, pass: true, metrics });
    console.log(`${scenario}: passed`);
    await page.context().close();
  }
  for (const mode of ["reduced", "no-js"]) {
    scenario = `Homepage ${mode}`;
    const page = await open({ viewport: { width: 390, height: 844 }, ...(mode === 'reduced' ? { reducedMotion: 'reduce' } : { javaScriptEnabled: false }) });
    await page.locator('#doctrine').scrollIntoViewIfNeeded();
    await page.waitForTimeout(1500);
    await fit(page);
    assert.ok(await page.locator('#doctrine-primary').evaluate((node) => {
      const box = node.getBoundingClientRect();
      return node.contains(document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2));
    }), 'Primary heading is not covered');
    if (mode === 'reduced') assert.equal(await page.locator('[data-editorial-headline] [aria-hidden="true"]').count(), 0);
    await page.screenshot({ path: `${output}/manifesto-${mode}.png` });
    await page.locator('[data-home-final-title]').scrollIntoViewIfNeeded();
    await page.waitForTimeout(1500);
    await fit(page);
    await page.screenshot({ path: `${output}/finale-${mode}.png` });
    results.push({ scenario, pass: true });
    await page.context().close();
  }
  scenario = 'Other routes remain outside homepage typography';
  const other = await open();
  for (const route of ['/legend', '/anatomy', '/schools']) {
    await other.goto(`${base}${route}?noload`);
    assert.equal(await other.locator('[data-home-typography]').count(), 0);
  }
  await other.context().close();
  results.push({ scenario, pass: true });
  assert.deepEqual(errors, []);
  await writeFile(`${output}/results.json`, JSON.stringify({ base, date: new Date().toISOString(), results, errors, limitations: ['Chromium emulation only; no physical device/Safari/Firefox test', 'Observed CLS includes scripted scrolling and existing interactive content; no original-site performance baseline', 'No real form submissions, deployments or external AI calls'] }, null, 2));
  console.log(JSON.stringify({ passed: results.length, results, errors }, null, 2));
} catch (error) {
  await writeFile(`${output}/failure.json`, JSON.stringify({ scenario, error: String(error), results, errors }, null, 2));
  throw error;
} finally { await browser.close(); }
