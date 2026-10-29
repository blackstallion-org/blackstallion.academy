// The home page opening (two ink horses, then the line) and the running-horse loader.
// The head script that decides what a first visit shows is run for real against a stand-in browser; the pictures are checked for
// size and for how they sit together; the component rules (skip, focus, ordering, reading the switches) are checked in the source.
// Does NOT prove how it looks or runs on a device: that is checked in a browser (see PROGRESS.md). Run with `npm test`.
import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync, statSync } from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { loadTs, root } from "./helpers/load-ts.mjs";

const { buildLoaderBootScript, LOADER_SESSION_KEY } = await loadTs("lib/opening/boot.ts");
const read = (rel) => readFileSync(path.join(root, rel), "utf8");

/** Runs the head script in a stand-in browser and reports what it did. */
function visit({ path: pathname = "/", search = "", seen = false, reduced = false, horse = "silhouette", opening = true } = {}) {
  const dataset = {};
  const links = [];
  const timers = [];
  const events = [];
  const store = new Map(seen ? [[LOADER_SESSION_KEY, "1"]] : []);
  const sandbox = {
    document: { documentElement: { dataset }, createElement: () => ({}), head: { appendChild: (link) => links.push({ href: link.href, as: link.as, rel: link.rel }) } },
    sessionStorage: { getItem: (k) => store.get(k) ?? null, removeItem: (k) => store.delete(k), setItem: (k, v) => store.set(k, v) },
    matchMedia: () => ({ matches: reduced }),
    location: { search, pathname },
    setTimeout: (fn, ms) => timers.push({ fn, ms }),
    dispatchEvent: (e) => events.push(e.type),
    Event: class { constructor(type) { this.type = type; } },
  };
  vm.runInNewContext(buildLoaderBootScript({ sessionKey: LOADER_SESSION_KEY, horse, opening }), sandbox);
  return { dataset, links, timers, events, store };
}

// ------------------------------------------------------------------ what a visit shows

test("first visit to the home page: loader with the running horse, and the opening, with their pictures requested at once", () => {
  const v = visit();
  assert.equal(v.dataset.bsahOpening, "1");
  assert.equal(v.dataset.bsahLoaded, undefined);
  assert.deepEqual(v.links.map((l) => [l.href, l.as, l.rel]), [["/opening/loader.gif", "image", "preload"], ["/opening/ink-1.webp", "image", "preload"]]);
});

test("the opening never holds the page for ever: a last-resort timer clears the flag and says so", () => {
  const v = visit();
  assert.deepEqual(v.timers.map((t) => t.ms), [12000]);
  v.timers[0].fn();
  assert.equal(v.dataset.bsahOpening, undefined);
  assert.deepEqual(v.events, ["bsah:opening-done"]);
  v.timers[0].fn(); // already cleared: a second tick says nothing
  assert.deepEqual(v.events, ["bsah:opening-done"]);
});

test("first visit to any other page: the loader, not the opening", () => {
  const v = visit({ path: "/legend" });
  assert.equal(v.dataset.bsahOpening, undefined);
  assert.equal(v.dataset.bsahLoaded, undefined);
  assert.deepEqual(v.links.map((l) => l.href), ["/opening/loader.gif"]);
  assert.equal(v.timers.length, 0);
});

test("a visit later in the same session, reduced motion, and ?noload show neither", () => {
  for (const options of [{ seen: true }, { reduced: true }, { search: "?noload" }]) {
    const v = visit(options);
    assert.equal(v.dataset.bsahLoaded, "1", JSON.stringify(options));
    assert.equal(v.dataset.bsahOpening, undefined, JSON.stringify(options));
    assert.deepEqual(v.links, [], JSON.stringify(options));
  }
});

