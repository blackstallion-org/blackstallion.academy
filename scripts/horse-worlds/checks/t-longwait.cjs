// A place whose art is held up for a very long time (here 40 s of simulated time, well past any timer the viewer could be using),
// with the real page and its buttons. The viewer must keep waiting, must never show a place before its art is here, and must never
// leave the visitor stuck:
//   wait:  the art finally arrives -> that place comes in, announced once.
//   back:  the visitor goes back to the place that was on screen -> it fades straight back in (no remount, no flash, no announcement
//          of the place that never came), the horse walks on, and the art arriving later changes nothing.
//   other: the visitor picks the third place instead -> that one is shown, the held one never is.
// The held downloads are real requests parked in the browser (Playwright route) and released on purpose.
// usage: node t-longwait.cjs --out DIR [--only wait|back|other] [--hold 40]
const fs = require('fs'); const path = require('path');
const { open } = require('./hw-common.cjs');
const a = process.argv.slice(2);
const opt = (k, d) => { const i = a.indexOf('--' + k); return i >= 0 ? a[i + 1] : d; };
const OUT = opt('out', 'longwait'); const ONLY = opt('only', null); const HOLD = +opt('hold', 40);
const checks = [];
const check = (name, ok, detail) => { checks.push({ name, ok: !!ok, detail }); console.log((ok ? 'PASS ' : 'FAIL ') + name + (detail !== undefined ? '  ' + JSON.stringify(detail) : '')); };
const uniq = (rows, key) => [...new Set(rows.map((r) => r[key]))];

// what the machine, the controller and the page say right now
const sample = (page) => page.evaluate(() => {
  const c = window.__horseWorlds.controller;
  const grp = document.querySelector('[role=group][aria-label="Choose a place"]');
  const status = document.querySelector('[role=status]');
  return {
    world: c.world, phase: c.tm.phase, fade: +c.tm.fade.toFixed(3), lightMix: +c.tm.lightMix.toFixed(3), busy: c.busy,
    mounted: c.mountedId, speed: +c.treadmill.loco.speed.toFixed(2), gait: c.gait, elapsed: +c.tm.elapsed.toFixed(2),
    shown: status.dataset.shown, status: status.textContent, ariaBusy: grp && grp.getAttribute('aria-busy'),
    pressed: Object.fromEntries([...document.querySelectorAll('[data-world-option]')].map((e) => [e.dataset.worldOption, e.getAttribute('aria-pressed')])),
    caption: /loading the scene/i.test(document.body.innerText), // innerText has the capitals of the caption's CSS
  };
});
// advance the simulation (the page's own loop is paused) and sample after every step of `dt`
const advance = async (page, seconds, rows, dt = 1 / 30, every = 1) => {
  const n = Math.round(seconds / dt);
  for (let i = 1; i <= n; i++) {
    await page.evaluate((d) => window.__horseWorlds.step(d, 1), dt);
    if (i % every === 0) rows.push(await sample(page));
  }
};
// hold the downloads of one place until `release()` is called; `held()` says how many requests have been parked
async function hold(ctx, place) {
  let release; const gate = new Promise((r) => { release = r; });
  let n = 0;
  await ctx.route(`**/images/horse-worlds/${place}/**`, async (route) => { n++; await gate; await route.continue().catch(() => {}); });
  return { release: () => release(), held: () => n };
}
// step in small pieces while real time (and the downloads) go by, until the viewer is idle again
const untilIdle = async (page, t, rows, limit = 400) => {
  for (let k = 0; k < limit; k++) {
    await page.evaluate(() => window.__horseWorlds.step(1 / 30, 1));
    const s = await sample(page); rows.push(s);
    if (!s.busy && rows.length > 3) return s;
    await page.waitForTimeout(60);
  }
  return rows[rows.length - 1];
};
// click a place's button and wait until the controller has taken the request (the page's own loop is paused, so the request
// arrives through React's effect, a moment after the click)
const pick = async (page, id) => {
  await page.locator(`[data-world-option=${id}]`).click();
  await page.waitForFunction((w) => window.__horseWorlds.controller.tm.target === w, id, { timeout: 10000, polling: 20 });
};
const phasesOf = (rows) => rows.map((r) => r.phase).filter((p, i, arr) => i === 0 || p !== arr[i - 1]);

