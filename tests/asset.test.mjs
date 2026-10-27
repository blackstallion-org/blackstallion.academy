import { test } from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { loadTs, root } from "./helpers/load-ts.mjs";
import { assetUrl, MEDIA_PREFIXES, parseMediaBase } from "../lib/content/media-base.mjs";

const BUCKET = "https://abcd1234.supabase.co/storage/v1/object/public/website-media";

test("parseMediaBase accepts a clean https URL and drops the trailing slash", () => {
  assert.equal(parseMediaBase(BUCKET), BUCKET);
  assert.equal(parseMediaBase(`${BUCKET}/`), BUCKET);
  assert.equal(parseMediaBase(`  ${BUCKET}//  `), BUCKET);
  assert.equal(parseMediaBase("https://media.example.com"), "https://media.example.com");
  assert.equal(parseMediaBase("http://127.0.0.1:4010/website-media/"), "http://127.0.0.1:4010/website-media");
  assert.equal(parseMediaBase("http://localhost:4010"), "http://localhost:4010");
});

test("parseMediaBase turns the switch off for anything that is not a clean URL", () => {
  for (const bad of [undefined, null, "", "   ", "not a url", "abcd1234.supabase.co/storage/v1/object/public/website-media",
    "http://media.example.com/x", "ftp://media.example.com/x", "javascript:alert(1)", "data:text/plain,hi",
    `${BUCKET}?token=1`, `${BUCKET}#frag`, "https://user:pass@media.example.com/x"]) {
    assert.equal(parseMediaBase(bad), "", `expected off for ${JSON.stringify(bad)}`);
  }
});

test("assetUrl leaves every path alone while the switch is off", () => {
  for (const p of ["/images/a.webp", "/models/m.glb", "/brand/crest.svg", "https://cdn.example.com/x.png", "", "data:image/gif;base64,AAAA"]) {
    assert.equal(assetUrl("", p), p);
  }
});

test("assetUrl moves only the five media folders to the base", () => {
  assert.deepEqual(MEDIA_PREFIXES, ["/images/", "/media/", "/models/", "/video/", "/audio/"]);
  assert.equal(assetUrl(BUCKET, "/images/legend/legend-sand.png"), `${BUCKET}/images/legend/legend-sand.png`);
  assert.equal(assetUrl(BUCKET, "/media/hero-dust.webp"), `${BUCKET}/media/hero-dust.webp`);
  assert.equal(assetUrl(BUCKET, "/models/horse-hand-draco.glb"), `${BUCKET}/models/horse-hand-draco.glb`);
  assert.equal(assetUrl(BUCKET, "/video/hero-main-desktop.mp4"), `${BUCKET}/video/hero-main-desktop.mp4`);
  assert.equal(assetUrl(BUCKET, "/audio/interactions/neigh.mp3"), `${BUCKET}/audio/interactions/neigh.mp3`);
});

test("assetUrl keeps the site's own files, absolute URLs and look-alike prefixes untouched", () => {
  for (const p of ["/brand/bsah-crest.webp", "/draco/", "/draco/draco_decoder.wasm", "/animations/pixel-horse.js", "/images", "/imagesX/a.png",
    "https://images.higgs.ai/?default=1", "//cdn.example.com/images/a.png", "blob:https://x/1", "data:image/png;base64,AAAA", "images/a.png", ""]) {
    assert.equal(assetUrl(BUCKET, p), p, `changed ${p}`);
  }
});

test("assetUrl percent-encodes spaces and keeps a query string", () => {
  assert.equal(
    assetUrl(BUCKET, "/video/Firefly Create a --3-second seamless cinematic loop-- using the provided desert image. The horse slo.mp4"),
    `${BUCKET}/video/Firefly%20Create%20a%20--3-second%20seamless%20cinematic%20loop--%20using%20the%20provided%20desert%20image.%20The%20horse%20slo.mp4`,
  );
  assert.equal(assetUrl(BUCKET, "/images/a.webp?v=2"), `${BUCKET}/images/a.webp?v=2`);
});

test("asset() follows NEXT_PUBLIC_MEDIA_BASE_URL and is the identity when it is unset", async () => {
  const saved = process.env.NEXT_PUBLIC_MEDIA_BASE_URL;
  try {
    delete process.env.NEXT_PUBLIC_MEDIA_BASE_URL;
    let mod = await loadTs("lib/content/asset.ts");
    assert.equal(mod.MEDIA_REMOTE, false);
    assert.equal(mod.MEDIA_BASE, "");
    assert.equal(mod.asset("/models/horse-hand-draco.glb"), "/models/horse-hand-draco.glb");

    process.env.NEXT_PUBLIC_MEDIA_BASE_URL = `${BUCKET}/`;
    mod = await loadTs("lib/content/asset.ts");
    assert.equal(mod.MEDIA_REMOTE, true);
    assert.equal(mod.MEDIA_BASE, BUCKET);
    assert.equal(mod.asset("/models/horse-hand-draco.glb"), `${BUCKET}/models/horse-hand-draco.glb`);
    assert.equal(mod.asset("/brand/crest.svg"), "/brand/crest.svg");

    process.env.NEXT_PUBLIC_MEDIA_BASE_URL = "http://not-allowed.example.com/x";
    mod = await loadTs("lib/content/asset.ts");
    assert.equal(mod.MEDIA_REMOTE, false, "a plain-http, non-loopback base must leave the switch off");
  } finally {
    if (saved === undefined) delete process.env.NEXT_PUBLIC_MEDIA_BASE_URL; else process.env.NEXT_PUBLIC_MEDIA_BASE_URL = saved;
  }
});

