// AVIF twins of the shipped stills: the same pixels at about a third of the bytes, offered first by FilmImage.
// A browser without AVIF keeps loading the WebP, so a missing twin would break a still: every shipped still must have one.
// Does NOT prove how it looks: the twins were compared with the WebP at 100% zoom (see PROGRESS.md). Run with `npm test`.
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, statSync, readdirSync } from "node:fs";
import path from "node:path";
import { loadTs, root } from "./helpers/load-ts.mjs";

function clearMediaEnv() {
  delete process.env.NEXT_PUBLIC_LOCAL_MEDIA;
  delete process.env.NEXT_PUBLIC_MEDIA_BASE_URL;
}

test("only stills this site serves as /media/<name>.webp get a twin; everything else keeps its own file", async () => {
  clearMediaEnv();
  const { avifTwin } = await loadTs("lib/content/media.ts");
  assert.equal(avifTwin("/media/bg-charge.webp"), "/media/bg-charge.avif");
  assert.equal(avifTwin("https://images.higgs.ai/?default=1&output=webp&q=82&w=1920&url=x"), null, "the provider's resizer");
  assert.equal(avifTwin("https://d8j0ntlcm91z4.cloudfront.net/a/b.webp"), null, "a remote file");
  assert.equal(avifTwin("/media/bg-charge.png"), null, "a PNG master");
  assert.equal(avifTwin("/images/equipment/traditional-saddle.webp"), null, "outside /media");
  assert.equal(avifTwin("/media/bg-charge.webp?v=2"), null, "a versioned URL");
  assert.equal(avifTwin("/media/sub/bg-charge.webp"), null, "a nested path");
});

test("no twin when local PNG masters or the media bucket are in use", async () => {
  clearMediaEnv();
  process.env.NEXT_PUBLIC_LOCAL_MEDIA = "1";
  const local = await loadTs("lib/content/media.ts");
  assert.equal(local.avifTwin("/media/bg-charge.webp"), null, "local masters go through the optimizer instead");
  clearMediaEnv();
  process.env.NEXT_PUBLIC_MEDIA_BASE_URL = "https://example.supabase.co/storage/v1/object/public/website-media";
  const bucket = await loadTs("lib/content/media.ts");
  assert.equal(bucket.avifTwin("https://example.supabase.co/storage/v1/object/public/website-media/media/bg-charge.webp"), null, "the bucket mirrors the manifest, which lists no twins");
  clearMediaEnv();
});

test("every still the site serves from /media has an AVIF twin that is a real, smaller AVIF", async () => {
  clearMediaEnv();
  const { media, mediaSrc, avifTwin } = await loadTs("lib/content/media.ts");
  const problems = [];
  const seen = new Set();
  for (const key of Object.keys(media)) {
    const src = mediaSrc(key);
    const twin = src && avifTwin(src);
    if (!twin || seen.has(twin)) continue;
    seen.add(twin);
    const file = path.join(root, "public", twin);
    if (!existsSync(file)) { problems.push(`${key}: ${twin} is missing (run node scripts/make-still-avif.mjs)`); continue; }
    const head = readFileSync(file).subarray(4, 12).toString("ascii");
    if (!/^ftypavi[fs]$/.test(head)) problems.push(`${key}: ${twin} is not an AVIF file (${JSON.stringify(head)})`);
    const webpBytes = statSync(path.join(root, "public", src)).size;
    const avifBytes = statSync(file).size;
    if (webpBytes >= 100 * 1024 && avifBytes > webpBytes * 0.7) problems.push(`${key}: ${twin} is ${avifBytes} bytes against ${webpBytes} for the WebP`);
  }
  assert.ok(seen.size >= 40, `only ${seen.size} stills have twins`);
  assert.deepEqual(problems, []);
});

test("no AVIF in /media is left without its WebP (a twin never stands alone)", () => {
  const dir = path.join(root, "public", "media");
  // `<name>-<width>.avif` is a smaller size of `<name>.webp` (scripts/make-still-sizes.mjs)
  const orphans = readdirSync(dir).filter((f) => f.endsWith(".avif") && !existsSync(path.join(dir, f.replace(/(-\d+)?\.avif$/, ".webp"))));
  assert.deepEqual(orphans, []);
});

