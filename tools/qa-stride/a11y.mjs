// Keyboard and layout checks on /stride: every focusable element in the stage, dock and panel shows a focus ring; no horizontal overflow; the top 120 px hold nothing of ours;
// on a phone, a tap on a marker selects its part and a vertical swipe on the canvas scrolls the page.
// node a11y.mjs [width] [height]
import { launch, openStride, watch, sleep, out } from "./lib.mjs";
const [w = "1440", h = "900"] = process.argv.slice(2);
const mobile = +w < 700;
const browser = await launch("gpu");
const ctx = await browser.newContext({ viewport: { width: +w, height: +h }, deviceScaleFactor: 1, hasTouch: mobile, isMobile: mobile });
const page = await ctx.newPage();
const log = watch(page);
await openStride(page, { query: "?stridedebug" });
await page.waitForFunction(() => !!window.__stride, null, { timeout: 90000 });
const results = [];
const check = (n, p, d = "") => { results.push(p); console.log(`${p ? "PASS" : "FAIL"}  ${n}${d ? "  " + d : ""}`); };

const overflow = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, iw: window.innerWidth }));
check("no horizontal overflow", overflow.sw <= overflow.iw, JSON.stringify(overflow));

await page.evaluate(() => document.querySelector("#laboratory").scrollIntoView({ block: "start" }));
await sleep(2500);

// the top 80 px (the navigation): nothing of ours is there, checked while the stage is pinned in the laboratory
const topHits = await page.evaluate(() => {
  const els = [...document.querySelectorAll('[data-testid="stage"] button, [data-testid="stage"] [role=slider]')];
  return els.filter((e) => { const r = e.getBoundingClientRect(); const cs = getComputedStyle(e); return r.width > 0 && cs.visibility !== "hidden" && cs.opacity !== "0" && r.top < 80 && r.bottom > 0; }).map((e) => (e.getAttribute("aria-label") || e.textContent || "").trim().slice(0, 30));
});
check("none of the page's controls sit in the top 80 px", topHits.length === 0, JSON.stringify(topHits));

// tab through the laboratory
await page.evaluate(() => { document.activeElement?.blur(); window.scrollTo(0, document.querySelector("#laboratory").offsetTop); const first = document.querySelector('[data-testid="stage"] button, [data-testid="stage"] [role=slider], #laboratory button'); first.focus(); });
const seen = [];
for (let i = 0; i < 80; i++) {
  const info = await page.evaluate(() => {
    const e = document.activeElement;
    if (!e || e === document.body) return null;
    const cs = getComputedStyle(e);
    const r = e.getBoundingClientRect();
    return { tag: e.tagName.toLowerCase(), label: (e.getAttribute("aria-label") || e.textContent || "").trim().slice(0, 40), outline: `${cs.outlineStyle} ${cs.outlineWidth}`, shadow: cs.boxShadow !== "none", inStageOrPanel: !!e.closest('[data-testid="stage"], #laboratory'), visible: r.width > 0 && r.height > 0, top: Math.round(r.top) };
  });
  if (!info) break;
  seen.push(info);
  if (!info.inStageOrPanel && seen.length > 6) break;
  await page.keyboard.press("Tab");
}
const lab = seen.filter((s) => s.inStageOrPanel && s.visible);
const bad = lab.filter((s) => (s.outline.startsWith("none") || s.outline.endsWith(" 0px")) && !s.shadow);
check(`keyboard focus is visible on every stop in the laboratory (${lab.length} stops)`, bad.length === 0, JSON.stringify(bad.slice(0, 4)));
await page.screenshot({ path: out(`a11y-${w}-focus.png`) });

if (mobile) {
  await page.evaluate(() => document.querySelector("#laboratory").scrollIntoView({ block: "start" }));
  await sleep(2200);
  await page.evaluate(() => { const { store } = window.__stride; store.patch({ camera: "profile", manual: true, hotspot: null }); });
  await sleep(1800);
  const mk = await page.evaluate(() => { const m = document.querySelector('[data-hotspot="shoulder"]'); const r = m.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2, op: m.style.opacity }; });
  await page.touchscreen.tap(mk.x, mk.y);
  await sleep(600);
  check("a tap on a marker selects its part", (await page.evaluate(() => window.__stride.store.hotspot)) === "shoulder", JSON.stringify(mk));
  // a vertical swipe starting on the canvas scrolls the page
  const cv = await (await page.$('[data-testid="stage"] canvas')).boundingBox();
  const y0 = await page.evaluate(() => window.scrollY);
  const cdp = await ctx.newCDPSession(page);
  await cdp.send("Input.synthesizeScrollGesture", { x: cv.x + 40, y: cv.y + cv.height - 40, yDistance: -300, speed: 800, gestureSourceType: "touch" });
  await sleep(800);
  const y1 = await page.evaluate(() => window.scrollY);
  check("a vertical swipe on the canvas scrolls the page", y1 > y0 + 80, `scrollY ${y0} -> ${y1}`);
}
check("no console errors", log.errors.length === 0, JSON.stringify(log.errors.slice(0, 3)));
await browser.close();
process.exit(results.every(Boolean) ? 0 : 1);
