"use client";

import { ScrollRevealText } from "@/components/motion/ScrollRevealText";

import dynamic from "next/dynamic";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { FilmImage } from "@/components/film/FilmImage";
import { hotspots, layerNames, type Hotspot } from "@/lib/content/anatomy";
import { ease } from "@/lib/motion/tokens";
import { cn } from "@/lib/utils";
import { useReducedMotion } from "@/lib/motion/reduced";

const Anatomy3DHorse = dynamic(
  () => import("./Anatomy3DHorse").then((mod) => mod.Anatomy3DHorse),
  { ssr: false }
);

type Props = {
  /** Restrict to some hotspot ids (home uses five). */
  only?: string[];
  /** "compact": one line + what it trains. "full": four layers. */
  mode?: "compact" | "full";
  className?: string;
};

/**
 * S03 specimen hotspots. The compact home variant retains its interactive
 * horse; the full Instrument page is intentionally the quieter archive plate.
 */
export function SpecimenPlate({ only, mode = "compact", className }: Props) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [nearViewport, setNearViewport] = useState(false);
  useEffect(() => {
    const element = viewportRef.current;
    if (!element) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setNearViewport(true); observer.disconnect(); }
    }, { rootMargin: "200px" });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  const points = only ? hotspots.filter((h) => only.includes(h.id)) : hotspots;
  const [activeId, setActiveId] = useState(points[0].id);
  const [focusKey, setFocusKey] = useState(0);
  const choose = (id: string) => { setActiveId(id); setFocusKey((k) => k + 1); };
  const reducedMotion = useReducedMotion();
  const [requestedMode, setViewMode] = useState<"3d" | "2d" | null>(null);
  const [fallbackMessage, setFallbackMessage] = useState<string | null>(null);
  const hasLivingModel = mode === "compact";
  const viewMode = hasLivingModel ? (requestedMode ?? (reducedMotion ? "2d" : "3d")) : "2d";
  const active = points.find((h) => h.id === activeId) ?? points[0];

  return (
    <div ref={viewportRef} className={className}>
      {/* Mode Switcher Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-gold shadow-[0_0_8px_var(--color-gold)]" />
          <span className="font-mono text-[0.68rem] uppercase tracking-[0.2em] text-gold">
            Specimen Plate 02 · Conformation Study
          </span>
        </div>

        {hasLivingModel && <div className="flex items-center gap-1.5 rounded-full border border-line bg-night/85 p-1 backdrop-blur-md">
          <button
            type="button"
            aria-pressed={viewMode === "3d"}
            onClick={() => { setFallbackMessage(null); setViewMode("3d"); }}
            className={cn(
              "rounded-full px-3.5 py-1 font-mono text-[0.62rem] uppercase tracking-wider transition-all",
              viewMode === "3d"
                ? "bg-gold text-night font-bold shadow-[0_0_12px_rgba(201,166,107,0.4)]"
                : "text-sand hover:text-gold"
            )}
          >
            3D Living Model
          </button>
          <button
            type="button"
            aria-pressed={viewMode === "2d"}
            onClick={() => setViewMode("2d")}
            className={cn(
              "rounded-full px-3.5 py-1 font-mono text-[0.62rem] uppercase tracking-wider transition-all",
              viewMode === "2d"
                ? "bg-gold text-night font-bold shadow-[0_0_12px_rgba(201,166,107,0.4)]"
                : "text-sand hover:text-gold"
            )}
          >
            2D Archive Plate
          </button>
        </div>}
      </div>

      {hasLivingModel && fallbackMessage && <p role="status" className="mb-4 border-l border-brass pl-4 text-sm text-sand">{fallbackMessage}</p>}
      {hasLivingModel && reducedMotion && !fallbackMessage && <p className="mb-4 text-sm text-sand">Motion reduced. Explore the archive plate or choose a still 3D view.</p>}

      <div
        className="grid gap-10"
      >
        <div className="tone-dark relative aspect-[4/3] sm:aspect-[16/9] w-full overflow-hidden border border-line bg-night">
          {viewMode === "3d" && nearViewport ? (
            <Anatomy3DHorse
              activeId={activeId}
              focusKey={focusKey}
              points={points}
              onUnavailable={(message) => { setFallbackMessage(message); setViewMode("2d"); }}
              onSelectHotspot={(id) => {
                if (id !== "overview") choose(id);
              }}
              className="absolute inset-0 h-full w-full"
            />
          ) : (
            <>
              <FilmImage
                name="anatomyProfile"
                sizes="(min-width: 1024px) 62vw, 100vw"
                grade="none"
                className="bg-none"
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
            </>
          )}
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
          className="mt-8 flex flex-wrap gap-2"
          role="group"
          aria-label="Choose a point"
        >
          {points.map((h) => (
            <button
              key={h.id}
              type="button"
              onClick={() => choose(h.id)}
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
          <ScrollRevealText className="mt-4 text-lede text-sand">{h.short}</ScrollRevealText>
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
