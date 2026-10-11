import type { Metadata } from "next";
import { EndCard } from "@/components/film/EndCard";
import { FilmImage } from "@/components/film/FilmImage";
import { Headline } from "@/components/film/Headline";
import { Label } from "@/components/film/Marks";
import { Reveal } from "@/components/film/Reveal";
import { CodexVault } from "@/components/sections/curriculum/CodexVault";
import { ClockRing, CurriculumTitle, DisciplinePanels, Staircase, ThreeStamps } from "@/components/sections/curriculum/CurriculumScenes";
import { batches } from "@/lib/content/curriculum";

export const metadata: Metadata = {
  title: "The Ledger",
  description: "Four ranks, thirteen pillars, a 45-minute military session protocol and batches on your child's own campus: the BSAH curriculum.",
};

export default function CurriculumPage() {
  return (
    <>
      <CurriculumTitle />
      <Staircase />
      <CodexVault />
      <ClockRing />

      {/* §4 · S37 timetable board */}
      <section aria-labelledby="batches-h" className="relative py-[clamp(6rem,14vh,12rem)]">
        <div className="relative h-[42svh] min-h-[260px]">
          <FilmImage name="currBatch" sizes="100vw" />
          <div aria-hidden className="absolute inset-0 bg-gradient-to-b from-night/20 via-transparent to-night" />
        </div>
        <div className="gutter -mt-16 relative">
          <Label>Batches</Label>
          <Headline id="batches-h" className="mt-4" inscription="Before school." voice="After school. Weekends." />
          <div className="relative mt-10 overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse text-left">
              <caption className="sr-only">Batch timetable (sample, confirm per hub)</caption>
              <thead>
                <tr className="border-b border-line">
                  {["Batch", "Time", "Days", "Cadets", "Focus"].map((h) => (
                    <th key={h} scope="col" className="label py-3 pr-6 font-semibold text-dust">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {batches.map((b) => (
                  <tr key={b.name} className="border-b border-line">
                    <th scope="row" className="t-voice py-5 pr-6 text-xl font-semibold text-bone">
                      {b.name}
                    </th>
                    <td className="font-mono py-5 pr-6 text-gold">{b.time}</td>
                    <td className="t-ui py-5 pr-6 text-sand">{b.days}</td>
                    <td className="t-ui py-5 pr-6 text-sand">{b.who}</td>
                    <td className="t-ui py-5 text-sand">{b.focus}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Reveal>
            <p className="t-ui mt-4 text-sm text-dust">Sample timings; each hub publishes its own. Small batches of eight cadets per instructor (sample).</p>
          </Reveal>
        </div>
      </section>

      <ThreeStamps />
      <DisciplinePanels />
      <EndCard current={5} />
    </>
  );
}
