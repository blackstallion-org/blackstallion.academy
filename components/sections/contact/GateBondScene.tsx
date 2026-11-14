import { Headline } from "@/components/film/Headline";
import { Label } from "@/components/film/Marks";
import { ModelPlate } from "@/components/3d/ModelPlate";
import { asset } from "@/lib/content/asset";

/*
 * Visual pass (14 Nov 2026, owner): the bronze-looking black model is replaced by the bay Marwari head the owner likes
 * (touch-bay-horse.glb, also a covenant frame in lib/content/covenant.ts), which reads as a living horse. The model is one fused
 * mesh, horse and hand together, with the fingertips well short of the muzzle, so the gap is the model's own and cannot close.
 * The whole model sits in the window (no oversize crop): ears, bridle, muzzle and the cuff all stay in frame at 1440 and 390 px.
 * The cut neck on the left and the cut sleeve on the right fade into the ground, so the head is not boxed.
 */
const fade = {
  maskImage: "linear-gradient(to right, transparent 0, #000 22%, #000 90%, transparent 100%), linear-gradient(to top, transparent 0, #000 10%)",
  WebkitMaskImage: "linear-gradient(to right, transparent 0, #000 22%, #000 90%, transparent 100%), linear-gradient(to top, transparent 0, #000 10%)",
  maskComposite: "intersect",
  WebkitMaskComposite: "source-in",
} as const;

/**
 * /contact, the last encounter: a bay Marwari and a cadet's offered hand (touch-bay-horse.glb), on the ground of the gate.
 */
export function GateBondScene() {
  return (
    <section
      aria-labelledby="gate-bond-h"
      data-parallax-skip
      className="tone-dark gate-bond-scene relative overflow-hidden border-t border-line/40 bg-night"
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_70%_at_68%_50%,rgba(180,110,50,0.14),transparent_70%)]"
        aria-hidden
      />
      <div className="gutter relative grid items-center gap-8 py-[clamp(5rem,12vh,8rem)] lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-12">
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
        <div className="relative order-1 -mx-[max(16px,4vw)] aspect-[3/2] overflow-hidden sm:mx-0 lg:order-2 lg:aspect-[16/10]" style={fade}>
          <ModelPlate
            src={asset("/models/touch-bay-horse.glb")}
            label="A bay Marwari stallion's head in a leather bridle, and a cadet's open hand offered a short way from its muzzle"
            mode="still"
            fill={0.96}
            fallback={<div className="h-full w-full bg-night" />}
            className="absolute inset-0"
          />
        </div>
      </div>
    </section>
  );
}
