// Drives /stride the way a visitor does and checks that every control drives the real animation.
// node interact.mjs [width] [height] [gpu|swift]   (needs the dev server and PLAYWRIGHT_CORE)
import { launch, openStride, watch, sleep, out } from "./lib.mjs";

const [w = "1440", h = "900", mode = "gpu"] = process.argv.slice(2);
const mobile = +w < 700;
const browser = await launch(mode);
const ctx = await browser.newContext({ viewport: { width: +w, height: +h }, deviceScaleFactor: 1, hasTouch: mobile, isMobile: mobile });
const page = await ctx.newPage();
const log = watch(page);
await openStride(page, { query: "?stridedebug" });
await page.waitForFunction(() => !!window.__stride, null, { timeout: 60000 });
const results = [];
const check = (name, pass, detail = "") => {
  results.push({ name, pass, detail });
  console.log(`${pass ? "PASS" : "FAIL"}  ${name}${detail ? "  " + detail : ""}`);
};
const S = (fn, arg) => page.evaluate(fn, arg);

// go to the laboratory
await page.evaluate(() => document.querySelector("#laboratory").scrollIntoView({ block: "start" }));
await sleep(2500);

// 1. playback speed: strides a minute measured inside the page on the clock's own updates (no polling from here)
const rate = () =>
  S(
    () =>
      new Promise((resolve) => {
        const { clock } = window.__stride;
        clock.pause();
        clock.set(0);
        const samples = [];
        const off = clock.subscribe((c) => samples.push([performance.now(), c.phase]));
        clock.play();
        setTimeout(() => {
          off();
          clock.pause();
          let u = 0;
          for (let i = 1; i < samples.length; i++) u += ((samples[i][1] - samples[i - 1][1] + 1.5) % 1) - 0.5;
          const secs = (samples[samples.length - 1][0] - samples[0][0]) / 1000;
          const dts = samples.slice(1).map((s, i) => s[0] - samples[i][0]);
          resolve({ stridesPerMin: (u / secs) * 60, secs, frames: samples.length, meanFrameMs: dts.reduce((a, b) => a + b, 0) / dts.length, maxFrameMs: Math.max(...dts) });
        }, 4000);
      }),
  );
for (const [speed, expect] of [[1, 50], [0.5, 25], [0.25, 12.5]]) {
  await S((s) => window.__stride.clock.setSpeed(s), speed);
  const r = await rate();
  check(`playback at ${speed}x runs ${expect} strides a minute`, Math.abs(r.stridesPerMin - expect) / expect < 0.05, `measured ${r.stridesPerMin.toFixed(2)} over ${r.secs.toFixed(1)} s, ${r.frames} frames, mean ${r.meanFrameMs.toFixed(1)} ms, worst ${r.maxFrameMs.toFixed(0)} ms`);
}
await S(() => window.__stride.clock.setSpeed(1));

// 2. pause holds the pose
await S(() => window.__stride.clock.set(0.3));
await sleep(300);
const pA = await S(() => window.__stride.clock.phase);
await sleep(600);
const pB = await S(() => window.__stride.clock.phase);
check("pause holds the clock", pA === pB && Math.abs(pA - 0.3) < 1e-9, `${pA} -> ${pB}`);

// 3. frame stepping by the buttons
const step = async (label) => {
  await page.click(`button[aria-label="${label}"]`);
  await sleep(200);
};
await S(() => window.__stride.clock.set(0));
await step("Next frame");
await step("Next frame");
const fwd = await S(() => window.__stride.clock.phase);
check("next frame twice = two authored frames", Math.abs(fwd - 2 / 24) < 1e-6, `${fwd}`);
await step("Previous frame");
const back = await S(() => window.__stride.clock.phase);
check("previous frame goes back one", Math.abs(back - 1 / 24) < 1e-6, `${back}`);

// 4. keyboard on the timeline
await page.focus('[data-testid="timeline"]');
await page.keyboard.press("ArrowRight");
await page.keyboard.press("ArrowRight");
const kb = await S(() => window.__stride.clock.phase);
check("arrow keys step frames", Math.abs(kb - 3 / 24) < 1e-6, `${kb}`);
await page.keyboard.press("End");
const end = await S(() => window.__stride.clock.phase);
check("End jumps to the last frame", Math.abs(end - 23 / 24) < 1e-6, `${end}`);
await page.keyboard.press("PageDown");
const pd = await S(() => ({ p: window.__stride.clock.phase, td: window.__stride.rig.data.stance.HL.touchdown }));
check("Page Down jumps to the next landing", Math.abs(pd.p - pd.td) < 1e-6, `${pd.p}`);
await page.keyboard.press(" ");
check("Space starts playback", await S(() => window.__stride.clock.playing));
await page.keyboard.press(" ");
check("Space pauses playback", !(await S(() => window.__stride.clock.playing)));

