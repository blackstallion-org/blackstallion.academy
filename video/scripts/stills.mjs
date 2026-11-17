// Renders the storyboard sheet: one still per scene (plus a few transition frames) into video/out/stills/.
// Usage: npm run stills            (all)
//        npm run stills -- 180 640 (just these frames)
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const browserExecutable = "/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell";

const STORYBOARD = [
  [70, "00-crest"],
  [240, "01-marwar"],
  [330, "01b-rider-wipe"],
  [430, "02-mughal"],
  [508, "02b-ink-bleed"],
  [600, "03-haldighati"],
  [720, "03b-banner-wipe"],
  [790, "04-jhansi"],
  [990, "05-alexander"],
  [1080, "05b-ink-bleed"],
  [1160, "06-world"],
  [1262, "06b-into-map"],
  [1420, "07-map"],
  [1590, "08-today"],
  [1770, "09-end-card"],
];

const only = process.argv.slice(2).map(Number).filter((n) => !Number.isNaN(n));
const frames = only.length ? only.map((n) => [n, `f${String(n).padStart(4, "0")}`]) : STORYBOARD;
const scale = Number(process.env.SCALE || 1);

const serveUrl = await bundle({ entryPoint: path.join(root, "src/index.ts"), publicDir: path.resolve(root, "../public") });
const composition = await selectComposition({ serveUrl, id: "Lineage", browserExecutable });
const outDir = path.join(root, "out/stills");
fs.mkdirSync(outDir, { recursive: true });
for (const [frame, name] of frames) {
  const output = path.join(outDir, `${name}.jpg`);
  await renderStill({ serveUrl, composition, frame, output, imageFormat: "jpeg", jpegQuality: 88, scale, browserExecutable, timeoutInMilliseconds: 120000 });
  console.log("still", frame, output);
}
