// Is the Marwari the same black horse in every place?
// The horse is drawn alone (every object of the world hidden) on two flat greys, 64 and 192, in each place's own light, standing at the
// standing shot. A pixel that is the same on both greys is the opaque horse; the soft contact shadow and the anti-aliased rim differ, so
// they are left out. analyse-coat.py then compares the coat between the places.
// usage: node t-coat.cjs --out DIR [--w 1440 --h 900] [--gait stand]
const fs = require('fs'); const path = require('path');
const { open } = require('./hw-common.cjs');
const a = process.argv.slice(2);
const opt = (k, d) => { const i = a.indexOf('--' + k); return i >= 0 ? a[i + 1] : d; };
const OUT = opt('out', 'coat'); const W = +opt('w', 1440), H = +opt('h', 900); const GAIT = opt('gait', 'stand');
const GREYS = [64, 192];

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const t = await open({ w: W, h: H });
  const { page, run, choose, gait } = t;
  for (const world of ['desert', 'field', 'village']) {
    await choose(world);
    await gait(GAIT);
    await run(4);
    for (const grey of GREYS) {
      const url = await page.evaluate((grey) => {
        const h = window.__horseWorlds; const scene = h.scene; const r = h.renderer;
        const hidden = [];
        scene.traverse((o) => { if (o.name && o.name.startsWith('world-') && o.visible) hidden.push(o); });
        for (const o of hidden) o.visible = false;
        let Color = null; // three's Color class, found through any light (the page does not hand over the THREE namespace)
        scene.traverse((o) => { if (!Color && o.isLight && o.color) Color = o.color.constructor; });
        const prevBg = scene.background; scene.background = null;
        const prevColor = r.getClearColor(new Color()); const prevAlpha = r.getClearAlpha();
        r.setClearColor(grey * 65793, 1); // 0xRRGGBB with R = G = B = grey, as authored (sRGB)
        h.draw();
        const data = r.domElement.toDataURL('image/png');
        r.setClearColor(prevColor, prevAlpha);
        scene.background = prevBg;
        for (const o of hidden) o.visible = true;
        return data;
      }, grey);
      fs.writeFileSync(path.join(OUT, `coat-${world}-${grey}.png`), Buffer.from(url.split(',')[1], 'base64'));
    }
    console.log('saved', world);
  }
  await t.close();
})().catch((e) => { console.error('FAILED', e.message); process.exit(1); });
