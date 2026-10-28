// Shared bits for the /stride QA scripts: own headless Chrome through playwright-core (GPU = the Mac's Metal, swift = SwiftShader).
// PLAYWRIGHT_CORE must point at a directory that contains playwright-core (see tools/qa-marwari/README.md).
import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";

const require = createRequire(process.env.PLAYWRIGHT_CORE ? process.env.PLAYWRIGHT_CORE.replace(/\/?$/, "/") : import.meta.url);
export const { chromium } = require("playwright-core");

const CACHE = path.join(process.env.HOME, "Library/Caches/ms-playwright");
export const BIN = {
  shell: path.join(CACHE, "chromium_headless_shell-1248/chrome-headless-shell-mac-arm64/chrome-headless-shell"),
  full: path.join(CACHE, "chromium-1248/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing"),
};
export const BASE = process.env.STRIDE_BASE || "http://localhost:3100";
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function launch(mode = "gpu", extra = []) {
  const args = mode === "swift" ? ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] : ["--use-angle=metal", "--enable-gpu-rasterization", "--ignore-gpu-blocklist", "--enable-features=Metal"];
  return chromium.launch({ executablePath: mode === "swift" ? BIN.shell : BIN.full, headless: true, args: [...args, ...extra] });
}

export async function glInfo(page) {
  return page.evaluate(() => {
    const c = document.createElement("canvas");
    const gl = c.getContext("webgl2");
    if (!gl) return { webgl2: false };
    const ext = gl.getExtension("WEBGL_debug_renderer_info");
    return { webgl2: true, renderer: ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER) };
  });
}

export function watch(page) {
  const out = { errors: [], warnings: [] };
  page.on("console", (m) => {
    if (m.type() === "error") out.errors.push(m.text());
    if (m.type() === "warning") out.warnings.push(m.text());
  });
  page.on("pageerror", (e) => out.errors.push(`pageerror ${e.message}`));
  return out;
}

/** Opens /stride and waits for the canvas to exist and the first frame to have drawn. */
export async function openStride(page, { query = "", canvas = true } = {}) {
  await page.goto(`${BASE}/stride${query}`, { waitUntil: "domcontentloaded", timeout: 120000 });
  if (canvas) await page.waitForSelector('[data-testid="stage"] canvas', { timeout: 120000 });
  await sleep(1200);
}

export const out = (name) => {
  const dir = process.env.STRIDE_OUT || path.resolve("docs/qa/stride");
  fs.mkdirSync(dir, { recursive: true });
  return path.join(dir, name);
};
