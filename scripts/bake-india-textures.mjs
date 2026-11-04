#!/usr/bin/env node
/**
 * Re-renders the India relief map's two textures (colour and bump) and saves them as WebP in public/images/schools/.
 *
 * Why they are files: components/sections/schools/India3DMap.tsx used to generate them in the browser by filling a
 * 1024 x 1024 grid pixel by pixel, which froze the page for about a second on a laptop and about four on a phone.
 * That generator, buildSubcontinentTextures(), is still in the component: it is the source of truth for these images
 * and the fallback if they fail to load. Run this script after changing the India boundary, the rivers or the terrain
 * functions in that file.
 *
 *   1. Start the site:            npm run dev      (or: npm run build && npm start)
 *   2. In another terminal:       node scripts/bake-india-textures.mjs [http://localhost:3000]
 *
 * It opens /schools in headless Chromium with the two image requests blocked, so the page falls back to the generator,
 * then reads the two canvases the generator drew. Needs Playwright (npx playwright install chromium) and sharp
 * (already installed by Next.js). Nothing here is added to package.json.
 */
import { writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const base = process.argv[2] ?? "http://localhost:3000";
const outDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "public", "images", "schools");

let chromium, sharp;
try {
  ({ chromium } = await import("playwright"));
  sharp = (await import("sharp")).default;
} catch (error) {
  console.error("This script needs Playwright and sharp:", error.message);
  process.exit(1);
}

const browser = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.route("**/images/schools/india-relief-*.webp", (route) => route.abort());
  await page.addInitScript(() => {
    window.__canvases = [];
    const create = document.createElement.bind(document);
    document.createElement = (tag, ...rest) => {
      const element = create(tag, ...rest);
      if (String(tag).toLowerCase() === "canvas") window.__canvases.push(element);
      return element;
    };
  });
  await page.goto(`${base}/schools`, { waitUntil: "load" });
  await page.waitForFunction(() => window.__canvases.filter((c) => c.width === 1024 && c.height === 1024).length >= 2, null, { timeout: 120000 });
  // The generator creates the colour canvas first, then the bump canvas.
  const [color, bump] = await page.evaluate(() => window.__canvases.filter((c) => c.width === 1024 && c.height === 1024).map((c) => c.toDataURL("image/png")));
  for (const [name, dataUrl, quality] of [["color", color, 86], ["bump", bump, 90]]) {
    const png = Buffer.from(dataUrl.split(",")[1], "base64");
    const webp = await sharp(png).webp({ quality, effort: 6 }).toBuffer();
    await writeFile(path.join(outDir, `india-relief-${name}.webp`), webp);
    console.log(`india-relief-${name}.webp  ${(webp.length / 1024).toFixed(0)} KB`);
  }
} finally {
  await browser.close();
}
