import type { Metadata } from "next";
import Link from "next/link";
import { EndCard } from "@/components/film/EndCard";
import { FilmImage } from "@/components/film/FilmImage";
import { Arrow, ReelMark } from "@/components/film/Marks";
import { Reveal } from "@/components/film/Reveal";
import { SpotlightRevealHero } from "@/components/film/SpotlightRevealHero";
import { mediaSrc } from "@/lib/content/media";
import { posts } from "@/lib/content/journal";

export const metadata: Metadata = {
  title: "The Chronicle · Layers Hold Tales of Time",
  description: "Stories from the stable: the Marwari's legends, the science of the saddle and life on the circuit.",
};

const fmt = (d: string) => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });

export default function JournalPage() {
  const [featured, ...rest] = posts;

  const baseImage = mediaSrc("bgFort") || "/media/bg-fort.png";
  const revealImage = mediaSrc("legendCavalry") || mediaSrc("heroDust") || "/media/legend-cavalry.png";

  return (
    <>
      {/* Top Page Section · Spotlight Dual-Layer Reveal */}
      <SpotlightRevealHero
        baseImage={baseImage}
        revealImage={revealImage}
        tagline="The Chronicle · Stories From The Stable"
        titleItalic="Layers hold"
        titleRegular="tales of time"
        leftDek="Every layer of desert sand records a chapter of our bloodline, from ancient cavalry battlefields to the national circuit, layered across eight centuries beneath us."
        rightDek="Our chronicle dispatches let you peel back the dust to uncover how horses, courage, and deep time combine to shape the spirit of Black Stallion Academy."
        ctaText="Start Exploring"
        ctaHref="#articles"
      />

      {/* T15 · Masthead */}
      <header id="articles" className="gutter pt-20 md:pt-28 scroll-mt-12">
        <ReelMark n={14} act="ledger" />
        <div className="mt-8 border-y-2 border-double border-line py-6 text-center">
          <p className="label text-dust">Hyderabad · Vol. I · Stories from the stable</p>
          <h1 className="t-inscribe mt-3 text-[clamp(1.9rem,8vw,8.5rem)] leading-none text-bone">The Chronicle</h1>
          <p className="label mt-3 text-brass">Legend · Academy · Circuit</p>
        </div>
      </header>

      {/* Featured */}
      <section aria-label="Featured story" className="gutter mt-12">
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
            <p className="t-story mt-6 text-sand">{featured.dek}</p>
            <span className="label mt-8 inline-flex items-center gap-3 text-gold">
              Read the story <Arrow className="transition-transform group-hover:translate-x-1" />
            </span>
          </div>
        </Link>
      </section>

      {/* Field Dispatch Motion Reel */}
      <section aria-label="Field motion dispatch" className="gutter mt-16 md:mt-24">
        <div className="relative overflow-hidden rounded-[2px] border border-gold/30 bg-[#0F0E0D] shadow-[0_24px_60px_-15px_rgba(0,0,0,0.7)]">
          <div className="relative aspect-[16/9] lg:aspect-[21/9] w-full overflow-hidden">
            <video
              src="https://d8j0ntlcm91z4.cloudfront.net/user_3KHOl32PLtCsaNMEkJTP0HHT06X/hf_20261009_002919_571f23fa-14a9-4d0b-bbe3-19f4311054d8.mp4"
              autoPlay
              loop
              muted
              playsInline
              preload="auto"
              className="h-full w-full object-cover"
            />
            <div aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
            <div className="absolute left-6 right-6 bottom-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <span className="font-mono text-[0.68rem] uppercase tracking-[0.22em] text-gold font-bold">
                  Field Dispatch · Cinema Reel
                </span>
                <h3 className="font-display text-2xl md:text-3xl text-bone mt-1 m-0">
                  The Sovereign Gallop across the Thar
                </h3>
              </div>
              <p className="font-serif text-xs md:text-sm text-sand/90 max-w-md m-0 leading-relaxed">
                A purebred Marwari stallion at full gallop in Rajasthan. Eight hundred years of desert agility captured in golden hour dust.
              </p>
            </div>
          </div>
        </div>
      </section>

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

      <EndCard current={14} />
    </>
  );
}
