"use client";

import { motion, useReducedMotion, useTransform, type MotionValue } from "motion/react";
import { Chapter } from "../Chapter";
import { FilmImage } from "../FilmImage";
import { MaskLine, ProgressFade } from "../MaskLine";
import { legendBeats } from "@/lib/content/film";
import { cn } from "@/lib/utils";
import { r } from "../range";

const N = legendBeats.length;

/**
 * Chapter I. Four beats scrubbed by scroll, each its own photograph.
 * Signature moment: "the vow" slams in word by word, then colour drains for the fall
 * and floods back for the revival.
 */
export function Legend() {
  return (
    <Chapter id="legend" label="Chapter I: The Legend of the Marwari" length={1 + N * 1.25}>
      {(p) => <LegendFrame p={p} />}
    </Chapter>
  );
}

function LegendFrame({ p }: { p: MotionValue<number> }) {
  const headerOpacity = useTransform(p, r(0, 0.03, 0.1, 0.14), [0, 1, 1, 0]);
  const plumeY = useTransform(p, r(0, 1), ["20%", "-30%"]);
  return (
    <div className="relative h-full w-full bg-night">
      {legendBeats.map((beat, i) => (
        <BeatImage key={i} p={p} i={i} />
      ))}
      <FilmImage name="dustPlume" blend="screen" opacity={0.55} y={plumeY} />
      <div className="absolute inset-0 bg-gradient-to-r from-night/85 via-night/40 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-night/80 via-transparent to-night/50" />

      <motion.p style={{ opacity: headerOpacity }} className="label absolute left-5 top-24 text-gold sm:left-10 sm:top-28">
        Chapter I <span className="mx-3 text-sand/50">/</span> The Legend of the Marwari
      </motion.p>

      {legendBeats.map((beat, i) => (
        <BeatText key={i} p={p} i={i} />
      ))}
      <Progress p={p} />
    </div>
  );
}

function window_(i: number): [number, number] {
  return [i / N, (i + 1) / N];
}

function BeatImage({ p, i }: { p: MotionValue<number>; i: number }) {
  const reduced = useReducedMotion();
  const [s, e] = window_(i);
  const beat = legendBeats[i];
  const opacity = useTransform(p, i === 0 ? r(0, e - 0.03, e + 0.02) : r(s - 0.03, s + 0.02, e - 0.03, e + 0.02), i === 0 ? [1, 1, 0] : [0, 1, 1, 0]);
  const scale = useTransform(p, r(s - 0.05, e + 0.05), [1.18, 1.02]);
  // The fall (beat 4) starts drained of colour and warms up as it ends.
  const filter = useTransform(
    p,
    [s, s + (e - s) * 0.55, e],
    i === N - 1
      ? ["grayscale(1) brightness(0.55)", "grayscale(1) brightness(0.6)", "grayscale(0) brightness(1)"]
      : ["grayscale(0) brightness(1)", "grayscale(0) brightness(1)", "grayscale(0) brightness(0.9)"],
  );
  return (
    <FilmImage
      name={beat.media}
      opacity={opacity}
      scale={reduced ? 1 : scale}
      filter={filter}
      position={i === 2 ? "70% 50%" : "50% 50%"}
    />
  );
}

function BeatText({ p, i }: { p: MotionValue<number>; i: number }) {
  const [s, e] = window_(i);
  const beat = legendBeats[i];
  const span = e - s;
  const inAt = s + span * 0.08;
  const outAt = e - span * 0.12;
  const isVow = i === 2;
  const lines = beat.title;

  return (
    <div className="absolute inset-0 flex items-end px-5 pb-24 sm:px-10 sm:pb-28 lg:items-center lg:pb-0 lg:pl-[8vw]">
      <div className={cn("max-w-[min(92vw,1100px)]", isVow && "lg:max-w-none")}>
        <ProgressFade progress={p} range={[inAt - 0.01, inAt + 0.03]} exit={[outAt, outAt + 0.04]}>
          <p className="label mb-6 text-gold">
            <span className="mr-3 font-mono tracking-normal text-sand/60">0{i + 1}</span>
            {beat.kicker}
          </p>
        </ProgressFade>
        <h2
          className={cn(
            "font-display tracking-display text-bone opsz-display",
            isVow ? "text-[clamp(2.75rem,8.5vw,9rem)] leading-[0.88]" : "text-display-1",
          )}
        >
          {lines.map((line, j) => (
            <MaskLine
              key={j}
              progress={p}
              range={[inAt + j * span * (isVow ? 0.12 : 0.05), inAt + j * span * (isVow ? 0.12 : 0.05) + span * 0.12]}
              exit={[outAt + j * 0.004, outAt + 0.05 + j * 0.004]}
              className={cn(
                j % 2 === 1 && !isVow && "italic text-sand",
                isVow && j === 1 && "text-blood",
                isVow && j >= 2 && "italic text-gold",
              )}
            >
              {line}
            </MaskLine>
          ))}
        </h2>
        <ProgressFade progress={p} range={[inAt + span * 0.2, inAt + span * 0.32]} exit={[outAt, outAt + 0.04]}>
          <p className="mt-8 max-w-[52ch] text-lede text-sand/95 text-pretty">{beat.body}</p>
        </ProgressFade>
      </div>
    </div>
  );
}

function Progress({ p }: { p: MotionValue<number> }) {
  const w = useTransform(p, r(0, 1), ["0%", "100%"]);
  return (
    <div className="absolute bottom-10 left-5 right-5 hidden h-px bg-sand/15 sm:left-10 sm:right-24 lg:block">
      <motion.div className="h-full bg-brass" style={{ width: w }} />
      <div className="absolute -top-6 flex w-full justify-between">
        {legendBeats.map((b, i) => (
          <span key={i} className="label text-[0.62rem] text-sand/60">
            {b.kicker}
          </span>
        ))}
      </div>
    </div>
  );
}
