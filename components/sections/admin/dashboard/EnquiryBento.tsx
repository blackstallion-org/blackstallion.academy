"use client";

import { useMemo } from "react";
import { AnalyticsBento } from "@/components/ui/analytics-bento";
import { aggregate, gateLabel, RANGES, statusName, WEEKDAYS, type OverviewSnapshot } from "@/lib/admin/overview";

/** A repeatable colour per form, from the console palette (branding orange, greys, the red-to-sand gradient stops), so a form keeps its colour between windows and reloads. */
const TILE = [
  { color: "#E85002", ink: "light" as const },
  { color: "#646464", ink: "light" as const },
  { color: "#A7A7A7", ink: "dark" as const },
  { color: "#333333", ink: "light" as const },
  { color: "#F16001", ink: "light" as const },
  { color: "#C10801", ink: "light" as const },
  { color: "#D9C3AB", ink: "dark" as const },
  { color: "#F9F9F9", ink: "dark" as const },
];

/**
 * The sign is carried in the text so the chart set can turn the arrow over; "\u2014" means there was nothing to compare with.
 * A jump off a near-empty window runs to thousands of per cent, which reads as noise, so anything past 999 % is shown as such.
 */
const pct = (d: { pct: number | null; direction: string }) => {
  if (d.pct === null) return "\u2014";
  const sign = d.direction === "down" ? "\u2212" : "";
  const size = Math.abs(d.pct);
  return size > 999 ? `${sign}>999%` : `${sign}${size}%`;
};

/**
 * The enquiry figures as the four-card chart set: the 30-day trend, this window against the one before it, every form as a
 * treemap over three windows, and the week's shape as a radar. Every number comes from the same snapshot the rest of the
 * console uses — counts and names only, never a contact detail — and is recomputed in the browser, so nothing extra is fetched.
 */
export function EnquiryBento({ snapshot, nowMs }: { snapshot: OverviewSnapshot; nowMs: number }) {
  const view = useMemo(() => {
    const [short, mid, long] = RANGES.map((days) => aggregate(snapshot.rows, nowMs, days));
    if (long.total === 0) return null;

    // Every form seen in the longest window keeps one colour across all three.
    const forms = long.byGate.map((g) => g.key).slice(0, TILE.length);
    const countAt = (agg: typeof long, key: string) => agg.byGate.find((g) => g.key === key)?.count ?? 0;

    return {
      short,
      mid,
      long,
      groups: forms.map((key, i) => ({ id: key, name: gateLabel(key), color: TILE[i].color, ink: TILE[i].ink })),
      items: forms.map((key) => ({ name: gateLabel(key), group: key, values: [short, mid, long].map((a) => countAt(a, key)) })),
    };
  }, [snapshot.rows, nowMs]);

  if (!view) {
    return (
      <p className="rounded-xl bg-ember p-6 text-sm text-dust">
        No enquiries in the last {RANGES[RANGES.length - 1]} days yet, so there is nothing to chart.
      </p>
    );
  }

  const { short, mid, long, groups, items } = view;
  const topForms = long.byGate.slice(0, 3);
  const topStatuses = long.byStatus.filter((s) => s.count > 0).slice(0, 3);

  return (
    <section aria-label="Enquiries at a glance" className="mb-8">
      {snapshot.sample && (
        <p className="label mb-3 text-blood">Sample — invented data, not the real enquiry book</p>
      )}
      <AnalyticsBento
        credit
        currency=""
        colors={{ revenue: ["#E85002", "#F16001"], desktop: ["#646464", "#A7A7A7"], mobile: ["#333333", "#646464"], radar: "#D9C3AB" }}
        revenue={{
          label: "Enquiries · 30 days",
          value: mid.total,
          delta: pct(mid.delta),
          caption: "By day, India time",
          note: <>Last 7 days <span className="text-foreground/80">{short.total}</span></>,
          series: mid.daily.map((d) => ({
            value: d.count,
            label: new Date(`${d.day}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
          })),
        }}
        sessions={{
          label: "This window against the last",
          value: mid.total,
          delta: pct(mid.delta),
          note: `${mid.rangeDays} days each, day by day`,
          labels: { desktop: "This window", mobile: "The window before", prior: "Earlier", current: "This window" },
          desktop: [mid.daily.map((d) => d.count)],
          mobile: [mid.previousDaily],
        }}
        categories={{
          title: "Which form they came through",
          groups,
          periods: RANGES.map((days, i) => {
            const agg = [short, mid, long][i];
            return {
              label: `${days} days`,
              total: agg.total,
              delta: pct(agg.delta),
              compare: `against ${agg.previousTotal} in the ${days} before`,
            };
          }),
          items,
          table: {
            columns: ["Status", "Count", "Share"],
            rows: topStatuses.map((s) => ({
              label: statusName(s.key),
              values: [String(s.count), `${Math.round((s.count / long.total) * 100)}%`],
            })),
          },
        }}
        seasonality={{
          title: "The shape of the week",
          axis: [...WEEKDAYS],
          years: RANGES.map((days, i) => {
            const agg = [short, mid, long][i];
            return {
              label: String(days),
              values: agg.byWeekday.map((w) => w.count),
              stats: [
                { label: "Enquiries", value: agg.total, delta: pct(agg.delta), note: `against ${agg.previousTotal}` },
                { label: "Picked up", value: agg.handledPct ?? 0, delta: "—", note: `% of ${agg.total}` },
              ],
              rows: topForms.map((g) => ({ label: gateLabel(g.key), value: String(agg.byGate.find((x) => x.key === g.key)?.count ?? 0) })),
            };
          }),
        }}
      />
    </section>
  );
}
