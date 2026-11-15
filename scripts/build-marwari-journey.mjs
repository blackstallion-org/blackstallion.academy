// Builds the web derivatives of the layered Marwari scroll paintings (public/images/story/marwari/mw##-{b,s,f}.png).
// The PNG masters stay where they are (git-ignored, ~100 MB); this writes WebP (alpha kept for S and F) to
// public/images/story/marwari/journey/ at the masters' own size, so all three layers of a scene share one stage box.
// Run: node scripts/build-marwari-journey.mjs
import { mkdirSync, statSync, existsSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";

const SRC = "public/images/story/marwari";
const OUT = join(SRC, "journey");
mkdirSync(OUT, { recursive: true });
let total = 0;
for (let i = 0; i < 20; i++) {
  const id = String(i).padStart(2, "0");
  for (const layer of ["b", "s", "f"]) {
    const src = join(SRC, `mw${id}-${layer}.png`);
    if (!existsSync(src)) throw new Error(`missing ${src}`);
    const out = join(OUT, `mw${id}-${layer}.webp`);
    // Every layer is brought to the background's exact canvas (1672 x 941) so cutouts that are 1-2 px narrower align.
    await sharp(src)
      .resize(1672, 941, { fit: "fill" })
      .webp(layer === "b" ? { quality: 80, effort: 6 } : { quality: 82, alphaQuality: 90, effort: 6 })
      .toFile(out);
    total += statSync(out).size;
  }
}
console.log(`wrote 60 layers, ${(total / 1048576).toFixed(1)} MB`);
