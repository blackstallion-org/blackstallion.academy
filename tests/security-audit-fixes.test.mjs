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

test("S16: the second factor is on by default in production (opt out with 0), off in development, and needs AAL2", async () => {
  const { needsSecondFactor, staffMfaRequired } = await loadTs("lib/auth/mfa.ts");
  const client = (level, error = null) => {
    const calls = { n: 0 };
    return { calls, auth: { mfa: { getAuthenticatorAssuranceLevel: async () => { calls.n++; return { data: level ? { currentLevel: level } : null, error }; } } } };
  };
  const before = { flag: process.env.STAFF_MFA_REQUIRED, env: process.env.NODE_ENV };
  try {
    delete process.env.STAFF_MFA_REQUIRED;
    process.env.NODE_ENV = "development";
    const off = client("aal1");
    assert.equal(await needsSecondFactor(off), false, "development: off unless asked for");
    assert.equal(off.calls.n, 0, "off means no extra Auth call either");
    process.env.NODE_ENV = "production";
    assert.equal(staffMfaRequired(), true, "production: on without any setting (17 Nov 2026 audit)");
    assert.equal(await needsSecondFactor(client("aal1")), true, "a password-only session is not enough");
    assert.equal(await needsSecondFactor(client("aal2")), false);
    assert.equal(await needsSecondFactor(client(null, { status: 500 })), true, "an unreadable level counts as not yet");
    process.env.STAFF_MFA_REQUIRED = "0";
    assert.equal(staffMfaRequired(), false, "production: switched off only by the explicit value 0");
    process.env.STAFF_MFA_REQUIRED = "true";
    assert.equal(staffMfaRequired(), true, "an unrecognised value keeps the production default (on)");
    process.env.NODE_ENV = "development";
    assert.equal(staffMfaRequired(), false, "development: an unrecognised value keeps it off");
    process.env.STAFF_MFA_REQUIRED = "1";
    assert.equal(staffMfaRequired(), true, "development: 1 switches it on");
  } finally {
    if (before.flag === undefined) delete process.env.STAFF_MFA_REQUIRED; else process.env.STAFF_MFA_REQUIRED = before.flag;
    if (before.env === undefined) delete process.env.NODE_ENV; else process.env.NODE_ENV = before.env;
  }
});

