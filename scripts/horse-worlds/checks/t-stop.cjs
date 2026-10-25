// When the horse stops the world stops (and when it starts, the world eases off with it). Presses the real Stand / gait buttons
// and records every frame: the horse's speed, the speed the scenery is scrolled at, the scroll distance, and whether two ground
// pictures taken a moment apart are identical.
// usage: node t-stop.cjs --out FILE.json
const fs = require('fs');
const { open } = require('./hw-common.cjs');
const a = process.argv.slice(2);
const opt = (k, d) => { const i = a.indexOf('--' + k); return i >= 0 ? a[i + 1] : d; };
const OUT = opt('out', 'stop.json');

const CASES = [['desert', 'walk'], ['desert', 'canter'], ['desert', 'gallop'], ['field', 'trot'], ['field', 'canter'], ['village', 'walk']];

(async () => {
  const t = await open({ w: 1440, h: 900 });
  const { page } = t;
  const results = [];
  const groundFrames = () => page.evaluate(async () => {
    const h = window.__horseWorlds, c = h.controller, s = c.activeStage, tm = c.treadmill;
    const hide = (o) => { if (o) o.visible = false; };
    const hideAll = () => { hide(tm.loco.root); hide(c.dust.points); hide(c.ambient.points); hide(c.prints.mesh); hide(c.contact); hide(s.sky.mesh); hide(s.ring.mesh); s.fields.forEach((f) => hide(f.group)); hide(s.grass && s.grass.mesh); };
    const grab = () => { h.draw(); return h.renderer.domElement.toDataURL('image/png'); };
    const cam = h.camera; const P = cam.position.clone(), Q = cam.quaternion.clone(), F = cam.fov;
    hideAll();
    const A = grab();
    h.step(0.03, 1);
    hideAll();
    // the camera drifts a little on its own: put it back so the two pictures differ only if the ground itself moved
    cam.position.copy(P); cam.quaternion.copy(Q); cam.fov = F; cam.updateProjectionMatrix(); cam.updateMatrixWorld(true);
    const B = grab();
    const restore = () => { c.treadmill.loco.root.visible = true; c.dust.points.visible = true; c.ambient.points.visible = true; c.prints.mesh.visible = true; s.sky.mesh.visible = true; s.ring.mesh.visible = true; s.fields.forEach((f) => { f.group.visible = true; }); if (s.grass) s.grass.mesh.visible = true; };
    restore();
    return { identical: A === B, bytesA: A.length, bytesB: B.length };
  });

  for (const [world, gait] of CASES) {
    await t.choose(world);
    await t.gait(gait);
    await t.run(gait === 'gallop' ? 10 : 7);
    const moving = await groundFrames(); // the same picture twice while the horse moves is impossible
    await t.run(0.5);
    await t.gait('stand');
    await page.waitForTimeout(120);
    const series = await page.evaluate(async () => {
      const h = window.__horseWorlds, c = h.controller, tm = c.treadmill, s = c.activeStage;
      const out = [];
      for (let i = 0; i < 60 * 8; i++) {
        h.step(1 / 60, 1);
        const q = tm.telemetry();
        out.push({ i, speed: q.speed, gs: q.groundSpeed, d: q.distance, nominal: q.nominal, uScroll: s.uniforms.uScroll.value });
        if (i % 40 === 0) await new Promise((r) => setTimeout(r, 0));
      }
      return out;
    });
    const still = series.find((f) => f.speed === 0);
    const gsZero = series.find((f) => f.gs < 0.005);
    const after = series.filter((f) => f.i >= (still ? still.i : 1e9));
    let lowest = 1e9, maxRise = 0;
    for (const f of series) { lowest = Math.min(lowest, f.gs); maxRise = Math.max(maxRise, f.gs - lowest); } // how far the scroll speed climbed back after having slowed
    const dAtStill = still ? still.d : null;
    const stopped = await groundFrames();
    // start again: how smoothly does the scroll speed come up?
    await t.gait(gait === 'gallop' ? 'walk' : gait);
    await page.waitForTimeout(120);
    const start = await page.evaluate(async () => {
      const h = window.__horseWorlds, c = h.controller, tm = c.treadmill;
      let maxJump = 0, prev = tm.groundSpeed, firstMove = null, d0 = tm.distance, sp0 = tm.loco.speed, peak = 0, maxDip = 0;
      for (let i = 0; i < 60 * 3; i++) {
        h.step(1 / 60, 1);
        const q = tm.telemetry();
        maxJump = Math.max(maxJump, Math.abs(q.groundSpeed - prev)); prev = q.groundSpeed;
        peak = Math.max(peak, q.groundSpeed); if (i < 60 * 2) maxDip = Math.max(maxDip, peak - q.groundSpeed); // while speeding up it must not fall back
        if (firstMove === null && q.groundSpeed > 0.05) firstMove = i / 60;
        if (i % 40 === 0) await new Promise((r) => setTimeout(r, 0));
      }
      return { maxJumpPerFrame: +maxJump.toFixed(4), largestDipWhileSpeedingUp: +maxDip.toFixed(4), firstMoveSeconds: firstMove, from: sp0 };
    });
    const r = {
      world, from: gait,
      secondsUntilHorseStill: still ? +(still.i / 60).toFixed(2) : null,
      secondsUntilScrollStops: gsZero ? +(gsZero.i / 60).toFixed(2) : null,
      scrollSpeedWhenHorseStill: still ? +still.gs.toFixed(4) : null,
      metresScrolledAfterHorseStill: still ? +(series[series.length - 1].d - dAtStill).toExponential(2) : null,
      uScrollMovedAfterStill: still ? +(series[series.length - 1].uScroll - still.uScroll).toExponential(2) : null,
      scrollSpeedLargestRiseWhileStopping: +maxRise.toFixed(4),
      groundPicturesIdenticalWhileMoving: moving.identical, groundPicturesIdenticalAfterStop: stopped.identical,
      restart: start,
    };
    results.push(r);
    console.log(JSON.stringify(r));
  }
  fs.writeFileSync(OUT, JSON.stringify(results, null, 1));
  const noise = t.logs.filter((l) => !/hydrat/i.test(l));
  if (noise.length) console.log(noise.join('\n'));
  await t.close();
})().catch((e) => { console.error('FAILED', e); process.exit(1); });
