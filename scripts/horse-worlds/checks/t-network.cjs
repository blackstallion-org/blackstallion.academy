// What happens when the art of a place has not arrived yet, with the viewer's own loop running (as a visitor has it):
//   slow:   a place that is slow to download. The old place must fade out and stay out, the horse stand, the viewer say it is busy,
//           and the new place come in once it is here, with nothing half-drawn in between.
//   failed: a place whose art cannot be fetched at all. The viewer must give up cleanly: still pictures, working buttons, a message.
// usage: node t-network.cjs --out DIR [--only slow|failed] [--kbps 160] [--latency 250]
const fs = require('fs'); const path = require('path');
const { open } = require('./hw-common.cjs');
const a = process.argv.slice(2);
const opt = (k, d) => { const i = a.indexOf('--' + k); return i >= 0 ? a[i + 1] : d; };
const OUT = opt('out', 'network'); const ONLY = opt('only', null); const KBPS = +opt('kbps', 160), LAT = +opt('latency', 250);
const checks = [];
const check = (name, ok, detail) => { checks.push({ name, ok: !!ok, detail }); console.log((ok ? 'PASS ' : 'FAIL ') + name + (detail !== undefined ? '  ' + JSON.stringify(detail) : '')); };

async function slow() {
  console.log(`--- slow download (${KBPS} KB/s, ${LAT} ms latency)`);
  const t = await open({ w: 1440, h: 900 });
  const { page, box, ctx } = t;
  await t.run(1.0);
  const cdp = await ctx.newCDPSession(page);
  await cdp.send('Network.enable');
  await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: LAT, downloadThroughput: KBPS * 1024, uploadThroughput: 64 * 1024 });
  const timeline = [];
  const t0 = Date.now();
  await page.locator('[data-world-option=village]').click();
  let shot = false;
  // the page's own loop is paused: step the simulation a fixed 1/30 s at a time while real time (and the download) goes by
  for (let i = 0; i < 2000; i++) {
    const s = await page.evaluate(() => {
      const h = window.__horseWorlds, c = h.controller; h.step(1 / 30, 1);
      const sw = document.querySelector('[data-world-option]').parentElement;
      return { world: c.world, phase: c.tm.phase, fade: +c.tm.fade.toFixed(3), busy: c.busy, speed: +c.treadmill.loco.speed.toFixed(2), ariaBusy: sw.getAttribute('aria-busy'), shown: document.querySelector('[role=status]').dataset.shown };
    });
    timeline.push({ ms: Date.now() - t0, ...s });
    if (!shot && s.phase === 'load' && timeline.filter((r) => r.phase === 'load').length > 12 && Date.now() - t0 > 3500) {
      await page.evaluate(() => window.__horseWorlds.draw()); await page.waitForTimeout(120);
      await box.screenshot({ path: path.join(OUT, 'slow-during-load.png'), timeout: 90000 }); shot = true;
    }
    if (!s.busy && i > 10 && s.world === 'village') break;
    await page.waitForTimeout(100);
  }
  await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 0, downloadThroughput: -1, uploadThroughput: -1 });
  await t.run(1.5);
  const end = await page.evaluate(() => { const c = window.__horseWorlds.controller; return { world: c.world, phase: c.tm.phase, fade: +c.tm.fade.toFixed(3), busy: c.busy }; });
  const phases = timeline.map((r) => r.phase).filter((p, i, arr) => i === 0 || p !== arr[i - 1]);
  const loadRows = timeline.filter((r) => r.phase === 'load');
  const loadMs = loadRows.length ? loadRows[loadRows.length - 1].ms - loadRows[0].ms : 0;
  console.log('phases seen:', phases.join(' > '), '| total ms', timeline[timeline.length - 1].ms, '| held in load for', loadMs, 'ms (', loadRows.length, 'steps )');
  check('the switch went through out, load and in, in that order', JSON.stringify(phases.filter((p) => p !== 'idle')) === JSON.stringify(['out', 'load', 'in']), phases);
  check('it waited in the load phase for the art (a real wait, not a flicker)', loadRows.length > 12, { steps: loadRows.length, ms: loadMs });
  check('while the art was downloading the old place stayed faded out (no flash back, nothing half-drawn)', loadRows.length > 3 && loadRows.every((r) => r.fade < 0.02), { maxFade: Math.max(...loadRows.map((r) => r.fade)) });
  check('the switcher said it was busy for the whole switch', timeline.filter((r) => r.phase !== 'idle').every((r) => r.busy) && timeline.filter((r) => r.phase === 'load').slice(2).every((r) => r.ariaBusy === 'true'), { sample: loadRows[3] && loadRows[3].ariaBusy });
  const sw = timeline.filter((r) => r.phase === 'out' || r.phase === 'load');
  const rises = sw.filter((r, i) => i > 0 && r.speed > sw[i - 1].speed + 0.02).length;
  const lastLoad = loadRows.slice(-5);
  check('the horse only slowed while it waited (never sped up), and was standing by the end of a long wait', rises === 0 && (loadRows.length < 40 || lastLoad.every((r) => r.speed === 0)), { speedUps: rises, speedAtEndOfLoad: lastLoad.map((r) => r.speed) });
  check('the village came in and the viewer is idle again', end.world === 'village' && !end.busy && end.fade > 0.99, end);
  await page.evaluate(() => window.__horseWorlds.draw()); await page.waitForTimeout(120);
  await box.screenshot({ path: path.join(OUT, 'slow-after.png'), timeout: 90000 });
  const noise = t.logs.filter((l) => !/hydrat/i.test(l));
  if (noise.length) console.log('console:', noise.join('\n'));
  fs.writeFileSync(path.join(OUT, 'slow-timeline.json'), JSON.stringify(timeline));
  await t.close();
}