// 5. scrubbing the graph: the clock follows, the playhead follows the clock, the 3D follows the clock
const g = await page.$('[data-testid="graph"]');
const box = await g.boundingBox();
const scrubTo = async (fx) => {
  const x = box.x + 40 + fx * (box.width - 40 - 12);
  await page.mouse.move(x, box.y + 80);
  await page.mouse.down();
  await page.mouse.move(x + 0.1, box.y + 80);
  await page.mouse.up();
  await sleep(250);
};
const syncChecks = [];
for (const fx of [0.1, 0.37, 0.62, 0.9]) {
  await scrubTo(fx);
  const r = await S(() => {
    const { clock, rig } = window.__stride;
    const el = document.querySelector('[data-testid="graph"] svg g[style*="pointer-events"]');
    const tx = el ? el.getAttribute("transform") : "";
    const live = rig.liveSample();
    return { phase: clock.phase, tx, live, toes: rig.liveToes() };
  });
  syncChecks.push({ fx, ...r });
}
check("scrubbing the graph moves the clock", syncChecks.every((s) => Math.abs(s.phase - s.fx) < 0.02), syncChecks.map((s) => s.phase.toFixed(3)).join(" "));
check("the graph playhead follows the clock", syncChecks.every((s) => { const m = /translate\(([\d.]+)/.exec(s.tx); if (!m) return false; const expect = 40 + s.phase * (box.width - 52); return Math.abs(+m[1] - expect) < 1.5; }), syncChecks.map((s) => s.tx).join(" "));

// 6. graph vs 3D: after the page's own render at each phase, the live scene equals the curve at that phase (centered)
const sync = await S(async () => {
  const { clock, rig } = window.__stride;
  const d = rig.data;
  const N = d.samples;
  const mean = (a) => a.reduce((x, y) => x + y, 0) / a.length;
  // live series from the page's own render path, at 24 phases
  const phases = Array.from({ length: 24 }, (_, i) => (i + 0.37) / 24);
  const live = [];
  for (const p of phases) {
    clock.set(p);
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    live.push(rig.liveSample());
  }
  const at = (series, p) => { const x = p * N; const i = Math.floor(x) % N; const f = x - Math.floor(x); return series[i] * (1 - f) + series[(i + 1) % N] * f; };
  // dense live series to get the live mean
  const dense = [];
  for (let i = 0; i < N; i++) { rig.setPhase(i / N); dense.push(rig.liveSample()); }
  const m = { seat: mean(dense.map((s) => s.seat[1])), pelvis: mean(dense.map((s) => s.pelvis[1])) };
  let errSeat = 0, errPel = 0;
  phases.forEach((p, i) => {
    errSeat = Math.max(errSeat, Math.abs((live[i].seat[1] - m.seat) * 1000 - at(d.channels.vertical.horse, p)));
    errPel = Math.max(errPel, Math.abs((live[i].pelvis[1] - m.pelvis) * 1000 - at(d.channels.vertical.rider, p)));
  });
  return { errSeat, errPel, p2pSeat: d.channels.vertical.horseP2P, p2pPelvis: d.channels.vertical.riderP2P };
});
check("graph curve of the horse's back equals the live saddle in the scene", sync.errSeat < 0.05, `max error ${sync.errSeat.toFixed(4)} mm of ${sync.p2pSeat.toFixed(2)} mm peak to peak`);
check("graph curve of the rider's pelvis equals the live pelvis bone in the scene", sync.errPel < 0.05, `max error ${sync.errPel.toFixed(4)} mm of ${sync.p2pPelvis.toFixed(2)} mm peak to peak`);

// 7. views and layers drive the real scene
const showBtn = (label) => page.click(`[aria-label="What is shown"] button:text-is("${label}")`);
await showBtn("Horse");
await sleep(900);
let shown = await S(() => window.__stride.rig.shown);
check("Horse view hides the rider", shown.rider === 0 && !shown.riderVisible, JSON.stringify(shown));
await showBtn("Rider");
await sleep(900);
shown = await S(() => window.__stride.rig.shown);
check("Rider view ghosts the horse and shows the rider", shown.rider === 1 && shown.coat < 0.2, JSON.stringify(shown));
await showBtn("Horse and rider");
await sleep(900);
await showBtn("Skeleton");
await sleep(900);
shown = await S(() => window.__stride.rig.shown);
check("Skeleton shows the bones through the coat", shown.skeleton && shown.coat < 0.2, JSON.stringify(shown));
await page.screenshot({ path: out(`i-${w}-skeleton.png`) });
await showBtn("Skeleton");
await sleep(700);

// 8. camera presets move the real camera
const camPos = () => S(() => window.__stride.ctrl.camera.position.toArray().map((v) => +v.toFixed(2)));
let before = await camPos();
for (const label of ["Behind", "Above", "Front", "Three-quarter", "Side"]) {
  await page.click(`[aria-label="Camera angle"] button:text-is("${label}")`);
  await sleep(1500);
  const p = await camPos();
  check(`camera "${label}" moves the camera`, JSON.stringify(p) !== JSON.stringify(before), JSON.stringify(p));
  before = p;
  await page.screenshot({ path: out(`i-${w}-cam-${label.toLowerCase()}.png`) });
}

// 9. hotspots: from the list, and from the marker on the horse
const ids = ["spine", "pelvis", "shoulder", "hindquarters", "rider-pelvis", "hoof"];
for (const [i, id] of ids.entries()) {
  await page.click(`ul button:has(span.font-mono:text-is("${String(i + 1).padStart(2, "0")}"))`);
  await sleep(1600);
  const st = await S(() => ({ h: window.__stride.store.hotspot, card: !!document.querySelector('[data-testid="hotspot-card"]'), cam: window.__stride.ctrl.camera.position.toArray().map((v) => +v.toFixed(2)), mk: (() => { const m = document.querySelector('[data-hotspot="' + window.__stride.store.hotspot + '"]'); return m ? { op: m.style.opacity, tf: m.style.transform } : null; })() }));
  check(`hotspot ${id}: list selects it, shows the card, focuses the camera`, st.h === id && st.card, JSON.stringify(st));
  await page.screenshot({ path: out(`i-${w}-hs-${id}.png`) });
}
// a marker click: back to the side view so the marker is in sight, then click the marker itself
await page.keyboard.press("Escape");
await page.click(`[aria-label="Camera angle"] button:text-is("Side")`);
await sleep(1600);
const mk = await S(() => { const m = document.querySelector('[data-hotspot="spine"]'); return m ? { op: m.style.opacity, tf: m.style.transform } : null; });
console.log("spine marker", JSON.stringify(mk));
await page.click('button[data-hotspot="spine"]');
await sleep(800);
check("a marker on the horse selects its part", (await S(() => window.__stride.store.hotspot)) === "spine");
await page.keyboard.press("Escape");
await sleep(300);
check("Escape closes the part", (await S(() => window.__stride.store.hotspot)) === null);

// 10. the wheel and a vertical swipe still scroll the page
await page.evaluate(() => window.scrollTo(0, document.querySelector("#laboratory").offsetTop + 200));
await sleep(600);
const cv = await page.$('[data-testid="stage"] canvas');
const cb = await cv.boundingBox();
const y0 = await S(() => window.scrollY);
await page.mouse.move(cb.x + cb.width * 0.3, cb.y + cb.height * 0.3);
await page.mouse.wheel(0, 300);
await sleep(1200);
const y1 = await S(() => window.scrollY);
check("a wheel over the canvas scrolls the page", y1 > y0 + 100, `scrollY ${y0} -> ${y1}`);
// the site's smooth scroll (Lenis) takes every wheel event on the window; the canvas must add nothing to that
const wheelPrevented = await S(() => { const fire = (el) => { const ev = new WheelEvent("wheel", { deltaY: 100, bubbles: true, cancelable: true }); el.dispatchEvent(ev); return ev.defaultPrevented; }; return { canvas: fire(document.querySelector('[data-testid="stage"] canvas')), body: fire(document.body) }; });
check("the canvas cancels no wheel event that the page itself would not", wheelPrevented.canvas === wheelPrevented.body, JSON.stringify(wheelPrevented));
const ta = await S(() => getComputedStyle(document.querySelector('[data-testid="stage"] canvas')).touchAction);
check("the canvas lets vertical swipes through (touch-action)", /pan-y/.test(ta), ta);

// 11. console
check("no console errors", log.errors.length === 0, JSON.stringify(log.errors.slice(0, 3)));
console.log(`\n${results.filter((r) => r.pass).length} passed, ${results.filter((r) => !r.pass).length} failed`);
await browser.close();
process.exit(results.some((r) => !r.pass) ? 1 : 0);
