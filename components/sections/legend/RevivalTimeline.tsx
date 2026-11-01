"use client";

import { useId, useRef, useState, type KeyboardEvent } from "react";
import { AnimatePresence, motion } from "motion/react";
import { revival } from "@/lib/content/legend";
import { useReducedMotion } from "@/lib/motion/reduced";
import { ease } from "@/lib/motion/tokens";
import { cn } from "@/lib/utils";

type Icon = (typeof revival.milestones)[number]["icon"];

/** One small mark per event, drawn in the same 24-unit line style. */
function Mark({ icon }: { icon: Icon }) {
  const common = { fill: "none", stroke: "currentColor", strokeWidth: 1.4, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  switch (icon) {
    case "crown":
      return <path {...common} d="M5 16 4 8l4.5 3.5L12 6l3.5 5.5L20 8l-1 8Zm0 2.5h14" />;
    case "scroll":
      return <path {...common} d="M7 5h10a2 2 0 0 1 2 2v1h-3M7 5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2V8M7 5a2 2 0 0 1 2 2v12M11 10h5M11 13h5M11 16h3" />;
    case "seal":
      return <g {...common}><circle cx="12" cy="10" r="5.5" /><path d="M9 14.5 7.5 20l4.5-2 4.5 2-1.5-5.5M12 7.5v5M9.5 10h5" /></g>;
    case "laurel":
      return <path {...common} d="M12 20c-4-1.5-6.5-5-6.5-10M12 20c4-1.5 6.5-5 6.5-10M6.2 13.5c1.6-.2 2.6.6 3 1.8M5.6 10c1.5 0 2.4 1 2.6 2.2M17.8 13.5c-1.6-.2-2.6.6-3 1.8M18.4 10c-1.5 0-2.4 1-2.6 2.2M12 7v5" />;
    case "brand":
      return <g {...common}><rect x="5" y="6" width="14" height="10" rx="1.5" /><path d="M8.5 9.5v3M11 9.5l1.5 3 1.5-3M16 9.5v3M12 16v4" /></g>;
    case "ears":
      return <path {...common} d="M8 19c-1.5-3-2-7-1-11 .3-1.3 1.2-2.5 2.3-3 .2 1.6-.2 3.2-.8 4.6M16 19c1.5-3 2-7 1-11-.3-1.3-1.2-2.5-2.3-3-.2 1.6.2 3.2.8 4.6M8 19c2.5 1 5.5 1 8 0" />;
  }
}

/**
 * The revival (R14, 2 Nov 2026): six dated events on one line, each with its own small mark. Choosing a mark (click, tap, or the
 * arrow keys, Home and End once a mark has focus: a roving-tabindex tab list) opens that event's story below the line. The labels sit
 * in fixed equal columns, so they cannot collide at any width; the story panel has a reserved height so the page does not jump.
 */
export function RevivalTimeline() {
  const items = revival.milestones;
  const [active, setActive] = useState(0);
  const reduced = useReducedMotion();
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const base = useId();

  const move = (to: number, focus = true) => {
    const i = (to + items.length) % items.length;
    setActive(i);
    if (focus) tabs.current[i]?.focus();
  };
  const onKey = (e: KeyboardEvent<HTMLButtonElement>, i: number) => {
    const map: Record<string, number> = { ArrowRight: i + 1, ArrowDown: i + 1, ArrowLeft: i - 1, ArrowUp: i - 1, Home: 0, End: items.length - 1 };
    if (e.key in map) { e.preventDefault(); move(map[e.key]); }
  };
  const item = items[active];

  return (
    <div>
      <div className="relative">
        {/* the line runs through the centres of the marks; the part up to the chosen event is gold */}
        <div aria-hidden className="absolute left-[calc(100%/12)] right-[calc(100%/12)] top-[1.375rem] h-px bg-line md:top-7" />
        <div
          aria-hidden
          className="absolute left-[calc(100%/12)] top-[1.375rem] h-px bg-gold transition-[width] duration-700 ease-out motion-reduce:transition-none md:top-7"
          style={{ width: `calc((100% - 100% / 6) * ${active / (items.length - 1)})` }}
        />
        <div role="tablist" aria-label="The revival, 1900s to today" className="relative grid grid-cols-6">
          {items.map((m, i) => {
            const on = i === active;
            const done = i <= active;
            return (
              <button
                key={m.year}
                ref={(el) => { tabs.current[i] = el; }}
                type="button"
                role="tab"
                id={`${base}-tab-${i}`}
                aria-selected={on}
                aria-controls={`${base}-panel`}
                tabIndex={on ? 0 : -1}
                onClick={() => setActive(i)}
                onKeyDown={(e) => onKey(e, i)}
                data-sound="off"
                className="group flex flex-col items-center gap-2 rounded-sm px-1 pb-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
              >
                <span
                  className={cn(
                    "grid h-11 w-11 place-items-center rounded-full border bg-night transition-colors duration-300 md:h-14 md:w-14",
                    on ? "border-gold bg-gold text-night" : done ? "border-gold text-gold" : "border-line text-dust group-hover:border-gold group-hover:text-gold",
                  )}
                >
                  <svg viewBox="0 0 24 24" className="h-5 w-5 md:h-6 md:w-6" aria-hidden><Mark icon={m.icon} /></svg>
                </span>
                <span className={cn("font-mono text-[0.68rem] tracking-[0.08em] md:text-xs", on ? "text-gold" : "text-sand")}>{m.year}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div id={`${base}-panel`} role="tabpanel" aria-labelledby={`${base}-tab-${active}`} className="relative mx-auto mt-10 min-h-[11rem] max-w-2xl md:min-h-[9rem]">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={active}
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, y: -8 }}
            transition={{ duration: reduced ? 0.2 : 0.45, ease: ease.citadel }}
          >
            <p className="font-mono text-sm text-gold">{item.year}</p>
            <p className="t-voice mt-2 text-[clamp(1.6rem,3vw,2.4rem)] leading-tight text-bone">{item.title}</p>
            <p className="t-story mt-3 text-sand">{item.text}</p>
          </motion.div>
        </AnimatePresence>
      </div>
      <div className="mx-auto mt-4 flex max-w-2xl items-center justify-between gap-4">
        <button type="button" data-sound="off" onClick={() => move(active - 1, false)} className="label min-h-11 px-2 text-sand hover:text-gold focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold" aria-label="Previous event">← Earlier</button>
        <span className="label text-dust">{active + 1} / {items.length}</span>
        <button type="button" data-sound="off" onClick={() => move(active + 1, false)} className="label min-h-11 px-2 text-sand hover:text-gold focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold" aria-label="Next event">Later →</button>
      </div>
      <p className="t-ui mx-auto mt-6 max-w-2xl text-xs text-dust">{revival.sources}</p>
    </div>
  );
}
