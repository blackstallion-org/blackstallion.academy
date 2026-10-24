// Which files under public/ can the site request? Read from the real syntax tree of app/, components/ and lib/, so
// comments and page text never count. Shared by scripts/media-manifest.mjs and tests/media-manifest.test.mjs.
import { readdirSync, readFileSync, lstatSync, statSync } from "node:fs";
import path from "node:path";
import ts from "typescript";
import { MEDIA_PREFIXES } from "../../lib/content/media-base.mjs";

export const MEDIA_DIRS = MEDIA_PREFIXES.map((prefix) => prefix.replaceAll("/", ""));
const SOURCE_DIRS = ["app", "components", "lib"];

/** What each extension is served as. A file with any other extension is never uploaded. */
export const CONTENT_TYPES = {
  ".webp": "image/webp", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".avif": "image/avif",
  ".gif": "image/gif", ".svg": "image/svg+xml",
  ".mp4": "video/mp4", ".webm": "video/webm",
  ".mp3": "audio/mpeg", ".wav": "audio/wav", ".ogg": "audio/ogg",
  ".glb": "model/gltf-binary",
};

const walk = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return entry.name === "node_modules" ? [] : walk(full);
    return [full];
  });

const startsWithMediaPrefix = (text) => MEDIA_PREFIXES.some((prefix) => text.startsWith(prefix));

/** The shipped copy of a PNG/JPEG still in /media is its WebP twin (lib/content/media.ts → shippedFile). */
export const shippedTwin = (p) => p.replace(/^(\/media\/[^/]+)\.(png|jpe?g)$/i, "$1.webp");

/**
 * Every media path the code can name. `exact` maps "/images/a.webp" to the files that name it; `patterns` maps
 * "/images/matrix/*-thumb.webp" (a template literal with ${...} holes) to the same.
 */
export function collectMediaRefs(root) {
  const exact = new Map();
  const patterns = new Map();
  const add = (map, key, file) => map.set(key, (map.get(key) ?? new Set()).add(file));
  for (const dir of SOURCE_DIRS) {
    let sources;
    try { sources = walk(path.join(root, dir)); } catch { continue; } // a project without this folder
    for (const file of sources.filter((f) => /\.(ts|tsx)$/.test(f))) {
      const rel = path.relative(root, file).split(path.sep).join("/");
      const kind = file.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
      const source = ts.createSourceFile(file, readFileSync(file, "utf8"), ts.ScriptTarget.Latest, true, kind);
      const visit = (node) => {
        if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
          if (startsWithMediaPrefix(node.text)) add(exact, node.text, rel);
        } else if (ts.isTemplateExpression(node) && startsWithMediaPrefix(node.head.text)) {
          // `/media/${file}` inside the m() helper of lib/content/media.ts would match every file in /media; the m("...") calls
          // below name the real files one by one.
          const isHelper = rel === "lib/content/media.ts" && node.head.text === "/media/" && node.templateSpans.length === 1 && node.templateSpans[0].literal.text === "";
          if (!isHelper) add(patterns, node.head.text + node.templateSpans.map((span) => `*${span.literal.text}`).join(""), rel);
        } else if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === "m" && rel === "lib/content/media.ts") {
          const first = node.arguments[0];
          if (first && ts.isStringLiteral(first)) {
            add(exact, `/media/${first.text}`, rel);
            add(exact, shippedTwin(`/media/${first.text}`), rel);
          }
        }
        ts.forEachChild(node, visit);
      };
      visit(source);
    }
  }
  return { exact, patterns };
}

export const globToRegExp = (glob) => new RegExp(`^${glob.split("*").map((part) => part.replace(/[.+?^${}()|[\]\\]/g, "\\$&")).join("[^/]*")}$`);

/**
 * Files in the five media folders, with extension and size. A symlink to a file (video/cadets-desert-loop.mp4 points at
 * the long "Firefly ..." clip) is listed under its own name with the target's size, so the bucket answers on that name too.
 */
export function listPublicMedia(root) {
  const files = [];
  for (const dir of MEDIA_DIRS) {
    const base = path.join(root, "public", dir);
    let entries;
    try { entries = walk(base); } catch { continue; }
    for (const full of entries) {
      const link = lstatSync(full).isSymbolicLink();
      let stat;
      try { stat = statSync(full); } catch { continue; } // a dangling link
      if (!stat.isFile()) continue;
      const web = `/${path.relative(path.join(root, "public"), full).split(path.sep).join("/")}`;
      files.push({ web, full, bytes: stat.size, ext: path.extname(web).toLowerCase(), link });
    }
  }
  return files.sort((a, b) => a.web.localeCompare(b.web));
}

/**
 * Splits the media folders into files the site can request (`served`) and the rest (`unserved`), and lists references
 * that match no file (`absent`). A file is served if the code names it or a template matches it, except the PNG/JPEG masters
 * in /media whose WebP twin exists (see below).
 */
export function classifyMedia(root) {
  const { exact, patterns } = collectMediaRefs(root);
  const files = listPublicMedia(root);
  const byPath = new Set(files.map((f) => f.web));
  const regexes = [...patterns.keys()].map((glob) => ({ glob, re: globToRegExp(glob) }));
  const served = [];
  const unserved = [];
  const namedButNotUploadable = []; // the code asks for it, but its file type is not one the bucket serves
  for (const file of files) {
    const named = exact.has(file.web) || regexes.some(({ re }) => re.test(file.web));
    // A PNG/JPEG in /media that has a WebP twin is a git-ignored master (it exists only on the owner's Mac). The site ships and
    // requests the twin, so the list is the same on every computer whether or not the masters are present.
    const master = shippedTwin(file.web) !== file.web && byPath.has(shippedTwin(file.web));
    if (named && !master && !CONTENT_TYPES[file.ext]) namedButNotUploadable.push(file.web);
    (named && !master && CONTENT_TYPES[file.ext] ? served : unserved).push(file);
  }
  const absent = [...exact.keys()].filter((p) => !byPath.has(p)).sort();
  const unmatchedPatterns = regexes.filter(({ re }) => !files.some((f) => re.test(f.web))).map(({ glob }) => glob);
  return { served, unserved, absent, unmatchedPatterns, namedButNotUploadable, exact, patterns };
}
