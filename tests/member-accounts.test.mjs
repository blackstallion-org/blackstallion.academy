// Self-service accounts (student, parent, teacher, school): the form rules shared by the page and the server action, and the
// create-account action against a fake Supabase client. Synthetic data only. The database side (trigger, RLS, review function)
// is proved by supabase/tests/50_member_accounts_tests.sql; this file does NOT prove those.
import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { loadTs, loadTsWith, root } from "./helpers/load-ts.mjs";

const K = await loadTs("lib/accounts/kinds.ts");

const base = { email: "Asha@Example.Test", password: "correct-horse-9", confirm: "correct-horse-9", full_name: "Asha Rao", consent: "yes" };
const student = { ...base, kind: "student", age_band: "11 to 13", city: "Hyderabad", guardian: "Ravi Rao, 90000 11111" };
const teacher = { ...base, kind: "teacher", organisation: "Greenfield School", city: "Pune", title: "Games coach", phone: "+91 90000 22222" };
const school = { ...base, kind: "school", full_name: "Mr Iyer", organisation: "Greenfield School", city: "Pune", board: "CBSE", size: "300 to 800", phone: "+91 90000 33333" };
const parent = { ...base, kind: "parent", children: "Meera, 9", phone: "90000 44444" };

test("the four kinds, and only those, can be chosen", () => {
  assert.deepEqual([...K.MEMBER_KINDS], ["student", "parent", "teacher", "school"]);
  for (const bad of ["executive_admin", "operations", "admin", "cadet", "", undefined, null, "Student"]) {
    assert.equal(K.isMemberKind(bad), false, String(bad));
    const r = K.parseSignUp({ ...student, kind: bad });
    assert.equal(r.ok, false);
  }
  assert.deepEqual(Object.entries(K.KINDS).filter(([, v]) => v.reviewed).map(([k]) => k).sort(), ["school", "teacher"]);
});

test("a valid sign-up for each kind is accepted and shaped for the database trigger", () => {
  const s = K.parseSignUp(student);
  assert.equal(s.ok, true);
  assert.equal(s.value.email, "asha@example.test", "e-mail is lower-cased");
  assert.equal(s.value.city, "Hyderabad");
  assert.deepEqual(s.value.details, { age_band: "11 to 13", guardian: "Ravi Rao, 90000 11111" }, "only non-column answers go into details");
  const t = K.parseSignUp(teacher);
  assert.equal(t.ok, true);
  assert.equal(t.value.organisation, "Greenfield School");
  assert.equal(t.value.phone, "+91 90000 22222");
  assert.deepEqual(t.value.details, { title: "Games coach" });
  const sc = K.parseSignUp(school);
  assert.equal(sc.ok, true);
  assert.deepEqual(sc.value.details, { board: "CBSE", size: "300 to 800" });
  const p = K.parseSignUp(parent);
  assert.equal(p.ok, true);
  assert.deepEqual(p.value.details, { children: "Meera, 9" });
  for (const v of [s, t, sc, p]) assert.equal("role" in v.value || "status" in v.value, false, "the form can never carry a role or status");
});

test("required fields, passwords, consent and options are enforced", () => {
  assert.equal(K.parseSignUp({ ...teacher, organisation: "" }).ok, false, "a teacher must name the school");
  assert.equal(K.parseSignUp({ ...school, phone: "" }).ok, false, "a school must give a phone");
  assert.equal(K.parseSignUp({ ...student, age_band: "" }).ok, false, "a student must give an age band");
  assert.equal(K.parseSignUp({ ...student, age_band: "200" }).ok, false, "an option outside the list");
  assert.equal(K.parseSignUp({ ...base, kind: "parent", phone: "abc" }).ok, false, "a phone with letters");
  assert.match(K.parseSignUp({ ...student, password: "short1", confirm: "short1" }).error, /12 characters/);
  assert.match(K.parseSignUp({ ...student, password: "onlyletterslong", confirm: "onlyletterslong" }).error, /number/);
  assert.match(K.parseSignUp({ ...student, confirm: "different-pass-9" }).error, /do not match/);
  assert.match(K.parseSignUp({ ...student, consent: undefined }).error, /tick the box/);
  assert.equal(K.parseSignUp({ ...student, email: "not-an-email" }).ok, false);
  assert.equal(K.parseSignUp({ ...student, full_name: "A" }).ok, false);
  assert.equal(K.parseSignUp({ ...student, guardian: "x".repeat(161) }).ok, false, "over-long answers are refused, not clipped silently");
});

test("a member can edit only their own answers, never kind, status or e-mail", () => {
  const r = K.parseProfileUpdate("school", { full_name: "Mr Iyer", organisation: "Greenfield", city: "Pune", phone: "90000 33333", board: "ICSE / ISC", size: "", kind: "student", status: "active", email: "x@y.z", role: "executive_admin" });
  assert.equal(r.ok, true);
  assert.deepEqual(Object.keys(r.value).sort(), ["city", "details", "full_name", "organisation", "phone"]);
  assert.deepEqual(r.value.details, { board: "ICSE / ISC" });
  assert.equal(K.parseProfileUpdate("teacher", { full_name: "T", organisation: "S", city: "C" }).ok, false);
});

// ---------------------------------------------------------------- the create-account action

