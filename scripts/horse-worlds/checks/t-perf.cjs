// What a visit costs, measured on the running viewer: the art each place downloads (bytes on the wire, per device class), draw calls,
// triangles, textures and an estimate of the video memory they take, in every place and at the heaviest gait it offers. The cloud
// browser draws with software GL, so frame times are NOT reported: only counts and sizes, which do not depend on the GPU.
// usage: node t-perf.cjs --out FILE.json [--w 1440 --h 900 --dpr 1 --touch]
const fs = require('fs');
const { open } = require('./hw-common.cjs');
const a = process.argv.slice(2);
const opt = (k, d) => { const i = a.indexOf('--' + k); return i >= 0 ? a[i + 1] : d; };
const OUT = opt('out', 'perf.json'); const W = +opt('w', 1440), H = +opt('h', 900), DPR = +opt('dpr', 1); const TOUCH = a.includes('--touch');

(async () => {
  const t = await open({ w: W, h: H, dpr: DPR, touch: TOUCH, debug: true });
  const { page } = t;
  const art = new Map(); // url -> bytes
  page.on('response', async (res) => {
    const u = res.url();
    if (!/\/images\/horse-worlds\//.test(u) && !/\.glb(\?|$)/.test(u)) return;
    try { const b = await res.body(); art.set(u.replace(/^https?:\/\/[^/]+/, ''), b.length); } catch { /* aborted */ }
  });
  // everything fetched before this point belongs to the first place (the desert) and the horse
  const results = { viewport: `${W}x${H}@${DPR}${TOUCH ? ' touch' : ''}`, worlds: {} };
  const snapshot = (label) => { const rows = [...art.entries()]; return { label, files: rows.length, bytes: rows.reduce((s, [, n]) => s + n, 0) }; };
  const measure = (world) => page.evaluate((world) => {
    const h = window.__horseWorlds, c = h.controller, r = h.renderer, scene = h.scene;
    h.draw();
    const info = r.info;
    const frame = { calls: info.render.calls, triangles: info.render.triangles, points: info.render.points, lines: info.render.lines };
    const memory = { geometries: info.memory.geometries, textures: info.memory.textures, programs: info.programs ? info.programs.length : null };
    // textures that the scene's materials hold (maps, normal maps, uniforms) and the environment
    const seen = new Set(); const list = [];
    const add = (tex, where) => {
      if (!tex || !tex.isTexture || seen.has(tex.uuid)) return; seen.add(tex.uuid);
      const img = tex.image; const w = (img && (img.width || img.videoWidth)) || (tex.source && tex.source.data && tex.source.data.width) || 0; const hh = (img && (img.height || img.videoHeight)) || (tex.source && tex.source.data && tex.source.data.height) || 0;
      const mips = tex.generateMipmaps || (tex.mipmaps && tex.mipmaps.length) ? 4 / 3 : 1;
      list.push({ where, w, h: hh, bytes: Math.round(w * hh * 4 * mips) });
    };
    scene.traverse((o) => {
      const mats = o.material ? (Array.isArray(o.material) ? o.material : [o.material]) : [];
      for (const m of mats) {
        for (const k of Object.keys(m)) { const v = m[k]; if (v && v.isTexture) add(v, o.name || o.type + ':' + k); }
        if (m.uniforms) for (const k of Object.keys(m.uniforms)) { const v = m.uniforms[k] && m.uniforms[k].value; if (v && v.isTexture) add(v, (o.name || o.type) + ':' + k); }
      }
    });
    if (scene.environment) {
      // a PMREM target: a packed cube map of size ~ (3 x 4 faces) in a render target
      const e = scene.environment; const img = e.image; const w = (img && img.width) || 256, hh = (img && img.height) || 1024;
      list.push({ where: 'environment (PMREM)', w, h: hh, bytes: Math.round(w * hh * 8 * 4 / 3) }); // half-float RGBA
    }
    const total = list.reduce((s, x) => s + x.bytes, 0);
    const sun = scene.children.find((o) => o.isDirectionalLight && o.castShadow);
    const sm = sun && sun.shadow.map ? sun.shadow.map : null;
    const shadow = sm ? { w: sm.width, h: sm.height, bytes: sm.width * sm.height * 4 } : null;
    const cv = r.domElement;
    const worldOnly = list.filter((x) => !/^Marwari|^environment/.test(x.where));
    return { frame, memory, textures: { unique: list.length, estimatedBytes: total, worldOnlyBytes: worldOnly.reduce((s, x) => s + x.bytes, 0), worldOnlyCount: worldOnly.length, all: list.sort((a, b) => b.bytes - a.bytes) }, shadow, canvas: { w: cv.width, h: cv.height, bytes: cv.width * cv.height * 4 * 2 }, pixelRatio: r.getPixelRatio(), jsHeapMB: performance.memory ? +(performance.memory.usedJSHeapSize / 1048576).toFixed(1) : null, stage: c.world };
  }, world);

  const order = [['desert', ['stand', 'gallop']], ['field', ['stand', 'canter']], ['village', ['stand', 'walk']]];
  let prev = { bytes: 0, files: 0 };
  for (const [world, gaits] of order) {
    await t.choose(world);
    await t.run(1.5);
    await page.waitForTimeout(800);
    const row = { cumulative: snapshot(world), perGait: {} };
    row.fetchedForThisPlace = { files: row.cumulative.files - prev.files, bytes: row.cumulative.bytes - prev.bytes };
    prev = row.cumulative;
    for (const g of gaits) {
      await t.gait(g); await t.run(g === 'gallop' ? 7 : 4);
      row.perGait[g] = await measure(world);
    }
    results.worlds[world] = row;
    console.log(world, JSON.stringify({ fetched: row.fetchedForThisPlace, stand: row.perGait.stand && { calls: row.perGait.stand.frame.calls, tris: row.perGait.stand.frame.triangles }, heavy: gaits.slice(1).map((g) => ({ g, calls: row.perGait[g].frame.calls, tris: row.perGait[g].frame.triangles, tex: row.perGait[g].textures.unique, texMB: +(row.perGait[g].textures.estimatedBytes / 1048576).toFixed(1), worldTexMB: +(row.perGait[g].textures.worldOnlyBytes / 1048576).toFixed(1) })) }));
  }
  results.files = [...art.entries()].sort((x, y) => y[1] - x[1]).map(([u, n]) => ({ url: u, bytes: n }));
  fs.writeFileSync(OUT, JSON.stringify(results, null, 1));
  console.log('total art + model on the wire:', JSON.stringify(snapshot('all')));
  await t.close();
})().catch((e) => { console.error('FAILED', e); process.exit(1); });
