// The horse and the ground, measured while the real simulation runs, in every world and every gait it offers:
//   v = L x f against the speed the world is scrolled at, the integral of v, planted-hoof slip, float and sink, how many hoof
//   strikes there are per stride, whether a footprint stays where it was put, whether the grass is pressed under planted hooves,
//   and one pair of ground-only frames per gait for the pixel check (analyse-layers.py).
// usage: node t-sim.cjs --out DIR [--w 1440 --h 900]
const fs = require('fs');
const path = require('path');
const { open } = require('./hw-common.cjs');
const a = process.argv.slice(2);
const opt = (k, d) => { const i = a.indexOf('--' + k); return i >= 0 ? a[i + 1] : d; };
const OUT = opt('out', 'sim-out');
const W = +opt('w', 1440), H = +opt('h', 900);
const PIXONLY = a.includes('--pixonly');
const PLAN = [
  ['desert', ['walk', 'canter', 'gallop']],
  ['field', ['walk', 'trot', 'canter']],
  ['village', ['walk']],
];

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const t = await open({ w: W, h: H });
  const { page } = t;
  const rows = [];
  const meta = [];
  for (const [world, gaits] of PLAN) {
    await t.choose(world);
    for (const g of gaits) {
      await t.gait(g);
      await t.run(g === 'gallop' ? 10 : 7);
      const res = PIXONLY ? null : await page.evaluate(async ({ T, dt }) => {
        const h = window.__horseWorlds, c = h.controller, tm = c.treadmill;
        tm.resetStats();
        let touch = 0, lift = 0;
        const orig = tm.onFoot;
        const tracked = [];
        tm.onFoot = (e) => {
          if (e.kind === 'touchdown') touch++; else lift++;
          const before = c.prints.head;
          orig && orig(e);
          if (e.kind === 'touchdown' && c.prints.head !== before) {
            const idx = before;
            const arr = c.prints.mesh.instanceMatrix.array;
            tracked.push({ idx, z0: arr[idx * 16 + 14], x0: arr[idx * 16 + 12], d0: tm.distance, birth: c.prints.birth[idx], limb: e.limb });
          }
        };
        const n = Math.round(T / dt);
        let sGs = 0, sNom = 0, sMeas = 0, nMeas = 0, sSpeed = 0, sL = 0, sF = 0;
        let maxJump = 0, prevGs = tm.groundSpeed;
        const d0 = tm.distance;
        let integ = 0;
        const press = c.hoofPress;
        const limbs = ['FL', 'FR', 'HL', 'HR'];
        let planted = 0, plantedPressed = 0, air = 0, airPressed = 0;
        for (let i = 0; i < n; i++) {
          const gsBefore = tm.distance;
          h.step(dt, 1);
          const q = tm.telemetry();
          integ += q.groundSpeed * Math.min(dt, 0.05);
          sGs += q.groundSpeed; sNom += q.nominal; if (q.measured != null) { sMeas += q.measured; nMeas++; }
          sSpeed += q.speed; sL += q.strideLength; sF += q.strideFrequency;
          maxJump = Math.max(maxJump, Math.abs(q.groundSpeed - prevGs)); prevGs = q.groundSpeed;
          limbs.forEach((l, k) => {
            const hv = q.hooves[l];
            if (hv.planted) { planted++; if (press[k].press > 0.8) plantedPressed++; }
            else if (hv.height > 0.2) { air++; if (press[k].press > 0.25) airPressed++; }
          });
          if (i % 40 === 0) await new Promise((r) => setTimeout(r, 0));
        }
        tm.onFoot = orig;
        const q = tm.telemetry();
        // footprints: how far each print that is still alive has strayed from the ground it was pressed into
        const arr = c.prints.mesh.instanceMatrix.array;
        const alive = tracked.filter((p) => c.prints.birth[p.idx] === p.birth && c.time - p.birth < c.prints.uniforms.uLife.value);
        const resid = alive.map((p) => (arr[p.idx * 16 + 14] - p.z0) + (tm.distance - p.d0));
        return {
          T, touch, lift, dist: tm.distance - d0, integ, gsMean: sGs / n, nomMean: sNom / n, measMean: nMeas ? sMeas / nMeas : null, speedMean: sSpeed / n,
          L: sL / n, f: sF / n, slipRms: q.slipRms, floatMax: q.floatMax, sinkMax: q.sinkMax, slipSamples: q.slipSamples, maxJump,
          prints: { placed: tracked.length, alive: alive.length, maxResidual: resid.length ? Math.max(...resid.map(Math.abs)) : null },
          grass: { planted, plantedPressed, air, airPressed },
          gait: q.gait, hasGrass: !!c.activeStage.grass,
        };
      }, { T: 8, dt: 1 / 60 });
      // pixel check: ground only, real stepping between the two frames
      const frames = await page.evaluate(async () => {
        const h = window.__horseWorlds, c = h.controller, s = c.activeStage, tm = c.treadmill;
        const vis = (o, v) => { if (o) o.visible = v; };
        const save = [];
        const hide = (o) => { if (o) { save.push([o, o.visible]); o.visible = false; } };
        hide(tm.loco.root); hide(c.dust.points); hide(c.ambient.points); hide(c.prints.mesh); hide(c.contact); hide(s.sky.mesh); hide(s.ring.mesh);
        s.fields.forEach((f) => hide(f.group)); hide(s.grass && s.grass.mesh);
        const grab = () => {
          h.draw(); h.camera.updateMatrixWorld(); const cv = h.renderer.domElement;
          return { png: cv.toDataURL('image/png'), view: h.camera.matrixWorldInverse.toArray(), proj: h.camera.projectionMatrix.toArray(), w: cv.width, h: cv.height, camPos: h.camera.position.toArray(), d: tm.distance };
        };
        const A = grab();
        const gs = Math.max(tm.groundSpeed, 0.05);
        h.step(Math.min(0.05, Math.max(0.002, 0.06 / gs)), 1);
        // every update switches the contact shadow back on: hide it again so both frames hold the ground and nothing else
        hide(tm.loco.root); hide(c.dust.points); hide(c.ambient.points); hide(c.prints.mesh); hide(c.contact); hide(s.sky.mesh); hide(s.ring.mesh);
        s.fields.forEach((f) => hide(f.group)); hide(s.grass && s.grass.mesh);
        const B = grab();
        for (const [o, v] of save) o.visible = v;
        return { A, B, gs: tm.groundSpeed, cfg: { radius: s.config.distant.radius, midX: s.config.mid.x, midLayout: s.config.mid.layout } };
      });
      const base = `${world}-${g}-ground`;
      fs.writeFileSync(path.join(OUT, `${base}-A.png`), Buffer.from(frames.A.png.split(',')[1], 'base64'));
      fs.writeFileSync(path.join(OUT, `${base}-B.png`), Buffer.from(frames.B.png.split(',')[1], 'base64'));
      meta.push({ world: `${world}-${g}`, layer: 'ground', delta: frames.B.d - frames.A.d, d0: frames.A.d, ...frames.cfg, A: { view: frames.A.view, proj: frames.A.proj, camPos: frames.A.camPos }, B: { view: frames.B.view, proj: frames.B.proj, camPos: frames.B.camPos }, w: frames.A.w, h: frames.A.h });
      if (PIXONLY) { console.log('pixels', world, g); continue; }
      rows.push({ world, gait: g, ...res });
      console.log(JSON.stringify({ world, gait: g, L: +res.L.toFixed(3), f: +res.f.toFixed(3), Lxf: +(res.L * res.f).toFixed(3), gsMean: +res.gsMean.toFixed(3), measMean: res.measMean && +res.measMean.toFixed(3), nomMean: +res.nomMean.toFixed(3), slipRms: +res.slipRms.toFixed(3), floatMax: +res.floatMax.toFixed(4), sinkMax: +res.sinkMax.toFixed(4), touchPerSec: +(res.touch / res.T).toFixed(2), fourF: +(4 * res.f).toFixed(2), integErr: +Math.abs(res.integ - res.dist).toExponential(1), maxJump: +res.maxJump.toFixed(3), prints: res.prints, grass: res.grass }));
    }
  }
  fs.writeFileSync(path.join(OUT, 'meta.json'), JSON.stringify(meta));
  if (!PIXONLY) fs.writeFileSync(path.join(OUT, 'sim.json'), JSON.stringify(rows, null, 1));
  if (t.logs.length) console.log(t.logs.filter((l) => !/hydrat/i.test(l)).join('\n'));
  await t.close();
})().catch((e) => { console.error('FAILED', e); process.exit(1); });
