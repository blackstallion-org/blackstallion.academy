"use client";

import { useRef } from "react";
import { Label } from "@/components/film/Marks";
import { BondStage } from "@/components/3d/BondStage";

export default function BondHero() {
  const sectionRef = useRef<HTMLElement>(null);

  return (
    <section
      ref={sectionRef}
      aria-label="A quiet approach between horse and hand"
      data-parallax-skip
      className="relative w-full overflow-hidden bg-[#f2ece1] select-none lg:h-[95svh] lg:min-h-[640px]"
    >
      {/* The canonical Marwari and a cadet's hand come in from opposite edges and meet (components/3d/BondStage.tsx, R01). Phones: a
          stage under the fixed nav (h-16) with the copy below it. Wide screens: from 112 px down (clear of the nav and its safe zone) to the foot of the section; the neck fades out at the bottom. */}
      <BondStage
        theme="light"
        fade="bottom"
        label="A black Marwari walks in from the left and a cadet's hand from the right; they pause, the horse lowers its head, and the hand meets the bridge of its nose."
        className="relative z-0 mt-16 h-[52svh] min-h-[320px] lg:absolute lg:inset-x-0 lg:bottom-0 lg:top-28 lg:mt-0 lg:h-auto lg:min-h-0"
      />

      {/* The whole head now shows, so on wide screens the copy sits in the clear space at the upper right, away from the head and the hand. */}
      <div className="gutter pointer-events-none relative z-10 pb-10 pt-3 lg:absolute lg:inset-0 lg:flex lg:flex-col lg:items-end lg:justify-start lg:pb-0 lg:pt-36">
        <div className="max-w-[19rem] sm:max-w-[22rem] lg:max-w-[22rem] xl:max-w-[25rem]">
          <Label className="text-[#a66b26]">Phase 01 · The Covenant</Label>
          <h2
            className="mt-2 font-serif text-2xl sm:text-3xl lg:text-[2.1rem] font-light text-[#231710] leading-[1.12] tracking-tight"
            style={{
              fontFamily: 'var(--font-display)',
            }}
          >
            The stillness before the command.
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-[#4d3c33] font-normal leading-relaxed max-w-[34ch]">
            Every great partnership begins in silence. Before the saddle is cinched or the reins are gathered, the cadet learns the discipline of touch.
          </p>

        </div>
      </div>

      {/* Editorial subtle edge gradient fade */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-[#f2ece1] to-transparent opacity-40"
      />
    </section>
  );
}

