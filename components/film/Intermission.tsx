import { acts, type Act } from "@/lib/content/site";
import { TextAnimate } from "@/components/motion/TextAnimate";
import { BreathCue } from "./BreathCue";
import { DeckCorners, DeckFrame } from "./Deck";

/**
 * Act break on the home page, set as a deck slide (30 Oct 2026, after the owner's references; was a leather band with a centred
 * line): one giant word, its dictionary line beneath, and a short paragraph that says what the act holds. Ivory margin round it.
 */
const words: Record<Exclude<Act, "legend">, { word: string; ipa: string; sense: string; holds: string }> = {
  citadel: {
    word: "Proof",
    ipa: "pruːf",
    sense: "evidence that settles a question",
    holds: "What the saddle does to a child, how the four ranks are built, every horse by name and every cadet by record.",
  },
  ledger: {
    word: "Decision",
    ipa: "dɪˈsɪʒ(ə)n",
    sense: "a conclusion reached after weighing it",
    holds: "The campus model for schools, the sealed record, the circuit and the gate. Everything you need to choose.",
  },
};

export function Intermission({ act, line }: { act: Act; line: string }) {
  const w = words[act as Exclude<Act, "legend">];
  if (!w) return null;
  return (
    <section aria-label={`${acts[act].name}: ${line}`}>
      <DeckFrame>
        {act === "ledger" && <BreathCue />}
        <div className="relative flex min-h-[78svh] flex-col justify-center px-[clamp(20px,5vw,72px)] py-28">
          <p className="label text-brass">
            Act {acts[act].numeral} · {acts[act].name}
          </p>
          <TextAnimate as="p" animation="blurInUp" className="mt-4 font-display text-[clamp(5rem,21vw,19rem)] font-normal leading-[0.86] tracking-[-0.035em] text-bone">
            {w.word}
          </TextAnimate>
          <p className="mt-6 flex flex-wrap items-baseline gap-x-3 gap-y-1 text-sand">
            <span className="label text-bone">{w.word}</span>
            <span className="font-mono text-xs text-dust">[{w.ipa}]</span>
            <span className="t-story italic text-dust">(noun)</span>
            <span className="t-story">— {w.sense}.</span>
          </p>

          <div className="mt-14 grid gap-6 md:ml-auto md:max-w-xl md:grid-cols-[auto_1fr] md:gap-10 md:border-l md:border-line md:pl-10">
            <TextAnimate as="h2" animation="blurIn" delay={0.3} className="t-voice text-2xl text-gold md:text-3xl">
              {line}
            </TextAnimate>
            <p className="t-ui text-sm leading-relaxed text-sand">{w.holds}</p>
          </div>

          <DeckCorners tag="Intermission" folio={acts[act].numeral} />
        </div>
      </DeckFrame>
    </section>
  );
}
