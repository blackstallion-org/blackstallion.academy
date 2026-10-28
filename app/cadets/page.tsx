import type { Metadata } from "next";
import { EndCard } from "@/components/film/EndCard";
import { CadetsTitle, CadetDrillShowcase, CreedCard, DayClock, MilestoneReels, PassportObject, Spotlights, UniformSpec } from "@/components/sections/cadets/CadetScenes";
import { HorizontalChapter } from "@/components/motion/HorizontalChapter";
import { ReplayHeadline } from "@/components/motion/ReplayHeadline";
import { CadetOpening } from "@/components/sections/cadets/CadetOpening";
import { PageCurtain } from "@/components/sections/shared/PageCurtain";

export const metadata: Metadata = {
  alternates: { canonical: "/cadets" },
  title: "The Hall of Valour",
  description: "Cadet spotlights, the Sovereign Passport, a cadet's day, the creed and ten-second milestone reels.",
};

export default function CadetsPage() {
  return (
    <>
      <CadetsTitle />
      <CadetOpening />
      <HorizontalChapter typeface="brush" chapter="The first lesson" text="The first command is to listen." />
      <PageCurtain page="cadets" />
      <CadetDrillShowcase />
      <PassportObject />
      <UniformSpec />
      <Spotlights />
      <DayClock />
      <CreedCard />
      <MilestoneReels />
      <ReplayHeadline typeface="western" id="cadets-replay" label="The first lesson, remembered" text="Confidence begins with a quiet hello." tone="dark" defaultMode="lines" />
      <EndCard current={8} />
    </>
  );
}
