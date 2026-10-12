"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { FilmImage } from "@/components/film/FilmImage";
import { hotspots, layerNames, type Hotspot } from "@/lib/content/anatomy";
import { ease } from "@/lib/motion/tokens";
import { cn } from "@/lib/utils";

type Props = {
  /** Restrict to some hotspot ids (home uses five). */
  only?: string[];
  /** "compact": one line + what it trains. "full": four layers. */
  mode?: "compact" | "full";
  className?: string;
};

/**
 * S03 specimen hotspots. The photograph is a museum plate; each point pulses
 * at a resting heart rate and opens a panel joined by a drawn leader line.
 */
export function SpecimenPlate({ only, mode = "compact", className }: Props) {
  const points = only ? hotspots.filter((h) => only.includes(h.id)) : hotspots;
  const [activeId, setActiveId] = useState(points[0].id);
  const active = points.find((h) => h.id === activeId) ?? points[0];

  return (
    <div
      className={cn(
        "grid gap-8 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)] lg:items-center",
        className,
      )}
    >
      <div className="tone-dark relative aspect-[16/9] w-full overflow-hidden border border-line bg-night">
        <FilmImage
          name="anatomyProfile"
          sizes="(min-width: 1024px) 62vw, 100vw"
          className="bg-none"
        />
        <div
          aria-hidden
          className="cinematic-vignette absolute inset-0 opacity-70"
        />
        {/* Plate rulings */}
        <div aria-hidden className="absolute inset-3 border border-line" />
        <p className="font-mono absolute bottom-4 left-5 text-[0.6rem] tracking-[0.14em] text-dust">
          PLATE 02 · MARWARI · 15.2 HH
        </p>
        <svg
          aria-hidden
          className="pointer-events-none absolute inset-0 h-full w-full"
          viewBox="0 0 100 56.25"
          preserveAspectRatio="none"
        >
          <motion.line
            key={active.id}
            x1={active.x}
            y1={active.y * 0.5625}
            x2={active.x < 60 ? active.x + 14 : active.x - 14}
            y2={active.y * 0.5625 - 8}
            stroke="var(--color-gold)"
            strokeWidth="0.15"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.6, ease: ease.citadel }}
          />
        </svg>
        <ul>
          {points.map((h) => (
            <li
              key={h.id}
              className="absolute"
              style={{ left: `${h.x}%`, top: `${h.y}%` }}
            >
              <button
                type="button"
                onClick={() => setActiveId(h.id)}
                onMouseEnter={() => setActiveId(h.id)}
                onFocus={() => setActiveId(h.id)}
                aria-pressed={h.id === active.id}
                aria-label={`${h.name}: ${h.title}`}
                className="group relative -ml-5 -mt-5 grid h-10 w-10 place-items-center"
              >
                <span
                  className={cn(
                    "absolute h-4 w-4 rounded-full border border-gold animate-pulse-ring",
                    h.id === active.id ? "opacity-100" : "opacity-50",
                  )}
                  style={{ animationDuration: "1.4s" }}
                />
                <span
                  className={cn(
                    "relative h-2.5 w-2.5 rounded-full transition-colors",
                    h.id === active.id
                      ? "bg-gold"
                      : "bg-bone/70 group-hover:bg-gold",
                  )}
                />
                <span
                  className={cn(
                    "label pointer-events-none absolute top-9 whitespace-nowrap text-[0.6rem] transition-opacity",
                    h.id === active.id
                      ? "text-gold opacity-100"
                      : "text-sand opacity-0 group-hover:opacity-100 md:opacity-70",
                  )}
                >
                  {h.name}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div aria-live="polite" className="min-h-[15rem]">
        <AnimatePresence mode="wait">
          <motion.div
            key={active.id}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.45, ease: ease.citadel }}
          >
            <Panel h={active} mode={mode} />
          </motion.div>
        </AnimatePresence>
        <div
          className="mt-8 flex flex-wrap gap-2 lg:hidden"
          role="group"
          aria-label="Choose a point"
        >
          {points.map((h) => (
            <button
              key={h.id}
              type="button"
              onClick={() => setActiveId(h.id)}
              aria-pressed={h.id === active.id}
              className={cn(
                "label border px-3 py-2",
                h.id === active.id
                  ? "border-gold text-gold"
                  : "border-line text-sand",
              )}
            >
              {h.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function Panel({ h, mode }: { h: Hotspot; mode: "compact" | "full" }) {
  return (
    <div>
      <p className="label text-brass">{h.name}</p>
      <h3 className="t-voice mt-2 text-display-3 text-bone">{h.title}</h3>
      <p className="font-mono mt-3 text-[0.68rem] tracking-[0.12em] text-copper">
        {h.metric}
      </p>
      {mode === "compact" ? (
        <>
          <p className="mt-4 text-lede text-sand">{h.short}</p>
          <p className="label mt-6 text-dust">
            Trains <span className="ml-2 text-gold">{h.trains}</span>
          </p>
        </>
      ) : (
        <>
          <p className="label mt-4 text-dust">
            Trait <span className="ml-2 text-gold">{h.trains}</span>
          </p>
          <dl className="mt-6 divide-y divide-line/15 border-y border-line">
            {layerNames.map((l) => (
              <div
                key={l.key}
                className="grid gap-1 py-4 sm:grid-cols-[9rem_1fr] sm:gap-6"
              >
                <dt className="label pt-1 text-dust">{l.label}</dt>
                <dd
                  className={
                    l.key === "builds"
                      ? "t-voice text-xl text-gold"
                      : "text-sand"
                  }
                >
                  {h.layers[l.key]}
                </dd>
              </div>
            ))}
          </dl>
        </>
      )}
    </div>
  );
}
