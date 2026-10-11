import type { Metadata } from "next";
import { EndCard } from "@/components/film/EndCard";
import { CadetsTitle, CreedCard, DayClock, MilestoneReels, PassportObject, Spotlights, UniformSpec } from "@/components/sections/cadets/CadetScenes";

export const metadata: Metadata = {
  title: "The Hall of Valour",
  description: "Cadet spotlights, the Sovereign Passport, a cadet's day, the creed and ten-second milestone reels.",
};

export default function CadetsPage() {
  return (
    <>
      <CadetsTitle />
      <Spotlights />
      <PassportObject />
      <UniformSpec />
      <DayClock />
      <CreedCard />
      <MilestoneReels />
      <EndCard current={7} />
    </>
  );
}
