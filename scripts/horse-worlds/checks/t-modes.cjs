// Reduced motion (the horse stands still, places change without a fade, the loop sleeps) and no WebGL (stills + working buttons).
// usage: node t-modes.cjs --out DIR [--w 1440 --h 900] [--only reduced|nogl]
const fs = require('fs'); const path = require('path');
const { open } = require('./hw-common.cjs');
const a = process.argv.slice(2);
const opt = (k, d) => { const i = a.indexOf('--' + k); return i >= 0 ? a[i + 1] : d; };
const OUT = opt('out', 'modes-out'); const W = +opt('w', 1440), H = +opt('h', 900); const ONLY = opt('only', null);
const checks = [];
const check = (name, ok, detail) => { checks.push({ name, ok: !!ok, detail }); console.log((ok ? 'PASS ' : 'FAIL ') + name + (detail !== undefined ? '  ' + JSON.stringify(detail) : '')); };

async function frames(page, ms) {
  return page.evaluate(async (ms) => {
    const h = window.__horseWorlds; const r = h.renderer;
    const f0 = r.info.render.frame; await new Promise((res) => setTimeout(res, ms)); return r.info.render.frame - f0;
  }, ms);
}

async function reduced() {
  console.log('--- reduced motion');
  const t = await open({ w: W, h: H, reduced: true });
  const { page, box } = t;
  const note = await page.locator('text=/Motion is reduced/').count();
  check('the page says motion is reduced and the scene changes without a transition', note >= 1);
  const gaitBtns = await box.locator('button').evaluateAll((els) => els.filter((e) => /^(stand|walk|trot|canter|gallop)$/i.test(e.textContent.trim())).map((e) => ({ n: e.textContent.trim(), disabled: e.disabled })));
  check('the gait buttons are switched off (the horse stands still)', gaitBtns.length >= 3 && gaitBtns.every((b) => b.disabled), gaitBtns);
  const placeBtns = await page.locator('[data-world-option]').evaluateAll((els) => els.map((e) => e.disabled));
  check('the three place buttons still work', placeBtns.length === 3 && placeBtns.every((d) => !d), placeBtns);
  // the viewer's own loop sleeps when nothing is moving
  await page.evaluate(() => window.__horseWorlds.pause(false));
  await page.waitForTimeout(1500);
  const idleFrames = await frames(page, 2500);
  check('with reduced motion the viewer draws almost nothing while idle', idleFrames <= 3, { framesIn2_5s: idleFrames });
  await page.evaluate(() => window.__horseWorlds.pause(true));
  // choose Village: no fade, no travel
  const before = await page.evaluate(() => { const c = window.__horseWorlds.controller; return { world: c.world, d: c.treadmill.distance }; });
  await page.locator('[data-world-option=village]').click();
  const series = await page.evaluate(async () => {
    const h = window.__horseWorlds, c = h.controller; const out = [];
    for (let i = 0; i < 60 * 8; i++) {
      h.step(1 / 60, 1);
      out.push({ i, world: c.world, fade: c.tm.fade, busy: c.busy, phase: c.tm.phase, speed: c.treadmill.loco.speed, gs: c.treadmill.groundSpeed, d: c.treadmill.distance, settled: c.rig.settled });
      if (i % 30 === 0) await new Promise((r) => setTimeout(r, 0));
      if (c.world === 'village' && i > 20) break;
      if (i % 20 === 0) await new Promise((r) => setTimeout(r, 40));
    }
    return out;
  });
  const last = series[series.length - 1];
  check('Village appears (the new place is on screen)', last.world === 'village', { frames: series.length });
  check('...with no fade out or in: the picture never dips', Math.min(...series.map((f) => f.fade)) >= 0.999 && series.every((f) => !f.busy), { minFade: Math.min(...series.map((f) => f.fade)), everBusy: series.some((f) => f.busy) });
  check('...and the horse stays still: no speed, no scroll', series.every((f) => f.speed === 0 && f.gs === 0) && Math.abs(last.d - before.d) < 1e-9, { distanceMoved: last.d - before.d });
  await t.run(1.5);
  const still = await page.evaluate(() => { const c = window.__horseWorlds.controller; return { world: c.world, gait: c.gait, settled: c.rig.settled, d: c.treadmill.distance }; });
  check('the camera is on its mark (snapped, not travelling) and the gait is stand', still.settled && still.gait === 'stand', still);
  const pressed = await page.locator('[data-world-option=village]').getAttribute('aria-pressed');
  check('the Village button shows it is chosen', pressed === 'true');
  await page.evaluate(() => window.__horseWorlds.draw()); // the viewer's own loop is paused here: draw what the controller has on stage
  await page.waitForTimeout(150);
  await box.screenshot({ path: path.join(OUT, `reduced-village-${W}.png`), timeout: 90000 });
  await page.locator('[data-world-option=field]').click(); await t.run(1.0); await page.waitForTimeout(300); await t.run(1.0);
  const w2 = await page.evaluate(() => window.__horseWorlds.controller.world);
  check('another place can be chosen, again without a fade', w2 === 'field', w2);
  await page.evaluate(() => window.__horseWorlds.draw());
  await page.waitForTimeout(150);
  await box.screenshot({ path: path.join(OUT, `reduced-field-${W}.png`), timeout: 90000 });
  const noise = t.logs.filter((l) => !/hydrat/i.test(l));
  if (noise.length) console.log('console:', noise.join('\n'));
  await t.close();
  // the same measurement with motion allowed, to show the loop is awake there. Software GL compiles shaders slowly and a change of
  // quality tier in the middle of a window can stall it for a second, so count frames over a longer window instead of expecting a rate.
  const n = await open({ w: W, h: H, reduced: false });
  await n.page.evaluate(() => window.__horseWorlds.pause(false));
  await n.page.waitForTimeout(2000);
  const awake = await frames(n.page, 6000);
  check('with motion allowed the loop draws steadily (for comparison)', awake >= idleFrames + 3, { framesIn6s: awake, framesIdleReducedIn2_5s: idleFrames });
  await n.close();
}

