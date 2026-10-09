import { acts, type Act } from "@/lib/content/site";
import { LanceRule } from "./Marks";
import { Reveal } from "./Reveal";

/** Act break on the home page: "ACT II · THE CITADEL — Now, the proof." */
export function Intermission({ act, line }: { act: Act; line: string }) {
  return (
    <div className="gutter relative py-[16vh] text-center">
      <LanceRule label={`Act ${acts[act].numeral} · ${acts[act].name}`} />
      <Reveal>
        <p className="t-voice mt-10 text-display-3 text-sand">{line}</p>
      </Reveal>
    </div>
  );
}
