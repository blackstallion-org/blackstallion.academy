// Regression tests for the 18 Nov 2026 technical audit (branch audit-1118). Each test names the finding it pins down.
import { test, afterEach } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { loadTs, loadTsWith, root } from "./helpers/load-ts.mjs";

const read = (p) => readFileSync(path.join(root, p), "utf8");
const realConsoleError = console.error;
afterEach(() => { console.error = realConsoleError; delete globalThis.__bsahTest; });

// ------------------------------------------------------------------ M1: deleteMedia checks every step and never touches the library
const SWAPS = { "@/lib/auth/admin": "tests/helpers/fake-staff.mjs", "next/cache": "tests/helpers/fake-next-cache.mjs" };
const ROW_ID = "6f9619ff-8b86-4011-b42d-00c04fc964ff";
const SITE_PATH = "site/2026/11/0f8fad5b-d9cb-469f-a165-70867728950e.webp";

function mediaClient(log, { row, selectError = null, noBucketColumn = false, removeError = null, deleteError = null }) {
  return {
    storage: { from: (bucket) => ({ remove: async (paths) => { log.push(["remove", bucket, paths]); return { error: removeError }; } }) },
    from: (table) => {
      let cols = "";
      const b = {
        select: (c) => { cols = c; log.push(["select", c]); return b; },
        eq: (col, val) => { log.push(["eq", col, val]); return b; },
        maybeSingle: async () => {
          if (noBucketColumn && cols.includes("bucket")) return { data: null, error: { code: "42703" } };
          return { data: row, error: selectError };
        },
        delete: () => { log.push(["delete", table]); return { eq: async () => ({ error: deleteError }) }; },
      };
      return b;
    },
  };
}
async function runDelete(opts) {
  const log = [];
  const errors = [];
  console.error = (...a) => errors.push(a.join(" "));
  globalThis.__bsahTest = { revalidated: [], tags: [], requireStaff: async () => { log.push(["requireStaff"]); return { supabase: mediaClient(log, opts), user: { id: "u" } }; } };
  const actions = await loadTsWith("app/admin/actions.ts", SWAPS);
  const fd = new FormData();
  fd.set("id", opts.id ?? ROW_ID);
  await actions.deleteMedia(fd);
  return { log, errors, revalidated: globalThis.__bsahTest.revalidated };
}
const steps = (log) => log.map((e) => e[0]);

test("M1 deleteMedia: a website image is removed from Storage, then its record", async () => {
  const { log } = await runDelete({ row: { storage_path: SITE_PATH, bucket: "website-assets" } });
  assert.deepEqual(log.find((e) => e[0] === "remove"), ["remove", "website-assets", [SITE_PATH]]);
  assert.ok(steps(log).indexOf("remove") < steps(log).indexOf("delete"), "file first, then the record");
});

test("M1 deleteMedia: a media-library row (bsah-media) is never touched by the website-image delete", async () => {
  const { log } = await runDelete({ row: { storage_path: "videos/2026/11/0f8fad5b-d9cb-469f-a165-70867728950e.mp4", bucket: "bsah-media" } });
  assert.ok(!steps(log).includes("remove") && !steps(log).includes("delete"));
});

test("M1 deleteMedia: if Storage refuses, the record stays and the failure is logged", async () => {
  const { log, errors } = await runDelete({ row: { storage_path: SITE_PATH, bucket: "website-assets" }, removeError: { statusCode: "403" } });
  assert.ok(steps(log).includes("remove"));
  assert.ok(!steps(log).includes("delete"), "the record is kept so the delete can be tried again");
  assert.ok(errors.some((e) => e.includes("admin.media_delete_failed")));
});

test("M1 deleteMedia: a failed record delete is logged, and an unexpected path is refused", async () => {
  const a = await runDelete({ row: { storage_path: SITE_PATH, bucket: "website-assets" }, deleteError: { code: "42501" } });
  assert.ok(a.errors.some((e) => e.includes("admin.media_delete_failed")));
  const b = await runDelete({ row: { storage_path: "../other/secret.pdf", bucket: "website-assets" } });
  assert.ok(!steps(b.log).includes("remove"));
});

test("M1 deleteMedia: before the media-library migration (no bucket column) website images can still be deleted", async () => {
  const { log } = await runDelete({ row: { storage_path: SITE_PATH }, noBucketColumn: true });
  assert.ok(steps(log).includes("remove") && steps(log).includes("delete"));
});

// ------------------------------------------------------------------ health: the deep check reads the same names as supabaseConfig()
test("health: a project that sets only NEXT_PUBLIC_SUPABASE_* is still probed (uptime would otherwise miss an outage)", async () => {
  const health = await loadTs("lib/monitoring/health.ts");
  health.resetHealthCache();
  const calls = [];
  const out = await health.checkHealth({
    deep: true, now: 1,
    env: { NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co", NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_x" },
    fetchImpl: async (u) => { calls.push(String(u)); return new Response("null", { status: 200 }); },
  });
  assert.equal(calls.length, 1);
  assert.match(calls[0], /^https:\/\/example\.supabase\.co\/rest\/v1\/rpc\/verify_passport$/);
  assert.equal(out.db, "up");
});

