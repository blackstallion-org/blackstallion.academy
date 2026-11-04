// Regression tests for the fixes of the 4 Nov 2026 security audit (docs/security/SECURITY-AUDIT.md):
//   F-06 open redirect after an e-mail link (/auth/confirm), F-07 session cookie flags, F-11 rate-limit salt.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { loadTs, root } from "./helpers/load-ts.mjs";

const read = (rel) => readFileSync(path.join(root, rel), "utf8");
const BASE = "https://blackstallion.academy/auth/confirm";

test("F-06: the e-mail-link landing only continues to a path on this site", async () => {
  const { safeNext } = await loadTs("lib/registration/model.ts");
  // The old check ("starts with / but not //") let these through; URL parsing sends the first two to another host.
  for (const bad of ["/\\evil.com", "/\\/evil.com", "//evil.com", "https://evil.com", "/%5Cevil.com", "/\tevil.com", "", null, undefined]) {
    const next = safeNext(bad, "/admin");
    assert.equal(next, "/admin", String(bad));
    assert.equal(new URL(next, BASE).origin, "https://blackstallion.academy", String(bad));
  }
  for (const good of ["/admin", "/admin/reset", "/account", "/enroll/status"]) assert.equal(safeNext(good, "/admin"), good);
  const route = read("app/auth/confirm/route.ts");
  assert.match(route, /const next = safeNext\(searchParams\.get\("next"\), "\/admin"\)/);
  assert.doesNotMatch(route, /startsWith\("\/\/"\)/, "the hand-written check is gone");
});

test("F-07: Supabase session cookies are HttpOnly, Lax and Secure in production", async () => {
  const before = process.env.NODE_ENV;
  try {
    process.env.NODE_ENV = "production";
    const prod = (await loadTs("lib/supabase/rest.ts")).AUTH_COOKIE_OPTIONS;
    assert.deepEqual(prod, { path: "/", sameSite: "lax", httpOnly: true, secure: true });
    process.env.NODE_ENV = "development";
    assert.equal((await loadTs("lib/supabase/rest.ts")).AUTH_COOKIE_OPTIONS.secure, false, "plain-http dev server keeps working");
  } finally {
    process.env.NODE_ENV = before;
  }
  // Both places that create a session-aware client pass the options (the proxy refreshes, the server client reads and writes).
  assert.match(read("proxy.ts"), /cookieOptions: AUTH_COOKIE_OPTIONS/);
  assert.match(read("lib/supabase/server.ts"), /cookieOptions: AUTH_COOKIE_OPTIONS/);
  // HttpOnly is only safe while no page script needs the session: there must be no browser Supabase client.
  const { execSync } = await import("node:child_process");
  const hits = execSync("git grep -l createBrowserClient -- app components lib || true", { cwd: root, encoding: "utf8" }).trim();
  assert.equal(hits, "", "a browser Supabase client would need readable cookies");
});

test("F-11: without RATE_LIMIT_SALT every instance still hashes a visitor to the same bucket", async () => {
  const keep = { RATE_LIMIT_SALT: process.env.RATE_LIMIT_SALT, TRUSTEE_SESSION_SECRET: process.env.TRUSTEE_SESSION_SECRET, SUPABASE_SECRET_KEY: process.env.SUPABASE_SECRET_KEY };
  try {
    delete process.env.RATE_LIMIT_SALT;
    delete process.env.TRUSTEE_SESSION_SECRET;
    process.env.SUPABASE_SECRET_KEY = "sb_secret_test-only-value-for-salt-derivation";
    const a = await loadTs("lib/security/rate-limit.ts"); // two fresh module instances stand in for two server instances
    const b = await loadTs("lib/security/rate-limit.ts");
    assert.equal(a.bucketFor("lead", "203.0.113.7"), b.bucketFor("lead", "203.0.113.7"));
    assert.notEqual(a.bucketFor("lead", "203.0.113.7"), a.bucketFor("lead", "203.0.113.8"));
    assert.match(a.bucketFor("login", "203.0.113.7"), /^login:[a-f0-9]{40}$/, "still matches the database's bucket format");
    const derived = a.bucketFor("lead", "203.0.113.7");
    process.env.RATE_LIMIT_SALT = "explicit-salt-takes-precedence-0123456789";
    assert.notEqual(a.bucketFor("lead", "203.0.113.7"), derived, "an explicit RATE_LIMIT_SALT takes precedence");
  } finally {
    for (const [k, v] of Object.entries(keep)) if (v === undefined) delete process.env[k]; else process.env[k] = v;
  }
});
