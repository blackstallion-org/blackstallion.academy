"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import type { ReactNode } from "react";
import { ArrowUpRight, Inbox, ScrollText, TrendingDown, TrendingUp, Minus } from "lucide-react";
import { gateLabel, relativeTime, statusName, type Aggregates, type Delta, type OverviewSnapshot, type RangeDays } from "@/lib/admin/overview";
import { cn } from "@/lib/utils";
import { ease } from "@/lib/motion/tokens";
import { AreaChart, BarList, Columns, CountUp, Sparkline, SplitBar, TickGauge } from "./charts";
import styles from "./LiveDashboard.module.css";

/** Everything a widget may read. Widgets never fetch: the dashboard hands them the snapshot and what was computed from it. */
export type WidgetCtx = { snapshot: OverviewSnapshot; agg: Aggregates; range: RangeDays; now: number; reduced: boolean; fresh: ReadonlySet<string> };

export type WidgetSize = "kpi" | "wide" | "side" | "third";
export type WidgetDef = {
  id: string;
  title: string;
  /** The small word in the "Add widget" list. */
  tag: string;
  blurb: string;
  size: WidgetSize;
  /** Spans two rows on a wide screen (the live feed). */
  tall?: boolean;
  /** Where the title links to, if anywhere. */
  href?: string;
  render: (c: WidgetCtx) => ReactNode;
  preview: ReactNode;
};

const periodLabel = (range: RangeDays) => `last ${range} days`;

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
/** "29 Oct" from "2026-10-29", by hand: the server and the browser must print the same text, and Intl month names differ between them. */
const dayLabel = (day: string) => `${Number(day.slice(8, 10))} ${MONTHS[Number(day.slice(5, 7)) - 1]}`;

/* ------------------------------------------------------------------ small parts */

function DeltaPill({ delta, goodWhenUp = true }: { delta: Delta; goodWhenUp?: boolean }) {
  const Icon = delta.direction === "up" ? TrendingUp : delta.direction === "down" ? TrendingDown : Minus;
  const good = delta.direction === "flat" ? null : (delta.direction === "up") === goodWhenUp;
  return (
    <span className={cn("label inline-flex items-center gap-1 border px-2 py-1", good === null ? "border-line text-dust" : good ? "border-gold/50 text-gold" : "border-line text-sand")}>
      <Icon className="h-3 w-3" aria-hidden />
      {delta.pct === null ? (delta.direction === "up" ? "New" : "No change") : `${delta.pct > 0 ? "+" : ""}${delta.pct}%`}
    </span>
  );
}

function StatusChip({ status }: { status: string }) {
  return <span className={cn("label inline-block border px-2 py-1", status === "new" ? "border-gold/60 text-gold" : "border-line text-sand")}>{statusName(status)}</span>;
}

function Kpi({ value, reduced, label, foot, delta, spark, href }: { value: number | null; reduced: boolean; label: string; foot: ReactNode; delta?: Delta; spark?: readonly number[]; href: string }) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-start justify-between gap-2">
        <CountUp value={value} reduced={reduced} className="font-mono text-[clamp(1.9rem,3.3vw,2.7rem)] leading-none text-bone" />
        {delta && <DeltaPill delta={delta} />}
      </div>
      {spark ? <Sparkline data={spark} reduced={reduced} className="mt-4" /> : <div className="mt-3 h-3" aria-hidden />}
      <p className="t-ui mt-3 text-xs leading-snug text-dust">{foot}</p>
      <Link href={href} className="label mt-auto inline-flex min-h-11 items-center gap-1 pt-3 text-gold hover:text-bone">
        Open <ArrowUpRight className="h-3 w-3" aria-hidden />
        <span className="sr-only"> {label}</span>
      </Link>
    </div>
  );
}

const unavailable = (s: OverviewSnapshot, key: string) => s.unavailable.includes(key);

/* ------------------------------------------------------------------ the live feed */

