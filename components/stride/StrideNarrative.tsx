import Link from "next/link";
import { forwardRef } from "react";
import { Headline } from "@/components/film/Headline";
import { Label, Cta } from "@/components/film/Marks";
import { Reveal } from "@/components/film/Reveal";
import { chapters, notes, strideCopy } from "@/lib/content/stride";
import { AUTHORED_FOOTFALLS, LIMBS, LIMB_SHORT } from "@/lib/stride/constants";
import { cn } from "@/lib/utils";

/** The opening: the headline, one paragraph, and a cue. The horse and rider stand behind it (or above it on a phone). */
export const Opening = forwardRef<HTMLElement, { pinned: boolean; /** Inside another page (the science page owns the h1). */ embedded?: boolean }>(function Opening({ pinned, embedded }, ref) {
  return (
    <section
      ref={ref}
      aria-labelledby="stride-title"
      className={cn("gutter relative flex flex-col justify-end pb-12 pt-8 lg:justify-center lg:pb-24 lg:pt-32", pinned ? "lg:min-h-svh" : "")}
    >
      <div className="max-w-[46rem]">
        <p className="label text-brass">The science of the stride</p>
        <Headline
          as={embedded ? "h2" : "h1"}
          id="stride-title"
          size="1"
          animate="mount"
          className="mt-5"
          inscription={strideCopy.headline.inscription}
          voice={strideCopy.headline.voice}
        />
        <p className="mt-7 max-w-[30rem] text-[1.1rem] leading-[1.6] text-sand sm:text-[1.2rem]">{strideCopy.lede}</p>
        <p className="label mt-8 flex max-w-[26rem] items-start gap-4 text-dust">
          <span aria-hidden className="mt-[0.45em] h-px w-10 shrink-0 bg-brass/60" />
          <span>Four beats · about a hundred movements a minute · one horse, one rider</span>
        </p>
      </div>
      <p className="label mt-12 hidden items-center gap-4 text-dust lg:flex" aria-hidden>
        <span className="h-10 w-px bg-brass/50" />
        {strideCopy.scrollCue}
      </p>
    </section>
  );
});

type ChapterProps = { index: number; pinned: boolean };

export const Chapter = forwardRef<HTMLElement, ChapterProps>(function Chapter({ index, pinned }, ref) {
  const c = chapters[index];
  return (
    <section ref={ref} aria-labelledby={`chapter-${c.id}`} className={cn("gutter relative flex items-center py-16", pinned ? "lg:min-h-[88svh]" : "")}>
      <Reveal className="max-w-[25rem]">
        <p className="flex items-center gap-4">
          <span className="font-mono text-[0.8rem] tracking-[0.12em] text-gold">{c.number}</span>
          <span aria-hidden className="h-px w-10 bg-gold/70" />
        </p>
        <h2 id={`chapter-${c.id}`} className="t-inscribe mt-4 text-display-3 leading-[1.12] text-bone">
          {c.title}
        </h2>
        <p className="mt-5 text-[1.06rem] leading-[1.65] text-sand">{c.body}</p>
      </Reveal>
    </section>
  );
});

/** The four-beat sequence drawn from the authored footfall table: shown before the animation loads and when 3D is unavailable. */
export function StaticFootfalls({ className }: { className?: string }) {
  const W = 560;
  const L = 44;
  const x = (p: number) => L + p * (W - L - 10);
  return (
    <figure className={className}>
      <svg viewBox={`0 0 ${W} 112`} role="img" aria-label="Footfall diagram of the walk: left hind, left fore, right hind, right fore land one quarter of a stride apart, and each stays down for a little over half the stride." className="w-full">
        {LIMBS.map((l, i) => {
          const f = AUTHORED_FOOTFALLS[l];
          const top = 8 + i * 24;
          const end = f.start + f.duty;
          const parts = end <= 1 ? [[f.start, end]] : [[f.start, 1], [0, end - 1]];
          return (
            <g key={l}>
              <text x={L - 8} y={top + 12} textAnchor="end" className="fill-dust font-mono" fontSize={10}>
                {LIMB_SHORT[l]}
              </text>
              <line x1={x(0)} x2={x(1)} y1={top + 8} y2={top + 8} stroke="var(--color-line)" />
              {parts.map(([a, b], k) => (
                <rect key={k} x={x(a)} y={top} width={x(b) - x(a)} height={16} fill={l === "FR" || l === "HR" ? "var(--color-brass)" : "var(--color-bone)"} opacity={0.82} />
              ))}
            </g>
          );
        })}
        <text x={x(0)} y={108} className="fill-dust font-mono" fontSize={10}>0%</text>
        <text x={x(1)} y={108} textAnchor="end" className="fill-dust font-mono" fontSize={10}>100% of one stride</text>
      </svg>
      <figcaption className="t-ui mt-2 text-[0.78rem] italic text-dust">Authored footfall table for the walk. The animation draws its own from the horse’s hooves once it has loaded.</figcaption>
    </figure>
  );
}

/** What the page shows and what it does not: the honest part, in plain sentences, and the way back. */
export function Notes() {
  return (
    <section aria-labelledby="notes-h" className="gutter relative border-t border-line py-[clamp(5rem,12vh,10rem)]">
      <div className="grid gap-14 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
        <div className="lg:sticky motion-reduce:lg:static lg:top-28 lg:self-start">
          <Label>The honest part</Label>
          <h2 id="notes-h" className="t-inscribe mt-4 text-display-3 leading-[1.1] text-bone">
            {notes.title}
          </h2>
          <p className="mt-5 max-w-sm text-sand">Every figure on this page can be traced to the animation or to the claims ledger. If we cannot source it, we do not say it.</p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Cta href="/science" variant="ghost">The science, and how sure we are</Cta>
            <Cta href="/anatomy" variant="link">One conversation, two bodies</Cta>
          </div>
        </div>
        <dl className="border-t border-line">
          {notes.items.map((item, i) => (
            <Reveal as="div" key={item.head} delay={i * 0.04} className="grid gap-2 border-b border-line py-6 sm:grid-cols-[9rem_1fr] sm:gap-8">
              <dt className="label text-gold">{item.head}</dt>
              <dd className="text-[1.04rem] leading-[1.65] text-sand">{item.body}</dd>
            </Reveal>
          ))}
        </dl>
      </div>
      <p className="t-ui mt-12 text-[0.85rem] text-dust">
        Looking for the other 3D horses? <Link href="/anatomy" className="underline decoration-brass/40 underline-offset-4 hover:text-gold">The anatomy exhibit</Link> and the stallion on the <Link href="/" className="underline decoration-brass/40 underline-offset-4 hover:text-gold">home page</Link> are separate studies.
      </p>
    </section>
  );
}
