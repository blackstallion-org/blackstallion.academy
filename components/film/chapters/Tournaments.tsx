"use client";

import { motion, useReducedMotion, useTransform, type MotionValue } from "motion/react";
import { Chapter } from "../Chapter";
import { FilmImage } from "../FilmImage";
import { MaskLine, ProgressFade } from "../MaskLine";
import { fixtures, standings } from "@/lib/content/film";
import { r } from "../range";

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const day = (d: string) => `${Number(d.slice(8))} ${months.at(Number(d.slice(5, 7)) - 1)} ${d.slice(0, 4)}`;

/**
 * Chapter VII. The charge comes at you.
 * Signature moment: the frame rushes forward and shakes as the lances drop; the standings gallop in.
 */
export function Tournaments() {
  return (
    <Chapter id="tournaments" label="Chapter VII: The Interscholastic Circuit" length={2.6}>
      {(p) => <TournamentFrame p={p} />}
    </Chapter>
  );
}

function TournamentFrame({ p }: { p: MotionValue<number> }) {
  const reduced = useReducedMotion();
  const scale = useTransform(p, r(0, 0.45, 1), [1, 1.35, 1.45]);
  const shake = useTransform(p, r(0.3, 0.33, 0.36, 0.39, 0.42), ["0%", "0.6%", "-0.5%", "0.3%", "0%"]);
  const max = Math.max(...standings.map((s) => s.points));

  return (
    <div className="relative h-full w-full bg-night">
      <FilmImage name="bgCharge" scale={reduced ? 1.05 : scale} x={reduced ? "0%" : shake} />
      <div className="absolute inset-0 bg-gradient-to-t from-night via-night/40 to-night/60" />

      <div className="relative flex h-full flex-col justify-end gap-10 px-5 pb-20 pt-24 sm:px-10 lg:pl-[8vw] lg:pr-28">
        <div>
          <ProgressFade progress={p} range={[0.02, 0.08]}>
            <p className="label mb-6 text-gold">
              Chapter VII <span className="mx-3 text-sand/50">/</span> STPCI Interscholastic Circuit
            </p>
          </ProgressFade>
          <h2 className="font-display text-display-1 tracking-display opsz-display">
            <MaskLine progress={p} range={[0.04, 0.14]}>Lances down.</MaskLine>
            <MaskLine progress={p} range={[0.1, 0.2]} className="italic text-gold">
              Schools at war.
            </MaskLine>
          </h2>
        </div>

        <div className="grid gap-10 lg:grid-cols-[1.3fr_1fr] lg:gap-16">
          <div>
            <p className="label mb-4 text-sand/70">Tent pegging standings · sample</p>
            <ol className="flex flex-col gap-3">
              {standings.map((s, i) => (
                <Row key={s.school} p={p} i={i} school={s.school} points={s.points} max={max} />
              ))}
            </ol>
          </div>
          <ProgressFade progress={p} range={[0.5, 0.6]}>
            <p className="label mb-4 text-sand/70">Fixtures</p>
            <ul className="flex flex-col gap-5">
              {fixtures.map((f) => (
                <li key={f.name} className="border-b border-sand/20 pb-4">
                  <p className="font-mono text-sm text-brass">{day(f.date)}</p>
                  <p className="mt-1 font-display text-2xl text-bone">{f.name}</p>
                  <p className="label mt-1 text-[0.62rem] text-sand/60">{f.place}</p>
                </li>
              ))}
            </ul>
          </ProgressFade>
        </div>
      </div>
    </div>
  );
}

function Row({ p, i, school, points, max }: { p: MotionValue<number>; i: number; school: string; points: number; max: number }) {
  const start = 0.3 + i * 0.05;
  const w = useTransform(p, r(start, start + 0.2), ["0%", `${(points / max) * 100}%`]);
  const o = useTransform(p, r(start, start + 0.06), [0, 1]);
  return (
    <motion.li style={{ opacity: o }} className="grid grid-cols-[2rem_1fr_auto] items-center gap-4">
      <span className="font-mono text-sm text-sand/60">0{i + 1}</span>
      <div>
        <p className="font-display text-xl text-bone">{school}</p>
        <div className="mt-2 h-px bg-sand/15">
          <motion.div className="h-px bg-gradient-to-r from-brass/40 to-gold" style={{ width: w }} />
        </div>
      </div>
      <span className="font-mono text-lg text-bone">{points}</span>
    </motion.li>
  );
}
