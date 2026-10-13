import type { Metadata } from "next";
import { EndCard } from "@/components/film/EndCard";
import { CareLog, CctvGrid, CoatRegistry, Registry, StallionGallery } from "@/components/sections/fleet/FleetScenes";
import { StallionPortalHero } from "@/components/sections/fleet/StallionPortalHero";

export const metadata: Metadata = {
  title: "The Studbook",
  description: "Twenty-one indigenous Marwari and Kathiawari stallions: microchipped, vet-checked daily and on camera around the clock.",
};

export default function FleetPage() {
  return (
    <>
      <StallionPortalHero />
      <Registry />
      <StallionGallery />
      <CoatRegistry />
      <CctvGrid />
      <CareLog />
      <EndCard current={6} />
    </>
  );
}
