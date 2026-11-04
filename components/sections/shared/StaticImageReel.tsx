import Link from "next/link";
import { FilmImage } from "@/components/film/FilmImage";
import type { MediaKey } from "@/lib/content/media";

export type StaticImageReelItem = {
  image: MediaKey;
  title: string;
  copy: string;
  href?: string;
  cta?: string;
};

/** A quiet, responsive image reel: photographs and their words never compete for the same space. */
export function StaticImageReel({
  id,
  label,
  title,
  intro,
  items,
}: {
  id: string;
  label: string;
  title: string;
  intro?: string;
  items: StaticImageReelItem[];
}) {
  return (
    <section id={id} aria-labelledby={`${id}-h`} className="tone-dark bg-night py-[clamp(5rem,10vw,9rem)]">
      <div className="gutter">
        <p className="label text-brass">{label}</p>
        <h2 id={`${id}-h`} className="t-voice mt-4 max-w-3xl text-[clamp(2.5rem,6vw,5.75rem)] leading-[.98] text-bone">{title}</h2>
        {intro ? <p className="t-story mt-5 max-w-2xl text-lede text-sand">{intro}</p> : null}
        <ol className="mt-12 grid gap-x-6 gap-y-12 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((item, index) => (
            <li key={item.title} className="min-w-0">
              <div className="relative aspect-[4/3] overflow-hidden bg-umber">
                <FilmImage name={item.image} sizes="(min-width: 1280px) 29vw, (min-width: 640px) 45vw, 92vw" grade="none" />
              </div>
              <p className="label mt-5 text-brass">{String(index + 1).padStart(2, "0")}</p>
              <h3 className="t-voice mt-2 text-[clamp(1.65rem,2.7vw,2.5rem)] leading-tight text-bone">{item.title}</h3>
              <p className="t-story mt-3 max-w-[42ch] text-sand">{item.copy}</p>
              {item.href && item.cta ? <Link href={item.href} className="label mt-5 inline-block border-b border-line pb-1 text-gold hover:border-gold hover:text-bone">{item.cta}</Link> : null}
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
