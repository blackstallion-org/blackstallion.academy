import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { loadTs } from "./helpers/load-ts.mjs";

let health;
const env = { SUPABASE_URL: "https://db.example.test/", SUPABASE_PUBLISHABLE_KEY: "sb_publishable_testkey", VERCEL_REGION: "icn1" };
beforeEach(async () => {
  health = await loadTs("lib/monitoring/health.ts");
  health.resetHealthCache();
});

function fakeFetch(handler) {
  const calls = [];
  const impl = async (url, init) => {
    calls.push({ url: String(url), init });
    return handler(url, init);
  };
  return { impl, calls };
}

test("shallow check needs no database and returns only non-secret fields", async () => {
  const f = fakeFetch(() => { throw new Error("must not be called"); });
  const r = await health.checkHealth({ env, fetchImpl: f.impl, now: Date.UTC(2026, 9, 24) });
  assert.deepEqual(r, { ok: true, service: "bsah-web", time: "2026-10-24T00:00:00.000Z", region: "icn1" });
  assert.equal(f.calls.length, 0);
  assert.doesNotMatch(JSON.stringify(r), /sb_publishable|db\.example/);
});

test("deep check calls the read-only passport lookup with a code that cannot exist and reports the timing", async () => {
  const f = fakeFetch(() => new Response(JSON.stringify({ status: "unknown" }), { status: 200 }));
  const r = await health.checkHealth({ deep: true, env, fetchImpl: f.impl, now: 1_000 });
  assert.equal(r.ok, true);
  assert.equal(r.db, "up");
  assert.equal(typeof r.dbMs, "number");
  assert.equal(f.calls.length, 1);
  assert.equal(f.calls[0].url, "https://db.example.test/rest/v1/rpc/verify_passport");
  assert.equal(f.calls[0].init.method, "POST");
  assert.deepEqual(JSON.parse(f.calls[0].init.body), { p_code: "HEALTHCHECK-NO-SUCH-CODE" });
  assert.match(JSON.parse(f.calls[0].init.body).p_code, /^[A-Za-z0-9-]{8,64}$/);
  assert.doesNotMatch(JSON.stringify(r), /sb_publishable|db\.example/);
});

test("deep results are reused for 15 seconds, then refreshed", async () => {
  const f = fakeFetch(() => new Response("{}", { status: 200 }));
  await health.checkHealth({ deep: true, env, fetchImpl: f.impl, now: 0 });
  await health.checkHealth({ deep: true, env, fetchImpl: f.impl, now: 14_000 });
  assert.equal(f.calls.length, 1, "second call inside the window is served from memory");
  await health.checkHealth({ deep: true, env, fetchImpl: f.impl, now: 16_000 });
  assert.equal(f.calls.length, 2, "after the window the database is asked again");
});

test("a database error or timeout is reported as down without error text", async () => {
  const bad = fakeFetch(() => new Response("secret internal detail", { status: 500 }));
  const r1 = await health.checkHealth({ deep: true, env, fetchImpl: bad.impl, now: 0 });
  assert.equal(r1.ok, false);
  assert.equal(r1.db, "down");
  assert.doesNotMatch(JSON.stringify(r1), /secret internal detail/);
  health.resetHealthCache();
  const boom = fakeFetch(() => { throw new Error("connect ETIMEDOUT 10.0.0.1"); });
  const r2 = await health.checkHealth({ deep: true, env, fetchImpl: boom.impl, now: 0 });
  assert.equal(r2.ok, false);
  assert.equal(r2.db, "down");
  assert.doesNotMatch(JSON.stringify(r2), /ETIMEDOUT|10\.0\.0\.1/);
});

test("without database settings the deep check says so instead of failing", async () => {
  const f = fakeFetch(() => { throw new Error("must not be called"); });
  const r = await health.checkHealth({ deep: true, env: {}, fetchImpl: f.impl, now: 0 });
  assert.equal(r.ok, true);
  assert.equal(r.db, "not_configured");
  assert.equal(r.region, null);
  assert.equal(f.calls.length, 0);
});
