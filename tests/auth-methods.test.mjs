// Google, phone-code and e-mail sign-in: the input rules, the plain-language errors, the server actions and the return
// route against a fake Supabase client. Synthetic data only. What the database does with a new phone or Google user is
// proved by supabase/live/tests/72..74 (replica); the real providers are checked by hand (docs/AUTH_METHODS.md).
import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { loadTs, loadTsWith } from "./helpers/load-ts.mjs";

const { normalizePhone, normalizeOtp, maskPhone } = await loadTs("lib/auth/phone.ts");
const { classifyAuthError, authErrorMessage } = await loadTs("lib/auth/errors.ts");

test("phone numbers: Indian numbers are accepted the way people type them, everything else needs a +", () => {
  for (const ok of ["98765 43210", "9876543210", "098765 43210", "+91 98765 43210", "+91-98765-43210", "0091 98765 43210", "919876543210", "(98765) 43210"]) {
    assert.equal(normalizePhone(ok), "+919876543210", ok);
  }
  assert.equal(normalizePhone("+44 7700 900123"), "+447700900123");
  assert.equal(normalizePhone("+1 202 555 0100"), "+12025550100");
  for (const bad of ["", "   ", "12345", "5876543210", "+91 12345 67890", "+0 1234567", "abc", "98765 43210 ext 5", "+91 98765 4321", "98765432101", null, undefined, 9876543210, "+".padEnd(30, "1")]) {
    assert.equal(normalizePhone(bad), null, String(bad));
  }
});

test("codes: exactly six digits, spaces and dashes from a pasted message are dropped", () => {
  assert.equal(normalizeOtp("123456"), "123456");
  assert.equal(normalizeOtp(" 123 456 "), "123456");
  assert.equal(normalizeOtp("123-456"), "123456");
  for (const bad of ["12345", "1234567", "12345a", "", null, undefined, 123456]) assert.equal(normalizeOtp(bad), null, String(bad));
});

test("the number on screen is masked", () => {
  assert.equal(maskPhone("+919876543210"), "+91 ••••• ••210");
  assert.equal(maskPhone("+919876543210").includes("98765"), false);
});

test("auth errors become one plain sentence each and never repeat the raw message", () => {
  const cases = [
    [{ code: "otp_expired", status: 403, message: "Token has expired or is invalid" }, "invalid_code"],
    [{ status: 403, message: "Token has expired or is invalid" }, "invalid_code"],
    [{ code: "over_sms_send_rate_limit", status: 429, message: "x" }, "rate_limited"],
    [{ status: 429, message: "x" }, "rate_limited"],
    [{ code: "sms_send_failed", status: 500, message: "Twilio said +919876543210 is not allowed" }, "sms_unavailable"],
    [{ code: "phone_provider_disabled", status: 400, message: "x" }, "sms_unavailable"],
    [{ code: "signup_disabled", status: 422, message: "x" }, "signups_closed"],
    [{ code: "email_not_confirmed", status: 400, message: "x" }, "unconfirmed"],
    [{ code: "invalid_credentials", status: 400, message: "x" }, "invalid_credentials"],
    [{ code: "weird", status: 500, message: "boom" }, "unknown"],
    [null, "unknown"],
  ];
  for (const [error, want] of cases) assert.equal(classifyAuthError(error), want, JSON.stringify(error));
  assert.equal(authErrorMessage({ code: "sms_send_failed", message: "Twilio said +919876543210 is not allowed" }).includes("9876"), false);
  assert.match(authErrorMessage({ code: "otp_expired" }), /wrong or has expired/);
});

// ---------------------------------------------------------------- the server actions

