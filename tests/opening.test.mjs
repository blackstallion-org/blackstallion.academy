// The home page opening (the running-rider animation, then a zoom into the horse and the website opens) and the loader that shows
// the same animation on reloads and page changes.
// The head script that decides what a first visit shows is run for real against a stand-in browser; the picture is checked for
// being the supplied file, untouched; the component rules (when the zoom happens, the switches) are checked in the source.
// Does NOT prove how it looks or runs on a device: that is checked in a browser (see PROGRESS.md). Run with `npm test`.
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { loadTs, root } from "./helpers/load-ts.mjs";

const { buildLoaderBootScript, LOADER_SESSION_KEY } = await loadTs("lib/opening/boot.ts");
const read = (rel) => readFileSync(path.join(root, rel), "utf8");

/** Runs the head script in a stand-in browser and reports what it did. */
function visit({ search = "", seen = false, reduced = false, horse = "silhouette", opening = true } = {}) {
  const dataset = {};
  const links = [];
  const store = new Map(seen ? [[LOADER_SESSION_KEY, "1"]] : []);
  const sandbox = {
    document: { documentElement: { dataset }, createElement: () => ({}), head: { appendChild: (link) => links.push({ href: link.href, as: link.as, rel: link.rel }) } },
    sessionStorage: { getItem: (k) => store.get(k) ?? null, removeItem: (k) => store.delete(k), setItem: (k, v) => store.set(k, v) },
    matchMedia: () => ({ matches: reduced }),
    location: { search },
  };
  vm.runInNewContext(buildLoaderBootScript({ sessionKey: LOADER_SESSION_KEY, horse, opening }), sandbox);
  return { dataset, links, store };
}

// ------------------------------------------------------------------ what a visit shows

test("first visit: the loader shows, and the running-rider picture is requested at once", () => {
  const v = visit();
  assert.equal(v.dataset.bsahLoaded, undefined);
  assert.deepEqual(v.links.map((l) => [l.href, l.as, l.rel]), [["/opening/loader.gif", "image", "preload"]]);
});

test("a visit later in the same session, reduced motion, and ?noload show neither the loader nor the opening", () => {
  for (const options of [{ seen: true }, { reduced: true }, { search: "?noload" }]) {
    const v = visit(options);
    assert.equal(v.dataset.bsahLoaded, "1", JSON.stringify(options));
    assert.deepEqual(v.links, [], JSON.stringify(options));
  }
});

test("?opening forgets the session and plays it all again, but never against reduced motion or ?noload", () => {
  assert.equal(visit({ seen: true, search: "?opening" }).dataset.bsahLoaded, undefined);
  assert.equal(visit({ seen: true, search: "?a=1&opening" }).dataset.bsahLoaded, undefined);
  assert.equal(visit({ seen: true, search: "?opening=1" }).dataset.bsahLoaded, undefined);
  assert.equal(visit({ seen: true, search: "?openings" }).dataset.bsahLoaded, "1", "only the exact word");
  assert.equal(visit({ seen: true, search: "?utm_term=opening-hours" }).dataset.bsahLoaded, "1");
  assert.equal(visit({ seen: true, reduced: true, search: "?opening" }).dataset.bsahLoaded, "1", "reduced motion always wins");
  assert.equal(visit({ seen: true, search: "?opening&noload" }).dataset.bsahLoaded, "1", "?noload always wins");
});

test("the switches: ?opening does nothing when the opening is off; the earlier pixel horse when asked for", () => {
  assert.equal(visit({ opening: false, seen: true, search: "?opening" }).dataset.bsahLoaded, "1");
  assert.deepEqual(visit({ opening: false }).links.map((l) => l.href), ["/opening/loader.gif"]);
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

// ------------------------------------------------------------------ the picture

test("the animation is the supplied file, untouched; the two ink-horse pictures and the rebuilt opening are gone", () => {
  assert.equal(statSync(path.join(root, "public/opening/loader.gif")).size, 348453, "the size of the file as supplied on 30 Oct 2026");
  assert.equal(readFileSync(path.join(root, "public/opening/loader.gif")).subarray(0, 6).toString("ascii"), "GIF89a");
  for (const gone of ["public/opening/ink-1.webp", "public/opening/ink-2.webp", "components/motion/OpeningFilm.tsx", "components/motion/OpeningFilm.module.css"]) {
    assert.ok(!existsSync(path.join(root, gone)), `${gone} was deleted`);
  }
  assert.match(read("components/motion/RunningHorse.tsx"), /src="\/opening\/loader\.gif"/);
});

// ------------------------------------------------------------------ the component rules

test("the zoom happens only as the last step of the first load on the home page; page changes and reloads keep the plain fade", () => {
  const loader = read("components/motion/Loader.tsx");
  assert.match(loader, /opening\.current = OPENING_ENABLED && location\.pathname === "\/"/, "home page, and only when switched on");
  assert.match(loader, /opening\.current && current\.id === 0 \? "zooming" : "fading"/, "only the first load (id 0), never a page change");
  assert.match(loader, /load\.phase !== "zooming"/);
  assert.match(loader, /setTimeout\(\(\) => setLoad\(\(current\) => \(\{ \.\.\.current, phase: "gone" \}\)\), 1350\)/, "gone just after the 1.3 s zoom");
  assert.match(loader, /setTimeout\(settle, 3500\)/, "the 3.5 s deadline still ends the loader whatever happens");
  assert.match(loader, /LOADER_HORSE === "pixel"/);
  assert.match(loader, /OPENING_ENABLED/);
  assert.doesNotMatch(loader, /opening-ready|loader-gone|opening-done/, "no waiting between two overlays any more: it is one loader");
});

test("the zoom: the horse grows into the screen while the ivory dissolves into the page", () => {
  const horse = read("components/motion/RunningHorse.module.css");
  assert.match(horse, /\.horse\[data-zooming\][\s\S]*animation: into 1\.3s/);
  assert.match(horse, /@keyframes into \{ from \{ transform: scale\(1\); \} to \{ transform: scale\(22\); \} \}/);
  const loader = read("components/motion/Loader.module.css");
  assert.match(loader, /\[data-loading-phase="zooming"\] \{ animation: opens 1\.3s/);
  assert.match(loader, /@keyframes opens \{ 0%, 30% \{ opacity: 1; \} 100% \{ opacity: 0; \} \}/);
  assert.match(loader, /z-index: 100/);
  assert.match(read("components/motion/RunningHorse.tsx"), /data-zooming=\{zooming \|\| undefined\}/);
});

test("reduced motion shows no loader at all, so never the zoom", () => {
  assert.match(read("lib/opening/boot.ts"), /prefers-reduced-motion: reduce/);
  assert.equal(visit({ reduced: true }).dataset.bsahLoaded, "1");
});

test("the head script comes from a plain module (not a client component); there is no separate opening overlay", () => {
  const layout = read("app/layout.tsx");
  assert.match(layout, /import \{ loaderBootScript \} from "@\/lib\/opening\/boot"/);
  assert.doesNotMatch(read("components/motion/Loader.tsx"), /export const loaderBootScript/);
  assert.doesNotMatch(layout, /OpeningFilm/);
  assert.doesNotMatch(read("components/sections/home/HeroFilm.tsx"), /bsah:opening|holding\(\)/, "the hero film does not wait for anything");
});
