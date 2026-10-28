"use client";

import { motion } from "motion/react";
import { useId } from "react";
import { bottom, left, top, type Bay, type CampusModule, type CampusTier } from "@/lib/content/campus";
import { useReducedMotion } from "@/lib/motion/reduced";
import { cn } from "@/lib/utils";

const ink = "var(--color-brass)";
const gold = "var(--color-gold)";
const LABEL = { fontFamily: "var(--font-sans)", fontWeight: 600, textTransform: "uppercase" } as const;
const faint = "color-mix(in srgb, var(--color-brass) 14%, transparent)";

type Props = {
  tier: CampusTier;
  selectedId: string | null;
  hoveredId: string | null;
  onSelect: (id: string) => void;
  onHover: (id: string | null) => void;
  /** Draw each building's name on the plan (the larger, stand-alone version). */
  labels?: boolean;
  className?: string;
};

/** Where a name sits: inside the arena; above a stable block that fronts south; otherwise below, unless that is off the plot. */
function labelY(m: CampusModule, siteD: number) {
  if (m.kind === "arena") return m.rect.z + 7.4;
  const below = bottom(m.rect) + 4.6;
  if ((m.kind === "stable-block" && m.facing === "s") || below > siteD / 2 - 0.5) return top(m.rect) - 1.8;
  return below;
}

/** Stalls, grooming bay and feed bay of a block, drawn as bays along its long side. */
function Bays({ m, uid }: { m: CampusModule; uid: string }) {
  const bays: Bay[] = m.bays ?? [];
  const along = m.facing === "n" || m.facing === "s";
  const n = bays.length;
  const { x, z, w, d } = m.rect;
  return (
    <g aria-hidden>
      {bays.map((kind, i) => {
        // Bays run from the end nearest the left (or top) edge.
        const t0 = i / n;
        const bx = along ? left(m.rect) + w * t0 : x - w / 2;
        const bz = along ? z - d / 2 : top(m.rect) + d * t0;
        const bw = along ? w / n : w;
        const bd = along ? d : d / n;
        const stall = kind === "stall";
        return (
          <rect
            key={i}
            x={bx}
            y={bz}
            width={bw}
            height={bd}
            fill={kind === "feed" ? "color-mix(in srgb, var(--color-brass) 30%, transparent)" : kind === "grooming" ? `url(#${uid}-hatch)` : "transparent"}
            stroke={ink}
            strokeWidth={stall ? 0.18 : 0.22}
            opacity={stall ? 0.85 : 1}
          />
        );
      })}
    </g>
  );
}

function ModuleShape({ m, selected, hovered, uid }: { m: CampusModule; selected: boolean; hovered: boolean; uid: string }) {
  const r = m.rect;
  const active = selected || hovered;
  const wash = selected ? "color-mix(in srgb, var(--color-gold) 26%, transparent)" : hovered ? "color-mix(in srgb, var(--color-gold) 16%, transparent)" : "transparent";
  if (m.kind === "arena" && m.arena) {
    const a = m.arena;
    return (
      <g aria-hidden>
        <rect x={r.x - r.w / 2} y={r.z - r.d / 2} width={r.w} height={r.d} fill={wash} />
        <rect x={r.x - a.w / 2} y={r.z - a.d / 2} width={a.w} height={a.d} fill={`url(#${uid}-sand)`} stroke={active ? gold : ink} strokeWidth={0.5} />
        {a.roof === "canopy" && <rect x={r.x - a.w / 2 - 1.4} y={r.z - a.d / 2 - 1.8} width={a.w + 2.8} height={a.d + 3.6} fill="none" stroke={ink} strokeWidth={0.2} strokeDasharray="1.2 1" />}
        {a.roof === "colonnade" &&
          [-1, 1].map((s) => (
            <line key={s} x1={r.x - a.w / 2} x2={r.x + a.w / 2} y1={r.z + s * (a.d / 2 + 1.8)} y2={r.z + s * (a.d / 2 + 1.8)} stroke={ink} strokeWidth={0.7} strokeDasharray="0.5 2.5" strokeLinecap="round" />
          ))}
        <line x1={r.x - a.w / 2 + 3} x2={r.x + a.w / 2 - 3} y1={r.z} y2={r.z} stroke={ink} strokeWidth={0.14} strokeDasharray="0.6 2" opacity={0.7} />
        {a.floodlights &&
          [-a.w * 0.34, a.w * 0.24].flatMap((dx) => [-1, 1].map((s) => <circle key={`${dx}${s}`} cx={r.x + dx} cy={r.z + s * (a.d / 2 + 1.5)} r={0.6} fill={ink} />))}
        {a.gates.map((g, i) => {
          const alongX = g.side === "n" || g.side === "s";
          const edge = g.side === "n" ? r.z - a.d / 2 - 0.1 : g.side === "s" ? r.z + a.d / 2 + 0.1 : g.side === "e" ? r.x + a.w / 2 + 0.1 : r.x - a.w / 2 - 0.1;
          const c = (alongX ? r.x : r.z) + g.at;
          return <line key={i} x1={alongX ? c - g.width / 2 : edge} x2={alongX ? c + g.width / 2 : edge} y1={alongX ? edge : c - g.width / 2} y2={alongX ? edge : c + g.width / 2} stroke="var(--color-night)" strokeWidth={0.9} />;
        })}
      </g>
    );
  }
  return (
    <g aria-hidden>
      <rect x={left(r)} y={top(r)} width={r.w} height={r.d} fill={wash} stroke={m.kind === "stable-block" ? "none" : active ? gold : ink} strokeWidth={0.4} />
      {m.kind === "stable-block" ? <Bays m={m} uid={uid} /> : <rect x={left(r) + 0.5} y={top(r) + 0.5} width={r.w - 1} height={r.d - 1} fill={`url(#${uid}-hatch)`} opacity={0.7} />}
      {m.kind === "stable-block" && <rect x={left(r)} y={top(r)} width={r.w} height={r.d} fill="none" stroke={active ? gold : ink} strokeWidth={0.45} />}
    </g>
  );
}

