import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { loadTs, loopback } from "./helpers/load-ts.mjs";

let lookup;
beforeEach(async () => {
  delete process.env.SUPABASE_URL;
  delete process.env.SUPABASE_PUBLISHABLE_KEY;
  ({ lookupCredentialCore: lookup } = await loadTs("lib/verify/lookup.ts"));
});

test("sample codes return the labelled sample record, never a registry claim", async () => {
  const r = await lookup("bsah-2026-hyd-042", "c1");
  assert.equal(r.kind, "sample");
  assert.equal(r.record.code, "BSAH-2026-HYD-042");
});

test("malformed codes are rejected before any lookup", async () => {
  for (const bad of ["", "short", "x".repeat(80), "BSAH 2026", "<script>", 42, null]) {
    assert.deepEqual(await lookup(bad, "c1"), { kind: "invalid" });
  }
});

test("without a registry: honest 'not connected', no invented record", async () => {
  assert.deepEqual(await lookup("BP-0123456789ABCDEF", "c1"), { kind: "unavailable", reason: "not_configured" });
});

test("registry statuses: valid (minimal fields), revoked, expired, unknown; outage is 'error'", async () => {
  const answers = {
    "BP-VALID00000000": { status: "valid", rank: "knight", credential_type: "passport", issued_at: "2026-09-28T00:00:00Z", name: "MUST NOT LEAK" },
    "BP-REVOKED000000": { status: "revoked" },
    "BP-EXPIRED000000": { status: "expired" },
    "BP-NOTHING000000": { status: "unknown" },
  };
  const db = await loopback((req) => ({ reply: answers[req.body.p_code] ?? { status: "unknown" } }));
  try {
    process.env.SUPABASE_URL = db.url;
    process.env.SUPABASE_PUBLISHABLE_KEY = "synthetic-test-only";
    assert.deepEqual(await lookup("bp-valid00000000", "c2"), { kind: "registry", status: "valid", rank: "knight", credentialType: "passport", issuedAt: "2026-09-28T00:00:00Z" });
    assert.deepEqual(await lookup("BP-REVOKED000000", "c2"), { kind: "registry", status: "revoked" });
    assert.deepEqual(await lookup("BP-EXPIRED000000", "c2"), { kind: "registry", status: "expired" });
    assert.deepEqual(await lookup("BP-NOTHING000000", "c2"), { kind: "registry", status: "unknown" });
    assert.ok(db.requests.some((r) => r.url === "/rest/v1/rpc/verify_passport"));
    assert.ok(db.requests.some((r) => r.url === "/rest/v1/rpc/consume_rate_limit"), "shared database limiter consulted");
  } finally {
    await db.close();
  }
  process.env.SUPABASE_URL = "http://127.0.0.1:9";
  assert.deepEqual(await lookup("BP-VALID00000000", "c3"), { kind: "unavailable", reason: "error" });
});

test("lookups are rate limited per client (30 per 10 minutes)", async () => {
  const kinds = [];
  for (let i = 0; i < 31; i++) kinds.push((await lookup("BSAH-2026-HYD-042", "same-client")).kind);
  assert.equal(kinds.filter((k) => k === "sample").length, 30);
  assert.equal(kinds.at(-1), "rate_limited");
  assert.equal((await lookup("BSAH-2026-HYD-042", "other-client")).kind, "sample");
});
