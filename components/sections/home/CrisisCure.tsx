"use client";

import { useState } from "react";
import { Headline } from "@/components/film/Headline";
import { Cta, Label } from "@/components/film/Marks";
import { CompareSlider } from "@/components/sections/shared/CompareSlider";
import { crisis } from "@/lib/content/home";
import { cn } from "@/lib/utils";

/**
 * §5 Crisis & cure · S05 before/after slider.
 * Signature: as the divider passes the middle, each pair swaps from frost to gold.
 */
export function CrisisCure() {
  const [pct, setPct] = useState(50);
  const cured = pct < 50;

  return (
    <section aria-labelledby="crisis-h" className="relative py-[clamp(6rem,14vh,12rem)]">
      <div className="gutter mb-10 grid gap-6 md:grid-cols-[1fr_minmax(0,26rem)] md:items-end">
        <div>
          <Label reel={4}>Crisis &amp; Cure</Label>
          <Headline id="crisis-h" className="mt-4" inscription={crisis.inscription} voice={crisis.voice} />
        </div>
        <p className="text-sand">{crisis.body}</p>
      </div>

      <div className="gutter">
        <CompareSlider
          left="whyCrisis"
          right="whyCure"
          leftLabel="The crisis"
          rightLabel="The cure"
          onChange={setPct}
          className="aspect-[4/5] w-full sm:aspect-[16/9]"
        />
        <p className="label mt-3 text-dust">Drag to compare · arrow keys work too</p>
      </div>

      <ul className="gutter mt-12 grid gap-px bg-brass/10 sm:grid-cols-2 lg:grid-cols-4">
        {crisis.pairs.map(([from, to]) => (
          <li key={from} className="flex flex-col gap-2 bg-night py-6 pr-6 sm:pl-6 sm:first:pl-0">
            <span className={cn("t-ui text-sm line-through decoration-1 transition-colors duration-700", cured ? "text-frost/40" : "text-frost")}>
              {from}
            </span>
            <span className={cn("t-voice text-2xl transition-colors duration-700", cured ? "text-gold" : "text-bone")}>{to}</span>
          </li>
        ))}
      </ul>

      <div className="gutter mt-12">
        <Cta href="/why">Why riding</Cta>
      </div>
    </section>
  );
}
