// The running-rider loader (first load, reloads and page changes). The horse-zoom opening that used to follow it was removed on
// 7 Nov 2026: the first-visit opening is the intro film (tests/intro.test.mjs).
// The head script that decides what a first visit shows is run for real against a stand-in browser; the picture is checked for
// being the supplied file, untouched; the component rules (no zoom, the switch) are checked in the source.
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
function visit({ search = "", seen = false, reduced = false, horse = "silhouette" } = {}) {
  const dataset = {};
  const links = [];
  const store = new Map(seen ? [[LOADER_SESSION_KEY, "1"]] : []);
  const sandbox = {
    document: { documentElement: { dataset }, createElement: () => ({}), head: { appendChild: (link) => links.push({ href: link.href, as: link.as, rel: link.rel }) } },
    sessionStorage: { getItem: (k) => store.get(k) ?? null, removeItem: (k) => store.delete(k), setItem: (k, v) => store.set(k, v) },
    matchMedia: () => ({ matches: reduced }),
    location: { search },
  };
  vm.runInNewContext(buildLoaderBootScript({ sessionKey: LOADER_SESSION_KEY, horse }), sandbox);
  return { dataset, links, store };
}

// ------------------------------------------------------------------ what a visit shows

test("first visit: the loader shows, and the running-rider picture is requested at once", () => {
  const v = visit();
  assert.equal(v.dataset.bsahLoaded, undefined);
  assert.deepEqual(v.links.map((l) => [l.href, l.as, l.rel]), [["/opening/loader-marwari.webp", "image", "preload"]]);
});

test("a visit later in the same session, reduced motion, and ?noload show neither the loader nor the opening", () => {
  for (const options of [{ seen: true }, { reduced: true }, { search: "?noload" }]) {
    const v = visit(options);
    assert.equal(v.dataset.bsahLoaded, "1", JSON.stringify(options));
    assert.deepEqual(v.links, [], JSON.stringify(options));
  }
});

test("?opening no longer does anything: the zoom opening is gone", () => {
  assert.equal(visit({ seen: true, search: "?opening" }).dataset.bsahLoaded, "1");
});

test("the switch: the earlier pixel horse when asked for", () => {
  assert.deepEqual(visit().links.map((l) => l.href), ["/opening/loader-marwari.webp"]);
  const pixel = visit({ horse: "pixel" });
  assert.deepEqual(pixel.links[0], { href: "/animations/pixel-horse.js", as: "script", rel: "preload" });
  assert.ok(!pixel.links.some((l) => l.href.includes("loader-marwari")));
});

test("the loader-horse switch reads its environment variable, and defaults to the running rider", async () => {
  const saved = process.env.NEXT_PUBLIC_LOADER_HORSE;
  try {
    delete process.env.NEXT_PUBLIC_LOADER_HORSE;
    let c = await loadTs("lib/opening/config.ts");
    assert.equal(c.LOADER_HORSE, "silhouette");
    assert.equal(c.OPENING_ENABLED, undefined, "the zoom switch is gone");
    process.env.NEXT_PUBLIC_LOADER_HORSE = "pixel";
    c = await loadTs("lib/opening/config.ts");
    assert.equal(c.LOADER_HORSE, "pixel");
    process.env.NEXT_PUBLIC_LOADER_HORSE = "anything else";
    c = await loadTs("lib/opening/config.ts");
    assert.equal(c.LOADER_HORSE, "silhouette", "only the exact word switches it");
  } finally { if (saved === undefined) delete process.env.NEXT_PUBLIC_LOADER_HORSE; else process.env.NEXT_PUBLIC_LOADER_HORSE = saved; }
});

// ------------------------------------------------------------------ the picture

test("the supplied animation is kept untouched as the source of the loader; the two ink-horse pictures and the rebuilt opening are gone", () => {
  assert.equal(statSync(path.join(root, "public/opening/loader.gif")).size, 348453, "the size of the file as supplied on 30 Oct 2026");
  assert.equal(readFileSync(path.join(root, "public/opening/loader.gif")).subarray(0, 6).toString("ascii"), "GIF89a");
  for (const gone of ["public/opening/ink-1.webp", "public/opening/ink-2.webp", "components/motion/OpeningFilm.tsx", "components/motion/OpeningFilm.module.css"]) {
    assert.ok(!existsSync(path.join(root, gone)), `${gone} was deleted`);
  }
  // 2 Nov 2026 (R31): the loader shows a derivative of it (same silhouettes, one fixed site-image fill, transparent WebP).
  // 4 Nov 2026: the silhouette is now the horse's mask, and a sequence of painted stills changes inside it.
  assert.match(read("components/motion/RunningHorse.tsx"), /maskImage: mask/);
  assert.match(read("components/motion/RunningHorse.tsx"), /url\(\$\{LOADER_IMAGE\}\)/);
  assert.equal(readFileSync(path.join(root, "public/opening/loader-marwari.webp")).subarray(8, 12).toString("ascii"), "WEBP");
});

// ------------------------------------------------------------------ the component rules

test("the loader has no zoom step: it settles, fades and goes, on the first load and on page changes alike", () => {
  const loader = read("components/motion/Loader.tsx");
  assert.doesNotMatch(loader, /zoom/i);
  assert.doesNotMatch(loader, /OPENING_ENABLED/);
  assert.match(loader, /phase: "fading" \} : current/, "settled goes straight to the fade");
  assert.match(loader, /setTimeout\(settle, 3500\)/, "the 3.5 s deadline still ends the loader whatever happens");
  assert.match(loader, /LOADER_HORSE === "pixel"/);
  assert.doesNotMatch(loader, /opening-ready|opening-done/, "no waiting between two overlays: it is one loader");
  for (const rel of ["components/motion/RunningHorse.module.css", "components/motion/Loader.module.css", "components/motion/RunningHorse.tsx"]) {
    assert.doesNotMatch(read(rel), /data-zooming|zooming|@keyframes into|@keyframes opens|scale\(22\)/, `${rel} has no zoom`);
  }
  assert.match(read("components/motion/Loader.module.css"), /z-index: 100/);
});

test("reduced motion shows no loader at all, and so no loader before the intro", () => {
  assert.match(read("lib/opening/boot.ts"), /prefers-reduced-motion: reduce/);
  assert.equal(visit({ reduced: true }).dataset.bsahLoaded, "1");
});

test("the head script comes from a plain module (not a client component); there is no separate opening overlay", () => {
  const layout = read("app/layout.tsx");
  assert.match(layout, /import \{ loaderBootScript \} from "@\/lib\/opening\/boot"/);
  assert.doesNotMatch(read("components/motion/Loader.tsx"), /export const loaderBootScript/);
  assert.doesNotMatch(layout, /OpeningFilm/);
  const hero = read("components/sections/home/HeroFilm.tsx");
  assert.match(hero, /querySelector\("\.bsah-loader"\)/, "the hero film is held while the loader is on screen");
  assert.match(hero, /bsah:loader-gone/, "and starts when the loader has gone");
  assert.match(read("components/motion/Loader.tsx"), /dispatchEvent\(new Event\("bsah:loader-gone"\)\)/);
});
