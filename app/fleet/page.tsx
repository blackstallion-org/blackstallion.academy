import { RoyalPlate } from "@/components/film/RoyalPlate";
import type { Metadata } from "next";
import { CareLog, CctvGrid, CoatRegistry, FleetTitle, Registry, StallionGallery } from "@/components/sections/fleet/FleetScenes";
import { BloodlineIndex } from "@/components/sections/fleet/BloodlineIndex";
import { MarwariPortrait } from "@/components/sections/editorial/ReferencePanels";
import { ReplayHeadline } from "@/components/motion/ReplayHeadline";
import { CovenantFrames } from "@/components/sections/fleet/CovenantFrames";
import { LightTheStable } from "@/components/sections/fleet/LightTheStable";
import { PageCurtain } from "@/components/sections/shared/PageCurtain";
import { RealHorseGalleries } from "@/components/sections/fleet/RealHorseGalleries";
import { REAL_COLLECTION, REAL_HORSE_NOTE, REAL_HORSES } from "@/lib/content/real-horses";

export const metadata: Metadata = {
  alternates: { canonical: "/fleet" },
  title: "The Studbook",
  description: "Twenty-one indigenous Marwari and Kathiawari stallions: microchipped, vet-checked daily and on camera around the clock.",
};

export default function FleetPage() {
  return (
    <>
      <FleetTitle />
      {/* 14 Nov 2026: real photographs, one gallery per verified horse (lib/content/real-horses.manifest.json). */}
      <RealHorseGalleries horses={REAL_HORSES} collection={REAL_COLLECTION} note={REAL_HORSE_NOTE} />
      <MarwariPortrait />
      <RoyalPlate id="fleetBlack" layout="split" />
      <RoyalPlate id="fleetWhite" layout="split" flip />
      <PageCurtain page="fleet" />
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
    </>
  );
}
