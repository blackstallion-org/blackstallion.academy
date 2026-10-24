import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import path from "node:path";
import { loadTs, root } from "./helpers/load-ts.mjs";

// Deployments (Vercel builds from git) contain only the files tracked in the repository. The PNG masters in
// public/media are git-ignored, so every still must resolve to its shipped WebP copy or to a remote URL.
test("every media key resolves to a shipped file or a remote URL when local media is off", async () => {
  delete process.env.NEXT_PUBLIC_LOCAL_MEDIA;
  const { media, mediaSrc } = await loadTs("lib/content/media.ts");
  const missing = [];
  for (const key of Object.keys(media)) {
    const src = mediaSrc(key);
    assert.ok(src, `${key} has no source`);
    if (/^https:\/\//.test(src)) continue;
    assert.doesNotMatch(src, /^\/media\/.+\.(png|jpe?g)$/i, `${key} points at a git-ignored PNG/JPEG master`);
    if (!existsSync(path.join(root, "public", src))) missing.push(`${key} → ${src}`);
  }
  assert.deepEqual(missing, []);
});

// The eight stills that exist only on the image provider's CDN are 2K PNG masters of about 7.5 MB each. Until they are
// downloaded and shipped as WebP they must go through the provider's resizer (about 0.2 MB), never straight to the master.
test("CDN-only stills are requested through the resizer as WebP, not as the PNG master", async () => {
  delete process.env.NEXT_PUBLIC_LOCAL_MEDIA;
  const { media, mediaSrc } = await loadTs("lib/content/media.ts");
  const cdnOnly = Object.keys(media).filter((k) => media[k].file === "" && /^https:\/\//.test(media[k].remote || ""));
  assert.ok(cdnOnly.length >= 8, `expected the eight new stills, found ${cdnOnly.length}`);
  for (const key of cdnOnly) {
    const src = mediaSrc(key);
    const u = new URL(src);
    assert.equal(u.origin, "https://images.higgs.ai", `${key} does not use the resizer`);
    assert.equal(u.searchParams.get("output"), "webp", `${key} is not requested as WebP`);
    assert.ok(Number(u.searchParams.get("w")) <= 1920, `${key} is not limited to 1920 px`);
    assert.match(u.searchParams.get("url") || "", /^https:\/\/d8j0ntlcm91z4\.cloudfront\.net\/user_[A-Za-z0-9]+\/hf_[\w-]+\.png$/, `${key} source is not a CDN master`);
  }
});

test("shippedFile swaps only /media stills to WebP", async () => {
  const { shippedFile } = await loadTs("lib/content/media.ts");
  assert.equal(shippedFile("/media/rearing.png"), "/media/rearing.webp");
  assert.equal(shippedFile("/media/a-b.JPG"), "/media/a-b.webp");
  assert.equal(shippedFile("/images/curriculum-hero-statue.webp"), "/images/curriculum-hero-statue.webp");
  assert.equal(shippedFile("/images/ledger/node_01.png"), "/images/ledger/node_01.png");
});
