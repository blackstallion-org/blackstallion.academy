import type { Metadata } from "next";
import { EndCard } from "@/components/film/EndCard";
import { CareLog, CctvGrid, CoatRegistry, FleetTitle, Registry, StallionGallery } from "@/components/sections/fleet/FleetScenes";
import { StallionBentoGallery } from "@/components/sections/fleet/StallionBentoGallery";
import { MarwariPortrait } from "@/components/sections/editorial/ReferencePanels";
import { HorizontalChapter } from "@/components/motion/HorizontalChapter";
import { ReplayHeadline } from "@/components/motion/ReplayHeadline";
import { FleetCovenantScene } from "@/components/sections/fleet/FleetCovenantScene";
import { LightTheStable } from "@/components/sections/fleet/LightTheStable";
import { PageCurtain } from "@/components/sections/shared/PageCurtain";

export const metadata: Metadata = {
  alternates: { canonical: "/fleet" },
  title: "The Studbook",
  description: "Twenty-one indigenous Marwari and Kathiawari stallions: microchipped, vet-checked daily and on camera around the clock.",
};

export default function FleetPage() {
  return (
    <>
      <FleetCovenantScene />
      <FleetTitle />
      <MarwariPortrait />
      <PageCurtain page="fleet" />
      <HorizontalChapter typeface="western" chapter="The horses" text="Every horse has a name. Every name has a story." tone="light" />
      <Registry />
      <StallionGallery />
      <CoatRegistry />
      <StallionBentoGallery />
      <LightTheStable />
      <CctvGrid />
      <CareLog />
      <ReplayHeadline typeface="elegant" id="fleet-replay" label="Beyond the registry" text="No two horses tell the same story." tone="dark" defaultMode="lines" />
      <EndCard current={7} />
    </>
  );
}
