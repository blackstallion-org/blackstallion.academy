// Registration and admissions: the shared rules (lib/registration/model.ts), the Razorpay order and webhook parsing
// (lib/registration/razorpay.ts), the notification texts (lib/registration/notify.ts), and wiring checks on the routes,
// the migration and the webhook. The database side (RLS, functions, duplicates, payments) is tested on the live-schema
// replica: supabase/live/tests/70_registration_tests.sql (run.sh). Run with `npm test`.
import { test } from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { loadTs, root } from "./helpers/load-ts.mjs";

const m = await loadTs("lib/registration/model.ts");
const rz = await loadTs("lib/registration/razorpay.ts");
const read = (rel) => readFileSync(path.join(root, rel), "utf8");
const SQL = read("supabase/live/migrations/20261104001400_registration_admissions.sql");

test("the review moves match the database function exactly", () => {
  assert.deepEqual(m.REVIEW_MOVES, { submitted: ["under_review", "info_required", "approved", "rejected"], under_review: ["info_required", "approved", "rejected"] });
  assert.match(SQL, /a\.status = 'submitted' and p_to in \('under_review', 'info_required', 'approved', 'rejected'\)/);
  assert.match(SQL, /a\.status = 'under_review' and p_to in \('info_required', 'approved', 'rejected'\)/);
  for (const from of m.APPLICATION_STATUSES) for (const to of m.APPLICATION_STATUSES) {
    const allowed = (from === "submitted" && ["under_review", "info_required", "approved", "rejected"].includes(to)) || (from === "under_review" && ["info_required", "approved", "rejected"].includes(to));
    assert.equal(m.canReview(from, to), allowed, `${from} -> ${to}`);
  }
  assert.equal(m.canReview("approved", "enrolled"), false, "enrolment is its own step");
  assert.equal(m.canReview("rejected", "approved"), false, "a decision is final");
});

test("statuses and kinds are the database's own enums", () => {
  assert.match(SQL, /create type public\.application_kind as enum \('cadet', 'school', 'staff', 'partner'\)/);
  assert.match(SQL, /\('draft', 'submitted', 'under_review', 'info_required', 'approved', 'rejected', 'enrolled', 'withdrawn'\)/);
  assert.deepEqual([...m.APPLICATION_STATUSES], ["draft", "submitted", "under_review", "info_required", "approved", "rejected", "enrolled", "withdrawn"]);
  assert.deepEqual([...m.APPLICATION_KINDS], ["cadet", "school", "staff", "partner"]);
  for (const t of m.DOC_TYPES) assert.match(SQL, new RegExp(`'${t}'`), `document type ${t} is allowed by the table`);
});

test("documents: only real PDFs and images, renamed safely", () => {
  const pdf = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31]);
  const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a]);
  const jpg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0]);
  const webp = new Uint8Array([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50]);
  assert.deepEqual(m.checkDocument({ name: "Birth Certificate (1).PDF", type: "application/pdf", size: 1000 }, pdf), { ok: true, safeName: "Birth-Certificate-1.pdf" });
  assert.equal(m.checkDocument({ name: "a.png", type: "image/png", size: 10 }, png).ok, true);
  assert.equal(m.checkDocument({ name: "a.jpg", type: "image/jpeg", size: 10 }, jpg).ok, true);
  assert.equal(m.checkDocument({ name: "a.webp", type: "image/webp", size: 10 }, webp).ok, true);
  assert.equal(m.checkDocument({ name: "evil.pdf", type: "application/pdf", size: 1000 }, new Uint8Array([0x4d, 0x5a, 0x90, 0])).ok, false, "an executable renamed .pdf");
  assert.equal(m.checkDocument({ name: "a.svg", type: "image/svg+xml", size: 10 }, pdf).ok, false, "SVG can carry script");
  assert.equal(m.checkDocument({ name: "big.pdf", type: "application/pdf", size: 10 * 1024 * 1024 + 1 }, pdf).ok, false);
  assert.equal(m.checkDocument({ name: "empty.pdf", type: "application/pdf", size: 0 }, pdf).ok, false);
  assert.equal(m.checkDocument({ name: "../../etc/passwd.pdf", type: "application/pdf", size: 5 }, pdf).safeName, "etc-passwd.pdf", "no path travels into the object name");
  assert.equal(m.MAX_DOC_BYTES, 10485760);
  assert.match(SQL, /size_bytes between 1 and 10485760/);
});

