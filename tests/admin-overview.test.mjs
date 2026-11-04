import { test } from "node:test";
import assert from "node:assert/strict";
import { loadTs } from "./helpers/load-ts.mjs";

// The staff dashboard's arithmetic: pure functions, no database. Times are India Standard Time (UTC+5:30, no daylight saving).
const o = await loadTs("lib/admin/overview.ts");
const { aggregate, istDayKey, istWeekday, deltaOf, relativeTime, arrivals } = o;

const NOW = Date.parse("2026-10-29T10:00:00Z"); // 15:30 IST, Thursday 29 Oct 2026
const row = (id, iso, extra = {}) => ({ id, at: iso, gate: "parents", status: "new", qr: false, utm: false, assigned: false, ...extra });

test("IST day and weekday: the late evening of one UTC day is the next IST day", () => {
  assert.equal(istDayKey(Date.parse("2026-10-28T18:29:59Z")), "2026-10-28");
  assert.equal(istDayKey(Date.parse("2026-10-28T18:30:00Z")), "2026-10-29");
  assert.equal(istWeekday(Date.parse("2026-10-29T10:00:00Z")), 3); // Thursday
  assert.equal(istWeekday(Date.parse("2026-11-01T00:00:00Z")), 6); // Sunday (05:30 IST)
});

test("delta: no previous period is not a percentage; direction follows the sign", () => {
  assert.deepEqual(deltaOf(5, 0), { pct: null, direction: "up" });
  assert.deepEqual(deltaOf(0, 0), { pct: null, direction: "flat" });
  assert.deepEqual(deltaOf(12, 10), { pct: 20, direction: "up" });
  assert.deepEqual(deltaOf(8, 10), { pct: -20, direction: "down" });
  assert.deepEqual(deltaOf(10, 10), { pct: 0, direction: "flat" });
});

test("aggregate: the window is whole IST days ending today, the previous window has the same length", () => {
  const rows = [
    row("a", "2026-10-29T09:00:00Z"), // today
    row("b", "2026-10-28T18:40:00Z"), // 00:10 IST today
    row("c", "2026-10-23T05:00:00Z"), // 7-day window: starts 23 Oct 00:00 IST, so inside
    row("d", "2026-10-22T18:00:00Z"), // 23:30 IST on 22 Oct: previous window
    row("e", "2026-10-16T05:00:00Z"), // previous window (16 Oct is its first day)
    row("f", "2026-10-15T05:00:00Z"), // before both windows: ignored
    row("g", "2026-10-30T00:00:00Z"), // after today: ignored
  ];
  const a = aggregate(rows, NOW, 7);
  assert.equal(a.total, 3);
  assert.equal(a.previousTotal, 2);
  assert.equal(a.daily.length, 7);
  assert.equal(a.daily.at(-1).day, "2026-10-29");
  assert.equal(a.daily.at(-1).count, 2);
  assert.equal(a.daily[0].day, "2026-10-23");
  assert.equal(a.daily[0].count, 1);
  assert.equal(a.daily.reduce((s, d) => s + d.count, 0), a.total);
  assert.equal(a.delta.pct, 50);
  assert.equal(a.previousDaily.reduce((s, n) => s + n, 0), a.previousTotal);
});

test("aggregate: breakdowns, sources, handled share and unassigned new enquiries", () => {
  const rows = [
    row("1", "2026-10-29T08:00:00Z", { gate: "schools", qr: true }),
    row("2", "2026-10-29T07:00:00Z", { gate: "schools", utm: true, status: "contacted", assigned: true }),
    row("3", "2026-10-28T07:00:00Z", { gate: "parents", status: "qualified", assigned: true }),
    row("4", "2026-10-27T07:00:00Z", { gate: "mou", qr: true, utm: true, status: "closed" }),
  ];
  const a = aggregate(rows, NOW, 7);
  assert.deepEqual(a.byGate.map((g) => [g.key, g.count]), [["schools", 2], ["mou", 1], ["parents", 1]]);
  assert.deepEqual(a.sources, { qr: 2, campaign: 1, direct: 1 }); // a QR code wins over a campaign tag on the same row
  assert.equal(a.byStatus.find((s) => s.key === "new").count, 1);
  assert.equal(a.byStatus.find((s) => s.key === "contacted").count, 1);
  assert.equal(a.handledPct, 75);
  assert.equal(a.unassignedNew, 1);
  assert.equal(a.byWeekday.reduce((s, d) => s + d.count, 0), 4);
  assert.equal(a.byWeekday[3].count, 2); // Thursday 29 Oct
});