async function wait() {
  console.log(`--- wait: the village's art is held for ${HOLD} s of simulated time, then arrives`);
  const t = await open({ w: 1440, h: 900 });
  const { page, box, ctx } = t;
  await t.run(1.0);
  const gate = await hold(ctx, 'village');
  await pick(page, 'village');
  const rows = [];
  await advance(page, 1.5, rows, 1 / 30, 1); // every step while the fade-out runs, so its phases are seen
  await advance(page, HOLD - 1.5, rows, 1 / 30, 15);
  const end = rows[rows.length - 1];
  const during = rows.filter((r) => r.phase === 'load');
  check('requests for the village were really parked in the browser', gate.held() > 0, { parked: gate.held() });
  check(`after ${HOLD} s of simulated time the viewer is still in the load phase on the village, dark and busy`, end.phase === 'load' && end.world === 'village' && end.fade === 0 && end.busy && end.ariaBusy === 'true', { phase: end.phase, world: end.world, fade: end.fade, busy: end.busy, ariaBusy: end.ariaBusy });
  check('it went out > load and never began to fade a place in while it waited', JSON.stringify(phasesOf(rows)) === JSON.stringify(['out', 'load']) && during.every((r) => r.fade === 0), phasesOf(rows));
  check('the old place was never shown under the new name: the stage on screen stayed the desert and nothing was announced', during.every((r) => r.mounted === 'desert' && r.shown === 'desert') && !/village/i.test(end.status), { mounted: uniq(during, 'mounted'), shown: uniq(during, 'shown'), status: end.status });
  check('the horse stood still for the wait', during.slice(-5).every((r) => r.speed === 0), during.slice(-5).map((r) => r.speed));
  check('the Village button stays pressed (it is what was asked for) and the others are not', end.pressed.village === 'true' && end.pressed.desert === 'false' && end.pressed.field === 'false', end.pressed);
  // the caption is a DOM overlay that appears after 1.6 s of real time busy
  await page.waitForTimeout(2200);
  const cap = await sample(page);
  check('the caption "Loading the scene" is showing for the visitor', cap.caption === true);
  await page.evaluate(() => window.__horseWorlds.draw()); await page.waitForTimeout(150);
  await box.screenshot({ path: path.join(OUT, 'wait-during.png'), timeout: 90000 });
  // the art arrives
  gate.release();
  const after = [];
  const last = await untilIdle(page, t, after);
  check('when the art arrives the village comes in (load > in > idle) and is announced once', last.world === 'village' && last.mounted === 'village' && last.fade === 1 && !last.busy && last.shown === 'village' && /village/i.test(last.status), { world: last.world, mounted: last.mounted, fade: last.fade, shown: last.shown, status: last.status });
  check('the order after the release was load > in > idle', JSON.stringify(phasesOf(after).filter((p) => p !== 'out')) === JSON.stringify(['load', 'in', 'idle']) || JSON.stringify(phasesOf(after)) === JSON.stringify(['in', 'idle']), phasesOf(after));
  await page.evaluate(() => window.__horseWorlds.draw()); await page.waitForTimeout(150);
  await box.screenshot({ path: path.join(OUT, 'wait-after.png'), timeout: 90000 });
  const bad = t.logs.filter((l) => /pageerror/.test(l));
  check('no uncaught page error', bad.length === 0, bad);
  fs.writeFileSync(path.join(OUT, 'wait-timeline.json'), JSON.stringify({ during: rows, after }));
  await t.close();
}

async function back() {
  console.log('--- back: the village is held; the visitor goes back to the desert; the village arrives later');
  const t = await open({ w: 1440, h: 900 });
  const { page, box, ctx } = t;
  await t.run(3.0); // the horse walks the desert first
  const walking = (await sample(page)).speed;
  const gate = await hold(ctx, 'village');
  await pick(page, 'village');
  const rows = [];
  await advance(page, 20, rows, 1 / 30, 15);
  const wait = rows[rows.length - 1];
  check('the village is still loading after 20 s of simulated time (and the desert is faded out)', wait.phase === 'load' && wait.world === 'village' && wait.fade === 0 && wait.mounted === 'desert', { phase: wait.phase, world: wait.world, fade: wait.fade, mounted: wait.mounted });
  // the visitor changes their mind
  await pick(page, 'desert');
  const back = [];
  await advance(page, 2.5, back, 1 / 30, 1);
  const first = back[0], end = back[back.length - 1];
  check('the desert button was heard: the machine now aims at the desert and is fading it in', back.some((r) => r.phase === 'in' && r.world === 'desert'), phasesOf(back));
  const rising = back.filter((r) => r.phase === 'in' || r.phase === 'idle');
  const monotonic = rising.every((r, i) => i === 0 || r.fade >= rising[i - 1].fade - 1e-9);
  check('it faded straight back in: no second fade-out, the fade only rose, and it reached 1', JSON.stringify(phasesOf(back).filter((p) => p !== 'load')) === JSON.stringify(['in', 'idle']) && monotonic && end.fade === 1, { phases: phasesOf(back), monotonic, fade: end.fade });
  check('the desert was never taken off the stage and the village was never put on it', back.every((r) => r.mounted === 'desert') && rows.concat(back).every((r) => r.mounted === 'desert') && rows.concat(back).every((r) => r.shown === 'desert'), { mounted: uniq(rows.concat(back), 'mounted'), shown: uniq(rows.concat(back), 'shown') });
  check('the viewer is idle again, the Desert button is pressed and the group is no longer busy', !end.busy && end.ariaBusy === 'false' && end.pressed.desert === 'true' && end.pressed.village === 'false', { busy: end.busy, ariaBusy: end.ariaBusy, pressed: end.pressed });
  check('the lights came back to the desert (mix 1) and the caption is gone', end.lightMix === 1 && end.caption === false, { lightMix: end.lightMix, caption: end.caption });
  await advance(page, 3, back, 1 / 30, 15);
  const walk = back[back.length - 1];
  check('the horse walks on in the desert as before', walk.speed > 0.8 * walking && walk.gait === 'walk', { before: walking, now: walk.speed, gait: walk.gait });
  await page.evaluate(() => window.__horseWorlds.draw()); await page.waitForTimeout(150);
  await box.screenshot({ path: path.join(OUT, 'back-after.png'), timeout: 90000 });
  // the held art arrives afterwards: nothing on screen changes
  gate.release();
  await page.waitForTimeout(6000);
  const late = [];
  await advance(page, 3, late, 1 / 30, 15);
  const l = late[late.length - 1];
  check('when the village\'s art arrives later nothing on screen changes', l.world === 'desert' && l.mounted === 'desert' && l.phase === 'idle' && l.shown === 'desert', { world: l.world, mounted: l.mounted, phase: l.phase, shown: l.shown });
  // and it is not wasted: asking for the village now is a normal one-second switch
  await pick(page, 'village');
  const again = [];
  const done = await untilIdle(page, t, again);
  check('asking for the village afterwards is an ordinary switch of about a second (its art is cached)', done.world === 'village' && done.mounted === 'village' && done.elapsed > 0.9 && done.elapsed < 1.6, { world: done.world, elapsed: done.elapsed });
  const bad = t.logs.filter((l2) => /pageerror/.test(l2));
  check('no uncaught page error', bad.length === 0, bad);
  fs.writeFileSync(path.join(OUT, 'back-timeline.json'), JSON.stringify({ rows, back, late, again }));
  await t.close();
}

