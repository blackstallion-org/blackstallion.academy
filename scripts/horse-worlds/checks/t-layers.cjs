// Layer isolation: for each world, render one layer at a time (horse, dust and every other layer hidden), advance the scroll
// distance by a known amount and save the two frames with the camera matrices. analyse-layers.py measures how far the picture
// moved and compares it with where the geometry says it must go.
// usage: node t-layers.cjs --out DIR [--w 1440 --h 900] [--worlds desert,field,village]
const fs = require('fs');
const path = require('path');
const { open } = require('./hw-common.cjs');
const a = process.argv.slice(2);
const opt = (k, d) => { const i = a.indexOf('--' + k); return i >= 0 ? a[i + 1] : d; };
const OUT = opt('out', 'layers-out');
const W = +opt('w', 1440), H = +opt('h', 900);
const worlds = opt('worlds', 'desert,field,village').split(',');
// how far (m) the world slides between the two frames, chosen so that each layer moves a measurable 8 to 30 px
const DELTA = { ground: 0.06, fore: 0.03, mid: 0.2, ring: 3.0 };

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const t = await open({ w: W, h: H });
  const { page } = t;
  const meta = [];
  for (const world of worlds) {
    await t.choose(world);
    await t.gait('walk');
    await t.run(4);
    for (const layer of ['ground', 'fore', 'mid', 'ring']) {
      const info = await page.evaluate(({ layer }) => {
        const h = window.__horseWorlds, c = h.controller, s = c.activeStage;
        const vis = (o, v) => { if (o) o.visible = v; };
        vis(c.treadmill.loco.root, false);
        vis(c.dust.points, false); vis(c.ambient.points, false); vis(c.prints.mesh, false); vis(c.contact, false);
        vis(s.sky.mesh, false); vis(s.ring.mesh, layer === 'ring'); vis(s.ground.mesh, layer === 'ground');
        s.fields.forEach((f, i) => vis(f.group, (layer === 'mid' && i === 0) || (layer === 'fore' && i === s.fields.length - 1)));
        vis(s.grass && s.grass.mesh, false);
        const cfg = s.config;
        return { world: cfg.id, radius: cfg.distant.radius, midX: cfg.mid.x, midLayout: cfg.mid.layout, tile: cfg.ground.tileMetres, distance: c.treadmill.distance };
      }, { layer });
      const d0 = info.distance;
      const grab = (dist) => page.evaluate(({ dist }) => {
        const h = window.__horseWorlds, c = h.controller, s = c.activeStage;
        s.update(dist, c.time, h.camera);
        h.draw();
        h.camera.updateMatrixWorld();
        const cv = h.renderer.domElement;
        return { png: cv.toDataURL('image/png'), view: h.camera.matrixWorldInverse.toArray(), proj: h.camera.projectionMatrix.toArray(), w: cv.width, h: cv.height, camPos: h.camera.position.toArray() };
      }, { dist });
      const fa = await grab(d0);
      const fb = await grab(d0 + DELTA[layer]);
      const base = `${world}-${layer}`;
      fs.writeFileSync(path.join(OUT, `${base}-A.png`), Buffer.from(fa.png.split(',')[1], 'base64'));
      fs.writeFileSync(path.join(OUT, `${base}-B.png`), Buffer.from(fb.png.split(',')[1], 'base64'));
      meta.push({ world, layer, delta: DELTA[layer], d0, ...info, A: { view: fa.view, proj: fa.proj, camPos: fa.camPos }, B: { view: fb.view, proj: fb.proj, camPos: fb.camPos }, w: fa.w, h: fa.h });
      console.log('captured', base);
    }
    // put everything back for the next world
    await page.evaluate(() => {
      const h = window.__horseWorlds, c = h.controller, s = c.activeStage;
      const vis = (o, v) => { if (o) o.visible = v; };
      vis(c.treadmill.loco.root, true); vis(c.dust.points, true); vis(c.ambient.points, true); vis(c.prints.mesh, true); vis(c.contact, true);
      vis(s.sky.mesh, true); vis(s.ring.mesh, true); vis(s.ground.mesh, true); s.fields.forEach((f) => vis(f.group, true)); vis(s.grass && s.grass.mesh, true);
    });
  }
  fs.writeFileSync(path.join(OUT, 'meta.json'), JSON.stringify(meta));
  if (t.logs.length) console.log(t.logs.filter((l) => !/hydrat/i.test(l)).join('\n'));
  await t.close();
})().catch((e) => { console.error('FAILED', e); process.exit(1); });
