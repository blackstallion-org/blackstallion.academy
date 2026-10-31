// Rebuilds public/anatomy/matrix.css, the prebuilt utility subset for public/anatomy/matrix.html (the "What twenty minutes does to a
// child" brain, spine, muscle and heart plate on /anatomy). The page is a same-origin iframe, so it carries its own stylesheet
// instead of loading the Tailwind CDN. Run after editing the page's classes:  node scripts/build-matrix-css.mjs
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import os from "node:os";
import { fileURLToPath } from "node:url";
import path from "node:path";
import postcss from "postcss";
import tailwind from "@tailwindcss/postcss";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const input = path.join(root, "public/anatomy/matrix.css.src");
const out = path.join(root, "public/anatomy/matrix.css");
// The page carries its rider image inline as base64, which Tailwind would scan for class names; scan a copy without it.
const scan = path.join(mkdtempSync(path.join(os.tmpdir(), "matrix-")), "matrix.html");
writeFileSync(scan, readFileSync(path.join(root, "public/anatomy/matrix.html"), "utf8").replace(/data:[^"')\s]+/g, ""));
const css = `@import "tailwindcss" source(none);\n@source "${scan}";\n`;

const result = await postcss([tailwind({ optimize: { minify: true } })]).process(css, { from: input });
writeFileSync(out, result.css);
console.log(`matrix.css: ${(result.css.length / 1024).toFixed(1)} kB`);
