import type { Metadata } from "next";
import { EndCard } from "@/components/film/EndCard";
import { Headline } from "@/components/film/Headline";
import { Cta, Label } from "@/components/film/Marks";
import { Reveal } from "@/components/film/Reveal";
import { ConfiguratorAndSimulator, HubMap, ModelFlow, PanIndiaNetwork, SchoolArenaShowcase, SchoolsTitle } from "@/components/sections/schools/SchoolScenes";
import { seals } from "@/lib/content/schools";

export const metadata: Metadata = {
  title: "The Citadel · For school boards",
  description: "A zero-CapEx equestrian hub on your campus: BSAH funds, builds and operates; your school earns 25–30% of tuition. Three tiers, the Pan-India network and a draft MOU.",
};

export default function SchoolsPage() {
  return (
    <>
      <SchoolsTitle />
      <ModelFlow />
      <ConfiguratorAndSimulator />
      <SchoolArenaShowcase />
      <HubMap />
      <PanIndiaNetwork />

      {/* §5 · S56 seal row */}
      <section aria-labelledby="seals-h" className="gutter relative py-[clamp(6rem,14vh,12rem)]">
        <Label>What a hub brings</Label>
        <Headline id="seals-h" className="mt-4" inscription="Prestige," voice="on the national circuit." />
        <ul className="mt-14 grid grid-cols-2 gap-10 lg:grid-cols-4">
          {seals.map((s, i) => (
            <Reveal as="li" key={s.title} delay={i * 0.1} className="flex flex-col items-center text-center">
              <div className="grid h-28 w-28 place-items-center rounded-full border border-line/50">
                <div className="grid h-22 w-22 place-items-center rounded-full border border-dashed border-gold/60">
                  <span className="t-inscribe text-lg text-gold">{["I", "II", "III", "IV"][i]}</span>
                </div>
              </div>
              <p className="t-voice mt-5 text-xl text-bone">{s.title}</p>
              <p className="mt-1 text-sm text-sand">{s.line}</p>
            </Reveal>
          ))}
        </ul>
      </section>

      {/* §6 · CTA */}
      <section aria-labelledby="board-h" className="gutter relative pb-[clamp(6rem,14vh,12rem)] text-center">
        <Headline id="board-h" size="1" className="mx-auto" inscription="Bring it" voice="to your board." />
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Cta href="/schools/mou" variant="solid">
            Request a draft MOU
          </Cta>
          <Cta href="/contact?gate=audit">Schedule a board audit</Cta>
          <Cta href="/command">Ask Command AI</Cta>
        </div>
      </section>

      <EndCard current={10} />
    </>
  );
}
