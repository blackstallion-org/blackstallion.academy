import Link from "next/link";
import { FilmImage } from "@/components/film/FilmImage";
import { Arrow, Cta } from "@/components/film/Marks";
import type { MediaKey } from "@/lib/content/media";

type Door = {
  id: string;
  who: string;
  chip: string;
  title: string;
  tagline: string;
  image: MediaKey;
  href: string;
  cta: string;
  /** Where each door leads first: real pages only, one line each. */
  paths: { label: string; href: string }[];
};

const DOORS: Door[] = [
  {
    id: "door-parents",
    who: "For parents",
    chip: "I am a parent",
    title: "The Guardian",
    tagline: "Watch your cadet's journey from the rail. Planned for the parent app: 24/7 stall-cams, gate alerts and verified session reels.",
    image: "parentsRail",
    href: "/parents",
    cta: "Enter as a parent",
    paths: [
      { label: "How safety is taught", href: "/safety" },
      { label: "What a session looks like", href: "/curriculum" },
    ],
  },
  {
    id: "door-cadets",
    who: "For cadets",
    chip: "I am a cadet",
    title: "The Hall of Valour",
    tagline: "A sealed leather passport, your own Marwari stallion, and the national circuit.",
    image: "cadetZayd",
    href: "/cadets",
    cta: "Enter as a cadet",
    paths: [
      { label: "The curriculum, phase by phase", href: "/curriculum" },
      { label: "The circuit and tournaments", href: "/tournaments" },
    ],
  },
  {
    id: "door-schools",
    who: "For schools",
    chip: "We are a school",
    title: "The Zero-CapEx Engine",
    tagline: "Turnkey campus riding arena funded, built, and operated by BSAH with zero school expenditure.",
    image: "schoolArenaNight",
    href: "/schools",
    cta: "Enter as a school",
    paths: [
      { label: "The campus arena, explained", href: "/schools" },
      { label: "Start the conversation", href: "/contact" },
    ],
  },
];

/**
 * Reel 04 · Three doors. One choice, made quickly: a chip row to jump to your door, then three portrait doors, each with its
 * photograph, one line, two next steps and one solid call to action. Photographs sit alone; words sit below them.
 */
export function Doors() {
  return (
    <section id="doors" aria-labelledby="doors-h" className="tone-dark bg-night py-[clamp(5rem,10vw,9rem)]">
      <div className="gutter">
        <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-8">
          <div>
            <p className="label text-brass">REEL 04 · THREE DOORS</p>
            <h2 id="doors-h" className="t-voice mt-4 max-w-3xl text-[clamp(2.5rem,6vw,5.75rem)] leading-[.98] text-bone">
              Through the Gate
            </h2>
            <p className="t-story mt-5 max-w-xl text-lede text-sand">Choose the part of the academy you want to explore.</p>
          </div>
          <nav aria-label="Choose your door" className="flex flex-wrap gap-3">
            {DOORS.map((d) => (
              <a
                key={d.id}
                href={`#${d.id}`}
                className="label inline-flex min-h-11 items-center border border-line/50 px-4 text-sand transition-colors duration-300 hover:border-gold hover:text-gold"
              >
                {d.chip}
              </a>
            ))}
          </nav>
        </div>

        <ol className="mt-12 grid gap-x-6 gap-y-14 md:grid-cols-3">
          {DOORS.map((d, i) => (
            <li key={d.id} className="min-w-0 scroll-mt-28">
              <article id={d.id} aria-labelledby={`${d.id}-h`} className="flex h-full flex-col">
                <Link href={d.href} tabIndex={-1} aria-hidden className="group relative block aspect-[4/5] overflow-hidden bg-umber">
                  <FilmImage name={d.image} sizes="(min-width: 768px) 30vw, 92vw" grade="none" />
                </Link>
                <p className="label mt-6 text-brass">
                  <span className="font-mono text-gold">{String(i + 1).padStart(2, "0")}</span> · {d.who}
                </p>
                <h3 id={`${d.id}-h`} className="t-voice mt-2 text-[clamp(1.75rem,2.6vw,2.5rem)] leading-tight text-bone">
                  {d.title}
                </h3>
                <p className="t-story mt-3 max-w-[40ch] text-sand">{d.tagline}</p>
                <div className="mt-auto pt-6">
                <ul className="divide-y divide-line/30 border-y border-line/30">
                  {d.paths.map((p) => (
                    <li key={p.label}>
                      <Link href={p.href} className="group flex min-h-11 items-center justify-between gap-4 py-3 text-sm text-sand transition-colors duration-300 hover:text-bone">
                        <span>{p.label}</span>
                        <Arrow className="text-brass transition-transform duration-500 group-hover:translate-x-1 group-hover:text-gold" />
                      </Link>
                    </li>
                  ))}
                </ul>
                <div className="pt-8">
                  <Cta href={d.href} variant="solid">
                    {d.cta}
                  </Cta>
                </div>
                </div>
              </article>
            </li>
          ))}
        </ol>

        <p className="t-story mt-14 border-t border-line/30 pt-8 text-sand">
          Not sure which door? <Cta href="/contact" variant="link" className="ml-2">Talk to the academy</Cta>
        </p>
      </div>
    </section>
  );
}
