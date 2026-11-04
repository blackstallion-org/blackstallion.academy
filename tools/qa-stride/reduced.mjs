// Reduced motion: nothing is pinned, the horse is still until Play is pressed, and the canvas draws no frame by itself.
import { launch, openStride, watch, sleep, out } from "./lib.mjs";
const browser = await launch("gpu");
const ctx = await browser.newContext({ viewport: { width: +(process.argv[2] || 1440), height: +(process.argv[3] || 900) }, reducedMotion: "reduce" });
const page = await ctx.newPage();
const log = watch(page);
await openStride(page, { query: "?stridedebug", canvas: false });
const results = [];
const check = (n, p, d = "") => { results.push(p); console.log(`${p ? "PASS" : "FAIL"}  ${n}${d ? "  " + d : ""}`); };
const sticky = await page.evaluate(() => [...document.querySelectorAll("*")].filter((e) => getComputedStyle(e).position === "sticky" && e.closest("main")).length);
check("nothing in the page is pinned (position: sticky)", sticky === 0, `${sticky} sticky elements`);
await page.evaluate(() => document.querySelector("#laboratory").scrollIntoView({ block: "start" }));
await page.waitForFunction(() => !!window.__stride, null, { timeout: 90000 });
await sleep(2500);
const st = await page.evaluate(() => { const { clock } = window.__stride; return { playing: clock.playing, phase: clock.phase }; });
check("the clock is paused at a still pose", !st.playing && Math.abs(st.phase - 0.12) < 1e-6, JSON.stringify(st));
// two stage captures 1.5 s apart must be identical
const stage = await page.$('[data-testid="stage"]');
await stage.scrollIntoViewIfNeeded();
await sleep(500);
const a = await stage.screenshot();
await sleep(1500);
const b = await stage.screenshot();
check("two captures of the stage 1.5 s apart are byte-identical (no motion)", a.equals(b), `${a.length} bytes`);
await page.screenshot({ path: out("rm-lab.png") });
// play still works when asked for
await page.click('button[aria-label="Play"]');
await sleep(1200);
const moved = await page.evaluate(() => window.__stride.clock.phase);
check("pressing Play plays (the visitor asked for it)", moved !== 0.12, `phase ${moved.toFixed(3)}`);
await page.click('button[aria-label="Pause"]');
// camera moves are instant, not eased
await page.click('[aria-label="Camera angle"] button:text-is("Behind")');
await sleep(250);
const cam = await page.evaluate(() => window.__stride.ctrl.camera.position.toArray().map((v) => +v.toFixed(2)));
check("camera changes are instant under reduced motion", cam[2] < -3 && Math.abs(cam[0]) < 0.2, JSON.stringify(cam));
check("no console errors", log.errors.length === 0, JSON.stringify(log.errors.slice(0, 3)));
await browser.close();
process.exit(results.every(Boolean) ? 0 : 1);
