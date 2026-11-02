import { Headline } from "@/components/film/Headline";
import { Label } from "@/components/film/Marks";
import { BondStage } from "@/components/3d/BondStage";

/**
 * /contact, the last encounter (R01, 2 Nov 2026): the same canonical Marwari and cadet's hand as the /curriculum bond, on the dark
 * ground of the gate. Replaces the R3F scene built on the fused Tripo sculpt (horse-hand-draco.glb), whose grey head was cut at the
 * poll. The stage plays once when it is well in view (BondStage); the copy no longer claims a timed "resonance loop".
 */
export function GateBondScene() {
  return (
    <section
      aria-labelledby="gate-bond-h"
      data-parallax-skip
      className="tone-dark gate-bond-scene relative overflow-hidden border-t border-line/40 bg-[#0e0a08]"
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(70%_80%_at_62%_50%,rgba(180,110,50,0.16),transparent_70%)]"
        aria-hidden
      />
      <div className="gutter relative grid min-h-[100svh] items-center gap-6 pb-16 pt-24 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-10 lg:py-24">
        <div className="order-2 max-w-[24rem] lg:order-1 lg:max-w-[32rem]">
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
        <BondStage
          theme="dark"
          fade="both"
          label="A black Marwari walks in from the left and a cadet's hand from the right; they pause, the horse lowers its head, and the hand meets its nose."
          className="order-1 h-[54svh] min-h-[320px] lg:order-2 lg:h-[78svh]"
        />
      </div>
    </section>
  );
}
