import Link from "next/link";
import { acts, nextReel, TOTAL_REELS } from "@/lib/content/site";
import { FilmImage } from "./FilmImage";
import { Arrow } from "./Marks";

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * The end card: hands the visitor to the next reel (Blueprint 2.2).
 * The whole card is one link; the progress bar shows how far through the film they are.
 * Always a dark cinematic scene: with the footer it forms the dark coda of every page.
 */
export function EndCard({ current }: { current: number }) {
  const next = nextReel(current);
  const progress = (current / TOTAL_REELS) * 100;

  return (
    <section aria-label="Next reel" className="tone-dark relative bg-night">
      <Link
        href={next.href}
        className="group relative block h-[78svh] min-h-[520px] overflow-hidden focus-visible:outline-offset-[-8px]"
      >
        <FilmImage
          name={next.image}
        />
        <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-night via-night/40 to-transparent" />
        <div className="gutter relative flex h-full flex-col justify-end pb-[10vh]">
          <p className="label text-brass">
            Next · <span className="font-mono tracking-[0.12em] text-gold">Reel {pad(next.n)}</span> · Act {acts[next.act].numeral}
          </p>
          <p className="mt-5 text-display-1">
            <span className="t-inscribe block text-[0.5em] leading-tight">{next.inscription}</span>
            <span className="t-voice block text-gold">{next.voice}</span>
          </p>
          <p className="mt-6 flex items-center gap-4 text-lede text-sand">
            {next.title} — {next.blurb}
            <Arrow className="h-3 w-8 text-gold transition-transform duration-500 group-hover:translate-x-2" />
          </p>
          <div className="mt-10 flex items-center gap-4">
            <span className="font-mono text-xs text-dust">{pad(current)}</span>
            <span className="relative h-px flex-1 bg-line/20">
              <span className="absolute inset-y-0 left-0 bg-gold" style={{ width: `${progress}%` }} />
            </span>
            <span className="font-mono text-xs text-dust">{TOTAL_REELS}</span>
          </div>
        </div>
      </Link>
    </section>
  );
}