function Feed({ c }: { c: WidgetCtx }) {
  const items = c.snapshot.activity;
  if (!items.length) return <p className="t-ui text-sm text-dust">{unavailable(c.snapshot, "latest") ? "The feed could not be loaded." : "Nothing has happened yet."}</p>;
  return (
    <ul className="relative flex flex-col md:max-h-[15.5rem] md:overflow-y-auto md:pr-1" aria-live="polite" aria-relevant="additions" aria-label="Recent activity">
      <AnimatePresence initial={false}>
        {items.map((it) => {
          const Icon = it.kind === "enquiry" ? Inbox : ScrollText;
          const body = (
            <>
              <span aria-hidden className={cn("mt-0.5 grid h-8 w-8 shrink-0 place-items-center border", it.kind === "enquiry" ? "border-gold/50 text-gold" : "border-line text-brass")}>
                <Icon className="h-3.5 w-3.5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="t-ui block text-sm leading-snug text-bone">{it.title}</span>
                <span className="mt-0.5 block font-mono text-[0.68rem] text-dust">{relativeTime(it.at, c.now)}</span>
              </span>
            </>
          );
          return (
            <motion.li
              key={it.id}
              layout={c.reduced ? false : "position"}
              initial={c.reduced ? false : { opacity: 0, y: -14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: c.reduced ? 0 : 0.5, ease: ease.citadel }}
              className={cn("border-b border-line last:border-b-0", c.fresh.has(it.id) && !c.reduced && styles.flash)}
            >
              {it.href ? (
                <Link href={it.href} className="flex min-h-12 gap-3 py-3 hover:bg-umber/50">
                  {body}
                </Link>
              ) : (
                <div className="flex min-h-12 gap-3 py-3">{body}</div>
              )}
            </motion.li>
          );
        })}
      </AnimatePresence>
    </ul>
  );
}

/* ------------------------------------------------------------------ the catalogue */

const sketch = "h-full w-full text-brass";

