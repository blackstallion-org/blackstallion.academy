"use client";

import { useRef, type KeyboardEvent } from "react";
import { campusTierList, type CampusTier } from "@/lib/content/campus";
import { tierById } from "@/lib/content/schools";
import { cn } from "@/lib/utils";

type Props = {
  value: CampusTier["id"];
  onChange: (id: CampusTier["id"]) => void;
  className?: string;
};

/**
 * The approved variants, one per tier of the tier table. A radio group with a roving tab stop: arrow keys move and select,
 * as for any radio group. Reads its figures from the tier table, never from the 3D scene.
 */
export function CampusConfigurationSelector({ value, onChange, className }: Props) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const index = campusTierList.findIndex((t) => t.id === value);

  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const step = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
    if (!step) return;
    e.preventDefault();
    const next = (index + step + campusTierList.length) % campusTierList.length;
    onChange(campusTierList[next].id);
    refs.current[next]?.focus();
  };

  return (
    <div role="radiogroup" aria-label="Campus tier" onKeyDown={onKey} className={cn("grid border-t border-line md:grid-cols-3 md:border-t-0", className)}>
      {campusTierList.map((t, i) => {
        const tier = tierById(t.id);
        const on = t.id === value;
        return (
          <button
            key={t.id}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role="radio"
            aria-checked={on}
            tabIndex={on ? 0 : -1}
            onClick={() => onChange(t.id)}
            className={cn(
              "group relative grid cursor-pointer grid-cols-[1fr_auto] items-baseline gap-x-4 border-b border-line py-4 text-left transition-colors md:border-b-0 md:border-t md:px-1 md:pr-6",
              "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold",
              on ? "md:border-t-2 md:border-gold" : "md:border-line",
            )}
          >
            <span>
              <span className={cn("t-voice block text-2xl transition-colors", on ? "text-gold" : "text-sand group-hover:text-bone")}>{tier.name}</span>
              <span className="t-ui mt-1 block text-sm text-dust">
                {tier.stables} stables · {tier.acres} · {tier.cadets} cadets
              </span>
            </span>
            <span className={cn("font-mono text-sm", on ? "text-gold" : "text-dust")}>{tier.capexLabel}</span>
          </button>
        );
      })}
    </div>
  );
}
