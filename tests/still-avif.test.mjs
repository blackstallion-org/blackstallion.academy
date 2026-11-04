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
  const orphans = readdirSync(dir).filter((f) => f.endsWith(".avif") && !existsSync(path.join(dir, f.replace(/\.avif$/, ".webp"))));
  assert.deepEqual(orphans, []);
});

test("FilmImage offers the AVIF inside a picture and does not preload the WebP it would not use", () => {
  const source = readFileSync(path.join(root, "components/film/FilmImage.tsx"), "utf8");
  assert.match(source, /<source srcSet=\{twin\} type="image\/avif" \/>/);
  assert.match(source, /<picture className="contents">/);
  assert.match(source, /preload: false/, "a priority still with a twin must not preload the WebP");
});
