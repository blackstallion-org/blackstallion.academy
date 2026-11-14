import type { Metadata } from "next";
import { RoyalPlate } from "@/components/film/RoyalPlate";
import { MarwariJourney } from "@/components/sections/legend/journey/MarwariJourney";

export const metadata: Metadata = {
  alternates: { canonical: "/legend" },
  title: "The Marwari",
  description: "Eight hundred years of the horse that would not leave the field: born of legend, bred in the Thar, nearly lost, revived. Every BSAH cadet rides one.",
};

/**
 * Reel 01 · The Marwari. One continuous painted journey in four acts (14 Nov 2026, owner's brief
 * docs/marwari-scroll/CLAUDE_IMPLEMENTATION_PROMPT.md); it replaces the 3D museum opening and the earlier fragmented page.
 */
export default function LegendPage() {
  return (
    <>
      <MarwariJourney />
      {/* 14 Nov 2026: two of the owner's royal photographs (used with permission) close the journey */}
      <RoyalPlate id="legendRider" />
      <RoyalPlate id="legendRear" layout="split" />
    </>
  );
}
