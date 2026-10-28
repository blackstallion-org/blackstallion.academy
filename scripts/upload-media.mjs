#!/usr/bin/env node
// Uploads the website's media (stills, 3D models, video, audio) to a PUBLIC Supabase Storage bucket and checks the result.
// The site owner runs this on their own computer, so the Supabase secret key never has to be shared with anyone.
//
//   node scripts/upload-media.mjs --dry-run       look only: compares the local files with the list, sends nothing
//   node scripts/upload-media.mjs                 creates the bucket if it is missing, uploads what is missing, then checks every file
//   node scripts/upload-media.mjs --verify-only   only checks the public addresses (no secret key needed)
//   node scripts/upload-media.mjs --help          every option
//
// Needs Node 18 or newer and nothing else. The list of files is media-manifest.json next to this script (scripts/media-manifest.mjs
// writes it). The script only ever ADDS files to one bucket: it never deletes or moves anything, here or in Supabase, and it
// leaves existing files alone unless --force is given. Docs: docs/MEDIA_HOSTING.md
import { createHash } from "node:crypto";
import { readFileSync, statSync } from "node:fs";
import path from "node:path";
import readline from "node:readline";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const USER_AGENT = "bsah-media-upload/1"; // Supabase answers 401 to a secret key sent with a browser-like User-Agent
const DEFAULT_ORIGIN = "https://project-t9r95.vercel.app"; // only used to ask the bucket for its CORS headers
const BUCKET_FILE_LIMIT = 52428800; // 50 MiB; the largest file in the list is 7.8 MB (8,176,105 bytes)
const RETRY_STATUS = new Set([408, 425, 429, 500, 502, 503, 504, 544]);
const mb = (bytes) => `${(bytes / 1048576).toFixed(1)} MB`;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const sha256 = (buffer) => createHash("sha256").update(buffer).digest("hex");

/** Object names Supabase Storage accepts (the S3-safe set plus a few more); anything else is refused as InvalidKey. */
export const KEY_RULE = /^(\w|\/|!|-|\.|\*|'|\(|\)| |&|\$|@|=|;|:|\+|,|\?)+$/;
/** One object path in a URL: every segment percent-encoded, slashes kept. Same result as encodeURI for the names used here. */
export const encodePath = (p) => p.split("/").map(encodeURIComponent).join("/");

/** A message written for the site owner. It is printed without a stack trace. */
class Problem extends Error {}

const HELP = `Upload the website's media to Supabase Storage (bucket website-media) and check it.

  node upload-media.mjs [options]

What it does, in order:
  1. compares your local media files with the list (media-manifest.json): same names, sizes and content
  2. creates the public bucket "website-media" if it does not exist yet
  3. uploads every file that is not there yet (files already there are left alone)
  4. opens every file at its public address and checks size, type, cross-site headers and video seeking
  5. prints the one line to add to Vercel

It never deletes or moves anything. Your secret key is read from SUPABASE_SECRET_KEY (environment or .env.local) or typed
when asked (hidden). It is only sent to your own Supabase project and is never printed or saved.

Options:
  --dry-run            look only: check the local files against the list, send nothing, need no key
  --verify-only        only check the public addresses of the files (no secret key needed)
  --force              replace files that are already in the bucket (default: leave them alone)
  --deep               while checking, download every file and compare its content, not just its size
  --only <folders>     only these parts of the list, e.g. --only models/,audio/
  --from <folder>      where the media files are on this computer (default: the public folder of the project)
  --from-url <site>    take a file from this website when the local copy is missing or different
  --url <address>      the Supabase project address (default: SUPABASE_URL from the environment or .env.local)
  --origin <address>   the website address used for the cross-site check (default: ${DEFAULT_ORIGIN})
  --manifest <file>    use another list of files (default: media-manifest.json next to this script)
  --cache-seconds <n>  how long browsers may keep a file before asking again (default: 86400, one day)
  --concurrency <n>    files sent at the same time, 1 to 8 (default: 4)
  --no-verify          skip step 4
  --yes                do not ask for confirmation before uploading
  --help               this text
`;

// ---------------------------------------------------------------------------------------------------------------- options

const FLAGS = {
  "--dry-run": "dryRun", "--verify-only": "verifyOnly", "--force": "force", "--deep": "deep", "--no-verify": "noVerify",
  "--yes": "yes", "-y": "yes", "--help": "help", "-h": "help",
};
const VALUES = {
  "--only": "only", "--from": "from", "--from-url": "fromUrl", "--url": "url", "--origin": "origin", "--manifest": "manifest",
  "--cache-seconds": "cacheSeconds", "--concurrency": "concurrency",
};

export function parseArgs(argv) {
  const opts = {
    dryRun: false, verifyOnly: false, force: false, deep: false, noVerify: false, yes: false, help: false,
    only: [], from: "", fromUrl: "", url: "", origin: DEFAULT_ORIGIN, manifest: "", cacheSeconds: 86400, concurrency: 4,
  };
  const args = argv.flatMap((a) => (a.startsWith("--") && a.includes("=") ? [a.slice(0, a.indexOf("=")), a.slice(a.indexOf("=") + 1)] : [a]));
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (FLAGS[a]) { opts[FLAGS[a]] = true; continue; }
    if (VALUES[a]) {
      const value = args[++i];
      if (value === undefined || value.startsWith("--")) throw new Problem(`${a} needs a value. Try --help.`);
      opts[VALUES[a]] = value;
      continue;
    }
    throw new Problem(`Unknown option ${a}. Try --help.`);
  }
  opts.only = String(opts.only || "").split(",").map((s) => s.trim().replace(/^\/+/, "")).filter(Boolean);
  const whole = (name, value, min, max) => {
    const n = Number(value);
    if (!Number.isInteger(n) || n < min || n > max) throw new Problem(`${name} must be a whole number from ${min} to ${max}.`);
    return n;
  };
  opts.concurrency = whole("--concurrency", opts.concurrency, 1, 8);
  opts.cacheSeconds = whole("--cache-seconds", opts.cacheSeconds, 0, 31536000);
  if (opts.dryRun && opts.verifyOnly) throw new Problem("Use either --dry-run or --verify-only, not both.");
  return opts;
}

