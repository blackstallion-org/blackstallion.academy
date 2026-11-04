"use client";

import { motion } from "motion/react";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { ease } from "@/lib/motion/tokens";

/**
 * The dashboard's charts, drawn as plain SVG and CSS (no chart library): they take the site's role tokens, draw themselves in, follow a
 * pointer or a finger, and read out as text for a screen reader. Under reduced motion nothing animates; the picture is simply there.
 */

const fmt = (n: number) => n.toLocaleString("en-IN");

/* ------------------------------------------------------------------ numbers */

/** A figure that counts up to its value on arrival and eases to each new value after that. `null` means "could not be loaded". */
export function CountUp({ value, reduced, className }: { value: number | null; reduced: boolean; className?: string }) {
  const [shown, setShown] = useState(0);
  const from = useRef(0);
  useEffect(() => {
    if (value === null || reduced) {
      from.current = value ?? 0;
      return;
    }
    const start = from.current;
    const t0 = performance.now();
    const duration = start === 0 ? 1100 : 600;
    let raf = 0;
    const step = (now: number) => {
      const p = Math.min(1, (now - t0) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      from.current = start + (value - start) * eased;
      setShown(Math.round(from.current));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value, reduced]);
  // Under reduced motion the figure is simply its value; otherwise it is whatever the count has reached.
  const n = reduced ? value : shown;
  return <span className={className}>{n === null ? "—" : fmt(n)}</span>;
}

/* ------------------------------------------------------------------ sparkline */

export function Sparkline({ data, reduced, className }: { data: readonly number[]; reduced: boolean; className?: string }) {
  const id = useId();
  const max = Math.max(1, ...data);
  const w = 120;
  const h = 32;
  const pts = data.map((v, i) => [(i / Math.max(1, data.length - 1)) * w, h - 3 - (v / max) * (h - 8)] as const);
  const d = monotone(pts);
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" aria-hidden className={cn("h-8 w-full overflow-visible", className)}>
      <defs>
        <linearGradient id={`${id}-f`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="var(--color-gold)" stopOpacity="0.28" />
          <stop offset="1" stopColor="var(--color-gold)" stopOpacity="0" />
        </linearGradient>
      </defs>
      {pts.length > 1 && <path d={`${d} L${w},${h} L0,${h} Z`} fill={`url(#${id}-f)`} />}
      <motion.path d={d} fill="none" stroke="var(--color-gold)" strokeWidth="1.6" vectorEffect="non-scaling-stroke" strokeLinecap="round" initial={reduced ? false : { pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.1, ease: ease.citadel }} />
    </svg>
  );
}

/** A smooth curve through the points that never overshoots them (monotone cubic, the d3 "curveMonotoneX" rule). */
export function monotone(pts: readonly (readonly [number, number])[]): string {
  const n = pts.length;
  if (n === 0) return "";
  if (n === 1) return `M${pts[0][0]},${pts[0][1]}`;
  const dx: number[] = [];
  const slope: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    dx.push(pts[i + 1][0] - pts[i][0] || 1e-6);
    slope.push((pts[i + 1][1] - pts[i][1]) / dx[i]);
  }
  const m: number[] = [slope[0]];
  for (let i = 1; i < n - 1; i++) m.push(slope[i - 1] * slope[i] <= 0 ? 0 : (slope[i - 1] + slope[i]) / 2);
  m.push(slope[n - 2]);
  for (let i = 0; i < n - 1; i++) {
    if (slope[i] === 0) {
      m[i] = 0;
      m[i + 1] = 0;
    } else {
      const a = m[i] / slope[i];
      const b = m[i + 1] / slope[i];
      const s = a * a + b * b;
      if (s > 9) {
        const t = 3 / Math.sqrt(s);
        m[i] = t * a * slope[i];
        m[i + 1] = t * b * slope[i];
      }
    }
  }
  let d = `M${pts[0][0].toFixed(2)},${pts[0][1].toFixed(2)}`;
  for (let i = 0; i < n - 1; i++) {
    const x1 = pts[i][0] + dx[i] / 3;
    const y1 = pts[i][1] + (m[i] * dx[i]) / 3;
    const x2 = pts[i + 1][0] - dx[i] / 3;
    const y2 = pts[i + 1][1] - (m[i + 1] * dx[i]) / 3;
    d += ` C${x1.toFixed(2)},${y1.toFixed(2)} ${x2.toFixed(2)},${y2.toFixed(2)} ${pts[i + 1][0].toFixed(2)},${pts[i + 1][1].toFixed(2)}`;
  }
  return d;
}

/** A round upper bound for an axis: 4 -> 4, 7 -> 8, 23 -> 25, 140 -> 150. */
export function niceMax(v: number): number {
  if (v <= 4) return 4;
  const mag = Math.pow(10, Math.floor(Math.log10(v)));
  for (const f of [1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10]) if (f * mag >= v) return f * mag;
  return 10 * mag;
}

/* ------------------------------------------------------------------ area chart */

export type AreaPoint = { label: string; value: number; previous?: number };

/**
 * Enquiries over time: a smooth line that draws itself, a soft fill, the previous period as a dashed line, a pointer (or finger)
 * that reads out any day, and a quiet pulse on today. The same data is in a hidden table for a screen reader.
 */
export function AreaChart({ data, unit, reduced, height = 232 }: { data: readonly AreaPoint[]; unit: string; reduced: boolean; height?: number }) {
  const id = useId();
  const box = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(640);
  const [hover, setHover] = useState<number | null>(null);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setWidth(Math.max(240, Math.round(e.contentRect.width))));
    ro.observe(el);
    setWidth(Math.max(240, Math.round(el.getBoundingClientRect().width)));
    return () => ro.disconnect();
  }, []);

  const pad = { l: 30, r: 10, t: 14, b: 24 };
  const iw = width - pad.l - pad.r;
  const ih = height - pad.t - pad.b;
  const max = niceMax(Math.max(1, ...data.map((d) => Math.max(d.value, d.previous ?? 0))));
  const x = (i: number) => pad.l + (data.length <= 1 ? iw / 2 : (i / (data.length - 1)) * iw);
  const y = (v: number) => pad.t + ih - (v / max) * ih;
  const pts = data.map((d, i) => [x(i), y(d.value)] as const);
  const line = monotone(pts);
  const prev = data.every((d) => d.previous === undefined) ? "" : monotone(data.map((d, i) => [x(i), y(d.previous ?? 0)] as const));
  const baseY = pad.t + ih;
  const area = pts.length > 1 ? `${line} L${x(data.length - 1)},${baseY} L${x(0)},${baseY} Z` : "";
  const ticks = [0, max / 2, max];
  const labelIdx = data.length <= 8 ? data.map((_, i) => i) : [0, Math.round((data.length - 1) / 3), Math.round(((data.length - 1) * 2) / 3), data.length - 1];
  const total = useMemo(() => data.reduce((s, d) => s + d.value, 0), [data]);
  const peak = useMemo(() => data.reduce((p, d) => (d.value > p.value ? d : p), data[0] ?? { label: "", value: 0 }), [data]);

  const at = (clientX: number) => {
    const r = box.current?.getBoundingClientRect();
    if (!r || data.length === 0) return;
    const px = clientX - r.left - pad.l;
    setHover(Math.min(data.length - 1, Math.max(0, Math.round((px / iw) * (data.length - 1)))));
  };
  const tip = hover === null ? null : data[hover];
  const tipX = hover === null ? 0 : Math.min(width - 150, Math.max(4, x(hover) - 70));

  return (
    <div ref={box} className="relative w-full select-none" style={{ height }} onPointerLeave={() => setHover(null)}>
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={`${unit} per day. ${fmt(total)} in total; the busiest day was ${peak.label} with ${fmt(peak.value)}.`}
        className="block touch-pan-y"
        onPointerMove={(e) => at(e.clientX)}
        onPointerDown={(e) => at(e.clientX)}
      >
        <defs>
          <linearGradient id={`${id}-fill`} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="var(--color-gold)" stopOpacity="0.3" />
            <stop offset="1" stopColor="var(--color-gold)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={pad.l} x2={width - pad.r} y1={y(t)} y2={y(t)} stroke="var(--color-line)" strokeDasharray={t === 0 ? undefined : "2 5"} />
            <text x={pad.l - 8} y={y(t) + 3.5} textAnchor="end" className="fill-dust font-mono text-[10px]">
              {t % 1 === 0 ? fmt(t) : t.toFixed(1)}
            </text>
          </g>
        ))}
        {labelIdx.map((i) => (
          <text key={i} x={x(i)} y={height - 6} textAnchor={i === 0 ? "start" : i === data.length - 1 ? "end" : "middle"} className="fill-dust font-mono text-[10px]">
            {data[i]?.label}
          </text>
        ))}
        {prev && <motion.path d={prev} fill="none" stroke="var(--color-dust)" strokeOpacity="0.7" strokeWidth="1.2" strokeDasharray="3 4" initial={false} animate={{ d: prev }} transition={{ duration: reduced ? 0 : 0.6, ease: ease.citadel }} />}
        {area && <motion.path d={area} fill={`url(#${id}-fill)`} initial={reduced ? false : { opacity: 0 }} animate={{ opacity: 1, d: area }} transition={{ duration: reduced ? 0 : 0.9, delay: reduced ? 0 : 0.35, ease: ease.citadel }} />}
        <motion.path d={line} fill="none" stroke="var(--color-gold)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" initial={reduced ? false : { pathLength: 0 }} animate={{ pathLength: 1, d: line }} transition={{ pathLength: { duration: reduced ? 0 : 1.3, ease: ease.citadel }, d: { duration: reduced ? 0 : 0.6, ease: ease.citadel } }} />
        {pts.length > 0 && (
          <g>
            {!reduced && (
              <circle cx={pts.at(-1)![0]} cy={pts.at(-1)![1]} r="4" fill="var(--color-gold)" opacity="0.35">
                <animate attributeName="r" values="4;11;4" dur="2.6s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.35;0;0.35" dur="2.6s" repeatCount="indefinite" />
              </circle>
            )}
            <circle cx={pts.at(-1)![0]} cy={pts.at(-1)![1]} r="3.5" fill="var(--color-ember)" stroke="var(--color-gold)" strokeWidth="2" />
          </g>
        )}
        {hover !== null && (
          <g pointerEvents="none">
            <line x1={x(hover)} x2={x(hover)} y1={pad.t} y2={baseY} stroke="var(--color-brass)" strokeOpacity="0.6" />
            <circle cx={x(hover)} cy={y(data[hover].value)} r="4.5" fill="var(--color-gold)" stroke="var(--color-ember)" strokeWidth="2" />
          </g>
        )}
      </svg>
      {tip && hover !== null && (
        <div className="plate pointer-events-none absolute top-1 z-10 w-[9.5rem] px-3 py-2" style={{ left: tipX }}>
          <p className="label text-dust">{tip.label}</p>
          <p className="mt-1 font-mono text-sm text-bone">
            {fmt(tip.value)} <span className="text-xs text-dust">{unit}</span>
          </p>
          {tip.previous !== undefined && <p className="font-mono text-[0.68rem] text-dust">{fmt(tip.previous)} in the period before</p>}
        </div>
      )}
      <table className="sr-only">
        <caption>{unit} per day</caption>
        <tbody>
          {data.map((d) => (
            <tr key={d.label}>
              <th scope="row">{d.label}</th>
              <td>{d.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ------------------------------------------------------------------ bars */

/** Horizontal bars, one row each, growing from the left. */
export function BarList({ rows, reduced, empty = "Nothing yet." }: { rows: readonly { key: string; label: string; count: number; note?: string }[]; reduced: boolean; empty?: string }) {
  const max = Math.max(1, ...rows.map((r) => r.count));
  if (!rows.length || rows.every((r) => r.count === 0)) return <p className="t-ui text-sm text-dust">{empty}</p>;
  return (
    <ul className="flex flex-col gap-3">
      {rows.map((r, i) => (
        <li key={r.key}>
          <div className="flex items-baseline justify-between gap-3">
            <span className="t-ui truncate text-sm text-sand">{r.label}</span>
            <span className="font-mono text-sm text-bone">{fmt(r.count)}{r.note && <span className="ml-2 text-[0.68rem] text-dust">{r.note}</span>}</span>
          </div>
          <div className="mt-1.5 h-1.5 w-full bg-umber" aria-hidden>
            <motion.div
              className="h-full origin-left bg-gold"
              initial={reduced ? false : { scaleX: 0 }}
              animate={{ scaleX: r.count / max }}
              transition={{ duration: reduced ? 0 : 0.9, delay: reduced ? 0 : 0.06 * i, ease: ease.citadel }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

/** Vertical columns with a label under each; the tallest is the one that matters. */
export function Columns({ rows, reduced, unit }: { rows: readonly { key: string; count: number }[]; reduced: boolean; unit: string }) {
  const max = Math.max(1, ...rows.map((r) => r.count));
  const top = rows.reduce((p, r) => (r.count > p.count ? r : p), rows[0] ?? { key: "", count: 0 });
  return (
    <div role="img" aria-label={`${unit} by weekday. The busiest is ${top.key} with ${fmt(top.count)}.`} className="flex h-44 items-end gap-2 sm:gap-3">
      {rows.map((r, i) => {
        const isTop = r.count > 0 && r.key === top.key;
        return (
          <div key={r.key} className="group flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2" title={`${r.key}: ${fmt(r.count)}`}>
            <span className={cn("font-mono text-[0.68rem] transition-opacity", isTop ? "text-gold opacity-100" : "text-dust opacity-0 group-hover:opacity-100")}>{fmt(r.count)}</span>
            <div className="flex w-full flex-1 items-end">
              <motion.div
                className={cn("w-full origin-bottom", isTop ? "bg-gold" : "bg-umber group-hover:bg-brass/50")}
                style={{ height: `${Math.max(3, (r.count / max) * 100)}%` }}
                initial={reduced ? false : { scaleY: 0 }}
                animate={{ scaleY: 1 }}
                transition={{ duration: reduced ? 0 : 0.8, delay: reduced ? 0 : 0.05 * i, ease: ease.citadel }}
              />
            </div>
            <span className={cn("label", isTop ? "text-gold" : "text-dust")}>{r.key}</span>
          </div>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ gauge */

/** Two decimals: cos and sin differ in their last digits between Node and a browser, and a server-rendered figure must match the client's. */
const px = (v: number) => Math.round(v * 100) / 100;

/** A half-circle of ticks that light up one after another to the value. */
export function TickGauge({ percent, reduced, label }: { percent: number | null; reduced: boolean; label: string }) {
  const N = 41;
  const cx = 110;
  const cy = 104;
  const lit = percent === null ? 0 : Math.round((percent / 100) * N);
  return (
    <div className="mx-auto w-full max-w-[15rem]">
      <svg viewBox="0 0 220 112" role="img" aria-label={percent === null ? `${label}: not known yet` : `${label}: ${percent} percent`} className="w-full">
        {Array.from({ length: N }, (_, i) => {
          const a = Math.PI + (i / (N - 1)) * Math.PI;
          const r1 = i % 5 === 0 ? 74 : 79;
          const r2 = 94;
          const on = i < lit;
          return (
            <motion.line
              key={i}
              x1={px(cx + Math.cos(a) * r1)}
              y1={px(cy + Math.sin(a) * r1)}
              x2={px(cx + Math.cos(a) * r2)}
              y2={px(cy + Math.sin(a) * r2)}
              stroke={on ? "var(--color-gold)" : "var(--color-line)"}
              strokeWidth={i % 5 === 0 ? 2.6 : 1.8}
              strokeLinecap="round"
              initial={reduced ? false : { opacity: 0.15 }}
              animate={{ opacity: on ? 1 : 0.55 }}
              transition={{ duration: reduced ? 0 : 0.35, delay: reduced ? 0 : i * 0.022 }}
            />
          );
        })}
        <text x={cx} y={cy - 8} textAnchor="middle" className="fill-bone font-mono text-[30px]">
          {percent === null ? "—" : `${percent}%`}
        </text>
      </svg>
      <p className="label mt-2 text-center text-dust">{label}</p>
    </div>
  );
}

/* ------------------------------------------------------------------ split bar */

export function SplitBar({ parts, reduced }: { parts: readonly { key: string; label: string; count: number; tone: string }[]; reduced: boolean }) {
  const total = parts.reduce((s, p) => s + p.count, 0);
  if (total === 0) return <p className="t-ui text-sm text-dust">Nothing in this period yet.</p>;
  return (
    <div>
      <div className="flex h-3 w-full gap-px overflow-hidden bg-line/40" role="img" aria-label={parts.map((p) => `${p.label} ${fmt(p.count)}`).join(", ")}>
        {parts.map((p, i) =>
          p.count === 0 ? null : (
            <motion.div
              key={p.key}
              className="h-full origin-left"
              style={{ width: `${(p.count / total) * 100}%`, background: p.tone }}
              initial={reduced ? false : { scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: reduced ? 0 : 0.8, delay: reduced ? 0 : 0.08 * i, ease: ease.citadel }}
            />
          ),
        )}
      </div>
      <ul className="mt-4 grid gap-2">
        {parts.map((p) => (
          <li key={p.key} className="flex items-center justify-between gap-3">
            <span className="t-ui flex min-w-0 items-center gap-2 text-sm text-sand">
              <span aria-hidden className="h-2.5 w-2.5 shrink-0" style={{ background: p.tone }} />
              <span className="truncate">{p.label}</span>
            </span>
            <span className="font-mono text-sm text-bone">
              {fmt(p.count)} <span className="text-[0.68rem] text-dust">{Math.round((p.count / total) * 100)}%</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
