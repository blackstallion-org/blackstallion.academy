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

test("shippedFile swaps only /media stills to WebP", async () => {
  const { shippedFile } = await loadTs("lib/content/media.ts");
  assert.equal(shippedFile("/media/rearing.png"), "/media/rearing.webp");
  assert.equal(shippedFile("/media/a-b.JPG"), "/media/a-b.webp");
  assert.equal(shippedFile("/images/curriculum-hero-statue.webp"), "/images/curriculum-hero-statue.webp");
  assert.equal(shippedFile("/images/ledger/node_01.png"), "/images/ledger/node_01.png");
});
