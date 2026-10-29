import { gateLabel, ROW_WINDOW_DAYS, type EnquiryRow, type FeedItem, type LatestEnquiry, type OverviewSnapshot } from "@/lib/admin/overview";

/**
 * SAMPLE data for the development preview (`/dev/admin-dashboard`, which answers 404 in production). Every number is invented; the
 * dashboard says SAMPLE on screen whenever it is showing this. Deterministic, so two loads of the preview look the same.
 */

const NAMES = ["Aarav Mehta", "Diya Rathore", "Kabir Shekhawat", "Ananya Iyer", "Vihaan Choudhary", "Ira Kapoor", "Reyansh Bhati", "Meera Joshi", "Arjun Solanki", "Saanvi Deshmukh", "Rudra Singh", "Tara Nair"];
const GATES = [["parents", 38], ["hub", 17], ["schools", 22], ["partners", 8], ["audit", 7], ["mou", 6], ["generic", 4]] as const;

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(rnd: () => number, weighted: readonly (readonly [T, number])[]): T {
  const sum = weighted.reduce((s, [, w]) => s + w, 0);
  let x = rnd() * sum;
  for (const [v, w] of weighted) if ((x -= w) < 0) return v;
  return weighted[0][0];
}

const statusFor = (rnd: () => number, ageDays: number): string => {
  if (ageDays < 1) return pick(rnd, [["new", 80], ["reviewing", 20]] as const);
  if (ageDays < 4) return pick(rnd, [["new", 30], ["reviewing", 30], ["contacted", 30], ["qualified", 10]] as const);
  return pick(rnd, [["new", 6], ["reviewing", 10], ["contacted", 24], ["qualified", 26], ["closed", 24], ["rejected", 10]] as const);
};

export function sampleSnapshot(nowMs: number): OverviewSnapshot {
  const rnd = mulberry32(20261029);
  const rows: EnquiryRow[] = [];
  const names = new Map<string, string>();
  for (let d = 0; d < ROW_WINDOW_DAYS; d++) {
    const dayStart = nowMs - d * 86_400_000;
    const weekday = new Date(dayStart + 19_800_000).getUTCDay();
    const base = weekday === 0 || weekday === 6 ? 2.2 : 4.6;
    const wave = 1 + 0.35 * Math.sin(d / 5.3) + (d < 14 ? 0.25 : 0);
    const n = Math.max(0, Math.round(base * wave + (rnd() - 0.5) * 3));
    for (let k = 0; k < n; k++) {
      const at = new Date(dayStart - Math.floor(rnd() * 18 * 3_600_000) - (d === 0 ? 0 : 0));
      if (at.getTime() > nowMs) continue;
      const id = `sample-${d}-${k}`;
      const gate = pick(rnd, GATES);
      rows.push({ id, at: at.toISOString(), gate, status: statusFor(rnd, d), qr: rnd() < 0.22, utm: rnd() < 0.18, assigned: rnd() < 0.55 });
      names.set(id, NAMES[Math.floor(rnd() * NAMES.length)]);
    }
  }
  rows.sort((a, b) => Date.parse(b.at) - Date.parse(a.at));
  return buildSnapshot(rows, names, nowMs);
}

function buildSnapshot(rows: EnquiryRow[], names: Map<string, string>, nowMs: number): OverviewSnapshot {
  const latest: LatestEnquiry[] = rows.slice(0, 8).map((r) => ({ id: r.id, name: names.get(r.id) ?? "Visitor", gate: r.gate, status: r.status, at: r.at }));
  const activity: FeedItem[] = rows.slice(0, 12).map((r, i) =>
    i % 4 === 3
      ? { id: `audit-${r.id}`, kind: "audit", at: r.at, title: "Status changed", detail: `${names.get(r.id) ?? "Visitor"} · ${r.status}` }
      : { id: r.id, kind: "enquiry", at: r.at, title: `${names.get(r.id) ?? "Visitor"} sent a ${gateLabel(r.gate).toLowerCase()} enquiry`, detail: r.qr ? "Arrived by QR code" : r.utm ? "Arrived by a campaign link" : "Arrived directly" },
  );
  return {
    generatedAt: new Date(nowMs).toISOString(),
    rows,
    rowsTruncated: false,
    totals: { enquiries: rows.length + 412, newStatus: rows.filter((r) => r.status === "new").length, accountsPending: 7, mouOpen: 5 },
    latest,
    activity,
    hubs: [
      { hub: "hyderabad-zone-01", captures: 64, converted: 11 },
      { hub: "jaipur-central", captures: 41, converted: 6 },
      { hub: "pune-east", captures: 27, converted: 3 },
      { hub: "lucknow-north", captures: 19, converted: 2 },
    ],
    unavailable: [],
    sample: true,
  };
}

/** SAMPLE data as of right now (the preview's first render). */
export const sampleNow = (): OverviewSnapshot => sampleSnapshot(Date.now());

let counter = 0;
/** What the preview's pretend "live" feed does every few seconds: one more enquiry arrives. */
export function simulateArrival(snapshot: OverviewSnapshot, nowMs: number): OverviewSnapshot {
  counter++;
  const rnd = mulberry32(nowMs ^ (counter * 2654435761));
  const gate = pick(rnd, GATES);
  const name = NAMES[Math.floor(rnd() * NAMES.length)];
  const row: EnquiryRow = { id: `sample-live-${nowMs}-${counter}`, at: new Date(nowMs).toISOString(), gate, status: "new", qr: rnd() < 0.25, utm: rnd() < 0.2, assigned: false };
  const rows = [row, ...snapshot.rows];
  const names = new Map(snapshot.latest.map((l) => [l.id, l.name]));
  names.set(row.id, name);
  const next = buildSnapshot(rows, names, nowMs);
  return { ...next, totals: { ...snapshot.totals, enquiries: (snapshot.totals.enquiries ?? 0) + 1, newStatus: (snapshot.totals.newStatus ?? 0) + 1 }, hubs: snapshot.hubs };
}