const SWAPS = {
  "next/headers": "tests/helpers/fake-next-headers.mjs",
  "next/cache": "tests/helpers/fake-next-cache.mjs",
  "@/lib/supabase/server": "tests/helpers/fake-supabase-server.mjs",
};
const form = (fields) => { const d = new FormData(); for (const [k, v] of Object.entries(fields)) if (v !== undefined) d.set(k, v); return d; };
const redirectOf = (e) => (/NEXT_REDIRECT/.test(String(e.message ?? e)) ? String(e.digest ?? "").split(";")[2] : null);
let n = 0;
let calls;
let errors;
const realError = console.error;

/** A fake client: `rows` maps table -> row, `auth` overrides individual auth methods. */
function install({ rows = {}, auth = {} } = {}) {
  calls = [];
  const rec = (name, result) => async (args) => { calls.push({ name, args }); return typeof result === "function" ? result(args) : result; };
  globalThis.__bsahTest = {
    headers: { "x-forwarded-for": `203.0.113.${(n++ % 250) + 1}`, host: "example.test", "x-forwarded-proto": "https" },
    supabase: {
      auth: {
        signInWithOAuth: rec("oauth", { data: { provider: "google", url: "https://accounts.google.com/o/oauth2/v2/auth?client_id=x" }, error: null }),
        signInWithOtp: rec("otp", { data: {}, error: null }),
        verifyOtp: rec("verify", { data: { user: { id: "u1" }, session: {} }, error: null }),
        signInWithPassword: rec("password", { data: { user: { id: "u1" } }, error: null }),
        signOut: rec("signout", { error: null }),
        resend: rec("resend", { error: null }),
        exchangeCodeForSession: rec("exchange", { data: {}, error: null }),
        getUser: rec("getUser", { data: { user: { id: "u1" } } }),
        ...Object.fromEntries(Object.entries(auth).map(([k, v]) => [k, rec(k, v)])),
      },
      from: (table) => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: rows[table] ?? null, error: rows[table] === undefined && table !== "users" && table !== "profiles" && table !== "member_accounts" ? { code: "42P01" } : null }) }) }) }),
    },
  };
}
let A;
let ADMIN;
beforeEach(async () => {
  errors = [];
  console.error = (...a) => errors.push(a.join(" "));
  A = await loadTsWith("app/auth/actions.ts", SWAPS);
  ADMIN = await loadTsWith("app/admin/actions.ts", SWAPS);
  install();
});
test.afterEach(() => { console.error = realError; });

test("google: starts the OAuth flow with the return address on this site and sends the visitor to Google", async () => {
  await assert.rejects(() => A.signInWithGoogle(form({})), (e) => redirectOf(e) === "https://accounts.google.com/o/oauth2/v2/auth?client_id=x");
  const { args } = calls.find((c) => c.name === "oauth");
  assert.equal(args.provider, "google");
  assert.equal(args.options.redirectTo, "https://example.test/auth/confirm?via=google");
  assert.equal(args.options.skipBrowserRedirect, true);
});

test("google: a safe return path is kept in the return address, an unsafe one is dropped", async () => {
  await assert.rejects(() => A.signInWithGoogle(form({ next: "/enroll/status" })));
  assert.equal(calls.find((c) => c.name === "oauth").args.options.redirectTo, "https://example.test/auth/confirm?via=google&next=%2Fenroll%2Fstatus");
  await assert.rejects(() => A.signInWithGoogle(form({ next: "//evil.example" })));
  assert.equal(calls.filter((c) => c.name === "oauth").at(-1).args.options.redirectTo, "https://example.test/auth/confirm?via=google");
  await assert.rejects(() => A.signInWithGoogle(form({ next: "https://evil.example" })));
  assert.equal(calls.filter((c) => c.name === "oauth").at(-1).args.options.redirectTo.includes("evil"), false);
});

test("google: when Supabase refuses to start the flow the visitor sees the Google message, not a crash", async () => {
  install({ auth: { signInWithOAuth: { data: { url: null }, error: { code: "provider_disabled", status: 400, message: "x" } } } });
  await assert.rejects(() => A.signInWithGoogle(form({})), (e) => redirectOf(e) === "/admin/login?e=oauth");
});

