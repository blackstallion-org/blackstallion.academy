"use client";

import { useTransform, motion, type MotionValue } from "motion/react";
import type { ReactNode } from "react";
import { FilmImage } from "@/components/film/FilmImage";
import { PinnedScene } from "@/components/film/PinnedScene";
import type { MediaKey } from "@/lib/content/media";

/**
 * Photographs strung on a ribbon that winds through depth as the reader scrolls
 * (our own take on the React Bits Pro "Depth Ribbon", in CSS 3D; no WebGL, no licence).
 * The frame pins; cards travel along a gentle S-curve, nearest card in focus, distant ones dim and small.
 * Reduced motion: no pin, no travel; the same frames as a captioned grid.
 */
export type RibbonFrame = { image: MediaKey; caption: string; code: string };

type DepthRibbonProps = {
  id?: string;
  frames: RibbonFrame[];
  heading: ReactNode;
  label: string;
};

function Card({ frame, i, count, progress }: { frame: RibbonFrame; i: number; count: number; progress: MotionValue<number> }) {
  // t = 0 is the card in focus; negative already passed, positive still to come.
  const t = useTransform(progress, (p) => i - p * (count - 1));
  const transform = useTransform(t, (v) => {
    const x = v * 112; // % of the card's own width, so spacing scales from phone to desktop
    const y = Math.sin(v * 0.9) * 9;
    const z = -Math.abs(v) * 260;
    const ry = -v * 14;
    return `translate3d(${x - 50}%, calc(-50% + ${y}vh), ${z}px) rotateY(${ry}deg)`;
  });
  const opacity = useTransform(t, (v) => Math.max(0, 1 - Math.abs(v) * 0.38));
  const shade = useTransform(t, (v) => Math.min(0.75, Math.abs(v) * 0.35));
  const captionOpacity = useTransform(t, (v) => Math.max(0, 1 - Math.abs(v) * 2.2));
  return (
    <motion.figure className="absolute left-1/2 top-[60%] w-[min(60vw,22rem)] will-change-transform" style={{ transform, opacity, zIndex: 100 - i }}>
      <div className="relative aspect-[3/4] overflow-hidden border border-line">
        <FilmImage name={frame.image} grade="film" sizes="(min-width: 768px) 22rem, 68vw" />
        <motion.div aria-hidden className="absolute inset-0 bg-night" style={{ opacity: shade }} />
      </div>
      <motion.figcaption className="mt-4 flex gap-4" style={{ opacity: captionOpacity }}>
        <span className="font-mono text-xs text-gold">{frame.code}</span>
        <span className="t-ui text-sm text-sand">{frame.caption}</span>
      </motion.figcaption>
    </motion.figure>
  );
}

export function DepthRibbon({ id, frames, heading, label }: DepthRibbonProps) {
  const reducedFallback = (
    <div className="gutter py-[clamp(6rem,14vh,12rem)]">
      {heading}
      <ul className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
        {frames.map((f) => (
          <li key={f.code}>
            <div className="relative aspect-[3/4] overflow-hidden border border-line">
              <FilmImage name={f.image} grade="film" sizes="(min-width: 1024px) 25vw, 50vw" />
            </div>
            <p className="mt-4 flex gap-4">
              <span className="font-mono text-xs text-gold">{f.code}</span>
              <span className="t-ui text-sm text-sand">{f.caption}</span>
            </p>
          </li>
        ))}
      </ul>
    </div>
  );

  return (
    <PinnedScene id={id} label={label} length={frames.length * 0.75 + 1} reducedFallback={reducedFallback}>
      {(progress) => (
        <div className="relative h-full overflow-hidden">
          <div className="gutter relative z-10 pt-28">{heading}</div>
          <ul className="absolute inset-0 list-none" style={{ perspective: "1400px", perspectiveOrigin: "50% 60%", transformStyle: "preserve-3d" }}>
            {frames.map((f, i) => (
              <li key={f.code} className="contents">
                <Card frame={f} i={i} count={frames.length} progress={progress} />
              </li>
            ))}
          </ul>
        </div>
      )}
    </PinnedScene>
  );
}
