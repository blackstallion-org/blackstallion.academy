"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useMemo, useRef, useState, type ButtonHTMLAttributes, type ReactNode } from "react";
import { ArrowDown, ArrowUp, Check, Download, Plus, RotateCw, SlidersHorizontal, Trash2, X } from "lucide-react";
import { usePref } from "@/components/sections/admin/use-pref";
import { aggregate, gateLabel, RANGES, statusName, type Aggregates, type OverviewSnapshot, type RangeDays } from "@/lib/admin/overview";
import { useDialogFocus } from "@/lib/motion/use-dialog-focus";
import { useReducedMotion } from "@/lib/motion/reduced";
import { cn } from "@/lib/utils";
import styles from "./LiveDashboard.module.css";
import { REFRESH_MS, useLiveOverview, type LiveState } from "./use-live-overview";
import { BENTO_GRADIENTS, DEFAULT_LAYOUT, WIDGETS, widgetById, type WidgetDef, type WidgetSize } from "./widgets";

/* Static class names for the responsive bento grid. 2 cols on mobile, 6 on tablet, 12 on desktop. */
const SPAN: Record<WidgetSize, string> = {
  kpi: "col-span-2 sm:col-span-1 md:col-span-3 xl:col-span-3",
  wide: "col-span-2 md:col-span-6 xl:col-span-8",
  side: "col-span-2 md:col-span-6 xl:col-span-4",
  third: "col-span-2 md:col-span-3 xl:col-span-4",
};

/** The saved layout is a comma-separated list of widget ids. Anything unknown is dropped. */
export function parseLayout(saved: string): string[] {
  if (!saved) return [...DEFAULT_LAYOUT];
  const ids = saved.split(",").filter((id, i, all) => widgetById(id) && all.indexOf(id) === i);
  return ids;
}