test("each kind requires the documents the database requires", () => {
  assert.deepEqual([...m.DOCS_FOR.cadet.required], ["proof_of_age"]);
  assert.deepEqual([...m.DOCS_FOR.staff.required], ["cv"]);
  assert.deepEqual([...m.DOCS_FOR.school.required], []);
  assert.match(SQL, /when 'cadet' then array\['proof_of_age'\] when 'staff' then array\['cv'\]/);
});

test("child details: names, a real date of birth, sensible ages", () => {
  const ok = m.childSchema.safeParse({ first_name: "Meera", last_name: "Rao", date_of_birth: "2015-06-01", riding_experience: "none" });
  assert.equal(ok.success, true);
  assert.equal(m.childSchema.safeParse({ first_name: "", last_name: "Rao", date_of_birth: "2015-06-01" }).success, false);
  assert.equal(m.childSchema.safeParse({ first_name: "A", last_name: "B", date_of_birth: "1980-01-01" }).success, false, "not a minor");
  assert.equal(m.childSchema.safeParse({ first_name: "A", last_name: "B", date_of_birth: "2025-01-01" }).success, false, "too young");
  assert.equal(m.childSchema.safeParse({ first_name: "A", last_name: "B", date_of_birth: "01/02/2015" }).success, false);
  assert.equal(m.ageOn("2016-11-05", new Date("2026-11-04T00:00:00Z")), 9, "the day before the birthday");
  assert.equal(m.ageOn("2016-11-04", new Date("2026-11-04T00:00:00Z")), 10, "on the birthday");
});

test("each kind's answers are validated, and unknown fields are dropped", () => {
  const school = { institution_name: "Delhi Public School", board: "CBSE", city: "Hyderabad", state: "Telangana", representative_designation: "Principal",
    representative_phone: "+91 98480 12345", official_email: "Principal@DPS.edu.in", student_strength: "1800", campus_area_acres: "6", authorised: "on", role: "SUPER_ADMIN" };
  const s = m.parsePayload("school", school);
  assert.equal(s.ok, true);
  assert.equal(s.value.official_email, "principal@dps.edu.in");
  assert.equal(s.value.student_strength, 1800);
  assert.equal("role" in s.value, false, "a smuggled field never reaches the database");
  assert.equal(m.parsePayload("school", { ...school, authorised: undefined }).ok, false, "a representative must confirm authority");
  assert.equal(m.parsePayload("school", { ...school, official_email: "not-an-email" }).field, "official_email");
  const staff = { position: "riding_instructor", years_experience: "12", phone: "9848012345", city: "Jaipur", ex_service: "yes", availability: "one_month", statement: "Twelve years teaching young riders in the cavalry school." };
  assert.equal(m.parsePayload("staff", staff).ok, true);
  assert.equal(m.parsePayload("staff", { ...staff, statement: "short" }).ok, false);
  assert.equal(m.parsePayload("staff", { ...staff, position: "super_admin" }).ok, false);
  const partner = { organisation: "Acme Saddlery", category: "equipment", website: "", contact_phone: "+91 22 5555 1234", contact_designation: "Director", proposal: "We would like to supply saddles and helmets at cost." };
  assert.equal(m.parsePayload("partner", partner).ok, true);
  assert.equal(m.parsePayload("partner", { ...partner, website: "javascript:alert(1)" }).ok, false);
  const cadet = { preferred_days: "weekends", emergency_contact_name: "Ravi Rao", emergency_contact_phone: "+91 98480 00000", relationship: "father" };
  assert.equal(m.parsePayload("cadet", cadet).ok, true);
  assert.equal(m.parsePayload("cadet", { ...cadet, emergency_contact_phone: "abc" }).ok, false);
});

