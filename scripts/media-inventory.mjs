// Read-only media inventory: which files in public/ are referenced by the source, and how big they are.
// Deletes nothing. Writes docs/MEDIA_INVENTORY.md (summary) and output/media-inventory.json (full list).
//   usage: node scripts/media-inventory.mjs
import { readdirSync, readFileSync, statSync, writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const walk = (dir) => readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
  const p = path.join(dir, e.name);
  if (e.name === ".DS_Store") return [];
  return e.isDirectory() ? walk(p) : [p];
});
const sourceFiles = ["app", "components", "lib"].flatMap((d) => walk(path.join(root, d))).filter((f) => /\.(tsx?|css|mjs|js)$/.test(f));
const source = sourceFiles.map((f) => readFileSync(f, "utf8")).join("\n");
const sourceDecoded = (() => { try { return decodeURIComponent(source); } catch { return source; } })();

const media = walk(path.join(root, "public")).map((abs) => {
  const rel = "/" + path.relative(path.join(root, "public"), abs).split(path.sep).join("/");
  const bytes = statSync(abs).size;
  const base = path.basename(rel);
  // Referenced if the public path or its file name appears in source (covers string concatenation like `${dir}/${file}`).
  const referenced = source.includes(rel) || sourceDecoded.includes(rel) || source.includes(base) || sourceDecoded.includes(base);
  return { path: rel, bytes, referenced, ext: path.extname(rel).toLowerCase() };
});

const mb = (b) => (b / 1048576).toFixed(1);
const sum = (list) => list.reduce((a, m) => a + m.bytes, 0);
const byTop = {};
for (const m of media) {
  const top = m.path.split("/")[1] || "/";
  byTop[top] ??= { files: 0, bytes: 0, unrefFiles: 0, unrefBytes: 0 };
  byTop[top].files++; byTop[top].bytes += m.bytes;
  if (!m.referenced) { byTop[top].unrefFiles++; byTop[top].unrefBytes += m.bytes; }
}
const unref = media.filter((m) => !m.referenced).sort((a, b) => b.bytes - a.bytes);
const heavyRef = media.filter((m) => m.referenced && m.bytes > 3 * 1048576).sort((a, b) => b.bytes - a.bytes);

mkdirSync(path.join(root, "output"), { recursive: true });
writeFileSync(path.join(root, "output/media-inventory.json"), JSON.stringify({ generated: new Date().toISOString(), media }, null, 2));

const lines = [
  "# Media inventory (generated, read-only)",
  "",
  `Generated ${new Date().toISOString()} by \`node scripts/media-inventory.mjs\`. Nothing was deleted or moved.`,
  "\"Referenced\" means the file's public path or file name appears in `app/`, `components/` or `lib/`. A name match can be a false positive, so treat \"unreferenced\" as a candidate list for review, never as a delete list.",
  "",
  `Total: ${media.length} files, ${mb(sum(media))} MB. Referenced: ${media.length - unref.length} files, ${mb(sum(media) - sum(unref))} MB. Unreferenced candidates: ${unref.length} files, ${mb(sum(unref))} MB.`,
  "",
  "| Folder | Files | MB | Unreferenced files | Unreferenced MB |",
  "| --- | ---: | ---: | ---: | ---: |",
  ...Object.entries(byTop).sort((a, b) => b[1].bytes - a[1].bytes).map(([k, v]) => `| ${k} | ${v.files} | ${mb(v.bytes)} | ${v.unrefFiles} | ${mb(v.unrefBytes)} |`),
  "",
  "## Largest referenced files (over 3 MB): compression candidates",
  "",
  "| File | MB |",
  "| --- | ---: |",
  ...heavyRef.slice(0, 40).map((m) => `| \`${m.path}\` | ${mb(m.bytes)} |`),
  "",
  "## Largest unreferenced files: review before any removal (owner approval and a backup first)",
  "",
  "| File | MB |",
  "| --- | ---: |",
  ...unref.slice(0, 60).map((m) => `| \`${m.path}\` | ${mb(m.bytes)} |`),
  "",
];
writeFileSync(path.join(root, "docs/MEDIA_INVENTORY.md"), lines.join("\n"));
console.log(`media: ${media.length} files ${mb(sum(media))} MB; unreferenced ${unref.length} files ${mb(sum(unref))} MB; referenced >3MB: ${heavyRef.length}`);
