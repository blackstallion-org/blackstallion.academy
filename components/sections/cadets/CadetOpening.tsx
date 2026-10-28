import { Headline } from "@/components/film/Headline";
import { Label } from "@/components/film/Marks";
import { ExpandingFrame } from "@/components/motion/fx/ExpandingFrame";
import { cadetOpening } from "@/lib/content/fx-scenes";

/**
 * S66 Expanding frame, moved here from /schools (28 Oct 2026, owner's request). A small framed photograph of a cadet on the
 * tent-pegging lane opens to full bleed as you scroll, then the promise lands on it.
 */
export function CadetOpening() {
  return (
    <ExpandingFrame
      image="pegApproach"
      label={cadetOpening.label}
      hint={cadetOpening.hint}
      title={<p className="t-voice text-display-2 text-bone">{cadetOpening.title}</p>}
    >
      <Label>{cadetOpening.label}</Label>
      <Headline className="mt-4" inscription={cadetOpening.inscription} voice={cadetOpening.voice} animate="none" />
      <p className="t-story mt-6 max-w-xl text-lede text-sand">{cadetOpening.body}</p>
    </ExpandingFrame>
  );
}
