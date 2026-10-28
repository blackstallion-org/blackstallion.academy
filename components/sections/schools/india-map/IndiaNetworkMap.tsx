"use client";

import dynamic from "next/dynamic";
import { Headline } from "@/components/film/Headline";
import { Label } from "@/components/film/Marks";
import { mapCopy } from "@/lib/content/india-map";

// three.js, the engine and the baked terrain load only when the map is about to be seen.
const IndiaSculpture = dynamic(() => import("./IndiaSculpture").then((m) => m.IndiaSculpture), { ssr: false, loading: () => <div aria-hidden className="h-[clamp(25rem,62svh,31rem)] w-full border border-line min-[820px]:h-[clamp(30rem,78svh,58rem)]" /> });

/** /schools · the national sculpture: a lit relief model of India with the six target circuits and two heritage places. */
export function IndiaNetworkMap() {
  return (
    <section id="sculpture" aria-labelledby="sculpture-h" className="tone-dark relative scroll-mt-20 bg-night py-[clamp(5rem,12vh,9rem)]">
      <div className="gutter">
        <Label>{mapCopy.label}</Label>
        <Headline id="sculpture-h" className="mt-4" inscription={mapCopy.inscription} voice={mapCopy.voice} />
        <p className="t-story mt-5 max-w-xl text-lede text-sand">{mapCopy.lede}</p>
      </div>
      <div className="gutter mt-10">
        <IndiaSculpture />
        <p className="t-ui mt-6 max-w-3xl text-xs leading-relaxed text-dust">{mapCopy.sources}</p>
      </div>
    </section>
  );
}
