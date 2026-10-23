import { Headline } from "@/components/film/Headline";
import { DepthRibbon } from "@/components/motion/fx/DepthRibbon";
import { ribbon } from "@/lib/content/fx-scenes";
import { academyFrames } from "@/lib/content/peg";

/**
 * §2a · S69 Depth ribbon. The academy's working day as a strip of frames winding past in depth.
 * No eyebrow label: it would repeat the headline word for word (the label names the section for screen readers).
 */
export function AcademyRibbon() {
  return (
    <DepthRibbon
      id="frames"
      label={ribbon.label}
      frames={academyFrames}
      heading={<Headline inscription={ribbon.inscription} voice={ribbon.voice} />}
    />
  );
}
