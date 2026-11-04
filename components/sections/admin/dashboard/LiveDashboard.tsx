"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useMemo, useRef, useState, type ButtonHTMLAttributes, type ReactNode } from "react";
import { ArrowDown, ArrowUp, Check, Download, Plus, RotateCw, SlidersHorizontal, Trash2, X } from "lucide-react";
import { usePref } from "@/components/sections/admin/use-pref";
import { aggregate, gateLabel, RANGES, statusName, type Aggregates, type OverviewSnapshot, type RangeDays } from "@/lib/admin/overview";
import { useDialogFocus } from "@/lib/motion/use-dialog-focus";
import { useReducedMotion } from "@/lib/motion/reduced";
import { ease } from "@/lib/motion/tokens";
import { cn } from "@/lib/utils";
import styles from "./LiveDashboard.module.css";
import { REFRESH_MS, useLiveOverview, type LiveState } from "./use-live-overview";
import { DEFAULT_LAYOUT, WIDGETS, widgetById, type WidgetDef, type WidgetSize } from "./widgets";

/* Static class names, so Tailwind can see every one of them. The grid is 2 columns on a phone, 6 on a tablet, 12 on a desktop. */
const SPAN: Record<WidgetSize, string> = {
  kpi: "col-span-1 md:col-span-3 xl:col-span-3",
  wide: "col-span-2 md:col-span-6 xl:col-span-8",
  side: "col-span-2 md:col-span-3 xl:col-span-4",
  third: "col-span-2 md:col-span-3 xl:col-span-4",
};

/** The saved layout is a comma-separated list of widget ids. Anything unknown is dropped; nothing saved means the default. */
export function parseLayout(saved: string): string[] {
  if (!saved) return [...DEFAULT_LAYOUT];
  const ids = saved.split(",").filter((id, i, all) => widgetById(id) && all.indexOf(id) === i);
  return ids;
}