const SWAPS = {
  "next/headers": "tests/helpers/fake-next-headers.mjs",
  "next/cache": "tests/helpers/fake-next-cache.mjs",
  "@/lib/supabase/server": "tests/helpers/fake-supabase-server.mjs",
};
const form = (fields) => { const d = new FormData(); for (const [k, v] of Object.entries(fields)) if (v !== undefined) d.set(k, v); return d; };
const FIELDS = { ...student, website: "" };
let actions;
let calls;
let errors;
const realError = console.error;
function installSupabase(result) {
  calls = [];
  globalThis.__bsahTest = { headers: { "x-forwarded-for": `198.51.100.${Math.floor(Math.random() * 250)}`, host: "example.test" }, supabase: { auth: { signUp: async (args) => { calls.push(args); return result; } } } };
}
beforeEach(async () => {
  errors = [];
  console.error = (...a) => errors.push(a.join(" "));
  actions = await loadTsWith("app/account/actions.ts", SWAPS);
  installSupabase({ data: { user: { id: "u1" }, session: null }, error: null });
});
test.afterEach(() => { console.error = realError; });

test("createAccount: a good form signs up with the kind in the metadata and nothing privileged", async () => {
  const state = await actions.createAccount(null, form(FIELDS));
  assert.match(state.notice, /e-mail/);
  assert.equal(calls.length, 1);
  const { email, password, options } = calls[0];
  assert.equal(email, "asha@example.test");
  assert.equal(password, FIELDS.password);
  assert.deepEqual(Object.keys(options.data).sort(), ["city", "details", "full_name", "member_kind", "organisation", "phone"]);
  assert.equal(options.data.member_kind, "student");
  assert.match(options.emailRedirectTo, /\/auth\/confirm\?next=\/account$/);
  assert.equal(JSON.stringify(calls[0]).includes("executive_admin"), false);
});

test("createAccount: a bad form never reaches Supabase and says what is wrong", async () => {
  const state = await actions.createAccount(null, form({ ...FIELDS, kind: "admin" }));
  assert.match(state.error, /Choose who you are/);
  const weak = await actions.createAccount(null, form({ ...FIELDS, password: "short", confirm: "short" }));
  assert.match(weak.error, /12 characters/);
  assert.equal(calls.length, 0);
});

test("createAccount: the hidden field catches bots, who get the same friendly answer and no account", async () => {
  const state = await actions.createAccount(null, form({ ...FIELDS, website: "http://spam.example" }));
  assert.match(state.notice, /e-mail/);
  assert.equal(calls.length, 0);
});

test("createAccount: an address that is already registered gets a generic answer that does not reveal it", async () => {
  installSupabase({ data: { user: null, session: null }, error: { code: "user_already_exists", status: 422, message: "User already registered asha@example.test" } });
  const state = await actions.createAccount(null, form(FIELDS));
  assert.match(state.error, /could not create that account/);
  assert.equal(state.error.includes("asha@example.test"), false);
  assert.equal(errors.join("").includes("asha@example.test"), false, "the e-mail is not written to the log either");
});

test("createAccount: a weak-password answer from Supabase is translated, a rate limit is explained", async () => {
  installSupabase({ data: { user: null, session: null }, error: { code: "weak_password", status: 422, message: "x" } });
  assert.match((await actions.createAccount(null, form(FIELDS))).error, /too easy to guess/);
  installSupabase({ data: { user: null, session: null }, error: { code: "over_email_send_rate_limit", status: 429, message: "x" } });
  assert.match((await actions.createAccount(null, form(FIELDS))).error, /wait a few minutes/);
});

test("createAccount: when the project hands back a session, the member goes straight to their account", async () => {
  installSupabase({ data: { user: { id: "u1" }, session: { access_token: "t" } }, error: null });
  await assert.rejects(() => actions.createAccount(null, form(FIELDS)), (e) => /NEXT_REDIRECT/.test(String(e.message ?? e)) && /\/account/.test(String(e.digest ?? "")));
});

test("createAccount: no Supabase configured is reported, not crashed", async () => {
  globalThis.__bsahTest = { supabase: null };
  assert.match((await actions.createAccount(null, form(FIELDS))).error, /not switched on/);
});

test("createAccount: the sixth sign-up from one connection in an hour is refused", async () => {
  const headers = { "x-forwarded-for": "192.0.2.99", host: "example.test" };
  let last;
  for (let i = 0; i < 6; i++) {
    globalThis.__bsahTest = { headers, supabase: { auth: { signUp: async () => ({ data: { user: { id: "u" }, session: null }, error: null }) } } };
    last = await actions.createAccount(null, form({ ...FIELDS, email: `n${i}@example.test` }));
  }
  assert.match(last.error, /Too many accounts/);
});

test("sources: no client code names a role or status, and the review action checks staff first", async () => {
  const src = async (f) => readFile(path.join(root, f), "utf8");
  const [forms, actionsSrc, review] = await Promise.all([src("app/account/forms.tsx"), src("app/account/actions.ts"), src("app/admin/accounts/actions.ts")]);
  for (const text of [forms, actionsSrc]) assert.equal(/name="(role|status)"/.test(text) || /\brole:\s/.test(text), false);
  assert.ok(review.indexOf("requireStaff()") < review.indexOf('data.get("status")'), "the staff check runs before any input is read");
});
