import { FilmImage } from "@/components/film/FilmImage";
import type { MediaKey } from "@/lib/content/media";
import type { TierId } from "@/lib/content/schools";
import { cn } from "@/lib/utils";

const PHOTO: Record<TierId, { image: MediaKey; line: string }> = {
  standard: { image: "hubStandard", line: "Four stables, a sand arena, a few lanterns." },
  signature: { image: "hubSignature", line: "The arena under a roof, whatever the weather." },
  royal: { image: "hubRoyal", line: "Carved stone, an arch for every horse." },
};

/**
 * One photograph of the chosen tier under the model. All three stay mounted and cross-fade, so a change of tier never waits for a download.
 * The stills are Higgsfield illustrations (placeholder art until the shoot), and the caption says so.
 */
export function CampusPhoto({ tierId, className }: { tierId: TierId; className?: string }) {
  return (
    <figure className={cn("relative aspect-[4/3] overflow-hidden border border-line sm:aspect-[16/8]", className)}>
      {(Object.keys(PHOTO) as TierId[]).map((id) => (
        <div key={id} aria-hidden={id !== tierId} className={cn("absolute inset-0 transition-opacity duration-[900ms] motion-reduce:transition-none", id === tierId ? "opacity-100" : "opacity-0")}>
          <FilmImage name={PHOTO[id].image} grade="film" sizes="(min-width: 1280px) 1200px, 100vw" />
        </div>
      ))}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2"
        style={{ background: "linear-gradient(to top, color-mix(in srgb, var(--color-night) 70%, transparent), transparent)" }}
      />
      <figcaption className="tone-dark absolute inset-x-0 bottom-0 flex flex-wrap items-end justify-between gap-x-6 gap-y-1 px-4 pb-4 sm:px-6 sm:pb-5">
        <span className="t-voice text-xl leading-tight text-bone sm:text-2xl">{PHOTO[tierId].line}</span>
        <span className="font-mono text-[0.65rem] uppercase tracking-[0.16em] text-sand">Illustration, placeholder art</span>
      </figcaption>
    </figure>
  );
}
