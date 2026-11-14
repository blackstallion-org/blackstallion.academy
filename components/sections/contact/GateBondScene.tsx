import { Headline } from "@/components/film/Headline";
import { Label } from "@/components/film/Marks";
import { ModelPlate } from "@/components/3d/ModelPlate";
import { asset } from "@/lib/content/asset";

/*
 * The crop (14 Nov 2026, owner): the window shows only the head, the muzzle and the reaching hand. The neck, the mane and the
 * rest of the bust stay outside it. The model is one fused mesh (horse and hand together), so the crop is done by drawing the
 * canvas larger than the window and offsetting it (the canvas stays square, so the model's own fit is unchanged). The
 * percentages place model x -0.22..0.42 and y 0..0.585 (ears to jaw, fingers and wrist) in the wide window, and x -0.2..0.38
 * in the square phone window.
 * The neck and the mane fade out at the cut edges, so the head sits in the ivory ground and is not boxed.
 */
const fade = {
  maskImage: "linear-gradient(to right, transparent 0, #000 16%), linear-gradient(to top, transparent 0, #000 12%)",
  WebkitMaskImage: "linear-gradient(to right, transparent 0, #000 16%), linear-gradient(to top, transparent 0, #000 12%)",
  maskComposite: "intersect",
  WebkitMaskComposite: "source-in",
} as const;

/**
 * /contact, the last encounter: the supplied black Marwari and a cadet's hand (touch-black-horse.glb, 4 Nov 2026), cropped close
 * to the head and the hand on the ground of the gate.
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
        <div className="relative order-1 -mx-[max(16px,4vw)] aspect-square overflow-hidden sm:mx-0 lg:order-2 lg:aspect-[11/10]" style={fade}>
          <ModelPlate
            src={asset("/models/touch-black-horse.glb")}
            label="A close view of a black Marwari stallion's head, in bronze-dark relief, with a cadet's open hand reaching to its muzzle"
            mode="still"
            fill={1.15}
            fallback={<div className="h-full w-full bg-night" />}
            className="absolute left-[-39.1%] top-[-19.6%] h-[146.9%] w-[146.9%] lg:left-[-32.1%] lg:top-[-18.8%] lg:h-[146.4%] lg:w-[133.1%]"
          />
        </div>
      </div>
    </section>
  );
}