test("?opening on the home page forgets the session and plays it all again, but never against reduced motion or ?noload", () => {
  const again = visit({ seen: true, search: "?opening" });
  assert.equal(again.dataset.bsahOpening, "1");
  assert.equal(again.dataset.bsahLoaded, undefined);
  assert.equal(visit({ seen: true, search: "?a=1&opening" }).dataset.bsahOpening, "1");
  assert.equal(visit({ seen: true, search: "?opening=1" }).dataset.bsahOpening, "1");
  assert.equal(visit({ seen: true, search: "?openings" }).dataset.bsahOpening, undefined, "only the exact word");
  assert.equal(visit({ seen: true, search: "?utm_term=opening-hours" }).dataset.bsahOpening, undefined);
  assert.equal(visit({ seen: true, reduced: true, search: "?opening" }).dataset.bsahOpening, undefined, "reduced motion always wins");
  assert.equal(visit({ seen: true, search: "?opening&noload" }).dataset.bsahOpening, undefined, "?noload always wins");
});

test("the switches: no opening when it is off, and the earlier pixel horse when asked for", () => {
  const off = visit({ opening: false });
  assert.equal(off.dataset.bsahOpening, undefined);
  assert.deepEqual(off.links.map((l) => l.href), ["/opening/loader.gif"]);
  assert.equal(visit({ opening: false, seen: true, search: "?opening" }).dataset.bsahLoaded, "1", "?opening does nothing when it is off");
  const pixel = visit({ horse: "pixel" });
  assert.deepEqual(pixel.links[0], { href: "/animations/pixel-horse.js", as: "script", rel: "preload" });
  assert.ok(!pixel.links.some((l) => l.href.includes("loader.gif")));
});

test("both switches read their environment variables, and default to on", async () => {
  const saved = { o: process.env.NEXT_PUBLIC_OPENING, h: process.env.NEXT_PUBLIC_LOADER_HORSE };
  try {
    delete process.env.NEXT_PUBLIC_OPENING; delete process.env.NEXT_PUBLIC_LOADER_HORSE;
    let c = await loadTs("lib/opening/config.ts");
    assert.deepEqual([c.OPENING_ENABLED, c.LOADER_HORSE], [true, "silhouette"]);
    process.env.NEXT_PUBLIC_OPENING = "off"; process.env.NEXT_PUBLIC_LOADER_HORSE = "pixel";
    c = await loadTs("lib/opening/config.ts");
    assert.deepEqual([c.OPENING_ENABLED, c.LOADER_HORSE], [false, "pixel"]);
    process.env.NEXT_PUBLIC_OPENING = "on"; process.env.NEXT_PUBLIC_LOADER_HORSE = "anything else";
    c = await loadTs("lib/opening/config.ts");
    assert.deepEqual([c.OPENING_ENABLED, c.LOADER_HORSE], [true, "silhouette"], "only the exact words switch them");
  } finally {
    for (const [k, v] of [["NEXT_PUBLIC_OPENING", saved.o], ["NEXT_PUBLIC_LOADER_HORSE", saved.h]]) { if (v === undefined) delete process.env[k]; else process.env[k] = v; }
  }
});

// ------------------------------------------------------------------ the pictures

test("the three pictures are the supplied files, untouched, and small enough to load with the page", () => {
  const sha = (rel) => createHash("sha256").update(readFileSync(path.join(root, rel))).digest("hex");
  // the sizes and fingerprints of the files as supplied on 30 Oct 2026
  assert.equal(statSync(path.join(root, "public/opening/ink-1.webp")).size, 30666);
  assert.equal(statSync(path.join(root, "public/opening/ink-2.webp")).size, 31404);
  assert.equal(statSync(path.join(root, "public/opening/loader.gif")).size, 348453);
  assert.equal(readFileSync(path.join(root, "public/opening/loader.gif")).subarray(0, 6).toString("ascii"), "GIF89a");
  assert.notEqual(sha("public/opening/ink-1.webp"), sha("public/opening/ink-2.webp"));
  for (const n of [1, 2]) {
    const b = readFileSync(path.join(root, `public/opening/ink-${n}.webp`));
    assert.equal(b.toString("ascii", 0, 4) + b.toString("ascii", 8, 12), "RIFFWEBP");
  }
});

