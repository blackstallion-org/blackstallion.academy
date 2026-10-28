import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { BUCKET, KNOWN_ABSENT, buildManifest, manifestPath } from "../scripts/media-manifest.mjs";
import { CONTENT_TYPES, classifyMedia, globToRegExp, shippedTwin, SITE_ONLY } from "../scripts/lib/media-refs.mjs";
import { KEY_RULE, encodePath, loadManifest } from "../scripts/upload-media.mjs";
import { MEDIA_PREFIXES, assetUrl } from "../lib/content/media-base.mjs";
import { loadTs, root } from "./helpers/load-ts.mjs";

// scripts/media-manifest.json is the exact list of files the site requests from the media bucket. These tests keep it honest:
// it must match public/ and the code, every file must be something Supabase Storage accepts, and every address the site
// builds must be an address the upload tool creates.

const BASE = "https://abcd1234.supabase.co/storage/v1/object/public/website-media";
const manifest = loadManifest(manifestPath);
const listed = new Set(manifest.files.map((f) => f.path));

test("the committed list of files matches public/ and the code (after changing either, run: node scripts/media-manifest.mjs)", () => {
  const built = buildManifest(root);
  assert.deepEqual(built.unexpectedAbsent, [], "the code names files that are not in public/");
  assert.deepEqual(built.namedButNotUploadable, [], "the code names files of a type the bucket does not serve");
  assert.equal(readFileSync(manifestPath, "utf8"), `${JSON.stringify(built.manifest, null, 2)}\n`);
});

test("every entry is valid for Supabase Storage and for the upload tool", () => {
  assert.equal(manifest.bucket, BUCKET);
  assert.equal(manifest.count, manifest.files.length);
  assert.equal(manifest.totalBytes, manifest.files.reduce((sum, f) => sum + f.bytes, 0));
  assert.ok(manifest.files.length > 100, "a list this short means the scan found almost nothing");
  const types = new Set(Object.values(CONTENT_TYPES));
  for (const f of manifest.files) {
    assert.match(f.path, KEY_RULE, `${f.path} has a character Storage refuses`);
    assert.ok(MEDIA_PREFIXES.some((prefix) => `/${f.path}`.startsWith(prefix)), `${f.path} is outside the five media folders`);
    assert.ok(types.has(f.type), `${f.path}: unexpected type ${f.type}`);
    assert.equal(CONTENT_TYPES[path.extname(f.path).toLowerCase()], f.type, `${f.path}: type does not match its extension`);
    assert.ok(f.bytes <= 50 * 1024 * 1024, `${f.path} is larger than the 50 MB bucket limit`);
  }
  assert.equal(listed.size, manifest.files.length, "a file is listed twice");
  assert.ok(manifest.totalBytes < 1024 * 1024 * 1024, "the list no longer fits in 1 GB of storage");
});

test("the address the site builds for a file is the address the upload tool creates", () => {
  for (const f of manifest.files) {
    assert.equal(assetUrl(BASE, `/${f.path}`), `${BASE}/${encodePath(f.path)}`, f.path);
  }
});

test("every address the site can build for a still, model, video or audio file is in the list", async () => {
  const saved = { base: process.env.NEXT_PUBLIC_MEDIA_BASE_URL, local: process.env.NEXT_PUBLIC_LOCAL_MEDIA };
  try {
    process.env.NEXT_PUBLIC_MEDIA_BASE_URL = BASE;
    for (const local of ["1", ""]) {
      process.env.NEXT_PUBLIC_LOCAL_MEDIA = local; // the bucket mirrors the shipped copies, so the Mac setting must not matter
      const { media, mediaSrc } = await loadTs("lib/content/media.ts");
      for (const key of Object.keys(media)) {
        const src = mediaSrc(key);
        if (!src || !src.startsWith(`${BASE}/`)) continue; // a CDN URL or nothing yet
        const rel = decodeURI(src.slice(BASE.length + 1));
        assert.ok(listed.has(rel), `mediaSrc("${key}") → ${rel} is not in the list`);
      }
    }
  } finally {
    for (const [name, value] of [["NEXT_PUBLIC_MEDIA_BASE_URL", saved.base], ["NEXT_PUBLIC_LOCAL_MEDIA", saved.local]]) {
      if (value === undefined) delete process.env[name]; else process.env[name] = value;
    }
  }
});

