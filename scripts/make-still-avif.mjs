// Writes an AVIF twin next to every shipped still (public/media/<name>.webp -> <name>.avif): same pixels, a third of the bytes.
// FilmImage offers the twin first (components/film/FilmImage.tsx); browsers without AVIF keep loading the WebP.
//   node scripts/make-still-avif.mjs            writes the missing twins
//   node scripts/make-still-avif.mjs --force    rewrites all of them (after changing the quality below)
// The WebP files are never touched. Needs `sharp`, which is installed with Next.js (it is not a dependency of its own).
import { existsSync, readdirSync, statSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** Quality 55 was compared with the WebP at 100% zoom: edges and faces hold, only the finest film grain softens. */
export const AVIF_OPTIONS = { quality: 55, effort: 4, chromaSubsampling: "4:2:0" };

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const mediaDir = path.join(root, "public", "media");

let sharp;
try {
  sharp = createRequire(path.join(root, "package.json"))("sharp");
} catch {
  console.error("sharp is not installed (it comes with Next.js: run `npm ci`).");
  process.exit(1);
}

const force = process.argv.includes("--force");
let before = 0;
let after = 0;
for (const file of readdirSync(mediaDir).filter((f) => f.endsWith(".webp")).sort()) {
  const source = path.join(mediaDir, file);
  const target = source.replace(/\.webp$/, ".avif");
  if (existsSync(target) && !force) continue;
  await sharp(source).avif(AVIF_OPTIONS).toFile(target);
  const [from, to] = [statSync(source).size, statSync(target).size];
  before += from;
  after += to;
  console.log(`${file.padEnd(34)} ${String(Math.round(from / 1024)).padStart(5)} KB -> ${String(Math.round(to / 1024)).padStart(5)} KB`);
}
if (before) console.log(`\n${Math.round(before / 1024)} KB of WebP -> ${Math.round(after / 1024)} KB of AVIF (${Math.round((100 * after) / before)}%)`);
else console.log("Nothing to do: every still already has its AVIF twin.");
