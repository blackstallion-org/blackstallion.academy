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
    // R25 (2 Nov 2026): a plain heading at reading size above the stories (it was an 11rem extra-bold all-caps line under them),
    // and the stories in sentence case so they can be read.
    return (
      <section id={id} aria-labelledby={`${id}-h`} className="bg-paper py-[clamp(4rem,8vw,7rem)] text-ink">
        <div className="gutter">
          <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-3 border-b border-ink/25 pb-5">
            <h2 id={`${id}-h`} className="t-voice text-[clamp(2rem,4vw,3.25rem)] leading-[1.05]">
              {title}
            </h2>
            <p className="font-sans text-[0.72rem] font-semibold uppercase tracking-[0.06em] text-ink/70">{label}</p>
          </div>
          {intro ? <p className="t-story mt-4 max-w-xl text-ink/75">{intro}</p> : null}
          <ol className={cn("mt-10 grid gap-x-4 gap-y-10 sm:grid-cols-2", items.length === 3 ? "lg:grid-cols-3" : "xl:grid-cols-4")}>
            {items.map((item, index) => (
              <li key={item.title} className="min-w-0">
                <div className="relative aspect-[4/3] overflow-hidden bg-ink/10 [&_img]:grayscale">
                  <FilmImage name={item.image} sizes="(min-width: 1280px) 25vw, (min-width: 640px) 48vw, 92vw" grade="none" />
                </div>
                <div className="mt-4 grid grid-cols-[2rem_minmax(0,1fr)] gap-x-2">
                  <span className="font-sans text-[0.72rem] font-semibold tabular-nums text-ink/60">{String(index + 1).padStart(2, "0")}</span>
                  <div className="min-w-0">
                    <h3 className="t-voice text-xl leading-snug">{item.title}</h3>
                    <p className="t-story mt-1 max-w-[38ch] text-[0.95rem] leading-relaxed text-ink/75">{item.copy}</p>
                    {item.href && item.cta ? (
                      <Link href={item.href} className="mt-3 inline-block border-b border-ink pb-0.5 font-sans text-[0.72rem] font-semibold uppercase tracking-[0.06em] hover:text-ink/60">
                        {item.cta} →
                      </Link>
                    ) : null}
                  </div>
                </div>
              </li>
            ))}
          </ol>
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
