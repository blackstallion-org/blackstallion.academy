// Server action tests for submitLead (app/actions.ts). Synthetic data only; every network call goes to a loopback
// receiver started by the test. Proves: validation, consent, honesty when unconfigured/failing, idempotency,
// rate limiting, v2 → v1 database fallback, webhook delivery shape. Does NOT prove production persistence.
import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { loadTs, loopback } from "./helpers/load-ts.mjs";

const common = { name: "BSAH Synthetic QA", email: "qa@example.test", phone: "+919999999999", organisation: "Synthetic QA Institution", message: "Synthetic enquiry." };
const byGate = {
  parents: { ...common, student: "Synthetic Student, 12", zone: "Hyderabad", tier: "Squire" },
  schools: { ...common, acreage: "1 acre", capacity: "150" },
  partners: { ...common, acreage: "1 acre", capacity: "150" },
  audit: { ...common, designation: "Synthetic representative", date: "2099-12-01", slot: "Morning" },
  hub: common,
  mou: common,
};
let n = 0;
const key = () => `testkey_${String(++n).padStart(12, "0")}`;
const form = (gate, fields = {}, extra = {}) => {
  const data = new FormData();
  for (const [k, v] of Object.entries({ gate, consent: "yes", idem: key(), ...fields, ...extra })) if (v !== undefined) data.set(k, v);
  return data;
};
const env = (vars) => {
  for (const k of ["SUPABASE_URL", "SUPABASE_PUBLISHABLE_KEY", "LEAD_WEBHOOK_URL", "LEAD_WEBHOOK_SECRET", "TURNSTILE_SECRET_KEY", "FORMSPREE_ENDPOINT", "RESEND_API_KEY", "RESEND_API_URL", "LEAD_NOTIFY_EMAIL", "RESEND_CONFIRMATIONS", "RESEND_FROM"]) delete process.env[k];
  Object.assign(process.env, vars);
};
let submitLead;
beforeEach(async () => {
  env({});
  ({ submitLead } = await loadTs("app/actions.ts")); // fresh module: empty limiter and delivered-key cache
});

test("every gate rejects empty required fields with field errors", async () => {
  for (const gate of Object.keys(byGate)) {
    const r = await submitLead(null, form(gate));
    assert.equal(r.status, "invalid", gate);
    assert.ok(Object.keys(r.errors).length > 0, gate);
  }
});

test("bad email, past or impossible dates, junk phone, unknown gate and honeypot are refused", async () => {
  assert.equal((await submitLead(null, form("mou", { ...common, email: "invalid" }))).status, "invalid");
  assert.equal((await submitLead(null, form("audit", { ...byGate.audit, date: "2020-01-01" }))).status, "invalid");
  assert.equal((await submitLead(null, form("audit", { ...byGate.audit, date: "2099-02-31" }))).status, "invalid");
  assert.equal((await submitLead(null, form("mou", { ...common, phone: "--------" }))).status, "invalid");
  assert.equal((await submitLead(null, form("nope", common))).status, "invalid");
  assert.equal((await submitLead(null, form("parents", { ...byGate.parents, website: "bot" }))).status, "invalid");
});

test("consent is required on every gate", async () => {
  for (const [gate, fields] of Object.entries(byGate)) {
    const r = await submitLead(null, form(gate, fields, { consent: undefined }));
    assert.equal(r.status, "invalid", gate);
    assert.ok(r.errors.consent, gate);
  }
});

test("no backend configured: honest 'not_configured', values kept, bookkeeping fields not echoed", async () => {
  const r = await submitLead(null, form("mou", common, { attr_path: "/schools/mou" }));
  assert.equal(r.status, "not_configured");
  assert.equal(r.ok, false);
  assert.equal(r.values.name, common.name);
  assert.equal(r.values.idem, undefined);
  assert.equal(r.values.attr_path, undefined);
});

test("webhook: each gate delivered once with consent, attribution and idempotency key", async () => {
  const hook = await loopback(() => ({}));
  try {
    env({ LEAD_WEBHOOK_URL: hook.url, LEAD_WEBHOOK_SECRET: "test-secret" });
    for (const [gate, fields] of Object.entries(byGate)) {
      ({ submitLead } = await loadTs("app/actions.ts")); // fresh limiter per gate: this test is about delivery, not limits
      const r = await submitLead(null, form(gate, fields, { attr_path: `/${gate}`, attr_utm_source: "flyer", attr_ip: "1.2.3.4" }));
      assert.equal(r.status, "sent", `${gate}: ${JSON.stringify(r.errors)}`);
    }
    assert.equal(hook.requests.length, Object.keys(byGate).length);
    const last = hook.requests.at(-1);
    assert.equal(last.headers.authorization, "Bearer test-secret");
    assert.match(last.headers["idempotency-key"], /^testkey_/);
    assert.equal(last.body.consent, true);
    assert.deepEqual(last.body.attribution, { path: "/mou", utm_source: "flyer" });
    assert.equal(last.body.fields.email, common.email);
  } finally {
    await hook.close();
  }
});

