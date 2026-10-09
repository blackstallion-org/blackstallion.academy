import type { Metadata } from "next";
import { EndCard } from "@/components/film/EndCard";
import { BigSlider, Glass, Monolith, TrainList, WhyTitle } from "@/components/sections/why/WhyScenes";
import { why } from "@/lib/content/science";
import { entity } from "@/lib/content/site";

export const metadata: Metadata = {
  title: "Crisis & Cure",
  description: "Screens fold a child's spine and scatter attention. A 500 kg partner asks for presence, poise and a quiet mind.",
};

export default function WhyPage() {
  return (
    <>
      <WhyTitle />
      <Glass />
      <BigSlider />
      <Monolith lines={why.sanctuary} coda={`${entity.motto}.`} label="The sanctuary of unpowered truth" />
      <TrainList />
      <EndCard current={4} />
    </>
  );
}
