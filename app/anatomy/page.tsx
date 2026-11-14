import { ScrollRevealText } from "@/components/motion/ScrollRevealText";
import { EditorialScrollSync } from "@/components/motion/EditorialMotion";
import type { Metadata } from "next";
import { EditorialHeadline as Headline } from "@/components/motion/EditorialMotion";
import { Label } from "@/components/film/Marks";
import { EditorialReveal as Reveal } from "@/components/motion/EditorialMotion";
import { EarDial, ScaleBalance, AnatomyTitle } from "@/components/sections/anatomy/AnatomyScenes";
import { SpecimenPlate } from "@/components/sections/anatomy/SpecimenPlate";
import { MatrixPlate } from "@/components/sections/anatomy/DualBody";
import { AnatomyAtlas } from "@/components/sections/anatomy/atlas/AnatomyAtlas";
import { breedStandard } from "@/lib/content/anatomy";

export const metadata: Metadata = {
  alternates: { canonical: "/anatomy" },
  title: "The Instrument",
  description: "The Marwari, point by point: what its ears, neck, back, flank, reins and hooves teach a young rider.",
};

export default function AnatomyPage() {
  return (
    <>
      <EditorialScrollSync />
      <AnatomyTitle />

      {/* §1 · S03 full specimen plate with four layers */}
      <section data-parallax-skip aria-labelledby="plate-h" className="gutter relative py-[clamp(6rem,14vh,12rem)]">
        <Label>Read it four ways</Label>
        <Headline id="plate-h" technique="words" className="mt-4" inscription="Six points," voice="six lessons." />
        <ScrollRevealText className="t-story mt-6 max-w-2xl text-sand">
          Choose a point on the plate. Each one shows the horse, what it asks of the rider, what it builds, and what the old stories say.
        </ScrollRevealText>
        <SpecimenPlate mode="full" className="mt-12" />
      </section>

      {/* 14 Nov 2026 (owner): the 3D horse-and-rider exhibit and the embedded WebGL stride lab are replaced by one interactive
          2D anatomy atlas (skeleton, muscles, horse and rider; walk, trot and canter). /stride keeps its own 3D lab. */}
      <AnatomyAtlas />

      {/* §1c · the brain, spine, muscle and heart plate (the supplied 2D animation, back on this page) */}
      <MatrixPlate />

      {/* §2 · S25 */}
      <ScaleBalance />

      {/* §3 · S26 */}
      <EarDial />

      {/* §4 · S27 spec sheet */}
      <section aria-labelledby="spec-h" className="gutter relative py-[clamp(6rem,14vh,12rem)]">
        <Label>Breed standard</Label>
        <Headline id="spec-h" className="mt-4" inscription="The" voice="specification." />
        <div className="mt-12 grid gap-8 lg:grid-cols-[minmax(0,0.55fr)_minmax(0,1.45fr)]">
          <p className="font-mono max-w-[16rem] text-xs leading-relaxed text-dust">
            Compiled from breed-society standards and Marwar horse literature. Individual horses and lines vary.
          </p>
          <dl className="border-t border-line">
            {breedStandard.map((row, i) => (
              <Reveal key={row.k} delay={i * 0.04} className="grid gap-2 border-b border-line py-6 sm:grid-cols-[12rem_1fr] sm:gap-8">
                <dt className="label pt-1 text-dust">{row.k}</dt>
                <dd className="text-lede text-bone">{row.v}</dd>
              </Reveal>
            ))}
          </dl>
        </div>
      </section>

    </>
  );
}
