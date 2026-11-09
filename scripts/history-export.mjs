// Exports docs/history-scrolls/STORY_DATA.json and STORYBOARDS.md from lib/content/history and the ledger.
// Usage: node --experimental-strip-types --no-warnings scripts/history-export.mjs
import { writeFileSync } from "node:fs";
import { india } from "../lib/content/history/india.ts";
import { world } from "../lib/content/history/world.ts";
import { lakshmibai } from "../lib/content/history/lakshmibai.ts";
import { alexander } from "../lib/content/history/alexander.ts";
const pages = [india, world, lakshmibai, alexander];
const words = (t) => t.join(" ").split(/\s+/).length;
writeFileSync("docs/history-scrolls/STORY_DATA.json", JSON.stringify({ generatedFrom: "lib/content/history/*.ts", pages }, null, 2) + "\n");
for (const p of pages) for (const c of p.chapters) for (const s of c.scenes) console.log(p.route, s.id, words(s.body));
import { readFileSync } from "node:fs";
const ledger = JSON.parse(readFileSync("docs/history-scrolls/ASSET_LEDGER.json", "utf8")).assets;
const A = (id) => ledger.find((a) => a.id === id);
const desc = (id) => { const p = A(id).prompt; const m = p.match(/(?:Background plate|subject on a fully transparent background|Foreground strip on a fully transparent background|Opening plate): (.*?)\.( The complete| Wide landscape| running across| No text|$)/); return m ? m[1] : p; };
const place = (b) => b ? `${b.x ? `left ${b.x}` : `right ${b.r}`}, foot ${b.b}, width ${b.w}` : "";
let md = `# Storyboards: layer by layer\n\nGenerated from \`lib/content/history/*.ts\` and \`ASSET_LEDGER.json\` (do not edit by hand; re-run the export).\n\nEvery scene is the same stack, bottom to top: surface ivory + SH01 grain · **B** background plate (scroll parallax −2% → +2% of its height) · optional relief · **S** separate subject (−0.5% → +0.5%) · **F** foreground crossing the join into the next scene (+3% → −3%) · HTML reading surface · chapter controls. Reduced motion and reading mode: all layers still, normal flow.\n\n`;
for (const p of pages) {
  md += `## ${p.route} (${p.format})\n\n`;
  if (p.opening.asset) md += `**${p.opening.asset} · opening plate** — ${desc(p.opening.asset)}. Framed in a gold, ivory and vermilion rule under the title card.\n\n`;
  for (const c of p.chapters) {
    if (p.format === "personal") md += `### Chapter ${c.numeral} · ${c.title}\n\n`;
    for (const s of c.scenes) {
      md += `#### ${s.id} · ${s.title}  \n*${s.label}*${s.interpretation ? " · artistic interpretation" : ""}${s.relief ? ` · relief ${s.relief}` : ""}\n\n`;
      md += `| Layer | Asset | Content | Placement (desktop / phone) | Status |\n|---|---|---|---|---|\n`;
      md += `| B | ${s.layers.B} | ${desc(s.layers.B)} | full bleed, cover, focal ${A(s.layers.B).focal} | ${A(s.layers.B).status} |\n`;
      if (s.relief) md += `| Relief | ${s.relief} | see artifacts/history-scrolls/3d/RELIEFS.md | ${s.relief === "AL04" ? "framed map, top-left of the stage" : "the B plate itself on a displaced mesh, full B box"} | ${s.relief === "AL04" ? "built" : A(s.layers.B).status === "accepted" ? "built" : "waits for B"} |\n`;
      md += `| S | ${s.layers.S} | ${desc(s.layers.S)} | ${place(s.subject.d)} / ${place(s.subject.m)} | ${A(s.layers.S).status} |\n`;
      md += `| F | ${s.layers.F} | ${desc(s.layers.F)} | full width, bottom; crosses the join on desktop anthology | ${A(s.layers.F).status} |\n`;
      md += `| Text | — | reading surface on the ${s.side} (desktop); below the art (phone) | ${s.body.join(" ").split(/\s+/).length} words | — |\n\n`;
      if (s.qualification) md += `> ${s.qualification}\n\n`;
    }
  }
}
writeFileSync("docs/history-scrolls/STORYBOARDS.md", md);