async function other() {
  console.log('--- other: the village is held; the visitor picks the horse field instead');
  const t = await open({ w: 1440, h: 900 });
  const { page, box, ctx } = t;
  await t.run(1.0);
  const gate = await hold(ctx, 'village');
  await pick(page, 'village');
  const rows = [];
  await advance(page, 20, rows, 1 / 30, 15);
  check('the village is still loading after 20 s of simulated time', rows[rows.length - 1].phase === 'load' && rows[rows.length - 1].world === 'village', { phase: rows[rows.length - 1].phase });
  await pick(page, 'field');
  const sw = [];
  const last = await untilIdle(page, t, sw);
  const all = rows.concat(sw);
  check('the horse field comes in (it was fetched while the village was held)', last.world === 'field' && last.mounted === 'field' && last.fade === 1 && !last.busy, { world: last.world, mounted: last.mounted, fade: last.fade });
  check('the village was never put on the stage and never announced', all.every((r) => r.mounted !== 'village' && r.shown !== 'village'), { mounted: uniq(all, 'mounted'), shown: uniq(all, 'shown') });
  check('the field is announced once it is on stage and the Horse Field button is the pressed one', last.shown === 'field' && /horse field/i.test(last.status) && last.pressed.field === 'true' && last.pressed.village === 'false', { shown: last.shown, status: last.status, pressed: last.pressed });
  check('one phase at a time throughout: the order never had a second fade-out before the field was in', phasesOf(sw).filter((p) => p === 'out').length === 0, phasesOf(sw));
  await page.evaluate(() => window.__horseWorlds.draw()); await page.waitForTimeout(150);
  await box.screenshot({ path: path.join(OUT, 'other-after.png'), timeout: 90000 });
  gate.release();
  await page.waitForTimeout(6000);
  const late = [];
  await advance(page, 3, late, 1 / 30, 15);
  const l = late[late.length - 1];
  check('the village arriving afterwards changes nothing on screen', l.world === 'field' && l.mounted === 'field' && l.phase === 'idle' && l.shown === 'field', { world: l.world, mounted: l.mounted, phase: l.phase });
  const bad = t.logs.filter((x) => /pageerror/.test(x));
  check('no uncaught page error', bad.length === 0, bad);
  fs.writeFileSync(path.join(OUT, 'other-timeline.json'), JSON.stringify({ rows, sw, late }));
  await t.close();
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  if (!ONLY || ONLY === 'wait') await wait();
  if (!ONLY || ONLY === 'back') await back();
  if (!ONLY || ONLY === 'other') await other();
  fs.writeFileSync(path.join(OUT, 'longwait.json'), JSON.stringify({ checks }, null, 1));
  const failed = checks.filter((c) => !c.ok);
  console.log(`\n${checks.length - failed.length}/${checks.length} checks pass`);
  if (checks.some((c) => !c.ok)) process.exitCode = 1;
})().catch((e) => { console.error('FAILED', e); process.exit(1); });
