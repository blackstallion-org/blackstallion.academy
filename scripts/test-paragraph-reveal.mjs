import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { writeFile, mkdir } from "node:fs/promises";
const { chromium } = await import(process.env.BSAH_PLAYWRIGHT_MODULE || "playwright");
const output = "output/engineering/paragraph-reveal";
await mkdir(output, { recursive: true });
const server = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "-p", "3114"], { stdio: "ignore" });
const browser = await chromium.launch({ channel: "chrome", headless: true });
const results = [], errors = [];
try {
  for (let attempt = 0; attempt < 80; attempt++) { try { if ((await fetch("http://localhost:3114")).ok) break; } catch {} await new Promise((resolve) => setTimeout(resolve, 150)); }
  for (const width of [390, 1440]) {
    const page = await browser.newPage({ viewport: { width, height: 900 } }); page.on("pageerror", (error) => errors.push(error.message));
    await page.goto("http://localhost:3114/?noload", { waitUntil: "load" });
    const paragraph = page.locator("p[data-scroll-text-reveal]").first();
    const original = await paragraph.innerText();
    const position = await paragraph.evaluate((element) => ({ top: element.getBoundingClientRect().top + scrollY, height: element.offsetHeight }));
    const scroll = async (top) => { await page.evaluate((value) => scrollTo({ top: value, behavior: "instant" }), top); await page.waitForTimeout(800); };
    const opacity = () => paragraph.locator("[data-text-reveal-unit]").evaluateAll((nodes) => nodes.map((node) => Number(getComputedStyle(node).opacity)));
    await scroll(position.top - 900 * 0.97); const before = await opacity(); assert.ok(before.every((value) => value < 0.5));
    const start = position.top - 900 * 0.92, end = position.top + position.height - 900 * 0.65;
    await scroll((start + end) / 2); const middle = await opacity(); assert.ok(middle[0] > 0.99 && middle.at(-1) < 0.5 && middle.some((value) => value > 0.36 && value < 0.99));
    await page.screenshot({ path: `${output}/progress-${width}.png` });
    await scroll(position.top + position.height - 900 * 0.58); const after = await opacity(); assert.ok(after.every((value) => value > 0.99));
    const typography = await paragraph.evaluate((element) => { const p = getComputedStyle(element), word = getComputedStyle(element.querySelector("span")); return { font: p.fontFamily, size: p.fontSize, wordFont: word.fontFamily, wordSize: word.fontSize, overflow: document.documentElement.scrollWidth > innerWidth + 1 }; });
    assert.equal(typography.font, typography.wordFont); assert.equal(typography.size, typography.wordSize); assert.equal(typography.overflow, false); assert.equal(await paragraph.innerText(), original);
    await page.screenshot({ path: `${output}/revealed-${width}.png` });
    await scroll(position.top - 900 * 0.97); assert.ok((await opacity()).every((value) => value < 0.5));
    await paragraph.evaluate((element) => { element.tabIndex = 0; element.focus({ preventScroll: true }); }); assert.ok((await opacity()).every((value) => value === 1));
    await paragraph.evaluate((element) => { element.blur(); element.removeAttribute("tabindex"); });
    await page.emulateMedia({ media: "print" }); assert.ok((await opacity()).every((value) => value === 1)); await page.emulateMedia({ media: "screen" });
    await page.locator('footer a[href="/legend"]').click(); await page.waitForURL("**/legend"); await page.locator("p[data-scroll-text-reveal]").first().waitFor();
    await page.goBack(); await page.waitForURL("**/?noload"); assert.ok(await page.locator("p[data-scroll-text-reveal]").count());
    results.push({ width, forwardReveal: true, backwardScrub: true, typographyPreserved: true, textPreserved: true, overflow: false, routeCleanup: true }); await page.close();
  }
  const reduced = await browser.newPage({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce" });
  await reduced.goto("http://localhost:3114/anatomy?noload", { waitUntil: "load" }); assert.ok(await reduced.locator("[data-text-reveal-unit]").count());
  assert.equal(await reduced.locator("[data-text-reveal-unit]").evaluateAll((nodes) => nodes.every((node) => getComputedStyle(node).opacity === "1")), true);
  results.push({ reducedMotion: true, allTextImmediatelyReadable: true }); await reduced.close();
  const plain = await browser.newPage({ javaScriptEnabled: false }); await plain.goto("http://localhost:3114/?noload", { waitUntil: "domcontentloaded" });
  assert.ok(await plain.locator("p[data-scroll-text-reveal]").first().innerText()); results.push({ noJavaScriptContent: true }); await plain.close();
  assert.deepEqual(errors, []);
} finally {
  await writeFile(`${output}/results.json`, JSON.stringify({ date: new Date().toISOString(), results, errors, limitations: "Chromium desktop/mobile emulation; physical devices not tested" }, null, 2));
  await browser.close(); server.kill("SIGTERM");
}
console.log("PASS: word reveal, reverse scroll, inherited typography, content, route cleanup, reduced motion and no-JS fallback.");
