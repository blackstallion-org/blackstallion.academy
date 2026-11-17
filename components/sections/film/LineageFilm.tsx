"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { ArrowRight, Play } from "lucide-react";
import { lineageChapters as chapters, lineageFilm as film } from "@/lib/content/lineage-film";
import { cn } from "@/lib/utils";

const RING = "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold";
const clock = (s: number) => `0:${String(Math.floor(s)).padStart(2, "0")}`;

/**
 * The intro film on /film: a 16:9 frame (the film's own titles sit inside the picture, so it is never cropped) with the
 * browser's own controls, which are keyboard and screen-reader accessible. It never plays by itself: the visitor presses play,
 * so sound is allowed and reduced motion is respected. Beside it, the ten chapters: each jumps the film to its scene and links
 * to the page that scene comes from.
 */
export function LineageFilm() {
  const video = useRef<HTMLVideoElement>(null);
  const [now, setNow] = useState(0);
  const [started, setStarted] = useState(false);

  const current = chapters.reduce((i, c, k) => (now >= c.at ? k : i), 0);

  const seek = (at: number) => {
    const v = video.current;
    if (!v) return;
    v.currentTime = at;
    v.play().catch(() => undefined);
    v.focus({ preventScroll: true });
  };

  return (
    <section aria-label="The film" className="bg-night">
      <div className="gutter grid gap-10 py-14 md:py-20 xl:grid-cols-[minmax(0,1fr)_22rem] xl:gap-12">
        {/* On wide screens the film stays in view while the chapter list beside it scrolls. */}
        <div className="xl:sticky xl:top-28 xl:self-start">
          <div className="relative aspect-video w-full overflow-hidden border border-gold/25 bg-[rgb(var(--shade-rgb))]">
            <video
              ref={video}
              className="absolute inset-0 h-full w-full"
              controls
              playsInline
              preload="metadata"
              poster={film.poster}
              aria-label={`${film.label}, the intro film of the website, one minute`}
              onPlay={() => setStarted(true)}
              onTimeUpdate={(e) => setNow(e.currentTarget.currentTime)}
            >
              <source media="(max-width: 767px)" src={film.mobile} type="video/mp4" />
              <source src={film.desktop} type="video/mp4" />
            </video>
            {!started && (
              <button
                type="button"
                onClick={() => seek(0)}
                aria-label={`Play ${film.label}`}
                className={cn(
                  "absolute left-1/2 top-1/2 hidden h-16 w-16 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-gold/50 bg-[rgb(var(--shade-rgb)/0.6)] text-bone transition-colors hover:border-gold hover:text-gold md:grid md:h-20 md:w-20",
                  RING,
                )}
              >
                <Play size={24} strokeWidth={1.4} aria-hidden className="translate-x-[2px]" />
              </button>
            )}
          </div>
          <p className="mt-4 font-mono text-xs uppercase tracking-[0.14em] text-dust">
            {film.label} · 1 min · sound on
          </p>
        </div>

        <nav aria-label="Chapters of the film">
          <p className="label border-b border-line pb-3 text-brass">In the film</p>
          <ol>
            {chapters.map((c, i) => (
              <li key={c.at} className="border-b border-line py-3">
                <button
                  type="button"
                  onClick={() => seek(c.at)}
                  aria-current={started && i === current ? "true" : undefined}
                  className={cn("group flex w-full items-baseline gap-4 text-left", RING)}
                >
                  <span className="w-10 shrink-0 font-mono text-xs text-dust">{clock(c.at)}</span>
                  <span className="min-w-0">
                    <span className={cn("label block transition-colors group-hover:text-gold", started && i === current ? "text-gold" : "text-bone")}>{c.place}</span>
                    <span className="t-story mt-1 block text-sm italic leading-snug text-sand">{c.scene}</span>
                  </span>
                </button>
                {c.href && c.pageTitle && (
                  <Link href={c.href} className={cn("label ml-14 mt-2 inline-flex min-h-8 items-center gap-1.5 text-[0.68rem] text-dust transition-colors hover:text-gold", RING)}>
                    {c.pageTitle} <ArrowRight size={12} strokeWidth={1.6} aria-hidden />
                  </Link>
                )}
              </li>
            ))}
          </ol>
        </nav>
      </div>
    </section>
  );
}
