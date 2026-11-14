import { ScrollRevealText } from "@/components/motion/ScrollRevealText";
import { AcademyRibbon } from "@/components/sections/about/AcademyRibbon";
import type { Metadata } from "next";
import { Headline } from "@/components/film/Headline";
import { Cta, Label } from "@/components/film/Marks";
import { Reveal } from "@/components/film/Reveal";
import { CrestMark } from "@/components/brand/CrestMark";
import { ModelPlate } from "@/components/3d/ModelPlate";
import { asset } from "@/lib/content/asset";
import { Monolith } from "@/components/sections/why/WhyScenes";
import { MandateKineticStage } from "@/components/sections/about/MandateKineticStage";
import { house, letter, truths } from "@/lib/content/academy";
import { entity } from "@/lib/content/site";
import { EditorialGallery } from "@/components/film/EditorialGallery";

export const metadata: Metadata = {
  alternates: { canonical: "/about" },
  title: "The Mandate",
  description: "Dominus Sui, Dominus Equi. The Chairman's letter, the six truths behind the academy, and the house it belongs to.",
};

export default function AboutPage() {
  return (
    <>
      {/* T17 · Monogram drawn in brass */}
      <section aria-labelledby="about-h" className="gutter relative flex min-h-[100svh] flex-col items-center justify-center pt-24 text-center">
        {/* The supplied horse-head emblem in relief (4 Nov 2026) where the brass monogram stood; the monogram is its fallback. */}
        <ModelPlate
          src={asset("/models/bsah-emblem.glb")}
          label="The Black Stallion emblem: a horse's head in a shield between two pennants, in bronze relief"
          mode="sway"
          fill={0.95}
          className="h-56 w-56 md:h-72 md:w-72"
          fallback={<CrestMark size="lg" decorative className="mx-auto h-28 w-28 md:h-36 md:w-36" />}
        />
        <p className="label mt-10 text-brass">Credits · Behind the camera</p>
        <Headline id="about-h" as="h1" size="1" animate="mount" delay={0.8} className="mx-auto mt-4" inscription="Dominus Sui," voice="dominus equi." />
        <ScrollRevealText className="t-story mt-6 text-sand">{entity.mottoEn}.</ScrollRevealText>
      </section>

      {/* §1 · S61 letter */}
      <section aria-labelledby="letter-h" className="gutter relative py-[clamp(6rem,14vh,12rem)]">
        {/* The supplied sealed envelope (4 Nov 2026), the letter's cover; its wax seal carries the emblem. */}
        <ModelPlate
          src={asset("/models/sealed-envelope.glb")}
          label="A burgundy envelope sealed with a gold wax seal bearing the Black Stallion emblem"
          mode="sway"
          fill={0.9}
          className="mx-auto mb-10 h-52 w-72 md:h-64 md:w-96"
          fallback={<div className="h-full w-full" aria-hidden />}
        />
        <Reveal className="parchment mx-auto max-w-3xl px-8 py-12 md:px-16 md:py-16">
          <p className="label text-[#6b5130]">{letter.note}</p>
          <h2 id="letter-h" className="t-inscribe mt-3 text-2xl text-ink md:text-3xl">
            The Mandate
          </h2>
          <div className="mt-8 flex flex-col gap-5">
            {letter.body.map((p) => (
              <p key={p} className="text-lg leading-[1.75] text-ink/90">
                {p}
              </p>
            ))}
          </div>
          <p className="t-voice mt-10 text-3xl text-ink">{letter.sign}</p>
          <p className="label mt-1 text-[#6b5130]">{letter.title}</p>
        </Reveal>
      </section>

      {/* §2 · S32 six truths (second use) */}
      <Monolith label="Six truths we stand behind" lines={truths} />

      {/* §2a · S69 depth ribbon */}
      <AcademyRibbon />
      <EditorialGallery page="about" />

      {/* §2b · Masked line reveal & sequenced kinetic telemetry stage */}
      <MandateKineticStage />

      {/* §3 · S62 org tree */}
      <section aria-labelledby="house-h" className="gutter relative py-[clamp(6rem,14vh,12rem)]">
        <Label>The house</Label>
        <Headline id="house-h" className="mt-4" inscription="Horsemanship is" voice="the gateway." />
        <div className="mt-14 flex flex-col items-center">
          <Reveal className="border border-gold px-6 py-4 text-center">
            <p className="label text-brass">Parent</p>
            <p className="t-voice mt-1 text-2xl text-bone">{house.parent}</p>
          </Reveal>
          <span aria-hidden className="h-10 w-px bg-line" />
          <span aria-hidden className="hidden h-px w-[66%] bg-line md:block" />
          <ul className="grid w-full gap-6 md:grid-cols-3 md:gap-8">
            {house.children.map((c, i) => (
              <Reveal as="li" key={c.name} delay={i * 0.12} className="flex flex-col items-center text-center">
                <span aria-hidden className="hidden h-8 w-px bg-line md:block" />
                <div className={i === 0 ? "w-full border border-gold/70 p-5" : "w-full border border-line p-5"}>
                  <p className={i === 0 ? "label text-gold" : "label text-dust"}>{c.status}</p>
                  <p className="t-voice mt-2 text-xl text-bone">{c.name}</p>
                  <p className="mt-2 text-sm text-sand">{c.line}</p>
                </div>
              </Reveal>
            ))}
          </ul>
          <Reveal className="mt-14 w-full max-w-xl border-t border-dashed border-line pt-6 text-center">
            <p className="label text-brass">Governing council</p>
            <p className="t-voice mt-1 text-xl text-bone">{house.council.name}</p>
            <p className="mt-1 text-sm text-sand">{house.council.line}</p>
          </Reveal>
        </div>
        <div className="mt-16 flex justify-center">
          <Cta href="/legend" variant="solid">
            Begin at reel one
          </Cta>
        </div>
      </section>
    </>
  );
}
