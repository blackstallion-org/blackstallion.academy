import type { Metadata } from "next";
import { EndCard } from "@/components/film/EndCard";
import { ReelMark } from "@/components/film/Marks";
import { CommandBoot } from "@/components/sections/command/CommandBoot";
import { Terminal } from "@/components/sections/command/Terminal";
import { knowledge } from "@/lib/content/command";
import { tiers } from "@/lib/content/schools";

export const metadata: Metadata = {
  title: "Command AI",
  description: "An executive terminal for principals and trustees: returns, insurance, safety, faculty and curriculum, answered on the spot.",
};

export default function CommandPage() {
  return (
    <>
      <section aria-labelledby="cmd-h" className="gutter relative min-h-[100svh] pb-20 pt-28 md:pt-32">
        <ReelMark n={13} act="ledger" />
        <CommandBoot />
        <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,0.7fr)]">
          <Terminal tall opening="Payback for 150 cadets" chips={knowledge.map((k) => k.ask)} />
          <aside aria-label="Dossier" className="flex flex-col gap-6">
            <div className="border-t border-brass/30 pt-4">
              <p className="label text-brass">Dossier · fees</p>
              <p className="font-mono mt-2 text-sm text-sand">₹2,000 onboarding · ₹9,440 / month incl. GST · kit ₹3,000 optional</p>
            </div>
            <div className="border-t border-brass/30 pt-4">
              <p className="label text-brass">Dossier · tiers</p>
              <ul className="font-mono mt-2 flex flex-col gap-1 text-sm text-sand">
                {tiers.map((t) => (
                  <li key={t.id}>
                    {t.name} · {t.capexLabel}
                  </li>
                ))}
              </ul>
            </div>
            <div className="border-t border-brass/30 pt-4">
              <p className="label text-brass">Dossier · cover</p>
              <p className="font-mono mt-2 text-sm text-sand">₹10 L group accident insurance per active cadet</p>
            </div>
            <p className="t-ui border-t border-brass/30 pt-4 text-xs text-dust">Preview: scripted answers from the academy&rsquo;s brief. Live AI follows with the Supabase back end; questions it cannot answer are routed to the Office of the Chairman.</p>
          </aside>
        </div>
      </section>
      <EndCard current={13} />
    </>
  );
}
