import { test } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import { root } from "./helpers/load-ts.mjs";
import { startFakeStorage } from "./helpers/fake-storage.mjs";
import {
  KEY_RULE, classifyKey, encodePath, explainFailure, lookup, parseArgs, parseEnvFile, parseSupabaseUrl, statusOf,
} from "../scripts/upload-media.mjs";

// scripts/upload-media.mjs is what the site owner runs on their own computer. These tests run it as a separate process against
// a stand-in for the Supabase Storage API (tests/helpers/fake-storage.mjs), so no real project and no real key are involved.

const SCRIPT = path.join(root, "scripts", "upload-media.mjs");

const FILES = {
  "images/a.webp": [Buffer.alloc(1500, 1), "image/webp"],
  "images/sub dir/b (1).png": [Buffer.alloc(900, 2), "image/png"],
  "models/c.glb": [Buffer.alloc(3000, 3), "model/gltf-binary"],
  "video/d.mp4": [Buffer.alloc(5000, 4), "video/mp4"],
  "audio/e.wav": [Buffer.alloc(2500, 5), "audio/wav"],
};

function fixture(files) {
  const dir = mkdtempSync(path.join(os.tmpdir(), "bsah-upload-"));
  const pub = path.join(dir, "public");
  const entries = Object.entries(files).map(([rel, [content, type]]) => {
    const full = path.join(pub, ...rel.split("/"));
    mkdirSync(path.dirname(full), { recursive: true });
    writeFileSync(full, content);
    return { path: rel, bytes: content.length, sha256: createHash("sha256").update(content).digest("hex"), type };
  });
  const manifest = path.join(dir, "media-manifest.json");
  writeFileSync(manifest, JSON.stringify({ bucket: "website-media", count: entries.length, totalBytes: 0, files: entries }));
  return { dir, pub, manifest, cleanup: () => rmSync(dir, { recursive: true, force: true }) };
}

/** Runs the tool as the owner would, with only the variables given (the developer's own settings must not leak in). */
function run(args, { env = {}, cwd } = {}) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [SCRIPT, ...args], { cwd, env: { PATH: process.env.PATH, BSAH_UPLOAD_BACKOFF_MS: "5", ...env } });
    let out = "";
    let err = "";
    child.stdout.on("data", (d) => { out += d; });
    child.stderr.on("data", (d) => { err += d; });
    const timer = setTimeout(() => child.kill("SIGKILL"), 60000);
    child.on("close", (code) => {
      clearTimeout(timer);
      resolve({ code, out, err, all: out + err });
    });
  });
}

async function scenario(files, body, fakeOptions) {
  const fake = await startFakeStorage(fakeOptions);
  const fx = fixture(files);
  const exec = (extra = [], env = {}) =>
    run(["--manifest", fx.manifest, "--from", fx.pub, ...extra], { cwd: fx.dir, env: { SUPABASE_URL: fake.url, SUPABASE_SECRET_KEY: fake.key, ...env } });
  try {
    await body({ fake, fx, exec });
  } finally {
    await fake.close();
    fx.cleanup();
  }
}

test("a fresh run creates the public bucket, stores every file with its type and cache header, checks them, and prints the Vercel setting", async () => {
  await scenario(FILES, async ({ fake, exec }) => {
    const r = await exec(["--yes"]);
    assert.equal(r.code, 0, r.all);
    const bucket = fake.buckets.get("website-media");
    assert.equal(bucket.public, true);
    assert.deepEqual(bucket.allowed_mime_types, ["audio/wav", "image/png", "image/webp", "model/gltf-binary", "video/mp4"]);
    assert.equal(bucket.file_size_limit, 52428800);
    for (const [rel, [content, type]] of Object.entries(FILES)) {
      const stored = fake.objects.get(`website-media/${rel}`);
      assert.ok(stored, `${rel} was not stored`);
      assert.deepEqual(stored.body, content);
      assert.equal(stored.type, type);
      assert.equal(stored.cache, "max-age=86400");
    }
    assert.match(r.out, /5 uploaded, 0 already there, 0 different, 0 failed/);
    assert.match(r.out, /Public check: 5 of 5 files are fine/);
    assert.match(r.out, /All done/);
    assert.ok(r.out.includes(`NEXT_PUBLIC_MEDIA_BASE_URL=${fake.url}/storage/v1/object/public/website-media\n`), r.out);
    // the new-style key travels in the apikey header only, with a non-browser User-Agent, and never shows up in the output
    const writes = fake.requests.filter((q) => q.method === "POST");
    assert.equal(writes.length, 1 + 5, "one bucket and five files");
    for (const q of writes) {
      assert.equal(q.headers.apikey, fake.key);
      assert.equal(q.headers.authorization, undefined);
      assert.doesNotMatch(q.headers["user-agent"], /mozilla/i);
    }
    assert.ok(!r.all.includes(fake.key), "the key was printed");
  });
});