test("webhook only: the same idempotency key is delivered once (double click / retry)", async () => {
  const hook = await loopback(() => ({}));
  try {
    env({ LEAD_WEBHOOK_URL: hook.url });
    const a = await submitLead(null, form("mou", common, { idem: "dup_key_000000000001" }));
    const b = await submitLead(null, form("mou", common, { idem: "dup_key_000000000001" }));
    assert.equal(a.status, "sent");
    assert.equal(b.status, "sent");
    assert.match(b.message, /Already received/);
    assert.equal(hook.requests.length, 1);
  } finally {
    await hook.close();
  }
});

test("receiver failure: 'failed', never success, values preserved", async () => {
  const hook = await loopback(() => ({ status: 503 }));
  try {
    env({ LEAD_WEBHOOK_URL: hook.url });
    const r = await submitLead(null, form("mou", common));
    assert.equal(r.status, "failed");
    assert.equal(r.ok, false);
    assert.equal(r.values.organisation, common.organisation);
  } finally {
    await hook.close();
  }
});

test("database v2: stored, then duplicate reported as already received; rate limit RPC consulted", async () => {
  let duplicate = false;
  const db = await loopback((req) => {
    if (req.url.endsWith("/consume_rate_limit")) return { reply: true };
    if (req.url.endsWith("/submit_lead_v2")) { const reply = { status: duplicate ? "duplicate" : "stored" }; duplicate = true; return { reply }; }
    return { status: 500 };
  });
  try {
    env({ SUPABASE_URL: db.url, SUPABASE_PUBLISHABLE_KEY: "synthetic-test-only" });
    const first = await submitLead(null, form("parents", byGate.parents, { idem: "db_key_0000000000001", attr_hub: "zone-01a" }));
    assert.equal(first.status, "sent");
    const v2 = db.requests.find((r) => r.url.endsWith("/submit_lead_v2")).body;
    assert.equal(v2.p_type, "cadet");
    assert.equal(v2.p_gate, "parents");
    assert.equal(v2.p_consent, true);
    assert.equal(v2.p_idempotency_key, "db_key_0000000000001");
    assert.deepEqual(v2.p_attribution, { hub: "zone-01a" });
    assert.equal(v2.p_email, common.email);
    assert.equal(v2.p_payload.email, undefined, "contact fields are columns, not payload");
    ({ submitLead } = await loadTs("app/actions.ts")); // new instance: only the database can spot the duplicate
    const second = await submitLead(null, form("parents", byGate.parents, { idem: "db_key_0000000000001" }));
    assert.equal(second.status, "sent");
    assert.match(second.message, /Already received/);
    assert.ok(db.requests.some((r) => r.url.endsWith("/consume_rate_limit")));
  } finally {
    await db.close();
  }
});

test("database without the v2 migration falls back to the original submit_lead", async () => {
  const db = await loopback((req) => (req.url.endsWith("/submit_lead_v2") ? { status: 404 } : { reply: true }));
  try {
    env({ SUPABASE_URL: db.url, SUPABASE_PUBLISHABLE_KEY: "synthetic-test-only" });
    const r = await submitLead(null, form("mou", common));
    assert.equal(r.status, "sent");
    const v1 = db.requests.find((x) => x.url.endsWith("/rpc/submit_lead")).body;
    assert.equal(v1.p_type, "school");
    assert.equal(v1.p_payload.consent, "yes");
  } finally {
    await db.close();
  }
});

test("database unreachable (e.g. paused project): 'failed', never success", async () => {
  env({ SUPABASE_URL: "http://127.0.0.1:9", SUPABASE_PUBLISHABLE_KEY: "synthetic-test-only" });
  const r = await submitLead(null, form("mou", common));
  assert.equal(r.status, "failed");
  assert.equal(r.ok, false);
});

test("rate limit: the sixth submission in ten minutes from one client is refused and nothing is sent", async () => {
  const hook = await loopback(() => ({}));
  try {
    env({ LEAD_WEBHOOK_URL: hook.url });
    const statuses = [];
    for (let i = 0; i < 6; i++) statuses.push((await submitLead(null, form("mou", common))).status);
    assert.deepEqual(statuses, ["sent", "sent", "sent", "sent", "sent", "rate_limited"]);
    assert.equal(hook.requests.length, 5);
  } finally {
    await hook.close();
  }
});

test("Turnstile enabled: a submission without a token is blocked before delivery", async () => {
  const hook = await loopback(() => ({}));
  try {
    env({ LEAD_WEBHOOK_URL: hook.url, TURNSTILE_SECRET_KEY: "test-secret" });
    const r = await submitLead(null, form("mou", common));
    assert.equal(r.status, "blocked");
    assert.equal(hook.requests.length, 0);
  } finally {
    await hook.close();
    delete process.env.TURNSTILE_SECRET_KEY;
  }
});

