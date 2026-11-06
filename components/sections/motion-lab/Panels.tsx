"use client";

import { useEffect, useRef } from "react";
import { drawChart, readPalette, type Series } from "@/lib/motion-lab/draw";
import { ANGLES, KEYPOINTS, KP_COUNT, VISIBLE_SCORE } from "@/lib/motion-lab/skeleton";
import { GAIT_LABEL } from "@/lib/motion-lab/analysis";
import type { GaitEstimate, SessionMeta } from "@/lib/motion-lab/types";

export const fmt = (v: number | null | undefined, d = 0, unit = "") => (v === null || v === undefined || !Number.isFinite(v) ? "–" : `${v.toFixed(d)}${unit}`);
export const clock = (ms: number) => { const s = Math.max(0, Math.floor(ms / 1000)); return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`; };

/** One measurement with a label. `live` marks values that change with the animal, for assistive tech to leave alone. */
export function Stat({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone?: "good" | "warn" | "off" }) {
  return (
    <div className="plate flex flex-col gap-1 p-4">
      <p className="label text-dust">{label}</p>
      <p className={`font-mono text-[clamp(1.4rem,2.2vw,1.9rem)] leading-none tabular-nums ${tone === "off" ? "text-dust" : tone === "warn" ? "text-blood" : "text-bone"}`}>{value}</p>
      {sub && <p className="t-ui text-xs text-dust">{sub}</p>}
    </div>
  );
}

export function Meter({ value, label }: { value: number; label: string }) {
  const pct = Math.round(Math.max(0, Math.min(1, value)) * 100);
  return (
    <div role="meter" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} className="h-1.5 w-full bg-line">
      <div className="h-full bg-gold transition-[width] duration-200" style={{ width: `${pct}%` }} />
    </div>
  );
}

export function GaitCard({ est, live }: { est: GaitEstimate | null; live: boolean }) {
  const label = est ? GAIT_LABEL[est.gait] : "–";
  return (
    <div className="plate flex flex-col gap-2 p-4">
      <p className="label text-dust">Gait estimate{live ? "" : " at cursor"}</p>
      <p className="t-voice text-[clamp(1.8rem,3vw,2.6rem)] leading-none text-gold">{label}</p>
      <Meter value={est?.confidence ?? 0} label="Gait confidence" />
      <p className="t-ui text-xs text-dust">
        {est ? `Confidence ${Math.round(est.confidence * 100)}%${est.strideHz ? ` · ${fmt(est.strideHz, 2)} strides/s (${fmt(est.strideHz * 60, 0)}/min)` : ""}` : "Needs about two seconds of the horse in view."}
      </p>
      {est && <p className="t-ui text-xs text-sand">{est.note}</p>}
      <p className="t-ui text-[0.7rem] text-dust">Experimental estimate, not a diagnosis.</p>
    </div>
  );
}

/** Canvas time-series chart with an accessible text summary. */
export function TimeChart({ title, series, t0, t1, y0, y1, cursor, unit, height = 150 }: { title: string; series: Series[]; t0: number; t1: number; y0: number; y1: number; cursor?: number | null; unit?: string; height?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = c.clientWidth, h = c.clientHeight;
    if (c.width !== Math.round(w * dpr) || c.height !== Math.round(h * dpr)) { c.width = Math.round(w * dpr); c.height = Math.round(h * dpr); }
    const ctx = c.getContext("2d");
    if (ctx) drawChart(ctx, series, { t0, t1, y0, y1, cursor, pal: readPalette(), unit, dpr });
  });
  const last = series.map((s) => { const p = [...s.pts].reverse().find((q) => Number.isFinite(q[1])); return p ? `${s.label} ${p[1].toFixed(2)}` : `${s.label} no data`; }).join(", ");
  return (
    <figure className="plate p-4">
      <figcaption className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <span className="label text-bone">{title}</span>
        <span className="flex flex-wrap gap-x-4 gap-y-1">
          {series.map((s) => (<span key={s.id} className="t-ui flex items-center gap-1.5 text-xs text-sand"><span aria-hidden className="inline-block w-4 border-t-2" style={{ borderColor: s.color, borderTopStyle: s.dash ? "dashed" : "solid" }} />{s.label}</span>))}
        </span>
      </figcaption>
      <canvas ref={ref} role="img" aria-label={`${title}: latest values ${last}`} className="mt-3 w-full" style={{ height }} />
    </figure>
  );
}

/** Live coordinates and angles of every joint, updating with the animal. Nothing here is rounded away to look steadier than it is. */
export function JointTable({ kp, angles }: { kp: number[] | null; angles: Partial<Record<string, number>> }) {
  return (
    <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
      <div className="plate min-w-0 overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <caption className="label border-b border-line p-4 text-left text-bone">Joint coordinates (pixels of the video)</caption>
          <thead><tr className="label text-dust"><th scope="col" className="px-4 py-2 font-normal">Joint</th><th scope="col" className="px-2 py-2 text-right font-normal">x</th><th scope="col" className="px-2 py-2 text-right font-normal">y</th><th scope="col" className="px-4 py-2 text-right font-normal">score</th></tr></thead>
          <tbody>
            {KEYPOINTS.map((n, i) => {
              const have = !!kp && kp.length >= KP_COUNT * 3;
              const s = have ? (kp as number[])[i * 3 + 2] : 0;
              const vis = have && s >= VISIBLE_SCORE;
              return (
                <tr key={n} className={`border-t border-line font-mono text-xs tabular-nums ${vis ? "text-bone" : "text-dust"}`}>
                  <th scope="row" className="t-ui px-4 py-1.5 text-left text-xs font-normal capitalize">{n.replace(/_/g, " ")}</th>
                  <td className="px-2 py-1.5 text-right">{vis ? (kp as number[])[i * 3].toFixed(1) : "–"}</td>
                  <td className="px-2 py-1.5 text-right">{vis ? (kp as number[])[i * 3 + 1].toFixed(1) : "–"}</td>
                  <td className="px-4 py-1.5 text-right">{have ? s.toFixed(2) : "–"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="plate self-start p-4">
        <p className="label text-bone">Joint angles</p>
        <dl className="mt-3 grid gap-2">
          {ANGLES.map((a) => (
            <div key={a.id} className="flex items-baseline justify-between border-t border-line pt-2">
              <dt className="t-ui text-xs text-sand">{a.label}</dt>
              <dd className="font-mono text-sm tabular-nums text-bone">{fmt(angles[a.id], 0, "°")}</dd>
            </div>
          ))}
        </dl>
        <p className="t-ui mt-3 text-[0.7rem] leading-snug text-dust">Angles are taken between generic AP-10K points (shoulder, elbow, paw; hip, knee, paw), not anatomical hoof, fetlock or hock markers.</p>
      </div>
    </div>
  );
}

export function SessionCard({ meta, active, onReplay, onCsv, onJson, onReport, onDelete, onCloud, cloudState, busy }: {
  meta: SessionMeta; active: boolean; busy: boolean; cloudState: "none" | "saved" | "saving" | "signin";
  onReplay: () => void; onCsv: () => void; onJson: () => void; onReport: () => void; onDelete: () => void; onCloud: () => void;
}) {
  const s = meta.summary;
  const btn = "label border-b border-line pb-0.5 text-sand transition-colors hover:border-gold hover:text-gold disabled:opacity-50";
  return (
    <li className={`plate flex min-w-0 flex-col gap-3 p-4 ${active ? "outline outline-2 -outline-offset-2 outline-gold" : ""}`}>
      <div className="flex gap-4">
        <div className="relative aspect-video w-32 shrink-0 overflow-hidden bg-charcoal">
          {/* eslint-disable-next-line @next/next/no-img-element -- a small data URL made in this browser */}
          {meta.thumbnail ? <img src={meta.thumbnail} alt="Clearest frame of this session with the skeleton drawn" className="h-full w-full object-cover" /> : <span className="t-ui absolute inset-0 grid place-items-center text-xs text-dust">no frame</span>}
        </div>
        <div className="min-w-0">
          <p className="t-voice truncate text-lg text-bone">{meta.name}</p>
          <p className="t-ui text-xs text-dust">{new Date(meta.createdAt).toLocaleString("en-GB", { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short" })} · {meta.source === "camera" ? "camera" : "upload"}</p>
          <p className="font-mono mt-1 break-words text-xs tabular-nums text-sand">{clock(s.durationMs)} · {s.frames} frames · {s.coveragePct.toFixed(0)}% tracked</p>
          <p className="t-ui mt-1 text-xs text-sand">Mostly <span className="text-gold">{GAIT_LABEL[s.dominantGait].toLowerCase()}</span>{s.strideHzMedian ? `, ~${s.strideHzMedian.toFixed(2)} strides/s` : ""}</p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
        <button type="button" onClick={onReplay} disabled={busy} className={btn}>{active ? "Replaying" : "Replay"}</button>
        <button type="button" onClick={onCsv} className={btn}>CSV</button>
        <button type="button" onClick={onJson} className={btn}>JSON</button>
        <button type="button" onClick={onReport} disabled={busy} className={btn}>PDF report</button>
        <button type="button" onClick={onCloud} disabled={busy || cloudState === "saving" || cloudState === "saved"} className={btn}>
          {cloudState === "saved" ? "Saved to account" : cloudState === "saving" ? "Saving…" : cloudState === "signin" ? "Sign in to save" : "Save to account"}
        </button>
        <button type="button" onClick={onDelete} disabled={busy} className="label ml-auto text-dust hover:text-blood disabled:opacity-50">Delete</button>
      </div>
    </li>
  );
}