test("a second run sends nothing: files that are already there are skipped", async () => {
  await scenario(FILES, async ({ fake, exec }) => {
    assert.equal((await exec(["--yes"])).code, 0);
    const posts = fake.count("POST", "/object/");
    const again = await exec(["--yes"]);
    assert.equal(again.code, 0, again.all);
    assert.equal(fake.count("POST", "/object/"), posts, "a second upload was sent");
    assert.match(again.out, /0 uploaded, 5 already there/);
    assert.match(again.out, /Bucket website-media: already exists and is public/);
  });
});

test("--cache-seconds sets how long browsers may keep the files", async () => {
  await scenario(FILES, async ({ fake, exec }) => {
    assert.equal((await exec(["--yes", "--cache-seconds", "3600"])).code, 0);
    assert.equal(fake.objects.get("website-media/images/a.webp").cache, "max-age=3600");
  });
});

test("--only uploads just the named folders", async () => {
  await scenario(FILES, async ({ fake, exec }) => {
    const r = await exec(["--yes", "--only", "models/,audio/"]);
    assert.equal(r.code, 0, r.all);
    assert.deepEqual([...fake.objects.keys()].sort(), ["website-media/audio/e.wav", "website-media/models/c.glb"]);
  });
});

test("--dry-run needs no key, sends nothing, and reports the local check", async () => {
  await scenario(FILES, async ({ fake, exec }) => {
    const r = await exec(["--dry-run"], { SUPABASE_SECRET_KEY: "", SUPABASE_URL: "" });
    assert.equal(r.code, 0, r.all);
    assert.equal(fake.requests.length, 0);
    assert.match(r.out, /Local files: 5 identical to the list, 0 different, 0 missing/);
    assert.match(r.out, /By folder: .*images 2/);
    assert.match(r.out, /Dry run finished: nothing was sent/);
  });
});

test("a local file that differs from the list stops the run before anything is sent", async () => {
  await scenario(FILES, async ({ fake, fx, exec }) => {
    writeFileSync(path.join(fx.pub, "images", "a.webp"), Buffer.alloc(1500, 9)); // same size, other content
    rmSync(path.join(fx.pub, "models", "c.glb"));
    const r = await exec(["--yes"]);
    assert.equal(r.code, 1);
    assert.equal(fake.requests.length, 0);
    assert.match(r.out, /images\/a\.webp: same size, different content/);
    assert.match(r.out, /models\/c\.glb: not found here/);
    assert.match(r.out, /Nothing was uploaded/);
  });
});

