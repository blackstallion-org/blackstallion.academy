#!/usr/bin/env node
/**
 * Screenshots every history-scroll route and scene at 1440×900 and 390×844 (plus 834×1112 tablet) into
 * docs/history-scrolls/evidence/, and reports layout problems it can measure: text overlapping the fixed nav, controls
 * in the top 80px, horizontal overflow, broken images and console errors.
 *   BASE=http://localhost:3100 node scripts/history-screens.mjs [--reduced] [--no-webgl] [--only=/story/rani-lakshmibai]
 */
import { mkdirSync } from "node:fs";
import { createRequire } from "node:module";
const { chromium } = createRequire(import.meta.url)("playwright");

const BASE = process.env.BASE ?? "http://localhost:3100";
const OUT = "docs/history-scrolls/evidence";
const args = process.argv.slice(2);
const reduced = args.includes("--reduced");
const noWebgl = args.includes("--no-webgl");
const only = args.find((a) => a.startsWith("--only="))?.slice(7);
const ROUTES = ["/history/india", "/history/world", "/story/rani-lakshmibai", "/story/alexander-bucephalus"].filter((r) => !only || r === only);
const VIEWPORTS = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "phone", width: 390, height: 844 },
  ...(args.includes("--tablet") ? [{ name: "tablet", width: 834, height: 1112 }] : []),
];
const tag = [reduced && "reduced", noWebgl && "nowebgl"].filter(Boolean).join("-");
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ args: noWebgl ? ["--disable-webgl", "--disable-3d-apis"] : ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const problems = [];
for (const vp of VIEWPORTS) {
  const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: 1, reducedMotion: reduced ? "reduce" : "no-preference" });
  await context.addInitScript(() => {
    try { sessionStorage.setItem("bsah-loaded", "1"); sessionStorage.setItem("bsah-intro-seen", "1"); } catch {}
  });
  for (const route of ROUTES) {
    const page = await context.newPage();
    const errors = [];
    page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
    page.on("pageerror", (e) => errors.push(String(e)));
    await page.goto(`${BASE}${route}`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1200);
    const slug = route.split("/").pop();
    const base = `${OUT}/${slug}-${vp.name}${tag ? `-${tag}` : ""}`;
    await page.screenshot({ path: `${base}-00-top.png` });
    const anchors = await page.$$eval("[data-hs-scene]", (els) => els.map((e) => e.id));
    for (const [i, id] of anchors.entries()) {
      await page.evaluate((id) => {
        const el = document.getElementById(id);
        // For a sticky stage, land a third of the way through its section so the stage is pinned in view.
        const extra = el.classList.contains("hs-pers") && getComputedStyle(el).height !== "auto" && el.offsetHeight > innerHeight * 1.2 ? el.offsetHeight * 0.3 : 0;
        window.scrollTo({ top: el.getBoundingClientRect().top + scrollY + extra - (el.classList.contains("hs-pers") ? 0 : 64), behavior: "instant" });
      }, id);
      await page.waitForTimeout(900);
      await page.screenshot({ path: `${base}-${String(i + 1).padStart(2, "0")}-${id}.png` });
    }
    const report = await page.evaluate(() => {
      const out = [];
      if (document.documentElement.scrollWidth > innerWidth + 1) out.push(`horizontal overflow ${document.documentElement.scrollWidth}px`);
      for (const img of document.querySelectorAll(".hs img")) if (img.complete && img.naturalWidth === 0) out.push(`broken image ${img.getAttribute("src")}`);
      window.scrollTo(0, 0);
      for (const el of document.querySelectorAll(".hs button, .hs .hs-controls a")) {
        const r = el.getBoundingClientRect();
        if (r.top < 80 && r.bottom > 0) out.push(`control in top 80px: ${el.textContent?.trim()}`);
      }
      const h1 = document.querySelector(".hs h1")?.getBoundingClientRect();
      if (h1 && h1.top < 80) out.push(`h1 top ${Math.round(h1.top)}px`);
      out.push(`placeholders ${document.querySelectorAll("[data-hs-missing]").length}`);
      return out;
    });
    problems.push(`${vp.name} ${route}: ${[...report, ...errors.slice(0, 3).map((e) => `console: ${e.slice(0, 160)}`)].join(" | ")}`);
    await page.close();
  }
  await context.close();
}
await browser.close();
console.log(problems.join("\n"));
