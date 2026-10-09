"use client";

import { MotionConfig } from "motion/react";
import { createContext, useContext, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------
   Reduced-motion preview: wraps the motion demos so reviewers can see
   what people with "reduce motion" switched on will get.
   ------------------------------------------------------------------ */
const ReducedContext = createContext(false);

export function ReducedMotionPreview({ children }: { children: ReactNode }) {
  const [reduced, setReduced] = useState(false);
  return (
    <ReducedContext.Provider value={reduced}>
      <div className="mb-8 flex flex-wrap items-center gap-4">
        <button
          type="button"
          role="switch"
          aria-checked={reduced}
          onClick={() => setReduced((v) => !v)}
          className="inline-flex h-11 items-center gap-3 rounded-plate border border-brass/25 bg-carbon px-4 text-sm text-ink hover:border-brass/60"
        >
          <span
            aria-hidden
            className={cn(
              "relative h-4 w-8 rounded-full border border-brass/50 transition-colors duration-200",
              reduced && "bg-brass/30",
            )}
          >
            <span
              className={cn(
                "absolute top-0.5 h-2.5 w-2.5 rounded-full bg-brass transition-[left] duration-200",
                reduced ? "left-[18px]" : "left-0.5",
              )}
            />
          </span>
          Preview reduced motion
        </button>
        <p className="text-sm text-muted">
          {reduced
            ? "Showing what people with reduced motion get: fades only, no movement."
            : "Each demo has a Replay button."}
        </p>
      </div>
      <MotionConfig reducedMotion={reduced ? "always" : "user"}>
        {/* Remount demos when the mode flips so they replay in the new mode */}
        <div key={String(reduced)}>{children}</div>
      </MotionConfig>
    </ReducedContext.Provider>
  );
}

export const useReducedPreview = () => useContext(ReducedContext);

/* ------------------------------------------------------------------
   Replay frame: remounts its children so an entrance animation replays.
   ------------------------------------------------------------------ */
export function Replay({
  title,
  note,
  children,
  className,
  action = "Replay",
}: {
  title: string;
  note?: string;
  children: ReactNode;
  className?: string;
  action?: string;
}) {
  const [run, setRun] = useState(0);
  return (
    <figure className={cn("bsah-card flex flex-col overflow-hidden", className)}>
      <div className="relative grid min-h-56 flex-1 place-items-center p-8">
        <div key={run} className="w-full">
          {children}
        </div>
      </div>
      <figcaption className="flex items-start justify-between gap-4 border-t border-brass/15 px-5 py-4">
        <div>
          <p className="text-sm font-medium text-ink">{title}</p>
          {note && <p className="mt-1 text-xs leading-relaxed text-muted">{note}</p>}
        </div>
        <button
          type="button"
          onClick={() => setRun((n) => n + 1)}
          className="shrink-0 rounded-plate border border-brass/30 px-3 py-1.5 text-xs text-brass transition-colors duration-200 hover:border-parchment-gold hover:text-parchment-gold"
        >
          {action}
        </button>
      </figcaption>
    </figure>
  );
}
