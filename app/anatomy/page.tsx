import { ScrollRevealText } from "@/components/motion/ScrollRevealText";
import { EditorialScrollSync } from "@/components/motion/EditorialMotion";
import type { Metadata } from "next";
import Link from "next/link";
import { EndCard } from "@/components/film/EndCard";
import { EditorialHeadline as Headline } from "@/components/motion/EditorialMotion";
import { Label } from "@/components/film/Marks";
import { EditorialReveal as Reveal } from "@/components/motion/EditorialMotion";
import { EarDial, ScaleBalance, AnatomyTitle } from "@/components/sections/anatomy/AnatomyScenes";
import { SpecimenPlate } from "@/components/sections/anatomy/SpecimenPlate";
import { MatrixPlate } from "@/components/sections/anatomy/DualBody";
import { Unveiling } from "@/components/sections/shared/Unveiling";
import { unveilings } from "@/lib/content/unveiling";
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

      {/* §1b · the rider and the horse together are studied once, on /science (R15, 2 Nov 2026: the same full scene was repeated here) */}
      <section aria-label="Rider and horse together" className="gutter relative pb-12">
        <Link href="/science" className="group flex flex-wrap items-baseline justify-between gap-4 border-y border-line py-8 hover:border-gold">
          <span>
            <span className="label text-brass">One conversation, two bodies</span>
            <span className="t-voice mt-2 block text-2xl text-bone md:text-3xl">See the rider and the horse move together.</span>
          </span>
          <span className="label text-gold transition-transform group-hover:translate-x-1">Open /science →</span>
        </Link>
      </section>

      {/* §1c · the brain, spine, muscle and heart plate (the supplied 2D animation, back on this page) */}
      <MatrixPlate />

      {/* §2 · S25 */}
      <ScaleBalance />

      {/* §3 · S26 */}
      <EarDial />

      {/* §3b · the stone, the lantern, the light: a pinned opening-style scene, placed after the first sections instead of at the top.
          It is the same marble stallion the earlier relight study showed, so that study no longer repeats it here. */}
      <Unveiling scene={unveilings.anatomy} />

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

      <EndCard current={2} />
    </>
  );
}
