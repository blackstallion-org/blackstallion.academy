"use client";

import { motion, useInView, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { Headline } from "@/components/film/Headline";
import { Cta, Label } from "@/components/film/Marks";
import { pillars, ranks } from "@/lib/content/curriculum";
import { ledger } from "@/lib/content/home";
import { ease } from "@/lib/motion/tokens";
import { cn } from "@/lib/utils";

const W = 1000;
const H = 560;
const colX = [130, 380, 630, 880];
const baseY = [480, 390, 300, 210];
const jitter = [0, 46, -22];

const nodes = ranks.flatMap((rank, ri) =>
  rank.pillars.map((n, k) => ({ n, ri, x: colX[ri] + jitter[k], y: baseY[ri] - k * 74 })),
);

/**
 * §7 Ledger · S07 constellation ascent.
 * Signature: each rank's three pillars join into a constellation, and the line climbs to the next rank.
 */
export function LedgerAscent() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.4 });
  const reduced = useReducedMotion();
  const [active, setActive] = useState(0);
  const [auto, setAuto] = useState(true);

  useEffect(() => {
    if (!inView || !auto || reduced) return;
    const id = window.setInterval(() => setActive((a) => (a + 1) % ranks.length), 3200);
    return () => window.clearInterval(id);
  }, [inView, auto, reduced]);

  const choose = (i: number) => {
    setAuto(false);
    setActive(i);
  };

  const rankNodes = (ri: number) => nodes.filter((nd) => nd.ri === ri);

  return (
    <section aria-labelledby="ledger-h" className="relative overflow-hidden py-[clamp(6rem,14vh,12rem)]">
      <div className="gutter grid gap-6 md:grid-cols-[1fr_minmax(0,24rem)] md:items-end">
        <div>
          <Label reel={5}>The Ledger</Label>
          <Headline id="ledger-h" className="mt-4" inscription={ledger.inscription} voice={ledger.voice} />
        </div>
        <p className="text-sand">{ledger.body}</p>
      </div>

      <div ref={ref} className="gutter mt-10">
        <div className="relative w-full" style={{ aspectRatio: `${W} / ${H}` }}>
          <svg viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 h-full w-full" aria-hidden>
            {/* Rank floors */}
            {ranks.map((_, ri) => (
              <line key={ri} x1={colX[ri] - 90} x2={colX[ri] + 110} y1={baseY[ri] + 34} y2={baseY[ri] + 34} stroke="rgb(197 160 89 / 0.25)" strokeWidth="1" />
            ))}
            {/* Ascent path between ranks */}
            {ranks.slice(0, -1).map((_, ri) => {
              const top = rankNodes(ri)[2];
              const next = rankNodes(ri + 1)[0];
              return (
                <motion.line
                  key={`a${ri}`}
                  x1={top.x}
                  y1={top.y}
                  x2={next.x}
                  y2={next.y}
                  stroke="var(--color-brass)"
                  strokeDasharray="3 6"
                  strokeWidth="1"
                  initial={false}
                  animate={{ opacity: ri < active ? 0.8 : 0.15 }}
                  transition={{ duration: 0.8 }}
                />
              );
            })}
            {/* Constellation lines inside each rank */}
            {ranks.map((_, ri) => {
              const [a, b, c] = rankNodes(ri);
              const d = `M${a.x} ${a.y} L${b.x} ${b.y} L${c.x} ${c.y}`;
              return (
                <motion.path
                  key={`c${ri}-${ri === active ? "on" : "off"}`}
                  d={d}
                  fill="none"
                  stroke={ri <= active ? "var(--color-gold)" : "rgb(197 160 89 / 0.2)"}
                  strokeWidth={ri === active ? 1.6 : 1}
                  initial={{ pathLength: ri === active && !reduced ? 0 : 1 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 1.1, ease: ease.citadel }}
                />
              );
            })}
            {nodes.map((nd) => {
              const on = nd.ri === active;
              const done = nd.ri < active;
              return (
                <g key={nd.n}>
                  {on && <circle cx={nd.x} cy={nd.y} r="16" fill="rgb(230 202 101 / 0.12)" />}
                  <circle cx={nd.x} cy={nd.y} r={on ? 5 : 3.5} fill={on ? "var(--color-gold)" : done ? "var(--color-brass)" : "rgb(197 160 89 / 0.35)"} />
                </g>
              );
            })}
          </svg>
          {/* Labels as HTML so they stay crisp and readable */}
          {nodes.map((nd) => {
            const p = pillars[nd.n - 1];
            const on = nd.ri === active;
            return (
              <span
                key={nd.n}
                className={cn(
                  "t-ui pointer-events-none absolute -translate-y-1/2 whitespace-nowrap pl-4 text-[clamp(0.6rem,1.15vw,0.9rem)] transition-colors duration-700",
                  on ? "text-bone" : nd.ri < active ? "text-sand/70" : "text-dust/50",
                  !on && "hidden md:inline",
                )}
                style={{ left: `${(nd.x / W) * 100}%`, top: `${(nd.y / H) * 100}%` }}
              >
                <span className="font-mono mr-1.5 text-gold/80">{String(nd.n).padStart(2, "0")}</span>
                {p.name}
              </span>
            );
          })}
        </div>

        <div className="mt-8 grid grid-cols-2 gap-px bg-brass/15 md:grid-cols-4" role="group" aria-label="Ranks">
          {ranks.map((r, i) => (
            <button
              key={r.id}
              type="button"
              onClick={() => choose(i)}
              onFocus={() => choose(i)}
              aria-pressed={active === i}
              className={cn("bg-night p-4 text-left transition-colors md:p-5", active === i ? "text-bone" : "text-dust hover:text-sand")}
            >
              <span className={cn("font-mono text-xs", active === i ? "text-gold" : "text-dust")}>RANK {r.numeral}</span>
              <span className="t-voice mt-1 block text-lg md:text-xl">{r.name}</span>
              <span className="mt-1 block text-sm">{r.short}</span>
              <span className={cn("mt-3 block h-px transition-colors duration-700", active === i ? "bg-gold" : "bg-transparent")} />
            </button>
          ))}
        </div>
      </div>

      <div className="gutter mt-12">
        <Cta href="/curriculum">Open the curriculum</Cta>
      </div>
    </section>
  );
}
