// Shared QA harness: own headless Chromium via playwright-core (no shared MCP profile), GPU or SwiftShader, pinned assets.
import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";
// playwright-core is not a project dependency: point PLAYWRIGHT_CORE at a copy (e.g. the one in the npx cache used by the Playwright MCP) or install it somewhere.
const require = createRequire(process.env.PLAYWRIGHT_CORE ? process.env.PLAYWRIGHT_CORE.replace(/\/?$/, "/") : import.meta.url);
const { chromium } = require("playwright-core");

export const SCRATCH = process.env.QA_SCRATCH || path.join(process.env.TMPDIR || "/tmp", "marwari-qa");
const CACHE = path.join(process.env.HOME, "Library/Caches/ms-playwright");
export const BIN = {
  shell: path.join(CACHE, "chromium_headless_shell-1248/chrome-headless-shell-mac-arm64/chrome-headless-shell"),
  full: path.join(CACHE, "chromium-1248/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing"),
};

/** mode: "gpu" = full Chrome for Testing, new headless, the Mac's Metal GPU; "swift" = headless shell, software GL. */
export async function launch(mode = "gpu", extraArgs = []) {
  const args = mode === "swift"
    ? ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"]
    : ["--use-angle=metal", "--enable-gpu-rasterization", "--ignore-gpu-blocklist", "--enable-features=Metal"];
  return chromium.launch({ executablePath: mode === "swift" ? BIN.shell : BIN.full, headless: true, args: [...args, ...extraArgs] });
}

/** Serve pinned copies of the horse assets, whatever another session does to public/models meanwhile. */
export async function pinAssets(context, dir) {
  const map = {
    "/models/marwari-hero.glb": "marwari-hero.glb",
    "/models/marwari-hero-mobile.glb": "marwari-hero-mobile.glb",
    "/models/marwari-anatomy.glb": "marwari-anatomy.glb",
    "/models/marwari-gaits.json": "marwari-gaits.json",
  };
  await context.route(/\/models\/marwari-(hero|hero-mobile|anatomy|gaits)\.(glb|json)/, async (route) => {
    const u = new URL(route.request().url());
    const f = map[u.pathname];
    if (!f) return route.continue();
    const body = fs.readFileSync(path.join(dir, f));
    await route.fulfill({ status: 200, body, headers: { "content-type": f.endsWith(".json") ? "application/json" : "model/gltf-binary", "cache-control": "no-store", "access-control-allow-origin": "*" } });
  });
}

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function glInfo(page) {
  return page.evaluate(() => {
    const c = document.createElement("canvas");
    const gl = c.getContext("webgl2");
    if (!gl) return { webgl2: false };
    const ext = gl.getExtension("WEBGL_debug_renderer_info");
    return {
      webgl2: true,
      vendor: ext ? gl.getParameter(ext.UNMASKED_VENDOR_WEBGL) : gl.getParameter(gl.VENDOR),
      renderer: ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER),
      maxTex: gl.getParameter(gl.MAX_TEXTURE_SIZE),
      timer: !!gl.getExtension("EXT_disjoint_timer_query_webgl2"),
    };
  });
}
