"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { hotspots, instrumentNodes, layerNames, type Hotspot } from "@/lib/content/anatomy";
import { NodePanel } from "./NodePanel";
import { ease } from "@/lib/motion/tokens";
import { cn } from "@/lib/utils";
import { StudioFilm } from "./StudioFilm";

type Props = {
  /** Restrict to some hotspot ids (home uses five). */
  only?: string[];
  /** "compact": the home plate (studio film, a detail panel per point). "full": four layers. */
  mode?: "compact" | "full";
  className?: string;
};

const nodeOf = (id: string) => instrumentNodes.find((n) => n.id === id);

/**
 * S03 specimen hotspots on the studio film of a living black Marwari (StudioFilm): choosing a point moves the camera in while
 * the film keeps playing. The compact home variant opens that point's detail over the film; the full Instrument page keeps its
 * four-layer panel under the plate. The 2D "archive plate" and its switch were removed on 16 Nov 2026 (owner): film only.
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
  const points = useMemo(() => (only ? hotspots.filter((h) => only.includes(h.id)) : hotspots), [only]);
  const [activeId, setActiveId] = useState(points[0].id);
  /** A point has been chosen: the film is in close and the detail is open (otherwise the whole horse shows). */
  const [armed, setArmed] = useState(false);
  const choose = (id: string) => { setActiveId(id); setArmed(true); };
  const close = () => setArmed(false);
  const active = points.find((h) => h.id === activeId) ?? points[0];
  const compact = mode === "compact";
  const activeNode = compact ? nodeOf(active.id) : undefined;
  const nodeIndex = Math.max(0, points.findIndex((h) => h.id === active.id));
  const nameOf = (h: Hotspot) => (compact ? nodeOf(h.id)?.name : undefined) ?? h.name;
  const horsePoints = useMemo(
    () => points.map((h) => ({ id: h.id, name: nodeOf(h.id)?.name ?? h.name, title: nodeOf(h.id)?.title ?? h.title, x: h.film.x, y: h.film.y })),
    [points],
  );

  return (
    <div ref={viewportRef} className={className}>
      <div className="mb-4 flex items-center gap-2">
        <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-gold" />
        <span className="label text-[0.68rem] text-gold">Specimen plate 02 · Conformation study</span>
      </div>

      <div className="grid gap-10">
        {/* The stage has the film's own shape on a phone (so the film fills it) and is 16:9 from sm, with the film centred and its edges feathered. */}
        <div className="tone-photo relative aspect-[1440/984] w-full overflow-hidden border border-line bg-black sm:aspect-[16/9]">
          {nearViewport ? (
            <StudioFilm
              activeId={armed ? activeId : "overview"}
              points={horsePoints}
              onSelect={(id) => {
                if (id === "overview") close();
                else choose(id);
              }}
              detail={
                compact ? (
                  <NodePanel
                    node={armed && activeNode ? activeNode : null}
                    position={nodeIndex + 1}
                    total={points.length}
                    surface="overlay"
                    onClose={close}
                  />
                ) : undefined
              }
              className="absolute inset-0 h-full w-full"
            />
          ) : null}
        </div>

      {compact ? (
        <div className="grid gap-6">
          <div className="flex flex-wrap gap-2" role="group" aria-label="Choose a point">
            {points.map((h) => (
              <button
                key={h.id}
                type="button"
                onClick={() => choose(h.id)}
                aria-pressed={h.id === active.id && armed}
                className={cn(
                  "label min-h-11 border px-3 py-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold",
                  h.id === active.id && armed ? "border-gold text-gold" : "border-line text-sand",
                )}
              >
                {nameOf(h)}
              </button>
            ))}
          </div>
          {/* The film shows its detail over the stage from lg up; below that it sits here. */}
          <div aria-live="polite" className="min-h-[12rem] lg:hidden">
            {!armed ? (
              <p className="max-w-md text-sand">Choose a point on the horse, or from the list, to look closer and see what it teaches the rider.</p>
            ) : (
              <NodePanel node={activeNode ?? null} position={nodeIndex + 1} total={points.length} surface="inline" />
            )}
          </div>
        </div>
      ) : (
        <div aria-live="polite" className="min-h-[15rem]">
          <AnimatePresence mode="wait">
            <motion.div
              key={active.id}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.45, ease: ease.citadel }}
            >
              <Panel h={active} />
            </motion.div>
          </AnimatePresence>
          <div className="mt-8 flex flex-wrap gap-2" role="group" aria-label="Choose a point">
            {points.map((h) => (
              <button
                key={h.id}
                type="button"
                onClick={() => choose(h.id)}
                aria-pressed={h.id === active.id}
                className={cn("label border px-3 py-2", h.id === active.id ? "border-gold text-gold" : "border-line text-sand")}
              >
                {h.name}
              </button>
            ))}
          </div>
        </div>
      )}
      </div>
    </div>
  );
}

function Panel({ h }: { h: Hotspot }) {
  return (
    <div>
      <p className="label text-brass">{h.name}</p>
      <h3 className="t-voice mt-2 text-display-3 text-bone">{h.title}</h3>
      <p className="font-mono mt-3 text-[0.68rem] tracking-[0.12em] text-copper">
        {h.metric}
      </p>
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
    </div>
  );
}
