// The viewer that was already on the site before the places (the compact specimen plate in the home page's "Instrument" section:
// the same component, without the places) must still be itself: it draws, it has its three gaits, its orbit toggle and the plate
// marking, and it is not in the places mode. (The /anatomy page's own specimen plate is the still archive plate.)
// usage: node t-existing.cjs --out DIR [--w 1440 --h 900]
const fs = require('fs'); const path = require('path');
const { open, BASE } = require('./hw-common.cjs');
const a = process.argv.slice(2);
const opt = (k, d) => { const i = a.indexOf('--' + k); return i >= 0 ? a[i + 1] : d; };
const OUT = opt('out', 'existing'); const W = +opt('w', 1440), H = +opt('h', 900);
const checks = [];
const check = (name, ok, detail) => { checks.push({ name, ok: !!ok, detail }); console.log((ok ? 'PASS ' : 'FAIL ') + name + (detail !== undefined ? '  ' + JSON.stringify(detail) : '')); };

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const t = await open({ w: W, h: H, debug: false, scrollTo: 'none', page: 'other', url: BASE + '/' });
  const { page } = t;
  const section = page.locator('section[aria-labelledby=instrument-h]');
  await section.waitFor({ state: 'attached', timeout: 120000 });
  await section.evaluate((el) => el.scrollIntoView({ block: 'center' }));
  const plate = section.locator('div.cursor-grab:not([data-worlds])').first();
  await plate.waitFor({ timeout: 120000 });
  await page.waitForFunction(() => { const c = document.querySelector('section[aria-labelledby=instrument-h] div.cursor-grab canvas'); return c && c.classList.contains('opacity-100'); }, null, { timeout: 180000, polling: 300 });
  await page.waitForTimeout(1500);
  const info = await plate.evaluate((el) => ({
    inPlaces: el.hasAttribute('data-worlds'),
    gaits: [...el.querySelectorAll('[role=group][aria-label=Gait] button')].map((b) => ({ name: b.textContent.trim().toLowerCase(), pressed: b.getAttribute('aria-pressed'), disabled: b.disabled })),
    orbit: [...el.querySelectorAll('button')].map((b) => b.textContent.trim()).filter((x) => /orbit|motion reduced/i.test(x)),
    marking: /3D Specimen/.test(el.textContent),
    canvasLabel: el.querySelector('canvas').getAttribute('aria-label'),
    placeButtons: el.querySelectorAll('[data-world-option]').length,
  }));
  check('the home page viewer is not in the places mode and has no place buttons', !info.inPlaces && info.placeButtons === 0, { inPlaces: info.inPlaces, placeButtons: info.placeButtons });
  check('it still offers its three gaits: stand, walk, trot', JSON.stringify(info.gaits.map((g) => g.name)) === JSON.stringify(['stand', 'walk', 'trot']), info.gaits);
  check('it still has its orbit toggle and the "3D Specimen" plate marking', info.orbit.length === 1 && info.marking, { orbit: info.orbit, marking: info.marking });
  check('its canvas still describes a rotatable model with points to choose', /rotatable 3D model/.test(info.canvasLabel), info.canvasLabel);
  await plate.locator('[role=group][aria-label=Gait] button', { hasText: /^walk$/i }).click();
  await page.waitForTimeout(400);
  const pressed = await plate.evaluate((el) => [...el.querySelectorAll('[role=group][aria-label=Gait] button')].map((b) => b.textContent.trim().toLowerCase() + ':' + b.getAttribute('aria-pressed')));
  check('pressing walk makes it the pressed gait', pressed.includes('walk:true') && pressed.includes('stand:false'), pressed);
  await page.waitForTimeout(1500);
  const shot = path.join(OUT, `home-specimen-plate-${W}.png`);
  await plate.screenshot({ path: shot, timeout: 90000 });
  const size = fs.statSync(shot).size;
  check('the plate drew a picture (the screenshot is not a flat colour)', size > 60000, { bytes: size });
  const bad = t.logs.filter((l) => /pageerror/.test(l));
  check('no uncaught page error', bad.length === 0, bad);
  fs.writeFileSync(path.join(OUT, 'existing.json'), JSON.stringify({ checks, info }, null, 1));
  console.log(`\n${checks.filter((c) => c.ok).length}/${checks.length} checks pass`);
  if (checks.some((c) => !c.ok)) process.exitCode = 1;
  await t.close();
})().catch((e) => { console.error('FAILED', e); process.exit(1); });