test("aggregate: an empty window is zeros, not NaN, and the handled share is unknown", () => {
  const a = aggregate([], NOW, 30);
  assert.equal(a.total, 0);
  assert.equal(a.handledPct, null);
  assert.equal(a.daily.length, 30);
  assert.ok(a.daily.every((d) => d.count === 0));
  assert.equal(a.spark.length, 14);
});

test("aggregate: rows with an unreadable time are skipped, unknown statuses are kept", () => {
  const a = aggregate([row("x", "not a date"), row("y", "2026-10-29T08:00:00Z", { status: "weird" })], NOW, 7);
  assert.equal(a.total, 1);
  assert.ok(a.byStatus.some((s) => s.key === "weird" && s.count === 1));
});

test("relative time: short phrases, never negative", () => {
  const t = (secondsAgo) => relativeTime(new Date(NOW - secondsAgo * 1000).toISOString(), NOW);
  assert.equal(t(10), "just now");
  assert.equal(t(-30), "just now");
  assert.equal(t(5 * 60), "5 min ago");
  assert.equal(t(3 * 3600), "3 h ago");
  assert.equal(t(2 * 86400), "2 d ago");
  assert.equal(relativeTime("garbage", NOW), "");
});

test("arrivals: the first snapshot flags nothing; later ones flag only the new ids", () => {
  const a = [{ id: "1" }, { id: "2" }];
  const b = [{ id: "3" }, { id: "1" }, { id: "2" }];
  assert.equal(arrivals(null, a).size, 0);
  assert.deepEqual([...arrivals(a, b)], ["3"]);
  assert.equal(arrivals(b, a).size, 0);
});

test("the sample snapshot is deterministic, flagged SAMPLE, and carries no contact details", async () => {
  const { sampleSnapshot, simulateArrival } = await loadTs("lib/admin/sample.ts");
  const s1 = sampleSnapshot(NOW);
  const s2 = sampleSnapshot(NOW);
  assert.equal(s1.sample, true);
  assert.deepEqual(s1.rows.slice(0, 5), s2.rows.slice(0, 5));
  assert.ok(s1.rows.length > 200);
  assert.ok(!JSON.stringify(s1).match(/@|\+91/));
  const s3 = simulateArrival(s1, NOW + 5000);
  assert.equal(s3.rows.length, s1.rows.length + 1);
  assert.equal(s3.rows[0].status, "new");
  assert.equal(s3.totals.enquiries, s1.totals.enquiries + 1);
  assert.equal(s3.sample, true);
});

// ---------------------------------------------------------------------------------------------------------------- the loader and the action

import { loadTsWith } from "./helpers/load-ts.mjs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { root } from "./helpers/load-ts.mjs";

const SWAPS = { "@/lib/auth/admin": "tests/helpers/fake-staff.mjs" };
const iso = (minutesAgo) => new Date(Date.now() - minutesAgo * 60_000).toISOString();

/** A minimal stand-in for the Supabase query builder: records each query and answers from `answer(query)`. */
function stubSupabase(answer, log = []) {
  return {
    from(table) {
      const q = { table, head: false, filters: [], order: [], limit: undefined, cols: "" };
      const b = {
        select(cols, opts) { q.cols = cols; q.head = Boolean(opts?.head); return b; },
        eq(c, v) { q.filters.push(["eq", c, v]); return b; },
        in(c, v) { q.filters.push(["in", c, v]); return b; },
        gte(c, v) { q.filters.push(["gte", c, v]); return b; },
        order(c, o) { q.order.push([c, o?.ascending === false ? "desc" : "asc"]); return b; },
        limit(n) { q.limit = n; return b; },
        then(resolve, reject) { log.push(q); return Promise.resolve(answer(q)).then(resolve, reject); },
      };
      return b;
    },
  };
}