export const WIDGETS: readonly WidgetDef[] = [
  {
    id: "kpi-enquiries",
    title: "Enquiries",
    tag: "Key figure",
    blurb: "How many enquiries arrived in the period, against the period before.",
    size: "kpi",
    render: (c) => (
      <Kpi
        value={unavailable(c.snapshot, "enquiries") ? null : c.agg.total}
        reduced={c.reduced}
        label="enquiries"
        delta={c.agg.delta}
        spark={c.agg.spark}
        href="/admin/enquiries"
        foot={<>{c.agg.previousTotal.toLocaleString("en-IN")} in the {c.range} days before · {periodLabel(c.range)}</>}
      />
    ),
    preview: (
      <svg viewBox="0 0 120 60" className={sketch} aria-hidden>
        <text x="8" y="26" className="fill-current font-mono text-[18px]">1,284</text>
        <path d="M8 48 Q30 30 50 42 T92 32 T112 40" fill="none" stroke="currentColor" strokeWidth="2" />
      </svg>
    ),
  },
  {
    id: "kpi-new",
    title: "Waiting for a first reply",
    tag: "Key figure",
    blurb: "Enquiries still marked New, across all time, and how many of the period's have nobody assigned.",
    size: "kpi",
    render: (c) => (
      <Kpi
        value={c.snapshot.totals.newStatus}
        reduced={c.reduced}
        label="new enquiries"
        href="/admin/enquiries?status=new"
        foot={<>{c.agg.unassignedNew.toLocaleString("en-IN")} of the {periodLabel(c.range)} have no one assigned yet</>}
      />
    ),
    preview: (
      <svg viewBox="0 0 120 60" className={sketch} aria-hidden>
        <text x="8" y="30" className="fill-current font-mono text-[22px]">12</text>
        <rect x="8" y="42" width="70" height="4" fill="currentColor" opacity="0.4" />
      </svg>
    ),
  },
  {
    id: "kpi-accounts",
    title: "Accounts to review",
    tag: "Key figure",
    blurb: "Teacher and school accounts waiting for a staff decision.",
    size: "kpi",
    render: (c) => <Kpi value={c.snapshot.totals.accountsPending} reduced={c.reduced} label="accounts to review" href="/admin/accounts" foot="Teachers and schools are approved by hand; students and parents are active at once" />,
    preview: (
      <svg viewBox="0 0 120 60" className={sketch} aria-hidden>
        <circle cx="30" cy="26" r="10" fill="none" stroke="currentColor" strokeWidth="2" />
        <path d="M12 52 Q30 34 48 52" fill="none" stroke="currentColor" strokeWidth="2" />
        <text x="66" y="34" className="fill-current font-mono text-[18px]">7</text>
      </svg>
    ),
  },
  {
    id: "kpi-mou",
    title: "MOU requests open",
    tag: "Key figure",
    blurb: "School board agreements that are pending or being reviewed.",
    size: "kpi",
    render: (c) => <Kpi value={c.snapshot.totals.mouOpen} reduced={c.reduced} label="open MOU requests" href="/admin/mou" foot="Pending or under review" />,
    preview: (
      <svg viewBox="0 0 120 60" className={sketch} aria-hidden>
        <rect x="14" y="8" width="36" height="46" fill="none" stroke="currentColor" strokeWidth="2" />
        <path d="M22 22h20M22 30h20M22 38h12" stroke="currentColor" strokeWidth="2" />
        <text x="66" y="36" className="fill-current font-mono text-[18px]">5</text>
      </svg>
    ),
  },
  {
    id: "trend",
    title: "Enquiries over time",
    tag: "Chart",
    blurb: "A line for each day of the period, with the period before as a dashed line. Touch or hover any day.",
    size: "wide",
    render: (c) => (
      <AreaChart
        reduced={c.reduced}
        unit="enquiries"
        data={c.agg.daily.map((d, i) => ({
          label: dayLabel(d.day),
          value: d.count,
          previous: c.agg.previousDaily[i],
        }))}
      />
    ),
    preview: (
      <svg viewBox="0 0 120 60" className={sketch} aria-hidden>
        <path d="M6 46 Q24 14 40 34 T74 24 T114 14" fill="none" stroke="currentColor" strokeWidth="2.4" />
        <path d="M6 46 Q24 14 40 34 T74 24 T114 14 V54 H6Z" fill="currentColor" opacity="0.14" />
      </svg>
    ),
  },
  {
    id: "activity",
    title: "Live activity",
    tag: "Feed",
    blurb: "New enquiries and staff changes as they happen. New rows slide in and glow for a few seconds.",
    size: "side",
    render: (c) => <Feed c={c} />,
    preview: (
      <svg viewBox="0 0 120 60" className={sketch} aria-hidden>
        {[10, 26, 42].map((y) => (
          <g key={y}>
            <rect x="8" y={y} width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.6" />
            <rect x="28" y={y + 1} width="70" height="4" fill="currentColor" opacity="0.7" />
            <rect x="28" y={y + 8} width="34" height="3" fill="currentColor" opacity="0.35" />
          </g>
        ))}
      </svg>
    ),
  },
  {
    id: "forms",
    title: "By form",
    tag: "Bars",
    blurb: "Which website forms the enquiries came through.",
    size: "third",
    render: (c) => <BarList reduced={c.reduced} rows={c.agg.byGate.map((g) => ({ key: g.key, label: gateLabel(g.key), count: g.count }))} empty="No enquiries in this period." />,
    preview: (
      <svg viewBox="0 0 120 60" className={sketch} aria-hidden>
        {[[8, 88], [22, 64], [36, 42], [50, 22]].map(([y, w]) => (
          <rect key={y} x="8" y={y - 2} width={w} height="6" fill="currentColor" opacity={0.25 + w / 160} />
        ))}
      </svg>
    ),
  },
  {
    id: "pipeline",
    title: "Where they stand",
    tag: "Pipeline",
    blurb: "The period's enquiries by status, from New to Closed.",
    size: "third",
    render: (c) => (
      <SplitBar
        reduced={c.reduced}
        parts={c.agg.byStatus.map((s) => ({ key: s.key, label: statusName(s.key), count: s.count, tone: STATUS_TONE[s.key] ?? "var(--color-dust)" }))}
      />
    ),
    preview: (
      <svg viewBox="0 0 120 60" className={sketch} aria-hidden>
        {[[8, 34, 1], [42, 22, 0.7], [64, 26, 0.5], [90, 22, 0.3]].map(([x, w, o]) => (
          <rect key={x} x={x} y="20" width={w - 2} height="14" fill="currentColor" opacity={o} />
        ))}
      </svg>
    ),
  },
  {
    id: "latest",
    title: "Latest enquiries",
    tag: "Table",
    blurb: "The eight newest enquiries, each linking to its page.",
    size: "wide",
    href: "/admin/enquiries",
    render: (c) =>
      c.snapshot.latest.length === 0 ? (
        <p className="t-ui text-sm text-dust">{unavailable(c.snapshot, "latest") ? "The latest enquiries could not be loaded." : "No enquiries yet."}</p>
      ) : (
        <ul className="divide-y divide-line">
          {c.snapshot.latest.map((l, i) => (
            <motion.li
              key={l.id}
              initial={c.reduced ? false : { opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: c.reduced ? 0 : 0.5, delay: c.reduced ? 0 : 0.04 * i, ease: ease.citadel }}
              className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1 py-3 sm:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_auto_auto]"
            >
              <Link href={l.id.startsWith("sample-") ? "#" : `/admin/leads/${l.id}`} className="t-ui min-w-0 truncate text-sm text-bone underline decoration-line underline-offset-4 hover:text-gold hover:decoration-gold">
                {l.name}
              </Link>
              <span className="t-ui order-3 col-span-2 truncate text-xs text-dust sm:order-none sm:col-span-1 sm:text-sm sm:text-sand">{gateLabel(l.gate)}</span>
              <StatusChip status={l.status} />
              <time dateTime={l.at} className="hidden w-24 text-right font-mono text-[0.68rem] text-dust sm:block">
                {relativeTime(l.at, c.now)}
              </time>
            </motion.li>
          ))}
        </ul>
      ),
    preview: (
      <svg viewBox="0 0 120 60" className={sketch} aria-hidden>
        {[10, 24, 38].map((y) => (
          <g key={y}>
            <rect x="8" y={y} width="44" height="5" fill="currentColor" opacity="0.7" />
            <rect x="60" y={y} width="22" height="5" fill="currentColor" opacity="0.35" />
            <rect x="90" y={y - 1} width="22" height="7" fill="none" stroke="currentColor" strokeWidth="1.4" />
          </g>
        ))}
      </svg>
    ),
  },
  {
    id: "handled",
    title: "Picked up",
    tag: "Gauge",
    blurb: "The share of the period's enquiries that someone has moved on from New.",
    size: "side",
    render: (c) => (
      <div>
        <TickGauge percent={c.agg.handledPct} reduced={c.reduced} label="of enquiries picked up" />
        <p className="t-ui mt-3 text-center text-xs text-dust">{periodLabel(c.range)}</p>
      </div>
    ),
    preview: (
      <svg viewBox="0 0 120 60" className={sketch} aria-hidden>
        {Array.from({ length: 17 }, (_, i) => {
          const a = Math.PI + (i / 16) * Math.PI;
          const q = (v: number) => Math.round(v * 100) / 100;
          return <line key={i} x1={q(60 + Math.cos(a) * 30)} y1={q(52 + Math.sin(a) * 30)} x2={q(60 + Math.cos(a) * 42)} y2={q(52 + Math.sin(a) * 42)} stroke="currentColor" strokeWidth="2" opacity={i < 11 ? 1 : 0.3} />;
        })}
      </svg>
    ),
  },
  {
    id: "weekday",
    title: "Busiest days",
    tag: "Columns",
    blurb: "Which days of the week enquiries tend to arrive on (India time).",
    size: "third",
    render: (c) => <Columns rows={c.agg.byWeekday} reduced={c.reduced} unit="enquiries" />,
    preview: (
      <svg viewBox="0 0 120 60" className={sketch} aria-hidden>
        {[26, 34, 52, 30, 22, 14, 18].map((h, i) => (
          <rect key={i} x={10 + i * 14} y={56 - h} width="9" height={h} fill="currentColor" opacity={h === 52 ? 1 : 0.3} />
        ))}
      </svg>
    ),
  },
  {
    id: "sources",
    title: "Where they came from",
    tag: "Split",
    blurb: "QR codes, campaign links and direct visits.",
    size: "third",
    render: (c) => (
      <SplitBar
        reduced={c.reduced}
        parts={[
          { key: "qr", label: "QR codes", count: c.agg.sources.qr, tone: "var(--color-gold)" },
          { key: "campaign", label: "Campaign links", count: c.agg.sources.campaign, tone: "var(--color-brass)" },
          { key: "direct", label: "Direct", count: c.agg.sources.direct, tone: "var(--color-dust)" },
        ]}
      />
    ),
    preview: (
      <svg viewBox="0 0 120 60" className={sketch} aria-hidden>
        <rect x="8" y="14" width="104" height="10" fill="currentColor" opacity="0.2" />
        <rect x="8" y="14" width="52" height="10" fill="currentColor" />
        <rect x="8" y="34" width="70" height="4" fill="currentColor" opacity="0.4" />
        <rect x="8" y="44" width="40" height="4" fill="currentColor" opacity="0.3" />
      </svg>
    ),
  },
  {
    id: "hubs",
    title: "QR captures by hub",
    tag: "List",
    blurb: "Which hubs the scanned QR codes brought the most families from.",
    size: "third",
    href: "/admin/qr",
    render: (c) =>
      c.snapshot.hubs === null ? (
        <p className="t-ui text-sm text-dust">QR captures could not be loaded.</p>
      ) : (
        <BarList reduced={c.reduced} rows={c.snapshot.hubs.map((h) => ({ key: h.hub, label: h.hub, count: h.captures, note: h.converted ? `${h.converted} enrolled` : undefined }))} empty="No QR captures yet." />
      ),
    preview: (
      <svg viewBox="0 0 120 60" className={sketch} aria-hidden>
        {[10, 24, 38].map((y, i) => (
          <g key={y}>
            <circle cx="14" cy={y + 4} r="3" fill="currentColor" />
            <rect x="24" y={y + 2} width={78 - i * 22} height="4" fill="currentColor" opacity={0.7 - i * 0.2} />
          </g>
        ))}
      </svg>
    ),
  },
];

/** One tone per status, from the site's role tokens (the legend always names them, so colour is never the only signal). */
const STATUS_TONE: Record<string, string> = {
  new: "var(--color-gold)",
  reviewing: "color-mix(in srgb, var(--color-gold) 62%, var(--color-ember))",
  contacted: "var(--color-brass)",
  qualified: "color-mix(in srgb, var(--color-brass) 60%, var(--color-ember))",
  closed: "var(--color-dust)",
  rejected: "color-mix(in srgb, var(--color-dust) 40%, var(--color-ember))",
};

export const DEFAULT_LAYOUT: readonly string[] = ["kpi-enquiries", "kpi-new", "kpi-accounts", "kpi-mou", "trend", "activity", "forms", "pipeline", "latest", "handled", "weekday", "sources", "hubs"];
export const widgetById = (id: string) => WIDGETS.find((w) => w.id === id);
