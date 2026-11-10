"use client";

import { useMemo } from "react";
import { AnalyticsBento } from "@/components/ui/analytics-bento";
import { aggregate, gateLabel, RANGES, statusName, WEEKDAYS, type OverviewSnapshot } from "@/lib/admin/overview";

/** Repeatable colors per form from the Finance Bento asset palette: lime, stocks, crypto, blue, pink, green, graph, fiat. */
const TILE = [
  { color: "#E8FF1F", ink: "dark" as const },
  { color: "#A9B2FF", ink: "dark" as const },
  { color: "#FFB37A", ink: "dark" as const },
  { color: "#2e43ff", ink: "light" as const },
  { color: "#ff2a85", ink: "light" as const },
  { color: "#36956f", ink: "light" as const },
  { color: "#3a3a44", ink: "light" as const },
  { color: "#ffffff", ink: "dark" as const },
];

/**
 * The sign is carried in the text so the chart set can turn the arrow over; "\u2014" means there was nothing to compare with.
 */
const pct = (d: { pct: number | null; direction: string }) => {
  if (d.pct === null) return "\u2014";
  const sign = d.direction === "down" ? "\u2212" : "";
  const size = Math.abs(d.pct);
  return size > 999 ? `${sign}>999%` : `${sign}${size}%`;
};

/**
 * The enquiry figures as the four-card chart set: 30-day trend, window comparison waves,
 * form treemap, and the week's shape as a radar. Formatted with Finance Bento colors and aesthetics.
 */
export function EnquiryBento({ snapshot, nowMs }: { snapshot: OverviewSnapshot; nowMs: number }) {
  const view = useMemo(() => {
    const [short, mid, long] = RANGES.map((days) => aggregate(snapshot.rows, nowMs, days));
    if (long.total === 0) return null;

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
      <div className="rounded-[28px] border border-white/10 bg-black/60 p-6 text-sm text-white/50 backdrop-blur-xl">
        No enquiries in the last {RANGES[RANGES.length - 1]} days yet, so there is nothing to chart.
      </div>
    );
  }

  const { short, mid, long, groups, items } = view;
  const topForms = long.byGate.slice(0, 3);
  const topStatuses = long.byStatus.filter((s) => s.count > 0).slice(0, 3);

  return (
    <section aria-label="Enquiries at a glance" className="mb-8">
      {snapshot.sample && (
        <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-[#E8FF1F]/15 border border-[#E8FF1F]/30 px-3 py-1 font-mono text-xs text-[#E8FF1F]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#E8FF1F]" />
          Sample analytics view — simulated metrics for development preview
        </div>
      )}
      <div
        className="rounded-[28px] border border-white/10 bg-black p-5 sm:p-7 shadow-2xl text-white"
        style={{
          "--color-foreground": "#ffffff",
          "--color-card": "rgba(255, 255, 255, 0.05)",
          "--color-card-foreground": "#ffffff",
          "--color-muted-foreground": "rgba(255, 255, 255, 0.56)",
          "--color-border": "rgba(255, 255, 255, 0.12)",
          "--color-popover": "#0e0e10",
          "--color-popover-foreground": "#ffffff",
          "--color-muted": "rgba(255, 255, 255, 0.08)",
          color: "#ffffff",
        } as React.CSSProperties}
      >
        <AnalyticsBento
          credit
          currency=""
          colors={{
            revenue: ["#b9a6ff", "#2e43ff"],
            desktop: ["#E8FF1F", "#a3c400"],
            mobile: ["#ffb37a", "#c2683a"],
            radar: "#A9B2FF",
          }}
          revenue={{
            label: "Enquiries · 30 days",
            value: mid.total,
            delta: pct(mid.delta),
            caption: "By day, India time",
            note: (
              <>
                Last 7 days <span className="text-white font-medium">{short.total}</span>
              </>
            ),
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
      </div>
    </section>
  );
}