// ------------------------------------------------------------------ L2: reserved phone sign-up addresses cannot be taken by e-mail
test("L2 sign-up: an .invalid address (phone-<digits>@phone.invalid is reserved for phone sign-ups) is refused", async () => {
  const kinds = await loadTs("lib/accounts/kinds.ts");
  const src = read("lib/accounts/kinds.ts");
  assert.match(src, /endsWith\("\.invalid"\)/);
  const base = { kind: "parent", password: "a-long-password-1", confirm: "a-long-password-1", full_name: "Test Parent", consent: "yes", phone: "+91 98765 43210", city: "Jaipur" };
  const good = kinds.parseSignUp({ ...base, email: "parent@example.com" });
  assert.equal(good.ok, true, JSON.stringify(good));
  const bad = kinds.parseSignUp({ ...base, email: "phone-919876543210@phone.invalid" });
  assert.deepEqual(bad, { ok: false, error: "Enter a valid e-mail address." });
});

// ------------------------------------------------------------------ L4: the account proxy
test("L4 proxy: only the exact public paths skip the sign-in (a look-alike such as /admin/login-x does not)", async () => {
  const saved = { url: process.env.SUPABASE_URL, key: process.env.SUPABASE_PUBLISHABLE_KEY, nurl: process.env.NEXT_PUBLIC_SUPABASE_URL, nkey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY };
  for (const k of ["SUPABASE_URL", "SUPABASE_PUBLISHABLE_KEY", "NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"]) delete process.env[k];
  try {
    const { proxy } = await loadTs("proxy.ts");
    const { NextRequest } = await import("next/server.js");
    const at = (p) => proxy(new NextRequest(`https://bsah.test${p}`));
    for (const open of ["/admin/login", "/admin/reset", "/admin/login/"]) assert.equal((await at(open)).headers.get("location"), null, open);
    for (const closed of ["/admin/login-x", "/admin/resetx", "/admin", "/account"]) assert.match((await at(closed)).headers.get("location") ?? "", /\/admin\/login\?e=unconfigured$/, closed);
  } finally {
    for (const [k, v] of [["SUPABASE_URL", saved.url], ["SUPABASE_PUBLISHABLE_KEY", saved.key], ["NEXT_PUBLIC_SUPABASE_URL", saved.nurl], ["NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", saved.nkey]]) { if (v !== undefined) process.env[k] = v; }
  }
  assert.match(read("proxy.ts"), /for \(const cookie of response\.cookies\.getAll\(\)\) redirect\.cookies\.set\(cookie\)/, "refreshed or cleared session cookies survive the redirect to sign-in");
});

// ------------------------------------------------------------------ M3: MFA enrolment needs AAL2 once an authenticator exists
async function enrol({ factors, level }) {
  const log = [];
  globalThis.__bsahTest = {
    requirePrivilegedSession: async () => ({
      home: "/admin",
      supabase: { auth: { mfa: {
        listFactors: async () => ({ data: { all: factors } }),
        getAuthenticatorAssuranceLevel: async () => ({ data: { currentLevel: level }, error: null }),
        unenroll: async (x) => { log.push(["unenroll", x.factorId]); return { error: null }; },
        enroll: async () => { log.push(["enroll"]); return { data: { id: "f-new", type: "totp", totp: { qr_code: "qr", secret: "s" } }, error: null }; },
      } } },
    }),
  };
  const mfa = await loadTsWith("app/admin/mfa/actions.ts", { "@/lib/auth/mfa-session": "tests/helpers/fake-mfa-session.mjs" });
  return { out: await mfa.startEnrolment(), log };
}

test("M3 MFA: a password-only session cannot add a second authenticator to an account that already has one", async () => {
  const { out, log } = await enrol({ factors: [{ id: "f1", factor_type: "totp", status: "verified" }], level: "aal1" });
  assert.match(out.error, /already has an authenticator/);
  assert.deepEqual(log, [], "nothing enrolled or removed");
});

test("M3 MFA: first enrolment (no verified factor) and an AAL2 session still work", async () => {
  assert.equal((await enrol({ factors: [], level: "aal1" })).out.factorId, "f-new");
  const again = await enrol({ factors: [{ id: "f1", factor_type: "totp", status: "verified" }, { id: "f2", factor_type: "totp", status: "unverified" }], level: "aal2" });
  assert.equal(again.out.factorId, "f-new");
  assert.deepEqual(again.log, [["unenroll", "f2"], ["enroll"]], "only the half-finished factor is cleared");
});

// ------------------------------------------------------------------ M4: payments (database side is tested on the replica, stage 78)
test("M4 webhook: an oversized body is refused from its declared length, before it is read", async () => {
  const route = await loadTs("app/api/payments/razorpay/route.ts");
  let read = false;
  const req = new Request("https://bsah.test/api/payments/razorpay", { method: "POST", headers: { "content-length": "5000000" }, body: "x" });
  const orig = req.text.bind(req);
  req.text = async () => { read = true; return orig(); };
  const res = await route.POST(req);
  assert.equal(res.status, 413);
  assert.equal(read, false);
});

test("M4 enrolment: one pending order per application, a stale price is retired, a lost race reuses the winner", () => {
  const src = read("app/enroll/actions.ts");
  assert.doesNotMatch(src, /eq\("status", "PENDING"\)\.maybeSingle\(\)/, "maybeSingle() errors silently once two pending orders exist");
  assert.match(src, /update\(\{ status: "FAILED" \}\)\.eq\("id", current\.id\)\.eq\("status", "PENDING"\)/);
  assert.match(src, /error\?\.code === "23505"/);
  const sql = read("supabase/live/migrations/20261118001900_payment_order_guard.sql");
  assert.match(sql, /create unique index if not exists payment_records_one_pending_per_application/);
  assert.match(sql, /'paid_duplicate'/);
  assert.match(read("supabase/live/tests/run.sh"), /78_payment_guard_tests\.sql/);
});