async function failed() {
  console.log('--- the art of a place cannot be fetched');
  const t = await open({ w: 1440, h: 900 });
  const { page, box, ctx } = t;
  await page.evaluate(() => window.__horseWorlds.pause(false));
  await page.waitForTimeout(1500);
  await ctx.route('**/images/horse-worlds/village/**', (r) => r.abort());
  await page.locator('[data-world-option=village]').click();
  await page.waitForFunction(() => /3D view is unavailable/.test(document.body.innerText), null, { timeout: 60000, polling: 300 }).catch(() => {});
  const text = await page.evaluate(() => document.body.innerText);
  check('the viewer gave up cleanly and says the 3D view is unavailable', /3D view is unavailable/.test(text));
  check('there is no canvas left in the viewer', (await box.locator('canvas').count()) === 0);
  // the still is fetched when the fallback appears: give it a moment to arrive before judging it
  await page.waitForFunction(() => { const i = document.querySelector('[data-testid=horse-worlds] img'); return i && i.complete && i.naturalWidth > 0; }, null, { timeout: 20000, polling: 200 }).catch(() => {});
  const img = await box.locator('img').first().evaluate((e) => ({ alt: e.alt, w: e.naturalWidth, complete: e.complete })).catch(() => null);
  check('a still of the place that was asked for is shown, with a description', img && img.complete && img.w > 0 && /village/i.test(img.alt), img);
  const pressed = await page.locator('[data-world-option=village]').getAttribute('aria-pressed');
  check('the Village button still shows it is chosen and the buttons still work', pressed === 'true');
  await page.locator('[data-world-option=field]').click();
  await page.waitForTimeout(500);
  const img2 = await box.locator('img').first().evaluate((e) => ({ alt: e.alt, w: e.naturalWidth })).catch(() => null);
  check('choosing another place swaps the still', img2 && /paddock/i.test(img2.alt) && img2.w > 0, img2);
  await box.screenshot({ path: path.join(OUT, 'failed-fallback.png'), timeout: 90000 });
  const bad = t.logs.filter((l) => /pageerror/.test(l));
  check('no uncaught page error', bad.length === 0, bad);
  await t.close();
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  if (!ONLY || ONLY === 'slow') await slow();
  if (!ONLY || ONLY === 'failed') await failed();
  fs.writeFileSync(path.join(OUT, 'network.json'), JSON.stringify({ checks }, null, 1));
  console.log(`\n${checks.filter((c) => c.ok).length}/${checks.length} checks pass`);
  if (checks.some((c) => !c.ok)) process.exitCode = 1;
})().catch((e) => { console.error('FAILED', e); process.exit(1); });
