"use client";

import { motion, useTransform, type MotionValue } from "motion/react";
import type { ReactNode } from "react";
import { FilmImage } from "@/components/film/FilmImage";
import { PinnedScene } from "@/components/film/PinnedScene";
import { r } from "@/components/film/range";
import type { MediaKey } from "@/lib/content/media";
import { ease } from "@/lib/motion/tokens";

type PortalRevealProps = {
  id?: string;
  label: string;
  /** The landscape the aperture opens in. Composed with a clear centre. */
  outer: MediaKey;
  /** What lies through the aperture: the page's own subject. */
  inner: MediaKey;
  /** Title copy, shown while the aperture is small (bottom-left). */
  title: ReactNode;
  /** Arrival copy, shown once the aperture has swallowed the screen. */
  arrival: ReactNode;
  /** Scroll length in screens (pinned for length - 1). Keep it short. */
  length?: number;
};

/** Aperture radius in vmax: a small window at rest, larger than the screen's half-diagonal at the end. */
const R_START = 11;
const R_END = 86;
/** Vertical centre of the aperture (%), above the title so the ring never crosses the copy. */
const CENTER_Y = 40;

/**
 * Signature move for the curriculum: a glowing antique-brass aperture in a desert landscape.
 * Scrolling pushes the camera toward the centre while the aperture widens until the scene
 * through it fills the screen; then the pin releases into the page.
 *
 * Built on PinnedScene (sticky frame + scroll progress); clip-path + transform only, no WebGL.
 * Reduced motion: no pin, no zoom: a still frame with the aperture half-open and both texts visible.
 */
export function PortalReveal({ id, label, outer, inner, title, arrival, length = 2.3 }: PortalRevealProps) {
  return (
    <PinnedScene
      id={id}
      length={length}
      label={label}
      className="tone-dark bg-night"
      reducedFallback={<PortalStill outer={outer} inner={inner} title={title} arrival={arrival} />}
    >
      {(p) => <PortalFrame progress={p} outer={outer} inner={inner} title={title} arrival={arrival} />}
    </PinnedScene>
  );
}

function PortalFrame({ progress, outer, inner, title, arrival }: { progress: MotionValue<number> } & Pick<PortalRevealProps, "outer" | "inner" | "title" | "arrival">) {
  const radius = useTransform(progress, r(0.04, 0.78), [R_START, R_END]);
  const clip = useTransform(radius, (v) => `circle(${v}vmax at 50% ${CENTER_Y}%)`);
  const ringSize = useTransform(radius, (v) => `${v * 2}vmax`);
  const ringOpacity = useTransform(progress, r(0, 0.55, 0.78), [1, 0.85, 0]);
  const outerScale = useTransform(progress, r(0, 0.8), [1, 1.55]);
  const innerScale = useTransform(progress, r(0, 0.85), [1.35, 1]);
  const titleOpacity = useTransform(progress, r(0, 0.22), [1, 0]);
  const titleY = useTransform(progress, r(0, 0.22), ["0%", "-18%"]);
  const arrivalOpacity = useTransform(progress, r(0.66, 0.84), [0, 1]);
  const arrivalY = useTransform(progress, r(0.66, 0.84), [24, 0]);

  return (
    <div className="relative h-full w-full">
      <FilmImage name={outer} priority scale={outerScale} grade="film" />
      <div aria-hidden className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_40%,transparent_18%,rgb(23_21_19/0.55)_70%,rgb(23_21_19/0.9)_100%)]" />

      {/* Through the aperture */}
      <motion.div className="absolute inset-0" style={{ clipPath: clip }}>
        <FilmImage name={inner} scale={innerScale} grade="film" />
        <div aria-hidden className="absolute inset-0 shade-b opacity-80" />
      </motion.div>

      {/* The brass ring, lit from within */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[40%] aspect-square -translate-x-1/2 -translate-y-1/2 rounded-full border border-antique/80 shadow-[0_0_60px_rgb(201_166_107/0.35),inset_0_0_40px_rgb(201_166_107/0.25)]"
        style={{ width: ringSize, opacity: ringOpacity }}
      >
        <motion.span
          className="absolute -inset-3 rounded-full border border-antique/25"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 2.2, ease: ease.citadel, delay: 0.3 }}
        />
      </motion.div>

      <motion.div className="gutter absolute inset-x-0 bottom-0 pb-[max(10vh,env(safe-area-inset-bottom))]" style={{ opacity: titleOpacity, y: titleY }}>
        {title}
      </motion.div>

      <motion.div className="gutter absolute inset-0 flex flex-col items-center justify-center text-center" style={{ opacity: arrivalOpacity, y: arrivalY }}>
        {arrival}
      </motion.div>
    </div>
  );
}

function PortalStill({ outer, inner, title, arrival }: Pick<PortalRevealProps, "outer" | "inner" | "title" | "arrival">) {
  return (
    <div className="relative min-h-[100svh] w-full overflow-hidden">
      <FilmImage name={outer} priority grade="film" />
      <div aria-hidden className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_40%,transparent_18%,rgb(23_21_19/0.6)_70%,rgb(23_21_19/0.92)_100%)]" />
      <div className="absolute inset-0" style={{ clipPath: "circle(24vmax at 50% 40%)" }}>
        <FilmImage name={inner} grade="film" />
      </div>
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[40%] aspect-square w-[48vmax] -translate-x-1/2 -translate-y-1/2 rounded-full border border-antique/80 shadow-[0_0_60px_rgb(201_166_107/0.35)]"
      />
      <div className="gutter relative flex min-h-[100svh] flex-col justify-end gap-10 pb-[10vh]">
        {title}
        <div className="text-left">{arrival}</div>
      </div>
    </div>
  );
}
