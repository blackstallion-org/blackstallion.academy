"use client";

import { AnimatePresence, motion, useReducedMotion, useTransform, type MotionValue } from "motion/react";
import { useState } from "react";
import { Chapter } from "../Chapter";
import { FilmImage } from "../FilmImage";
import { MaskLine, ProgressFade } from "../MaskLine";
import { TUITION_PER_MONTH, tiers } from "@/lib/content/film";
import { cn } from "@/lib/utils";
import { r } from "../range";

const inr = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });
const film = [0.7, 0, 0.2, 1] as const;

/**
 * Chapter V. The pavilion opens like a curtain; principals pick a tier and see the payback.
 * Signature moment: the image wipes open from the centre.
 */
export function Campus() {
  return (
    <Chapter id="campus" label="Chapter V: Campus tiers and return" length={2.4}>
      {(p) => <CampusFrame p={p} />}
    </Chapter>
  );
}

function CampusFrame({ p }: { p: MotionValue<number> }) {
  const reduced = useReducedMotion();
  const wipe = useTransform(p, r(0, 0.22), ["inset(0% 50% 0% 50%)", "inset(0% 0% 0% 0%)"]);
  const scale = useTransform(p, r(0, 1), [1.2, 1.04]);
  const [tierId, setTierId] = useState<(typeof tiers)[number]["id"]>("signature");
  const [cadets, setCadets] = useState(60);
  const [share, setShare] = useState(25);
  const tier = tiers.find((t) => t.id === tierId)!;
  const monthly = (cadets * TUITION_PER_MONTH * share) / 100;
  const payback = monthly > 0 ? (tier.capexLakh * 100000) / monthly : 0;

  return (
    <div className="relative h-full w-full bg-night">
      <FilmImage name="bgPavilion" clipPath={reduced ? undefined : wipe} scale={scale} />
      <div className="absolute inset-0 bg-gradient-to-r from-night/95 via-night/70 to-night/20" />

      <div className="relative flex h-full flex-col justify-center gap-8 px-5 pb-14 pt-16 sm:gap-10 sm:px-10 lg:pl-[8vw] lg:pr-28">
        <div>
          <ProgressFade progress={p} range={[0.08, 0.16]}>
            <p className="label mb-6 text-gold">
              Chapter V <span className="mx-3 text-sand/50">/</span> For school boards
            </p>
          </ProgressFade>
          <h2 className="font-display text-display-2 tracking-display opsz-display">
            <MaskLine progress={p} range={[0.1, 0.2]}>Build the citadel.</MaskLine>
            <MaskLine progress={p} range={[0.13, 0.23]} className="italic text-sand">
              It pays for itself.
            </MaskLine>
          </h2>
        </div>

        <ProgressFade progress={p} range={[0.2, 0.3]} className="grid max-w-[1100px] gap-10 lg:grid-cols-2 lg:gap-16">
          <div>
            <p className="label mb-4 text-sand/70">Choose a hub</p>
            <div role="radiogroup" aria-label="Facility tier" className="flex flex-col">
              {tiers.map((t) => (
                <button
                  key={t.id}
                  role="radio"
                  aria-checked={t.id === tierId}
                  onClick={() => setTierId(t.id)}
                  className={cn(
                    "group flex items-baseline justify-between gap-6 border-b py-3 text-left transition-colors duration-500",
                    t.id === tierId ? "border-gold text-bone" : "border-sand/20 text-sand/60 hover:text-sand",
                  )}
                >
                  <span className="font-display text-2xl sm:text-3xl">{t.name}</span>
                  <span className={cn("font-mono text-sm", t.id === tierId ? "text-gold" : "")}>{t.label}</span>
                </button>
              ))}
            </div>
            <AnimatePresence mode="wait">
              <motion.p
                key={tier.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.6, ease: film }}
                className="mt-4 max-w-[44ch] italic text-sand"
              >
                {tier.includes}
              </motion.p>
            </AnimatePresence>
          </div>

          <div className="flex flex-col gap-6">
            <label className="block">
              <span className="label flex justify-between text-sand/70">
                Enrolled cadets <span className="font-mono tracking-normal text-bone">{cadets}</span>
              </span>
              <input
                type="range"
                min={10}
                max={300}
                step={5}
                value={cadets}
                onChange={(e) => setCadets(Number(e.target.value))}
                className="mt-3 w-full accent-[#c5a059]"
              />
            </label>
            <label className="block">
              <span className="label flex justify-between text-sand/70">
                School revenue share <span className="font-mono tracking-normal text-bone">{share}%</span>
              </span>
              <input
                type="range"
                min={25}
                max={30}
                step={1}
                value={share}
                onChange={(e) => setShare(Number(e.target.value))}
                className="mt-3 w-full accent-[#c5a059]"
              />
            </label>
            <div className="grid grid-cols-2 gap-6 border-t border-sand/20 pt-6">
              <div>
                <p className="label text-[0.66rem] text-sand/70">School income / month</p>
                <p className="mt-2 font-mono text-3xl text-bone sm:text-4xl">₹{inr.format(monthly)}</p>
              </div>
              <div>
                <p className="label text-[0.66rem] text-sand/70">Payback</p>
                <p className="mt-2 font-mono text-3xl text-gold sm:text-4xl">
                  {payback.toFixed(1)} <span className="text-base text-sand">months</span>
                </p>
              </div>
            </div>
            <p className="text-xs text-dust">
              Estimate at ₹{inr.format(TUITION_PER_MONTH)} monthly tuition per cadet, before GST. Final terms in the MOU.
            </p>
          </div>
        </ProgressFade>
      </div>
    </div>
  );
}