test("phone: a number is normalised, a text is requested, and the account is created by the first successful code", async () => {
  const state = await A.sendPhoneCode(null, form({ phone: "98765 43210", website: "" }));
  assert.equal(state.step, "code");
  assert.equal(state.phone, "+919876543210");
  assert.match(state.notice, /6-digit code/);
  assert.equal(state.notice.includes("98765 43210"), false, "the whole number is not repeated");
  const { args } = calls.find((c) => c.name === "otp");
  assert.deepEqual(args, { phone: "+919876543210", options: { channel: "sms", shouldCreateUser: true } });
});

test("phone: a bad number never reaches the SMS provider", async () => {
  for (const phone of ["12345", "abc", "", "+91 12345 67890"]) {
    const state = await A.sendPhoneCode(null, form({ phone }));
    assert.match(state.error, /mobile number/);
  }
  assert.equal(calls.length, 0);
});

test("phone: the hidden field catches bots, who get the normal-looking answer and no text", async () => {
  const state = await A.sendPhoneCode(null, form({ phone: "9876543210", website: "http://spam.example" }));
  assert.equal(state.step, "code");
  assert.equal(calls.length, 0);
});

test("phone: one number gets three texts in fifteen minutes, and one visitor five", async () => {
  const fixed = (ip) => { globalThis.__bsahTest.headers["x-forwarded-for"] = ip; };
  fixed("198.51.100.7");
  for (let i = 0; i < 3; i++) assert.equal((await A.sendPhoneCode(null, form({ phone: "9876543210" }))).step, "code");
  const fourth = await A.sendPhoneCode(null, form({ phone: "9876543210" }));
  assert.match(fourth.error, /already sent/);
  assert.equal(calls.filter((c) => c.name === "otp").length, 3);
  fixed("198.51.100.8");
  for (const p of ["9876543211", "9876543212", "9876543213", "9876543214", "9876543215"]) assert.equal((await A.sendPhoneCode(null, form({ phone: p }))).step, "code");
  assert.match((await A.sendPhoneCode(null, form({ phone: "9876543216" }))).error, /Too many codes/);
});

test("phone: provider failures are explained without the raw message or the number", async () => {
  install({ auth: { signInWithOtp: { data: {}, error: { code: "sms_send_failed", status: 500, message: "Twilio could not send to +919876543210" } } } });
  const state = await A.sendPhoneCode(null, form({ phone: "9876543210" }));
  assert.match(state.error, /could not send a text message/);
  assert.equal(state.error.includes("9876"), false);
  assert.equal(errors.join("").includes("9876"), false, "the number is not logged");
  install({ auth: { signInWithOtp: { data: {}, error: { code: "over_sms_send_rate_limit", status: 429, message: "x" } } } });
  assert.match((await A.sendPhoneCode(null, form({ phone: "9876543210" }))).error, /Too many attempts/);
});

test("phone: a correct code signs a parent in and lands on the registration portal", async () => {
  install({ rows: { users: { full_name: "New User", role: "PARENT" } } });
  await assert.rejects(() => A.verifyPhoneCode(null, form({ phone: "+919876543210", token: "123 456" })), (e) => redirectOf(e) === "/sovereign");
  assert.deepEqual(calls.find((c) => c.name === "verify").args, { phone: "+919876543210", token: "123456", type: "sms" });
});

