import { acts, type Act } from "@/lib/content/site";
import { LanceRule } from "./Marks";
import { BreathCue } from "./BreathCue";
import { Reveal } from "./Reveal";

/** Act break on the home page: "ACT II · THE CITADEL — Now, the proof." A dark leather band between acts. */
export function Intermission({ act, line }: { act: Act; line: string }) {
  return (
    <div className="tone-dark surface-leather gutter relative py-[16vh] text-center">
      {act === "ledger" && <BreathCue />}
      <LanceRule label={`Act ${acts[act].numeral} · ${acts[act].name}`} />
      <Reveal>
        <p className="t-voice mt-10 text-display-3 text-bone">{line}</p>
      </Reveal>
    </div>
  );
}
