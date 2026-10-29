/**
 * The staff dashboard's data shape and the arithmetic behind it. Pure and dependency-free, so the same code runs on the server (the
 * first render), in the browser (the date-range switch and every live update) and in the tests. Nothing here touches the database.
 *
 * Only what the charts need leaves the server: no e-mail address, phone number or message ever travels in a snapshot.
 */

/** One enquiry, reduced to what the analytics need. */
export type EnquiryRow = { id: string; at: string; gate: string; status: string; qr: boolean; utm: boolean; assigned: boolean };

export type FeedItem = {
  id: string;
  kind: "enquiry" | "audit";
  at: string;
  title: string;
  detail?: string;
  href?: string;
};

export type LatestEnquiry = { id: string; name: string; gate: string; status: string; at: string };
export type HubCount = { hub: string; captures: number; converted: number };

/** Exact counts come from head queries; null means that query failed (the card says so instead of showing a made-up zero). */
export type Totals = { enquiries: number | null; newStatus: number | null; accountsPending: number | null; mouOpen: number | null };

export type OverviewSnapshot = {
  generatedAt: string;
  /** The last ROW_WINDOW_DAYS days of enquiries, newest first, at most ROW_CAP rows. */
  rows: EnquiryRow[];
  rowsTruncated: boolean;
  totals: Totals;
  latest: LatestEnquiry[];
  activity: FeedItem[];
  hubs: HubCount[] | null;
  /** Names of the parts that could not be loaded ("enquiries", "accounts", ...). */
  unavailable: string[];
  /** True only for the development preview's made-up data. */
  sample?: boolean;
};

export const ROW_WINDOW_DAYS = 90;
export const ROW_CAP = 1500;
export const RANGES = [7, 30, 90] as const;
export type RangeDays = (typeof RANGES)[number];

const IST_MS = (5 * 60 + 30) * 60_000;
const DAY_MS = 86_400_000;

/** The IST calendar day of an instant, as YYYY-MM-DD (India has no daylight saving, so a fixed offset is exact). */
export function istDayKey(ms: number): string {
  return new Date(ms + IST_MS).toISOString().slice(0, 10);
}

/** Monday = 0 … Sunday = 6, in IST. */
export function istWeekday(ms: number): number {
  return (new Date(ms + IST_MS).getUTCDay() + 6) % 7;
}

export const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

export type Delta = { pct: number | null; direction: "up" | "down" | "flat" };
export function deltaOf(current: number, previous: number): Delta {
  if (previous === 0) return { pct: null, direction: current > 0 ? "up" : "flat" };
  const pct = Math.round(((current - previous) / previous) * 100);
  return { pct, direction: pct > 0 ? "up" : pct < 0 ? "down" : "flat" };
}

export type Count = { key: string; count: number };
export type DayPoint = { day: string; count: number };

export type Aggregates = {
  rangeDays: RangeDays;
  total: number;
  previousTotal: number;
  delta: Delta;
  daily: DayPoint[];
  previousDaily: number[];
  spark: number[];
  byGate: Count[];
  byStatus: Count[];
  byWeekday: Count[];
  sources: { qr: number; campaign: number; direct: number };
  /** Share of the window's enquiries that are no longer "new" (someone has picked them up), 0 to 100. */
  handledPct: number | null;
  unassignedNew: number;
};

const STATUS_ORDER = ["new", "reviewing", "contacted", "qualified", "closed", "rejected"];

function bump(map: Map<string, number>, key: string) {
  map.set(key, (map.get(key) ?? 0) + 1);
}

/**
 * Everything the cards and charts show, for a window of `rangeDays` IST calendar days ending today, against the window of the same
 * length just before it. `rows` may hold more than the window; anything outside it is ignored.
 */
