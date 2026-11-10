"use client";

import { motion } from "motion/react";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import styles from "./LiveDashboard.module.css";

/**
 * The dashboard's charts, drawn with plain SVG and CSS: adopted from the Finance Bento aesthetic.
 * Rich gradients, glowing rims, luminous lines, electric lime accents, and smooth cubic-bezier motion.
 */

const fmt = (n: number) => n.toLocaleString("en-IN");

/* ------------------------------------------------------------------ numbers */

/** A figure that counts up to its value on arrival and eases to each new value after that. */
export function CountUp({ value, reduced, className }: { value: number | null; reduced: boolean; className?: string }) {
  const [shown, setShown] = useState(value ?? 0);
  const from = useRef(0);
  useEffect(() => {
    if (value === null || reduced) {
      from.current = value ?? 0;
      setShown(value ?? 0);
      return;
    }
    const start = from.current;
    const t0 = performance.now();
    const duration = start === 0 ? 1000 : 600;
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

  const n = reduced ? value : shown;
  return <span className={className}>{n === null ? "—" : fmt(n)}</span>;
}

/* ------------------------------------------------------------------ sparkline */

export function Sparkline({
  data,
  reduced,
  className,
  color = "var(--acc)",
}: {
  data: readonly number[];
  reduced: boolean;
  className?: string;
  color?: string;
}) {
  const id = useId();
  const max = Math.max(1, ...data);
  const min = Math.min(0, ...data);
  const range = max - min || 1;
  const w = 120;
  const h = 34;
  const pts = data.map((v, i) => [(i / Math.max(1, data.length - 1)) * w, h - 4 - ((v - min) / range) * (h - 10)] as const);
  const d = monotone(pts);
  const endPt = pts.at(-1);

  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" aria-hidden className={cn("h-8 w-full overflow-visible", className)}>
      <defs>
        <linearGradient id={`${id}-f`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor={color} stopOpacity="0.25" />
          <stop offset="1" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {pts.length > 1 && <path d={`${d} L${w},${h} L0,${h} Z`} fill={`url(#${id}-f)`} />}
      <motion.path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth="1.8"
        vectorEffect="non-scaling-stroke"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={reduced ? false : { pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.1, ease: [0.32, 0.72, 0, 1] }}
      />
      {endPt && (
        <circle cx={endPt[0]} cy={endPt[1]} r="2.5" fill={color} stroke="rgba(0,0,0,0.3)" strokeWidth="1" />
      )}
    </svg>
  );
}

/** A smooth curve through the points that never overshoots them (monotone cubic). */
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
 * Enquiries over time: smooth curve line, luminous white/accent, subtle fill wash,
 * previous period as dashed guide, pulse ring on today, and floating dark glass tooltip.
 */
export function AreaChart({
  data,
  unit,
  reduced,
  height = 236,
  color = "#ffffff",
  previousColor = "rgba(255, 255, 255, 0.45)",
}: {
  data: readonly AreaPoint[];
  unit: string;
  reduced: boolean;
  height?: number;
  color?: string;
  previousColor?: string;
}) {
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

  const pad = { l: 32, r: 16, t: 16, b: 26 };
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
  const tipX = hover === null ? 0 : Math.min(width - 165, Math.max(10, x(hover) - 80));

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
            <stop offset="0" stopColor={color} stopOpacity="0.22" />
            <stop offset="1" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Ticks and grid lines */}
        {ticks.map((t) => (
          <g key={t}>
            <line x1={pad.l} x2={width - pad.r} y1={y(t)} y2={y(t)} stroke="rgba(255, 255, 255, 0.14)" strokeDasharray={t === 0 ? undefined : "2 5"} />
            <text x={pad.l - 8} y={y(t) + 3.5} textAnchor="end" className="fill-white/45 font-mono text-[10px]">
              {t % 1 === 0 ? fmt(t) : t.toFixed(1)}
            </text>
          </g>
        ))}

        {/* Date labels */}
        {labelIdx.map((i) => (
          <text key={i} x={x(i)} y={height - 6} textAnchor={i === 0 ? "start" : i === data.length - 1 ? "end" : "middle"} className="fill-white/50 font-mono text-[10px]">
            {data[i]?.label}
          </text>
        ))}

        {/* Previous period line */}
        {prev && (
          <motion.path
            d={prev}
            fill="none"
            stroke={previousColor}
            strokeWidth="1.4"
            strokeDasharray="3 4"
            initial={false}
            animate={{ d: prev }}
            transition={{ duration: reduced ? 0 : 0.6, ease: [0.32, 0.72, 0, 1] }}
          />
        )}

        {/* Soft wash area */}
        {area && (
          <motion.path
            d={area}
            fill={`url(#${id}-fill)`}
            initial={reduced ? false : { opacity: 0 }}
            animate={{ opacity: 1, d: area }}
            transition={{ duration: reduced ? 0 : 0.9, delay: reduced ? 0 : 0.2, ease: [0.32, 0.72, 0, 1] }}
          />
        )}

        {/* Main curve */}
        <motion.path
          d={line}
          fill="none"
          stroke={color}
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={reduced ? false : { pathLength: 0 }}
          animate={{ pathLength: 1, d: line }}
          transition={{
            pathLength: { duration: reduced ? 0 : 1.2, ease: [0.32, 0.72, 0, 1] },
            d: { duration: reduced ? 0 : 0.6, ease: [0.32, 0.72, 0, 1] },
          }}
        />

        {/* Active end point with pulsating concentric rings in electric lime */}
        {pts.length > 0 && (
          <g>
            {!reduced && (
              <circle cx={pts.at(-1)![0]} cy={pts.at(-1)![1]} r="4" fill="#E8FF1F" opacity="0.4">
                <animate attributeName="r" values="4;12;4" dur="2.4s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.45;0;0.45" dur="2.4s" repeatCount="indefinite" />
              </circle>
            )}
            <circle cx={pts.at(-1)![0]} cy={pts.at(-1)![1]} r="3.5" fill="#0b0b0c" stroke="#E8FF1F" strokeWidth="2" />
          </g>
        )}

        {/* Hover hairline & indicator */}
        {hover !== null && (
          <g pointerEvents="none">
            <line x1={x(hover)} x2={x(hover)} y1={pad.t} y2={baseY} stroke="rgba(255, 255, 255, 0.5)" strokeWidth="1" />
            <circle cx={x(hover)} cy={y(data[hover].value)} r="4.5" fill="#E8FF1F" stroke="#0b0b0c" strokeWidth="2" />
          </g>
        )}
      </svg>

      {/* Floating Dark Glass Tooltip */}
      {tip && hover !== null && (
        <div
          className={cn(styles.tip, styles.on, "pointer-events-none absolute z-20 min-w-[155px]")}
          style={{ left: tipX, top: 2 }}
        >
          <div className={styles.t}>{tip.label}</div>
          <div className={styles.r}>
            <span>
              <i style={{ background: color }} />
              {unit}
            </span>
            <b className="text-white">{fmt(tip.value)}</b>
          </div>
          {tip.previous !== undefined && (
            <div className={styles.r}>
              <span className="text-white/40">Earlier</span>
              <b className="text-white/60">{fmt(tip.previous)}</b>
            </div>
          )}
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
  if (!rows.length || rows.every((r) => r.count === 0)) return <p className="text-sm text-white/50">{empty}</p>;
  return (
    <ul className="flex flex-col gap-3.5">
      {rows.map((r, i) => (
        <li key={r.key}>
          <div className="flex items-baseline justify-between gap-3">
            <span className="truncate text-sm font-medium text-white/90">{r.label}</span>
            <span className="font-mono text-sm font-semibold text-white">
              {fmt(r.count)}
              {r.note && <span className="ml-2 text-[0.68rem] text-white/45">{r.note}</span>}
            </span>
          </div>
          <div className="mt-1.5 h-2 w-full rounded-full bg-black/35 overflow-hidden" aria-hidden>
            <motion.div
              className={cn("h-full origin-left rounded-full", i === 0 ? "bg-[#E8FF1F]" : "bg-white")}
              initial={reduced ? false : { scaleX: 0 }}
              animate={{ scaleX: r.count / max }}
              transition={{ duration: reduced ? 0 : 0.9, delay: reduced ? 0 : 0.06 * i, ease: [0.32, 0.72, 0, 1] }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

/* ------------------------------------------------------------------ columns */

/** Vertical capsule columns with rounded caps per weekday (like #stocks in Finance Bento). */
export function Columns({ rows, reduced, unit }: { rows: readonly { key: string; count: number }[]; reduced: boolean; unit: string }) {
  const max = Math.max(1, ...rows.map((r) => r.count));
  const top = rows.reduce((p, r) => (r.count > p.count ? r : p), rows[0] ?? { key: "", count: 0 });
  const [hover, setHover] = useState<number | null>(null);

  return (
    <div
      role="img"
      aria-label={`${unit} by weekday. The busiest is ${top.key} with ${fmt(top.count)}.`}
      className="relative flex h-44 items-end gap-2 sm:gap-3 select-none"
      onPointerLeave={() => setHover(null)}
    >
      {rows.map((r, i) => {
        const isTop = r.count > 0 && r.key === top.key;
        return (
          <div
            key={r.key}
            className="group flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2 cursor-pointer"
            onPointerEnter={() => setHover(i)}
          >
            <span
              className={cn(
                "font-mono text-[0.7rem] font-semibold transition-opacity duration-200",
                isTop ? "text-[#E8FF1F] opacity-100" : "text-white/40 opacity-0 group-hover:opacity-100"
              )}
            >
              {fmt(r.count)}
            </span>
            <div className="relative flex w-full flex-1 items-end">
              {/* Dark capsule track */}
              <div className="absolute inset-x-0 bottom-0 top-0 rounded-full bg-black/28" />
              {/* Animated capsule fill */}
              <motion.div
                className={cn("relative w-full rounded-full origin-bottom shadow-sm", isTop ? "bg-[#E8FF1F] shadow-[#E8FF1F]/30" : "bg-white group-hover:bg-[#E8FF1F]/80")}
                style={{ height: `${Math.max(6, (r.count / max) * 100)}%` }}
                initial={reduced ? false : { scaleY: 0 }}
                animate={{ scaleY: 1 }}
                transition={{ duration: reduced ? 0 : 0.8, delay: reduced ? 0 : 0.05 * i, ease: [0.32, 0.72, 0, 1] }}
              />
            </div>
            <span className={cn("font-mono text-[10.5px] uppercase font-semibold", isTop ? "text-white font-bold" : "text-white/50")}>
              {r.key}
            </span>
          </div>
        );
      })}

      {/* Floating Tooltip */}
      {hover !== null && (
        <div className={cn(styles.tip, styles.on, "absolute bottom-14 left-1/2 -translate-x-1/2 pointer-events-none z-20")}>
          <div className={styles.t}>{rows[hover].key} · {unit}</div>
          <div className={styles.r}>
            <span><i style={{ background: rows[hover].key === top.key ? "#E8FF1F" : "#ffffff" }} />Count</span>
            <b className="text-white">{fmt(rows[hover].count)}</b>
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ gauge */

const px = (v: number) => Math.round(v * 100) / 100;

/** Half-circle radial gauge of tick marks (adopted from Finance Bento's #alloc). */
export function TickGauge({ percent, reduced, label }: { percent: number | null; reduced: boolean; label: string }) {
  const N = 45;
  const cx = 110;
  const cy = 104;
  const lit = percent === null ? 0 : Math.round((percent / 100) * N);

  return (
    <div className="mx-auto w-full max-w-[16rem]">
      <svg viewBox="0 0 220 120" role="img" aria-label={percent === null ? `${label}: not known yet` : `${label}: ${percent} percent`} className="w-full">
        {Array.from({ length: N }, (_, i) => {
          const a = Math.PI + (i / (N - 1)) * Math.PI;
          const r1 = i % 5 === 0 ? 76 : 82;
          const r2 = 98;
          const on = i < lit;
          return (
            <motion.line
              key={i}
              x1={px(cx + Math.cos(a) * r1)}
              y1={px(cy + Math.sin(a) * r1)}
              x2={px(cx + Math.cos(a) * r2)}
              y2={px(cy + Math.sin(a) * r2)}
              stroke={on ? "var(--acc, #E8FF1F)" : "rgba(255, 255, 255, 0.22)"}
              strokeWidth={i % 5 === 0 ? 3.2 : 2.2}
              strokeLinecap="round"
              initial={reduced ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: reduced ? 0 : 0.35, delay: reduced ? 0 : i * 0.018 }}
            />
          );
        })}
        <text x={cx} y={cy - 6} textAnchor="middle" className="fill-white font-mono text-[44px] font-extralight tracking-tight">
          {percent === null ? "—" : percent}
          <tspan fontSize="16" dy="-18" className="fill-white/60 font-normal">%</tspan>
        </text>
        <text x={cx} y={cy + 12} textAnchor="middle" className="fill-white/45 text-[11px] font-medium tracking-wide uppercase">
          {label}
        </text>
      </svg>
    </div>
  );
}

/* ------------------------------------------------------------------ split bar */

export function SplitBar({ parts, reduced }: { parts: readonly { key: string; label: string; count: number; tone: string }[]; reduced: boolean }) {
  const total = parts.reduce((s, p) => s + p.count, 0);
  if (total === 0) return <p className="text-sm text-white/50">Nothing in this period yet.</p>;
  return (
    <div>
      {/* Segmented capsule track */}
      <div className="flex h-2.5 w-full gap-0.5 overflow-hidden rounded-full bg-white/10" role="img" aria-label={parts.map((p) => `${p.label} ${fmt(p.count)}`).join(", ")}>
        {parts.map((p, i) =>
          p.count === 0 ? null : (
            <motion.div
              key={p.key}
              className="h-full origin-left first:rounded-l-full last:rounded-r-full"
              style={{ width: `${(p.count / total) * 100}%`, background: p.tone }}
              initial={reduced ? false : { scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: reduced ? 0 : 0.8, delay: reduced ? 0 : 0.08 * i, ease: [0.32, 0.72, 0, 1] }}
            />
          ),
        )}
      </div>

      {/* Legend list */}
      <ul className="mt-4 grid gap-2.5">
        {parts.map((p) => (
          <li key={p.key} className="flex items-center justify-between gap-3">
            <span className="flex min-w-0 items-center gap-2.5 text-sm text-white/80">
              <span aria-hidden className="h-2 w-2 shrink-0 rounded-full" style={{ background: p.tone }} />
              <span className="truncate">{p.label}</span>
            </span>
            <span className="font-mono text-sm text-white">
              {fmt(p.count)} <span className="text-[0.68rem] text-white/45">{Math.round((p.count / total) * 100)}%</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
