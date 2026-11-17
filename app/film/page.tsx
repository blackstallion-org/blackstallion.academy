import type { Metadata } from "next";
import Link from "next/link";
import { Headline } from "@/components/film/Headline";
import { LineageFilm } from "@/components/sections/film/LineageFilm";
import { lineageCredits } from "@/lib/content/lineage-film";
import { introFilm } from "@/lib/content/site";

export const metadata: Metadata = {
  alternates: { canonical: "/film" },
  title: "Intro film: The Lineage",
  description:
    "The whole website in one minute: the Marwar, the Mughal stables, Haldighati, Jhansi, Alexander and the Silk Roads, painted, and a cadet today.",
};

/**
 * /film: the intro film of the whole website ("The Lineage", built in video/). Not a reel: no reel mark or end card. Its menu
 * entry is `introFilm` in site.ts.
 */
export default function FilmPage() {
  return (
    <>
      <section aria-labelledby="film-h" className="bg-night">
        <div className="gutter pb-10 pt-28 md:pb-14 md:pt-36">
          <p className="label text-brass">{introFilm.label} · {introFilm.line}</p>
          <Headline id="film-h" as="h1" size="2" animate="mount" inscription="An 800-year lineage," voice="handed to your child." className="mt-5" />
          <p className="t-story mt-6 max-w-[38rem] text-lg leading-relaxed text-sand">
            One minute across the paintings of this website: the Marwar, the Shalihotra tradition and the Mughal stables, Haldighati,
            Jhansi, Alexander and the Silk Roads, and then a cadet today. Each chapter opens the page it comes from.
          </p>
        </div>
      </section>

      <LineageFilm />

      <section aria-label="Credits" className="bg-night">
        <div className="gutter py-10">
          <p className="max-w-[60rem] text-xs leading-relaxed text-dust">{lineageCredits}</p>
          <Link href="/" className="mt-5 inline-flex min-h-11 items-center border-b border-current text-xs uppercase tracking-[0.12em] text-bone hover:text-gold">
            Return to the academy
          </Link>
        </div>
      </section>
    </>
  );
}
