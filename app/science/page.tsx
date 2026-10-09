import type { Metadata } from "next";
import { EndCard } from "@/components/film/EndCard";
import { Headline } from "@/components/film/Headline";
import { Label } from "@/components/film/Marks";
import { Reveal } from "@/components/film/Reveal";
import { ComparisonLedger, PulseLine, ScienceTitle, SystemsConsole } from "@/components/sections/science/ScienceScenes";
import { claims, comparison, statusColor } from "@/lib/content/science";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "The Matrix",
  description: "What twenty minutes in the saddle asks of a child's brain, spine, muscles and heart, and how sure we are of each claim.",
};

export default function SciencePage() {
  return (
    <>
      <ScienceTitle />
      <SystemsConsole />
      <PulseLine />
      <ComparisonLedger cols={comparison.cols} rows={comparison.rows} note={comparison.note} />

      {/* §4 · S30 footnote ledger */}
      <section aria-labelledby="claims-h" className="gutter relative pb-[clamp(6rem,14vh,12rem)]">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)]">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <Label>The honest part</Label>
            <Headline id="claims-h" className="mt-4" inscription="What we can" voice="stand behind." />
            <p className="mt-6 max-w-sm text-sand">Every health claim on this site is listed here with its status. If we cannot source it, we do not say it.</p>
          </div>
          <ol className="border-t border-brass/25">
            {claims.map((c, i) => (
              <Reveal as="li" key={c.claim} delay={i * 0.04} className="grid gap-3 border-b border-brass/15 py-6 sm:grid-cols-[2.5rem_1fr_9rem] sm:gap-6">
                <span className="font-mono text-xs text-dust">[{i + 1}]</span>
                <div>
                  <p className={cn("text-lg", c.status === "Not yet published" ? "text-sand/60 line-through decoration-1" : "text-bone")}>{c.claim}</p>
                  <p className="t-ui mt-2 text-sm text-dust">
                    {c.href ? (
                      <a href={c.href} target="_blank" rel="noreferrer" className="underline decoration-brass/40 underline-offset-4 hover:text-gold">
                        {c.source}
                      </a>
                    ) : (
                      c.source
                    )}
                  </p>
                </div>
                <span className={cn("label sm:text-right", statusColor[c.status])}>{c.status}</span>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      <EndCard current={3} />
    </>
  );
}
