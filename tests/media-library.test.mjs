// Media library (bucket bsah-media): what counts as an image, video or 3D model by its real bytes; the staff-only upload,
// record and delete actions run for real against a stand-in Supabase client and a loopback file server; the public feed and pages.
// Does NOT prove the live project accepts the policies or an upload: that needs the migration applied and a staff account (see docs/MEDIA_LIBRARY.md).
import { test, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import http from "node:http";
import path from "node:path";
import { loadTs, loadTsWith, root } from "./helpers/load-ts.mjs";

const V = await loadTs("lib/storage/validate.ts");
const L = await loadTs("lib/storage/library.ts");

const file = (rel) => new Uint8Array(readFileSync(path.join(root, rel)));
const headOf = (rel, n = 64) => file(rel).subarray(0, n);
const text = (s) => new TextEncoder().encode(s);
const bytes = (...parts) => Uint8Array.from(parts.flatMap((p) => (typeof p === "string" ? [...text(p)] : p)));
const u32 = (n) => [n & 255, (n >> 8) & 255, (n >> 16) & 255, (n >> 24) & 255];

const GLB = "public/models/cadet-rider.glb";
const AVIF = "public/media/bg-charge.avif";
const MP4 = "public/video/footer-ambient-h264.mp4";
const WEBM = "public/video/eye-intro-film.webm";

// ------------------------------------------------------------------ what a file really is

test("real files are recognised by their bytes: GLB, AVIF, MP4, WebM, WebP, JPEG, PNG", () => {
  assert.deepEqual(V.detectType(headOf(GLB)), { mime: "model/gltf-binary", ext: "glb" });
  assert.deepEqual(V.detectType(headOf(AVIF)), { mime: "image/avif", ext: "avif" });
  assert.deepEqual(V.detectType(headOf(MP4)), { mime: "video/mp4", ext: "mp4" });
  assert.deepEqual(V.detectType(headOf(WEBM)), { mime: "video/webm", ext: "webm" });
  assert.deepEqual(V.detectType(headOf("public/media/bg-charge.webp")), { mime: "image/webp", ext: "webp" });
  assert.deepEqual(V.detectType(headOf("public/video/hero-main-poster.jpg")), { mime: "image/jpeg", ext: "jpg" });
  assert.deepEqual(V.detectType(headOf("app/icon.png")), { mime: "image/png", ext: "png" });
});

test("look-alikes are refused: QuickTime, HEIC, Matroska, glTF version 1, text posing as a model", () => {
  assert.equal(V.detectType(bytes(u32(24), "ftypqt  ", u32(0), "qt  ", new Array(16).fill(0))), null, "QuickTime movie");
  assert.equal(V.detectType(bytes(u32(24), "ftypheic", u32(0), "heic", new Array(16).fill(0))), null, "HEIC photo");
  assert.equal(V.detectType(bytes([0x1a, 0x45, 0xdf, 0xa3], new Array(8).fill(0), "matroska", new Array(16).fill(0))), null, "Matroska");
  assert.equal(V.detectType(bytes("glTF", u32(1), u32(100), u32(20), "JSON", new Array(8).fill(0))), null, "glTF version 1");
  assert.equal(V.detectType(bytes("glTF", u32(2), u32(100), u32(20), "BIN\0", new Array(8).fill(0))), null, "first chunk is not JSON");
  assert.equal(V.detectType(text("<svg xmlns='http://www.w3.org/2000/svg'><script>alert(1)</script></svg>")), null, "SVG");
  assert.equal(V.detectType(text("<!doctype html><title>x</title>")), null, "HTML");
  assert.equal(V.detectType(new Uint8Array(0)), null);
});

test("the earlier image upload still accepts only PNG, JPEG and WebP up to 4 MB", () => {
  for (const rel of [GLB, AVIF, MP4, WEBM]) assert.equal(V.validateUpload(headOf(rel, 64), "website-assets").ok, false, rel);
  assert.equal(V.validateUpload(headOf("public/media/bg-charge.webp", 4096), "website-assets").ok, true);
  assert.equal(V.BUCKET_RULES["website-assets"].maxBytes, 4 * 1024 * 1024);
});

// ------------------------------------------------------------------ what the browser declares

test("declared names: the eight extensions pass in any case; everything else and double extensions are refused", () => {
  for (const [name, mime, kind, ext] of [
    ["a.png", "image/png", "image", "png"], ["A.JPG", "image/jpeg", "image", "jpg"], ["b.jpeg", "image/jpeg", "image", "jpg"], ["c.webp", "image/webp", "image", "webp"],
    ["d.AVIF", "image/avif", "image", "avif"], ["e.mp4", "video/mp4", "video", "mp4"], ["f.WebM", "video/webm", "video", "webm"], ["g.glb", "model/gltf-binary", "model", "glb"],
  ]) assert.deepEqual(V.checkDeclared(name, 1000), { ok: true, mime, kind, ext }, name);
  for (const name of ["x.svg", "x.gif", "x.mov", "x.gltf", "x.exe", "x.html", "x.pdf", "x", "x.", ".glb.exe", "x.mp4.exe", "constructor", "__proto__", "x.toString"]) {
    assert.equal(V.checkDeclared(name, 1000).ok, false, name);
  }
  assert.equal(V.checkDeclared(".glb", 1000).ok, true, "a name that is only an extension still has one");
});

test("declared size: 1 byte to 50 MB", () => {
  assert.equal(V.checkDeclared("a.mp4", 0).ok, false);
  assert.equal(V.checkDeclared("a.mp4", -5).ok, false);
  assert.equal(V.checkDeclared("a.mp4", Number.NaN).ok, false);
  assert.equal(V.checkDeclared("a.mp4", 50 * 1024 * 1024).ok, true);
  assert.match(V.checkDeclared("a.mp4", 50 * 1024 * 1024 + 1).error, /50 MB/);
});

test("library paths are unguessable, per kind, and exactly what the recorder accepts", () => {
  const now = new Date("2026-10-29T10:00:00Z");
  const id = "0f8fad5b-d9cb-469f-a165-70867728950e";
  assert.equal(V.libraryPath("video", "mp4", now, id), `videos/2026/10/${id}.mp4`);
  assert.equal(V.libraryPath("model", "glb", now, id), `models/2026/10/${id}.glb`);
  assert.equal(V.libraryPath("image", "avif", now, id), `images/2026/10/${id}.avif`);
  for (const [kind, ext] of [["image", "png"], ["video", "webm"], ["model", "glb"]]) assert.match(V.libraryPath(kind, ext), V.LIBRARY_PATH);
  assert.notEqual(V.libraryPath("image", "png"), V.libraryPath("image", "png"));
  for (const bad of ["../a.png", "images/2026/10/x.png", "site/2026/10/0f8fad5b-d9cb-469f-a165-70867728950e.png", `images/2026/10/${id}.svg`, `images/2026/10/${id}.PNG`, `images/../${id}.png`, `images/2026/10/${id}.png/`, ""]) {
    assert.doesNotMatch(bad, V.LIBRARY_PATH, bad);
  }
});

test("verifying what was stored: the bytes must be the type the extension and folder promise", () => {
  const id = "0f8fad5b-d9cb-469f-a165-70867728950e";
  const ok = (rel, p, total = 5000) => V.verifyLibraryObject(p, headOf(rel), total);
  assert.deepEqual(ok(GLB, `models/2026/10/${id}.glb`), { ok: true, type: { mime: "model/gltf-binary", ext: "glb" }, kind: "model" });
  assert.equal(ok(AVIF, `images/2026/10/${id}.avif`).ok, true);
  assert.equal(ok(MP4, `videos/2026/10/${id}.mp4`).ok, true);
  assert.equal(ok(WEBM, `videos/2026/10/${id}.webm`).ok, true);
  // wrong contents under an honest-looking name
  assert.match(ok(GLB, `videos/2026/10/${id}.mp4`).error, /do not match/);
  assert.match(ok(MP4, `models/2026/10/${id}.glb`).error, /do not match/);
  assert.match(ok(MP4, `images/2026/10/${id}.png`).error, /do not match/);
  assert.match(ok("public/media/bg-charge.webp", `images/2026/10/${id}.png`).error, /do not match/, "a WebP under a .png name");
  assert.match(V.verifyLibraryObject(`images/2026/10/${id}.png`, text("<script>alert(1)</script>"), 30).error, /not a supported/);
  assert.match(V.verifyLibraryObject(`images/2026/10/${id}.png`, headOf("app/icon.png"), 0).error, /empty/);
  assert.match(V.verifyLibraryObject(`images/2026/10/${id}.png`, headOf("app/icon.png"), 50 * 1024 * 1024 + 1).error, /50 MB/);
  assert.match(V.verifyLibraryObject("../etc/passwd", headOf(GLB), 100).error, /not one this library issued/);
  assert.match(V.verifyLibraryObject(`images/2026/10/${id}.pdf`, headOf(GLB), 100).error, /not one this library issued/);
});

// ------------------------------------------------------------------ public addresses and reading a file's first bytes

test("public address of an object: encoded per segment, no double slashes", () => {
  assert.equal(L.publicObjectUrl("https://abc.supabase.co/", "bsah-media", "models/2026/10/a b.glb"), "https://abc.supabase.co/storage/v1/object/public/bsah-media/models/2026/10/a%20b.glb");
  assert.equal(L.publicObjectUrl("https://abc.supabase.co", "bsah-media", "images/x.png"), "https://abc.supabase.co/storage/v1/object/public/bsah-media/images/x.png");
});

test("rows become library items; a malformed row is dropped, never thrown", () => {
  const row = { id: "i1", storage_path: "videos/2026/10/a.mp4", alt_text: "A canter", mime_type: "video/mp4", bytes: 123, created_at: "2026-10-29T00:00:00Z" };
  assert.deepEqual(L.toLibraryItem(row, "https://abc.supabase.co"), { id: "i1", path: "videos/2026/10/a.mp4", alt: "A canter", mime: "video/mp4", kind: "video", bytes: 123, createdAt: "2026-10-29T00:00:00Z", url: "https://abc.supabase.co/storage/v1/object/public/bsah-media/videos/2026/10/a.mp4" });
  assert.equal(L.toLibraryItem({ ...row, mime_type: "application/pdf" }, "https://abc.supabase.co"), null);
  assert.equal(L.toLibraryItem({ ...row, bytes: "12" }, "https://abc.supabase.co"), null);
  assert.equal(L.toLibraryItem({ ...row, id: 7 }, "https://abc.supabase.co"), null);
  assert.equal(L.toLibraryItem({}, "https://abc.supabase.co"), null);
});

/** A file server that honours Range like Supabase Storage's public endpoint (or ignores it, or has nothing). */
async function objectServer(objects, { honourRange = true } = {}) {
  const requests = [];
  const server = http.createServer((req, res) => {
    requests.push({ url: req.url, range: req.headers.range });
    const key = decodeURIComponent((req.url ?? "").replace(/^\/storage\/v1\/object\/public\/bsah-media\//, ""));
    const body = objects.get(key);
    if (!body) return void res.writeHead(404).end("{}");
    const range = /^bytes=(\d+)-(\d+)$/.exec(req.headers.range ?? "");
    if (range && honourRange) {
      const a = Number(range[1]);
      const b = Math.min(Number(range[2]), body.length - 1);
      res.writeHead(206, { "content-range": `bytes ${a}-${b}/${body.length}`, "content-length": b - a + 1 });
      return void res.end(Buffer.from(body.subarray(a, b + 1)));
    }
    res.writeHead(200, { "content-length": body.length });
    res.end(Buffer.from(body));
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  return { url: `http://127.0.0.1:${server.address().port}`, requests, close: () => new Promise((r) => server.close(r)) };
}

test("reading a stored file: one ranged request gives the first bytes and the total size; the rest is never fetched", async () => {
  const big = new Uint8Array(3_000_000).fill(7);
  big.set(headOf(MP4, 64));
  const srv = await objectServer(new Map([["videos/a.mp4", big]]));
  try {
    const got = await L.readObjectHead(`${srv.url}/storage/v1/object/public/bsah-media/videos/a.mp4`);
    assert.equal(got.ok, true);
    assert.equal(got.total, 3_000_000);
    assert.equal(got.head.length, 64);
    assert.deepEqual(V.detectType(got.head), { mime: "video/mp4", ext: "mp4" });
    assert.deepEqual(srv.requests.map((r) => r.range), ["bytes=0-63"]);
  } finally { await srv.close(); }
});

test("reading a stored file: a server that ignores Range still works (the body is cut off after the first chunk)", async () => {
  const srv = await objectServer(new Map([["models/a.glb", file(GLB)]]), { honourRange: false });
  try {
    const got = await L.readObjectHead(`${srv.url}/storage/v1/object/public/bsah-media/models/a.glb`);
    assert.equal(got.ok, true);
    assert.equal(got.total, file(GLB).length);
    assert.deepEqual(V.detectType(got.head), { mime: "model/gltf-binary", ext: "glb" });
  } finally { await srv.close(); }
});

test("reading a stored file: missing, and unreachable, are errors not exceptions", async () => {
  const srv = await objectServer(new Map());
  const url = `${srv.url}/storage/v1/object/public/bsah-media/models/none.glb`;
  assert.match((await L.readObjectHead(url)).error, /could not be found/);
  await srv.close();
  assert.match((await L.readObjectHead(url)).error, /could not be read back/);
});

// ------------------------------------------------------------------ the staff-only actions, run for real against stand-ins

const STAFF_ID = "00000000-0000-4000-8000-0000000000a1";
const SWAPS = { "@/lib/auth/admin": "tests/helpers/fake-staff.mjs", "next/cache": "tests/helpers/fake-next-cache.mjs" };
const ID = "0f8fad5b-d9cb-469f-a165-70867728950e";
const ROW_ID = "6f9619ff-8b86-4011-b42d-00c04fc964ff";

function fakeClient(log, opts = {}) {
  const { signed = { data: { token: "one-time-token" }, error: null }, insertError = null, row = null, removeError = null } = opts;
  return {
    storage: {
      from: (bucket) => ({
        createSignedUploadUrl: async (p) => { log.push(["sign", bucket, p]); return signed; },
        remove: async (paths) => { log.push(["remove", bucket, paths]); return { error: removeError }; },
      }),
    },
    from: (table) => {
      log.push(["from", table]);
      const builder = {
        insert: async (values) => { log.push(["insert", values]); return { error: insertError }; },
        select: (cols) => { log.push(["select", cols]); return builder; },
        eq: (col, val) => { log.push(["eq", col, val]); return builder; },
        maybeSingle: async () => ({ data: row, error: null }),
        delete: () => { log.push(["delete"]); return builder; },
      };
      return builder;
    },
  };
}

function installStaff(log, opts) {
  globalThis.__bsahTest = {
    revalidated: [],
    tags: [],
    requireStaff: async () => { log.push(["requireStaff"]); return { supabase: fakeClient(log, opts), user: { id: STAFF_ID }, profile: { display_name: "QA", role: "SUPER_ADMIN" } }; },
  };
}

let actions;
let errors;
const realConsoleError = console.error;
const savedEnv = { url: process.env.SUPABASE_URL, key: process.env.SUPABASE_PUBLISHABLE_KEY };
beforeEach(async () => {
  errors = [];
  console.error = (...args) => errors.push(args.join(" "));
  actions = await loadTsWith("app/admin/library-actions.ts", SWAPS);
});
afterEach(() => {
  console.error = realConsoleError;
  delete globalThis.__bsahTest;
  for (const [k, v] of [["SUPABASE_URL", savedEnv.url], ["SUPABASE_PUBLISHABLE_KEY", savedEnv.key]]) { if (v === undefined) delete process.env[k]; else process.env[k] = v; }
});

test("prepare: staff check first, then a one-time link for a fresh path of the right folder and type", async () => {
  for (const [name, folder, mime, kind] of [["clip.MP4", "videos", "video/mp4", "video"], ["horse.glb", "models", "model/gltf-binary", "model"], ["still.jpeg", "images", "image/jpeg", "image"]]) {
    const log = [];
    installStaff(log);
    const out = await actions.prepareLibraryUpload({ name, size: 1_000_000 });
    assert.equal(out.ok, true, name);
    assert.deepEqual([out.mime, out.kind, out.token], [mime, kind, "one-time-token"]);
    assert.match(out.path, V.LIBRARY_PATH);
    assert.ok(out.path.startsWith(`${folder}/`));
    assert.deepEqual(log, [["requireStaff"], ["sign", "bsah-media", out.path]]);
  }
});

test("prepare: a bad name, an empty or oversize file, or a malformed request never reaches Storage", async () => {
  const log = [];
  installStaff(log);
  for (const input of [{ name: "x.exe", size: 10 }, { name: "x.mp4", size: 0 }, { name: "x.mp4", size: 60 * 1024 * 1024 }, { name: "", size: 10 }, { name: "x.mp4" }, { size: 10 }, null, "x.mp4", { name: 5, size: 10 }, { name: "x.mp4", size: "10" }]) {
    const out = await actions.prepareLibraryUpload(input);
    assert.equal(out.ok, false, JSON.stringify(input));
    assert.equal(typeof out.error, "string");
  }
  assert.ok(log.every(([step]) => step === "requireStaff"), "only the staff check ran");
  assert.equal(log.length, 10);
});

test("prepare: if Storage refuses (policy not applied), the visitor gets a plain message and the error is logged without detail", async () => {
  const log = [];
  installStaff(log, { signed: { data: null, error: { statusCode: "403", message: "new row violates row-level security policy for table objects" } } });
  const out = await actions.prepareLibraryUpload({ name: "a.mp4", size: 100 });
  assert.equal(out.ok, false);
  assert.match(out.error, /policies have been applied/);
  assert.doesNotMatch(out.error, /row-level/);
  assert.equal(errors.length, 1);
  assert.doesNotMatch(errors[0], /row-level/, "the log keeps the status, not the message");
});

test("record: a real GLB in storage is checked by its bytes, recorded with its true type and size, and the page cache is refreshed", async () => {
  const glb = file(GLB);
  const srv = await objectServer(new Map([[`models/2026/10/${ID}.glb`, glb]]));
  process.env.SUPABASE_URL = srv.url;
  process.env.SUPABASE_PUBLISHABLE_KEY = "sb_publishable_test";
  try {
    const log = [];
    installStaff(log);
    const out = await actions.recordLibraryUpload({ path: `models/2026/10/${ID}.glb`, alt: "  A cadet on a horse  " });
    assert.deepEqual(out, { ok: true, notice: "Uploaded. It is now on the gallery page." });
    assert.deepEqual(log, [
      ["requireStaff"],
      ["from", "media_assets"],
      ["insert", { storage_path: `models/2026/10/${ID}.glb`, alt_text: "A cadet on a horse", mime_type: "model/gltf-binary", bytes: glb.length, uploaded_by: STAFF_ID, bucket: "bsah-media", kind: "model" }],
    ]);
    assert.deepEqual(globalThis.__bsahTest.tags, ["bsah-media"]);
    assert.deepEqual(globalThis.__bsahTest.revalidated, [["/admin/media", undefined]]);
  } finally { await srv.close(); }
});

test("record: contents that do not match the name are removed from storage and never recorded", async () => {
  const srv = await objectServer(new Map([
    [`videos/2026/10/${ID}.mp4`, file(GLB)], // a model uploaded under a video name
    [`images/2026/10/${ID}.png`, text("<script>alert(1)</script>")],
  ]));
  process.env.SUPABASE_URL = srv.url;
  process.env.SUPABASE_PUBLISHABLE_KEY = "sb_publishable_test";
  try {
    for (const p of [`videos/2026/10/${ID}.mp4`, `images/2026/10/${ID}.png`]) {
      const log = [];
      installStaff(log);
      const out = await actions.recordLibraryUpload({ path: p, alt: "A described file" });
      assert.equal(out.ok, false, p);
      assert.deepEqual(log, [["requireStaff"], ["remove", "bsah-media", [p]]]);
      assert.deepEqual(globalThis.__bsahTest.tags, []);
    }
  } finally { await srv.close(); }
});

test("record: a file that never arrived, or a path the library did not issue, is refused (and only the first is cleaned up)", async () => {
  const srv = await objectServer(new Map());
  process.env.SUPABASE_URL = srv.url;
  process.env.SUPABASE_PUBLISHABLE_KEY = "sb_publishable_test";
  try {
    let log = [];
    installStaff(log);
    assert.equal((await actions.recordLibraryUpload({ path: `videos/2026/10/${ID}.mp4`, alt: "A described file" })).ok, false);
    assert.deepEqual(log, [["requireStaff"], ["remove", "bsah-media", [`videos/2026/10/${ID}.mp4`]]]);
    for (const p of ["../../private-documents/x.pdf", "site/2026/10/a.png", `images/2026/10/${ID}.svg`, "", "images/x"]) {
      log = [];
      installStaff(log);
      assert.match((await actions.recordLibraryUpload({ path: p, alt: "A described file" })).error, /not one this library issued/, p);
      assert.deepEqual(log, [["requireStaff"]], `nothing is read or removed for ${p}`);
    }
    assert.equal(srv.requests.length, 1, "only the one real path was looked up");
  } finally { await srv.close(); }
});

test("record: short alt text is refused before anything is read; a failed insert removes the file again", async () => {
  const mp4 = file(MP4).subarray(0, 4096);
  const srv = await objectServer(new Map([[`videos/2026/10/${ID}.mp4`, mp4]]));
  process.env.SUPABASE_URL = srv.url;
  process.env.SUPABASE_PUBLISHABLE_KEY = "sb_publishable_test";
  try {
    let log = [];
    installStaff(log);
    assert.match((await actions.recordLibraryUpload({ path: `videos/2026/10/${ID}.mp4`, alt: "ab" })).error, /Describe the file/);
    assert.deepEqual(log, [["requireStaff"]]);
    assert.equal(srv.requests.length, 0);

    log = [];
    installStaff(log, { insertError: { code: "23514", message: "check constraint" } });
    const out = await actions.recordLibraryUpload({ path: `videos/2026/10/${ID}.mp4`, alt: "A described file" });
    assert.equal(out.ok, false);
    assert.match(out.error, /removed again/);
    assert.deepEqual(log.map((s) => s[0]), ["requireStaff", "from", "insert", "remove"]);
    assert.deepEqual(globalThis.__bsahTest.tags, []);
    assert.equal(errors.length, 1);
    assert.match(errors[0], /23514/);
  } finally { await srv.close(); }
});

test("delete: the file goes first, then its record; a refused removal keeps the record; foreign paths and bad ids are ignored", async () => {
  const form = (id) => { const f = new FormData(); f.set("id", id); return f; };
  let log = [];
  installStaff(log, { row: { storage_path: `videos/2026/10/${ID}.mp4` } });
  await actions.deleteLibraryItem(form(ROW_ID));
  assert.deepEqual(log.map((s) => s[0]), ["requireStaff", "from", "select", "eq", "eq", "remove", "from", "delete", "eq"]);
  assert.deepEqual(log.find((s) => s[0] === "remove"), ["remove", "bsah-media", [`videos/2026/10/${ID}.mp4`]]);
  assert.deepEqual(log.filter((s) => s[0] === "eq"), [["eq", "id", ROW_ID], ["eq", "bucket", "bsah-media"], ["eq", "id", ROW_ID]]);
  assert.deepEqual(globalThis.__bsahTest.tags, ["bsah-media"]);

  log = [];
  installStaff(log, { row: { storage_path: `videos/2026/10/${ID}.mp4` }, removeError: { statusCode: "500" } });
  await actions.deleteLibraryItem(form(ROW_ID));
  assert.ok(!log.some((s) => s[0] === "delete"), "the record stays when Storage refuses");
  assert.deepEqual(globalThis.__bsahTest.tags, []);

  log = [];
  installStaff(log, { row: { storage_path: "../../private-documents/mou/x.pdf" } });
  await actions.deleteLibraryItem(form(ROW_ID));
  assert.ok(!log.some((s) => s[0] === "remove" || s[0] === "delete"), "a path the library did not issue is never removed");

  log = [];
  installStaff(log, { row: null });
  await actions.deleteLibraryItem(form(ROW_ID));
  for (const bad of ["not-a-uuid", "", `${ROW_ID}' or '1'='1`]) await actions.deleteLibraryItem(form(bad));
  assert.ok(!log.some((s) => s[0] === "remove" || s[0] === "delete"));
});

test("every action checks staff first, and when the check redirects nothing else runs", async () => {
  const log = [];
  globalThis.__bsahTest = { revalidated: [], tags: [], requireStaff: async () => { log.push(["requireStaff"]); throw new Error("NEXT_REDIRECT"); } };
  const form = new FormData();
  form.set("id", ROW_ID);
  await assert.rejects(actions.prepareLibraryUpload({ name: "a.mp4", size: 10 }), /NEXT_REDIRECT/);
  await assert.rejects(actions.recordLibraryUpload({ path: `videos/2026/10/${ID}.mp4`, alt: "A described file" }), /NEXT_REDIRECT/);
  await assert.rejects(actions.deleteLibraryItem(form), /NEXT_REDIRECT/);
  assert.deepEqual(log, [["requireStaff"], ["requireStaff"], ["requireStaff"]]);
  assert.deepEqual(globalThis.__bsahTest.tags, []);
  const source = readFileSync(path.join(root, "app/admin/library-actions.ts"), "utf8");
  assert.equal([...source.matchAll(/export async function \w+/g)].length, 3, "exactly the three actions, each tested above");
  for (const body of source.split(/export async function /).slice(1)) assert.match(body, /^\w+\([^)]*\)[^{]*\{\s*const \{[^}]*\} = await requireStaff\(\);/, "the first statement is the staff check");
});

// ------------------------------------------------------------------ the public side

test("the public gallery reads only with the publishable key, caches under the tag the admin actions expire, and survives any failure", async () => {
  const feed = readFileSync(path.join(root, "lib/storage/library-feed.ts"), "utf8");
  assert.match(feed, /"use cache"/);
  assert.match(feed, /cacheTag\(LIBRARY_TAG\)/);
  assert.doesNotMatch(feed, /SUPABASE_SECRET_KEY|\.secret/, "no secret key on the public path");
  const actionsSource = readFileSync(path.join(root, "app/admin/library-actions.ts"), "utf8");
  assert.match(actionsSource, /updateTag\(LIBRARY_TAG\)/);

  const saved = { url: process.env.SUPABASE_URL, pub: process.env.SUPABASE_PUBLISHABLE_KEY, nurl: process.env.NEXT_PUBLIC_SUPABASE_URL, npub: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY };
  try {
    delete process.env.SUPABASE_URL; delete process.env.SUPABASE_PUBLISHABLE_KEY; delete process.env.NEXT_PUBLIC_SUPABASE_URL; delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    const { getLibraryItems } = await loadTsWith("lib/storage/library-feed.ts", { "next/cache": "tests/helpers/fake-next-cache.mjs" });
    assert.deepEqual(await getLibraryItems(), [], "not configured: an empty gallery, not an error");

    const rest = [];
    const srv = http.createServer((req, res) => {
      rest.push({ url: req.url, apikey: req.headers.apikey, auth: req.headers.authorization });
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify([
        { id: "a", storage_path: "videos/2026/10/a.mp4", alt_text: "A canter", mime_type: "video/mp4", bytes: 10, created_at: "2026-10-29T00:00:00Z" },
        { id: "b", storage_path: "x.pdf", alt_text: "Not a library file", mime_type: "application/pdf", bytes: 10, created_at: "2026-10-29T00:00:00Z" },
        { nonsense: true },
      ]));
    });
    await new Promise((resolve) => srv.listen(0, "127.0.0.1", resolve));
    process.env.SUPABASE_URL = `http://127.0.0.1:${srv.address().port}`;
    process.env.SUPABASE_PUBLISHABLE_KEY = "sb_publishable_test";
    const items = await getLibraryItems();
    assert.deepEqual(items.map((i) => i.id), ["a"], "malformed and non-library rows are dropped");
    assert.equal(items[0].url, `${process.env.SUPABASE_URL}/storage/v1/object/public/bsah-media/videos/2026/10/a.mp4`);
    assert.match(rest[0].url, /^\/rest\/v1\/media_assets\?bucket=eq\.bsah-media&/);
    assert.deepEqual([rest[0].apikey, rest[0].auth], ["sb_publishable_test", undefined]);
    await new Promise((r) => srv.close(r));
    assert.deepEqual(await getLibraryItems(), [], "unreachable: an empty gallery");
  } finally {
    for (const [k, v] of [["SUPABASE_URL", saved.url], ["SUPABASE_PUBLISHABLE_KEY", saved.pub], ["NEXT_PUBLIC_SUPABASE_URL", saved.nurl], ["NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", saved.npub]]) { if (v === undefined) delete process.env[k]; else process.env[k] = v; }
  }
});

test("the admin page keeps working before the migration, and the pages follow the site's rules", () => {
  const page = readFileSync(path.join(root, "app/admin/media/page.tsx"), "utf8");
  assert.match(page, /42703/, "falls back to the old columns when the bucket column is missing");
  assert.match(page, /libraryReady/, "tells staff when the migration is missing");
  assert.match(page, /deleteMedia/, "the earlier image upload and delete are still there");
  const uploader = readFileSync(path.join(root, "app/admin/LibraryUploader.tsx"), "utf8");
  assert.match(uploader, /contentType: prepared\.mime/, "the type sent to Storage is the one the server chose from the name");
  assert.match(uploader, /prepareLibraryUpload[\s\S]*uploadToSignedUrl[\s\S]*recordLibraryUpload/, "prepare, then upload, then record, in that order");
  const gallery = readFileSync(path.join(root, "components/sections/gallery/GalleryScenes.tsx"), "utf8");
  assert.match(gallery, /pt-\[clamp\(7\.5rem/, "clears the fixed nav");
  assert.doesNotMatch(gallery, /autoPlay|autoplay/, "no autoplaying film");
  const stage = readFileSync(path.join(root, "components/sections/gallery/GalleryModelStage.tsx"), "utf8");
  assert.doesNotMatch(stage, /<Environment/, "no environment map: it would be fetched from another origin");
  assert.match(stage, /useReducedMotion/);
});