test("FilmImage offers the AVIF inside a picture and does not preload the WebP it would not use", () => {
  const source = readFileSync(path.join(root, "components/film/FilmImage.tsx"), "utf8");
  assert.match(source, /<source srcSet=\{twinSet \?\? twin\} sizes=\{twinSet \? sizes : undefined\} type="image\/avif" \/>/, "the sized list when there is one, the full twin otherwise");
  assert.match(source, /<picture className="contents">/);
  assert.match(source, /preload: false/, "a priority still with a twin must not preload the WebP");
});

test("smaller sizes: every still has the sizes the list names, each smaller than the one above, and the srcset names the full twin last", async () => {
  clearMediaEnv();
  const { avifSrcSet } = await loadTs("lib/content/media.ts");
  const sizes = JSON.parse(readFileSync(path.join(root, "lib/content/still-sizes.json"), "utf8"));
  const dir = path.join(root, "public", "media");
  const stills = readdirSync(dir).filter((f) => f.endsWith(".webp")).map((f) => f.replace(/\.webp$/, ""));
  assert.deepEqual(Object.keys(sizes).sort(), stills.sort(), "the list covers every shipped still (run scripts/make-still-sizes.mjs)");
  let withSizes = 0;
  for (const name of stills) {
    const { width, widths } = sizes[name];
    let previous = 0;
    for (const w of widths) {
      assert.ok(w < width, `${name}: ${w} is below the original's ${width}`);
      const bytes = statSync(path.join(dir, `${name}-${w}.avif`)).size;
      assert.ok(bytes > previous, `${name}-${w}.avif is larger than the size below it`);
      previous = bytes;
    }
    if (widths.length) {
      withSizes++;
      assert.ok(previous < statSync(path.join(dir, `${name}.avif`)).size, `${name}: the largest smaller size is smaller than the full twin`);
      const set = avifSrcSet(`/media/${name}.webp`);
      assert.ok(set && set.endsWith(`/media/${name}.avif ${width}w`), `${name}: the full twin is last in the srcset`);
      for (const w of widths) assert.ok(set.includes(`/media/${name}-${w}.avif ${w}w`));
    }
  }
  assert.ok(withSizes >= 40, `only ${withSizes} stills have smaller sizes`);
  assert.equal(avifSrcSet("https://example.com/a.webp"), null, "a remote file has no sizes");
});

test("sizedAvif picks the smallest size that covers the canvas at the screen's density, the full twin beyond them, and nothing for a file without a twin", async () => {
  clearMediaEnv();
  const { sizedAvif } = await loadTs("lib/content/media.ts");
  const sizes = JSON.parse(readFileSync(path.join(root, "lib/content/still-sizes.json"), "utf8"));
  assert.deepEqual(sizes["bg-fort"].widths, [640, 1080, 1440]);
  assert.equal(sizedAvif("/media/bg-fort.webp", 390, 1.5), "/media/bg-fort-640.avif", "a phone: 585 px needed");
  assert.equal(sizedAvif("/media/bg-fort.webp", 390, 3), "/media/bg-fort-1440.avif", "390 x 3 = 1170 px needed");
  assert.equal(sizedAvif("/media/bg-fort.webp", 1440, 1), "/media/bg-fort-1440.avif");
  assert.equal(sizedAvif("/media/bg-fort.webp", 1920, 1.5), "/media/bg-fort.avif", "wider than every size: the full twin");
  assert.equal(sizedAvif("https://example.com/a.webp", 390, 2), null);
  const wiring = readFileSync(path.join(root, "components/film/WebGLNoiseTransition.tsx"), "utf8");
  assert.match(wiring, /supportsAvif\(\)\.then/, "a texture is fetched only once the browser has said whether it reads AVIF");
  assert.match(wiring, /sizedAvif\(url, width, dpr\)/);
  assert.match(readFileSync(path.join(root, "components/film/CinematicStoryReel.tsx"), "utf8"), /<Still\s/);
  const still = readFileSync(path.join(root, "components/film/Still.tsx"), "utf8");
  assert.match(still, /const set = src \? avifSrcSet\(src\) : null/, "a slide that is not armed has no <source>, so nothing loads early");
});
