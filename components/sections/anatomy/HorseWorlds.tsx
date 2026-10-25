"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import type { GaitChoice, WorldId } from "@/components/horse-worlds/types";
import { gaitFor, WORLDS } from "@/components/horse-worlds/worlds";
import { asset } from "@/lib/content/asset";
import { horseWorldsCopy, worldCopy } from "@/lib/content/horse-worlds";
import { useReducedMotion } from "@/lib/motion/reduced";
import { cn } from "@/lib/utils";
import type { WorldsMode } from "./Anatomy3DHorse";
import { WorldSwitcher } from "./WorldSwitcher";

// The 3D viewer (three.js and the horse) is fetched only when this section is near the screen.
const Anatomy3DHorse = dynamic(() => import("./Anatomy3DHorse").then((mod) => mod.Anatomy3DHorse), { ssr: false });

const NO_POINTS: { id: string; name: string; title: string }[] = [];

/** Stills of each place, shown when WebGL is not available. */
const POSTERS: Record<WorldId, string> = {
  desert: asset("/images/horse-worlds/posters/desert.webp"),
  field: asset("/images/horse-worlds/posters/field.webp"),
  village: asset("/images/horse-worlds/posters/village.webp"),
};

/** How long a switch may run before the caption "Loading the scene" is shown (a normal switch takes about 1 s). */
const SLOW_SWITCH_MS = 1600;

type Props = { className?: string };

/**
 * One black Marwari in three places. The viewer is the same one the rest of the site uses; the place buttons only ask it to
 * change scene. Nothing here reacts to scrolling except fetching the viewer when it is near.
 */
export function HorseWorlds({ className }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(false);
  const reducedMotion = useReducedMotion();
  const [wanted, setWanted] = useState<WorldId>("desert");
  const [gait, setGait] = useState<GaitChoice>(WORLDS.desert.defaultGait);
  const [shown, setShown] = useState<WorldId>("desert");
  const [busy, setBusy] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  const [announce, setAnnounce] = useState("");
  const announcedFirst = useRef(false);

  useEffect(() => {
    const element = hostRef.current;
    if (!element) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setNear(true); observer.disconnect(); }
    }, { rootMargin: "200px" });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const effectiveGait = gaitFor(WORLDS[wanted], gait);
  const worlds = useMemo<WorldsMode>(
    () => ({
      world: wanted,
      gait: effectiveGait,
      gaits: WORLDS[wanted].gaits,
      onGaitSelect: setGait,
      onWorld: (w) => {
        setShown(w);
        // the first scene is not news; every later change is announced once, after the fade
        if (announcedFirst.current) setAnnounce(worldCopy[w].announce);
        announcedFirst.current = true;
      },
      onGait: setGait,
      onBusy: setBusy,
    }),
    [wanted, effectiveGait],
  );

  // A switch takes about a second. If it is still going after this long, the new place's art is still on its way (a slow
  // connection): say so, so the dim picture does not look like a fault.
  const [waiting, setWaiting] = useState(false);
  useEffect(() => {
    if (!busy) return;
    const timer = window.setTimeout(() => setWaiting(true), SLOW_SWITCH_MS);
    return () => {
      window.clearTimeout(timer);
      setWaiting(false);
    };
  }, [busy]);

  const copy = worldCopy[wanted];
  const choose = (w: WorldId) => {
    setWanted(w);
    // with no 3D view there is no fade to wait for: the still changes at once, so say so at once
    if (unavailable) {
      setShown(w);
      setAnnounce(worldCopy[w].announce);
    }
  };
  const switcher = (
    <div className="pointer-events-none absolute inset-x-0 bottom-4 z-20 flex flex-col items-center gap-3 px-4">
      {/* seen only; the switcher's aria-busy and the announcement that follows are what a screen reader gets */}
      {waiting && !unavailable && (
        <p aria-hidden className="font-mono text-xs uppercase tracking-widest text-gold">
          {horseWorldsCopy.loading}
        </p>
      )}
      <WorldSwitcher className="pointer-events-auto" value={wanted} onChange={choose} busy={busy} />
    </div>
  );

  return (
    <div ref={hostRef} className={className}>
      {reducedMotion && !unavailable && <p className="mb-4 text-sm text-sand">{horseWorldsCopy.reduced}</p>}

      <div
        data-testid="horse-worlds"
        className="tone-dark relative aspect-[4/5] w-full overflow-hidden border border-line bg-night sm:aspect-[16/9]"
      >
        {near && !unavailable ? (
          <Anatomy3DHorse
            activeId="overview"
            focusKey={0}
            points={NO_POINTS}
            onUnavailable={() => setUnavailable(true)}
            worlds={worlds}
            className="absolute inset-0 h-full w-full"
          >
            {switcher}
          </Anatomy3DHorse>
        ) : (
          <>
            {unavailable && (
              <>
                <Image
                  key={wanted}
                  src={POSTERS[wanted]}
                  alt={`${worldCopy[wanted].title}: a still of the black Marwari stallion.`}
                  fill
                  unoptimized
                  sizes="(min-width: 1024px) 90vw, 100vw"
                  className="object-cover"
                />
                <div aria-hidden className="pointer-events-none absolute inset-3 border border-line/40" />
                {switcher}
              </>
            )}
            {!unavailable && (
              <p className="absolute inset-0 grid place-items-center font-mono text-xs uppercase tracking-widest text-gold">
                {horseWorldsCopy.loading}
              </p>
            )}
          </>
        )}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-12">
        <div>
          <p className="label text-brass">{copy.label}</p>
          <h3 className="t-voice mt-2 text-display-3 text-bone">{copy.title}</h3>
          <p className="t-story mt-3 max-w-xl text-sand">{copy.caption}</p>
        </div>
        <div>
          <p className="label text-dust">{horseWorldsCopy.howTitle}</p>
          <p className="t-story mt-2 max-w-xl text-sand">{horseWorldsCopy.how}</p>
          {unavailable && <p className="mt-3 border-l border-brass pl-4 text-sm text-sand">{horseWorldsCopy.unavailable}</p>}
        </div>
      </div>

      {/* Heard, not seen: the scene has changed (after the fade), or the 3D view could not start. */}
      <p role="status" aria-live="polite" className={cn("sr-only")} data-shown={shown}>
        {announce}
      </p>
    </div>
  );
}
