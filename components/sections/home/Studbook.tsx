"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { FilmImage } from "@/components/film/FilmImage";
import { HomeHeadline as Headline } from "./HomeTypography";
import { Cta, Label, StatusDot } from "@/components/film/Marks";
import { fleet, FLEET_TOTAL, statusLabel } from "@/lib/content/fleet";
import { studbook } from "@/lib/content/home";
import { ease } from "@/lib/motion/tokens";
import { cn } from "@/lib/utils";

/**
 * §8 Fleet preview · S08 studbook hover list.
 * Signature: hovering a name brings its portrait up out of the dark and slides in its registry plate.
 */
export function Studbook() {
  const [i, setI] = useState(0);
  const h = fleet[i];

  return (
    <section aria-labelledby="studbook-h" className="relative py-[clamp(6rem,14vh,12rem)]">
      <div className="gutter">
        <Label reel={6}>The Studbook</Label>
        <Headline id="studbook-h" className="mt-4" inscription={studbook.inscription} voice={studbook.voice} />
      </div>

      <div className="gutter mt-12 grid gap-10 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <ol className="border-t border-line">
          {fleet.map((s, k) => (
            <li key={s.id}>
              <button
                type="button"
                onMouseEnter={() => setI(k)}
                onFocus={() => setI(k)}
                onClick={() => setI(k)}
                aria-pressed={i === k}
                className="group grid w-full grid-cols-[2.5rem_1fr_auto] items-baseline gap-3 border-b border-line py-4 text-left md:py-5"
              >
                <span className="font-mono text-xs text-dust">{String(k + 1).padStart(2, "0")}</span>
                <span
                  className={cn(
                    "t-voice text-[clamp(1.8rem,4.6vw,4rem)] leading-none transition-colors duration-500",
                    i === k ? "text-gold" : "text-bone/80 group-hover:text-bone",
                  )}
                >
                  {s.name}
                </span>
                <span className="label hidden items-center gap-2 text-dust sm:flex">
                  <StatusDot status={s.status} />
                  {statusLabel[s.status]}
                </span>
              </button>
            </li>
          ))}
          <li className="t-story py-5 italic text-dust">and {FLEET_TOTAL - fleet.length} more in the registry.</li>
        </ol>

        <div className="lg:sticky motion-reduce:lg:static lg:top-24 lg:self-start">
          <div className="relative aspect-[4/5] w-full overflow-hidden bg-night">
            <AnimatePresence mode="popLayout">
              <motion.div
                key={h.id}
                className="absolute inset-0"
                initial={{ opacity: 0, scale: 1.05 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.9, ease: ease.citadel }}
              >
                <FilmImage name={h.image} sizes="(min-width: 1024px) 40vw, 100vw" />
              </motion.div>
            </AnimatePresence>
            <div aria-hidden className="absolute inset-0 shade-b" />
            <AnimatePresence mode="wait">
              <motion.dl
                key={h.id}
                className="plate absolute inset-x-4 bottom-4 grid grid-cols-2 gap-x-6 gap-y-3 p-5 md:inset-x-6 md:bottom-6"
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.5, ease: ease.citadel, delay: 0.15 }}
              >
                <div className="col-span-2 flex items-center justify-between">
                  <dt className="sr-only">Name</dt>
                  <dd className="t-voice text-2xl text-bone">{h.name}</dd>
                  <dd className="label flex items-center gap-2 text-sand">
                    <StatusDot status={h.status} />
                    {statusLabel[h.status]}
                  </dd>
                </div>
                <div>
                  <dt className="label text-dust">Breed</dt>
                  <dd className="t-ui text-sm text-sand">{h.breed}</dd>
                </div>
                <div>
                  <dt className="label text-dust">Coat</dt>
                  <dd className="t-ui text-sm text-sand">{h.coat}</dd>
                </div>
                <div>
                  <dt className="label text-dust">Microchip (ISO)</dt>
                  <dd className="font-mono text-xs text-gold">{h.chip}</dd>
                </div>
                <div>
                  <dt className="label text-dust">Height</dt>
                  <dd className="font-mono text-xs text-gold">{h.hands} hh</dd>
                </div>
              </motion.dl>
            </AnimatePresence>
          </div>
          <div className="mt-8">
            <Cta href="/fleet">Open the studbook</Cta>
          </div>
        </div>
      </div>
    </section>
  );
}
