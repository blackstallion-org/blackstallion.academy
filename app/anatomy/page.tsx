import type { Metadata } from "next";
import { EndCard } from "@/components/film/EndCard";
import { Headline } from "@/components/film/Headline";
import { Label } from "@/components/film/Marks";
import { Reveal } from "@/components/film/Reveal";
import { AnatomyTitle, EarDial, ScaleBalance } from "@/components/sections/anatomy/AnatomyScenes";
import { SpecimenPlate } from "@/components/sections/anatomy/SpecimenPlate";
import { breedStandard } from "@/lib/content/anatomy";

export const metadata: Metadata = {
  title: "The Instrument",
  description: "The Marwari, point by point: what its ears, neck, back, flank, reins and hooves teach a young rider.",
};

export default function AnatomyPage() {
  return (
    <>
      <AnatomyTitle />

      {/* §1 · S03 full specimen plate with four layers */}
      <section aria-labelledby="plate-h" className="gutter relative py-[clamp(6rem,14vh,12rem)]">
        <Label>Read it four ways</Label>
        <Headline id="plate-h" className="mt-4" inscription="Six points," voice="six lessons." />
        <p className="t-story mt-6 max-w-2xl text-sand">
          Choose a point on the plate. Each one shows the horse, what it asks of the rider, what it builds, and what the old stories say.
        </p>
        <SpecimenPlate mode="full" className="mt-12" />
      </section>

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
          <dl className="border-t border-brass">
            {breedStandard.map((row, i) => (
              <Reveal key={row.k} delay={i * 0.04} className="grid gap-2 border-b border-brass py-6 sm:grid-cols-[12rem_1fr] sm:gap-8">
                <dt className="label pt-1 text-dust">{row.k}</dt>
                <dd className="text-lede text-bone">{row.v}</dd>
              </Reveal>
            ))}
          </dl>
        </div>
      </section>

      <EndCard current={2} />
    </>
  );
}