test("--from-url takes a missing or different file from the live site and checks its content before uploading it", async () => {
  await scenario(FILES, async ({ fake, fx, exec }) => {
    let wrong = true;
    const site = http.createServer((req, res) => {
      const rel = decodeURIComponent(new URL(req.url, "http://site").pathname.slice(1));
      const entry = FILES[rel];
      if (!entry) { res.writeHead(404); return res.end(); }
      res.writeHead(200, { "content-type": entry[1] });
      return res.end(wrong ? Buffer.alloc(entry[0].length, 0xee) : entry[0]);
    });
    await new Promise((resolve) => site.listen(0, "127.0.0.1", resolve));
    try {
      const from = `http://127.0.0.1:${site.address().port}`;
      writeFileSync(path.join(fx.pub, "images", "a.webp"), "corrupted");
      const bad = await exec(["--yes", "--from-url", from, "--no-verify"]);
      assert.equal(bad.code, 1, bad.all);
      assert.match(bad.all, /images\/a\.webp: the live site has a different version than the list/);
      assert.ok(!fake.objects.has("website-media/images/a.webp"), "wrong content must never be uploaded");
      wrong = false;
      const good = await exec(["--yes", "--from-url", from]);
      assert.equal(good.code, 0, good.all);
      assert.deepEqual(fake.objects.get("website-media/images/a.webp").body, FILES["images/a.webp"][0]);
    } finally {
      site.closeAllConnections?.();
      await new Promise((resolve) => site.close(resolve));
    }
  });
});

test("an existing private bucket is left alone and nothing is uploaded", async () => {
  await scenario(FILES, async ({ fake, exec }) => {
    fake.buckets.set("website-media", { id: "website-media", name: "website-media", public: false, file_size_limit: null, allowed_mime_types: null });
    const r = await exec(["--yes"]);
    assert.equal(r.code, 1);
    assert.match(r.all, /already exists but it is private/);
    assert.equal(fake.count("POST", "/object/"), 0);
    assert.equal(fake.buckets.get("website-media").public, false, "the bucket was changed");
  });
});

test("when the project's own upload limit is lower than the bucket default, the bucket is created without its own limit", async () => {
  await scenario(FILES, async ({ fake, exec }) => {
    const r = await exec(["--yes"]);
    assert.equal(r.code, 0, r.all);
    assert.equal(fake.buckets.get("website-media").file_size_limit, null);
  }, { globalLimit: 10 * 1024 * 1024 });
});

test("busy-server answers (503, 429) are retried; a persistent one fails that file only, and the run says so", async () => {
  await scenario(FILES, async ({ fake, exec }) => {
    fake.fail(503, { times: 2, method: "POST", pathIncludes: "/object/website-media/video/d.mp4" });
    fake.fail(429, { times: 1, method: "POST", pathIncludes: "/object/website-media/audio/e.wav" });
    const r = await exec(["--yes"]);
    assert.equal(r.code, 0, r.all);
    assert.ok(fake.objects.has("website-media/video/d.mp4") && fake.objects.has("website-media/audio/e.wav"));
    assert.ok(fake.count("POST", "/object/website-media/video/d.mp4") >= 3);
  });
  await scenario(FILES, async ({ fake, exec }) => {
    fake.fail(503, { times: 99, method: "POST", pathIncludes: "/object/website-media/images/a.webp" });
    const r = await exec(["--yes"]);
    assert.equal(r.code, 1);
    assert.match(r.all, /images\/a\.webp: Supabase answered 503/);
    assert.equal(fake.objects.size, 4, "the other files still uploaded");
  });
});

test("a key Supabase refuses gives plain guidance, uploads nothing, and is never printed", async () => {
  await scenario(FILES, async ({ fake, exec }) => {
    const wrong = "sb_secret_WRONGWRONGWRONG0123456789";
    const r = await exec(["--yes"], { SUPABASE_SECRET_KEY: wrong });
    assert.equal(r.code, 1);
    assert.match(r.all, /Supabase refused the key \(401\)/);
    assert.match(r.all, /Project Settings > API Keys/);
    assert.ok(!r.all.includes(wrong), "the wrong key was printed");
    assert.equal(fake.objects.size, 0);
  });
});

test("a publishable, anon or malformed key is refused before any request", async () => {
  await scenario(FILES, async ({ fake, exec }) => {
    const anon = `eyJhbGciOiJIUzI1NiJ9.${Buffer.from(JSON.stringify({ role: "anon" })).toString("base64url")}.signature`;
    for (const bad of ["sb_publishable_abc123", anon, "not-a-key"]) {
      const r = await exec(["--yes"], { SUPABASE_SECRET_KEY: bad });
      assert.equal(r.code, 1);
      assert.match(r.all, /SECRET key|does not look like a Supabase secret key/);
      assert.ok(!r.all.includes(bad), "the key was printed");
    }
    assert.equal(fake.requests.length, 0);
  });
});