test("M2: a new password needs a reset link or sign-in from the last ten minutes, read from the verified token", async () => {
  const { authenticatedRecently, lastAuthenticatedAt, sessionAuthenticatedRecently, RECENT_AUTH_SECONDS } = await loadTs("lib/auth/recent-auth.ts");
  const now = 1_800_000_000;
  assert.equal(RECENT_AUTH_SECONDS, 600);
  assert.equal(authenticatedRecently([{ method: "recovery", timestamp: now - 30 }], now), true, "reset link just opened");
  assert.equal(authenticatedRecently([{ method: "password", timestamp: now - 599 }], now), true);
  assert.equal(authenticatedRecently([{ method: "password", timestamp: now - 601 }], now), false, "a session left open is not enough");
  assert.equal(authenticatedRecently([{ method: "password", timestamp: now - 7200 }, { method: "totp", timestamp: now - 60 }], now), true, "the newest proof counts");
  assert.equal(authenticatedRecently(["password", "otp"], now), false, "times are needed to judge recency");
  assert.equal(authenticatedRecently(undefined, now), false);
  assert.equal(authenticatedRecently([{ method: "password", timestamp: now + 3600 }], now), false, "a time in the future is not trusted");
  assert.equal(lastAuthenticatedAt([{ timestamp: 5 }, { timestamp: 9 }, "x", null]), 9);
  const claims = (amr, error = null) => ({ auth: { getClaims: async () => (error ? { data: null, error } : { data: { claims: { amr } }, error: null }) } });
  const fresh = Math.floor(Date.now() / 1000) - 10;
  assert.equal(await sessionAuthenticatedRecently(claims([{ method: "recovery", timestamp: fresh }])), true);
  assert.equal(await sessionAuthenticatedRecently(claims(null, { message: "invalid JWT" })), false, "an unverifiable token is not recent");
  assert.equal(await sessionAuthenticatedRecently({ auth: { getClaims: async () => { throw new Error("network"); } } }), false);
  // the action and the page both use it, after getUser(), with a per-account limit
  const actions = read("app/admin/actions.ts");
  assert.match(actions, /export async function updatePassword[\s\S]*?getUser\(\)[\s\S]*?consumeRateLimit\("login", `pw:\$\{auth\.user\.id\}`\)[\s\S]*?sessionAuthenticatedRecently\(supabase\)[\s\S]*?updateUser\(\{ password/);
  assert.match(read("app/admin/reset/page.tsx"), /sessionAuthenticatedRecently\(supabase\)\) return <NewPasswordForm \/>/);
});

test("L2: e-mail links use the configured or platform address, never a forwarded header on Vercel", async () => {
  const keep = { a: process.env.NEXT_PUBLIC_SITE_URL, b: process.env.VERCEL_ENV, c: process.env.VERCEL_PROJECT_PRODUCTION_URL, d: process.env.VERCEL_URL };
  try {
    for (const k of ["NEXT_PUBLIC_SITE_URL", "VERCEL_ENV", "VERCEL_PROJECT_PRODUCTION_URL", "VERCEL_URL"]) delete process.env[k];
    const { siteOrigin } = await loadTs("lib/site-origin.ts");
    assert.equal(siteOrigin("localhost:3000", "http"), "http://localhost:3000", "a local server keeps working");
    assert.equal(siteOrigin("evil.example", "javascript"), "https://evil.example", "only http or https");
    process.env.VERCEL_ENV = "production";
    process.env.VERCEL_PROJECT_PRODUCTION_URL = "bsah.vercel.app";
    assert.equal(siteOrigin("evil.example", "https"), "https://bsah.vercel.app", "production: the platform's address, not the header");
    process.env.VERCEL_ENV = "preview";
    process.env.VERCEL_URL = "bsah-git-x.vercel.app";
    assert.equal(siteOrigin("evil.example", "https"), "https://bsah-git-x.vercel.app");
    process.env.NEXT_PUBLIC_SITE_URL = "https://blackstallion.academy/";
    assert.equal(siteOrigin("evil.example", "https"), "https://blackstallion.academy", "the configured address wins");
  } finally {
    for (const [k, v] of Object.entries({ NEXT_PUBLIC_SITE_URL: keep.a, VERCEL_ENV: keep.b, VERCEL_PROJECT_PRODUCTION_URL: keep.c, VERCEL_URL: keep.d })) if (v === undefined) delete process.env[k]; else process.env[k] = v;
  }
  for (const file of ["app/auth/actions.ts", "app/admin/actions.ts", "app/account/actions.ts"]) {
    const src = read(file);
    assert.match(src, /siteOrigin\(host, proto\)/, file);
    assert.doesNotMatch(src, /NEXT_PUBLIC_SITE_URL \|\| \(host/, file);
  }
});

test("17 Nov audit: dev rig bench is gone in production; the privileged client is marked server-only", () => {
  assert.match(read("app/dev/rigs/page.tsx"), /if \(process\.env\.NODE_ENV === "production"\) notFound\(\);/);
  assert.match(read("lib/supabase/admin.ts"), /^import "server-only";/);
});

test("M4: the database rate limiter reads the same Supabase settings as everything else, including NEXT_PUBLIC_ names", async () => {
  const keep = { u: process.env.SUPABASE_URL, k: process.env.SUPABASE_PUBLISHABLE_KEY, nu: process.env.NEXT_PUBLIC_SUPABASE_URL, nk: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY };
  try {
    delete process.env.SUPABASE_URL; delete process.env.SUPABASE_PUBLISHABLE_KEY;
    process.env.NEXT_PUBLIC_SUPABASE_URL = "http://127.0.0.1:9/";
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "sb_publishable_test";
    const { consumeRateLimit } = await loadTs("lib/security/rate-limit.ts");
    const calls = [];
    const fetchImpl = async (url) => { calls.push(String(url)); return new Response("false", { status: 200 }); };
    const r = await consumeRateLimit("verify", "203.0.113.9", { fetchImpl });
    assert.deepEqual(r, { allowed: false, layer: "database" }, "the database layer was consulted");
    assert.equal(calls[0], "http://127.0.0.1:9/rest/v1/rpc/consume_rate_limit");
  } finally {
    for (const [k, v] of Object.entries({ SUPABASE_URL: keep.u, SUPABASE_PUBLISHABLE_KEY: keep.k, NEXT_PUBLIC_SUPABASE_URL: keep.nu, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: keep.nk })) if (v === undefined) delete process.env[k]; else process.env[k] = v;
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