// ------------------------------------------------------------------ the component rules

test("the opening: a labelled dialog, Skip, Escape and click, focus kept on Skip, under the loader, only on the home page", () => {
  const tsx = read("components/motion/OpeningFilm.tsx");
  const css = read("components/motion/OpeningFilm.module.css");
  assert.match(tsx, /role="dialog"/);
  assert.match(tsx, /aria-modal="true"/);
  assert.match(tsx, /Skip opening/);
  assert.match(tsx, /event\.key === "Escape"/);
  assert.match(tsx, /event\.key === "Tab"/, "Tab is held on Skip");
  assert.match(tsx, /onClick=\{leave\}/, "a click anywhere ends it");
  assert.match(tsx, /pathname !== "\/"/, "home page only");
  assert.match(tsx, /OPENING_ENABLED/);
  assert.match(css, /z-index: 99/);
  assert.match(read("components/motion/Loader.module.css"), /z-index: 100/, "the loader is above the opening");
  assert.match(css, /prefers-reduced-motion: reduce\) \{\s*\.root \{ display: none; \}/, "hidden for reduced motion even if a script misfires");
  assert.match(css, /lastResort 16s step-end/, "an overlay that cannot stay for ever, whatever fails");
  assert.doesNotMatch(tsx, /<audio|new Audio|autoPlay|autoplay/i, "silent");
  assert.doesNotMatch(css, /top:\s*0[^;]*;[^}]*skip/i);
});

test("the opening's own words are the site's: the project's big idea, backed by the claims ledger, set in the site's two voices", () => {
  assert.match(read("CLAUDE.md"), /An 800-year lineage, handed to your child\./, "the big idea, word for word");
  assert.match(read("docs/BLUEPRINT.md"), /800-year story/, "the blueprint's third truth");
  assert.match(read("docs/BLUEPRINT.md"), /Rathores expelled from Kannauj in 1193[^|]*\| Supported \| Yes/, "and the supported claim under it: 1193 to now is more than 800 years");
  const tsx = read("components/motion/OpeningFilm.tsx");
  assert.match(tsx, /t-inscribe[^>]*>An 800-year lineage,</);
  assert.doesNotMatch(tsx, /plate|cut-out|horseBox|strip/i, "the supplied pictures are shown as they are, not rebuilt");
  assert.match(tsx, /t-voice[^>]*>handed to your child\.</);
});

test("the loader waits for the opening's pictures and says when it is gone; the hero film waits for the opening", () => {
  const loader = read("components/motion/Loader.tsx");
  assert.match(loader, /bsah:opening-ready/);
  assert.match(loader, /bsah:loader-gone/);
  assert.match(loader, /setTimeout\(settle, 3500\)/, "the 3.5 s deadline still ends the loader whatever the opening does");
  assert.match(loader, /LOADER_HORSE === "pixel"/);
  const hero = read("components/sections/home/HeroFilm.tsx");
  assert.match(hero, /bsah:opening-done/);
  assert.match(hero, /holding\(\)/);
  assert.match(hero, /!holding\(\) && video\.readyState < 2/, "waiting for the opening is not mistaken for a stalled film");
});

test("the head script comes from a plain module (not a client component) and the opening is mounted once, next to the loader", () => {
  const layout = read("app/layout.tsx");
  assert.match(layout, /import \{ loaderBootScript \} from "@\/lib\/opening\/boot"/);
  assert.doesNotMatch(read("components/motion/Loader.tsx"), /export const loaderBootScript/);
  assert.equal([...layout.matchAll(/<OpeningFilm \/>/g)].length, 1);
  assert.ok(layout.indexOf("<Loader />") < layout.indexOf("<OpeningFilm />"));
});