export function aggregate(rows: readonly EnquiryRow[], nowMs: number, rangeDays: RangeDays): Aggregates {
  const todayStart = Date.parse(`${istDayKey(nowMs)}T00:00:00.000Z`) - IST_MS; // 00:00 IST today, as a UTC instant
  const start = todayStart - (rangeDays - 1) * DAY_MS;
  const prevStart = start - rangeDays * DAY_MS;
  const end = todayStart + DAY_MS;

  const dayIndex = new Map<string, number>();
  const daily: DayPoint[] = [];
  for (let i = 0; i < rangeDays; i++) {
    const day = istDayKey(start + i * DAY_MS + 12 * 3_600_000);
    dayIndex.set(day, i);
    daily.push({ day, count: 0 });
  }
  const previousDaily = new Array<number>(rangeDays).fill(0);
  const gates = new Map<string, number>();
  const statuses = new Map<string, number>();
  const weekdays = new Array<number>(7).fill(0);
  const sources = { qr: 0, campaign: 0, direct: 0 };
  let total = 0;
  let previousTotal = 0;
  let notNew = 0;
  let unassignedNew = 0;

  for (const r of rows) {
    const t = Date.parse(r.at);
    if (!Number.isFinite(t)) continue;
    if (t >= prevStart && t < start) {
      previousTotal++;
      previousDaily[Math.min(rangeDays - 1, Math.floor((t - prevStart) / DAY_MS))]++;
      continue;
    }
    if (t < start || t >= end) continue;
    total++;
    const i = dayIndex.get(istDayKey(t));
    if (i !== undefined) daily[i].count++;
    bump(gates, r.gate || "generic");
    bump(statuses, r.status);
    weekdays[istWeekday(t)]++;
    if (r.qr) sources.qr++;
    else if (r.utm) sources.campaign++;
    else sources.direct++;
    if (r.status !== "new") notNew++;
    else if (!r.assigned) unassignedNew++;
  }

  const byGate = [...gates].map(([key, count]) => ({ key, count })).sort((a, b) => b.count - a.count || a.key.localeCompare(b.key));
  const byStatus = STATUS_ORDER.map((key) => ({ key, count: statuses.get(key) ?? 0 }));
  for (const [key, count] of statuses) if (!STATUS_ORDER.includes(key)) byStatus.push({ key, count });

  return {
    rangeDays,
    total,
    previousTotal,
    delta: deltaOf(total, previousTotal),
    daily,
    previousDaily,
    spark: daily.slice(-14).map((d) => d.count),
    byGate,
    byStatus,
    byWeekday: WEEKDAYS.map((key, i) => ({ key, count: weekdays[i] })),
    sources,
    handledPct: total ? Math.round((notNew / total) * 100) : null,
    unassignedNew,
  };
}

/** "just now", "5 min ago", "3 h ago", "2 d ago": a short relative time for the live feed. */
export function relativeTime(iso: string, nowMs: number): string {
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return "";
  const s = Math.max(0, Math.round((nowMs - t) / 1000));
  if (s < 45) return "just now";
  if (s < 3600) return `${Math.max(1, Math.round(s / 60))} min ago`;
  if (s < 86_400) return `${Math.round(s / 3600)} h ago`;
  return `${Math.round(s / 86_400)} d ago`;
}

/**
 * Ids that are in `next` but were not in `prev`: the arrivals a refresh brought. The first snapshot has no predecessor and so
 * flags nothing (a page load must not flash the whole list).
 */
export function arrivals(prev: readonly { id: string }[] | null, next: readonly { id: string }[]): Set<string> {
  if (!prev) return new Set();
  const seen = new Set(prev.map((p) => p.id));
  return new Set(next.filter((n) => !seen.has(n.id)).map((n) => n.id));
}

/** Plain-language names for the form gates and statuses (the labels the rest of the console already uses). */
export const GATE_LABELS: Record<string, string> = {
  parents: "Parents",
  hub: "School hubs",
  schools: "Schools",
  partners: "Partners",
  audit: "Board audit",
  mou: "MOU request",
  generic: "General",
};
export const gateLabel = (gate: string) => GATE_LABELS[gate] ?? gate;

export const STATUS_LABELS: Record<string, string> = {
  new: "New",
  reviewing: "Reviewing",
  contacted: "Contacted",
  qualified: "Qualified",
  closed: "Closed",
  rejected: "Rejected",
};
export const statusName = (status: string) => STATUS_LABELS[status] ?? status;
