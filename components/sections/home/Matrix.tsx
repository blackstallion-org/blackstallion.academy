"use client";

import { AnimatePresence, motion } from "motion/react";
import { useRef, useState, type KeyboardEvent } from "react";
import { Headline } from "@/components/film/Headline";
import { Cta, Label } from "@/components/film/Marks";
import { matrix } from "@/lib/content/home";
import { ease } from "@/lib/motion/tokens";
import { cn } from "@/lib/utils";
import { RiderDiagram, type SystemId } from "./RiderDiagram";

/**
 * §4 Matrix · S04 system console.
 * Signature: choosing a system lights its region on the rider plate.
 */
export function Matrix() {
  const [active, setActive] = useState<SystemId>("brain");
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const sys = matrix.systems.find((s) => s.id === active)!;

  const onKey = (e: KeyboardEvent, i: number) => {
    const n = matrix.systems.length;
    const next = e.key === "ArrowDown" || e.key === "ArrowRight" ? (i + 1) % n : e.key === "ArrowUp" || e.key === "ArrowLeft" ? (i - 1 + n) % n : -1;
    if (next < 0) return;
    e.preventDefault();
    setActive(matrix.systems[next].id as SystemId);
    tabs.current[next]?.focus();
  };

  return (
    <section aria-labelledby="matrix-h" className="relative overflow-hidden bg-umber/40 py-[clamp(6rem,14vh,12rem)]">
      <div className="gutter">
        <Label reel={3}>The Matrix</Label>
        <Headline id="matrix-h" className="mt-4" inscription={matrix.inscription} voice={matrix.voice} />

        <div className="mt-14 grid gap-10 lg:grid-cols-[14rem_minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-14">
          <div role="tablist" aria-label="Body systems" aria-orientation="vertical" className="no-scrollbar flex gap-2 overflow-x-auto lg:flex-col lg:gap-0">
            {matrix.systems.map((s, i) => (
              <button
                key={s.id}
                ref={(el) => {
                  tabs.current[i] = el;
                }}
                role="tab"
                id={`tab-${s.id}`}
                aria-selected={active === s.id}
                aria-controls="matrix-panel"
                tabIndex={active === s.id ? 0 : -1}
                onClick={() => setActive(s.id as SystemId)}
                onKeyDown={(e) => onKey(e, i)}
                className={cn(
                  "group flex shrink-0 items-baseline gap-4 border-b py-4 pr-6 text-left transition-colors lg:pr-0",
                  active === s.id ? "border-gold" : "border-brass hover:border-brass/50",
                )}
              >
                <span className="font-mono text-xs text-dust">0{i + 1}</span>
                <span className={cn("t-voice text-2xl transition-colors md:text-3xl", active === s.id ? "text-gold" : "text-sand group-hover:text-bone")}>
                  {s.name}
                </span>
              </button>
            ))}
          </div>

          <div className="relative mx-auto aspect-[5/7] w-full max-w-[22rem] lg:max-w-none">
            <RiderDiagram active={active} />
          </div>

          <div id="matrix-panel" role="tabpanel" aria-labelledby={`tab-${active}`} className="lg:pt-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={active}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.45, ease: ease.citadel }}
              >
                <p className="t-story text-bone">{sys.text}</p>
                <div className="mt-8 border-l border-brass pl-5">
                  <p className="label">
                    <span className={sys.evidence === "Supported" ? "text-gold" : "text-sand"}>● {sys.evidence}</span>
                    <span className="ml-3 text-dust">Evidence</span>
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-sand/85">{sys.note}</p>
                </div>
              </motion.div>
            </AnimatePresence>
            <div className="mt-12">
              <Cta href="/science">See the evidence</Cta>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
