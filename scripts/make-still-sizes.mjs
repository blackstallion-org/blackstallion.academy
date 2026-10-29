// Writes smaller AVIF versions of every shipped still, so a phone is not sent the 2752 px file meant for a wide desktop screen:
//   public/media/<name>.webp (2752 px) -> <name>-640.avif, <name>-1080.avif, <name>-1440.avif  (only widths below the original's)
// and lib/content/still-sizes.json, the list FilmImage reads to build its srcset. The WebP and the full-size AVIF twin stay as they are.
//   node scripts/make-still-sizes.mjs            writes the missing sizes and the list
//   node scripts/make-still-sizes.mjs --force    rewrites all of them (after changing the quality below)
// Needs `sharp`, which is installed with Next.js (it is not a dependency of its own).
import { existsSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** Quality 65, not the full-size twin's 55: measured against the resized original (PSNR), 55 holds the edges but smooths the film grain, 65 keeps it
 *  (33 to 38 dB at 1080 px, against 32 to 34 dB for the full-size twin against its own original) at 43 to 90 KB. */
export const AVIF_OPTIONS = { quality: 65, effort: 4, chromaSubsampling: "4:2:0" };
/** 640 for a small picture or a phone at 1x, 1080 for a phone at 2x, 1440 for a phone at 3x (390 x 3 = 1170) and a laptop at 1x. */
export const WIDTHS = [640, 1080, 1440];

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
const list = {};
let full = 0;
let smaller = 0;
for (const file of readdirSync(mediaDir).filter((f) => f.endsWith(".webp")).sort()) {
  const name = file.replace(/\.webp$/, "");
  const source = path.join(mediaDir, file);
  const meta = await sharp(source).metadata();
  const widths = WIDTHS.filter((w) => w < meta.width * 0.9);
  list[name] = { width: meta.width, height: meta.height, widths };
  const twin = source.replace(/\.webp$/, ".avif");
  if (existsSync(twin)) full += statSync(twin).size;
  for (const w of widths) {
    const target = path.join(mediaDir, `${name}-${w}.avif`);
    if (!existsSync(target) || force) await sharp(source).resize({ width: w }).avif(AVIF_OPTIONS).toFile(target);
    smaller += statSync(target).size;
  }
  console.log(`${name.padEnd(32)} ${meta.width}x${meta.height}  ${widths.map((w) => `${w}: ${Math.round(statSync(path.join(mediaDir, `${name}-${w}.avif`)).size / 1024)} KB`).join("  ")}`);
}
writeFileSync(path.join(root, "lib", "content", "still-sizes.json"), JSON.stringify(list, null, 1) + "\n");
console.log(`\n${Object.keys(list).length} stills. Full-size AVIF twins: ${Math.round(full / 1024)} KB; the smaller sizes add ${Math.round(smaller / 1024)} KB of files (a phone loads one of them instead of the full-size file).`);
