import { FilmImage } from "@/components/film/FilmImage";
import { Label } from "@/components/film/Marks";
import { Reveal } from "@/components/film/Reveal";

/**
 * /about, the six truths (owner, 14 Nov 2026): a quiet numbered list beside one photograph, in place of the poster-size
 * italic paragraph that lit up word by word. Small numerals, body-size serif, hairline rules; the cadet and the bay
 * Marwari forehead to forehead carry the weight instead of the type.
 */
export function Truths({ lines, label }: { lines: string[]; label: string }) {
  return (
    <section aria-labelledby="truths-h" className="gutter relative py-[clamp(5rem,12vh,9rem)]">
      <div className="grid gap-12 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-center lg:gap-20">
        <div>
          <Label>{label}</Label>
          <h2 id="truths-h" className="sr-only">
            {label}
          </h2>
          <ol className="mt-8 border-t border-line">
            {lines.map((line, i) => (
              <Reveal as="li" key={line} delay={i * 0.05} className="grid grid-cols-[2.75rem_1fr] items-baseline gap-4 border-b border-line py-5">
                <span className="font-mono text-xs tracking-[0.12em] text-brass">{String(i + 1).padStart(2, "0")}</span>
                <span className="t-story text-[clamp(1.15rem,1.5vw,1.35rem)] leading-snug text-bone">{line}</span>
              </Reveal>
            ))}
          </ol>
        </div>
        <div className="relative aspect-[4/3] overflow-hidden">
          <FilmImage name="bondField" grade="none" position="50% 45%" sizes="(min-width: 1024px) 52vw, 100vw" />
        </div>
      </div>
    </section>
  );
}
