import type { Metadata } from "next";
import { MarwariJourney } from "@/components/sections/legend/journey/MarwariJourney";
import { StoryPoster } from "@/components/film/StoryPoster";
import { INTRO } from "@/lib/content/marwari-journey";
import { asset } from "@/lib/content/asset";

export const metadata: Metadata = {
  alternates: { canonical: "/legend" },
  title: "The Marwari",
  description: "Eight hundred years of the horse that would not leave the field: born of legend, bred in the Thar, nearly lost, revived. Every BSAH cadet rides one.",
};

/**
 * Reel 01 · The Marwari. Opens on a full-screen story poster, like the painted histories (14 Nov 2026, owner), then one
 * continuous painted journey in four acts (docs/marwari-scroll/CLAUDE_IMPLEMENTATION_PROMPT.md). The poster is painting 01
 * of the journey (the black Marwari galloping through the Thar), flattened, upscaled and mirrored so the horse gallops in from the right and the title has the quiet desert; replace the file to change it.
 */
export default function LegendPage() {
  return (
    <>
      <StoryPoster
        src={asset("/images/story/marwari/poster.webp")}
        alt="A Rajasthani-style painting: a black Marwari stallion in an embroidered saddle cloth gallops through deep desert sand under a red sky, a fort on the ridge behind."
        width={2400}
        height={1357}
        focal="48% 45%"
        label={INTRO.kicker}
        inscription={INTRO.inscription}
        voice={INTRO.voice}
        beginId="journey-start"
        headingId="legend-title"
      />
      <MarwariJourney afterPoster />
    </>
  );
}
