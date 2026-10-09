"use client";

import { useState } from "react";
import { CountUp } from "@/components/motion/CountUp";
import { LoaderMark } from "@/components/motion/Loader";
import { RevealItem, RevealOnScroll } from "@/components/motion/RevealOnScroll";
import { SealStamp } from "@/components/motion/SealStamp";
import { SplitLines } from "@/components/motion/SplitLines";
import { Button } from "@/components/ui/Button";
import { Replay } from "./Demo";

const ranks = [
  { name: "Cadet Squire", line: "Handling, balance, walk-trot transitions" },
  { name: "Cadet Rider", line: "Independent canter, obstacle navigation" },
  { name: "Cadet Knight", line: "Dressage, vaulting, formation riding" },
];

function SealDemo() {
  const [stamped, setStamped] = useState(false);
  return (
    <div className="flex flex-col items-center gap-6">
      <div className="relative grid place-items-center">
        {/* Where the seal will land */}
        <span aria-hidden className="absolute h-32 w-32 rounded-full border border-dashed border-brass/25" />
        <SealStamp trigger="manual" play={stamped} sound="/audio/seal_press.wav" />
      </div>
      <Button size="md" variant="quiet" onClick={() => setStamped((s) => !s)}>
        {stamped ? "Lift the seal" : "Stamp"}
      </Button>
    </div>
  );
}

export function MotionDemos() {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Replay title="Dust reveal: SplitLines" note="Lines rise out of a mask, 0.06 s apart, on the house curve.">
        <SplitLines
          as="p"
          trigger="mount"
          lines={["We do not teach", "children to ride."]}
          className="text-center font-display text-display-3 tracking-display"
        />
      </Replay>

      <Replay title="Brass seal: SealStamp" note="Lands heavy, shadow thumps, one ring pulse. Fires on every success." action="Reset">
        <SealDemo />
      </Replay>

      <Replay title="RevealOnScroll (staggered)" note="Fade and 24 px rise, once, as the block enters the viewport.">
        <RevealOnScroll as="ol" stagger className="mx-auto flex max-w-sm flex-col gap-3">
          {ranks.map((r) => (
            <RevealItem as="li" key={r.name} className="border-l border-brass/40 pl-4">
              <p className="font-display text-sm tracking-[0.12em] text-ink">{r.name}</p>
              <p className="text-sm text-muted">{r.line}</p>
            </RevealItem>
          ))}
        </RevealOnScroll>
      </Replay>

      <Replay title="CountUp" note="Mono numbers count once from zero, Indian digit grouping.">
        <div className="text-center">
          <CountUp value={9440} prefix="₹" className="font-mono text-5xl text-parchment-gold" />
          <p className="mt-2 text-sm text-muted">Monthly tuition, GST included</p>
        </div>
      </Replay>

      <Replay title="Loader mark" note="First visit only, under 1.5 s. Ears draw, fill, then turn inward to rest.">
        <div className="flex justify-center">
          <LoaderMark className="h-24 w-24" />
        </div>
      </Replay>

      <figure className="bsah-card flex flex-col overflow-hidden">
        <div className="grid min-h-56 flex-1 place-items-center gap-4 p-8 text-center">
          <p className="max-w-[34ch] font-editorial text-lg italic text-muted">
            The curtain plays on navigation, never on the first load.
          </p>
          <Button href="/" variant="quiet">
            Go to the holding page
          </Button>
        </div>
        <figcaption className="border-t border-brass/15 px-5 py-4">
          <p className="text-sm font-medium text-ink">Page curtain: app/template.tsx</p>
          <p className="mt-1 text-xs leading-relaxed text-muted">Obsidian panel with the monogram lifts in about 0.9 s.</p>
        </figcaption>
      </figure>
    </div>
  );
}
