import { Headline } from "@/components/film/Headline";
import { Label } from "@/components/film/Marks";
import { DepthRibbon } from "@/components/motion/fx/DepthRibbon";
import { ribbon } from "@/lib/content/fx-scenes";
import { academyFrames } from "@/lib/content/peg";

/** §2a · S69 Depth ribbon. The academy's working day as a strip of frames winding past in depth. */
export function AcademyRibbon() {
  return (
    <DepthRibbon
      id="frames"
      label={ribbon.label}
      frames={academyFrames}
      heading={
        <>
          <Label>{ribbon.label}</Label>
          <Headline className="mt-4" inscription={ribbon.inscription} voice={ribbon.voice} />
        </>
      }
    />
  );
}