function exportCsv(agg: Aggregates, snapshot: OverviewSnapshot) {
  const lines = [
    "section,label,count",
    ...agg.daily.map((d) => `day,${d.day},${d.count}`),
    ...agg.byGate.map((g) => `form,${gateLabel(g.key)},${g.count}`),
    ...agg.byStatus.map((s) => `status,${statusName(s.key)},${s.count}`),
    `source,QR codes,${agg.sources.qr}`,
    `source,Campaign links,${agg.sources.campaign}`,
    `source,Direct,${agg.sources.direct}`,
  ];
  const blob = new Blob(
    [`# Summary counts only, last ${agg.rangeDays} days, India time. Generated ${snapshot.generatedAt}${snapshot.sample ? " (SAMPLE data)" : ""}\n${lines.join("\n")}\n`],
    { type: "text/csv;charset=utf-8" }
  );
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `bsah-overview-${agg.rangeDays}d.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/**
 * The staff overview: live figures, animated charts, a feed that updates itself,
 * and cards arranged in the Finance Bento aesthetic with glowing cores, rim highlights,
 * and electric lime accents.
 */
export function LiveDashboard({
  initial,
  refresh,
  intervalMs = REFRESH_MS,
}: {
  initial: OverviewSnapshot;
  refresh: () => Promise<OverviewSnapshot>;
  intervalMs?: number;
}) {
  const systemReduced = useReducedMotion();
  const reduced = systemReduced;
  const { snapshot, state, lastOkAt, fresh, sinceOpen, refreshNow } = useLiveOverview(initial, refresh, intervalMs);
  const [rangeSaved, setRange] = usePref("bsah-admin-range", "30");
  const [layoutSaved, setLayoutSaved] = usePref("bsah-admin-widgets", "");
  const [editing, setEditing] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const [now, setNow] = useState(() => Date.parse(initial.generatedAt) || 0);
  const range: RangeDays = (RANGES as readonly number[]).includes(Number(rangeSaved)) ? (Number(rangeSaved) as RangeDays) : 30;
  const layout = useMemo(() => parseLayout(layoutSaved), [layoutSaved]);
  const save = useCallback((ids: string[]) => setLayoutSaved(ids.join(",") || "none"), [setLayoutSaved]);
  const visible = layout.map(widgetById).filter((w): w is WidgetDef => Boolean(w));

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 5000);
    return () => clearInterval(t);
  }, []);

  const agg = useMemo(() => aggregate(snapshot.rows, now, range), [snapshot.rows, now, range]);
  const ctx = { snapshot, agg, range, now, reduced, fresh };

  const move = (id: string, by: -1 | 1) => {
    const i = layout.indexOf(id);
    const j = i + by;
    if (i < 0 || j < 0 || j >= layout.length) return;
    const next = [...layout];
    [next[i], next[j]] = [next[j], next[i]];
    save(next);
  };

  return (
    <div className={styles.fpb}>
      <div className={styles.fpbC}>
        {/* Top bar with title, live status, period segmented buttons & actions */}
        <header className="flex flex-wrap items-center justify-between gap-x-6 gap-y-4 pb-4 border-b border-white/10">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold tracking-tight text-white md:text-3xl flex flex-wrap items-baseline gap-x-3 gap-y-1">
              Overview
              <span className="text-sm font-medium text-white/40 tracking-normal">
                Website activity, live IST
              </span>
            </h1>
          </div>
          <LiveBadge state={state} lastOkAt={lastOkAt} now={now} sample={snapshot.sample === true} onRefresh={refreshNow} />
        </header>

        {snapshot.sample && (
          <div role="note" className="mt-4 flex items-center justify-between rounded-xl bg-[#E8FF1F]/10 border border-[#E8FF1F]/25 px-4 py-2.5 text-xs text-[#E8FF1F] font-medium">
            <span>SAMPLE preview data: every number shown is simulated for interface testing.</span>
            <span className="font-mono text-[11px] uppercase tracking-wider opacity-75">DEV MODE</span>
          </div>
        )}

        {/* Controls row */}
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <div role="radiogroup" aria-label="Period" className={styles.seg}>
            {RANGES.map((r) => (
              <button
                key={r}
                type="button"
                role="radio"
                aria-checked={range === r}
                aria-pressed={range === r}
                onClick={() => setRange(String(r))}
              >
                {r}D
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => setEditing((e) => !e)}
              aria-pressed={editing}
              className={cn(styles.ctrlBtn, editing && styles.ctrlBtnActive)}
            >
              <SlidersHorizontal className="h-4 w-4" aria-hidden />
              {editing ? "Done" : "Customise"}
            </button>
            <button
              type="button"
              onClick={() => exportCsv(agg, snapshot)}
              className={styles.ctrlBtn}
              title="Counts only, no personal details"
            >
              <Download className="h-4 w-4" aria-hidden />
              <span className="hidden sm:inline">Export summary</span>
              <span className="sm:hidden">Export</span>
            </button>
            <button
              type="button"
              onClick={() => setDrawer(true)}
              className={styles.addBtn}
            >
              <Plus className="h-4 w-4" aria-hidden /> Add widget
            </button>
          </div>
        </div>

        {/* Status updates */}
        <div className="mt-2.5 min-h-[1.5rem] space-y-1" aria-live="polite">
          <AnimatePresence>
            {sinceOpen > 0 && (
              <motion.p
                key="since"
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="inline-flex items-center gap-2 rounded-full bg-[#E8FF1F]/15 border border-[#E8FF1F]/30 px-3 py-1 font-mono text-xs text-[#E8FF1F]"
              >
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#E8FF1F]" />
                +{sinceOpen} new {sinceOpen === 1 ? "enquiry" : "enquiries"} since you opened this page
              </motion.p>
            )}
          </AnimatePresence>
          {snapshot.rowsTruncated && <p className="text-xs text-white/40">The charts use the newest 1,500 enquiries of the last 90 days.</p>}
          {snapshot.unavailable.length > 0 && !snapshot.sample && (
            <p role="status" className="text-xs text-white/60">
              Some figures could not be loaded ({snapshot.unavailable.join(", ")}). They will return on their own.
            </p>
          )}
        </div>

        {/* Main Bento Grid */}
        {visible.length === 0 ? (
          <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-10 text-center mt-6">
            <p className="text-xl font-bold text-white">The dashboard is empty.</p>
            <p className="mt-2 text-sm text-white/50">Add a widget to begin, or restore the default layout.</p>
            <div className="mt-5 flex flex-wrap justify-center gap-3">
              <button type="button" onClick={() => setDrawer(true)} className={styles.addBtn}>
                Add widget
              </button>
              <button
                type="button"
                onClick={() => setLayoutSaved("")}
                className={styles.ctrlBtn}
              >
                Restore default
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-2 gap-3.5 sm:gap-4 md:grid-cols-6 xl:grid-cols-12">
            {visible.map((w, i) => (
              <WidgetCard
                key={w.id}
                w={w}
                ctx={ctx}
                index={i}
                editing={editing}
                first={i === 0}
                last={i === visible.length - 1}
                onMove={move}
                onRemove={(id) => save(layout.filter((x) => x !== id))}
                reduced={reduced}
              />
            ))}
          </div>
        )}

        <AddWidgetDrawer
          open={drawer}
          onClose={() => setDrawer(false)}
          hidden={WIDGETS.filter((w) => !layout.includes(w.id))}
          onAdd={(id) => save([...layout, id])}
          onReset={() => setLayoutSaved("")}
          reduced={reduced}
        />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ the live badge */

function LiveBadge({
  state,
  lastOkAt,
  now,
  sample,
  onRefresh,
}: {
  state: LiveState;
  lastOkAt: number;
  now: number;
  sample: boolean;
  onRefresh: () => void;
}) {
  const ago = lastOkAt ? Math.max(0, Math.round((now - lastOkAt) / 1000)) : 0;
  const text = sample
    ? "Simulated feed"
    : state === "live"
    ? ago < 3
      ? "Live · just updated"
      : `Live · updated ${ago < 60 ? `${ago}s` : `${Math.round(ago / 60)}m`} ago`
    : state === "retrying"
    ? "Reconnecting…"
    : "Paused while hidden";

  return (
    <div className="flex items-center gap-2.5">
      <p className="flex items-center gap-2 font-mono text-xs text-white/70" role="status">
        <span aria-hidden className={cn(styles.dot, state !== "live" && !sample && styles.dotIdle)} />
        {text}
      </p>
      <button
        type="button"
        onClick={onRefresh}
        aria-label="Refresh now"
        className="grid h-8 w-8 place-items-center rounded-xl bg-white/[0.08] hover:bg-white/[0.14] text-white/75 hover:text-[#E8FF1F] transition-colors"
      >
        <RotateCw className="h-3.5 w-3.5" aria-hidden />
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ one widget card */

function WidgetCard({
  w,
  ctx,
  index,
  editing,
  first,
  last,
  onMove,
  onRemove,
  reduced,
}: {
  w: WidgetDef;
  ctx: Parameters<WidgetDef["render"]>[0];
  index: number;
  editing: boolean;
  first: boolean;
  last: boolean;
  onMove: (id: string, by: -1 | 1) => void;
  onRemove: (id: string) => void;
  reduced: boolean;
}) {
  const kpi = w.size === "kpi";
  const variant = w.variant ?? "glass";
  const gr = variant in BENTO_GRADIENTS ? BENTO_GRADIENTS[variant as keyof typeof BENTO_GRADIENTS] : null;
  const isSolid = variant === "solid";
  const isLime = variant === "lime";
  const isLightText = isLime || isSolid;

  return (
    <motion.section
      layout={reduced ? false : "position"}
      aria-label={w.title}
      initial={reduced ? false : { opacity: 0, y: 14, scale: 0.985 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        duration: reduced ? 0 : 0.9,
        delay: reduced ? 0 : Math.min(index, 12) * 0.06,
        ease: [0.32, 0.72, 0, 1],
        layout: { duration: 0.45, ease: [0.32, 0.72, 0, 1] },
      }}
      className={cn(
        styles.card,
        "flex min-w-0 flex-col p-5 sm:p-6",
        SPAN[w.size],
        w.tall && "xl:row-span-2",
        variant === "glass" && styles.glass,
        isSolid && styles.solid,
        editing && "outline outline-2 -outline-offset-4 outline-dashed outline-[#E8FF1F]/70 z-20"
      )}
      style={{
        color: isLightText ? "#0b0b0c" : "#ffffff",
      }}
    >
      {/* Background gradients and core blur */}
      {gr && !isSolid && (
        <>
          <div
            className={styles.g}
            style={{
              background: `linear-gradient(180deg, ${gr.top} 0%, ${gr.base} 36%, ${gr.base} 74%, ${gr.bottom} 100%)`,
            }}
          />
          <div className={styles.core} style={{ background: gr.core }} />
        </>
      )}

      {/* Rim highlight */}
      <div className={styles.rim} />

      {/* Card Header & Content (relative z-10) */}
      <div className="relative z-10 flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            {w.tag && (
              <span
                className={styles.cap}
                style={{ color: isLightText ? "rgba(0,0,0,0.55)" : "var(--t2)" }}
              >
                {w.tag}
              </span>
            )}
            <h2
              className="mt-0.5 truncate text-[17px] font-semibold tracking-[-0.02em]"
              style={{ color: isLightText ? "#0b0b0c" : "#ffffff" }}
            >
              {w.href ? (
                <Link href={w.href} className="inline-flex items-center gap-1.5 hover:underline">
                  {w.title}
                </Link>
              ) : (
                w.title
              )}
            </h2>
          </div>

          {!editing && w.icon && (
            <span
              aria-hidden
              className="-mr-1 -mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-xl"
              style={{
                color: isLightText ? "#0b0b0c" : (w.accent ?? "var(--acc)"),
                backgroundColor: isLightText
                  ? "rgba(0, 0, 0, 0.08)"
                  : "rgba(255, 255, 255, 0.12)",
              }}
            >
              <w.icon className="h-4 w-4" strokeWidth={1.8} />
            </span>
          )}

          {editing && (
            <div className="-mr-1 -mt-1 flex shrink-0 gap-1" role="group" aria-label={`Arrange ${w.title}`}>
              <IconButton label={`Move ${w.title} earlier`} disabled={first} onClick={() => onMove(w.id, -1)} light={isLightText}>
                <ArrowUp className="h-4 w-4" />
              </IconButton>
              <IconButton label={`Move ${w.title} later`} disabled={last} onClick={() => onMove(w.id, 1)} light={isLightText}>
                <ArrowDown className="h-4 w-4" />
              </IconButton>
              <IconButton label={`Remove ${w.title}`} onClick={() => onRemove(w.id)} light={isLightText}>
                <Trash2 className="h-4 w-4" />
              </IconButton>
            </div>
          )}
        </div>

        <div className={cn("min-w-0 flex-1", kpi ? "mt-3" : "mt-4")}>
          {w.render(ctx)}
        </div>
      </div>
    </motion.section>
  );
}

function IconButton({
  label,
  children,
  light = false,
  ...rest
}: {
  label: string;
  children: ReactNode;
  light?: boolean;
} & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cn(
        "grid h-8 w-8 place-items-center rounded-lg transition-colors disabled:opacity-30",
        light
          ? "text-[#0b0b0c] hover:bg-black/10"
          : "text-white/70 hover:bg-white/10 hover:text-white"
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

/* ------------------------------------------------------------------ the add-widget drawer */

function AddWidgetDrawer({
  open,
  onClose,
  hidden,
  onAdd,
  onReset,
  reduced,
}: {
  open: boolean;
  onClose: () => void;
  hidden: readonly WidgetDef[];
  onAdd: (id: string) => void;
  onReset: () => void;
  reduced: boolean;
}) {
  const scope = useRef<HTMLDivElement>(null);
  const [added, setAdded] = useState<string | null>(null);
  useDialogFocus(open, scope);

  useEffect(() => {
    if (!open) return;
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", esc);
    return () => document.removeEventListener("keydown", esc);
  }, [open, onClose]);

  useEffect(() => {
    if (!added) return;
    const t = setTimeout(() => setAdded(null), 1400);
    return () => clearTimeout(t);
  }, [added]);

  return (
    <div ref={scope}>
      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-[80]">
            <motion.button
              type="button"
              aria-label="Close"
              onClick={onClose}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: reduced ? 0 : 0.25 }}
            />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="add-widget-h"
              className="absolute inset-x-0 bottom-0 flex max-h-[88svh] flex-col rounded-t-[28px] border border-white/15 bg-[#0a0a0c] text-white shadow-2xl md:inset-y-0 md:left-auto md:right-0 md:max-h-none md:w-[min(30rem,100vw)] md:rounded-l-[28px] md:rounded-r-none"
              initial={reduced ? false : { y: "100%" }}
              animate={{ y: 0 }}
              exit={reduced ? { opacity: 0 } : { y: "100%" }}
              transition={{ duration: reduced ? 0 : 0.45, ease: [0.32, 0.72, 0, 1] }}
            >
              <div className="flex items-start justify-between gap-4 border-b border-white/10 px-6 py-5">
                <div>
                  <h2 id="add-widget-h" className="text-xl font-bold tracking-tight text-white">Add widget</h2>
                  <p className="mt-1 text-xs text-white/50">Choose what the overview shows. Saved in your browser.</p>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close"
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/10 text-white/70 hover:text-white"
                >
                  <X className="h-4 w-4" aria-hidden />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-6 py-3">
                {hidden.length === 0 ? (
                  <p className="py-12 text-center text-sm text-white/50">Every widget is already on the dashboard.</p>
                ) : (
                  <ul className="divide-y divide-white/10">
                    {hidden.map((w, i) => (
                      <motion.li
                        key={w.id}
                        initial={reduced ? false : { opacity: 0, x: 16 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: reduced ? 0 : 0.4, delay: reduced ? 0 : 0.04 * i, ease: [0.32, 0.72, 0, 1] }}
                        className="grid grid-cols-[6.5rem_minmax(0,1fr)] gap-4 py-4"
                      >
                        <div aria-hidden className="grid aspect-[2/1] place-items-center rounded-xl border border-white/10 bg-white/[0.04] p-2">
                          {w.preview}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-white">{w.title}</p>
                          <p className="mt-1 text-xs text-white/50 leading-snug">{w.blurb}</p>
                          <div className="mt-3 flex items-center justify-between gap-3">
                            <span className="font-mono text-[11px] text-white/40">{w.tag}</span>
                            <button
                              type="button"
                              onClick={() => {
                                onAdd(w.id);
                                setAdded(w.id);
                              }}
                              className="inline-flex min-h-8 items-center gap-1.5 rounded-xl bg-[#E8FF1F] px-3.5 py-1 text-xs font-semibold text-[#0b0b0c] hover:brightness-105"
                            >
                              {added === w.id ? <Check className="h-3.5 w-3.5" aria-hidden /> : <Plus className="h-3.5 w-3.5" aria-hidden />}
                              {added === w.id ? "Added" : "Add"}
                            </button>
                          </div>
                        </div>
                      </motion.li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="flex items-center justify-between gap-3 border-t border-white/10 px-6 py-4">
                <button type="button" onClick={onReset} className="text-xs text-white/50 hover:text-white transition-colors">
                  Restore default layout
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-xl border border-white/15 px-4 py-2 text-xs font-semibold text-white hover:bg-white/10 transition-colors"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
