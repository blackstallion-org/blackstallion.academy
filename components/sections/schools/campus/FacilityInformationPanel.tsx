"use client";

import { AnimatePresence, motion } from "motion/react";
import { basisLabel, type CampusModule, type CampusTier, type Spec } from "@/lib/content/campus";
import { useReducedMotion } from "@/lib/motion/reduced";
import { cn } from "@/lib/utils";

type Props = {
  tier: CampusTier;
  module: CampusModule | null;
  onSelect: (id: string) => void;
  onBack: () => void;
  className?: string;
};

function SpecRows({ specs }: { specs: Spec[] }) {
  return (
    <dl className="mt-6 border-t border-line">
      {specs.map((s) => (
        <div key={s.label} className="grid grid-cols-[7.5rem_1fr] gap-x-4 gap-y-1 border-b border-line py-3 sm:grid-cols-[9rem_1fr]">
          <dt className="label text-brass">{s.label}</dt>
          <dd className="t-ui text-sm leading-relaxed text-bone">
            <span className={cn(s.basis === "tbc" && "text-dust italic")}>{s.value}</span>
            {s.basis !== "approved" && (
              <span
                className={cn(
                  "label ml-2 inline-block translate-y-[-1px] border px-1.5 py-0.5 text-[0.55rem] not-italic",
                  s.basis === "tbc" ? "border-dashed border-gold text-gold" : "border-line text-dust",
                )}
              >
                {basisLabel[s.basis]}
              </span>
            )}
          </dd>
        </div>
      ))}
    </dl>
  );
}

/**
 * The editorial card: the tier's overview until a building is chosen, then that building's requirements: purpose, then each
 * specification marked Approved (no mark), As modelled or To be confirmed. Nothing here is written by the 3D scene.
 */
export function FacilityInformationPanel({ tier, module: m, onSelect, onBack, className }: Props) {
  const reduced = useReducedMotion();
  const key = m ? `${tier.id}:${m.id}` : `${tier.id}:overview`;
  return (
    <div className={cn("plate p-5 sm:p-7", className)} aria-live="polite" aria-atomic="true">
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={key}
          initial={reduced ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduced ? { opacity: 0 } : { opacity: 0, y: -6 }}
          transition={{ duration: reduced ? 0 : 0.35, ease: [0.16, 1, 0.3, 1] }}
        >
          {m ? (
            <>
              <p className="label text-brass">
                {tier.name} · {m.key} of {tier.modules.length}
              </p>
              <h3 className="t-voice mt-2 text-[1.7rem] leading-tight text-bone">{m.name}</h3>
              <p className="mt-3 text-sand">{m.purpose}</p>
              <SpecRows specs={m.specs} />
              <button type="button" onClick={onBack} className="label mt-6 inline-flex min-h-11 cursor-pointer items-center gap-2 text-gold underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold">
                <span aria-hidden>←</span> Back to the whole campus
              </button>
            </>
          ) : (
            <>
              <p className="label text-brass">{tier.layoutTitle}</p>
              <h3 className="t-voice mt-2 text-[1.7rem] leading-tight text-bone">{tier.name}</h3>
              <SpecRows specs={tier.overview} />
              <p className="label mt-6 text-brass">Includes</p>
              <p className="t-ui mt-1 text-sm text-sand">{tier.includes.join(" · ")}</p>
              <p className="label mt-6 text-brass">Buildings in the model</p>
              <ul className="mt-2 border-t border-line">
                {tier.modules.map((b) => (
                  <li key={b.id} className="border-b border-line">
                    <button
                      type="button"
                      onClick={() => onSelect(b.id)}
                      className="group flex min-h-11 w-full cursor-pointer items-center gap-3 py-2 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
                    >
                      <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full border border-line font-mono text-[0.65rem] text-sand transition-colors group-hover:border-gold group-hover:text-gold">{b.key}</span>
                      <span className="t-ui text-sm text-bone transition-colors group-hover:text-gold">{b.name}</span>
                    </button>
                  </li>
                ))}
              </ul>
              <p className="t-ui mt-5 text-xs leading-relaxed text-dust">{tier.note}</p>
            </>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
