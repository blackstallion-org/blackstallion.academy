"use client";

import { motion, useReducedMotion, useTransform, type MotionValue } from "motion/react";
import { Chapter } from "../Chapter";
import { FilmImage } from "../FilmImage";
import { MaskLine, ProgressFade } from "../MaskLine";
import { fleet } from "@/lib/content/film";
import { r } from "../range";

/**
 * Chapter IV. You walk down the lamplit stable while the studbook rolls past like end credits.
 * Signature moment: the corridor pushes in as each name crosses the centre line.
 */
export function Fleet() {
  return (
    <Chapter id="fleet" label="Chapter IV: The Fleet" length={3.5}>
      {(p) => <FleetFrame p={p} />}
    </Chapter>
  );
}

function FleetFrame({ p }: { p: MotionValue<number> }) {
  const reduced = useReducedMotion();
  const scale = useTransform(p, r(0, 1), [1.05, 1.55]);
  const roll = useTransform(p, r(0.12, 0.95), ["65svh", "-110%"]);

  return (
    <div className="relative h-full w-full bg-night">
      <FilmImage name="bgStable" scale={reduced ? 1.05 : scale} />
      <div className="absolute inset-0 bg-gradient-to-l from-night/95 via-night/60 to-night/10" />

      <div className="absolute left-5 top-24 max-w-[560px] sm:left-10 sm:top-28 lg:left-[8vw] lg:top-1/2 lg:-translate-y-1/2">
        <ProgressFade progress={p} range={[0.01, 0.06]}>
          <p className="label mb-6 text-gold">
            Chapter IV <span className="mx-3 text-sand/50">/</span> The Bloodline Vault
          </p>
        </ProgressFade>
        <h2 className="font-display text-display-2 tracking-display opsz-display">
          <MaskLine progress={p} range={[0.02, 0.1]}>Twenty-one stallions.</MaskLine>
          <MaskLine progress={p} range={[0.05, 0.13]} className="italic text-sand">
            Every one has a name.
          </MaskLine>
        </h2>
        <ProgressFade progress={p} range={[0.1, 0.18]}>
          <p className="mt-6 hidden max-w-[42ch] text-sand/90 sm:block">
            Indigenous Marwari and Kathiawari horses, each microchipped, each on a 24-hour stall camera that parents can open
            from the app.
          </p>
        </ProgressFade>
      </div>

      {/* Studbook credits roll */}
      <div className="absolute bottom-0 right-0 top-[40%] w-full overflow-hidden sm:top-0 sm:w-[52%] lg:w-[44%]" style={{ maskImage: "linear-gradient(180deg, transparent 0%, black 22%, black 78%, transparent 100%)" }}>
        <motion.ul className="flex flex-col gap-[14svh] px-5 sm:px-10 lg:pr-28" style={{ y: reduced ? 0 : roll }} data-roll>
          {fleet.map((h) => (
            <li key={h.name} className="text-right">
              <p className="font-display text-display-2 tracking-display text-bone opsz-display">{h.name}</p>
              <p className="label mt-3 text-sand/80">
                {h.breed} <span className="mx-2 text-brass">/</span> {h.hands} hands <span className="mx-2 text-brass">/</span> {h.temper}
              </p>
              <p className="mt-2 font-mono text-sm text-brass">ISO {h.chip}</p>
            </li>
          ))}
          <li className="label text-right text-[0.62rem] text-sand/50">Sample entries. The full studbook comes from the database.</li>
        </motion.ul>
      </div>
    </div>
  );
}
