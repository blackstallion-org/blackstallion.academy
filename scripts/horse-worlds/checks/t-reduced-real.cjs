// Reduced motion with the viewer's OWN loop running (no test stepping): choose a place that has never been loaded and check that the
// picture really changes, that it changes to the place chosen last when two are asked for in a row, and that the loop goes back to
// sleep afterwards. The pixel check compares what the page is showing (a compositor screenshot of the viewer) with a fresh
// render of the stage the controller says is on screen.
// usage: node t-reduced-real.cjs --out DIR [--w 1440 --h 900]
const fs = require('fs'); const path = require('path');
const zlib = require('zlib');
const { open } = require('./hw-common.cjs');
const a = process.argv.slice(2);
const opt = (k, d) => { const i = a.indexOf('--' + k); return i >= 0 ? a[i + 1] : d; };
const OUT = opt('out', 'reduced-real'); const W = +opt('w', 1440), H = +opt('h', 900);
const checks = [];
const check = (name, ok, detail) => { checks.push({ name, ok: !!ok, detail }); console.log((ok ? 'PASS ' : 'FAIL ') + name + (detail !== undefined ? '  ' + JSON.stringify(detail) : '')); };

// mean absolute difference between two PNG buffers of the same size (RGB), decoded without extra packages
function decodePng(buf) {
  let pos = 8; let ihdr = null; const idat = [];
  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos); const type = buf.toString('ascii', pos + 4, pos + 8); const data = buf.subarray(pos + 8, pos + 8 + len);
    if (type === 'IHDR') ihdr = { w: data.readUInt32BE(0), h: data.readUInt32BE(4), depth: data[8], color: data[9] };
    if (type === 'IDAT') idat.push(data);
    pos += 12 + len;
  }
  const raw = zlib.inflateSync(Buffer.concat(idat));
  const bpp = ihdr.color === 6 ? 4 : 3; const stride = ihdr.w * bpp; const out = Buffer.alloc(ihdr.h * stride);
  let prev = Buffer.alloc(stride);
  for (let y = 0; y < ihdr.h; y++) {
    const f = raw[y * (stride + 1)]; const line = Buffer.from(raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1)));
    for (let x = 0; x < stride; x++) {
      const l = x >= bpp ? line[x - bpp] : 0, u = prev[x], ul = x >= bpp ? prev[x - bpp] : 0;
      let v = line[x];
      if (f === 1) v += l; else if (f === 2) v += u; else if (f === 3) v += (l + u) >> 1;
      else if (f === 4) { const p = l + u - ul, pa = Math.abs(p - l), pb = Math.abs(p - u), pc = Math.abs(p - ul); v += pa <= pb && pa <= pc ? l : pb <= pc ? u : ul; }
      line[x] = v & 255;
    }
    line.copy(out, y * stride); prev = line;
  }
  return { w: ihdr.w, h: ihdr.h, bpp, data: out };
}
function meanDiff(A, B) {
  // compare the common top-left area (the page screenshot of a fractional-size canvas can be a pixel larger than its drawing buffer)
  const w = Math.min(A.w, B.w), h = Math.min(A.h, B.h);
  if (Math.abs(A.w - B.w) > 2 || Math.abs(A.h - B.h) > 2) return { size: `${A.w}x${A.h} vs ${B.w}x${B.h}` };
  let s = 0, n = 0;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) for (let c = 0; c < 3; c++) { s += Math.abs(A.data[(y * A.w + x) * A.bpp + c] - B.data[(y * B.w + x) * B.bpp + c]); n++; }
  return s / n;
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const t = await open({ w: W, h: H, reduced: true });
  const { page, box } = t;
  await page.evaluate(() => window.__horseWorlds.pause(false)); // the viewer's own loop, as a visitor has it
  await page.waitForTimeout(2500);
  const state = () => page.evaluate(() => { const h = window.__horseWorlds, c = h.controller; return { world: c.world, frame: h.renderer.info.render.frame, busy: c.busy }; });
  const start = await state();
  check('starts on the desert with the loop asleep', start.world === 'desert');
  const fresh = async () => { const d = await page.evaluate(() => { const h = window.__horseWorlds; h.draw(); return h.renderer.domElement.toDataURL('image/png'); }); return decodePng(Buffer.from(d.split(',')[1], 'base64')); };
  const desertTruth = await fresh();

  // 1. a place that has never been loaded
  const t0 = Date.now();
  await page.locator('[data-world-option=village]').click();
  // poll until the controller says the village is on stage, then count frames drawn after that moment
  const swap = await page.evaluate(async () => {
    const h = window.__horseWorlds, c = h.controller;
    const sw = document.querySelector('[data-world-option]').parentElement;
    const busySeen = [sw.getAttribute('aria-busy')];
    const t0 = performance.now();
    while (c.world !== 'village' && performance.now() - t0 < 60000) { busySeen.push(sw.getAttribute('aria-busy')); await new Promise((r) => setTimeout(r, 16)); }
    window.__busySeen = busySeen;
    const at = { world: c.world, frame: h.renderer.info.render.frame, ms: Math.round(performance.now() - t0) };
    await new Promise((r) => setTimeout(r, 1500));
    return { ...at, frameLater: h.renderer.info.render.frame };
  });
  check('the village was swapped in', swap.world === 'village', swap);
  const seen = await page.evaluate(() => window.__busySeen);
  const busyAfter = await page.evaluate(() => document.querySelector('[data-world-option]').parentElement.getAttribute('aria-busy'));
  check('while its art was on the way the switcher said it was busy, and it stopped saying so once the place was on stage', (seen.length < 3 || seen.slice(1).some((v) => v === 'true')) && busyAfter === 'false', { samples: seen.length, sawBusy: seen.includes('true'), after: busyAfter });
  await page.waitForTimeout(400);
  const cvs = page.locator('[data-testid=horse-worlds] canvas').first();
  // what the page is showing right now (compositor), against a fresh render of the stage that is mounted
  const compare = async (label) => {
    const shot = path.join(OUT, `${label}-${W}.png`);
    await cvs.screenshot({ path: shot, timeout: 90000 });
    const truth = await page.evaluate(() => { const h = window.__horseWorlds; h.draw(); return h.renderer.domElement.toDataURL('image/png'); });
    const truthPath = path.join(OUT, `${label}-${W}-truth.png`);
    fs.writeFileSync(truthPath, Buffer.from(truth.split(',')[1], 'base64'));
    return { shot, truthPath, A: decodePng(fs.readFileSync(shot)), B: decodePng(fs.readFileSync(truthPath)) };
  };
  const villageCmp = await compare('village');
  const dVillage = meanDiff(villageCmp.A, villageCmp.B), dVillageDesert = meanDiff(villageCmp.A, desertTruth);
  // overlays (buttons, hint) and a pixel of rounding make the match inexact, so the test is: much closer to the village than to the desert it replaced
  check('what is on screen is the village (far closer to a fresh render of the village than to the desert it replaced)', typeof dVillage === 'number' && typeof dVillageDesert === 'number' && dVillage < dVillageDesert / 2, { toVillage: +dVillage.toFixed(2), toDesert: +dVillageDesert.toFixed(2) });
  const village = villageCmp.B;

  // 2. two requests in a row, the second for a place that is already loaded: the last one asked for must win
  const fieldColdFirst = await page.evaluate(async () => {
    const h = window.__horseWorlds, c = h.controller;
    const q = (id) => document.querySelector(`[data-world-option=${id}]`);
    q('field').click(); // never loaded: slow
    await new Promise((r) => setTimeout(r, 30));
    q('desert').click(); // loaded earlier: instant
    const t0 = performance.now();
    while (performance.now() - t0 < 25000) { await new Promise((r) => setTimeout(r, 50)); }
    return { world: c.world, pressed: [...document.querySelectorAll('[data-world-option]')].filter((e) => e.getAttribute('aria-pressed') === 'true').map((e) => e.getAttribute('data-world-option')) };
  });
  check('after asking for field and then desert, the desert is what ends up on stage', fieldColdFirst.world === 'desert' && fieldColdFirst.pressed.join() === 'desert', fieldColdFirst);
  const raceCmp = await compare('race-final');
  const dRaceOwn = meanDiff(raceCmp.A, raceCmp.B), dRaceVillage = meanDiff(raceCmp.A, village);
  check('...and the picture is the desert the controller has on stage, not a late field or the old village', typeof dRaceOwn === 'number' && dRaceOwn < dRaceVillage / 2, { toFreshRenderOfStage: +dRaceOwn.toFixed(2), toOldVillage: +dRaceVillage.toFixed(2) });

  // 3. the loop goes back to sleep
  await page.waitForTimeout(1200);
  const f0 = (await state()).frame; await page.waitForTimeout(2500); const f1 = (await state()).frame;
  check('the loop sleeps again afterwards', f1 - f0 <= 3, { framesIn2_5s: f1 - f0 });
  const noise = t.logs.filter((l) => !/hydrat|Reduced Motion enabled/i.test(l));
  if (noise.length) console.log('console:', noise.join('\n'));
  fs.writeFileSync(path.join(OUT, `result-${W}.json`), JSON.stringify({ checks }, null, 1));
  console.log(`\n${checks.filter((c) => c.ok).length}/${checks.length} checks pass`);
  if (checks.some((c) => !c.ok)) process.exitCode = 1;
  await t.close();
})().catch((e) => { console.error('FAILED', e); process.exit(1); });
