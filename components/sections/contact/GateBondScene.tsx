import { Headline } from "@/components/film/Headline";
import { Label } from "@/components/film/Marks";
import { ModelPlate } from "@/components/3d/ModelPlate";
import { asset } from "@/lib/content/asset";

/**
 * /contact, the last encounter: the supplied black Marwari and a cadet's hand (touch-black-horse.glb, 4 Nov 2026) on the dark ground of the gate.
 */
export function GateBondScene() {
  return (
    <section
      aria-labelledby="gate-bond-h"
      data-parallax-skip
      className="tone-dark gate-bond-scene relative overflow-hidden border-t border-line/40 bg-night"
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(70%_80%_at_62%_50%,rgba(180,110,50,0.16),transparent_70%)]"
        aria-hidden
      />
      <div className="gutter relative grid min-h-[100svh] items-center gap-6 pb-16 pt-24 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-10 lg:py-24">
        <div className="relative z-10 order-2 max-w-[24rem] lg:order-1 lg:max-w-[32rem]">
          <Label>Final corridor · Gate 01</Label>
          <Headline
            id="gate-bond-h"
            size="2"
            className="mt-4"
            inscription="Before the gate closes,"
            voice="the bond begins."
            voiceColor="gold"
          />
          <p className="t-story mt-4 max-w-[34ch] text-sand/90">
            Every cadet meets an assigned horse before the first lesson: an open hand, a pause, and the horse chooses to come
            the last few centimetres.
          </p>
        </div>
        <ModelPlate
          src={asset("/models/touch-black-horse.glb")}
          label="A black Marwari stallion's head, in bronze-dark relief, with a cadet's open hand reaching toward its muzzle"
          mode="still"
          fill={1.15}
          fallback={<div className="h-full w-full bg-night" />}
          className="order-1 h-[54svh] min-h-[320px] lg:absolute lg:inset-y-0 lg:right-0 lg:z-0 lg:h-auto lg:w-[58%] [mask-image:linear-gradient(to_right,transparent_0,#000_14%)]"
        />
      </div>
    </section>
  );
}
