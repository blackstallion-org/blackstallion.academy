import Image from "next/image";
import Link from "next/link";
import { Headline } from "@/components/film/Headline";
import { Reveal } from "@/components/film/Reveal";
import { YouTubeFacade } from "@/components/sections/legend/YouTubeFacade";
import { asset } from "@/lib/content/asset";
import { film, origins } from "@/lib/content/marwari-origins";

const POSTER = asset("/images/story/marwari/poster.webp");
const POSTER_ALT =
  "A Rajasthani-style painting: a black Marwari stallion in an embroidered saddle cloth gallops through deep desert sand under a red sky, a fort on the ridge behind.";

/**
 * /legend · the opening (16 Nov 2026, owner's brief). Three movements, all above the painted journey:
 *  1. the title on the journey's key painting (dark, held by a gradient, the top 120 px clear of the nav);
 *  2. the film, behind a privacy-friendly poster, beside a short note on how the page uses it;
 *  3. five moments in the breed's making, each dated, folklore flagged as folklore, then the academy's closing commitment.
 * Facts and sources: lib/content/marwari-origins.ts.
 */
export function MarwariOrigins() {
  return (
    <>
      {/* 1 · Title */}
      <section aria-labelledby="legend-title" className="tone-photo relative isolate flex min-h-[100svh] flex-col justify-end overflow-hidden bg-night text-bone">
        <Image src={POSTER} alt={POSTER_ALT} fill priority sizes="100vw" className="-z-10 object-cover" style={{ objectPosition: "48% 45%" }} />
        <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-t from-night via-night/45 to-night/10" />
        <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-r from-night/70 via-night/10 to-transparent" />
        <div className="gutter pb-[clamp(3.5rem,10vh,7rem)] pt-32">
          <p className="label text-brass">{origins.label}</p>
          <Headline id="legend-title" as="h1" size="1" animate="mount" className="mt-5 max-w-[16ch]" inscription={origins.inscription} voice={origins.voice} />
          <p className="t-story mt-6 max-w-xl text-lg leading-relaxed text-sand md:text-xl">{origins.lede}</p>
          <div className="mt-9 flex flex-wrap items-center gap-3">
            <a href="#origins-film" className="label inline-flex min-h-11 items-center rounded-full bg-gold px-5 text-night hover:bg-bone focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold">
              Watch the film
            </a>
            <a href="#origins" className="label inline-flex min-h-11 items-center rounded-full border border-brass/60 px-5 text-bone hover:border-gold hover:text-gold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold">
              Read the story
            </a>
          </div>
        </div>
      </section>

      {/* 2 · The film */}
      <section id="origins-film" aria-labelledby="film-h" className="gutter relative scroll-mt-24 py-[clamp(5rem,12vh,9rem)]">
        <div className="grid gap-10 lg:grid-cols-12 lg:items-end lg:gap-14">
          <div className="lg:col-span-8">
            <YouTubeFacade
              id={film.id}
              title={film.title}
              poster={POSTER}
              posterAlt={POSTER_ALT}
              caption={`${film.title} · ${film.channel}, ${film.year} · ${film.minutes} min. The still is ours; the film plays from YouTube.`}
            />
          </div>
          <div className="lg:col-span-4">
            <p className="label text-brass">The film</p>
            <h2 id="film-h" className="t-voice mt-3 text-display-3 leading-[1.05] text-bone">
              How the Marwari came to be.
            </h2>
            <p className="t-story mt-5 text-lg leading-relaxed text-sand">{origins.filmIntro}</p>
          </div>
        </div>
      </section>

      {/* 3 · Five moments */}
      <section id="origins" aria-label="How the Marwari was made, in five moments" className="gutter relative scroll-mt-24 pb-[clamp(5rem,12vh,9rem)]">
        <ol className="border-t border-line">
          {origins.beats.map((b, i) => (
            <li key={b.when} className="grid gap-6 border-b border-line py-[clamp(3rem,7vh,5rem)] md:grid-cols-12 md:gap-10">
              <Reveal className="md:col-span-4">
                <p className="t-inscribe text-[clamp(2.4rem,5vw,4.4rem)] leading-none text-brass">{b.when}</p>
                <p className="font-mono mt-4 text-[0.65rem] tracking-[0.16em] text-dust">
                  {String(i + 1).padStart(2, "0")} · {b.tag.toUpperCase()}
                </p>
              </Reveal>
              <Reveal delay={0.08} className="md:col-span-7 md:col-start-6">
                <Headline as="h2" size="3" animate="none" inscription={b.inscription} voice={b.voice} />
                <p className="t-story mt-5 max-w-2xl text-lg leading-relaxed text-sand">{b.body}</p>
                {"marks" in b && b.marks && (
                  <dl className="mt-8 grid gap-x-8 gap-y-5 border-t border-line pt-6 sm:grid-cols-3">
                    {b.marks.map((m) => (
                      <div key={m.name}>
                        <dt className="label text-brass">{m.name}</dt>
                        <dd className="t-voice mt-2 text-lg leading-snug text-bone">{m.text}</dd>
                      </div>
                    ))}
                  </dl>
                )}
                {"link" in b && b.link && (
                  <Link href={b.link.href} className="label mt-6 inline-flex min-h-11 items-center text-gold underline decoration-brass/40 underline-offset-4 hover:text-bone">
                    {b.link.label} →
                  </Link>
                )}
              </Reveal>
            </li>
          ))}
        </ol>
        <p className="t-ui mt-6 max-w-3xl text-xs text-dust">{origins.sources}</p>
      </section>

      {/* Closing: the academy carries it forward */}
      <section aria-labelledby="carry-h" className="surface-paper relative py-[clamp(6rem,14vh,10rem)]">
        <div className="gutter grid gap-10 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-7">
            <Headline id="carry-h" size="2" inscription={origins.closing.inscription} voice={origins.closing.voice} />
            <p className="t-story mt-6 max-w-xl text-lg leading-relaxed text-sand">{origins.closing.body}</p>
          </div>
          <ol className="lg:col-span-4 lg:col-start-9">
            {origins.closing.commitments.map((c, i) => (
              <li key={c} className="flex items-baseline gap-4 border-t border-line py-4">
                <span className="font-mono text-xs text-brass">{String(i + 1).padStart(2, "0")}</span>
                <span className="t-voice text-xl text-bone">{c}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </>
  );
}
