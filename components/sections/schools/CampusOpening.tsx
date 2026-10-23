import { Headline } from "@/components/film/Headline";
import { Label } from "@/components/film/Marks";
import { ExpandingFrame } from "@/components/motion/fx/ExpandingFrame";
import { campusOpening } from "@/lib/content/fx-scenes";

/**
 * §2b · S66 Expanding frame. A small framed aerial of a campus opens to full bleed as you scroll:
 * the arena takes the whole screen, then the promise lands on it.
 */
export function CampusOpening() {
  return (
    <ExpandingFrame
      image="schoolAerial"
      label={campusOpening.label}
      hint={campusOpening.hint}
      title={<p className="t-voice text-display-2 text-bone">{campusOpening.title}</p>}
    >
      <Label>{campusOpening.label}</Label>
      <Headline className="mt-4" inscription={campusOpening.inscription} voice={campusOpening.voice} animate="none" />
      <p className="t-story mt-6 max-w-xl text-lede text-sand">{campusOpening.body}</p>
    </ExpandingFrame>
  );
}
