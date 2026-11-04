// Hoof contact and sliding, measured on the hoof MESH (not only the toe bone point): for every sample of the stride the lowest part of each hoof
// (vertices skinned to the hoof bone), its height above the floor plane, and where that contact patch sits in the ground's frame.
// node feet.mjs [out.json]
import fs from "node:fs";
import { launch, openStride, out } from "./lib.mjs";

const browser = await launch("swift");
const page = await (await browser.newContext({ viewport: { width: 1280, height: 800 } })).newPage();
await openStride(page, { query: "?stridedebug" });
await page.waitForFunction(() => !!window.__stride, null, { timeout: 60000 });
const res = await page.evaluate((plant) => {
  const { rig } = window.__stride;
  rig.setPlanting(plant);
  window.__stride.clock.pause();
  const horse = rig.horse;
  const mesh = horse.mesh;
  const geo = mesh.geometry;
  const si = geo.attributes.skinIndex;
  const sw = geo.attributes.skinWeight;
  const bones = mesh.skeleton.bones;
  const L = 1.152; // authored stride length
  const T = 0.8;
  const N = rig.data.samples;
  const limbs = { FL: "Hoof_F_L", FR: "Hoof_F_R", HL: "Hoof_B_L", HR: "Hoof_B_R" };
  const sets = {};
  for (const [l, name] of Object.entries(limbs)) {
    const bi = bones.findIndex((b) => b.name === name);
    const verts = [];
    for (let i = 0; i < si.count; i++) {
      let w = 0;
      for (let k = 0; k < 4; k++) if (si.getComponent(i, k) === bi) w += sw.getComponent(i, k);
      if (w > 0.9) verts.push(i);
    }
    sets[l] = verts;
  }
  const v = new (rig.horse.root.position.constructor)();
  const series = { FL: [], FR: [], HL: [], HR: [] };
  for (let s = 0; s < N; s++) {
    rig.setPhase(s / N);
    for (const l of Object.keys(limbs)) {
      let ymin = Infinity;
      const pts = [];
      for (const i of sets[l]) { mesh.getVertexPosition(i, v); pts.push([v.x, v.y, v.z]); if (v.y < ymin) ymin = v.y; }
      let cx = 0, cz = 0, n = 0;
      for (const p of pts) if (p[1] < ymin + 0.012) { cx += p[0]; cz += p[2]; n++; }
      series[l].push({ y: ymin, x: cx / n, z: cz / n });
    }
  }
  const dt = T / N;
  // The contact patch of a rolling hoof travels along the ground legitimately (heel to toe), so it overstates slip. The honest measure follows ONE
  // material point of the hoof, the vertex that is lowest in the middle of the stance, for as long as it is within 1.5 cm of the floor.
  const material = {};
  for (const l of Object.keys(limbs)) {
    const st = rig.data.stance[l];
    const start = Math.round(st.touchdown * N);
    const len = Math.round(st.duty * N);
    rig.setPhase(((start + Math.floor(len / 2)) % N) / N);
    let best = sets[l][0], by = Infinity;
    for (const i of sets[l]) { mesh.getVertexPosition(i, v); if (v.y < by) { by = v.y; best = i; } }
    const track = [];
    for (let s = 0; s < N; s++) { rig.setPhase(s / N); mesh.getVertexPosition(best, v); track.push([v.x, v.y, v.z]); }
    let drift = 0, vmax = 0, sumsq = 0, cnt = 0;
    let firstK = -1, lastK = -1;
    // the planted period: from 5 % of a stride after touchdown to 6 % before lift-off (a hoof is still arriving or already leaving outside it)
    const k0 = Math.round(0.05 * N), k1 = len - Math.round(0.06 * N);
    for (let k = k0; k < k1; k++) {
      const i = (start + k) % N;
      if (track[i][1] < 0.015) { if (firstK < 0) firstK = k; lastK = k; }
    }
    const z0 = firstK >= 0 ? track[(start + firstK) % N][2] : 0, x0 = firstK >= 0 ? track[(start + firstK) % N][0] : 0;
    for (let k = Math.max(firstK, 0); k <= lastK; k++) {
      const i = (start + k) % N;
      const a = track[(i + N - 1) % N], b = track[(i + 1) % N];
      const sp = Math.hypot((b[2] - a[2]) / (2 * dt) + L / T, (b[0] - a[0]) / (2 * dt));
      const gz = track[i][2] + L * ((k - firstK) / N) - z0, gx = track[i][0] - x0;
      drift = Math.max(drift, Math.hypot(gx, gz));
      vmax = Math.max(vmax, sp); sumsq += sp * sp; cnt++;
    }
    material[l] = { plantedPeriodOfStride: +(((k1 - k0) / N)).toFixed(3), contactFractionOfStride: +(((lastK - firstK + 1) / N)).toFixed(3), driftCm: +(drift * 100).toFixed(1), speedMaxCmS: +(vmax * 100).toFixed(0), speedRmsCmS: +(Math.sqrt(sumsq / Math.max(1, cnt)) * 100).toFixed(0) };
  }
  const report = {};
  for (const l of Object.keys(limbs)) {
    const st = rig.data.stance[l];
    const start = Math.round(st.touchdown * N);
    const len = Math.round(st.duty * N);
    let hMin = Infinity, hMax = -Infinity, hSum = 0, drift = 0, driftMid = 0, vMid = 0, vEnd = 0, vStart = 0;
    const z0 = series[l][start].z, x0 = series[l][start].x;
    for (let k = 0; k < len; k++) {
      const i = (start + k) % N;
      const q = series[l][i];
      hMin = Math.min(hMin, q.y); hMax = Math.max(hMax, q.y); hSum += q.y;
      const gz = q.z + L * (k / N) - z0, gx = q.x - x0;
      drift = Math.max(drift, Math.hypot(gx, gz));
      const a = series[l][(i + N - 1) % N], b = series[l][(i + 1) % N];
      const sp = Math.hypot((b.z - a.z) / (2 * dt) + L / T, (b.x - a.x) / (2 * dt));
      if (k < len * 0.15) vStart = Math.max(vStart, sp);
      else if (k < len * 0.8) { vMid = Math.max(vMid, sp); driftMid = Math.max(driftMid, Math.hypot(gx, gz)); }
      else vEnd = Math.max(vEnd, sp);
    }
    report[l] = { touchdown: +st.touchdown.toFixed(3), duty: +st.duty.toFixed(3), soleHeightCm: { min: +(hMin * 100).toFixed(1), mean: +((hSum / len) * 100).toFixed(1), max: +(hMax * 100).toFixed(1) }, driftWholeStanceCm: +(drift * 100).toFixed(1), driftUntil80pcCm: +(driftMid * 100).toFixed(1), speedFirst15pcCmS: +(vStart * 100).toFixed(0), speedMidCmS: +(vMid * 100).toFixed(0), speedLast20pcCmS: +(vEnd * 100).toFixed(0), vertices: sets[l].length, materialPoint: material[l] };
  }
  return { planting: plant, limbs: report, worstResidualCm: null };
}, process.env.NOPLANT ? false : true);
console.log(JSON.stringify(res, null, 1));
fs.writeFileSync(out(process.argv[2] || (process.env.NOPLANT ? "feet-authored.json" : "feet-planted.json")), JSON.stringify(res, null, 1));
await browser.close();
