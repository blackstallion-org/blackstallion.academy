import type { Metadata } from "next";
import { EndCard } from "@/components/film/EndCard";
import { CadetsTitle, CadetDrillShowcase, CreedCard, DayClock, MilestoneReels, PassportObject, Spotlights, UniformSpec } from "@/components/sections/cadets/CadetScenes";
import { FirstRideEditorial } from "@/components/sections/editorial/ReferencePanels";
import { HorizontalChapter } from "@/components/motion/HorizontalChapter";
import { ReplayHeadline } from "@/components/motion/ReplayHeadline";

export const metadata: Metadata = {
  alternates: { canonical: "/cadets" },
  title: "The Hall of Valour",
  description: "Cadet spotlights, the Sovereign Passport, a cadet's day, the creed and ten-second milestone reels.",
};

export default function CadetsPage() {
  return (
    <>
      <CadetsTitle />
      <FirstRideEditorial />
      <HorizontalChapter typeface="brush" chapter="The first lesson" text="The first command is to listen." />
      <Spotlights />
      <CadetDrillShowcase />
      <PassportObject />
      <UniformSpec />
      <DayClock />
      <CreedCard />
      <MilestoneReels />
      <ReplayHeadline typeface="western" id="cadets-replay" label="The first lesson, remembered" text="Confidence begins with a quiet hello." tone="dark" defaultMode="lines" />
      <EndCard current={8} />
    </>
  );
}
