// Close-ups of a planted hoof in the middle of its stance, from just above the ground and the side the visitor sees, in each place
// and at several gaits: does the hoof sit on the ground (not above it, not in it)? Writes one picture per case and the numbers.
// usage: node t-hoof.cjs --out DIR
const fs = require('fs'); const path = require('path');
const { open } = require('./hw-common.cjs');
const a = process.argv.slice(2);
const opt = (k, d) => { const i = a.indexOf('--' + k); return i >= 0 ? a[i + 1] : d; };
const OUT = opt('out', 'hoof');
const CASES = [['desert', 'walk'], ['desert', 'canter'], ['field', 'walk'], ['field', 'trot'], ['village', 'walk']];
const LIMBS = ['FR', 'HR'];

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const t = await open({ w: 1440, h: 900 });
  const { page } = t;
  const rows = [];
  for (const [world, gait] of CASES) {
    await t.choose(world);
    await t.gait(gait);
    await t.run(gait === 'canter' ? 8 : 6);
    for (const limb of LIMBS) {
      const res = await page.evaluate(async ({ limb, world, gait }) => {
        const h = window.__horseWorlds, c = h.controller, loco = c.treadmill.loco, cam = h.camera;
        let found = null;
        for (let i = 0; i < 900 && !found; i++) {
          h.step(1 / 60, 1);
          const u = loco.stancePhase(limb);
          const q = c.treadmill.telemetry().hooves[limb];
          if (u !== null && u > 0.42 && u < 0.58) found = { u, height: q.height, planted: q.planted, i };
          if (i % 60 === 0) await new Promise((r) => setTimeout(r, 0));
        }
        if (!found) return { error: 'no mid-stance frame found' };
        // a camera just above the ground, level with the hoof, on the near side; the field of view is narrow so the hoof fills the picture
        const toe = loco.hooves[limb].toe.clone();
        const V = toe.constructor;
        const saved = { p: cam.position.clone(), q: cam.quaternion.clone(), fov: cam.fov };
        cam.fov = 20; cam.updateProjectionMatrix();
        cam.position.set(toe.x - 1.15, toe.y + 0.1, toe.z + 0.06);
        cam.lookAt(new V(toe.x, toe.y + 0.06, toe.z - 0.02));
        cam.updateMatrixWorld(true);
        h.draw();
        const png = h.renderer.domElement.toDataURL('image/png');
        // and a second view from the front-left, lower, to see the sole against the ground plane
        cam.position.set(toe.x - 0.8, toe.y + 0.03, toe.z + 0.75);
        cam.lookAt(new V(toe.x, toe.y + 0.05, toe.z));
        cam.updateMatrixWorld(true);
        h.draw();
        const png2 = h.renderer.domElement.toDataURL('image/png');
        cam.position.copy(saved.p); cam.quaternion.copy(saved.q); cam.fov = saved.fov; cam.updateProjectionMatrix(); cam.updateMatrixWorld(true);
        return { ...found, toe: toe.toArray().map((v) => +v.toFixed(3)), png, png2 };
      }, { limb, world, gait });
      if (res.error) { console.log(world, gait, limb, res.error); continue; }
      const base = `${world}-${gait}-${limb}`;
      fs.writeFileSync(path.join(OUT, `${base}-side.png`), Buffer.from(res.png.split(',')[1], 'base64'));
      fs.writeFileSync(path.join(OUT, `${base}-front.png`), Buffer.from(res.png2.split(',')[1], 'base64'));
      const row = { world, gait, limb, plantedFlag: res.planted, stance: +res.u.toFixed(2), toeHeightAboveGroundCm: +(res.height * 100).toFixed(1), toe: res.toe };
      rows.push(row);
      console.log(JSON.stringify(row));
    }
  }
  fs.writeFileSync(path.join(OUT, 'hoof.json'), JSON.stringify(rows, null, 1));
  await t.close();
})().catch((e) => { console.error('FAILED', e); process.exit(1); });
