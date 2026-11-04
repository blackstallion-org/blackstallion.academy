"use client";

import { AnimatePresence, motion } from "motion/react";
import { nodeLabels, type InstrumentNode } from "@/lib/content/anatomy";
import { ease } from "@/lib/motion/tokens";
import { useReducedMotion } from "@/lib/motion/reduced";
import { cn } from "@/lib/utils";

type Props = {
  /** The node to show; null closes the panel (it fades out). */
  node: InstrumentNode | null;
  /** 1-based position among the nodes on the plate. */
  position: number;
  total: number;
  /** "overlay": a plate over the 3D canvas (desktop, full screen). "inline": plain text under the plate. */
  surface: "overlay" | "inline";
  onClose?: () => void;
  className?: string;
};

const rows = ["anatomy", "teaches", "benefit"] as const;

/**
 * The detail for one hotspot on the home stallion: the part, what it teaches the rider, what it builds, and a legend line
 * (labelled as told). Quiet motion: one fade and slide, a brass rule that draws, the rows arriving in turn.
 * Reduced motion: the panel fades only.
 */
export function NodePanel({ node, position, total, surface, onClose, className }: Props) {
  const reduced = useReducedMotion();
  const overlay = surface === "overlay";
  const rise = overlay ? { x: 14 } : { y: 10 };
  const fall = overlay ? { x: 8 } : { y: -6 };

  return (
    <AnimatePresence mode="wait">
      {node && (
        <motion.section
          key={node.id}
          aria-label={`${node.name}: what it teaches`}
          initial={{ opacity: 0, ...(reduced ? {} : rise) }}
          animate={{ opacity: 1, x: 0, y: 0 }}
          exit={{ opacity: 0, ...(reduced ? {} : fall), transition: { duration: reduced ? 0.12 : 0.22, ease: ease.citadel } }}
          transition={{ duration: reduced ? 0.15 : 0.5, ease: ease.citadel }}
          onPointerDown={overlay ? (e) => e.stopPropagation() : undefined}
          className={cn(
            "pointer-events-auto min-h-0 overflow-y-auto overscroll-contain",
            overlay ? "plate p-4 xl:p-5" : "max-w-2xl",
            className,
          )}
        >
          <div className="flex items-start justify-between gap-4">
            <p className="label text-gold">
              {node.name}
              {node.region && node.region !== node.name && <span className="text-dust"> · {node.region}</span>}
              <span className="ml-2 inline-block whitespace-nowrap font-mono text-[0.62rem] tracking-[0.12em] text-dust">{position}/{total}</span>
            </p>
            {overlay && onClose && (
              <button
                type="button"
                onClick={onClose}
                aria-label="Close and show the whole horse"
                className="-mr-3 -mt-3 grid h-11 w-11 shrink-0 place-items-center text-sand transition-colors hover:text-gold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-gold"
              >
                <svg aria-hidden viewBox="0 0 12 12" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="1.25">
                  <path d="M1.5 1.5l9 9M10.5 1.5l-9 9" />
                </svg>
              </button>
            )}
          </div>
          <h3 className="t-voice mt-1 text-[1.4rem] leading-tight text-bone">{node.title}</h3>
          <motion.span
            aria-hidden
            className="mt-2.5 block h-px origin-left bg-gold/70"
            initial={{ scaleX: reduced ? 1 : 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: reduced ? 0 : 0.7, delay: reduced ? 0 : 0.12, ease: ease.citadel }}
          />

          <dl className="mt-3 space-y-3">
            {rows.map((key, i) => (
              <motion.div
                key={key}
                initial={{ opacity: 0, y: reduced ? 0 : 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: reduced ? 0.15 : 0.45, delay: reduced ? 0 : 0.14 + i * 0.07, ease: ease.citadel }}
              >
                <dt className="label text-dust">{nodeLabels[key]}</dt>
                <dd className={cn("mt-0.5 text-[0.9rem] leading-snug", key === "benefit" ? "t-voice text-[1rem] text-gold" : "text-sand")}>
                  {node[key]}
                </dd>
              </motion.div>
            ))}
            <motion.div
              initial={{ opacity: 0, y: reduced ? 0 : 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: reduced ? 0.15 : 0.45, delay: reduced ? 0 : 0.14 + rows.length * 0.07, ease: ease.citadel }}
              className="border-t border-line pt-2.5"
            >
              <dt className="label text-brass">{nodeLabels.legend}</dt>
              <dd className="mt-0.5 text-[0.88rem] italic leading-snug text-sand">{node.legend}</dd>
            </motion.div>
          </dl>

          {node.evidence && (
            <p className="mt-3 text-[0.74rem] leading-snug text-dust">
              {node.evidence.text} ({node.evidence.cite}.)
            </p>
          )}
        </motion.section>
      )}
    </AnimatePresence>
  );
}
