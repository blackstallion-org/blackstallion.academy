#!/usr/bin/env node
/**
 * Marwar archive, step 1: provenance.
 *
 * - Hashes every master in output/imagegen/marwar-story/british-archive/masters and looks it up on Wikimedia Commons by
 *   SHA-1, so each photograph is tied to the exact file page it came from.
 * - Downloads the additional public-domain / CC0 items listed in ADDITIONS (only if missing) and checks their SHA-1.
 * - Writes the raw Commons metadata to british-archive/commons-metadata.json for the curated manifest.
 *
 * Usage: node scripts/marwar-archive-fetch.mjs
 */
import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const ARCHIVE = path.join(ROOT, "output/imagegen/marwar-story/british-archive");
const MASTERS = path.join(ARCHIVE, "masters");
const API = "https://commons.wikimedia.org/w/api.php";
const UA = "BSAH-archive-research/1.0 (history page credits)";

const ADDITIONS = [
  { file: "101-jaswant-singh-ii-bourne-shepherd-c1877.jpg", title: "File:Portret van Jaswant Singh II H.H. the Maharaja of Jodhpur, G.C.S.I. (titel op object), RP-F-2001-7-1124-18.jpg" },
  { file: "102-mehrangarh-fort-boeck-1903.jpg", title: "File:Kurt boeck indien nepal 139.jpg" },
  { file: "103-jodhpur-state-elephant-boeck-1903.jpg", title: "File:Kurt boeck indien nepal 145.jpg" },
  { file: "104-man-singh-mahamandir-bulaki-1815.jpg", title: "File:Bulaki (attr.) Maharaja Man Singh of Jodhpur Visits the Mahamandirю 1815, Philadelphia Museum of Art.jpg" },
];

const sha1 = (buf) => createHash("sha1").update(buf).digest("hex");
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

async function api(params) {
  const url = `${API}?${new URLSearchParams({ format: "json", formatversion: "2", ...params })}`;
  for (let attempt = 0; attempt < 6; attempt++) {
    const res = await fetch(url, { headers: { "User-Agent": UA } });
    if (res.ok) return res.json();
    if (res.status !== 429 && res.status < 500) throw new Error(`${res.status} ${url}`);
    await wait(4000 * (attempt + 1));
  }
  throw new Error(`gave up ${url}`);
}

const IIPROP = { prop: "imageinfo", iiprop: "url|sha1|size|extmetadata|mime" };

function pick(info) {
  const m = info.extmetadata ?? {};
  const v = (k) => (m[k]?.value ?? "").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
  return {
    url: info.url,
    descriptionUrl: info.descriptionurl,
    sha1: info.sha1,
    width: info.width,
    height: info.height,
    mime: info.mime,
    license: v("LicenseShortName"),
    licenseUrl: v("LicenseUrl"),
    usageTerms: v("UsageTerms"),
    artist: v("Artist"),
    credit: v("Credit"),
    date: v("DateTimeOriginal"),
    objectName: v("ObjectName"),
    description: v("ImageDescription").slice(0, 600),
    categories: v("Categories"),
  };
}

async function byTitle(title) {
  const j = await api({ action: "query", titles: title, ...IIPROP });
  const page = j.query.pages[0];
  if (!page.imageinfo) throw new Error(`No imageinfo for ${title}`);
  return { title: page.title, ...pick(page.imageinfo[0]) };
}

async function bySha1(hash) {
  const j = await api({ action: "query", list: "allimages", aisha1: hash, ailimit: "5" });
  const hit = j.query.allimages?.[0];
  return hit ? byTitle(hit.title) : null;
}

const out = {};
for (const a of ADDITIONS) {
  const dest = path.join(MASTERS, a.file);
  const meta = await byTitle(a.title);
  if (!existsSync(dest)) {
    const res = await fetch(meta.url, { headers: { "User-Agent": UA } });
    if (!res.ok) throw new Error(`download ${res.status} ${meta.url}`);
    await writeFile(dest, Buffer.from(await res.arrayBuffer()));
    console.log("downloaded", a.file);
    await wait(800);
  }
}

for (const file of (await readdir(MASTERS)).filter((f) => /\.(jpe?g|png|tif)$/i.test(f)).sort()) {
  const hash = sha1(await readFile(path.join(MASTERS, file)));
  const addition = ADDITIONS.find((a) => a.file === file);
  const meta = addition ? await byTitle(addition.title) : await bySha1(hash);
  out[file] = { localSha1: hash, match: meta ? meta.sha1 === hash : false, commons: meta };
  console.log(file, meta ? (meta.sha1 === hash ? "MATCH" : "HASH DIFFERS") : "NOT FOUND", meta?.title ?? "");
  await wait(2500);
}

await writeFile(path.join(ARCHIVE, "commons-metadata.json"), `${JSON.stringify(out, null, 2)}\n`);
console.log("wrote commons-metadata.json");