test("loadOverview: reads as the staff member, maps rows without contact details, merges the feed and counts exactly", async () => {
  const { loadOverview } = await loadTs("lib/admin/overview-server.ts");
  const log = [];
  const supabase = stubSupabase((q) => {
    if (q.head) return { count: { onboarding_leads: q.filters.length ? 9 : 412, member_accounts: 7, mou_requests: 5 }[q.table], error: null };
    if (q.table === "onboarding_leads" && q.cols.includes("attribution")) {
      return { error: null, data: [
        { id: "a1", created_at: iso(5), gate: "schools", status: "new", attribution: { qr: "HYD-01" }, assigned_to: null },
        { id: "a2", created_at: iso(90), gate: null, status: "contacted", attribution: { utm_source: "flyer" }, assigned_to: "u1" },
        { id: "a3", created_at: iso(900), gate: "parents", status: "closed", attribution: null, assigned_to: "u1" },
      ] };
    }
    if (q.table === "onboarding_leads") return { error: null, data: [{ id: "a1", contact_name: "Meera Rao", gate: "schools", status: "new", created_at: iso(5) }] };
    if (q.table === "audit_events") return { error: null, data: [
      { id: "e1", action: "lead.submitted", entity_type: "onboarding_lead", entity_id: "a1", created_at: iso(5) },
      { id: "e2", action: "row.update", entity_type: "onboarding_leads", entity_id: "6f9619ff-8b86-4011-b42d-00c04fc964ff", created_at: iso(30) },
    ] };
    if (q.table === "qr_lead_captures") return { error: null, data: [{ hub_slug: "hyd-01", converted_to_enrollment: true }, { hub_slug: "hyd-01", converted_to_enrollment: false }, { hub_slug: "pune", converted_to_enrollment: false }] };
    return { error: { code: "42P01" }, data: null };
  }, log);

  const s = await loadOverview(supabase, new Date());
  assert.deepEqual(s.rows.map((r) => [r.id, r.gate, r.status, r.qr, r.utm, r.assigned]), [
    ["a1", "schools", "new", true, false, false],
    ["a2", "generic", "contacted", false, true, true],
    ["a3", "parents", "closed", false, false, true],
  ]);
  assert.deepEqual(s.totals, { enquiries: 412, newStatus: 9, accountsPending: 7, mouOpen: 5 });
  assert.deepEqual(s.latest, [{ id: "a1", name: "Meera Rao", gate: "schools", status: "new", at: s.latest[0].at }]);
  // the intake audit row is dropped (the enquiry itself is in the feed); the staff change stays
  assert.deepEqual(s.activity.map((a) => a.id), ["a1", "audit-e2"]);
  assert.equal(s.activity[0].href, "/admin/leads/a1");
  assert.deepEqual(s.hubs, [{ hub: "hyd-01", captures: 2, converted: 1 }, { hub: "pune", captures: 1, converted: 0 }]);
  assert.deepEqual(s.unavailable, []);
  assert.equal(s.rowsTruncated, false);

  // the exact queries: a 90-day window with a cap, newest first; head counts with the right filters
  const rowsQ = log.find((q) => q.table === "onboarding_leads" && q.cols.includes("attribution"));
  assert.equal(rowsQ.limit, 1501);
  assert.deepEqual(rowsQ.order, [["created_at", "desc"], ["id", "desc"]]);
  assert.equal(rowsQ.filters[0][0], "gte");
  assert.ok(Date.now() - Date.parse(rowsQ.filters[0][2]) > 89 * 86_400_000);
  const heads = log.filter((q) => q.head).map((q) => [q.table, ...q.filters.map((f) => f.join(":"))].join(" "));
  assert.ok(heads.includes("onboarding_leads"));
  assert.ok(heads.includes("onboarding_leads eq:status:new"));
  assert.ok(heads.includes("member_accounts eq:status:pending"));
  assert.ok(heads.some((h) => h.startsWith("mou_requests in:status:PENDING,REVIEWING")));
  // nothing personal leaves the server
  const wire = JSON.stringify(s);
  assert.ok(!/@|\+91|email|phone|payload/i.test(wire.replace(/"emailless"/g, "")));
  for (const q of log) assert.ok(!/email|phone|payload|message/i.test(q.cols), `${q.table} selects only what the dashboard shows`);
});