test("the fee and GST are integer paise, rounded once", () => {
  assert.deepEqual(m.feeWithGst(250000, 0.18), { base: 250000, gst: 45000, total: 295000 });
  assert.deepEqual(m.feeWithGst(99999, 0.18), { base: 99999, gst: 18000, total: 117999 });
  assert.throws(() => m.feeWithGst(-1, 0.18));
  assert.throws(() => m.feeWithGst(1.5, 0.18));
  assert.throws(() => m.feeWithGst(100, 0.9));
  assert.equal(m.rupees(295000), "₹2,950.00");
});

test("the return path after sign-in stays on this site", () => {
  assert.equal(m.safeNext("/enroll"), "/enroll");
  assert.equal(m.safeNext("/enroll/status/abc"), "/enroll/status/abc");
  for (const bad of ["//evil.example", "https://evil.example", "/\\evil.example", "javascript:alert(1)", "", null, 42, "/ok\nSet-Cookie:x"]) {
    assert.equal(m.safeNext(bad), "/sovereign", String(bad));
  }
});

test("Razorpay webhook facts: payments, refunds, and nothing else", () => {
  const captured = { event: "payment.captured", payload: { payment: { entity: { id: "pay_ABC123", order_id: "order_XYZ789abc", amount: 295000 } } } };
  assert.deepEqual(rz.readWebhook(captured), { type: "payment.captured", orderId: "order_XYZ789abc", paymentId: "pay_ABC123", amountPaise: 295000 });
  const refund = { event: "refund.processed", payload: { refund: { entity: { id: "rfnd_1", payment_id: "pay_ABC123", amount: 50000 } }, payment: { entity: { id: "pay_ABC123", order_id: "order_XYZ789abc", amount: 295000 } } } };
  assert.equal(rz.readWebhook(refund).amountPaise, 50000, "a refund carries the refunded amount, not the payment's");
  assert.equal(rz.readWebhook({ event: "subscription.charged", payload: {} }), null);
  assert.equal(rz.readWebhook({ event: "payment.captured", payload: { payment: { entity: { order_id: "'; drop table", amount: 1 } } } }), null);
  assert.equal(rz.readWebhook({ event: "payment.captured", payload: { payment: { entity: { order_id: "order_XYZ789abc", amount: -5 } } } }), null);
  assert.equal(rz.readWebhook(null), null);
});

test("Razorpay orders: server amount, Basic auth, and nothing without keys", async () => {
  const saved = { id: process.env.RAZORPAY_KEY_ID, secret: process.env.RAZORPAY_KEY_SECRET };
  try {
    delete process.env.RAZORPAY_KEY_ID; delete process.env.RAZORPAY_KEY_SECRET;
    assert.deepEqual(await rz.createRazorpayOrder({ amountPaise: 295000, receipt: "BSAH-1", notes: {} }), { ok: false, reason: "not_configured" });
    process.env.RAZORPAY_KEY_ID = "rzp_test_key"; process.env.RAZORPAY_KEY_SECRET = "secret";
    let seen;
    const fake = async (url, init) => { seen = { url, init }; return new Response(JSON.stringify({ id: "order_TEST123456", amount: 295000, currency: "INR" }), { status: 200 }); };
    const ok = await rz.createRazorpayOrder({ amountPaise: 295000, receipt: "BSAH-1", notes: { application: "BSAH-1" } }, fake);
    assert.equal(ok.ok, true);
    assert.equal(seen.init.headers.authorization, `Basic ${Buffer.from("rzp_test_key:secret").toString("base64")}`);
    assert.equal(JSON.parse(seen.init.body).amount, 295000);
    const lying = async () => new Response(JSON.stringify({ id: "order_TEST123456", amount: 1 }), { status: 200 });
    assert.equal((await rz.createRazorpayOrder({ amountPaise: 295000, receipt: "r", notes: {} }, lying)).ok, false, "an order for another amount is refused");
    assert.equal((await rz.createRazorpayOrder({ amountPaise: 50, receipt: "r", notes: {} }, fake)).ok, false, "below Razorpay's minimum");
  } finally {
    for (const [k, v] of [["RAZORPAY_KEY_ID", saved.id], ["RAZORPAY_KEY_SECRET", saved.secret]]) { if (v === undefined) delete process.env[k]; else process.env[k] = v; }
  }
});

