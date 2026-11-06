// The intro film's head script (lib/opening/intro-boot.ts), run for real against a stand-in browser: when the film plays, and when it does not.
// Does NOT prove how the film looks or runs: that is checked in a browser (see PROGRESS.md). Run with `npm test`.
import { test } from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import { loadTs } from "./helpers/load-ts.mjs";

const { buildIntroBootScript, INTRO_SESSION_KEY } = await loadTs("lib/opening/intro-boot.ts");
const { progressAt, timeAt, FILM_SECONDS } = await loadTs("components/worlds/core/director.ts");

function visit({ path = "/", search = "", seen = false, reduced = false, connection = {} } = {}) {
  const dataset = {};
  const styles = [];
  const store = new Map(seen ? [[INTRO_SESSION_KEY, "1"]] : []);
  const sandbox = {
    document: { documentElement: { dataset }, createElement: () => ({}), head: { appendChild: (s) => styles.push(s.textContent) } },
    sessionStorage: { getItem: (k) => store.get(k) ?? null, removeItem: (k) => store.delete(k), setItem: (k, v) => store.set(k, v) },
    matchMedia: () => ({ matches: reduced }),
    navigator: { connection },
    location: { pathname: path, search },
    setTimeout: () => 0,
    window: {},
  };
  vm.runInNewContext(buildIntroBootScript(), sandbox);
  return { dataset, styles, store };
}

test("first visit to the home page: the intro plays, the page is hidden under it, the loader is marked seen", () => {
  const v = visit();
  assert.equal(v.dataset.bsahIntro, "1");
  assert.equal(v.store.get("bsah-loaded"), "1");
  assert.equal(v.store.get(INTRO_SESSION_KEY), "1");
  assert.match(v.styles[0], /visibility:hidden/);
});

test("it plays once per session, never on other pages, never against reduced motion, data saver or a slow connection", () => {
  for (const options of [{ seen: true }, { path: "/legend" }, { path: "/worlds" }, { reduced: true }, { search: "?nointro" }, { search: "?noload" }, { connection: { saveData: true } }, { connection: { effectiveType: "2g" } }, { connection: { effectiveType: "slow-2g" } }]) {
    assert.equal(visit(options).dataset.bsahIntro, undefined, JSON.stringify(options));
  }
  assert.equal(visit({ connection: { effectiveType: "4g" } }).dataset.bsahIntro, "1");
});

test("?intro plays it again, but not against reduced motion", () => {
  assert.equal(visit({ seen: true, search: "?intro" }).dataset.bsahIntro, "1");
  assert.equal(visit({ seen: true, search: "?a=1&intro" }).dataset.bsahIntro, "1");
  assert.equal(visit({ seen: true, search: "?intro", reduced: true }).dataset.bsahIntro, undefined);
});

test("the film clock: monotonic, reaches 1 at the end, slows on each world's hero moment", () => {
  let last = -1;
  for (let t = 0; t <= FILM_SECONDS; t += 0.5) { const p = progressAt(t); assert.ok(p >= last); last = p; }
  assert.equal(progressAt(FILM_SECONDS), 1);
  assert.equal(progressAt(0), 0);
  const speed = (p) => (progressAt(timeAt(p) + 0.5) - progressAt(timeAt(p) - 0.5));
  for (const hold of [0.155, 0.37, 0.64, 0.9]) assert.ok(speed(hold) < speed(hold + 0.07) * 0.8, `slower at ${hold}`);
  // never faster than the camera path's own comfortable limit
  for (let p = 0.02; p < 0.98; p += 0.01) assert.ok(speed(p) < 0.05, `speed at ${p}`);
});
