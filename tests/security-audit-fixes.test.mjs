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

test("S16: the second factor is enforced only when STAFF_MFA_REQUIRED=1, and then needs AAL2", async () => {
  const { needsSecondFactor } = await loadTs("lib/auth/mfa.ts");
  const client = (level, error = null) => {
    const calls = { n: 0 };
    return { calls, auth: { mfa: { getAuthenticatorAssuranceLevel: async () => { calls.n++; return { data: level ? { currentLevel: level } : null, error }; } } } };
  };
  const before = process.env.STAFF_MFA_REQUIRED;
  try {
    delete process.env.STAFF_MFA_REQUIRED;
    const off = client("aal1");
    assert.equal(await needsSecondFactor(off), false, "off by default: nobody is locked out");
    assert.equal(off.calls.n, 0, "off means no extra Auth call either");
    process.env.STAFF_MFA_REQUIRED = "1";
    assert.equal(await needsSecondFactor(client("aal1")), true, "a password-only session is not enough");
    assert.equal(await needsSecondFactor(client("aal2")), false);
    assert.equal(await needsSecondFactor(client(null, { status: 500 })), true, "an unreadable level counts as not yet");
    process.env.STAFF_MFA_REQUIRED = "true";
    assert.equal(await needsSecondFactor(client("aal1")), false, "only the exact value 1 switches it on");
  } finally {
    if (before === undefined) delete process.env.STAFF_MFA_REQUIRED; else process.env.STAFF_MFA_REQUIRED = before;
  }
});

test("S16: both privileged gates check the second factor after the role, and /admin/mfa cannot loop", () => {
  const staff = read("lib/auth/admin.ts");
  assert.match(staff, /if \(!profile \|\| !isStaffRole\(profile\.role\)\) redirect\("\/admin\/login\?e=forbidden"\);\n\s+if \(await needsSecondFactor\(supabase\)\) redirect\("\/admin\/mfa"\);/);
  const admissions = read("lib/registration/server.ts");
  assert.match(admissions, /if \(!isAdmissionsRole\(account\.role\)\) redirect\("\/admin\/login\?e=forbidden"\);\n\s+if \(await needsSecondFactor\(supabase\)\) redirect\("\/admin\/mfa"\);/);
  // the enrolment page and its actions use the session check WITHOUT the second factor (requireStaff there would loop)
  for (const file of ["app/admin/mfa/page.tsx", "app/admin/mfa/actions.ts"]) {
    const src = read(file);
    assert.match(src, /requirePrivilegedSession\(\)/, file);
    assert.doesNotMatch(src, /requireStaff\(|requireAdmissions\(/, file);
  }
  assert.match(read("lib/auth/mfa-session.ts"), /isStaffRole\(role\) && !isAdmissionsRole\(role\)\) redirect\("\/admin\/login\?e=forbidden"\)/);
  assert.match(read("proxy.ts"), /"\/admin\/:path\*"/, "signed-out visitors to /admin/mfa are redirected by the proxy too");
  assert.match(read("app/admin/mfa/actions.ts"), /consumeRateLimit\("login", ip\)/, "codes are rate limited like passwords");
});