/**
 * The 2D site plan, drawn from the same campus data as the 3D model, north at the top. Every building is a button: choosing
 * one focuses it in 3D, and what is chosen or hovered in 3D lights up here.
 */
export function SitePlan2D({ tier, selectedId, hoveredId, onSelect, onHover, labels = false, className }: Props) {
  const uid = useId().replace(/:/g, "");
  const reduced = useReducedMotion();
  const { w, d } = tier.site;
  const pad = 5;
  const vb = { x: -w / 2 - pad, y: -d / 2 - pad - 2, w: w + pad * 2, h: d + pad * 2 + 11 };
  const e = tier.entrance;
  const scaleLen = tier.id === "standard" ? 10 : 20;
  return (
    <svg viewBox={`${vb.x} ${vb.y} ${vb.w} ${vb.h}`} className={cn("block h-auto w-full", className)} role="group" aria-label={`${tier.layoutTitle}, site plan, north at the top`}>
      <defs>
        <pattern id={`${uid}-grid`} width="10" height="10" patternUnits="userSpaceOnUse">
          <path d="M10 0H0V10" fill="none" stroke={faint} strokeWidth="0.1" />
        </pattern>
        <pattern id={`${uid}-sand`} width="1.6" height="1.6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="1.6" stroke="color-mix(in srgb, var(--color-brass) 26%, transparent)" strokeWidth="0.14" />
        </pattern>
        <pattern id={`${uid}-hatch`} width="1.2" height="1.2" patternUnits="userSpaceOnUse" patternTransform="rotate(-45)">
          <line x1="0" y1="0" x2="0" y2="1.2" stroke="color-mix(in srgb, var(--color-brass) 32%, transparent)" strokeWidth="0.12" />
        </pattern>
      </defs>
      <rect x={vb.x} y={vb.y} width={vb.w} height={vb.h} fill={`url(#${uid}-grid)`} />
      <motion.g key={tier.id} initial={reduced ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}>
        <rect x={-w / 2} y={-d / 2} width={w} height={d} fill="color-mix(in srgb, var(--color-night) 70%, transparent)" stroke={ink} strokeWidth={0.3} strokeDasharray="1.6 1.2" />
        {tier.paths.map((p, i) => (
          <rect key={i} x={left(p)} y={top(p)} width={p.w} height={p.d} fill="color-mix(in srgb, var(--color-brass) 9%, transparent)" />
        ))}
        {tier.modules.map((m) => {
          const selected = selectedId === m.id;
          const hovered = hoveredId === m.id;
          const act = () => onSelect(m.id);
          return (
            <g
              key={m.id}
              role="button"
              tabIndex={0}
              aria-label={`${m.key}. ${m.name}`}
              aria-pressed={selected}
              className="cursor-pointer outline-none [&:focus-visible_.focus-ring]:opacity-100"
              onClick={act}
              onKeyDown={(ev) => {
                if (ev.key === "Enter" || ev.key === " ") {
                  ev.preventDefault();
                  act();
                }
              }}
              onPointerEnter={() => onHover(m.id)}
              onPointerLeave={() => onHover(null)}
              onFocus={() => onHover(m.id)}
              onBlur={() => onHover(null)}
            >
              <rect className="focus-ring" x={left(m.rect) - 1.2} y={top(m.rect) - 1.2} width={m.rect.w + 2.4} height={m.rect.d + 2.4} fill="none" stroke={gold} strokeWidth={0.5} opacity={0} />
              <rect x={left(m.rect) - 0.6} y={top(m.rect) - 0.6} width={m.rect.w + 1.2} height={m.rect.d + 1.2} fill="transparent" />
              <ModuleShape m={m} selected={selected} hovered={hovered} uid={uid} />
              <circle cx={m.rect.x} cy={m.kind === "arena" ? m.rect.z : m.rect.z} r={2.6} fill={selected ? gold : "var(--color-ember)"} stroke={selected || hovered ? gold : ink} strokeWidth={0.35} />
              <text x={m.rect.x} y={m.rect.z} dy="0.9" textAnchor="middle" className="font-mono" fontSize="2.6" fill={selected ? "var(--color-ember)" : "var(--color-bone)"}>
                {m.key}
              </text>
              {labels && (
                <text x={m.rect.x} y={labelY(m, d)} textAnchor="middle" style={LABEL} fontSize="2.2" letterSpacing="0.3" fill={selected ? gold : "var(--color-dust)"}>
                  {m.short}
                </text>
              )}
            </g>
          );
        })}
        {/* Main entrance */}
        <g aria-hidden>
          <line x1={e.x - e.width / 2} x2={e.x + e.width / 2} y1={e.z} y2={e.z} stroke="var(--color-night)" strokeWidth={1.2} />
          <path d={`M${e.x - 1.6} ${e.z + 3.6} L${e.x} ${e.z + 1.2} L${e.x + 1.6} ${e.z + 3.6}`} fill="none" stroke={gold} strokeWidth={0.4} />
          <text x={e.x} y={e.z + 6.4} textAnchor="middle" style={LABEL} fontSize="2.1" letterSpacing="0.35" fill="var(--color-dust)">
            ENTRANCE
          </text>
        </g>
        <text x={w / 2} y={d / 2 + 11} textAnchor="end" className="font-mono" fontSize="2.2" fill="var(--color-dust)">
          {tier.site.acresLabel.toUpperCase()} · {w} × {d} M
        </text>
      </motion.g>
      {/* North arrow and scale bar */}
      <g aria-hidden>
        <path d={`M${w / 2 + 2.6} ${-d / 2 + 5} L${w / 2 + 2.6} ${-d / 2} M${w / 2 + 1.4} ${-d / 2 + 1.6} L${w / 2 + 2.6} ${-d / 2} L${w / 2 + 3.8} ${-d / 2 + 1.6}`} fill="none" stroke={ink} strokeWidth={0.3} />
        <text x={w / 2 + 2.6} y={-d / 2 - 1} textAnchor="middle" style={LABEL} fontSize="2.2" fill={ink}>
          N
        </text>
        <line x1={-w / 2} x2={-w / 2 + scaleLen} y1={d / 2 + 10.2} y2={d / 2 + 10.2} stroke={ink} strokeWidth={0.4} />
        <line x1={-w / 2} x2={-w / 2} y1={d / 2 + 9.5} y2={d / 2 + 10.9} stroke={ink} strokeWidth={0.4} />
        <line x1={-w / 2 + scaleLen} x2={-w / 2 + scaleLen} y1={d / 2 + 9.5} y2={d / 2 + 10.9} stroke={ink} strokeWidth={0.4} />
        <text x={-w / 2 + scaleLen + 1.4} y={d / 2 + 11} className="font-mono" fontSize="2.2" fill="var(--color-dust)">
          {scaleLen} M
        </text>
      </g>
    </svg>
  );
}
