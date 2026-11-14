"use client";

import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import Image from "next/image";
import { FilmImage } from "@/components/film/FilmImage";
import { asset } from "@/lib/content/asset";
import { setAmbience, setMusicWanted, startMusic, stopMusic } from "@/lib/audio/mixer";
import { fleetWorlds, type FleetWorldId } from "@/lib/content/fleet";
import { cn } from "@/lib/utils";

/**
 * The /fleet opening. A cut-out photograph of the academy's black Marwari, turned to face left (`stallion-facing-left.webp`),
 * stands in front of one of three illustrated manuscript worlds: a royal battlefield, a Marwar village, and equestrian grounds.
 * A button changes the plate (a cross-fade) and the location sound together. The 3D model that stood here is no longer used on
 * this page.
 *
 * Sound: the world's ambience plays only while the scene is on screen, only once the visitor has turned sound on (the mixer creates
 * nothing before a gesture), and is stopped when the scene scrolls away or the page is left, so it never doubles up.
 */

const HORSE = asset("/images/fleet/stallion-facing-left.webp");

export type FleetSound = "theme" | "house" | "none";

/** Applies the reel's sound choice through the shared mixer. Browsers only start audio after a visitor gesture, so a scroll-in can be blocked. */
function playFor(sound: FleetSound, world: FleetWorldId, gesture: boolean) {
  if (sound === "theme") {
    void setAmbience(null);
    if (gesture) void startMusic();
    return;
  }
  if (sound === "house") {
    setMusicWanted(true);
    stopMusic(true);
    void setAmbience(world);
    return;
  }
  void setAmbience(null);
  stopMusic(true);
}

export function FleetWorlds({ children }: { children?: ReactNode }) {
  const soundRef = useRef<FleetSound>("theme");
  const [world, setWorld] = useState<FleetWorldId>(fleetWorlds[0].id);
  const section = useRef<HTMLDivElement>(null);
  const onScreen = useRef(false);
  const worldRef = useRef(world);
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);

  // the location sound follows the world while the scene is on screen
  useEffect(() => {
    const el = section.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => {
      const on = e.isIntersecting && e.intersectionRatio >= 0.35;
      if (on === onScreen.current) return;
      onScreen.current = on;
      if (on) playFor(soundRef.current, worldRef.current, false);
      else void setAmbience(null);
    }, { threshold: [0, 0.35] });
    io.observe(el);
    return () => { io.disconnect(); onScreen.current = false; void setAmbience(null); };
  }, []);

  const choose = (id: FleetWorldId) => {
    if (id === worldRef.current) return;
    worldRef.current = id;
    setWorld(id);
    if (onScreen.current && soundRef.current === "house") void setAmbience(id);
  };

  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const i = fleetWorlds.findIndex((w) => w.id === world);
    const step = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
    if (!step) return;
    e.preventDefault();
    const next = fleetWorlds[(i + step + fleetWorlds.length) % fleetWorlds.length];
    choose(next.id);
    buttons.current[fleetWorlds.indexOf(next)]?.focus();
  };

  const active = fleetWorlds.find((w) => w.id === world) ?? fleetWorlds[0];

  return (
    <div ref={section} className="relative min-h-[100svh] max-sm:min-h-[54rem]">
      {/* the three plates, cross-faded */}
      <div className="absolute inset-0">
        {fleetWorlds.map((w, i) => (
          <div key={w.id} aria-hidden={w.id !== world} className={cn("absolute inset-0 transition-opacity duration-[900ms] ease-out motion-reduce:transition-none", w.id === world ? "opacity-100" : "opacity-0")}>
            <FilmImage name={w.image} priority={i === 0} grade="none" sizes="100vw" />
          </div>
        ))}
      </div>
      {/* scrims that hold the copy: left on wide screens, top and bottom on phones */}
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgb(14_10_8/0.86)_0%,rgb(14_10_8/0.6)_26%,rgb(14_10_8/0)_44%,rgb(14_10_8/0)_58%,rgb(14_10_8/0.55)_70%,rgb(14_10_8/0.92)_100%)] sm:bg-[linear-gradient(90deg,rgb(14_10_8/0.62)_0%,rgb(14_10_8/0.32)_30%,rgb(14_10_8/0)_52%),linear-gradient(0deg,rgb(14_10_8/0.55)_0%,rgb(14_10_8/0)_30%)]" />

      {/* the stallion: hooves on the line at 90% of the stage (wide) or 65.5% (phones), about 58% / 28% of the stage tall */}
      <div
        role="img"
        aria-label={`The academy's black Marwari stallion standing in the scene: ${active.title.replace(/\.$/, "")}`}
        className="pointer-events-none absolute left-1/2 bottom-[34.5%] aspect-[3/2] h-[28.7%] -translate-x-1/2 sm:left-[66%] sm:bottom-[10%] sm:h-[59.4%]"
      >
        {/* the ground shadow under the hooves, behind the horse */}
        <span
          aria-hidden
          className="absolute bottom-[-1.5%] left-[12%] h-[9%] w-[76%] rounded-[50%] bg-[radial-gradient(closest-side,rgb(0_0_0/0.6),rgb(0_0_0/0.25)_60%,transparent)] blur-[2px]"
        />
        <Image
          src={HORSE}
          alt=""
          fill
          sizes="(min-width: 640px) 60vw, 90vw"
          className="object-contain brightness-110 contrast-105"
        />
        {/* warm light from the left, held to the horse's own outline: the cut-out is the mask */}
        <span
          aria-hidden
          className="absolute inset-0 mix-blend-soft-light"
          style={{
            backgroundImage: "linear-gradient(90deg, rgb(255 205 140 / 0.9) 0%, rgb(255 205 140 / 0.35) 40%, rgb(255 205 140 / 0) 75%)",
            maskImage: `url(${HORSE})`,
            WebkitMaskImage: `url(${HORSE})`,
            maskSize: "100% 100%",
            WebkitMaskSize: "100% 100%",
          }}
        />
      </div>

      <div className="gutter relative z-10 flex min-h-[100svh] flex-col justify-between pb-10 pt-24 max-sm:min-h-[54rem] sm:pb-14 md:pt-32">
        <div className="max-w-[40rem]">{children}</div>

        <div className="self-start">
          <div role="radiogroup" aria-label="Scene" onKeyDown={onKey} className="flex flex-wrap gap-3">
            {fleetWorlds.map((w, i) => (
              <button
                key={w.id}
                ref={(el) => { buttons.current[i] = el; }}
                type="button"
                role="radio"
                aria-checked={w.id === world}
                tabIndex={w.id === world ? 0 : -1}
                onClick={() => choose(w.id)}
                className={cn(
                  "label min-h-11 border-2 px-6 py-2.5 shadow-[inset_0_0_0_3px_rgb(14_10_8/0.55),0_6px_18px_rgb(0_0_0/0.45)] backdrop-blur-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold",
                  w.id === world ? "border-gold bg-[rgb(60_32_12/0.82)] text-gold" : "border-brass/60 bg-[rgb(14_10_8/0.62)] text-sand hover:border-gold hover:text-bone",
                )}
              >
                {w.label}
              </button>
            ))}
          </div>
          <p aria-live="polite" className="sr-only">{active.title}</p>
        </div>
      </div>
    </div>
  );
}
