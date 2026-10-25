// Switching places: clicks the real buttons, then steps the viewer 1/60 s at a time and records the phase, fades, the horse's
// speed and the camera on every frame. Checks: one switch at a time, timing about 1 s, fades monotonic, the horse settles,
// the camera heads for the standing shot of the new place, the newest request wins, a change of mind fades back in.
// usage: node t-transition.cjs --out FILE.json [--w 1440 --h 900]
const fs = require('fs');
const { open } = require('./hw-common.cjs');
const a = process.argv.slice(2);
const opt = (k, d) => { const i = a.indexOf('--' + k); return i >= 0 ? a[i + 1] : d; };
const OUT = opt('out', 'transition.json');
const W = +opt('w', 1440), H = +opt('h', 900);

// sample the viewer after `act` until it is idle again (or `maxSeconds` pass)
async function record(page, act, { maxSeconds = 8, minFrames = 12, realtime = false } = {}) {
  await act();
  await page.waitForTimeout(120); // React hands the request to the viewer
  return page.evaluate(async ({ maxSeconds, minFrames, realtime }) => {
    const h = window.__horseWorlds, c = h.controller;
    const series = [];
    const n = Math.round(maxSeconds * 60);
    let idleFrames = 0;
    for (let i = 0; i < n; i++) {
      h.step(1 / 60, 1);
      const q = c.telemetry();
      series.push({
        i, phase: q.phase, fade: q.fade, mix: c.tm.lightMix, world: q.world, target: c.tm.target, queued: c.tm.queued, speed: q.speed, gs: q.groundSpeed, gait: c.gait,
        az: c.rig.azimuth, el: c.rig.elevation, dist: c.rig.distance, fov: c.rig.fov, busy: c.busy,
      });
      if (!c.busy) idleFrames++; else idleFrames = 0;
      if (i > minFrames && idleFrames > 6) break;
      if (realtime) await new Promise((r) => setTimeout(r, 16));
      else if (i % 30 === 0) await new Promise((r) => setTimeout(r, 0));
    }
    return series;
  }, { maxSeconds, minFrames, realtime });
}

function summarise(label, s) {
  const busy = s.filter((f) => f.busy);
  const phases = [];
  for (const f of s) if (f.busy && phases[phases.length - 1] !== f.phase) phases.push(f.phase);
  const out = s.filter((f) => f.phase === 'out'), inn = s.filter((f) => f.phase === 'in');
  const mono = (arr, key, dir) => arr.every((f, k) => k === 0 || (dir > 0 ? f[key] >= arr[k - 1][key] - 1e-9 : f[key] <= arr[k - 1][key] + 1e-9));
  const swap = s.find((f, k) => k > 0 && f.world !== s[k - 1].world);
  const maxStep = Math.max(...s.map((f, k) => (k ? Math.abs(f.fade - s[k - 1].fade) : 0)));
  const last = s[s.length - 1];
  const first = s[0];
  const settle = s.find((f) => f.speed < 0.05);
  return {
    label, seconds: +(busy.length / 60).toFixed(3), phases: phases.join(' > '), worldFrom: first.world, worldTo: last.world,
    outSeconds: +(out.length / 60).toFixed(3), inSeconds: +(inn.length / 60).toFixed(3), loadSeconds: +(s.filter((f) => f.phase === 'load').length / 60).toFixed(3),
    fadeOutMonotonic: mono(out, 'fade', -1), fadeInMonotonic: mono(inn, 'fade', +1), maxFadeStepPerFrame: +maxStep.toFixed(4),
    fadeAtSwap: swap ? +swap.fade.toFixed(3) : null, swapAtSeconds: swap ? +(swap.i / 60).toFixed(3) : null,
    speedStart: +first.speed.toFixed(2), speedAtSwap: swap ? +swap.speed.toFixed(2) : null, speedAtEnd: busy.length ? +busy[busy.length - 1].speed.toFixed(2) : null,
    secondsToStandstill: settle ? +(settle.i / 60).toFixed(2) : null,
    gaitAtEnd: last.gait, finalFade: last.fade,
    camera: { start: [first.az, first.el, first.dist, first.fov].map((x) => +x.toFixed(2)), end: [last.az, last.el, last.dist, last.fov].map((x) => +x.toFixed(2)) },
    lightMixMonotonic: mono(busy, 'mix', +1) || 'resets at the start of a switch',
    onePhaseAtATime: /^(out (load )?in)( out (load )?in)*$|^out in$/.test(phases.join(' ')),
  };
}

