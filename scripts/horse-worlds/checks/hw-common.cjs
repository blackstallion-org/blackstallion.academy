// Shared helpers for the viewer checks. The cloud browser draws with SwiftShader (software GL): the numbers it reports about
// motion, contact and layout are exact, but its frame rate says nothing about a real device.
const { chromium } = require('playwright');

// where the site runs; `HW_BASE=http://localhost:3200 node t-a11y.cjs ...` points a check at a production build (`npm run build && npm start -- -p 3200`)
const BASE = process.env.HW_BASE || 'http://localhost:3100';
const GL = ['--use-angle=swiftshader', '--use-gl=angle', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'];
const NO_GL = ['--disable-gpu', '--disable-webgl', '--disable-3d-apis', '--disable-accelerated-2d-canvas', '--disable-webgl2'];

async function open(o = {}) {
  const { w = 1440, h = 900, reduced = false, noGL = false, debug = true, dpr = 1, touch = false, scrollTo = 'viewer' } = o;
  const url = o.url || `${BASE}/anatomy${debug ? '?hwdebug=1' : ''}`;
  const browser = await chromium.launch({ args: noGL ? NO_GL : GL });
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: dpr, reducedMotion: reduced ? 'reduce' : 'no-preference', hasTouch: touch, isMobile: touch });
  const page = await ctx.newPage();
  const logs = [];
  page.on('console', (m) => { if (['error', 'warning'].includes(m.type())) logs.push(m.type() + ': ' + m.text().slice(0, 300)); });
  page.on('pageerror', (e) => logs.push('pageerror: ' + String(e).slice(0, 300)));
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 240000 });
  const box = page.locator('[data-testid=horse-worlds]').first();
  if (o.page !== 'other') {
    // pages that do not hold the places viewer (the home page, for the check that the old viewer is unchanged) are opened bare
    await box.waitFor({ timeout: 240000 });
    if (scrollTo === 'viewer') await box.evaluate((el) => el.scrollIntoView({ block: 'center' }));
  }
  if (debug && !noGL) {
    await page.waitForFunction(() => window.__horseWorlds, null, { timeout: 240000, polling: 250 });
    await page.evaluate(() => window.__horseWorlds.pause());
  }
  const run = async (seconds, dt = 1 / 60) => {
    await page.evaluate(async ({ seconds, dt }) => {
      const h = window.__horseWorlds;
      const n = Math.round(seconds / dt);
      for (let i = 0; i < n; i++) {
        h.step(dt, 1);
        if (i % 40 === 0) await new Promise((r) => setTimeout(r, 0));
      }
    }, { seconds, dt });
  };
  const tele = () => page.evaluate(() => { const c = window.__horseWorlds.controller; return c.telemetry(); });
  const choose = async (world) => {
    const cur = await page.evaluate(() => window.__horseWorlds.controller.world);
    if (cur === world) return;
    await page.locator(`[data-world-option=${world}]`).click();
    for (let k = 0; k < 600; k++) {
      await run(0.25);
      const busy = await page.evaluate(() => window.__horseWorlds.controller.busy);
      if (!busy) break;
      await page.waitForTimeout(100);
    }
  };
  const gait = async (name) => { await box.getByRole('button', { name: new RegExp('^' + name + '$', 'i') }).click(); };
  const close = async () => { await browser.close(); };
  return { browser, ctx, page, box, logs, run, tele, choose, gait, close };
}

module.exports = { open, GL, NO_GL, BASE };
