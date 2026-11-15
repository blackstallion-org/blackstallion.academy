// The intro film's head script (lib/opening/intro-boot.ts), run for real against a stand-in browser: when the film plays, and when it does not.
// Does NOT prove how the film looks or runs: that is checked in a browser (see PROGRESS.md). Run with `npm test`.
import { test } from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import { loadTs } from "./helpers/load-ts.mjs";

const { buildIntroBootScript, INTRO_SEEN_KEY, markIntroSeen } = await loadTs("lib/opening/intro-boot.ts");
const { progressAt, timeAt, FILM_SECONDS } = await loadTs("components/worlds/core/director.ts");

function visit({ path = "/", search = "", seen = false, seenInSession = false, noLocalStorage = false, reduced = false, connection = {} } = {}) {
  const dataset = {};
  const styles = [];
  const store = new Map(seenInSession ? [[INTRO_SEEN_KEY, "1"]] : []);
  const local = new Map(seen ? [[INTRO_SEEN_KEY, "1"]] : []);
  const localStorage = { getItem: (k) => local.get(k) ?? null, removeItem: (k) => local.delete(k), setItem: (k, v) => local.set(k, v) };
  const sandbox = {
    document: { documentElement: { dataset }, createElement: () => ({}), head: { appendChild: (s) => styles.push(s.textContent) } },
    get localStorage() { if (noLocalStorage) throw new Error("blocked"); return localStorage; },
    sessionStorage: { getItem: (k) => store.get(k) ?? null, removeItem: (k) => store.delete(k), setItem: (k, v) => store.set(k, v) },
    matchMedia: () => ({ matches: reduced }),
    navigator: { connection },
    location: { pathname: path, search },
    setTimeout: () => 0,
    window: {},
  };
  vm.runInNewContext(buildIntroBootScript(), sandbox);
  return { dataset, styles, store, local };
}

test("first visit to the home page: the intro plays, the page is hidden under it, the loader is marked seen", () => {
  const v = visit();
  assert.equal(v.dataset.bsahIntro, "1");
  assert.equal(v.store.get("bsah-loaded"), "1");
  assert.equal(v.local.get(INTRO_SEEN_KEY), undefined, "completion is stored when the film ends, not when it starts");
  assert.match(v.styles[0], /visibility:hidden/);
  assert.match(v.styles[0], /data-bsah-intro=\\?"1\\?"/, "the page is hidden only while the film plays, so it shows through during the fade");
});

test("it plays every time the website is opened (remembered for the visit only), never on other pages, never against reduced motion, data saver or a slow connection", () => {
  for (const options of [{ seenInSession: true }, { path: "/legend" }, { path: "/worlds" }, { reduced: true }, { search: "?nointro" }, { search: "?noload" }, { connection: { saveData: true } }, { connection: { effectiveType: "2g" } }, { connection: { effectiveType: "slow-2g" } }]) {
    assert.equal(visit(options).dataset.bsahIntro, undefined, JSON.stringify(options));
  }
  assert.equal(visit({ connection: { effectiveType: "4g" } }).dataset.bsahIntro, "1");
  assert.equal(visit({ seen: true }).dataset.bsahIntro, "1", "an old 'seen forever' flag no longer stops it");
  assert.equal(visit({ noLocalStorage: true }).dataset.bsahIntro, "1", "blocked storage does not break the first visit");
});

test("?intro plays it again, but not against reduced motion", () => {
  assert.equal(visit({ seenInSession: true, search: "?intro" }).dataset.bsahIntro, "1");
  assert.equal(visit({ seenInSession: true, search: "?a=1&intro" }).dataset.bsahIntro, "1");
  assert.equal(visit({ seenInSession: true, search: "?intro", reduced: true }).dataset.bsahIntro, undefined);
});

test("the film clock: monotonic, reaches 1 at the end, slows on each world's hero moment", () => {
  let last = -1;
  for (let t = 0; t <= FILM_SECONDS; t += 0.5) { const p = progressAt(t); assert.ok(p >= last); last = p; }
  assert.equal(progressAt(FILM_SECONDS), 1);
  assert.equal(progressAt(0), 0);
  const speed = (p) => (progressAt(timeAt(p) + 0.5) - progressAt(timeAt(p) - 0.5));
  // 14 Nov 2026: two worlds (Origins, Legacy), one hero moment each
  for (const hold of [0.29, 0.8]) assert.ok(speed(hold) < Math.max(speed(hold - 0.07), speed(hold + 0.07)) * 0.97, `slower at ${hold}`);
  // never faster than the camera path's own comfortable limit
  for (let p = 0.02; p < 0.98; p += 0.01) assert.ok(speed(p) < 0.05, `speed at ${p}`);
});

test("markIntroSeen remembers the intro for this visit only (sessionStorage, never localStorage)", () => {
  const written = [];
  const mk = (blockLocal) => ({ localStorage: { setItem: (k, v) => { if (blockLocal) throw new Error("blocked"); written.push(["local", k, v]); } }, sessionStorage: { setItem: (k, v) => written.push(["session", k, v]) } });
  globalThis.window = mk(false); markIntroSeen();
  globalThis.window = mk(true); markIntroSeen();
  delete globalThis.window;
  assert.deepEqual(written, [["session", INTRO_SEEN_KEY, "1"], ["session", INTRO_SEEN_KEY, "1"]]);
});