test("phone: staff and admissions keep their own landing page, and a safe return path is honoured", async () => {
  install({ rows: { users: { full_name: "Staff", role: "SUPER_ADMIN" } } });
  await assert.rejects(() => A.verifyPhoneCode(null, form({ phone: "+919876543210", token: "123456", next: "/enroll/status" })), (e) => redirectOf(e) === "/admin");
  install({ rows: { users: { full_name: "Adm", role: "ADMISSIONS" } } });
  await assert.rejects(() => A.verifyPhoneCode(null, form({ phone: "+919876543210", token: "123456" })), (e) => redirectOf(e) === "/admin/applications");
  install({ rows: { users: { full_name: "P", role: "PARENT" } } });
  await assert.rejects(() => A.verifyPhoneCode(null, form({ phone: "+919876543210", token: "123456", next: "/enroll/status" })), (e) => redirectOf(e) === "/enroll/status");
  install({ rows: { users: { full_name: "P", role: "PARENT" } } });
  await assert.rejects(() => A.verifyPhoneCode(null, form({ phone: "+919876543210", token: "123456", next: "//evil.example" })), (e) => redirectOf(e) === "/sovereign");
});

test("phone: an expired or wrong code keeps the visitor on the code step with one friendly answer", async () => {
  install({ auth: { verifyOtp: { data: { user: null, session: null }, error: { code: "otp_expired", status: 403, message: "Token has expired or is invalid" } } } });
  const state = await A.verifyPhoneCode(null, form({ phone: "+919876543210", token: "000000" }));
  assert.equal(state.step, "code");
  assert.equal(state.phone, "+919876543210");
  assert.match(state.error, /wrong or has expired/);
  assert.equal(calls.some((c) => c.name === "signout"), false);
});

test("phone: malformed codes never reach Supabase; ten wrong tries lock the number for a while", async () => {
  for (const token of ["12345", "abcdef", "", "1234567"]) assert.match((await A.verifyPhoneCode(null, form({ phone: "+919876543210", token }))).error, /6-digit code/);
  assert.equal(calls.length, 0);
  assert.match((await A.verifyPhoneCode(null, form({ phone: "garbage", token: "123456" }))).error, /Start again/);
  install({ auth: { verifyOtp: { data: { user: null }, error: { code: "otp_expired", message: "x" } } } });
  globalThis.__bsahTest.headers["x-forwarded-for"] = "198.51.100.99";
  for (let i = 0; i < 10; i++) assert.match((await A.verifyPhoneCode(null, form({ phone: "+919000000009", token: "000000" }))).error, /wrong or has expired/);
  assert.match((await A.verifyPhoneCode(null, form({ phone: "+919000000009", token: "000000" }))).error, /Too many wrong codes/);
  assert.equal(calls.filter((c) => c.name === "verifyOtp").length, 10);
});

test("phone: a verified number with no profile row is signed out again instead of being left half signed in", async () => {
  install({ rows: {} });
  const state = await A.verifyPhoneCode(null, form({ phone: "+919876543210", token: "123456" }));
  assert.match(state.error, /not set up/);
  assert.equal(calls.some((c) => c.name === "signout"), true);
});

test("e-mail: an unconfirmed address is told to confirm first, and can ask for the link again", async () => {
  install({ auth: { signInWithPassword: { data: { user: null }, error: { code: "email_not_confirmed", status: 400, message: "Email not confirmed" } } } });
  const state = await ADMIN.signIn(null, form({ email: "asha@example.test", password: "correct-horse-9" }));
  assert.equal(state.unconfirmed, true);
  assert.match(state.error, /confirm your e-mail/);
  const sent = await A.resendConfirmation(null, form({ email: "Asha@Example.test" }));
  assert.match(sent.notice, /If that address/);
  assert.deepEqual(calls.find((c) => c.name === "resend").args, { type: "signup", email: "asha@example.test", options: { emailRedirectTo: "https://example.test/auth/confirm?via=signup" } });
});

test("e-mail: wrong credentials give the generic answer, never which part was wrong", async () => {
  install({ auth: { signInWithPassword: { data: { user: null }, error: { code: "invalid_credentials", status: 400, message: "Invalid login credentials" } } } });
  const state = await ADMIN.signIn(null, form({ email: "asha@example.test", password: "wrong-password-1" }));
  assert.equal(state.error, "Those details did not match an account.");
  assert.equal(state.unconfirmed, undefined);
});