test("the webhook route verifies the raw body before reading it, and only it can mark paid", () => {
  const route = read("app/api/payments/razorpay/route.ts");
  const sig = route.indexOf("verifyWebhookSignature(raw");
  assert.ok(sig > 0 && sig < route.indexOf("JSON.parse(raw)"), "signature first, parse second");
  assert.match(route, /x-razorpay-event-id/);
  assert.match(route, /rpc\("ingest_payment_event"/);
  const actions = read("app/enroll/actions.ts");
  assert.doesNotMatch(actions, /status: "PAID"|payment_status: "paid"/, "no client path sets paid");
  assert.match(SQL, /revoke all on function public\.ingest_payment_event\(text, text, text, text, integer\) from public, anon, authenticated;/);
  // the signature helper the route relies on
  const secret = "whsec_test"; const body = '{"event":"payment.captured"}';
  return loadTs("lib/payments/core.ts").then((core) => {
    assert.equal(core.verifyWebhookSignature(body, createHmac("sha256", secret).update(body).digest("hex"), secret), true);
    assert.equal(core.verifyWebhookSignature(body + " ", createHmac("sha256", secret).update(body).digest("hex"), secret), false);
  });
});

test("notifications never carry a child's details", async () => {
  const n = await loadTs("lib/registration/notify.ts");
  for (const t of ["application_received", "info_requested", "application_approved", "application_rejected", "payment_confirmed", "enrolment_confirmed"]) {
    const msg = n.renderNotification(t, { name: "Asha <b>Rao</b>", reference: "BSAH-ABC123", kind: "cadet", amountPaise: 295000 });
    assert.match(msg.subject, /BSAH-ABC123/);
    assert.doesNotMatch(msg.html, /<b>Rao<\/b>/, "names are escaped");
    assert.doesNotMatch(msg.html + msg.text, /date of birth|medical|proof of age/i);
  }
});

test("routes: the registration pages exist, are private where they should be, and sign-in returns to them", () => {
  for (const f of ["app/register/page.tsx", "app/login/page.tsx", "app/enroll/page.tsx", "app/enroll/status/page.tsx", "app/enroll/status/[id]/page.tsx", "app/schools/apply/page.tsx",
    "app/careers/apply/page.tsx", "app/partners/apply/page.tsx", "app/sovereign/page.tsx", "app/admin/applications/page.tsx", "app/admin/applications/[id]/page.tsx",
    "app/admin/admissions/page.tsx", "app/admin/cadets/page.tsx", "app/admin/schools/page.tsx"]) read(f);
  const proxy = read("proxy.ts");
  for (const p of ["/enroll", "/schools/apply", "/careers/apply", "/partners/apply", "/sovereign"]) assert.ok(proxy.includes(`"${p}"`), `${p} is behind the session proxy`);
  assert.match(read("lib/auth/destination.ts"), /safeNext\(next, "\/sovereign"\)/);
  assert.match(read("app/admin/actions.ts"), /destinationAfterSignIn\(supabase, auth\.user\.id, data\.get\("next"\)\)/);
  for (const f of ["app/admin/applications/page.tsx", "app/admin/applications/[id]/page.tsx", "app/admin/admissions/page.tsx", "app/admin/cadets/page.tsx", "app/admin/schools/page.tsx", "app/admin/applications/actions.ts"]) {
    assert.match(read(f), /requireAdmissions\(\)/, `${f} checks the reviewer role`);
  }
  assert.match(read("next.config.mjs"), /https:\/\/checkout\.razorpay\.com/);
});

test("the migration keeps sign-up least-privilege and never lets a form set a role", () => {
  assert.match(SQL, /v_role text := upper\(coalesce\(new\.raw_app_meta_data->>'role', ''\)\)/);
  assert.doesNotMatch(SQL, /raw_user_meta_data->>'role'/);
  assert.match(SQL, /p_role in \('INSTRUCTOR', 'GROOM'\)\) or \(a\.kind = 'school' and p_role = 'SCHOOL_ADMIN'\)/);
  assert.match(SQL, /if not app_private\.is_super_admin\(\) then raise exception 'super admin only'/);
  assert.match(SQL, /grant insert \(kind, child_id, program_id, hub_id, payload\) on public\.applications to authenticated;/);
});