test("an old-style service_role key is sent as apikey and as a bearer token", async () => {
  const jwt = `eyJhbGciOiJIUzI1NiJ9.${Buffer.from(JSON.stringify({ role: "service_role" })).toString("base64url")}.signaturesignature`;
  await scenario(FILES, async ({ fake, exec }) => {
    const r = await exec(["--yes"], { SUPABASE_SECRET_KEY: jwt });
    assert.equal(r.code, 0, r.all);
    const write = fake.requests.find((q) => q.method === "POST" && q.path.includes("/object/"));
    assert.equal(write.headers.apikey, jwt);
    assert.equal(write.headers.authorization, `Bearer ${jwt}`);
    assert.ok(!r.all.includes(jwt));
  }, { key: jwt });
});

test("without a key and without a keyboard the run stops with instructions", async () => {
  await scenario(FILES, async ({ fake, exec }) => {
    const r = await exec(["--yes"], { SUPABASE_SECRET_KEY: "" });
    assert.equal(r.code, 1);
    assert.match(r.all, /No secret key/);
    assert.match(r.all, /Project Settings > API Keys/);
    assert.equal(fake.requests.length, 0);
  });
});

test("without --yes and without a keyboard nothing is sent", async () => {
  await scenario(FILES, async ({ fake, exec }) => {
    const r = await exec([]);
    assert.equal(r.code, 1);
    assert.match(r.all, /Add --yes/);
    assert.equal(fake.requests.length, 0);
  });
});

test("the key and the project address can come from .env.local; the output says where, never what", async () => {
  await scenario(FILES, async ({ fake, fx, exec }) => {
    writeFileSync(path.join(fx.dir, ".env.local"), `# comment\nSUPABASE_URL="${fake.url}"\nexport SUPABASE_SECRET_KEY='${fake.key}' # inline note\nOTHER=1\n`);
    const r = await exec(["--yes"], { SUPABASE_URL: "", SUPABASE_SECRET_KEY: "" });
    assert.equal(r.code, 0, r.all);
    assert.match(r.out, /Secret key: found in \.env\.local \(not shown\)/);
    assert.ok(!r.all.includes(fake.key));
  });
});

test("a file already in the bucket with another size is reported, and only --force replaces it", async () => {
  await scenario(FILES, async ({ fake, exec }) => {
    assert.equal((await exec(["--yes"])).code, 0);
    fake.put("website-media", "models/c.glb", Buffer.from("old, shorter"), "model/gltf-binary");
    const r = await exec(["--yes"]);
    assert.equal(r.code, 1);
    assert.match(r.all, /models\/c\.glb: already in the bucket with another size/);
    assert.match(r.all, /--force/);
    assert.equal(fake.objects.get("website-media/models/c.glb").body.toString(), "old, shorter", "left alone without --force");
    const forced = await exec(["--yes", "--force"]);
    assert.equal(forced.code, 0, forced.all);
    assert.deepEqual(fake.objects.get("website-media/models/c.glb").body, FILES["models/c.glb"][0]);
  });
});

test("older Storage answers (HTTP 400 with the real status in the body) are understood", async () => {
  await scenario(FILES, async ({ fake, exec }) => {
    assert.equal((await exec(["--yes"])).code, 0);
    // The cheap "is it there" look fails, so the upload itself is tried and answers "already exists" the old way.
    fake.fail(500, { times: 99, method: "HEAD", pathIncludes: "/object/website-media/" });
    const again = await exec(["--yes", "--no-verify"]);
    assert.equal(again.code, 0, again.all);
    assert.match(again.out, /0 uploaded, 5 already there/);
  }, { legacyErrors: true });
});