test("mediaSrc moves site stills to the base, always as the shipped WebP, and leaves CDN URLs alone", async () => {
  const saved = { base: process.env.NEXT_PUBLIC_MEDIA_BASE_URL, local: process.env.NEXT_PUBLIC_LOCAL_MEDIA };
  try {
    process.env.NEXT_PUBLIC_MEDIA_BASE_URL = BUCKET;
    process.env.NEXT_PUBLIC_LOCAL_MEDIA = "1"; // the PNG masters exist only on the Mac; the bucket mirrors the WebP copies
    const { media, mediaSrc } = await loadTs("lib/content/media.ts");
    assert.equal(mediaSrc("heroDust"), `${BUCKET}/media/hero-dust.webp`);
    assert.equal(mediaSrc("curriculumHeroStatue"), `${BUCKET}/images/curriculum-hero-statue.webp`);
    for (const key of Object.keys(media)) {
      const src = mediaSrc(key);
      assert.ok(src, `${key} has no source`);
      assert.ok(src.startsWith(`${BUCKET}/`) || /^https:\/\/images\.higgs\.ai\//.test(src), `${key} → ${src}`);
      if (src.startsWith(`${BUCKET}/media/`)) assert.doesNotMatch(src, /\.(png|jpe?g)$/i, `${key} points at a PNG/JPEG master`);
    }
    delete process.env.NEXT_PUBLIC_MEDIA_BASE_URL; // unchanged behaviour without the base
    const plain = await loadTs("lib/content/media.ts");
    assert.equal(plain.mediaSrc("heroDust"), "/media/hero-dust.png");
    process.env.NEXT_PUBLIC_LOCAL_MEDIA = "";
    const shipped = await loadTs("lib/content/media.ts");
    assert.equal(shipped.mediaSrc("heroDust"), "/media/hero-dust.webp");
  } finally {
    for (const [name, value] of [["NEXT_PUBLIC_MEDIA_BASE_URL", saved.base], ["NEXT_PUBLIC_LOCAL_MEDIA", saved.local]]) {
      if (value === undefined) delete process.env[name]; else process.env[name] = value;
    }
  }
});

// next.config.mjs reads the same variable. The image host allow-list must name only the bucket folder, and the
// Content-Security-Policy must name its origin, otherwise the browser or the image optimiser would refuse the files.
async function loadConfig(env) {
  const names = ["NEXT_PUBLIC_MEDIA_BASE_URL", "BSAH_ALLOW_LOCAL_IMAGE_HOST", "SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_URL", "NODE_ENV"];
  const saved = Object.fromEntries(names.map((n) => [n, process.env[n]]));
  try {
    for (const n of names) delete process.env[n];
    Object.assign(process.env, { NODE_ENV: "production" }, env);
    const url = `${pathToFileURL(path.join(root, "next.config.mjs")).href}?case=${Math.random()}`;
    const config = (await import(url)).default;
    const headers = await config.headers();
    const csp = headers.find((h) => h.source === "/:path*").headers.find((h) => h.key === "Content-Security-Policy").value;
    return { config, csp };
  } finally {
    for (const n of names) { if (saved[n] === undefined) delete process.env[n]; else process.env[n] = saved[n]; }
  }
}

test("next.config allows the media bucket for images and in the CSP only when the switch is on", async () => {
  const off = await loadConfig({});
  assert.deepEqual(off.config.images.remotePatterns, []);
  assert.equal(off.config.images.dangerouslyAllowLocalIP, undefined);
  assert.doesNotMatch(off.csp, /supabase\.co/);

  const on = await loadConfig({ NEXT_PUBLIC_MEDIA_BASE_URL: `${BUCKET}/`, SUPABASE_URL: "https://abcd1234.supabase.co" });
  assert.deepEqual(on.config.images.remotePatterns, [
    { protocol: "https", hostname: "abcd1234.supabase.co", port: "", pathname: "/storage/v1/object/public/website-media/**", search: "" },
  ]);
  for (const directive of ["img-src", "media-src", "connect-src"]) {
    const value = on.csp.split("; ").find((d) => d.startsWith(`${directive} `));
    assert.ok(value.includes("https://abcd1234.supabase.co"), `${directive} must name the bucket origin`);
    assert.equal(value.split("https://abcd1234.supabase.co").length, 2, `${directive} names the origin once`);
  }
  assert.equal(on.config.images.dangerouslyAllowLocalIP, undefined);
});

test("next.config accepts a loopback stand-in bucket only with the explicit test switch", async () => {
  const sim = await loadConfig({ NEXT_PUBLIC_MEDIA_BASE_URL: "http://127.0.0.1:4010/website-media", BSAH_ALLOW_LOCAL_IMAGE_HOST: "1" });
  assert.deepEqual(sim.config.images.remotePatterns, [{ protocol: "http", hostname: "127.0.0.1", port: "4010", pathname: "/website-media/**", search: "" }]);
  assert.equal(sim.config.images.dangerouslyAllowLocalIP, true);
  assert.match(sim.csp, /img-src [^;]*http:\/\/127\.0\.0\.1:4010/);
  const wrong = await loadConfig({ NEXT_PUBLIC_MEDIA_BASE_URL: "http://media.example.com/x" });
  assert.deepEqual(wrong.config.images.remotePatterns, []);
  assert.doesNotMatch(wrong.csp, /media\.example\.com/);
});