test("every file the code names is listed or knowingly absent, and nothing it names is left out", () => {
  const { exact, patterns, unserved } = classifyMedia(root);
  for (const ref of exact.keys()) {
    if (SITE_ONLY.has(ref)) continue; // stays on this site on purpose (scripts/lib/media-refs.mjs)
    const master = shippedTwin(ref) !== ref && listed.has(shippedTwin(ref).slice(1));
    assert.ok(listed.has(ref.slice(1)) || master || KNOWN_ABSENT[ref], `${ref} (named in ${[...exact.get(ref)].join(", ")}) is neither listed nor explained`);
  }
  const regexes = [...patterns.keys()].map(globToRegExp);
  for (const f of unserved) {
    if (SITE_ONLY.has(f.web)) continue;
    const master = shippedTwin(f.web) !== f.web && listed.has(shippedTwin(f.web).slice(1));
    if (master) continue; // a git-ignored PNG/JPEG master: the site ships and requests its WebP twin
    assert.ok(!exact.has(f.web), `${f.web} is named by the code but not listed`);
    assert.ok(!regexes.some((re) => re.test(f.web)), `${f.web} matches a path pattern in the code but is not listed`);
  }
});

test("classification: named files are listed; unused files, git-ignored masters and unknown types are not", () => {
  const dir = mkdtempSync(path.join(os.tmpdir(), "bsah-classify-"));
  const write = (rel, content = "x") => {
    const full = path.join(dir, rel);
    mkdirSync(path.dirname(full), { recursive: true });
    writeFileSync(full, content);
  };
  try {
    write("app/page.tsx", [
      'export const a = asset("/images/named.webp");',
      "export const b = asset(`/images/series/${id}-thumb.webp`);",
      'export const c = asset("/models/data.json");',
      'export const d = asset("/media/x.png");',
      'export const e = asset("/images/missing.webp");',
      'export const f = asset("/video/alias.mp4");',
    ].join("\n"));
    write("lib/content/media.ts", 'const m = (file) => ({ file: `/media/${file}` });\nexport const k = m("hero.png");\n');
    for (const rel of ["images/named.webp", "images/unused.webp", "images/series/one-thumb.webp", "images/series/one-full.webp", "models/data.json",
      "media/hero.webp", "media/hero.png", "media/x.webp", "media/x.png", "media/notes.md", "brand/crest.webp"]) write(`public/${rel}`);
    write("public/video/long name.mp4", "video bytes");
    symlinkSync("long name.mp4", path.join(dir, "public", "video", "alias.mp4"));

    const result = classifyMedia(dir);
    assert.deepEqual(result.served.map((f) => f.web), [
      "/images/named.webp", "/images/series/one-thumb.webp", "/media/hero.webp", "/video/alias.mp4",
    ]);
    assert.equal(result.served.find((f) => f.web === "/video/alias.mp4").bytes, "video bytes".length, "a link is listed with its target's size");
    assert.deepEqual(result.unserved.map((f) => f.web), [
      "/images/series/one-full.webp", "/images/unused.webp", "/media/hero.png", "/media/notes.md", "/media/x.png", "/media/x.webp",
      "/models/data.json", "/video/long name.mp4",
    ]);
    assert.deepEqual(result.absent, ["/images/missing.webp"]);
    assert.deepEqual(result.namedButNotUploadable, ["/models/data.json"]);
    assert.ok(!result.served.some((f) => f.web.startsWith("/brand/")), "only the five media folders are scanned");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
