// Staff console (/admin): filter parsing, the search sanitiser (PostgREST .or() injection), IST date windows, query
// building against the real postgrest-js builder (no network), display mapping, and the lead server actions with a fake
// Supabase client. Synthetic data only. Does NOT prove RLS or the live schema: see ADMIN_NOTES.md for the live checks.
import { test, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { loadTs, loadTsWith, root } from "./helpers/load-ts.mjs";

const F = await loadTs("lib/admin/filters.ts");
const P = await loadTs("lib/admin/present.ts");
const C = await loadTs("lib/admin/constants.ts");

/** A query builder that records every filter call and returns itself (the supabase-js builders do the same). */
function recorder() {
  const calls = [];
  const q = new Proxy({}, { get: (_, method) => (...args) => { calls.push([method, ...args]); return q; } });
  return { q, calls };
}

const RESERVED = /[,()"\\*:%]/;

// ------------------------------------------------------------------ sanitiser

test("search sanitiser: PostgREST reserved characters never survive", () => {
  for (const attack of [
    "x),status.eq.new",
    "a,b",
    "(x)",
    'he said "hi"',
    "x*",
    "100%",
    "back\\slash",
    "col:val",
    "x.ilike.*,id.not.is.null",
    "'; drop table onboarding_leads; --",
    "or=(id.gt.0)",
  ]) {
    const term = F.sanitizeSearchTerm(attack);
    assert.ok(term === undefined || !RESERVED.test(term), `${attack} → ${term}`);
  }
  assert.equal(F.sanitizeSearchTerm("x),status.eq.new"), "x status.eq.new");
  assert.equal(F.sanitizeSearchTerm("100%"), "100");
  assert.equal(F.sanitizeSearchTerm("(),\"*"), undefined, "nothing usable left");
});

test("search sanitiser: keeps letters (incl. Indic), digits, spaces and @ . + - _; collapses whitespace; caps at 80", () => {
  assert.equal(F.sanitizeSearchTerm("  Meera   Rao  "), "Meera Rao");
  assert.equal(F.sanitizeSearchTerm("meera.rao+bsah@example.test"), "meera.rao+bsah@example.test");
  assert.equal(F.sanitizeSearchTerm("+91 98765-43210"), "+91 98765-43210");
  assert.equal(F.sanitizeSearchTerm("first_last"), "first_last");
  assert.equal(F.sanitizeSearchTerm("राम कुमार"), "राम कुमार", "Devanagari with vowel signs (combining marks)");
  assert.equal(F.sanitizeSearchTerm("Zoë"), "Zoë");
  assert.equal(F.sanitizeSearchTerm("tab\tnew\nline"), "tab new line");
  assert.equal(F.sanitizeSearchTerm("a".repeat(200)).length, 80);
  assert.equal(Array.from(F.sanitizeSearchTerm("𝐀".repeat(90))).length, 80, "capped by code point, no split surrogates");
  assert.equal(F.sanitizeSearchTerm(""), undefined);
  assert.equal(F.sanitizeSearchTerm("   "), undefined);
  assert.equal(F.sanitizeSearchTerm(42), undefined);
  assert.equal(F.sanitizeSearchTerm(undefined), undefined);
});

test("LIKE escaping: % _ and \\ match literally", () => {
  assert.equal(F.escapeLike("a_b%c\\d"), "a\\_b\\%c\\\\d");
  assert.equal(F.containsPattern("first_last"), "%first\\_last%");
});

test("enquiry search filter: four ilike conditions on fixed columns; refuses unsanitised input", () => {
  assert.equal(
    F.leadSearchFilter("meera"),
    "contact_name.ilike.%meera%,email.ilike.%meera%,phone.ilike.%meera%,payload->>organisation.ilike.%meera%",
  );
  const term = F.sanitizeSearchTerm("x),status.eq.new,id.not.is.null,(");
  const filter = F.leadSearchFilter(term);
  assert.equal(filter.split(",").length, 4, "no injected conditions");
  assert.ok(!/[()"]/.test(filter), "no grouping or quoting characters");
  for (const raw of ["a,b", "a)", 'a"', "a*", "x".repeat(81)]) assert.throws(() => F.leadSearchFilter(raw), /unsanitised/);
});

// ------------------------------------------------------------------ dates

test("IST day windows: midnight India time, inclusive end date; impossible dates rejected", () => {
  assert.equal(F.istDayStart("2026-10-23"), "2026-10-22T18:30:00.000Z");
  assert.equal(F.istNextDayStart("2026-10-23"), "2026-10-23T18:30:00.000Z");
  assert.equal(F.istNextDayStart("2026-12-31"), "2026-12-31T18:30:00.000Z");
  assert.equal(F.isCalendarDay("2028-02-29"), true);
  for (const bad of ["2026-02-30", "2026-13-01", "26-10-23", "2026-10-23T00:00", "yesterday", ""]) assert.equal(F.isCalendarDay(bad), false, bad);
});

// ------------------------------------------------------------------ parsing

test("enquiry filters: valid params parsed; repeated params keep the first; empty values ignored", () => {
  const { filters, issues } = F.parseLeadFilters({ q: " Meera ", gate: "mou", status: ["new", "closed"], source: "qr", from: "2026-10-01", to: "2026-10-23", page: "3", extra: "x" });
  assert.deepEqual(filters, { q: "Meera", gate: "mou", status: "new", source: "qr", from: "2026-10-01", to: "2026-10-23", page: 3 });
  assert.deepEqual(issues, []);
  assert.deepEqual(F.parseLeadFilters({ q: "", gate: "", status: "", source: "", from: "", to: "", page: "" }), { filters: { page: 1 }, issues: [] });
  assert.deepEqual(F.parseLeadFilters({}), { filters: { page: 1 }, issues: [] });
});

test("enquiry filters: invalid values are dropped with an honest note each", () => {
  const { filters, issues } = F.parseLeadFilters({ gate: "admin", status: "deleted", source: "facebook", from: "2026-02-30", to: "soon", page: "0" });
  assert.deepEqual(filters, { page: 1 });
  assert.equal(issues.length, 6);
  for (const page of ["-1", "1.5", "abc", "2001", "1e9"]) assert.equal(F.parseLeadFilters({ page }).filters.page, 1, page);
  assert.equal(F.parseLeadFilters({ page: "2000" }).filters.page, 2000);
  const swapped = F.parseLeadFilters({ from: "2026-10-23", to: "2026-10-01" });
  assert.deepEqual(swapped.filters, { page: 1 });
  assert.match(swapped.issues[0], /start date is after the end date/);
  const trimmed = F.parseLeadFilters({ q: "x),status.eq.new" });
  assert.equal(trimmed.filters.q, "x status.eq.new");
  assert.match(trimmed.issues[0], /left out/);
  assert.deepEqual(F.parseLeadFilters({ q: "Meera  Rao" }).issues, [], "whitespace collapsing is not reported");
});

test("MOU, QR and audit filters validate their own fields", () => {
  assert.deepEqual(F.parseMouFilters({ q: "Test School, Pune", status: "SIGNED" }).filters, { q: "Test School Pune", status: "SIGNED", page: 1 });
  assert.deepEqual(F.parseMouFilters({ status: "signed" }).filters, { page: 1 }, "statuses are the exact operations values");
  assert.deepEqual(F.parseQrFilters({ hub: "zone-01a", source: "website-qr", from: "2026-10-01" }).filters, { hub: "zone-01a", source: "website-qr", from: "2026-10-01", page: 1 });
  const badQr = F.parseQrFilters({ hub: "zone,01a)", source: "x".repeat(101) });
  assert.deepEqual(badQr.filters, { page: 1 });
  assert.equal(badQr.issues.length, 2);
  assert.deepEqual(F.parseAuditFilters({ entity: "onboarding_leads", action: "row.update", to: "2026-10-23" }).filters, { entity: "onboarding_leads", action: "row.update", to: "2026-10-23", page: 1 });
  const badAudit = F.parseAuditFilters({ entity: "users; drop", action: "Row Update" });
  assert.deepEqual(badAudit.filters, { page: 1 });
  assert.equal(badAudit.issues.length, 2);
  assert.equal(F.hasFilters({ page: 4 }), false);
  assert.equal(F.hasFilters({ page: 1, status: "new" }), true);
});

// ------------------------------------------------------------------ applying filters

test("applyLeadFilters: every filter maps to one fixed PostgREST call", () => {
  const { q, calls } = recorder();
  const { filters } = F.parseLeadFilters({ q: "meera", gate: "mou", status: "new", source: "qr", from: "2026-10-01", to: "2026-10-23" });
  assert.equal(F.applyLeadFilters(q, filters), q);
  assert.deepEqual(calls, [
    ["or", "contact_name.ilike.%meera%,email.ilike.%meera%,phone.ilike.%meera%,payload->>organisation.ilike.%meera%"],
    ["eq", "gate", "mou"],
    ["eq", "status", "new"],
    ["not", "attribution->>qr", "is", null],
    ["gte", "created_at", "2026-09-30T18:30:00.000Z"],
    ["lt", "created_at", "2026-10-23T18:30:00.000Z"],
  ]);
  const utm = recorder();
  F.applyLeadFilters(utm.q, { source: "utm", page: 1 });
  assert.deepEqual(utm.calls, [["or", "attribution->>utm_source.not.is.null,attribution->>utm_medium.not.is.null,attribution->>utm_campaign.not.is.null,attribution->>utm_term.not.is.null,attribution->>utm_content.not.is.null"]]);
  const none = recorder();
  F.applyLeadFilters(none.q, { page: 1 });
  assert.deepEqual(none.calls, []);
});

test("apply MOU / QR / audit filters", () => {
  const mou = recorder();
  F.applyMouFilters(mou.q, { q: "st_marys", status: "PENDING", page: 1 });
  assert.deepEqual(mou.calls, [["ilike", "school_name", "%st\\_marys%"], ["eq", "status", "PENDING"]]);
  const qr = recorder();
  F.applyQrFilters(qr.q, { hub: "zone-01a", source: "flyer", from: "2026-10-01", page: 1 });
  assert.deepEqual(qr.calls, [["eq", "hub_slug", "zone-01a"], ["eq", "source", "flyer"], ["gte", "created_at", "2026-09-30T18:30:00.000Z"]]);
  const summary = recorder();
  F.applyQrFilters(summary.q, { hub: "zone-01a", source: "flyer", page: 1 }, { includeHub: false });
  assert.deepEqual(summary.calls, [["eq", "source", "flyer"]], "the per-hub summary ignores the hub filter");
  const leadsAudit = recorder();
  F.applyAuditFilters(leadsAudit.q, { entity: "onboarding_leads", action: "row.update", page: 1 });
  assert.deepEqual(leadsAudit.calls, [["in", "entity_type", ["onboarding_leads", "onboarding_lead"]], ["eq", "action", "row.update"]], "enquiry events under both entity names");
  const otherAudit = recorder();
  F.applyAuditFilters(otherAudit.q, { entity: "users", page: 1 });
  assert.deepEqual(otherAudit.calls, [["eq", "entity_type", "users"]]);
});

test("query building against the real postgrest-js builder (URL only, no request)", async () => {
  const { PostgrestClient } = await import("@supabase/postgrest-js");
  const client = new PostgrestClient("http://127.0.0.1:9/rest/v1");
  const { filters } = F.parseLeadFilters({ q: "first_last,x)", source: "utm", status: "new", to: "2026-10-23", page: "2" });
  const { from, to } = F.pageWindow(filters.page);
  const builder = F.applyLeadFilters(client.from("onboarding_leads").select("id", { count: "exact" }), filters).order("created_at", { ascending: false }).range(from, to);
  const params = builder.url.searchParams;
  const ors = params.getAll("or");
  assert.equal(ors.length, 2, "search and UTM are two separate OR groups (ANDed by PostgREST)");
  assert.equal(ors[0], "(contact_name.ilike.%first\\_last x%,email.ilike.%first\\_last x%,phone.ilike.%first\\_last x%,payload->>organisation.ilike.%first\\_last x%)");
  assert.match(ors[1], /^\(attribution->>utm_source\.not\.is\.null,/);
  assert.equal(params.get("status"), "eq.new");
  assert.equal(params.get("created_at"), "lt.2026-10-23T18:30:00.000Z");
  assert.equal(params.get("offset"), "50");
  assert.equal(params.get("limit"), "50");
  const qr = F.applyLeadFilters(client.from("onboarding_leads").select("id"), { source: "qr", page: 1 });
  assert.equal(qr.url.searchParams.get("attribution->>qr"), "not.is.null");
});

test("pagination and links", () => {
  assert.deepEqual(F.pageWindow(1), { from: 0, to: 49 });
  assert.deepEqual(F.pageWindow(3), { from: 100, to: 149 });
  assert.equal(F.totalPages(0), 1);
  assert.equal(F.totalPages(50), 1);
  assert.equal(F.totalPages(51), 2);
  assert.equal(F.listHref("/admin", { q: "Meera Rao", status: "new", gate: undefined, source: "" }, 2), "/admin?q=Meera+Rao&status=new&page=2");
  assert.equal(F.listHref("/admin", {}, 1), "/admin");
  assert.equal(F.listHref("/admin/qr", { hub: "a&b=c", page: 9 }), "/admin/qr?hub=a%26b%3Dc", "values are encoded; page only from the argument");
  assert.equal(F.isPastLastPage({ code: "PGRST103" }), true);
  assert.equal(F.isPastLastPage({ code: "42501" }), false);
  assert.equal(F.isPastLastPage(null), false);
});

test("ids and references", () => {
  const ok = F.uuidSchema.safeParse(" 6F9619FF-8B86-4011-B42D-00C04FC964FF ");
  assert.equal(ok.success, true);
  assert.equal(ok.data, "6f9619ff-8b86-4011-b42d-00c04fc964ff");
  for (const bad of ["6f9619ff", "6f9619ff-8b86-4011-b42d-00c04fc964fz", "../etc", "", null, 5]) assert.equal(F.uuidSchema.safeParse(bad).success, false, String(bad));
  assert.equal(C.isUuid("00000000-0000-0000-0000-0000000000a1"), true, "any version (fixtures, older rows)");
  assert.equal(C.REFERENCE_PATTERN.test("3f2a9c0d1e4b5a69788796a5b4c3d2e1f0aa"), true);
  assert.equal(C.REFERENCE_PATTERN.test("short"), false);
});

// ------------------------------------------------------------------ display mapping

test("IST formatting", () => {
  const norm = (s) => s.replace(/\s/g, " ");
  assert.equal(norm(P.formatDateTimeIST("2026-10-23T10:15:00Z")), "23 Oct 2026, 3:45 pm IST");
  assert.equal(norm(P.formatDateTimeIST("2026-10-22T18:30:00Z")), "23 Oct 2026, 12:00 am IST", "midnight IST is already the next day");
  assert.equal(P.formatDateTimeIST(null), "—");
  assert.equal(P.formatDateTimeIST("not a date"), "—");
  assert.equal(norm(P.formatCalendarDay("2026-12-01")), "1 Dec 2026", "date columns are never shifted by a time zone");
  assert.equal(P.formatCalendarDay("2026-12-01T00:00:00Z"), "—");
});

test("payload fields: every field, as text, known ones first; nested values as JSON text", () => {
  const fields = P.payloadFields({ zeta: "z", message: "Two acres\n<script>alert(1)</script>", organisation: "Test School, Pune", gate: "mou", count: 3, ok: false, nested: { a: 1 }, empty: null });
  assert.deepEqual(fields.map((f) => f.key), ["organisation", "message", "gate", "count", "empty", "nested", "ok", "zeta"]);
  assert.equal(fields[0].label, "Organisation");
  assert.equal(fields[1].value, "Two acres\n<script>alert(1)</script>", "kept verbatim as text (React escapes it)");
  assert.equal(fields.find((f) => f.key === "count").value, "3");
  assert.equal(fields.find((f) => f.key === "ok").value, "false");
  assert.equal(fields.find((f) => f.key === "empty").value, "—");
  assert.deepEqual(fields.find((f) => f.key === "nested"), { key: "nested", label: "nested", value: '{\n  "a": 1\n}', json: true });
  assert.deepEqual(P.payloadFields(null), []);
  assert.deepEqual(P.payloadFields(["a"]), [{ key: "payload", label: "Payload", value: '[\n  "a"\n]', json: true }]);
});

test("attribution, QR badge, UTM summary, contact links", () => {
  const attribution = { utm_campaign: "autumn", qr: "zone-01a", path: "/schools/mou", referrer: "news.example", utm_source: "flyer", custom: "x" };
  assert.deepEqual(P.attributionFields(attribution).map((f) => f.key), ["path", "qr", "referrer", "utm_source", "utm_campaign", "custom"]);
  assert.equal(P.qrCode(attribution), "zone-01a");
  assert.equal(P.qrCode({ qr: "  " }), undefined);
  assert.equal(P.qrCode(null), undefined);
  assert.equal(P.utmSummary(attribution), "utm_source=flyer · utm_campaign=autumn");
  assert.equal(P.utmSummary({ qr: "x" }), undefined);
  assert.equal(P.organisationOf({ organisation: " Test School " }), "Test School");
  assert.equal(P.mailHref("meera@example.test"), "mailto:meera@example.test");
  assert.equal(P.mailHref("x@example.test?bcc=y@example.test"), undefined);
  assert.equal(P.telHref("+91 98765-43210"), "tel:+919876543210");
  assert.equal(P.telHref("call me"), undefined);
  assert.equal(P.statusLabel("REVIEWING"), "Reviewing");
  assert.equal(P.statusLabel(null), "—");
});

test("staff labels and signed links by path", () => {
  const names = new Map([["u2", "Asha Admin"]]);
  assert.equal(P.staffLabel(null, "u1", names), "Website / system");
  assert.equal(P.staffLabel("u1", "u1", names), "You");
  assert.equal(P.staffLabel("u2", "u1", names), "Asha Admin");
  assert.equal(P.staffLabel("abcdef12-3456", "u1", names), "Staff member abcdef12");
  const urls = P.signedUrlsByPath([
    { path: "mou/2026/10/b.pdf", signedUrl: "https://x/b", error: null },
    { path: "mou/2026/10/a.pdf", signedUrl: "https://x/a", error: null },
    { path: "mou/2026/10/c.pdf", signedUrl: null, error: "Object not found" },
  ]);
  assert.equal(urls.get("mou/2026/10/a.pdf"), "https://x/a", "matched by path, not position");
  assert.equal(urls.has("mou/2026/10/c.pdf"), false);
  assert.equal(P.signedUrlsByPath(null).size, 0);
});

test("MOU notes → website enquiry and document reference", () => {
  const id = "6F9619FF-8B86-4011-B42D-00C04FC964FF";
  const byId = P.mouReference(`Website MOU enquiry. Reference ${id}`);
  assert.deepEqual(byId, { kind: "lead_id", value: id.toLowerCase() }, "the live mirror writes the enquiry id");
  const byKey = P.mouReference("Website MOU enquiry. Reference idem-mou-000000000001");
  assert.deepEqual(byKey, { kind: "key", value: "idem-mou-000000000001" });
  assert.equal(P.mouReference("Reference letter from the principal"), undefined);
  assert.equal(P.mouReference("Website MOU enquiry. Reference short"), undefined);
  assert.equal(P.mouReference(null), undefined);
  assert.deepEqual(P.referenceLookups([byId, byKey, byKey, undefined]), { ids: [id.toLowerCase()], keys: ["idem-mou-000000000001"] });
  const lead = { id: id.toLowerCase(), idempotency_key: "3f2a9c0d1e4b5a69788796a5b4c3d2e1f0aa", contact_name: "Meera Rao" };
  const index = P.indexLeads([lead]);
  assert.equal(P.leadForReference(byId, index), lead);
  assert.equal(P.leadForReference(byKey, index), undefined);
  assert.equal(P.documentReference(byId, lead), lead.idempotency_key, "documents are filed under the enquiry's key");
  assert.equal(P.documentReference(byKey, undefined), "idem-mou-000000000001");
  assert.equal(P.documentReference(byId, undefined), undefined);
});

test("per-hub summary counts captures and enrolments, most captures first", () => {
  const rows = [
    { hub_slug: "zone-01b", converted_to_enrollment: false },
    { hub_slug: "zone-01a", converted_to_enrollment: true },
    { hub_slug: "zone-01a", converted_to_enrollment: null },
    { hub_slug: "", converted_to_enrollment: true },
    { hub_slug: "zone-01c", converted_to_enrollment: false },
  ];
  assert.deepEqual(P.summariseByHub(rows), [
    { hub: "zone-01a", captures: 2, converted: 1 },
    { hub: "(no hub)", captures: 1, converted: 1 },
    { hub: "zone-01b", captures: 1, converted: 0 },
    { hub: "zone-01c", captures: 1, converted: 0 },
  ]);
  assert.deepEqual(P.summariseByHub([]), []);
});

test("audit labels, links and details (column names only)", () => {
  assert.equal(P.auditActionLabel("lead.submitted", "onboarding_lead"), "Enquiry received");
  assert.equal(P.auditActionLabel("row.update", "onboarding_leads"), "Enquiry updated");
  assert.equal(P.auditActionLabel("row.insert", "generated_documents"), "Document generated");
  assert.equal(P.auditActionLabel("row.delete", "media_assets"), "Image deleted");
  assert.equal(P.auditActionLabel("custom.thing", "x"), "custom.thing");
  const id = "6f9619ff-8b86-4011-b42d-00c04fc964ff";
  assert.equal(P.auditEntityHref("onboarding_leads", id), `/admin/leads/${id}`);
  assert.equal(P.auditEntityHref("onboarding_lead", id.toUpperCase()), `/admin/leads/${id}`);
  assert.equal(P.auditEntityHref("onboarding_leads", "../../x"), undefined, "only real ids become links");
  assert.equal(P.auditEntityHref("generated_documents", "x"), "/admin/documents");
  assert.equal(P.auditEntityHref("users", id), undefined);
  assert.equal(P.auditDetails({ changed_columns: ["status", "updated_at"] }), "Changed: status");
  assert.equal(P.auditDetails({ changed_columns: ["updated_at"] }), "Changed: timestamp only");
  assert.equal(P.auditDetails({ type: "school", gate: "mou", mirror: "mou_requests" }), "type: school · gate: mou · mirror: mou_requests");
  assert.equal(P.auditDetails({}), "");
  assert.equal(P.auditDetails(null), "");
});

// ------------------------------------------------------------------ server actions (fake Supabase client)

const LEAD_ID = "6f9619ff-8b86-4011-b42d-00c04fc964ff";
const STAFF_ID = "00000000-0000-4000-8000-0000000000a1";
const SWAPS = { "@/lib/auth/admin": "tests/helpers/fake-staff.mjs", "next/cache": "tests/helpers/fake-next-cache.mjs" };

/** Fake Supabase client: records from/update/eq/select in order; `select()` resolves with the scripted result. */
function fakeSupabase(log, result = { data: [{ id: LEAD_ID }], error: null }) {
  return {
    from(table) {
      log.push(["from", table]);
      const builder = {
        update(values) { log.push(["update", values]); return builder; },
        eq(column, value) { log.push(["eq", column, value]); return builder; },
        select(columns) { log.push(["select", columns]); return Promise.resolve(result); },
      };
      return builder;
    },
  };
}

function installStaff(log, result) {
  globalThis.__bsahTest = {
    revalidated: [],
    requireStaff: async () => {
      log.push(["requireStaff"]);
      return { supabase: fakeSupabase(log, result), user: { id: STAFF_ID }, profile: { display_name: "QA Admin", role: "SUPER_ADMIN" } };
    },
  };
}

const form = (fields) => {
  const data = new FormData();
  for (const [k, v] of Object.entries(fields)) data.set(k, v);
  return data;
};

let actions;
let errors;
const realConsoleError = console.error;
beforeEach(async () => {
  errors = [];
  console.error = (...args) => errors.push(args.join(" "));
  actions = await loadTsWith("app/admin/actions.ts", SWAPS);
});
afterEach(() => {
  console.error = realConsoleError;
  delete globalThis.__bsahTest;
});

test("assign to me: staff check first, then ONLY assigned_to = the session's user id (form values ignored)", async () => {
  const log = [];
  installStaff(log);
  const result = await actions.assignLeadToMe(null, form({ id: LEAD_ID.toUpperCase(), assigned_to: "11111111-1111-4111-8111-111111111111", status: "closed", email: "x@example.test" }));
  assert.deepEqual(result, { notice: "Assigned to you." });
  assert.deepEqual(log, [
    ["requireStaff"],
    ["from", "onboarding_leads"],
    ["update", { assigned_to: STAFF_ID }],
    ["eq", "id", LEAD_ID],
    ["select", "id"],
  ]);
  assert.deepEqual(globalThis.__bsahTest.revalidated, [["/admin", "layout"]]);
});

test("assign to me: invalid id is refused after the staff check and before any database call", async () => {
  const log = [];
  installStaff(log);
  for (const id of ["not-a-uuid", "", "6f9619ff-8b86-4011-b42d-00c04fc964ff' or '1'='1"]) {
    const result = await actions.assignLeadToMe(null, form({ id }));
    assert.match(result.error, /not valid/);
  }
  assert.deepEqual(log, [["requireStaff"], ["requireStaff"], ["requireStaff"]]);
  assert.deepEqual(globalThis.__bsahTest.revalidated, []);
});

test("assign to me: when the staff check fails (redirect to login) nothing else runs", async () => {
  const log = [];
  globalThis.__bsahTest = { revalidated: [], requireStaff: async () => { log.push(["requireStaff"]); throw new Error("NEXT_REDIRECT"); } };
  await assert.rejects(() => actions.assignLeadToMe(null, form({ id: LEAD_ID })), /NEXT_REDIRECT/);
  await assert.rejects(() => actions.setLeadStatus(null, form({ id: LEAD_ID, status: "closed" })), /NEXT_REDIRECT/);
  assert.deepEqual(log, [["requireStaff"], ["requireStaff"]]);
});

test("assign to me: database error is reported honestly and logged without the raw message", async () => {
  const log = [];
  installStaff(log, { data: null, error: { code: "42501", message: "permission denied for meera@example.test", details: "Key (email)=(meera@example.test)" } });
  const result = await actions.assignLeadToMe(null, form({ id: LEAD_ID }));
  assert.deepEqual(result, { error: "The enquiry was not assigned. Please try again." });
  assert.equal(errors.length, 1);
  assert.deepEqual(JSON.parse(errors[0]), { event: "admin.lead_assign_failed", code: "42501" });
  assert.ok(!errors[0].includes("example.test"), "no personal data in the log");
  assert.deepEqual(globalThis.__bsahTest.revalidated, []);
});

test("assign to me / status: zero rows updated (RLS or missing row) is not a success", async () => {
  const log = [];
  installStaff(log, { data: [], error: null });
  assert.match((await actions.assignLeadToMe(null, form({ id: LEAD_ID }))).error, /Nothing was saved/);
  assert.match((await actions.setLeadStatus(null, form({ id: LEAD_ID, status: "closed" }))).error, /Nothing was saved/);
  assert.deepEqual(globalThis.__bsahTest.revalidated, []);
});

test("status change: staff check first, updates ONLY status, validates against the fixed list", async () => {
  const log = [];
  installStaff(log);
  const ok = await actions.setLeadStatus(null, form({ id: LEAD_ID, status: "contacted", assigned_to: STAFF_ID }));
  assert.deepEqual(ok, { notice: "Status saved: contacted." });
  assert.deepEqual(log, [["requireStaff"], ["from", "onboarding_leads"], ["update", { status: "contacted" }], ["eq", "id", LEAD_ID], ["select", "id"]]);
  log.length = 0;
  for (const status of ["deleted", "NEW", "", "new,closed"]) assert.match((await actions.setLeadStatus(null, form({ id: LEAD_ID, status }))).error, /listed statuses/);
  assert.deepEqual(log, [["requireStaff"], ["requireStaff"], ["requireStaff"], ["requireStaff"]], "no update for an invalid status");
});

// ------------------------------------------------------------------ server helpers (fake Supabase client)

test("staffNames: live users table first, website profiles as fallback, one query for distinct ids", async () => {
  const S = await loadTs("lib/admin/server.ts");
  const calls = [];
  const client = (tables) => ({
    from(table) {
      return { select: (cols) => ({ in: async (col, ids) => { calls.push([table, cols, col, ids]); return tables[table] ?? { data: null, error: { code: "42P01" } }; } }) };
    },
  });
  const live = await S.staffNames(client({ users: { data: [{ id: "a", full_name: "Asha Admin" }, { id: "b", full_name: null }], error: null } }), ["a", "b", null, "a", undefined, ""]);
  assert.deepEqual([...live], [["a", "Asha Admin"]]);
  assert.deepEqual(calls, [["users", "id, full_name", "id", ["a", "b"]]]);
  calls.length = 0;
  const site = await S.staffNames(client({ profiles: { data: [{ id: "c", display_name: "Ops" }], error: null } }), ["c"]);
  assert.deepEqual([...site], [["c", "Ops"]]);
  assert.deepEqual(calls.map((c) => c[0]), ["users", "profiles"]);
  calls.length = 0;
  assert.equal((await S.staffNames(client({}), ["d"])).size, 0, "both missing: short ids are shown instead");
  assert.deepEqual(JSON.parse(errors.at(-1)), { event: "admin.staff_names_failed", code: "42P01" });
  calls.length = 0;
  assert.equal((await S.staffNames(client({}), [null, undefined])).size, 0);
  assert.deepEqual(calls, [], "no ids, no query");
});

test("signDocumentPaths: five-minute links keyed by path; failures are reported, not hidden", async () => {
  const S = await loadTs("lib/admin/server.ts");
  const seen = [];
  const client = (result) => ({ storage: { from: (bucket) => ({ createSignedUrls: async (paths, ttl) => { seen.push([bucket, paths, ttl]); return result(paths); } }) } });
  const ok = await S.signDocumentPaths(client((paths) => ({ data: paths.map((p) => ({ path: p, signedUrl: `https://x/${p}`, error: null })), error: null })), ["b.pdf", "a.pdf", "b.pdf"]);
  assert.deepEqual(seen, [["private-documents", ["b.pdf", "a.pdf"], 300]]);
  assert.equal(ok.urls.get("a.pdf"), "https://x/a.pdf");
  assert.equal(ok.failed, false);
  const partial = await S.signDocumentPaths(client((paths) => ({ data: paths.map((p, i) => ({ path: p, signedUrl: i ? null : `https://x/${p}`, error: i ? "not found" : null })), error: null })), ["a.pdf", "gone.pdf"]);
  assert.equal(partial.failed, true);
  assert.equal(partial.urls.size, 1);
  const down = await S.signDocumentPaths(client(() => ({ data: null, error: { name: "StorageApiError", statusCode: "500", message: "secret detail" } })), ["a.pdf"]);
  assert.deepEqual({ size: down.urls.size, failed: down.failed }, { size: 0, failed: true });
  assert.deepEqual(JSON.parse(errors.at(-1)), { event: "admin.documents_sign_failed", status: "500" });
  seen.length = 0;
  assert.deepEqual(await S.signDocumentPaths(client(() => ({ data: [], error: null })), []), { urls: new Map(), failed: false });
  assert.deepEqual(seen, []);
});

test("logAdminError: event plus error code or HTTP status only", async () => {
  const S = await loadTs("lib/admin/server.ts");
  S.logAdminError("admin.x", { code: "PGRST116", message: "row for meera@example.test", details: "Key (email)=(meera@example.test)", hint: "h" });
  S.logAdminError("admin.y", { status: 503 });
  S.logAdminError("admin.z", "plain string error with meera@example.test");
  assert.deepEqual(errors.slice(-3).map((e) => JSON.parse(e)), [{ event: "admin.x", code: "PGRST116" }, { event: "admin.y", status: 503 }, { event: "admin.z" }]);
  assert.ok(!errors.join(" ").includes("example.test"));
});

// ------------------------------------------------------------------ guard: every console page checks the staff role

test("every /admin page except sign-in and reset calls requireStaff() before querying", async () => {
  const pages = [];
  const walk = async (dir) => {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) await walk(full);
      else if (entry.name === "page.tsx") pages.push(full);
    }
  };
  await walk(path.join(root, "app/admin"));
  const guarded = pages.filter((p) => !/[/\\](login|reset)[/\\]/.test(p));
  assert.ok(guarded.length >= 7, `found ${guarded.length} pages`);
  for (const file of guarded) {
    const source = await readFile(file, "utf8");
    const check = source.indexOf("await requireStaff()");
    const query = source.indexOf(".from(");
    assert.ok(check > -1, `${path.relative(root, file)} calls requireStaff()`);
    assert.ok(query === -1 || check < query, `${path.relative(root, file)} checks staff before its first query`);
  }
});
