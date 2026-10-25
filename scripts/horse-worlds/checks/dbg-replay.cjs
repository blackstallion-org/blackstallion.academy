// Is a stepped frame a pure function of (distance, time, camera)? Steps the real controller, records the state, draws; re-syncs the
// stage and draws again; then replays each recorded state through stage.update directly and compares the pictures byte for byte.
const fs = require('fs'); const path = require('path');
const { open } = require('./hw-common.cjs');
const [,, OUT, world, gait, nSteps, SUB] = process.argv;
(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const t = await open({ w: 1440, h: 900 });
  const { page } = t;
  await t.choose(world); await t.gait(gait); await t.run(7);
  const N = +nSteps || 16;
  const res = await page.evaluate(async ({ N, SUB }) => {
    const h = window.__horseWorlds, c = h.controller, s = c.activeStage, tm = c.treadmill, cam = h.camera;
    if (SUB) {
      const [nn, pw] = String(SUB).split(':'); const n = +nn, pwr = +(pw || 1);
      const G = s.ground.mesh.geometry.constructor; const g = new G(1800, 1800, 2 * n, 2 * n); g.rotateX(-Math.PI / 2);
      const p = g.getAttribute('position');
      for (let i = 0; i < p.count; i++) { for (const ax of [0, 2]) { const v = p.getComponent(i, ax) / 900; p.setComponent(i, ax, Math.sign(v) * Math.pow(Math.abs(v), pwr) * 900); } p.setY(i, 0); }
      p.needsUpdate = true; g.computeBoundingSphere();
      s.ground.mesh.geometry = g;
    }
    const hide = (o) => { if (o) o.visible = false; };
    const hideAll = () => { hide(tm.loco.root); hide(c.dust.points); hide(c.ambient.points); hide(c.prints.mesh); hide(c.contact); hide(s.sky.mesh); hide(s.ring.mesh); s.fields.forEach((f) => hide(f.group)); hide(s.grass && s.grass.mesh); };
    const grab = () => { h.draw(); h.camera.updateMatrixWorld(); const cv = h.renderer.domElement; return { png: cv.toDataURL('image/png'), view: cam.matrixWorldInverse.toArray(), proj: cam.projectionMatrix.toArray(), w: cv.width, h: cv.height }; };
    const rec = [];
    hideAll();
    for (let k = 0; k <= N; k++) {
      if (k > 0) h.step(0.013, 1);
      hideAll();
      const st = { k, d: tm.distance, t: c.time, pos: cam.position.toArray(), quat: cam.quaternion.toArray(), fov: cam.fov, aspect: cam.aspect, gs: tm.groundSpeed };
      const g1 = grab();
      // re-sync the stage to the final state and draw again
      s.update(tm.distance, c.time, cam);
      hideAll();
      const g2 = grab();
      st.resyncSame = g1.png === g2.png;
      st.png1 = g1.png; st.view = g1.view; st.proj = g1.proj; st.w = g1.w; st.h = g1.h;
      rec.push(st);
    }
    // replay: the same states through stage.update directly (camera restored from the record)
    const replay = [];
    for (const st of rec) {
      cam.position.fromArray(st.pos); cam.quaternion.fromArray(st.quat); cam.fov = st.fov; cam.updateProjectionMatrix(); cam.updateMatrixWorld(true);
      s.update(st.d, st.t, cam);
      hideAll();
      const g = grab();
      replay.push({ same: g.png === st.png1, png: g.png });
    }
    // fixed camera (frame 0), distance as recorded: what the ground does when only the distance moves
    const st0 = rec[0];
    const fixed = [];
    for (const st of rec) {
      cam.position.fromArray(st0.pos); cam.quaternion.fromArray(st0.quat); cam.fov = st0.fov; cam.updateProjectionMatrix(); cam.updateMatrixWorld(true);
      s.update(st.d, st.t, cam);
      hideAll();
      const g = grab();
      fixed.push({ png: g.png, view: g.view, proj: g.proj });
    }
    return { rec, replay, fixed };
  }, { N, SUB });
  const meta = { stepped: [], fixed: [] };
  res.rec.forEach((st, i) => {
    fs.writeFileSync(path.join(OUT, `S${i}.png`), Buffer.from(st.png1.split(',')[1], 'base64'));
    fs.writeFileSync(path.join(OUT, `X${i}.png`), Buffer.from(res.fixed[i].png.split(',')[1], 'base64'));
    meta.stepped.push({ k: st.k, d: st.d, t: st.t, pos: st.pos, quat: st.quat, fov: st.fov, view: st.view, proj: st.proj, w: st.w, h: st.h, gs: st.gs });
    meta.fixed.push({ k: st.k, d: st.d, view: res.fixed[i].view, proj: res.fixed[i].proj, w: st.w, h: st.h });
  });
  fs.writeFileSync(path.join(OUT, 'meta.json'), JSON.stringify(meta));
  console.log('k  d        t       gs     resyncSame replaySame  camPos');
  res.rec.forEach((st, i) => console.log(String(st.k).padStart(2), st.d.toFixed(5), st.t.toFixed(4), st.gs.toFixed(3), String(st.resyncSame).padEnd(10), String(res.replay[i].same).padEnd(10), st.pos.map((x) => x.toFixed(5)).join(',')));
  await t.close();
})().catch((e) => { console.error('FAILED', e); process.exit(1); });