test("a file that is too large is explained and the other files still upload", async () => {
  await scenario(FILES, async ({ fake, exec }) => {
    fake.fail(413, { times: 99, method: "POST", pathIncludes: "video/d.mp4", body: { statusCode: "413", error: "Payload too large", message: "The object exceeded the maximum allowed size" } });
    const r = await exec(["--yes"]);
    assert.equal(r.code, 1);
    assert.match(r.all, /video\/d\.mp4 is larger than the upload limit/);
    assert.equal(fake.objects.size, 4);
  });
});

test("--verify-only needs no key, passes when everything is there, and names what is missing", async () => {
  await scenario(FILES, async ({ fake, exec }) => {
    assert.equal((await exec(["--yes"])).code, 0);
    const before = fake.requests.length;
    const ok = await exec(["--verify-only"], { SUPABASE_SECRET_KEY: "" });
    assert.equal(ok.code, 0, ok.all);
    assert.match(ok.out, /Public check: 5 of 5 files are fine/);
    assert.ok(fake.requests.slice(before).every((q) => q.method === "GET" && q.path.includes("/object/public/")), "only public reads");
    fake.objects.delete("website-media/audio/e.wav");
    const bad = await exec(["--verify-only"], { SUPABASE_SECRET_KEY: "" });
    assert.equal(bad.code, 1);
    assert.match(bad.all, /audio\/e\.wav: 404: not available at its public address/);
  });
});

test("--deep notices content that has the right size but is wrong", async () => {
  await scenario(FILES, async ({ fake, exec }) => {
    assert.equal((await exec(["--yes"])).code, 0);
    fake.objects.get("website-media/images/a.webp").body = Buffer.alloc(1500, 7);
    assert.equal((await exec(["--verify-only"])).code, 0, "size alone cannot tell");
    const deep = await exec(["--verify-only", "--deep"]);
    assert.equal(deep.code, 1);
    assert.match(deep.all, /images\/a\.webp: content differs from the list/);
  });
});

test("the check names missing cross-site permission and missing partial-download support", async () => {
  await scenario(FILES, async ({ exec }) => {
    const r = await exec(["--yes"]);
    assert.equal(r.code, 1);
    assert.match(r.all, /images\/a\.webp: no cross-site permission/);
    assert.match(r.all, /video\/d\.mp4: does not support partial downloads/);
    assert.match(r.all, /audio\/e\.wav: does not support partial downloads/);
    assert.doesNotMatch(r.all, /images\/a\.webp: does not support partial downloads/);
  }, { omitCors: true, ignoreRange: true });
});

test("a wrong project address is explained without sending anything", async () => {
  await scenario(FILES, async ({ fake, exec }) => {
    const r = await exec(["--yes"], { SUPABASE_URL: "http://project.example.com" });
    assert.equal(r.code, 1);
    assert.match(r.all, /must look like https:\/\/<project>\.supabase\.co/);
    assert.equal(fake.requests.length, 0);
  });
});

test("--help lists the options and an unknown option is refused", async () => {
  const help = await run(["--help"]);
  assert.equal(help.code, 0);
  for (const option of ["--dry-run", "--verify-only", "--force", "--deep", "--only", "--from-url", "--yes"]) assert.ok(help.out.includes(option), option);
  const bad = await run(["--delete-everything"]);
  assert.equal(bad.code, 1);
  assert.match(bad.err, /Unknown option --delete-everything/);
});

// -------------------------------------------------------------------------------------------------------- small pieces

test("options: defaults, values with = or a space, and refusals", () => {
  const d = parseArgs([]);
  assert.deepEqual([d.dryRun, d.verifyOnly, d.force, d.deep, d.yes, d.concurrency, d.cacheSeconds, d.only], [false, false, false, false, false, 4, 86400, []]);
  const o = parseArgs(["--only=models/,/audio/", "--concurrency", "2", "--from", "x", "-y"]);
  assert.deepEqual([o.only, o.concurrency, o.from, o.yes], [["models/", "audio/"], 2, "x", true]);
  assert.throws(() => parseArgs(["--concurrency", "99"]), /from 1 to 8/);
  assert.throws(() => parseArgs(["--cache-seconds", "abc"]), /whole number/);
  assert.throws(() => parseArgs(["--only"]), /needs a value/);
  assert.throws(() => parseArgs(["--only", "--force"]), /needs a value/);
  assert.throws(() => parseArgs(["--dry-run", "--verify-only"]), /not both/);
});

