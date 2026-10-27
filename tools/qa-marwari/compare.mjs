// Before / after sheet. usage: node compare.mjs <out.jpg> <cellWidth> <pairs.json>
// pairs.json: [{ "label": "...", "before": "path", "after": "path", "cropBefore": { "left": 340, "top": 20, "width": 760, "height": 860 } (optional), "cropAfter": { ... } (optional) }]
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const sharp = require("sharp");
const [OUT, WIDTH, PAIRS] = process.argv.slice(2);
const pairs = JSON.parse(fs.readFileSync(PAIRS, "utf8"));
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "cmp-"));
const args = [];
let i = 0;
for (const p of pairs) {
  for (const side of ["before", "after"]) {
    const src = p[side];
    if (!src || !fs.existsSync(src)) { console.warn("missing", src); continue; }
    const dst = path.join(tmp, `${i++}_${side}.jpg`);
    let img = sharp(src);
    const crop = side === "before" ? p.cropBefore : p.cropAfter;
    if (crop) img = img.extract(crop);
    await img.jpeg({ quality: 90 }).toFile(dst);
    args.push(`${p.label} (${side})=${dst}`);
  }
}
const here = path.dirname(new URL(import.meta.url).pathname);
execFileSync("python3", [path.join(here, "montage.py"), OUT, "2", WIDTH, ...args], { stdio: "inherit" });
