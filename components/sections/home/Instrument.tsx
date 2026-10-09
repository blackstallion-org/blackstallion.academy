import { Headline } from "@/components/film/Headline";
import { Cta, Label } from "@/components/film/Marks";
import { SpecimenPlate } from "@/components/sections/anatomy/SpecimenPlate";
import { instrument } from "@/lib/content/home";

/** §3 The instrument · S03 specimen hotspots (compact). */
export function Instrument() {
  return (
    <section aria-labelledby="instrument-h" className="gutter relative py-[clamp(6rem,14vh,12rem)]">
      <div className="mb-12 grid gap-6 md:grid-cols-[1fr_auto] md:items-end">
        <div>
          <Label reel={2}>The Instrument</Label>
          <Headline id="instrument-h" className="mt-4" inscription={instrument.inscription} voice={instrument.voice} />
        </div>
        <p className="max-w-sm text-sand">{instrument.body}</p>
      </div>
      <SpecimenPlate only={instrument.points} />
      <div className="mt-12">
        <Cta href="/anatomy">Explore the instrument</Cta>
      </div>
    </section>
  );
}
