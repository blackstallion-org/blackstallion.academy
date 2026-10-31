import Link from "next/link";
import { FilmImage } from "@/components/film/FilmImage";
import type { MediaKey } from "@/lib/content/media";
import { cn } from "@/lib/utils";

export type StaticImageReelItem = {
  image: MediaKey;
  title: string;
  copy: string;
  href?: string;
  cta?: string;
};

/**
 * A quiet, responsive image reel: photographs and their words never compete for the same space.
 * Two compositions of one system (31 Oct 2026, owner's references):
 * - "views": the campus reference. Warm black ground, two equal columns, each still unobstructed and in its own colour,
 *   then a small number, an italic serif title and the description.
 * - "editorial": the Swiss fashion-editorial reference. Off-white paper, black ink, one row of stills in black and white,
 *   compact uppercase captions beneath and an oversized sans heading. No cards, rounding, shadows or gradients in either.
 */
export function StaticImageReel({
  id,
  label,
  title,
  intro,
  items,
  variant = "views",
}: {
  id: string;
  label: string;
  title: string;
  intro?: string;
  items: StaticImageReelItem[];
  variant?: "views" | "editorial";
}) {
  if (variant === "editorial") {
    return (
      <section id={id} aria-labelledby={`${id}-h`} className="bg-paper py-[clamp(4rem,8vw,7rem)] text-ink">
        <div className="gutter">
          <ol className={cn("grid gap-x-3 gap-y-10 sm:grid-cols-2", items.length === 3 ? "lg:grid-cols-3" : "xl:grid-cols-4")}>
            {items.map((item, index) => (
              <li key={item.title} className="min-w-0">
                <div className="relative aspect-[4/3] overflow-hidden bg-ink/10 [&_img]:grayscale">
                  <FilmImage name={item.image} sizes="(min-width: 1280px) 25vw, (min-width: 640px) 48vw, 92vw" grade="none" />
                </div>
                <div className="mt-4 grid grid-cols-[2.25rem_minmax(0,1fr)] gap-x-2 font-sans text-[0.72rem] font-semibold uppercase leading-[1.45] tracking-[0.04em]">
                  <span className="tabular-nums">{String(index + 1).padStart(2, "0")}</span>
                  <div className="min-w-0">
                    <h3 className="font-bold">{item.title}</h3>
                    <p className="mt-1 max-w-[38ch] font-medium text-ink/70">{item.copy}</p>
                    {item.href && item.cta ? (
                      <Link href={item.href} className="mt-3 inline-block border-b border-ink pb-0.5 hover:text-ink/60">
                        {item.cta} →
                      </Link>
                    ) : null}
                  </div>
                </div>
              </li>
            ))}
          </ol>

          <div className="mt-[clamp(3rem,7vw,6rem)] flex flex-wrap items-end justify-between gap-x-10 gap-y-4 border-t border-ink pt-4">
            <p className="font-sans text-[0.72rem] font-semibold uppercase tracking-[0.06em]">{label}</p>
            {intro ? <p className="max-w-md font-sans text-[0.72rem] font-medium uppercase leading-[1.5] tracking-[0.04em] text-ink/70">{intro}</p> : null}
          </div>
          <h2
            id={`${id}-h`}
            className="mt-2 font-sans text-[clamp(3.2rem,11.5vw,11rem)] font-extrabold uppercase leading-[0.86] tracking-[-0.045em]"
          >
            {title}
          </h2>
        </div>
      </section>
    );
  }

  return (
    <section id={id} aria-labelledby={`${id}-h`} className="tone-dark bg-night py-[clamp(5rem,10vw,9rem)]">
      <div className="gutter">
        <p className="label text-brass">{label}</p>
        <h2 id={`${id}-h`} className="t-voice mt-4 max-w-4xl text-[clamp(2.75rem,6.5vw,6.25rem)] leading-[.98] text-bone">{title}</h2>
        {intro ? <p className="t-story mt-5 max-w-2xl text-lede text-sand">{intro}</p> : null}
        <ol className="mt-14 grid gap-x-7 gap-y-16 md:grid-cols-2">
          {items.map((item, index) => (
            <li key={item.title} className="min-w-0">
              <div className="relative aspect-[4/3] overflow-hidden">
                <FilmImage name={item.image} sizes="(min-width: 768px) 46vw, 92vw" grade="none" />
              </div>
              <p className="label mt-6 font-mono tracking-[0.14em] text-brass">{String(index + 1).padStart(2, "0")}</p>
              <h3 className="t-voice mt-3 text-[clamp(1.9rem,3.2vw,3rem)] leading-[1.08] text-bone">{item.title}</h3>
              <p className="t-story mt-3 max-w-[46ch] text-sand">{item.copy}</p>
              {item.href && item.cta ? (
                <Link href={item.href} className="label mt-5 inline-block border-b border-line pb-1 text-bone hover:border-bone">
                  {item.cta}
                </Link>
              ) : null}
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