// ---------------------------------------------------------------------------------------------------- settings and secrets

export function parseEnvFile(text) {
  const out = {};
  for (const raw of String(text).split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const match = /^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/.exec(line);
    if (!match) continue;
    let value = match[2].trim();
    if (value.length >= 2 && ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'")))) value = value.slice(1, -1);
    else value = value.replace(/\s+#.*$/, "");
    out[match[1]] = value;
  }
  return out;
}

function readEnvFile(file) {
  try { return parseEnvFile(readFileSync(file, "utf8")); } catch { return {}; }
}

/** First non-empty value among `names`: the environment first, then each .env.local file in order. */
export function lookup(names, envFiles, env = process.env) {
  for (const name of names) if (env[name] && env[name].trim()) return { value: env[name].trim(), source: "the environment" };
  for (const file of envFiles) {
    const vars = readEnvFile(file);
    for (const name of names) if (vars[name] && vars[name].trim()) return { value: vars[name].trim(), source: file };
  }
  return null;
}

/** The project address: https only (plain http only for this computer), no path, no login, no query. Returns its origin or "". */
export function parseSupabaseUrl(raw) {
  let url;
  try { url = new URL(String(raw ?? "").trim()); } catch { return ""; }
  const loopback = ["127.0.0.1", "localhost", "[::1]"].includes(url.hostname);
  if (url.protocol !== "https:" && !(url.protocol === "http:" && loopback)) return "";
  if (url.username || url.password || url.search || url.hash || url.pathname !== "/") return "";
  return url.origin;
}

/** What kind of key this is, and the headers that carry it. The new sb_secret_ keys go in `apikey` only (they are not JWTs). */
export function classifyKey(raw) {
  const key = String(raw ?? "").trim().replace(/^["']|["']$/g, "");
  if (!key) return { ok: false, reason: "empty" };
  if (key.startsWith("sb_publishable_")) return { ok: false, reason: "publishable" };
  if (key.startsWith("sb_secret_")) return { ok: true, key, headers: { apikey: key } };
  if (/^eyJ[\w-]+\.[\w-]+\.[\w-]+$/.test(key)) {
    let role = "";
    try { role = JSON.parse(Buffer.from(key.split(".")[1], "base64url").toString("utf8")).role; } catch { /* not a Supabase key */ }
    if (role === "service_role") return { ok: true, key, headers: { apikey: key, authorization: `Bearer ${key}` } };
    return { ok: false, reason: role === "anon" ? "anon" : "shape" };
  }
  return { ok: false, reason: "shape" };
}

const KEY_PROBLEM = {
  empty: "No key was given.",
  publishable: "That is the publishable key. It cannot upload files. Use the SECRET key (it starts with sb_secret_).",
  anon: "That is the old public (anon) key. It cannot upload files. Use the SECRET key (it starts with sb_secret_).",
  shape: "That does not look like a Supabase secret key. It should start with sb_secret_.",
};
const WHERE_IS_THE_KEY = "Find it in Supabase: your project > Project Settings > API Keys > Secret keys > Reveal. Nobody else needs to see it.";

/** Reads a line from the keyboard without showing it; each typed or pasted character appears as *. */
function askHidden(question) {
  return new Promise((resolve, reject) => {
    const { stdin, stdout } = process;
    stdout.write(question);
    let value = "";
    const finish = (error) => {
      stdin.setRawMode(false);
      stdin.pause();
      stdin.removeListener("data", onData);
      stdout.write("\n");
      if (error) reject(error); else resolve(value.replace(/\u001b\[\d*~/g, "").trim());
    };
    const onData = (chunk) => {
      for (const ch of String(chunk)) {
        if (ch === "\r" || ch === "\n" || ch === "\u0004") return finish();
        if (ch === "\u0003") return finish(new Problem("Stopped."));
        if (ch === "\u007f" || ch === "\b") { if (value) { value = value.slice(0, -1); stdout.write("\b \b"); } continue; }
        if (ch >= " ") { value += ch; stdout.write("*"); }
      }
    };
    stdin.setRawMode(true);
    stdin.setEncoding("utf8");
    stdin.resume();
    stdin.on("data", onData);
  });
}

async function confirm(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const answer = await new Promise((resolve) => rl.question(question, resolve));
  rl.close();
  return /^y(es)?$/i.test(answer.trim());
}

// ---------------------------------------------------------------------------------------------------------------- the list

export function loadManifest(file) {
  let data;
  try { data = JSON.parse(readFileSync(file, "utf8")); } catch (error) {
    throw new Problem(`Cannot read the list of files (${file}): ${error.code === "ENOENT" ? "the file is missing" : error.message}`);
  }
  if (typeof data?.bucket !== "string" || !/^[a-z0-9][a-z0-9-]{1,62}$/.test(data.bucket) || !Array.isArray(data.files) || !data.files.length) {
    throw new Problem(`${file} is not a media list (it needs a bucket name and a list of files).`);
  }
  const seen = new Set();
  for (const entry of data.files) {
    const bad = (why) => new Problem(`The list has a bad entry (${JSON.stringify(entry?.path)}): ${why}.`);
    if (typeof entry?.path !== "string" || !entry.path || entry.path.startsWith("/") || entry.path.split("/").some((s) => s === "" || s === "." || s === "..")) throw bad("the path must be relative, like images/a.webp");
    if (!KEY_RULE.test(entry.path) || Buffer.byteLength(entry.path) > 1000) throw bad("Supabase would refuse this file name");
    if (!Number.isInteger(entry.bytes) || entry.bytes <= 0) throw bad("the size must be a positive whole number");
    if (!/^[0-9a-f]{64}$/.test(entry.sha256)) throw bad("the SHA-256 must be 64 hexadecimal characters");
    if (!/^[a-z]+\/[a-z0-9.+-]+$/.test(entry.type)) throw bad("the content type is not valid");
    if (seen.has(entry.path)) throw bad("it appears twice");
    seen.add(entry.path);
  }
  return data;
}

function sourceFolder(explicit) {
  const candidates = explicit ? [path.resolve(explicit)] : [path.resolve("public"), path.join(here, "..", "public"), path.join(here, "..", "..", "public")];
  for (const candidate of candidates) {
    try { if (statSync(candidate).isDirectory()) return candidate; } catch { /* try the next place */ }
  }
  throw new Problem(explicit
    ? `The media folder ${path.resolve(explicit)} does not exist.`
    : "Cannot find the website's public folder. Run this from the project folder, or point to it with --from <folder>.");
}

const localFile = (from, entry) => path.join(from, ...entry.path.split("/"));

/** Compares every local file with the list: present, same size, same SHA-256. Nothing is sent anywhere. */
export function checkLocal(files, from) {
  const result = { same: [], missing: [], different: [] };
  for (const entry of files) {
    const file = localFile(from, entry);
    let stat = null;
    try { stat = statSync(file); } catch { /* missing */ }
    if (!stat || !stat.isFile()) { result.missing.push({ entry, why: "not found here" }); continue; }
    if (stat.size !== entry.bytes) { result.different.push({ entry, why: `${stat.size} bytes here, ${entry.bytes} in the list` }); continue; }
    if (sha256(readFileSync(file)) !== entry.sha256) { result.different.push({ entry, why: "same size, different content" }); continue; }
    result.same.push(entry);
  }
  return result;
}

// -------------------------------------------------------------------------------------------------------------- the network

export function makeClient({ base, headers, key, backoff = [1000, 3000, 8000] }) {
  const redact = (text) => {
    let out = String(text);
    if (key) out = out.split(key).join("[hidden]");
    return out.replace(/sb_secret_[A-Za-z0-9_-]+/g, "[hidden]").replace(/eyJ[\w-]{10,}\.[\w-]{10,}\.[\w-]{10,}/g, "[hidden]");
  };

  /** fetch with a time limit and a few patient retries for network errors and busy-server answers. */
  async function send(url, init = {}, { retries = 3, timeoutMs = 30000 } = {}) {
    let failure;
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const res = await fetch(url, { ...init, signal: AbortSignal.timeout(timeoutMs) });
        if (RETRY_STATUS.has(res.status) && attempt < retries) {
          await res.arrayBuffer().catch(() => {});
          await sleep(backoff[Math.min(attempt, backoff.length - 1)]);
          continue;
        }
        return res;
      } catch (error) {
        failure = error;
        if (attempt < retries) await sleep(backoff[Math.min(attempt, backoff.length - 1)]);
      }
    }
    const cause = failure?.cause?.code || failure?.name || "network error";
    throw new Problem(`Could not reach ${new URL(url).host} (${redact(cause)}). Check the internet connection and try again.`);
  }

  const asJson = async (res) => {
    const text = await res.text().catch(() => "");
    try { return { text, json: JSON.parse(text) }; } catch { return { text, json: null }; }
  };

  return {
    redact,
    send,
    asJson,
    storage: `${base}/storage/v1`,
    auth: { ...headers, "user-agent": USER_AGENT },
  };
}

/** Older Storage versions answer HTTP 400 and put the real status in the body ({"statusCode":"409"}); use whichever is more specific. */
export const statusOf = (res, json) => {
  const inBody = Number(json?.statusCode);
  return Number.isInteger(inBody) && inBody >= 400 && inBody < 600 ? inBody : res.status;
};
const messageOf = (body) => String(body?.message || body?.error || body?.text || "").replace(/\s+/g, " ").trim().slice(0, 200);

/** Plain-language reason for a refused request. */
export function explainFailure(status, body, file) {
  const text = messageOf(body);
  if (status === 401 || status === 403) return `Supabase refused the key (${status}). ${WHERE_IS_THE_KEY} Check that it belongs to this project.`;
  if (status === 402 || /quota|payment required|restricted|exceed.*(storage|plan)/i.test(text)) {
    return `Supabase says a plan limit was reached (${status}${text ? `: ${text}` : ""}). Open Billing in Supabase and check the plan; the Free plan is too small for this.`;
  }
  if (status === 413) {
    return `${file ? `${file} is` : "A file is"} larger than the upload limit of the project or the bucket (413). Raise it in Supabase > Storage > Settings (Free projects are capped at 50 MB).`;
  }
  if (status === 415 || /mime/i.test(text)) return `The bucket does not accept this kind of file (${text || status}). Edit the bucket in Supabase > Storage and allow it, or remove the type restriction.`;
  if (/invalid.?key|invalid.*name/i.test(text)) return `Supabase refused the file name (${text}).`;
  return `Supabase answered ${status}${text ? `: ${text}` : ""}.`;
}

// ------------------------------------------------------------------------------------------------------------------ steps

async function ensureBucket(client, manifest, log) {
  const name = manifest.bucket;
  const lookupBucket = async () => {
    const res = await client.send(`${client.storage}/bucket/${encodeURIComponent(name)}`, { headers: client.auth });
    const { text, json } = await client.asJson(res);
    const status = statusOf(res, json);
    if (res.ok && json && !json.statusCode) return { bucket: json };
    if (status === 404 || /not.?found/i.test(`${json?.error ?? ""} ${json?.message ?? ""}`)) return { missing: true };
    throw new Problem(explainFailure(status, { ...json, text }));
  };
  const mustBePublic = (bucket) => {
    if (bucket.public !== true) {
      throw new Problem(`A bucket named ${name} already exists but it is private, so visitors could not see the files. Make it public in Supabase (Storage > ${name} > Edit bucket > Public bucket), or tell Claude. Nothing was uploaded.`);
    }
  };

  const first = await lookupBucket();
  if (first.bucket) {
    mustBePublic(first.bucket);
    log(`Bucket ${name}: already exists and is public.`);
    return;
  }

  const types = [...new Set(manifest.files.map((f) => f.type))].sort();
  const create = async (limit) => {
    const body = { id: name, name, public: true, allowed_mime_types: types, ...(limit ? { file_size_limit: limit } : {}) };
    const res = await client.send(`${client.storage}/bucket`, {
      method: "POST", headers: { ...client.auth, "content-type": "application/json" }, body: JSON.stringify(body),
    });
    const { text, json } = await client.asJson(res);
    return { status: statusOf(res, json), ok: res.ok && !json?.statusCode, body: { ...json, text } };
  };
  let made = await create(BUCKET_FILE_LIMIT);
  if (!made.ok && made.status !== 409 && /size|limit/i.test(messageOf(made.body))) made = await create(0); // the project's own limit applies
  if (made.status === 409 && !made.ok) {
    const again = await lookupBucket(); // someone created it a moment ago
    if (again.bucket) mustBePublic(again.bucket);
    log(`Bucket ${name}: already exists and is public.`);
    return;
  }
  if (!made.ok) throw new Problem(`Could not create the bucket ${name}: ${explainFailure(made.status, made.body)}`);
  log(`Bucket ${name}: created (public).`);
}

async function uploadOne(entry, ctx) {
  const { client, opts, manifest } = ctx;
  const objectUrl = `${client.storage}/object/${encodeURIComponent(manifest.bucket)}/${encodePath(entry.path)}`;
  if (!opts.force) {
    // A cheap look first, so a second run does not send the bytes again. Not an authority: the upload below is.
    const head = await ctx.client.send(objectUrl, { method: "HEAD", headers: client.auth }, { retries: 1 }).catch(() => null);
    if (head && head.status === 200) {
      const size = Number(head.headers.get("content-length"));
      if (size === entry.bytes) return { status: "there" };
      if (Number.isFinite(size) && size > 0) return { status: "differs", reason: `already in the bucket with another size (${size} bytes, expected ${entry.bytes}); run again with --force to replace it` };
    }
  }
  const bytes = await ctx.bytesFor(entry);
  const res = await client.send(objectUrl, {
    method: "POST",
    headers: { ...client.auth, "content-type": entry.type, "cache-control": `max-age=${opts.cacheSeconds}`, "x-upsert": opts.force ? "true" : "false" },
    body: bytes,
  }, { timeoutMs: 240000 });
  const { text, json } = await client.asJson(res);
  const status = statusOf(res, json);
  if (res.ok && status < 400) return { status: "uploaded" };
  if (status === 409 || /^(duplicate|already_?exists|resourcealreadyexists|keyalreadyexists)$/i.test(String(json?.error ?? json?.code ?? ""))) return { status: "there" };
  return { status: "failed", reason: explainFailure(status, { ...json, text }, entry.path) };
}

/** Opens one file at its public address. Returns a list of problems (empty = fine). */
async function checkOne(entry, ctx) {
  const { client, opts, manifest } = ctx;
  const url = `${ctx.publicBase}/${encodePath(entry.path)}`;
  const headers = { "user-agent": USER_AGENT, origin: opts.origin, range: "bytes=0-0" };
  const problems = [];
  const res = await client.send(url, { headers }, { retries: 2 });
  await res.body?.cancel().catch(() => {});
  if (res.status !== 200 && res.status !== 206) {
    return [`${res.status}: not available at its public address${res.status === 404 || res.status === 400 ? " (if it was uploaded a moment ago, wait a minute and run --verify-only)" : ""}`];
  }
  const range = /^bytes 0-0\/(\d+)$/.exec(res.headers.get("content-range") || "");
  const size = res.status === 206 ? (range ? Number(range[1]) : NaN) : Number(res.headers.get("content-length"));
  if (size !== entry.bytes) problems.push(`size ${Number.isFinite(size) ? size : "unknown"} bytes, expected ${entry.bytes}`);
  const type = (res.headers.get("content-type") || "").split(";")[0].trim().toLowerCase();
  if (type !== entry.type) problems.push(`served as ${type || "no type"}, expected ${entry.type}`);
  const allow = res.headers.get("access-control-allow-origin");
  if (allow !== "*" && allow !== opts.origin) problems.push(`no cross-site permission for ${opts.origin} (header: ${allow ?? "none"}); effects that read the picture, and 3D models, would be blocked`);
  if (!res.headers.get("cache-control")) problems.push("no cache-control header");
  if (/^(video|audio)\//.test(entry.type) && res.status !== 206) problems.push("does not support partial downloads, so video and audio cannot be skipped through");
  if (opts.deep) {
    const full = await client.send(url, { headers: { "user-agent": USER_AGENT } }, { retries: 2, timeoutMs: 240000 });
    if (full.status !== 200) problems.push(`full download answered ${full.status}`);
    else if (sha256(Buffer.from(await full.arrayBuffer())) !== entry.sha256) problems.push("content differs from the list (SHA-256)");
  }
  return problems.length ? problems : [];
}

async function pool(items, limit, worker) {
  const results = new Array(items.length);
  let next = 0;
  const run = async () => {
    for (;;) {
      const i = next++;
      if (i >= items.length) return;
      results[i] = await worker(items[i], i);
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, run));
  return results;
}

// ------------------------------------------------------------------------------------------------------------------- main

export async function main(argv = process.argv.slice(2)) {
  const opts = parseArgs(argv);
  if (opts.help) { console.log(HELP); return 0; }
  if (Number(process.versions.node.split(".")[0]) < 18) throw new Problem(`This needs Node 18 or newer (this is ${process.versions.node}).`);
  const log = (line = "") => process.stdout.write(`${line}\n`);

  const manifest = loadManifest(opts.manifest || path.join(here, "media-manifest.json"));
  const files = opts.only.length ? manifest.files.filter((f) => opts.only.some((prefix) => f.path.startsWith(prefix))) : manifest.files;
  if (!files.length) throw new Problem(`Nothing in the list matches --only ${opts.only.join(",")}.`);
  const total = files.reduce((sum, f) => sum + f.bytes, 0);
  const from = opts.verifyOnly ? null : sourceFolder(opts.from);
  const envFiles = [...new Set([path.resolve(".env.local"), ...(from ? [path.join(path.dirname(from), ".env.local")] : [])])];

  const urlSetting = opts.url ? { value: opts.url, source: "--url" } : lookup(["SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_URL"], envFiles);
  const origin = urlSetting ? parseSupabaseUrl(urlSetting.value) : "";
  if (urlSetting && !origin) throw new Problem(`The Supabase project address must look like https://<project>.supabase.co (no path). Got: ${urlSetting.value.replace(/[?#].*$/, "")}`);
  if (!origin && !opts.dryRun) throw new Problem("The Supabase project address is missing. Set SUPABASE_URL (environment or .env.local) or pass --url https://<project>.supabase.co");
  const publicBase = origin ? `${origin}/storage/v1/object/public/${manifest.bucket}` : `https://<project>.supabase.co/storage/v1/object/public/${manifest.bucket}`;

  log("BSAH media upload");
  log(`  Project : ${origin || "(not needed for a dry run)"}`);
  log(`  Bucket  : ${manifest.bucket} (public)`);
  log(`  Files   : ${files.length} (${mb(total)})${opts.only.length ? `, only ${opts.only.join(", ")}` : ""}`);
  if (from) log(`  Source  : ${from}`);
  log(`  Mode    : ${opts.dryRun ? "dry run (nothing is sent)" : opts.verifyOnly ? "check only (nothing is uploaded)" : opts.force ? "upload, replacing files that are already there" : "upload what is missing"}`);
  log();

  // 1. local files against the list
  let local = null;
  if (!opts.verifyOnly) {
    local = checkLocal(files, from);
    log(`Local files: ${local.same.length} identical to the list, ${local.different.length} different, ${local.missing.length} missing.`);
    const bad = [...local.different, ...local.missing];
    for (const { entry, why } of bad.slice(0, 20)) log(`  - ${entry.path}: ${why}`);
    if (bad.length > 20) log(`  ... and ${bad.length - 20} more`);
    if (bad.length && !opts.fromUrl) {
      log();
      log("These files are not the ones the website was tested with. Either put the right files in place, add");
      log(`  --from-url ${DEFAULT_ORIGIN}`);
      log("to take them from the live site, or ask Claude to refresh the list. Nothing was uploaded.");
      return 1;
    }
    if (bad.length) log(`  They will be taken from ${opts.fromUrl} instead.`);
    const folders = new Map();
    for (const f of files) {
      const top = f.path.split("/")[0];
      const row = folders.get(top) || { count: 0, bytes: 0 };
      folders.set(top, { count: row.count + 1, bytes: row.bytes + f.bytes });
    }
    log(`  By folder: ${[...folders].map(([name, row]) => `${name} ${row.count} (${mb(row.bytes)})`).join(", ")}`);
    log();
  }
  if (opts.dryRun) {
    log(`Dry run finished: nothing was sent. A real run would put these files at`);
    log(`  ${publicBase}/<path>`);
    return 0;
  }

  // 2. the key (not needed to only look)
  let client;
  let key = null;
  if (!opts.verifyOnly) {
    const found = lookup(["SUPABASE_SECRET_KEY", "SUPABASE_SERVICE_ROLE_KEY"], envFiles);
    let raw = found?.value;
    if (found) log(`Secret key: found in ${found.source === "the environment" ? "the environment" : path.basename(found.source)} (not shown).`);
    else if (process.stdin.isTTY) {
      log("A Supabase SECRET key is needed to create the bucket and add files. It is read once, only shown as *, sent only to your own");
      log(`Supabase project, and never saved. ${WHERE_IS_THE_KEY}`);
      raw = await askHidden("Paste the secret key and press Return: ");
    } else {
      throw new Problem(`No secret key. Set SUPABASE_SECRET_KEY (environment or .env.local), or run this in a terminal to be asked. ${WHERE_IS_THE_KEY}`);
    }
    key = classifyKey(raw);
    if (!key.ok) throw new Problem(`${KEY_PROBLEM[key.reason]} ${WHERE_IS_THE_KEY}`);
    client = makeClient({ base: origin, headers: key.headers, key: key.key, backoff: backoffFromEnv() });
    redactAll = client.redact;
    if (!opts.yes) {
      if (!process.stdin.isTTY) throw new Problem("Add --yes to run without a keyboard (nothing is asked and nothing was sent).");
      log();
      if (!(await confirm(`Upload ${files.length} files (${mb(total)}) to ${new URL(origin).host}, bucket ${manifest.bucket}? Type yes to continue: `))) {
        log("Stopped. Nothing was sent.");
        return 1;
      }
    }
    log();
    await ensureBucket(client, manifest, log);
  } else {
    client = makeClient({ base: origin, headers: {}, key: "", backoff: backoffFromEnv() });
  }

  const bytesFor = async (entry) => {
    try {
      const buffer = readFileSync(localFile(from, entry));
      if (sha256(buffer) === entry.sha256) return buffer;
    } catch { /* fall through to the website */ }
    if (!opts.fromUrl) throw new Problem(`${entry.path} changed on disk while uploading.`);
    const res = await client.send(`${opts.fromUrl.replace(/\/+$/, "")}/${encodePath(entry.path)}`, { headers: { "user-agent": USER_AGENT } }, { timeoutMs: 120000 });
    if (!res.ok) throw new Problem(`${entry.path}: the live site answered ${res.status}`);
    const buffer = Buffer.from(await res.arrayBuffer());
    if (sha256(buffer) !== entry.sha256) throw new Problem(`${entry.path}: the live site has a different version than the list`);
    return buffer;
  };
  const ctx = { client, opts, manifest, publicBase, bytesFor };

  // 3. upload
  const tally = { uploaded: 0, there: 0, differs: 0, failed: 0 };
  const problems = [];
  if (!opts.verifyOnly) {
    log(`Uploading ${files.length} files, ${opts.concurrency} at a time ...`);
    let done = 0;
    await pool(files, opts.concurrency, async (entry) => {
      let outcome;
      try { outcome = await uploadOne(entry, ctx); } catch (error) { outcome = { status: "failed", reason: error instanceof Problem ? error.message : String(error?.message || error) }; }
      tally[outcome.status]++;
      done++;
      const label = { uploaded: "uploaded", there: "already there", differs: "DIFFERENT", failed: "FAILED" }[outcome.status];
      if (outcome.status === "differs" || outcome.status === "failed") problems.push(`${entry.path}: ${client.redact(outcome.reason)}`);
      log(`  [${String(done).padStart(String(files.length).length)}/${files.length}] ${label.padEnd(13)} ${entry.path} (${mb(entry.bytes)})`);
    });
    log();
    log(`Upload finished: ${tally.uploaded} uploaded, ${tally.there} already there, ${tally.differs} different, ${tally.failed} failed.`);
    log();
  }

  // 4. check the public addresses
  let checked = 0;
  if (!opts.noVerify) {
    log(`Checking ${files.length} public addresses${opts.deep ? " (full download of each file)" : ""} ...`);
    let done = 0;
    await pool(files, opts.concurrency, async (entry) => {
      let found;
      try { found = await checkOne(entry, ctx); } catch (error) { found = [error instanceof Problem ? error.message : String(error?.message || error)]; }
      done++;
      if (found.length) for (const why of found) problems.push(`${entry.path}: ${client.redact(why)}`);
      else checked++;
      if (found.length || done % 25 === 0 || done === files.length) log(`  [${String(done).padStart(String(files.length).length)}/${files.length}] ${found.length ? `PROBLEM ${entry.path}` : "ok so far"}`);
    });
    log();
    log(`Public check: ${checked} of ${files.length} files are fine.`);
  }

  // 5. result
  log();
  if (problems.length) {
    log(`${problems.length} problem${problems.length === 1 ? "" : "s"}:`);
    for (const line of problems.slice(0, 40)) log(`  - ${line}`);
    if (problems.length > 40) log(`  ... and ${problems.length - 40} more`);
    log();
    log("Nothing was deleted. Fix the cause and run the same command again: files that are already there are skipped.");
    return 1;
  }
  log("All done: every file is in the bucket and answers correctly.");
  log();
  log("Last step: add this one setting in Vercel (your project > Settings > Environment Variables, for Production), then redeploy:");
  log(`  NEXT_PUBLIC_MEDIA_BASE_URL=${publicBase}`);
  log("To go back to files served by the website itself, remove that setting and redeploy. The files stay in the project either way.");
  return 0;
}

/** Set once a key is known, so even an unexpected error cannot print it. */
let redactAll = (text) => String(text);
const backoffFromEnv = () => (process.env.BSAH_UPLOAD_BACKOFF_MS ? [Number(process.env.BSAH_UPLOAD_BACKOFF_MS)] : undefined);

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().then(
    (code) => { process.exitCode = code; },
    (error) => {
      process.stderr.write(`\n${redactAll(error instanceof Problem ? error.message : `Unexpected error: ${error?.stack || error}`)}\n`);
      process.exitCode = 1;
    },
  );
}