test("e-mail: a resend always answers the same way, whether or not the address has an account", async () => {
  install({ auth: { resend: { error: { code: "user_not_found", status: 400, message: "x" } } } });
  assert.match((await A.resendConfirmation(null, form({ email: "nobody@example.test" }))).notice, /If that address/);
  assert.match((await A.resendConfirmation(null, form({ email: "not-an-email" }))).error, /e-mail address/);
});

// ---------------------------------------------------------------- the return route

const R = await loadTsWith("app/auth/confirm/route.ts", SWAPS);
const { NextRequest } = await import("next/server.js");
const hit = async (query) => {
  const res = await R.GET(new NextRequest(`https://example.test/auth/confirm?${query}`));
  return res.headers.get("location");
};

test("return route: a Google return exchanges the code and lands where the role says", async () => {
  install({ rows: { users: { full_name: "P", role: "PARENT" } } });
  assert.equal(await hit("via=google&code=abc"), "https://example.test/sovereign");
  assert.deepEqual(calls.find((c) => c.name === "exchange").args, "abc");
  install({ rows: { users: { full_name: "S", role: "SUPER_ADMIN" } } });
  assert.equal(await hit("via=google&code=abc&next=%2Fenroll"), "https://example.test/admin");
  install({ rows: { users: { full_name: "P", role: "PARENT" } } });
  assert.equal(await hit("via=google&code=abc&next=%2Fenroll%2Fstatus"), "https://example.test/enroll/status");
  assert.equal(await hit("via=google&code=abc&next=%2F%5Cevil.example"), "https://example.test/sovereign");
});

test("return route: the sign-up confirmation link lands by role, and a failed link shows the expired-link message", async () => {
  install({ rows: { users: { full_name: "P", role: "PARENT" } } });
  assert.equal(await hit("via=signup&code=abc"), "https://example.test/sovereign");
  install({ rows: { member_accounts: { profile_id: "u1" }, users: undefined } });
  assert.equal(await hit("via=signup&code=abc"), "https://example.test/account");
  install({ auth: { exchangeCodeForSession: { data: {}, error: { code: "flow_state_not_found", message: "x" } } } });
  assert.equal(await hit("via=signup&code=old"), "https://example.test/admin/login?e=link");
});

test("return route: consent refused, a stale code or no profile shows the Google message and no session is left", async () => {
  install();
  assert.equal(await hit("via=google&error=access_denied&error_code=unexpected_failure"), "https://example.test/admin/login?e=oauth");
  assert.equal(calls.some((c) => c.name === "exchange"), false);
  install({ auth: { exchangeCodeForSession: { data: {}, error: { code: "bad_code_verifier", message: "x" } } } });
  assert.equal(await hit("via=google&code=stale"), "https://example.test/admin/login?e=oauth");
  install({ rows: {} });
  assert.equal(await hit("via=google&code=abc"), "https://example.test/admin/login?e=profile");
  assert.equal(calls.some((c) => c.name === "signout"), true);
});

test("return route: e-mail links behave exactly as before (relative next only, /admin by default, expired link message)", async () => {
  install();
  assert.equal(await hit("code=abc&next=%2Fadmin%2Freset"), "https://example.test/admin/reset");
  assert.equal(await hit("code=abc"), "https://example.test/admin");
  assert.equal(await hit("code=abc&next=https%3A%2F%2Fevil.example"), "https://example.test/admin");
  assert.equal(await hit("token_hash=h&type=recovery&next=%2Fadmin%2Freset"), "https://example.test/admin/reset");
  install({ auth: { verifyOtp: { data: {}, error: { code: "otp_expired", message: "x" } } } });
  assert.equal(await hit("token_hash=h&type=signup"), "https://example.test/admin/login?e=link");
  assert.equal(await hit("error=access_denied&error_code=otp_expired"), "https://example.test/admin/login?e=link");
  assert.equal(await hit(""), "https://example.test/admin/login?e=link");
});
