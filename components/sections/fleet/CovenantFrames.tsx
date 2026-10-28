"use client";

import { motion, useTransform, type MotionValue } from "motion/react";
import { FilmImage } from "@/components/film/FilmImage";
import { PinnedScene } from "@/components/film/PinnedScene";
import { r } from "@/components/film/range";
import { Reveal } from "@/components/film/Reveal";
import { covenant, type CovenantFrame } from "@/lib/content/covenant";

const FRAMES = covenant.frames;
const N = FRAMES.length;
/** How much of a frame's neighbour it dissolves into, in scene progress. */
const FADE = 0.045;

const HELD_FOOT = "linear-gradient(to top, color-mix(in srgb, var(--color-night) 82%, transparent), transparent 42%)";
const VIGNETTE = "radial-gradient(ellipse at 50% 42%, transparent 48%, color-mix(in srgb, var(--color-night) 62%, transparent) 100%)";

/**
 * The Covenant: four close shots of a cadet and a stallion, each held for about a screen of scroll with a slow push-in, one short
 * line apiece. Scroll does all the work; there is no copy to read. Reduced motion: no pinning, the four stills one under the other.
 */
export function CovenantFrames() {
  return (
    <div data-parallax-skip className="tone-dark relative bg-night">
      <PinnedScene
        id="covenant"
        label={covenant.region}
        length={N + 0.6}
        frameClassName="bg-night"
        reducedFallback={<Stacked />}
      >
        {(progress) => (
          <>
            {FRAMES.map((f, i) => (
              <Shot key={f.image} frame={f} i={i} progress={progress} />
            ))}
            <Dust progress={progress} />
            <div aria-hidden className="pointer-events-none absolute inset-0" style={{ background: VIGNETTE }} />
            <div aria-hidden className="pointer-events-none absolute inset-0" style={{ background: HELD_FOOT }} />

            {/* One line at the foot, and a rail of four hairlines. Nothing sits in the top 80 px (the fixed nav). */}
            <div className="gutter absolute inset-x-0 bottom-0 flex items-end justify-between gap-6 pb-[max(2.25rem,6vh)]">
              <div className="relative h-[5.5rem] min-w-0 flex-1 md:h-[6.5rem]">
                {FRAMES.map((f, i) => (
                  <Caption key={f.image} frame={f} i={i} progress={progress} />
                ))}
              </div>
              <div aria-hidden className="flex shrink-0 items-center gap-2 pb-2">
                {FRAMES.map((f, i) => (
                  <Tick key={f.image} i={i} progress={progress} />
                ))}
              </div>
            </div>
          </>
        )}
      </PinnedScene>
    </div>
  );
}

function Shot({ frame, i, progress }: { frame: CovenantFrame; i: number; progress: MotionValue<number> }) {
  const start = i / N;
  const end = (i + 1) / N;
  const opacity = useTransform(progress, r(start - FADE, start + 0.015, end - 0.015, end + FADE), [i === 0 ? 1 : 0, 1, 1, i === N - 1 ? 1 : 0]);
  const span = r(start - FADE, end + FADE);
  const scale = useTransform(progress, span, [1.04, 1.15]);
  const x = useTransform(progress, span, ["0%", `${frame.drift.x}%`]);
  const y = useTransform(progress, span, ["0%", `${frame.drift.y}%`]);
  return <FilmImage name={frame.image} grade="none" sizes="100vw" opacity={opacity} scale={scale} x={x} y={y} bleed />;
}

/** A thin drift of dust across the whole sequence, so the stills read as one continuous breath of air. */
function Dust({ progress }: { progress: MotionValue<number> }) {
  const x = useTransform(progress, [0, 1], ["7%", "-7%"]);
  return <FilmImage name="dustPlume" blend="screen" opacity={0.09} x={x} scale={1.12} bleed sizes="100vw" />;
}

function Caption({ frame, i, progress }: { frame: CovenantFrame; i: number; progress: MotionValue<number> }) {
  const start = i / N;
  const end = (i + 1) / N;
  const opacity = useTransform(progress, r(start + 0.012, start + 0.06, end - 0.07, end - 0.02), [i === 0 ? 1 : 0, 1, 1, i === N - 1 ? 1 : 0]);
  const y = useTransform(progress, r(start + 0.012, start + 0.07), [i === 0 ? 0 : 14, 0]);
  return (
    <motion.div style={{ opacity, y }} className="absolute inset-x-0 bottom-0">
      <p className="label text-gold">{frame.mark}</p>
      <p className="t-voice mt-2 text-display-3 leading-[1.05] text-bone">{frame.line}</p>
    </motion.div>
  );
}

function Tick({ i, progress }: { i: number; progress: MotionValue<number> }) {
  const fill = useTransform(progress, r(i / N, (i + 1) / N), [0, 1]);
  return (
    <span className="relative block h-px w-6 bg-bone/25 sm:w-9">
      <motion.span className="absolute inset-0 origin-left bg-gold" style={{ scaleX: fill }} />
    </span>
  );
}

function Stacked() {
  return (
    <div className="tone-dark bg-night">
      {FRAMES.map((f) => (
        <figure key={f.image} className="relative aspect-[4/5] w-full overflow-hidden sm:aspect-[16/9]">
          <FilmImage name={f.image} grade="none" sizes="100vw" />
          <div aria-hidden className="absolute inset-0" style={{ background: HELD_FOOT }} />
          <figcaption className="gutter absolute inset-x-0 bottom-0 pb-8">
            <Reveal>
              <p className="label text-gold">{f.mark}</p>
              <p className="t-voice mt-2 text-display-3 leading-[1.05] text-bone">{f.line}</p>
            </Reveal>
          </figcaption>
        </figure>
      ))}
    </div>
  );
}
