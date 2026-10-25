// Keyboard, names, roles and live regions of the place buttons and the viewer's other controls; focus ring; one canvas; and that
// neither scrolling nor the mouse wheel ever changes the place. usage: node t-a11y.cjs --out DIR [--w 1440 --h 900]
const fs = require('fs'); const path = require('path');
const { open } = require('./hw-common.cjs');
const a = process.argv.slice(2);
const opt = (k, d) => { const i = a.indexOf('--' + k); return i >= 0 ? a[i + 1] : d; };
const OUT = opt('out', 'a11y-out'); const W = +opt('w', 1440), H = +opt('h', 900);
const results = {}; const checks = [];
const check = (name, ok, detail) => { checks.push({ name, ok: !!ok, detail }); console.log((ok ? 'PASS ' : 'FAIL ') + name + (detail !== undefined ? '  ' + JSON.stringify(detail) : '')); };

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const t = await open({ w: W, h: H });
  const { page, box } = t;
  const group = page.locator('[data-testid=horse-worlds] [role=group][aria-label="Choose a place"]');
  const btn = (w) => page.locator(`[data-world-option=${w}]`);
  const state = () => page.evaluate(() => {
    const c = window.__horseWorlds.controller;
    return {
      world: c.world, busy: c.busy,
      pressed: Object.fromEntries([...document.querySelectorAll('[data-world-option]')].map((e) => [e.dataset.worldOption, e.getAttribute('aria-pressed')])),
      focus: document.activeElement && (document.activeElement.dataset.worldOption || document.activeElement.getAttribute('aria-label') || document.activeElement.textContent.trim().slice(0, 20)),
      groupBusy: document.querySelector('[role=group][aria-label="Choose a place"]')?.getAttribute('aria-busy'),
      status: document.querySelector('[role=status]')?.textContent,
    };
  });
  const settle = async () => { for (let k = 0; k < 80; k++) { await t.run(0.25); if (!(await state()).busy) break; await page.waitForTimeout(80); } };

  // --- structure, names, roles
  const buttons = await page.evaluate(() => [...document.querySelectorAll('[data-testid=horse-worlds] button')].map((e) => ({ name: (e.getAttribute('aria-label') || e.textContent || '').trim(), tag: e.tagName, type: e.type, pressed: e.getAttribute('aria-pressed'), disabled: e.disabled, tabindex: e.tabIndex, w: Math.round(e.getBoundingClientRect().width), h: Math.round(e.getBoundingClientRect().height) })));
  results.buttons = buttons;
  check('the viewer has a labelled group "Choose a place" holding three buttons', (await group.count()) === 1 && (await group.locator('button').count()) === 3);
  check('every button has a name and is a real <button>', buttons.every((b) => b.name && b.tag === 'BUTTON'), buttons.map((b) => b.name));
  check('every button is in the tab order', buttons.every((b) => b.tabindex >= 0));
  check('place buttons are at least 44 px tall (touch target)', (await page.evaluate(() => [...document.querySelectorAll('[data-world-option]')].every((e) => e.getBoundingClientRect().height >= 44))));
  check('exactly one canvas in the viewer', (await box.locator('canvas').count()) === 1, await box.locator('canvas').count());
  check('exactly one WebGL canvas on the whole page', (await page.locator('canvas').count()) === 1, await page.locator('canvas').count());
  let s = await state();
  check('Desert is pressed at the start, the others are not', s.pressed.desert === 'true' && s.pressed.field === 'false' && s.pressed.village === 'false', s.pressed);

  // --- keyboard: arrows move focus without choosing; Enter / Space choose
  await btn('desert').focus();
  await page.keyboard.press('ArrowRight');
  s = await state();
  check('ArrowRight moves focus to Horse Field and does not change the place', s.focus === 'field' && s.world === 'desert' && s.pressed.field === 'false', { focus: s.focus, world: s.world });
  await page.keyboard.press('End'); s = await state();
  check('End moves focus to Village', s.focus === 'village', s.focus);
  await page.keyboard.press('Home'); s = await state();
  check('Home moves focus to Desert', s.focus === 'desert', s.focus);
  await page.keyboard.press('ArrowLeft'); s = await state();
  check('ArrowLeft from Desert wraps to Village', s.focus === 'village', s.focus);
  await page.keyboard.press('ArrowDown'); s = await state();
  check('ArrowDown from Village wraps to Desert', s.focus === 'desert', s.focus);
  await page.keyboard.press('ArrowUp'); s = await state();
  check('ArrowUp from Desert wraps to Village', s.focus === 'village', s.focus);

  // focus ring (keyboard focus): drawn, 2 px or more, with an offset
  await btn('field').focus(); await page.keyboard.press('ArrowLeft'); await page.keyboard.press('ArrowRight');
  const ring = await page.evaluate(() => { const e = document.activeElement; const cs = getComputedStyle(e); return { which: e.dataset.worldOption, focusVisible: e.matches(':focus-visible'), style: cs.outlineStyle, width: cs.outlineWidth, offset: cs.outlineOffset, color: cs.outlineColor }; });
  results.focusRing = ring;
  check('the focused place button shows a visible focus ring (:focus-visible, solid, >= 2px)', ring.focusVisible && ring.style !== 'none' && parseFloat(ring.width) >= 2, ring);
  await group.screenshot({ path: path.join(OUT, 'focus-ring-switcher.png') });
  const ring2 = await (async () => { await box.getByRole('button', { name: /^walk$/i }).focus(); await page.keyboard.press('Shift+Tab'); await page.keyboard.press('Tab'); return page.evaluate(() => { const e = document.activeElement; const cs = getComputedStyle(e); return { which: e.textContent.trim(), focusVisible: e.matches(':focus-visible'), style: cs.outlineStyle, width: cs.outlineWidth }; }); })();
  results.focusRingGait = ring2;
  check('the focused gait button shows a visible focus ring', ring2.focusVisible && ring2.style !== 'none' && parseFloat(ring2.width) >= 2, ring2);
  await box.screenshot({ path: path.join(OUT, 'focus-ring-gait.png') });

  // Enter chooses; busy is announced while it runs; the live region speaks after the fade
  await btn('village').focus(); await page.keyboard.press('Enter');
  await page.waitForTimeout(100);
  await t.run(0.1); // the harness holds the viewer's own loop, so give it a few frames to take the request
  await page.waitForTimeout(150);
  s = await state();
  check('Enter on Village starts a switch: aria-busy on the group and Village pressed', s.groupBusy === 'true' && s.pressed.village === 'true', { groupBusy: s.groupBusy, pressed: s.pressed });
  const during = await page.evaluate(async () => { const h = window.__horseWorlds; let n = 0; for (let i = 0; i < 4; i++) { h.step(1 / 60, 8); n++; } return window.__horseWorlds.controller.busy; });
  check('the viewer is busy during the fade', during === true);
  await settle();
  await page.waitForTimeout(250);
  s = await state();
  check('after the fade the viewer shows the Village, the group is no longer busy', s.world === 'village' && s.groupBusy === 'false', { world: s.world, groupBusy: s.groupBusy });
  check('a polite live region says which place is now shown', /village/i.test(s.status || ''), s.status);
  const live = await page.evaluate(() => { const e = document.querySelector('[role=status]'); return { live: e.getAttribute('aria-live'), srOnly: e.className }; });
  check('the live region is polite', live.live === 'polite', live);
  await btn('desert').focus(); await page.keyboard.press('Space');
  await page.waitForTimeout(150); await settle(); await page.waitForTimeout(250);
  s = await state();
  check('Space on Desert chooses it', s.world === 'desert' && s.pressed.desert === 'true' && /desert/i.test(s.status || ''), { world: s.world, status: s.status });
  // pressing the place already shown does nothing
  await btn('desert').click(); await page.waitForTimeout(150); s = await state();
  check('pressing the place already shown starts nothing', s.busy === false, s.busy);

  // --- the place never changes by scrolling or the wheel
  await t.run(7); // let the horse and the camera come to rest after the switch first
  const before = await page.evaluate(() => { const c = window.__horseWorlds.controller; return { world: c.world, dist: c.rig.distance, az: c.rig.azimuth, settled: c.rig.settled }; });
  const rect = await box.boundingBox();
  await page.mouse.move(rect.x + rect.width / 2, rect.y + rect.height / 2);
  for (let i = 0; i < 4; i++) { await page.mouse.wheel(0, 700); await page.waitForTimeout(120); }
  for (let i = 0; i < 4; i++) { await page.mouse.wheel(0, -700); await page.waitForTimeout(120); }
  await page.evaluate(() => { window.scrollBy(0, 900); }); await page.waitForTimeout(200); await page.evaluate(() => { window.scrollBy(0, -900); });
  await page.waitForTimeout(300); await t.run(1.5);
  const after = await page.evaluate(() => { const c = window.__horseWorlds.controller; return { world: c.world, busy: c.busy, dist: c.rig.distance, az: c.rig.azimuth }; });
  check('scrolling the page and turning the wheel over the viewer change neither the place nor the camera', after.world === before.world && !after.busy && Math.abs(after.dist - before.dist) < 0.05 && Math.abs(after.az - before.az) < 0.5, { before, after });

  // --- the camera cannot roam: a long drag moves the angle by a few degrees at most, and it springs back
  await box.evaluate((el) => el.scrollIntoView({ block: 'center' })); await page.waitForTimeout(200);
  const r2 = await box.boundingBox();
  // the drag stays inside the viewer (on a phone the picture is only 356 px wide: a drag that leaves it ends the hold early)
  const stepX = Math.min(30, (r2.width * 0.8) / 24), stepY = Math.min(14, (r2.height * 0.3) / 24);
  const cx = r2.x + r2.width * 0.1, cy = r2.y + r2.height * 0.55;
  await page.mouse.move(cx, cy); await page.mouse.down();
  for (let i = 1; i <= 24; i++) { await page.mouse.move(cx + i * stepX, cy - i * stepY); await t.run(0.03); }
  const held = await page.evaluate(() => { const c = window.__horseWorlds.controller; return { az: c.rig.nudgeAz, el: c.rig.nudgeEl, world: c.world }; });
  await page.mouse.up(); await t.run(1.0);
  const hold = await page.evaluate(() => { const c = window.__horseWorlds.controller; return { az: c.rig.nudgeAz }; });
  await t.run(4.5);
  const back = await page.evaluate(() => { const c = window.__horseWorlds.controller; return { az: c.rig.nudgeAz, el: c.rig.nudgeEl, settled: c.rig.settled }; });
  check('a long drag turns the camera by at most 32 deg / 5 deg and the place is unchanged', Math.abs(held.az) <= 32.01 && Math.abs(held.el) <= 5.01 && Math.abs(held.az) > 1 && held.world === 'desert', held);
  check('the camera stays where it is left for a moment, then springs back to the shot within about 5 s', Math.abs(hold.az - held.az) < 1 && Math.abs(back.az) < 0.2 && Math.abs(back.el) < 0.1, { held: held.az, oneSecondAfter: hold.az, back });

  fs.writeFileSync(path.join(OUT, 'a11y.json'), JSON.stringify({ results, checks }, null, 1));
  const failed = checks.filter((c) => !c.ok);
  console.log(`\n${checks.length - failed.length}/${checks.length} checks pass`);
  if (checks.some((c) => !c.ok)) process.exitCode = 1;
  const noise = t.logs.filter((l) => !/hydrat/i.test(l));
  if (noise.length) console.log('console:', noise.join('\n'));
  await t.close();
})().catch((e) => { console.error('FAILED', e); process.exit(1); });
