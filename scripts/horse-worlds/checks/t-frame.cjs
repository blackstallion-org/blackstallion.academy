// Framing: the horse must stay in the middle of the picture, whole, in every place and gait, on a desktop and on a phone, and clear
// of the buttons laid over the picture. The horse's outline is measured from its real skinned vertices projected through the
// camera, not guessed from a screenshot. Also writes a picture of the viewer for each case, and of the page's top 120 px.
// usage: node t-frame.cjs --out DIR [--w 1440 --h 900]
const fs = require('fs');
const path = require('path');
const { open } = require('./hw-common.cjs');
const a = process.argv.slice(2);
const opt = (k, d) => { const i = a.indexOf('--' + k); return i >= 0 ? a[i + 1] : d; };
const OUT = opt('out', 'frame-out');
const W = +opt('w', 1440), H = +opt('h', 900);
const PLAN = [
  ['desert', ['stand', 'walk', 'canter', 'gallop']],
  ['field', ['stand', 'walk', 'trot', 'canter']],
  ['village', ['stand', 'walk']],
];

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const t = await open({ w: W, h: H });
  const { page, box } = t;
  const rows = [];
  const measure = () => page.evaluate(() => {
    const h = window.__horseWorlds, c = h.controller;
    h.draw();
    const cam = h.camera; cam.updateMatrixWorld();
    const root = c.treadmill.loco.root; root.updateMatrixWorld(true);
    const V = cam.position.constructor;
    const v = new V();
    const cv = h.renderer.domElement;
    const cw = cv.width, ch = cv.height;
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9, n = 0;
    root.traverse((o) => {
      if (!o.isMesh || !o.visible) return;
      const pos = o.geometry.getAttribute('position');
      const step = Math.max(1, Math.floor(pos.count / 5000));
      for (let i = 0; i < pos.count; i += step) {
        if (o.isSkinnedMesh) o.getVertexPosition(i, v); else v.fromBufferAttribute(pos, i);
        v.applyMatrix4(o.matrixWorld).project(cam);
        const px = ((v.x + 1) / 2) * cw, py = ((1 - v.y) / 2) * ch;
        if (px < x0) x0 = px; if (px > x1) x1 = px; if (py < y0) y0 = py; if (py > y1) y1 = py; n++;
      }
    });
    const boxEl = document.querySelector('[data-testid=horse-worlds]');
    const cr = cv.getBoundingClientRect();
    const sx = cr.width / cw, sy = cr.height / ch;
    const ui = [...boxEl.querySelectorAll('[role=group], button')].map((e) => {
      const r = e.getBoundingClientRect();
      return { name: (e.getAttribute('aria-label') || e.textContent || '').trim().slice(0, 22), tag: e.tagName, role: e.getAttribute('role'), x: r.x - cr.x, y: r.y - cr.y, w: r.width, h: r.height };
    });
    return { cssW: cr.width, cssH: cr.height, bbox: { x0: x0 * sx, y0: y0 * sy, x1: x1 * sx, y1: y1 * sy }, verts: n, ui, fov: cam.fov, aspect: cam.aspect, camDist: cam.position.length() };
  });

  for (const [world, gaits] of PLAN) {
    await t.choose(world);
    for (const g of gaits) {
      await t.gait(g);
      await t.run(g === 'gallop' ? 9 : 6);
      const m = await measure();
      const { bbox, cssW, cssH } = m;
      const bw = bbox.x1 - bbox.x0, bh = bbox.y1 - bbox.y0;
      const cx = (bbox.x0 + bbox.x1) / 2, cy = (bbox.y0 + bbox.y1) / 2;
      // overlap of the horse's outline with the leaf buttons and the groups laid over the picture
      const overlaps = m.ui.filter((e) => {
        const ox = Math.min(bbox.x1, e.x + e.w) - Math.max(bbox.x0, e.x);
        const oy = Math.min(bbox.y1, e.y + e.h) - Math.max(bbox.y0, e.y);
        return ox > 0 && oy > 0;
      }).map((e) => `${e.role || e.tag}:${e.name}`);
      const row = {
        world, gait: g, viewport: `${W}x${H}`, picture: `${Math.round(cssW)}x${Math.round(cssH)}`,
        horse: { w: Math.round(bw), h: Math.round(bh), centreXOffsetPct: +(100 * (cx - cssW / 2) / cssW).toFixed(1), centreYOffsetPct: +(100 * (cy - cssH / 2) / cssH).toFixed(1) },
        marginsPct: { left: +(100 * bbox.x0 / cssW).toFixed(1), right: +(100 * (cssW - bbox.x1) / cssW).toFixed(1), top: +(100 * bbox.y0 / cssH).toFixed(1), bottom: +(100 * (cssH - bbox.y1) / cssH).toFixed(1) },
        widthPct: +(100 * bw / cssW).toFixed(1), heightPct: +(100 * bh / cssH).toFixed(1),
        inside: bbox.x0 >= 0 && bbox.y0 >= 0 && bbox.x1 <= cssW && bbox.y1 <= cssH,
        overlapsControls: overlaps,
      };
      rows.push(row);
      await box.screenshot({ path: path.join(OUT, `${world}-${g}.png`), timeout: 90000 });
      console.log(JSON.stringify(row));
    }
  }
  // the page's top 120 px, at the top of the page and where the section starts
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(OUT, 'page-top.png') });
  const sec = await page.evaluate(() => {
    const s = document.querySelector('#worlds-h')?.closest('section');
    if (!s) return null;
    const y = s.getBoundingClientRect().top + window.scrollY;
    window.scrollTo(0, y - 8);
    return y;
  });
  await page.waitForTimeout(900);
  await page.screenshot({ path: path.join(OUT, 'section-top.png') });
  fs.writeFileSync(path.join(OUT, 'frame.json'), JSON.stringify({ rows, sectionTop: sec }, null, 1));
  const noise = t.logs.filter((l) => !/hydrat/i.test(l));
  if (noise.length) console.log(noise.join('\n'));
  await t.close();
})().catch((e) => { console.error('FAILED', e); process.exit(1); });
