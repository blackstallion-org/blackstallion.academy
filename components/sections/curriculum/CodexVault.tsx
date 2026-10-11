"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useState } from "react";
import { Headline } from "@/components/film/Headline";
import { Label } from "@/components/film/Marks";
import { phaseOf, pillars, ranks, type Pillar } from "@/lib/content/curriculum";
import { ease } from "@/lib/motion/tokens";
import { cn } from "@/lib/utils";

/**
 * §2 · S35 the Sovereign Codex vault. Thirteen copper-rimmed tiles in a staggered
 * two-column vault; opening one ignites its rim and reveals skill, trait and the
 * ledger line. One tile open at a time. Directive 04 §1 (the 13-Pillar Sovereign Ledger).
 */
export function CodexVault() {
  const [open, setOpen] = useState<number | null>(1);
  const reduced = useReducedMotion();

  // Staggered vault: odd pillars stack left, even pillars stack right (offset).
  const colA = pillars.filter((_, i) => i % 2 === 0);
  const colB = pillars.filter((_, i) => i % 2 === 1);

  const tile = (p: Pillar) => {
    const isOpen = open === p.n;
    const phase = phaseOf(p.n);
    const rank = ranks.find((rk) => rk.pillars.includes(p.n))!;
    return (
      <li key={p.n} className="relative">
        <motion.div
          className={cn(
            "relative overflow-hidden border bg-night/80 transition-colors duration-700",
            isOpen ? "border-gold/70" : "border-copper/30 hover:border-copper/70",
          )}
          animate={reduced ? undefined : { boxShadow: isOpen ? "0 0 70px rgb(212 175 55 / 0.14), inset 0 0 50px rgb(184 115 51 / 0.08)" : "0 0 0px rgb(212 175 55 / 0)" }}
          transition={{ duration: 0.9, ease: ease.citadel }}
        >
          {/* Rim ignition */}
          <AnimatePresence>
            {isOpen && (
              <motion.span
                aria-hidden
                className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold to-transparent"
                initial={{ opacity: 0, scaleX: 0 }}
                animate={{ opacity: 1, scaleX: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: reduced ? 0 : 1.1, ease: ease.citadel }}
              />
            )}
          </AnimatePresence>
          <button
            type="button"
            onClick={() => setOpen(isOpen ? null : p.n)}
            aria-expanded={isOpen}
            aria-controls={`codex-${p.n}`}
            className="flex w-full items-baseline gap-4 p-5 text-left md:p-6"
          >
            <span className={cn("t-inscribe text-[clamp(1.6rem,3vw,2.6rem)] leading-none transition-colors duration-700", isOpen ? "text-gold" : "text-copper/80")}>
              {String(p.n).padStart(2, "0")}
            </span>
            <span className="min-w-0 flex-1">
              <span className={cn("t-voice block text-xl leading-tight transition-colors duration-700 md:text-2xl", isOpen ? "text-bone" : "text-sand")}>{p.name}</span>
              <span className="label mt-2 block text-[0.6rem] text-dust">
                Phase {phase.numeral} · {phase.name}
                {p.discipline && <span className="ml-2 text-copper">BSAH discipline</span>}
              </span>
            </span>
            <span aria-hidden className={cn("t-inscribe text-lg transition-transform duration-500", isOpen ? "rotate-45 text-gold" : "text-dust")}>
              +
            </span>
          </button>
          <AnimatePresence initial={false}>
            {isOpen && (
              <motion.div
                id={`codex-${p.n}`}
                key="body"
                initial={reduced ? { opacity: 0 } : { height: 0, opacity: 0 }}
                animate={reduced ? { opacity: 1 } : { height: "auto", opacity: 1 }}
                exit={reduced ? { opacity: 0 } : { height: 0, opacity: 0 }}
                transition={{ duration: reduced ? 0.01 : 0.7, ease: ease.citadel }}
                className="overflow-hidden"
              >
                <div className="relative px-5 pb-6 md:px-6 md:pb-7">
                  <span aria-hidden className="pointer-events-none absolute -top-10 left-1/2 h-40 w-[80%] -translate-x-1/2 rounded-full bg-gold/5 blur-3xl" />
                  <dl className="divide-y divide-copper/15 border-y border-copper/15">
                    <div className="grid gap-1 py-3 sm:grid-cols-[8.5rem_1fr] sm:gap-6">
                      <dt className="label pt-1 text-dust">Skill developed</dt>
                      <dd className="text-sand">{p.skill}</dd>
                    </div>
                    <div className="grid gap-1 py-3 sm:grid-cols-[8.5rem_1fr] sm:gap-6">
                      <dt className="label pt-1 text-dust">The trait</dt>
                      <dd className="t-voice text-xl text-gold">{p.trait}</dd>
                    </div>
                  </dl>
                  <p className="t-story mt-4 text-sand">{p.sub}</p>
                  <p className="font-mono mt-4 text-[0.68rem] text-dust">
                    LEDGER {String(p.n).padStart(2, "0")}/13 · DRILLED AT {rank.name.toUpperCase()}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </li>
    );
  };

  return (
    <section aria-labelledby="codex-h" className="relative bg-umber/40 py-[clamp(6rem,14vh,12rem)]">
      <div className="gutter">
        <Label>The Sovereign Codex</Label>
        <Headline id="codex-h" className="mt-4" inscription="Thirteen pillars," voice="one sovereign ledger." />
        <p className="t-story mt-6 max-w-2xl text-sand">
          Nine foundations every rider on earth has learned the hard way, and four tactical disciplines that belong to BSAH. Open a tile.
        </p>
        <div className="mt-14 grid gap-4 md:grid-cols-2 md:gap-6">
          <ul className="flex flex-col gap-4 md:gap-6">{colA.map(tile)}</ul>
          <ul className="flex flex-col gap-4 md:gap-6 md:mt-20">{colB.map(tile)}</ul>
        </div>
      </div>
    </section>
  );
}