(async () => {
  const t = await open({ w: W, h: H });
  const { page } = t;
  const result = [];
  // make every world ready first (so the switch times below are the animation, not the network); a cold switch is measured last
  await page.evaluate(() => { const c = window.__horseWorlds.controller; c.prefetch('field'); c.prefetch('village'); });
  await page.waitForFunction(() => { const c = window.__horseWorlds.controller; return c.stages.has('field') && c.stages.has('village') && c.envs.has('field') && c.envs.has('village'); }, null, { timeout: 240000, polling: 500 });
  const click = (w) => () => page.locator(`[data-world-option=${w}]`).click();

  // 1. walk in the desert, then the field
  await t.gait('walk'); await t.run(6);
  result.push(summarise('desert (walking) > field', await record(page, click('field'))));
  await t.run(3);
  // 2. field > village (walking on)
  await t.gait('walk'); await t.run(4);
  result.push(summarise('field (walking) > village', await record(page, click('village'))));
  await t.run(2);
  // 3. village standing > desert
  await t.gait('stand'); await t.run(4);
  result.push(summarise('village (standing) > desert', await record(page, click('desert'))));
  await t.run(2);
  // 4. two quick presses: Field then Village (the newest wins and runs after the first, never over it)
  await t.gait('walk'); await t.run(4);
  result.push(summarise('desert > field then village at once', await record(page, async () => { await click('field')(); await page.waitForTimeout(60); await click('village')(); }, { maxSeconds: 10 })));
  await t.run(2);
  // 5. a change of mind during the fade-out: Field, then (a fifth of a second into the fade) back to the place on screen
  await t.choose('desert');
  await t.run(3);
  {
    const series = await page.evaluate(async () => {
      const h = window.__horseWorlds, c = h.controller; const out = [];
      const sample = (i) => { const q = c.telemetry(); out.push({ i, phase: q.phase, fade: q.fade, mix: c.tm.lightMix, world: q.world, target: c.tm.target, queued: c.tm.queued, speed: q.speed, gs: q.groundSpeed, gait: c.gait, az: c.rig.azimuth, el: c.rig.elevation, dist: c.rig.distance, fov: c.rig.fov, busy: c.busy }); };
      c.requestWorld('field');
      let idle = 0;
      for (let i = 0; i < 60 * 6; i++) {
        if (i === 12) c.requestWorld('desert');
        h.step(1 / 60, 1); sample(i);
        if (!c.busy) idle++; else idle = 0;
        if (i > 14 && idle > 6) break;
      }
      return out;
    });
    const sum = summarise('change of mind: desert > field, back to desert after 0.2 s', series);
    const minFade = Math.min(...series.map((f) => f.fade));
    sum.minFadeReached = +minFade.toFixed(3);
    sum.everSwapped = series.some((f) => f.world !== 'desert');
    sum.everLoaded = series.some((f) => f.phase === 'load');
    sum.fadeBackMonotonic = (() => { const k = series.findIndex((f) => f.fade === minFade); const tail = series.slice(k); return tail.every((f, j) => j === 0 || f.fade >= tail[j - 1].fade - 1e-9); })();
    result.push(sum);
  }
  await t.run(2);
  // 6. from a gallop (the hardest stop)
  await t.gait('gallop'); await t.run(10);
  result.push(summarise('desert (galloping) > village', await record(page, click('village'), { maxSeconds: 10 })));
  await t.run(3);
  // 7. a cold switch: a fresh page, the art not fetched yet
  await t.close();
  const cold = await open({ w: W, h: H });
  await cold.page.waitForTimeout(300);
  const series = await record(cold.page, () => cold.page.locator('[data-world-option=village]').click(), { maxSeconds: 40, minFrames: 30, realtime: true });
  // real time keeps passing between the 1/60 s steps only in `record`'s 120 ms wait; step more slowly so the network can keep up
  result.push(summarise('cold switch desert > village (art not yet fetched)', series));
  const stillLoading = series.filter((f) => f.phase === 'load').length;
  await cold.page.evaluate(() => window.__horseWorlds.controller.world);
  const noise = [...t.logs, ...cold.logs].filter((l) => !/hydrat/i.test(l));
  fs.writeFileSync(OUT, JSON.stringify({ result, stillLoadingFramesInCold: stillLoading, noise }, null, 1));
  for (const r of result) console.log(JSON.stringify(r));
  if (noise.length) console.log(noise.join('\n'));
  await cold.close();

  // the verdict, so a reader does not have to read the numbers
  const checks = [];
  const check = (name, ok, detail) => { checks.push({ name, ok: !!ok, detail }); console.log((ok ? 'PASS ' : 'FAIL ') + name + (detail !== undefined ? '  ' + JSON.stringify(detail) : '')); };
  const mind = result.find((r) => /^change of mind/.test(r.label));
  const cold1 = result.find((r) => /^cold switch/.test(r.label));
  const normal = result.filter((r) => r !== mind && r !== cold1);
  console.log('');
  check('every ordinary switch takes about one second (0.95 to 1.15 s) as out > load > in', normal.every((r) => r.seconds >= 0.95 && r.seconds <= 1.15 && r.phases === 'out > load > in'), normal.map((r) => r.seconds));
  check('a switch whose art has not been fetched yet still goes out > load > in and ends at rest', cold1.phases === 'out > load > in' && cold1.finalFade === 1 && cold1.worldFrom !== cold1.worldTo, { seconds: cold1.seconds, loadSeconds: cold1.loadSeconds });
  check('one phase at a time in every scenario (no second fade-out over a fade-in)', result.every((r) => r.onePhaseAtATime), result.map((r) => r.phases));
  check('fades only fall and then only rise; no frame steps the fade by more than 0.08', result.every((r) => r.fadeOutMonotonic && r.fadeInMonotonic && r.maxFadeStepPerFrame < 0.08), result.map((r) => r.maxFadeStepPerFrame));
  check('the place is swapped only once it is fully faded out', [...normal, cold1].every((r) => r.fadeAtSwap === 0), [...normal, cold1].map((r) => r.fadeAtSwap));
  check('the light mix only goes forward within a switch', result.every((r) => r.lightMixMonotonic === true), result.map((r) => r.lightMixMonotonic));
  check('the horse is at a standstill within 0.8 s of the press, from a stand, a walk or a gallop', normal.every((r) => r.secondsToStandstill !== null && r.secondsToStandstill <= 0.8), normal.map((r) => r.secondsToStandstill));
  check('every switch ends fully faded in', result.every((r) => r.finalFade === 1), result.map((r) => r.finalFade));
  check('two quick presses run as one switch and end in the place pressed last', normal.some((r) => /at once/.test(r.label) && r.worldTo === 'village' && r.phases === 'out > load > in'), normal.filter((r) => /at once/.test(r.label)).map((r) => [r.worldFrom, r.worldTo]));
  check('a change of mind fades the place on screen straight back in: no swap, no load', mind.everSwapped === false && mind.everLoaded === false && mind.fadeBackMonotonic === true && mind.phases === 'out > in' && mind.finalFade === 1, { phases: mind.phases, minFadeReached: mind.minFadeReached, seconds: mind.seconds });
  check('the camera heads for a new standing shot on every switch that changes place', normal.every((r) => r.camera.start.join() !== r.camera.end.join() || r.worldFrom === r.worldTo || /standing/.test(r.label)), normal.map((r) => r.camera));
  check('no uncaught page error', noise.length === 0, noise);
  fs.writeFileSync(OUT.replace(/\.json$/, '') + '.checks.json', JSON.stringify(checks, null, 1));
  console.log(`\n${checks.filter((c) => c.ok).length}/${checks.length} checks pass`);
  if (checks.some((c) => !c.ok)) process.exitCode = 1;
})().catch((e) => { console.error('FAILED', e); process.exit(1); });
