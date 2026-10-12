"use client";

import { motion, useMotionValueEvent, useTransform, type MotionValue } from "motion/react";
import { useState, type ReactNode } from "react";
import { FilmImage } from "@/components/film/FilmImage";
import { PinnedScene } from "@/components/film/PinnedScene";
import { r } from "@/components/film/range";
import type { MediaKey } from "@/lib/content/media";
import { cn } from "@/lib/utils";

export type StackScene = {
  id: string;
  image: MediaKey;
  position?: string;
  /** Optional foreground layer (a dust still shot on black, screen-blended) that travels faster. */
  layer?: MediaKey;
  content: ReactNode;
};

type ParallaxStackProps = {
  id?: string;
  label: string;
  scenes: StackScene[];
};

/**
 * Signature move for an individual hub: full-screen scenes stacked like cards.
 * The first scene holds while the next rises over it; the one underneath sinks back, shrinks a touch
 * and dims, and its picture drifts slower than its card, so the stack reads as depth.
 * When the last card lands the pin releases into the page.
 *
 * Built on PinnedScene, so the scroll is measured on a plain (non-sticky) section.
 * Reduced motion: the scenes simply follow one another, no pin, scaling or parallax.
 */
export function ParallaxStack({ id, label, scenes }: ParallaxStackProps) {
  return (
    <PinnedScene
      id={id}
      length={scenes.length}
      label={label}
      className="tone-dark bg-night"
      reducedFallback={
        <div>
          {scenes.map((s, i) => (
            <SceneBody key={s.id} scene={s} priority={i === 0} className="relative min-h-[100svh]" />
          ))}
        </div>
      }
    >
      {(p) => <Stack progress={p} scenes={scenes} stackId={id} />}
    </PinnedScene>
  );
}

function Stack({ progress, scenes, stackId }: { progress: MotionValue<number>; scenes: StackScene[]; stackId?: string }) {
  const [front, setFront] = useState(0);
  const steps = Math.max(1, scenes.length - 1);
  useMotionValueEvent(progress, "change", (v) => setFront(Math.min(scenes.length - 1, Math.floor(v * steps + 0.35))));
  // Keyboard and screen-reader users reach a card before it has risen: bring it up instead of hiding it.
  const reveal = (index: number) => {
    const section = stackId ? document.getElementById(stackId) : null;
    if (!section || index <= front) return;
    const top = section.getBoundingClientRect().top + window.scrollY;
    const travel = section.offsetHeight - window.innerHeight;
    window.scrollTo({ top: top + (index / steps) * travel, behavior: "instant" });
  };
  return (
    <div className="relative h-full w-full">
      {scenes.map((s, i) => (
        <Card key={s.id} scene={s} index={i} steps={steps} progress={progress} last={i === scenes.length - 1} onFocusWithin={() => reveal(i)} />
      ))}
    </div>
  );
}

function Card({
  scene,
  index,
  steps,
  progress,
  last,
  onFocusWithin,
}: {
  scene: StackScene;
  index: number;
  steps: number;
  progress: MotionValue<number>;
  last: boolean;
  onFocusWithin: () => void;
}) {
  // Rise: this card travels up from below while the previous one is on top.
  const riseFrom = (index - 1) / steps;
  const riseTo = index / steps;
  const y = useTransform(progress, r(riseFrom, riseTo), ["100%", "0%"]);
  const imageY = useTransform(progress, r(riseFrom, riseTo), ["-18%", "0%"]);
  const layerY = useTransform(progress, r(riseFrom, riseTo + 0.5 / steps), ["40%", "-10%"]);
  // Sink: while the next card rises over this one (never for the last card).
  const sinkFrom = index / steps;
  const sinkTo = (index + 1) / steps;
  const scale = useTransform(progress, r(sinkFrom, sinkTo), [1, 0.9]);
  const dim = useTransform(progress, r(sinkFrom, sinkTo), [0, 0.7]);
  const sinkImageY = useTransform(progress, r(sinkFrom, sinkTo), ["0%", "8%"]);

  return (
    <motion.div
      className="absolute inset-0 overflow-hidden"
      style={{ y: index === 0 ? 0 : y, zIndex: index + 1 }}
      onFocusCapture={onFocusWithin}
    >
      <motion.div className="absolute inset-0 origin-top" style={last ? undefined : { scale }}>
        <SceneBody scene={scene} priority={index === 0} imageY={index === 0 ? sinkImageY : imageY} layerY={layerY} />
        {!last && <motion.div aria-hidden className="pointer-events-none absolute inset-0 bg-black" style={{ opacity: dim }} />}
      </motion.div>
      {index > 0 && <div aria-hidden className="absolute inset-x-0 top-0 h-px bg-antique/60 shadow-[0_-18px_40px_rgb(0_0_0/0.6)]" />}
    </motion.div>
  );
}

function SceneBody({
  scene,
  priority,
  imageY,
  layerY,
  className,
}: {
  scene: StackScene;
  priority?: boolean;
  imageY?: MotionValue<string>;
  layerY?: MotionValue<string>;
  className?: string;
}) {
  return (
    <div className={cn("absolute inset-0 overflow-hidden", className)}>
      <motion.div className="absolute -inset-y-[12%] inset-x-0" style={imageY ? { y: imageY } : undefined}>
        <FilmImage name={scene.image} priority={priority} grade="deep" position={scene.position} />
      </motion.div>
      {scene.layer && (
        <motion.div aria-hidden className="absolute inset-0" style={layerY ? { y: layerY } : undefined}>
          <FilmImage name={scene.layer} blend="screen" grade="none" className="opacity-50" />
        </motion.div>
      )}
      <div aria-hidden className="absolute inset-x-0 top-0 h-44 bg-gradient-to-b from-night/70 to-transparent" />
      <div aria-hidden className="absolute inset-0 shade-b" />
      <div className="gutter relative flex h-full min-h-[inherit] flex-col justify-end pb-[max(3rem,env(safe-area-inset-bottom))] pt-24 md:pb-[9vh]">
        {scene.content}
      </div>
    </div>
  );
}
