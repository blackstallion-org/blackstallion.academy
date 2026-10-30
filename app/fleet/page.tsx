import type { Metadata } from "next";
import { EndCard } from "@/components/film/EndCard";
import { CareLog, CctvGrid, CoatRegistry, FleetTitle, Registry, StallionGallery } from "@/components/sections/fleet/FleetScenes";
import { BloodlineIndex } from "@/components/sections/fleet/BloodlineIndex";
import { MarwariPortrait } from "@/components/sections/editorial/ReferencePanels";
import { HorizontalChapter } from "@/components/motion/HorizontalChapter";
import { ReplayHeadline } from "@/components/motion/ReplayHeadline";
import { CovenantFrames } from "@/components/sections/fleet/CovenantFrames";
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
      <FleetTitle />
      <MarwariPortrait />
      <PageCurtain page="fleet" />
      <HorizontalChapter typeface="western" chapter="The horses" text="Every horse has a name. Every name has a story." tone="light" />
      <Registry />
      <StallionGallery />
      <CoatRegistry />

      {/* The covenant: close shots, set in the middle of the page (it opened the page before, as a 3D scene). */}
      <CovenantFrames />

      <BloodlineIndex />
      <LightTheStable />
      <CctvGrid />
      <CareLog />
      <ReplayHeadline typeface="elegant" id="fleet-replay" label="Beyond the registry" text="No two horses tell the same story." tone="dark" defaultMode="lines" />
      <EndCard current={7} />
    </>
  );
}
