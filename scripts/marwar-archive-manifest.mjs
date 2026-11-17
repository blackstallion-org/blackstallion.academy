#!/usr/bin/env node
/**
 * Marwar archive, step 3: write british-archive/manifest.json and README.md from lib/content/history/marwar-archive.ts,
 * re-hashing every master so the manifest proves the files are the ones the page credits.
 *
 * Usage: node scripts/marwar-archive-manifest.mjs   (Node ≥ 23: imports the .ts data file with type stripping)
 */
import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { archive, archiveGaps, reconstructions } from "../lib/content/history/marwar-archive.ts";

const ROOT = path.resolve(import.meta.dirname, "..");
const ARC = path.join(ROOT, "output/imagegen/marwar-story/british-archive");

const items = [];
let failures = 0;
for (const a of archive) {
  const master = path.join(ARC, "masters", a.master);
  const sha1 = existsSync(master) ? createHash("sha1").update(await readFile(master)).digest("hex") : null;
  const ok = sha1 === a.sha1;
  if (!ok) failures++;
  items.push({
    id: a.id,
    plate: a.plate,
    kind: a.kind,
    title: a.title,
    catalogued: a.catalogued,
    date: a.date,
    dateNote: a.dateNote ?? null,
    creator: a.creator,
    holder: a.holder,
    reference: a.reference,
    identification: a.identification ?? null,
    licence: a.licence,
    credit: a.credit,
    source: a.source,
    record: a.record ?? null,
    chapter: a.chapter,
    shownOnPage: a.show !== false,
    files: {
      master: `masters/${a.master}`,
      web: `web/${a.master.replace(/\.jpe?g$/i, ".webp")}`,
      site: `public/images/history/marwar/archive/${a.id}.webp`,
    },
    size: { width: a.width, height: a.height },
    sha1: a.sha1,
    sha1Verified: ok,
    alt: a.alt,
  });
}

const manifest = {
  title: "Marwar: The Horse, the Crown & the Empire. Archive manifest",
  generated: new Date().toLocaleDateString("en-CA"),
  page: "/history/marwar",
  note: "Genuine photographs and period paintings only. Generated illustrations and films are listed separately under reconstructions and are never presented as records.",
  items,
  reconstructions,
  gaps: archiveGaps,
  notUsed: [
    { file: "masters/012-sardar-singh-jodhpur-1896.jpg", reason: "532 px; Commons source is a blog repost, not an institution." },
    { file: "masters/013-jaswant-singh-ii-jodhpur-1877.jpg", reason: "Low-resolution duplicate of plate 101 (Rijksmuseum CC0 scan used instead)." },
    { file: "masters/014-four-maharajas-umaid-singh-delhi-1921.jpg", reason: "Scan of a Royal Collection Trust print (RCIN 2702333); the Trust's reproduction terms should be confirmed before use." },
  ],
};

await writeFile(path.join(ARC, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);

const row = (i) => `| ${String(i.plate).padStart(2, "0")} | ${i.kind} | ${i.title} | ${i.date} | ${i.creator} | ${i.holder}, ${i.reference} | ${i.licence} | [Commons](${i.source}) |`;
const readme = `# Marwar archive (British-era photographs and period paintings)

Used on \`/history/marwar\`. Generated ${manifest.generated} by \`scripts/marwar-archive-manifest.mjs\` from
\`lib/content/history/marwar-archive.ts\`. Do not edit by hand.

- \`masters/\` original downloads, byte-identical to the Wikimedia Commons files (SHA-1 in manifest.json).
- \`web/\` optimized WebP: long edge ≤ 2400 px, greyscale, gentle contrast and a light static grain (paintings keep colour).
- Runtime copies: \`public/images/history/marwar/archive/<id>.webp\`.

| Plate | Kind | Title | Date | Creator | Holder / ref | Licence | Source |
| --- | --- | --- | --- | --- | --- | --- | --- |
${items.sort((a, b) => a.plate - b.plate).map(row).join("\n")}

## Reconstructions (not records)

${reconstructions.map((r) => `- ${r.title}: ${r.made}`).join("\n")}

## Gaps

${archiveGaps.map((g) => `- ${g}`).join("\n")}

## Downloaded but not used

${manifest.notUsed.map((n) => `- \`${n.file}\`: ${n.reason}`).join("\n")}
`;
await writeFile(path.join(ARC, "README.md"), readme);

console.log(`${items.length} items, ${failures} hash failures`);
if (failures) process.exit(1);