test("Formspree only: validated enquiry forwarded once as flat JSON with subject, reference and source", async () => {
  const fs = await loopback(() => ({ reply: { ok: true } }));
  try {
    env({ FORMSPREE_ENDPOINT: `${fs.url}/f/test` });
    const r = await submitLead(null, form("schools", byGate.schools, { attr_utm_source: "flyer", idem: "fs_key_000000000001" }));
    assert.equal(r.status, "sent");
    assert.equal(fs.requests.length, 1);
    const b = fs.requests[0].body;
    assert.equal(fs.requests[0].headers.accept, "application/json");
    assert.match(b._subject, /Campus partnership enquiry/);
    assert.equal(b.reference, "fs_key_000000000001");
    assert.equal(b.source_utm_source, "flyer");
    assert.equal(b.email, common.email);
    assert.equal(b.consent, "yes");
  } finally {
    await fs.close();
  }
});

test("database down but Formspree up: the enquiry is still received (not lost), no false failure", async () => {
  const fs = await loopback(() => ({}));
  try {
    env({ SUPABASE_URL: "http://127.0.0.1:9", SUPABASE_PUBLISHABLE_KEY: "sb_publishable_test", FORMSPREE_ENDPOINT: `${fs.url}/f/test` });
    const r = await submitLead(null, form("mou", common));
    assert.equal(r.status, "sent");
    assert.equal(fs.requests.length, 1);
  } finally {
    await fs.close();
  }
});

test("Resend: internal notification with idempotency key, escaped content, no receipt unless enabled", async () => {
  const mail = await loopback(() => ({ reply: { id: "em_1" } }));
  try {
    env({ RESEND_API_KEY: "re_test_only", RESEND_API_URL: `${mail.url}/emails`, LEAD_NOTIFY_EMAIL: "office@example.test" });
    const r = await submitLead(null, form("mou", { ...common, message: "<script>alert(1)</script>" }, { idem: "mail_key_00000000001" }));
    assert.equal(r.status, "sent", "e-mail is the only channel here, so its success counts as delivery");
    assert.equal(mail.requests.length, 1);
    const m = mail.requests[0];
    assert.equal(m.headers.authorization, "Bearer re_test_only");
    assert.equal(m.headers["idempotency-key"], "lead-notify/mail_key_00000000001");
    assert.deepEqual(m.body.to, ["office@example.test"]);
    assert.equal(m.body.reply_to, common.email);
    assert.match(m.body.subject, /MOU request/);
    assert.ok(!m.body.html.includes("<script>"), "user input is escaped");
    assert.ok(m.body.html.includes("&lt;script&gt;"));
  } finally {
    await mail.close();
  }
});

test("Resend: receipt to the enquirer only when RESEND_CONFIRMATIONS=1; e-mail failure with no other channel is 'failed'", async () => {
  const mail = await loopback(() => ({ reply: { id: "x" } }));
  try {
    env({ RESEND_API_KEY: "re_test_only", RESEND_API_URL: `${mail.url}/emails`, LEAD_NOTIFY_EMAIL: "office@example.test", RESEND_CONFIRMATIONS: "1" });
    await submitLead(null, form("parents", byGate.parents, { idem: "mail_key_00000000002" }));
    assert.equal(mail.requests.length, 2);
    assert.deepEqual(mail.requests[1].body.to, [common.email]);
    assert.equal(mail.requests[1].headers["idempotency-key"], "lead-receipt/mail_key_00000000002");
  } finally {
    await mail.close();
  }
  const down = await loopback(() => ({ status: 500 }));
  try {
    env({ RESEND_API_KEY: "re_test_only", RESEND_API_URL: `${down.url}/emails`, LEAD_NOTIFY_EMAIL: "office@example.test" });
    ({ submitLead } = await loadTs("app/actions.ts"));
    assert.equal((await submitLead(null, form("mou", common))).status, "failed");
  } finally {
    await down.close();
  }
});

test("new-format Supabase keys are sent only as apikey (never as a Bearer token)", async () => {
  const db = await loopback((req) => (req.url.endsWith("/consume_rate_limit") ? { reply: true } : { reply: { status: "stored" } }));
  try {
    env({ SUPABASE_URL: db.url, SUPABASE_PUBLISHABLE_KEY: "sb_publishable_test_only" });
    assert.equal((await submitLead(null, form("mou", common))).status, "sent");
    for (const r of db.requests) {
      assert.equal(r.headers.apikey, "sb_publishable_test_only");
      assert.equal(r.headers.authorization, undefined);
    }
  } finally {
    await db.close();
  }
});