async function noGL() {
  console.log('--- no WebGL');
  const t = await open({ w: W, h: H, noGL: true, debug: false });
  const { page, box } = t;
  await page.waitForFunction(() => /3D view is unavailable/.test(document.body.innerText), null, { timeout: 90000, polling: 500 });
  check('the page says the 3D view is unavailable and shows a still instead', true);
  check('there is no canvas in the viewer', (await box.locator('canvas').count()) === 0);
  const imgOk = async () => box.locator('img').first().evaluate((e) => ({ alt: e.alt, w: e.naturalWidth, h: e.naturalHeight, complete: e.complete }));
  let img = await imgOk();
  check('the desert still has loaded and describes itself', img.complete && img.w > 0 && /Marwar flats/.test(img.alt), img);
  await box.screenshot({ path: path.join(OUT, `nogl-desert-${W}.png`), timeout: 90000 });
  for (const [id, title] of [['field', /home paddock/], ['village', /lane in the village/], ['desert', /Marwar flats/]]) {
    await page.locator(`[data-world-option=${id}]`).click();
    await page.waitForTimeout(500);
    img = await imgOk();
    const pressed = await page.locator(`[data-world-option=${id}]`).getAttribute('aria-pressed');
    const h3 = await box.locator('xpath=following-sibling::div//h3').first().innerText();
    const status = await page.locator('[role=status]').innerText();
    check(`${id}: the still, its description, the heading and the live message all change`, pressed === 'true' && title.test(img.alt) && title.test(h3) && /Now showing/.test(status) && img.w > 0, { alt: img.alt, h3, status });
    if (id !== 'desert') await box.screenshot({ path: path.join(OUT, `nogl-${id}-${W}.png`), timeout: 90000 });
  }
  const noise = t.logs.filter((l) => !/hydrat/i.test(l));
  console.log('console during fallback (' + noise.length + '):', noise.slice(0, 6).join(' | '));
  results.noGlConsole = noise;
  await t.close();
}

const results = {};
(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  if (!ONLY || ONLY === 'reduced') await reduced();
  if (!ONLY || ONLY === 'nogl') await noGL();
  fs.writeFileSync(path.join(OUT, `modes-${W}.json`), JSON.stringify({ checks, results }, null, 1));
  const failed = checks.filter((c) => !c.ok);
  console.log(`\n${checks.length - failed.length}/${checks.length} checks pass`);
  if (checks.some((c) => !c.ok)) process.exitCode = 1;
})().catch((e) => { console.error('FAILED', e); process.exit(1); });
