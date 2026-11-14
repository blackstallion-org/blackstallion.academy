// Navigation guards (owner's standing rules, CLAUDE.md → Navigation): one numbering for every menu, from
// lib/content/site.ts, and one whole brand lockup (crest + BLACK STALLION + ACADEMY OF HORSEMANSHIP) via <Wordmark />.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { loadTs, root } from "./helpers/load-ts.mjs";

const site = await loadTs("lib/content/site.ts");

test("menu numbers run 1..N once each across the reels and the working pages", () => {
  const items = [...site.reels, ...site.tools];
  const ns = items.map((r) => r.n).sort((a, b) => a - b);
  assert.deepEqual(ns, Array.from({ length: ns.length }, (_, i) => i + 1), "numbers repeat or skip");
  assert.equal(site.TOTAL_REELS, items.length, "TOTAL_REELS counts every numbered page");
});

test("every numbered page has one title and one address", () => {
  const items = [...site.reels, ...site.tools];
  assert.equal(new Set(items.map((r) => r.href)).size, items.length, "a page is listed twice");
  assert.equal(new Set(items.map((r) => r.title)).size, items.length, "two pages share a title");
});

test("the inline wordmark always carries its second line", async () => {
  const dir = path.join(root, "components/brand");
  const file = (await readdir(dir)).find((f) => /^Wordmark\.tsx$/.test(f));
  assert.ok(file, "components/brand/Wordmark.tsx exists");
  const src = await readFile(path.join(dir, file), "utf8");
  const inline = src.slice(src.indexOf('layout === "inline"'));
  assert.match(inline.slice(0, 1200), /Academy of Horsemanship/, "the nav lockup keeps ACADEMY OF HORSEMANSHIP");
});

test("site chrome draws the brand with <Wordmark />, never by hand", async () => {
  const dir = path.join(root, "components/site");
  for (const f of (await readdir(dir)).filter((x) => x.endsWith(".tsx"))) {
    const src = await readFile(path.join(dir, f), "utf8");
    // Visible JSX text "Black Stallion" outside attributes (aria-label, alt, title) means a hand-typed lockup.
    const visible = src.replace(/(aria-label|alt|title|label)=\{?["'`][^"'`]*["'`]\}?/g, "").match(/>\s*Black Stallion\b/gi);
    assert.equal(visible, null, `${f} types the brand name instead of using <Wordmark />`);
  }
});

test("every menu shows a numbered page with its own number and title, once per menu", () => {
  const byHref = new Map([...site.reels, ...site.tools].map((r) => [r.href, r]));
  const menus = [
    ...site.navMenus.map((m) => ({ name: `${m.label} menu`, links: m.columns.flatMap((c) => c.links) })),
    { name: "footer", links: site.footerNav },
    { name: "footer small print", links: site.legalNav },
    { name: "primaryNav", links: site.primaryNav },
  ];
  for (const { name, links } of menus) {
    const hrefs = links.map((l) => l.href);
    assert.equal(new Set(hrefs).size, hrefs.length, `${name} lists a page twice`);
    for (const l of links) {
      const page = byHref.get(l.href);
      if (page) {
        assert.equal(l.n, page.n, `${name}: ${l.href} shows number ${l.n}, not ${page.n}`);
        assert.equal(l.label, page.title, `${name}: ${l.href} is titled "${l.label}", not "${page.title}"`);
      } else {
        assert.equal(l.n, undefined, `${name}: ${l.href} is not a numbered page but carries a number`);
      }
    }
  }
});

test("menus never count their own links", async () => {
  const src = await readFile(path.join(root, "components/site/SiteNav.tsx"), "utf8");
  assert.doesNotMatch(src, /starts\[c\]\s*\+\s*k|columnStarts/, "SiteNav numbers menu links by position");
});
