import { ScrollRevealText } from "@/components/motion/ScrollRevealText";
import type { Metadata } from "next";
import Link from "next/link";
import { EndCard } from "@/components/film/EndCard";
import { FilmImage } from "@/components/film/FilmImage";
import { Arrow, ReelMark } from "@/components/film/Marks";
import { Reveal } from "@/components/film/Reveal";
import { FieldSphereHero } from "@/components/sections/journal/FieldSphereHero";
import { ViscousLiquidCanvas } from "@/components/sections/shared/ViscousLiquidCanvas";
import { posts } from "@/lib/content/journal";

export const metadata: Metadata = {
  alternates: { canonical: "/journal" },
  title: "The Chronicle",
  description: "Stories from the stable: the Marwari's legends, the science of the saddle and life on the circuit.",
};

const fmt = (d: string) => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });

export default function JournalPage() {
  const [featured, ...rest] = posts;
  return (
    <>
      <FieldSphereHero />

      {/* T15 · Masthead */}
      <header id="articles" className="gutter pt-20 md:pt-28 scroll-mt-12">
        <ReelMark n={15} act="ledger" />
        <div className="mt-8 border-y-2 border-double border-line py-6 text-center">
          <p className="label text-dust">Hyderabad · Vol. I · Stories from the stable</p>
          <h1 className="t-inscribe mt-3 text-[clamp(1.9rem,8vw,8.5rem)] leading-none text-bone">The Chronicle</h1>
          <p className="label mt-3 text-brass">Legend · Academy · Circuit</p>
        </div>
      </header>

      {/* Featured */}
      <section aria-label="Featured story" className="gutter mt-12 pb-[clamp(5rem,10vw,9rem)]">
        <Link href={`/journal/${featured.slug}`} className="group grid gap-8 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] lg:items-end">
          <div className="relative aspect-[4/3] overflow-hidden lg:aspect-[16/11]">
            <FilmImage name={featured.cover} grade="none" priority sizes="(min-width: 1024px) 60vw, 100vw" className="transition-transform duration-[1600ms] group-hover:scale-[1.03]" />
          </div>
          <div className="lg:pb-6">
            <p className="label text-brass">
              {featured.category} · {featured.minutes} min read · {fmt(featured.date)}
            </p>
            <h2 className="mt-4 text-display-2">
              <span className="t-inscribe block text-[0.5em] text-bone">{featured.title[0]}</span>
              <span className="t-voice block text-gold transition-colors group-hover:text-bone">{featured.title[1]}</span>
            </h2>
            <ScrollRevealText className="t-story mt-6 text-sand">{featured.dek}</ScrollRevealText>
            <span className="label mt-8 inline-flex items-center gap-3 text-gold">
              Read the story <Arrow className="transition-transform group-hover:translate-x-1" />
            </span>
          </div>
        </Link>
      </section>

      {/* Interactive Viscous Liquid Simulation Canvas */}
      <ViscousLiquidCanvas
        id="journal-viscous-liquid"
        label="REEL 14B · INTERACTIVE ARENA LIQUID DYNAMICS"
        title="The Viscous Fluid Sovereign"
        subtitle="Hover and sweep across the canvas to interact with Navier-Stokes fluid tension, chromatic dispersion, and viscous return mechanics."
        imageUrl="/images/black-marwari-stallion.webp"
        fullScreen={true}
        tone="dark"
      />

      {/* Editorial list: alternating image side, no cards */}
      <section aria-label="All stories" className="gutter mt-24 pb-[clamp(6rem,14vh,12rem)]">
        <ol className="border-t border-line">
          {rest.map((p, i) => (
            <Reveal as="li" key={p.slug}>
              <Link href={`/journal/${p.slug}`} className="group grid items-center gap-6 border-b border-line py-8 md:grid-cols-[4rem_minmax(0,1fr)_14rem] md:gap-10">
                <span className="font-mono text-sm text-dust">{String(i + 2).padStart(2, "0")}</span>
                <div>
                  <p className="label text-brass">
                    {p.category} · {p.minutes} min
                  </p>
                  <p className="t-voice mt-2 text-[clamp(1.5rem,3vw,2.6rem)] leading-tight text-bone transition-colors group-hover:text-gold">{p.title.join(" ")}</p>
                  <p className="mt-3 max-w-2xl text-sand">{p.dek}</p>
                </div>
                <div className="relative aspect-[4/3] overflow-hidden">
                  <FilmImage name={p.cover} sizes="14rem" className="transition-transform duration-[1600ms] group-hover:scale-[1.06]" />
                </div>
              </Link>
            </Reveal>
          ))}
        </ol>
      </section>

      <EndCard current={15} />
    </>
  );
}
