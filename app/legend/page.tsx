import type { Metadata } from "next";
import { MarwariJourney } from "@/components/sections/legend/journey/MarwariJourney";
import { MarwariOrigins } from "@/components/sections/legend/MarwariOrigins";
import { EditorialGallery } from "@/components/film/EditorialGallery";

export const metadata: Metadata = {
  alternates: { canonical: "/legend" },
  title: "The Marwari",
  description: "Eight hundred years of the horse that would not leave the field: born of legend, bred in the Thar, nearly lost, revived. Every BSAH cadet rides one.",
};

/**
 * Reel 01 · The Marwari. Since 16 Nov 2026 it opens on MarwariOrigins (the title on the key painting, the origins film and five
 * fact-checked moments, then the academy's commitment), formerly a plain story poster (14 Nov 2026), then one
 * continuous painted journey in four acts (docs/marwari-scroll/CLAUDE_IMPLEMENTATION_PROMPT.md). The poster is painting 01
 * of the journey (the black Marwari galloping through the Thar), flattened, upscaled and mirrored so the horse gallops in from the right and the title has the quiet desert; replace the file to change it.
 */
export default function LegendPage() {
  return (
    <>
      <MarwariOrigins />
      <MarwariJourney afterPoster />
      {/* 16 Nov 2026: the quiet pairs moved here from /parents (breed storytelling belongs with the breed). */}
      <EditorialGallery page="legend" />
    </>
  );
}