function exportCsv(agg: Aggregates, snapshot: OverviewSnapshot) {
  const lines = ["section,label,count", ...agg.daily.map((d) => `day,${d.day},${d.count}`), ...agg.byGate.map((g) => `form,${gateLabel(g.key)},${g.count}`), ...agg.byStatus.map((s) => `status,${statusName(s.key)},${s.count}`), `source,QR codes,${agg.sources.qr}`, `source,Campaign links,${agg.sources.campaign}`, `source,Direct,${agg.sources.direct}`];
  const blob = new Blob([`# Summary counts only, last ${agg.rangeDays} days, India time. Generated ${snapshot.generatedAt}${snapshot.sample ? " (SAMPLE data)" : ""}\n${lines.join("\n")}\n`], { type: "text/csv;charset=utf-8" });
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
 * The staff overview: live figures, animated charts, a feed that updates itself, and a layout each person arranges (add, remove, move)
 * and the browser remembers. The data arrives as one snapshot (counts and names, never contact details) and is refreshed every ten
 * seconds while the tab is visible; the date range, every chart and every card are computed from that snapshot in the browser, so
 * switching the range is instant.
 */
export function LiveDashboard({ initial, refresh, intervalMs = REFRESH_MS }: { initial: OverviewSnapshot; refresh: () => Promise<OverviewSnapshot>; intervalMs?: number }) {
  const reduced = useReducedMotion();
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

  // A clock for the "3 min ago" labels and the "updated 4 s ago" line.
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
    <div>
      <header className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
        <div className="min-w-0">
          <h1 className="t-voice text-[clamp(1.8rem,4vw,3rem)] leading-tight text-bone">Overview</h1>
          <p className="t-ui mt-1 max-w-2xl text-sm text-dust">What is happening on the website, as it happens. Times are India Standard Time.</p>
        </div>
        <LiveBadge state={state} lastOkAt={lastOkAt} now={now} sample={snapshot.sample === true} onRefresh={refreshNow} />
      </header>

      {snapshot.sample && (
        <p role="note" className="label mt-4 border border-gold/50 px-3 py-2 text-gold">
          SAMPLE data: every number on this page is invented, for the development preview only.
        </p>
      )}

      <div className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-3 border-y border-line py-3">
        <div role="radiogroup" aria-label="Period" className="flex">
          {RANGES.map((r) => (
            <button
              key={r}
              type="button"
              role="radio"
              aria-checked={range === r}
              onClick={() => setRange(String(r))}
              className={cn("label min-h-11 min-w-[4.5rem] border border-line px-3 transition-colors first:border-r-0 last:border-l-0", range === r ? "bg-gold text-night" : "text-sand hover:text-gold")}
            >
              {r} days
            </button>
          ))}
        </div>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <button type="button" onClick={() => setEditing((e) => !e)} aria-pressed={editing} className={cn("label inline-flex min-h-11 items-center gap-2 border px-3 transition-colors", editing ? "border-gold bg-umber text-gold" : "border-line text-sand hover:border-gold hover:text-gold")}>
            <SlidersHorizontal className="h-4 w-4" aria-hidden /> {editing ? "Done" : "Customise"}
          </button>
          <button type="button" onClick={() => exportCsv(agg, snapshot)} className="label inline-flex min-h-11 items-center gap-2 border border-line px-3 text-sand hover:border-gold hover:text-gold" title="Counts only, no personal details">
            <Download className="h-4 w-4" aria-hidden /> <span className="hidden sm:inline">Export summary</span>
            <span className="sm:hidden">Export</span>
          </button>
          <button type="button" onClick={() => setDrawer(true)} className="label inline-flex min-h-11 items-center gap-2 bg-gold px-4 text-night hover:bg-bone">
            <Plus className="h-4 w-4" aria-hidden /> Add widget
          </button>
        </div>
      </div>

      <div className="mt-3 min-h-[1.5rem] space-y-2" aria-live="polite">
        <AnimatePresence>
          {sinceOpen > 0 && (
            <motion.p key="since" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="label inline-block border border-gold/50 px-3 py-1.5 text-gold">
              +{sinceOpen} new {sinceOpen === 1 ? "enquiry" : "enquiries"} since you opened this page
            </motion.p>
          )}
        </AnimatePresence>
        {snapshot.rowsTruncated && <p className="t-ui text-xs text-dust">The charts use the newest 1,500 enquiries of the last 90 days.</p>}
        {snapshot.unavailable.length > 0 && !snapshot.sample && (
          <p role="status" className="t-ui text-xs text-sand">
            Some figures could not be loaded ({snapshot.unavailable.join(", ")}). They will return on their own.
          </p>
        )}
      </div>

      {visible.length === 0 ? (
        <div className="plate mt-6 p-8 text-center">
          <p className="t-voice text-xl text-bone">The dashboard is empty.</p>
          <p className="t-ui mt-2 text-sm text-dust">Add a widget to begin, or restore the default layout.</p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <button type="button" onClick={() => setDrawer(true)} className="label min-h-11 bg-gold px-4 text-night hover:bg-bone">Add widget</button>
            <button type="button" onClick={() => setLayoutSaved("")} className="label min-h-11 border border-line px-4 text-sand hover:border-gold hover:text-gold">Restore default</button>
          </div>
        </div>
      ) : (
        <div className="mt-4 grid grid-flow-dense grid-cols-2 gap-3 md:grid-cols-6 md:gap-4 xl:grid-cols-12">
          {visible.map((w, i) => (
            <WidgetCard key={w.id} w={w} ctx={ctx} index={i} editing={editing} first={i === 0} last={i === visible.length - 1} onMove={move} onRemove={(id) => save(layout.filter((x) => x !== id))} reduced={reduced} />
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
  );
}

/* ------------------------------------------------------------------ the live badge */

function LiveBadge({ state, lastOkAt, now, sample, onRefresh }: { state: LiveState; lastOkAt: number; now: number; sample: boolean; onRefresh: () => void }) {
  const ago = lastOkAt ? Math.max(0, Math.round((now - lastOkAt) / 1000)) : 0;
  const text = sample ? "Simulated feed" : state === "live" ? (ago < 3 ? "Live · just updated" : `Live · updated ${ago < 60 ? `${ago} s` : `${Math.round(ago / 60)} min`} ago`) : state === "retrying" ? "Reconnecting…" : "Paused while this tab is hidden";
  return (
    <div className="flex items-center gap-3">
      <p className="label flex items-center gap-2 text-sand" role="status">
        <span aria-hidden className={cn(styles.dot, (state !== "live" && !sample) && styles.dotIdle)} />
        {text}
      </p>
      <button type="button" onClick={onRefresh} aria-label="Refresh now" className="grid h-11 w-11 place-items-center border border-line text-sand hover:border-gold hover:text-gold">
        <RotateCw className="h-4 w-4" aria-hidden />
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ one widget */

function WidgetCard({ w, ctx, index, editing, first, last, onMove, onRemove, reduced }: { w: WidgetDef; ctx: Parameters<WidgetDef["render"]>[0]; index: number; editing: boolean; first: boolean; last: boolean; onMove: (id: string, by: -1 | 1) => void; onRemove: (id: string) => void; reduced: boolean }) {
  const kpi = w.size === "kpi";
  return (
    <motion.section
      layout={reduced ? false : "position"}
      aria-label={w.title}
      initial={reduced ? false : { opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduced ? 0 : 0.7, delay: reduced ? 0 : Math.min(index, 8) * 0.05, ease: ease.citadel, layout: { duration: 0.45, ease: ease.citadel } }}
      className={cn("plate relative flex min-w-0 flex-col p-4 sm:p-5", SPAN[w.size], w.tall && "xl:row-span-2", editing && "outline outline-1 -outline-offset-4 outline-dashed outline-brass/60")}
    >
      <div className="flex items-start justify-between gap-3">
        <h2 className="label min-w-0 text-brass">
          {w.href ? (
            <Link href={w.href} className="inline-flex items-center gap-1 hover:text-gold">
              {w.title}
            </Link>
          ) : (
            w.title
          )}
        </h2>
        {editing && (
          <div className="-mr-1 -mt-1 flex shrink-0 gap-1" role="group" aria-label={`Arrange ${w.title}`}>
            <IconButton label={`Move ${w.title} earlier`} disabled={first} onClick={() => onMove(w.id, -1)}><ArrowUp className="h-4 w-4" /></IconButton>
            <IconButton label={`Move ${w.title} later`} disabled={last} onClick={() => onMove(w.id, 1)}><ArrowDown className="h-4 w-4" /></IconButton>
            <IconButton label={`Remove ${w.title}`} onClick={() => onRemove(w.id)}><Trash2 className="h-4 w-4" /></IconButton>
          </div>
        )}
      </div>
      <div className={cn("min-w-0 flex-1", kpi ? "mt-3" : "mt-4")}>{w.render(ctx)}</div>
    </motion.section>
  );
}

function IconButton({ label, children, ...rest }: { label: string; children: ReactNode } & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type="button" aria-label={label} title={label} className="grid h-11 w-11 place-items-center border border-line text-sand hover:border-gold hover:text-gold disabled:opacity-30 disabled:hover:border-line disabled:hover:text-sand sm:h-9 sm:w-9" {...rest}>
      {children}
    </button>
  );
}

/* ------------------------------------------------------------------ the add-widget drawer */

function AddWidgetDrawer({ open, onClose, hidden, onAdd, onReset, reduced }: { open: boolean; onClose: () => void; hidden: readonly WidgetDef[]; onAdd: (id: string) => void; onReset: () => void; reduced: boolean }) {
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
            <motion.button type="button" aria-label="Close" onClick={onClose} className="absolute inset-0 bg-[color-mix(in_srgb,var(--color-ink)_45%,transparent)]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: reduced ? 0 : 0.25 }} />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="add-widget-h"
              className="tone-dark plate absolute inset-x-0 bottom-0 flex max-h-[88svh] flex-col bg-night md:inset-y-0 md:left-auto md:right-0 md:max-h-none md:w-[min(30rem,100vw)]"
              initial={reduced ? false : { y: "100%" }}
              animate={{ y: 0 }}
              exit={reduced ? { opacity: 0 } : { y: "100%" }}
              transition={{ duration: reduced ? 0 : 0.45, ease: ease.citadel }}
            >
              <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
                <div>
                  <h2 id="add-widget-h" className="t-voice text-2xl text-bone">Add widget</h2>
                  <p className="t-ui mt-1 text-sm text-dust">Choose what the overview shows. It is remembered on this browser.</p>
                </div>
                <button type="button" onClick={onClose} aria-label="Close" className="grid h-11 w-11 shrink-0 place-items-center border border-line text-bone hover:border-gold hover:text-gold">
                  <X className="h-5 w-5" aria-hidden />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto px-5 py-2">
                {hidden.length === 0 ? (
                  <p className="t-ui py-8 text-center text-sm text-dust">Every widget is already on the dashboard.</p>
                ) : (
                  <ul className="divide-y divide-line">
                    {hidden.map((w, i) => (
                      <motion.li key={w.id} initial={reduced ? false : { opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: reduced ? 0 : 0.45, delay: reduced ? 0 : 0.05 * i, ease: ease.citadel }} className="grid grid-cols-[6.5rem_minmax(0,1fr)] gap-4 py-4">
                        <div aria-hidden className="grid aspect-[2/1] place-items-center border border-line bg-umber p-2">{w.preview}</div>
                        <div className="min-w-0">
                          <p className="t-voice text-lg leading-tight text-bone">{w.title}</p>
                          <p className="t-ui mt-1 text-xs leading-snug text-dust">{w.blurb}</p>
                          <div className="mt-3 flex items-center justify-between gap-3">
                            <span className="label border border-line px-2 py-1 text-brass">{w.tag}</span>
                            <button
                              type="button"
                              onClick={() => {
                                onAdd(w.id);
                                setAdded(w.id);
                              }}
                              className="label inline-flex min-h-11 items-center gap-1.5 bg-gold px-4 text-night hover:bg-bone"
                            >
                              {added === w.id ? <Check className="h-4 w-4" aria-hidden /> : <Plus className="h-4 w-4" aria-hidden />} {added === w.id ? "Added" : "Select"}
                            </button>
                          </div>
                        </div>
                      </motion.li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="flex items-center justify-between gap-3 border-t border-line px-5 py-3">
                <button type="button" onClick={onReset} className="label min-h-11 text-sand hover:text-gold">Restore the default layout</button>
                <button type="button" onClick={onClose} className="label min-h-11 border border-line px-4 text-bone hover:border-gold hover:text-gold">Done</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
