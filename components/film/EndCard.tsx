import Link from "next/link";
import { acts, nextReel, TOTAL_REELS } from "@/lib/content/site";
import type { MediaKey } from "@/lib/content/media";
import { DeckCorners, DeckFrame, DeckLockup } from "./Deck";
import { FilmImage } from "./FilmImage";
import { Arrow } from "./Marks";

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * The end card: hands the visitor to the next reel (Blueprint 2.2). The whole card is one link.
 * 30 Oct 2026: set as a deck slide after the owner's references, the next reel's still full-bleed in a dark panel on an ivory
 * margin, its title as one centred lockup (capitals woven with a script word, flanked "Next · Reel 10"), corners for act and folio.
 */
export function EndCard({ current, image }: { current: number; image?: MediaKey }) {
  const next = nextReel(current);
  const imageKey = image || next.image;

  return (
    <section aria-label="Next reel">
      <DeckFrame>
        <Link href={next.href} className="group relative block focus-visible:outline-offset-[-8px]">
          <div className="relative flex min-h-[78svh] items-center justify-center overflow-hidden px-6 py-28">
            <FilmImage name={imageKey} grade="deep" sizes="100vw" className="transition-transform duration-[2400ms] group-hover:scale-[1.03]" />
            <div aria-hidden className="absolute inset-0 bg-night/55" />
            <div aria-hidden className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_50%_50%,transparent_0%,color-mix(in_srgb,var(--color-night)_70%,transparent)_100%)]" />

            <DeckLockup caps={next.inscription.replace(/,$/, "")} script={next.voice} left="Next" right={`Reel ${pad(next.n)}`} sub={next.title} className="relative z-10" />

            <DeckCorners
              tag={`Act ${acts[next.act].numeral} · ${acts[next.act].name}`}
              folio={`${pad(current)} / ${TOTAL_REELS}`}
              foot={
                <span className="t-ui flex max-w-[min(26rem,60vw)] items-center gap-3 text-sm text-sand">
                  {next.blurb}
                  <Arrow className="h-3 w-8 shrink-0 text-gold transition-transform duration-500 group-hover:translate-x-2" />
                </span>
              }
            />
          </div>
        </Link>
      </DeckFrame>
    </section>
  );
}
