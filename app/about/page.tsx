import type { Metadata } from "next";
import { Headline } from "@/components/film/Headline";
import { Cta, Label } from "@/components/film/Marks";
import { Reveal } from "@/components/film/Reveal";
import { LoaderMark } from "@/components/motion/Loader";
import { Monolith } from "@/components/sections/why/WhyScenes";
import { house, letter, truths } from "@/lib/content/academy";
import { entity } from "@/lib/content/site";

export const metadata: Metadata = {
  title: "The Mandate",
  description: "Dominus Sui, Dominus Equi. The Chairman's letter, the six truths behind the academy, and the house it belongs to.",
};

export default function AboutPage() {
  return (
    <>
      {/* T17 · Monogram drawn in brass */}
      <section aria-labelledby="about-h" className="gutter relative flex min-h-[100svh] flex-col items-center justify-center pt-24 text-center">
        <LoaderMark className="h-28 w-28 md:h-36 md:w-36" />
        <p className="label mt-10 text-brass">Credits · Behind the camera</p>
        <Headline id="about-h" as="h1" size="1" animate="mount" delay={0.8} className="mx-auto mt-4" inscription="Dominus Sui," voice="dominus equi." />
        <p className="t-story mt-6 text-sand">{entity.mottoEn}.</p>
      </section>

      {/* §1 · S61 letter */}
      <section aria-labelledby="letter-h" className="gutter relative py-[clamp(6rem,14vh,12rem)]">
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
