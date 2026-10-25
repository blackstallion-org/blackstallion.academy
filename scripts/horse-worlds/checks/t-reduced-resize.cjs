// Reduced motion, real loop: the viewer is resized (a phone turned on its side, a window dragged narrower). The camera has to end up
// exactly where it would be had the page been opened at that size, with the whole horse in the picture, and the loop has to go back
// to sleep. Compares a page resized in flight with a page opened at the final size.
// usage: node t-reduced-resize.cjs --out DIR
const fs = require('fs'); const path = require('path');
const { open } = require('./hw-common.cjs');
const a = process.argv.slice(2);
const opt = (k, d) => { const i = a.indexOf('--' + k); return i >= 0 ? a[i + 1] : d; };
const OUT = opt('out', 'reduced-resize');
const checks = [];
const check = (name, ok, detail) => { checks.push({ name, ok: !!ok, detail }); console.log((ok ? 'PASS ' : 'FAIL ') + name + (detail !== undefined ? '  ' + JSON.stringify(detail) : '')); };

const readCam = (page) => page.evaluate(() => {
  const h = window.__horseWorlds, c = h.controller, cam = h.camera;
  cam.updateMatrixWorld();
  const root = c.treadmill.loco.root; root.updateMatrixWorld(true);
  const V = cam.position.constructor; const v = new V(); const cv = h.renderer.domElement;
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  h.draw();
  root.traverse((o) => {
    if (!o.isMesh || !o.visible) return;
    const pos = o.geometry.getAttribute('position'); const step = Math.max(1, Math.floor(pos.count / 4000));
    for (let i = 0; i < pos.count; i += step) {
      if (o.isSkinnedMesh) o.getVertexPosition(i, v); else v.fromBufferAttribute(pos, i);
      v.applyMatrix4(o.matrixWorld).project(cam);
      const px = ((v.x + 1) / 2) * cv.width, py = ((1 - v.y) / 2) * cv.height;
      x0 = Math.min(x0, px); x1 = Math.max(x1, px); y0 = Math.min(y0, py); y1 = Math.max(y1, py);
    }
  });
  return { dist: +cam.position.distanceTo(c.rig.target).toFixed(4), rigDist: +c.rig.distance.toFixed(4), aspect: +cam.aspect.toFixed(4), settled: c.rig.settled, w: cv.width, h: cv.height, bbox: { x0: Math.round(x0), x1: Math.round(x1), y0: Math.round(y0), y1: Math.round(y1) } };
});

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  // A: opened wide, then narrowed in flight
  const A = await open({ w: 1440, h: 900, reduced: true });
  await A.page.evaluate(() => window.__horseWorlds.pause(false));
  await A.page.waitForTimeout(2500);
  const wide = await readCam(A.page);
  await A.page.setViewportSize({ width: 390, height: 844 });
  await A.box.evaluate((el) => el.scrollIntoView({ block: 'center' })); // keep the viewer on screen so that its loop is allowed to draw
  await A.page.waitForTimeout(3500);
  const frames0 = await A.page.evaluate(() => window.__horseWorlds.renderer.info.render.frame);
  await A.page.waitForTimeout(1500);
  const frames1 = await A.page.evaluate(() => window.__horseWorlds.renderer.info.render.frame);
  const narrowed = await readCam(A.page);
  // and back out again
  await A.page.setViewportSize({ width: 1440, height: 900 });
  await A.box.evaluate((el) => el.scrollIntoView({ block: 'center' }));
  await A.page.waitForTimeout(3500);
  const widened = await readCam(A.page);
  await A.close();
  // B: opened at the narrow size
  const B = await open({ w: 390, h: 844, reduced: true });
  await B.page.evaluate(() => window.__horseWorlds.pause(false));
  await B.page.waitForTimeout(2500);
  const direct = await readCam(B.page);
  await B.close();
  console.log(JSON.stringify({ wide, narrowed, direct, widened }));
  const insideOf = (m) => m.bbox.x0 >= 0 && m.bbox.x1 <= m.w && m.bbox.y0 >= 0 && m.bbox.y1 <= m.h;
  check('after narrowing, the camera is where a page opened at that size puts it', Math.abs(narrowed.dist - direct.dist) < 0.05, { resizedInFlight: narrowed.dist, openedThere: direct.dist });
  check('after narrowing, the whole horse is in the picture', insideOf(narrowed), narrowed.bbox);
  check('after widening again, the camera is back where it was', Math.abs(widened.dist - wide.dist) < 0.05, { before: wide.dist, after: widened.dist });
  check('the loop sleeps once the camera is there', frames1 - frames0 <= 2, { framesIn1_5s: frames1 - frames0 });
  const noise = A.logs.filter((l) => !/hydrat|Reduced Motion enabled/i.test(l));
  if (noise.length) console.log('console:', noise.join('\n'));
  fs.writeFileSync(path.join(OUT, 'result.json'), JSON.stringify({ checks, wide, narrowed, direct, widened }, null, 1));
  console.log(`\n${checks.filter((c) => c.ok).length}/${checks.length} checks pass`);
  if (checks.some((c) => !c.ok)) process.exitCode = 1;
})().catch((e) => { console.error('FAILED', e); process.exit(1); });
