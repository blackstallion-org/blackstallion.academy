import type { Metadata } from "next";
import { EndCard } from "@/components/film/EndCard";
import { CareLog, CctvGrid, FleetTitle, Registry } from "@/components/sections/fleet/FleetScenes";

export const metadata: Metadata = {
  title: "The Studbook",
  description: "Twenty-one indigenous Marwari and Kathiawari stallions: microchipped, vet-checked daily and on camera around the clock.",
};

export default function FleetPage() {
  return (
    <>
      <FleetTitle />
      <Registry />
      <CctvGrid />
      <CareLog />
      <EndCard current={6} />
    </>
  );
}
