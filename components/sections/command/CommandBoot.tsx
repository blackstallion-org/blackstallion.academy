"use client";

import { motion } from "motion/react";
import { useReducedMotion } from "@/lib/motion/reduced";
import { ease } from "@/lib/motion/tokens";

const lines = ["SOVEREIGN COMMAND TERMINAL · DEMO", "LINK · OFFICE OF THE EXECUTIVE CHAIRMAN", "SCRIPTED ANSWERS · ASK ABOUT ROI, INSURANCE, SAFETY OR CURRICULUM"];

/** Title card · T14 terminal boot. Signature: the boot sequence types itself before the headline appears (instant under reduced motion). */
export function CommandBoot() {
  const reduced = useReducedMotion();
  return (
    <div className="mt-8">
      <div className="font-mono flex flex-col gap-1 text-xs tracking-[0.14em] text-dust">
        {lines.map((l, i) => (
          <motion.p
            key={l}
            initial={reduced ? false : { clipPath: "inset(0 100% 0 0)" }}
            animate={{ clipPath: "inset(0 0% 0 0)" }}
            transition={{ duration: reduced ? 0 : 0.9, ease: "linear", delay: reduced ? 0 : i * 0.9 }}
          >
            <span className="text-gold">›</span> {l}
          </motion.p>
        ))}
      </div>
      <motion.h1
        id="cmd-h"
        className="mt-6 text-display-1"
        initial={reduced ? false : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reduced ? 0 : 1.1, ease: ease.citadel, delay: reduced ? 0 : 2.6 }}
      >
        <span className="t-inscribe block text-[0.5em]">Ask the</span>
        <span className="t-voice block text-gold">command terminal.</span>
      </motion.h1>
    </div>
  );
}