test("loadOverview: a table that fails is named and skipped, never a made-up zero, and the log carries only the code", async () => {
  const { loadOverview } = await loadTs("lib/admin/overview-server.ts");
  const logged = [];
  const real = console.error;
  console.error = (...a) => logged.push(a.join(" "));
  try {
    const s = await loadOverview(stubSupabase((q) => {
      if (q.table === "mou_requests") return { count: null, error: { code: "42P01", message: "relation does not exist: secret detail" } };
      if (q.table === "qr_lead_captures") return { data: null, error: { code: "42501" } };
      if (q.head) return { count: 3, error: null };
      return { data: [], error: null };
    }), new Date());
    assert.equal(s.totals.mouOpen, null);
    assert.equal(s.totals.accountsPending, 3);
    assert.equal(s.hubs, null);
    assert.deepEqual([...s.unavailable].sort(), ["hubs", "mou"]);
    assert.ok(logged.length >= 2 && logged.every((l) => !/secret detail|relation does not exist/.test(l)));
  } finally {
    console.error = real;
  }
});

test("loadOverview: more than the row cap is reported as truncated and trimmed to the cap", async () => {
  const { loadOverview } = await loadTs("lib/admin/overview-server.ts");
  const many = Array.from({ length: 1501 }, (_, i) => ({ id: `r${i}`, created_at: iso(i), gate: "parents", status: "new", attribution: null, assigned_to: null }));
  const s = await loadOverview(stubSupabase((q) => (q.head ? { count: 5000, error: null } : q.cols.includes("attribution") ? { data: many, error: null } : { data: [], error: null })), new Date());
  assert.equal(s.rows.length, 1500);
  assert.equal(s.rowsTruncated, true);
  assert.equal(s.totals.enquiries, 5000);
});

test("refreshOverview: the staff check runs first; a failed check means no query at all", async () => {
  const actions = await loadTsWith("app/admin/overview-actions.ts", SWAPS);
  const log = [];
  globalThis.__bsahTest = { requireStaff: async () => { log.push("requireStaff"); return { supabase: stubSupabase((q) => { log.push(q.table); return q.head ? { count: 0, error: null } : { data: [], error: null }; }) }; } };
  const s = await actions.refreshOverview();
  assert.equal(log[0], "requireStaff");
  assert.ok(log.length > 1 && Array.isArray(s.rows));

  const denied = [];
  globalThis.__bsahTest = { requireStaff: async () => { denied.push("requireStaff"); throw new Error("NEXT_REDIRECT"); } };
  await assert.rejects(() => actions.refreshOverview(), /NEXT_REDIRECT/);
  assert.deepEqual(denied, ["requireStaff"]);
  delete globalThis.__bsahTest;
});

test("the old enquiries address still works, and the preview route does not exist in production", async () => {
  const overview = await readFile(path.join(root, "app/admin/page.tsx"), "utf8");
  assert.match(overview, /redirect\(`\/admin\/enquiries\?\$\{carried\.toString\(\)\}`\)/);
  assert.ok(overview.indexOf("await requireStaff()") < overview.indexOf("redirect(`/admin/enquiries"), "the staff check comes before the redirect");
  const preview = await readFile(path.join(root, "app/dev/admin-dashboard/page.tsx"), "utf8");
  assert.match(preview, /process\.env\.NODE_ENV === "production"\) notFound\(\)/);
});
