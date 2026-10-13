import type { Metadata } from "next";
import { EndCard } from "@/components/film/EndCard";
import { CareLog, CctvGrid, CoatRegistry, Registry } from "@/components/sections/fleet/FleetScenes";
import { StallionPortalHero } from "@/components/sections/fleet/StallionPortalHero";
import { StallionTriadGallery } from "@/components/sections/fleet/StallionTriadGallery";

export const metadata: Metadata = {
  title: "The Studbook",
  description: "Twenty-one indigenous Marwari and Kathiawari stallions: microchipped, vet-checked daily and on camera around the clock.",
};

export default function FleetPage() {
  return (
    <>
      <StallionPortalHero />
      <StallionTriadGallery />
      <Registry />
      <CoatRegistry />
      <CctvGrid />
      <CareLog />
      <EndCard current={6} />
    </>
  );
}
