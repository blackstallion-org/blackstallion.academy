import { RoyalPlate } from "@/components/film/RoyalPlate";
import type { Metadata } from "next";
import { AsciiChild } from "@/components/sections/why/AsciiChild";
import { BreathCue } from "@/components/film/BreathCue";
import { BigSlider, Glass, Monolith, SovereignCrucible, TrainList, WhyTitle } from "@/components/sections/why/WhyScenes";
import { why } from "@/lib/content/science";
import { entity } from "@/lib/content/site";
import { ReplayHeadline } from "@/components/motion/ReplayHeadline";

export const metadata: Metadata = {
  alternates: { canonical: "/why" },
  title: "Crisis & Cure",
  description: "Screens fold a child's spine and scatter attention. A partner of several hundred kilograms asks for presence, poise and a quiet mind.",
};

export default function WhyPage() {
  return (
    <>
      <WhyTitle />
      <Glass />
      <AsciiChild />
      <RoyalPlate id="whyHead" />
      <BreathCue />
      <SovereignCrucible />
      <BigSlider />
      <Monolith lines={why.sanctuary} coda={`${entity.motto}.`} label="The sanctuary of unpowered truth" />
      <TrainList />
      <ReplayHeadline typeface="condensed" id="why-replay" label="The sovereign truth" text="A horse cannot be deceived by an algorithm." tone="dark" defaultMode="words" />
    </>
  );
}