test(".env.local parsing: comments, export, quotes, inline notes; empty values count as unset", () => {
  const vars = parseEnvFile('# c\n\nA=1\nexport B="two words"\nC=\'x\'\nD=value # note\nE=\nbad line\n');
  assert.deepEqual(vars, { A: "1", B: "two words", C: "x", D: "value", E: "" });
  assert.equal(lookup(["E", "A"], [], { E: "  ", A: "env" }).value, "env");
  assert.equal(lookup(["Z"], [], {}), null);
});

test("project address: https only (plain http only for this computer), no path or login", () => {
  assert.equal(parseSupabaseUrl("https://abcd.supabase.co"), "https://abcd.supabase.co");
  assert.equal(parseSupabaseUrl(" https://abcd.supabase.co/ "), "https://abcd.supabase.co");
  assert.equal(parseSupabaseUrl("http://127.0.0.1:4010"), "http://127.0.0.1:4010");
  for (const bad of ["", "abcd.supabase.co", "http://abcd.supabase.co", "https://abcd.supabase.co/rest/v1", "https://u:p@abcd.supabase.co", "https://abcd.supabase.co?x=1", "ftp://abcd.supabase.co"]) {
    assert.equal(parseSupabaseUrl(bad), "", bad);
  }
});

test("key kinds: sb_secret_ goes in apikey only, a service_role JWT also as a bearer; publishable and anon are refused", () => {
  const secret = classifyKey("  sb_secret_abcDEF123_xyz  ");
  assert.deepEqual([secret.ok, secret.headers], [true, { apikey: "sb_secret_abcDEF123_xyz" }]);
  const jwt = (role) => `eyJhbGciOiJIUzI1NiJ9.${Buffer.from(JSON.stringify({ role })).toString("base64url")}.sig`;
  assert.deepEqual(classifyKey(jwt("service_role")).headers, { apikey: jwt("service_role"), authorization: `Bearer ${jwt("service_role")}` });
  assert.equal(classifyKey(jwt("anon")).reason, "anon");
  assert.equal(classifyKey("sb_publishable_abc").reason, "publishable");
  assert.equal(classifyKey("").reason, "empty");
  assert.equal(classifyKey("hello").reason, "shape");
  assert.equal(classifyKey('"sb_secret_quoted"').ok, true);
});

test("object names: the Storage character rule and one encoding for the upload and the site", () => {
  for (const ok of ["images/a.webp", "video/Firefly Create a --3-second loop-- using the desert image. The horse slo.mp4", "audio/it's (1).mp3"]) assert.match(ok, KEY_RULE);
  for (const bad of ["images/a#b.webp", "images/a%20b.webp", "images/ä.webp", "images/a|b.webp", "images/[x].webp", ""]) assert.doesNotMatch(bad, KEY_RULE, bad);
  assert.equal(encodePath("video/long name (1).mp4"), "video/long%20name%20(1).mp4");
  assert.equal(encodePath("a/b c/d.webp"), encodeURI("a/b c/d.webp"));
});

test("statusOf prefers the status carried in the body and explainFailure speaks plainly", () => {
  assert.equal(statusOf({ status: 400 }, { statusCode: "409" }), 409);
  assert.equal(statusOf({ status: 200 }, { statusCode: "abc" }), 200);
  assert.equal(statusOf({ status: 503 }, null), 503);
  assert.match(explainFailure(401, {}), /Project Settings > API Keys/);
  assert.match(explainFailure(402, { message: "Payment required" }), /plan limit/);
  assert.match(explainFailure(413, {}, "video/x.mp4"), /video\/x\.mp4 is larger than the upload limit/);
  assert.match(explainFailure(400, { message: "mime type text/plain is not supported" }), /does not accept this kind of file/);
});
