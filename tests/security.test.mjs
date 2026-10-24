import { test } from "node:test";
import assert from "node:assert/strict";
import { loadTs, loopback } from "./helpers/load-ts.mjs";

test("rate limit: in-process window allows up to the limit, then refuses, then resets next window", async () => {
  const rl = await loadTs("lib/security/rate-limit.ts");
  const rule = { limit: 3, windowSeconds: 60 };
  const t0 = 1_700_000_040_000;
  const bucket = rl.bucketFor("lead", "198.51.100.7");
  assert.deepEqual([1, 2, 3, 4].map(() => rl.consumeMemory(bucket, rule, t0)), [true, true, true, false]);
  assert.equal(rl.consumeMemory(rl.bucketFor("lead", "198.51.100.8"), rule, t0), true, "other client unaffected");
  assert.equal(rl.consumeMemory(bucket, rule, t0 + 60_000), true, "new window");
});

test("rate limit: buckets are salted hashes, never the raw address", async () => {
  process.env.RATE_LIMIT_SALT = "unit-test-salt";
  const rl = await loadTs("lib/security/rate-limit.ts");
  const b = rl.bucketFor("trustee", "203.0.113.9");
  assert.match(b, /^trustee:[a-f0-9]{40}$/);
  assert.ok(!b.includes("203"));
  process.env.RATE_LIMIT_SALT = "another-salt";
  assert.notEqual(rl.bucketFor("trustee", "203.0.113.9"), b);
  delete process.env.RATE_LIMIT_SALT;
});

test("rate limit: database refusal wins; database outage falls back to the in-process limit", async () => {
  const rl = await loadTs("lib/security/rate-limit.ts");
  let answer = true;
  const db = await loopback(() => ({ reply: answer }));
  try {
    const cfg = { url: db.url, key: "test-only" };
    assert.deepEqual(await rl.consumeRateLimit("verify", "a", cfg), { allowed: true, layer: "database" });
    answer = false;
    assert.deepEqual(await rl.consumeRateLimit("verify", "a", cfg), { allowed: false, layer: "database" });
    assert.equal(db.requests[0].url, "/rest/v1/rpc/consume_rate_limit");
    assert.match(db.requests[0].body.p_bucket, /^verify:[a-f0-9]{40}$/);
  } finally {
    await db.close();
  }
  const down = await rl.consumeRateLimit("verify", "b", { url: "http://127.0.0.1:9", key: "x" });
  assert.deepEqual(down, { allowed: true, layer: "memory" });
});

test("attribution: keeps allow-listed keys, reduces referrer to host, drops unsafe values", async () => {
  const { sanitizeAttribution, isIdempotencyKey } = await loadTs("lib/leads/attribution.ts");
  const out = sanitizeAttribution({
    attr_path: "/schools/zone-01a?x=1#y",
    attr_referrer: "https://www.google.com/search?q=private",
    attr_utm_source: "flyer",
    attr_qr: "Q-17",
    attr_hub: "zone-01a",
    attr_campaign: "<script>",
    hub: "royal", // ordinary field, never attribution
    attr_ip: "203.0.113.9",
  });
  assert.deepEqual(out, { path: "/schools/zone-01a", hub: "zone-01a", qr: "Q-17", referrer: "www.google.com", utm_source: "flyer" });
  assert.deepEqual(sanitizeAttribution({ attr_path: "//evil.example" }), {});
  assert.equal(isIdempotencyKey("abcDEF0123456789"), true);
  assert.equal(isIdempotencyKey("short"), false);
  assert.equal(isIdempotencyKey("has space 0123456789"), false);
});

test("turnstile: skipped without a secret; refuses missing token and failed verification when enabled", async () => {
  const ts = await loadTs("lib/security/turnstile.ts");
  delete process.env.TURNSTILE_SECRET_KEY;
  assert.deepEqual(await ts.verifyTurnstile(undefined), { ok: true, skipped: true });
  process.env.TURNSTILE_SECRET_KEY = "test-secret";
  try {
    assert.deepEqual(await ts.verifyTurnstile(undefined), { ok: false, skipped: false });
    const fakeFetch = async (_url, init) => new Response(JSON.stringify({ success: String(init.body).includes("good-token") }));
    assert.deepEqual(await ts.verifyTurnstile("good-token", undefined, fakeFetch), { ok: true, skipped: false });
    assert.deepEqual(await ts.verifyTurnstile("bad-token", undefined, fakeFetch), { ok: false, skipped: false });
  } finally {
    delete process.env.TURNSTILE_SECRET_KEY;
  }
});
