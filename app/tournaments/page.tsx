import type { Metadata } from "next";
import { CircuitTitle, FixtureBoard, Podium, StandingsLanes, TournamentActionGallery } from "@/components/sections/tournaments/TournamentScenes";
import { PegRun } from "@/components/sections/tournaments/PegRun";
import { ReplayHeadline } from "@/components/motion/ReplayHeadline";
import { EditorialGallery } from "@/components/film/EditorialGallery";

export const metadata: Metadata = {
  alternates: { canonical: "/tournaments" },
  title: "The Circuit",
  description: "STPCI interscholastic standings, the Sovereign Governor's Cup and the art of tent pegging.",
};

export default function TournamentsPage() {
  return (
    <>
      <CircuitTitle />
      <StandingsLanes />
      <FixtureBoard />
      <PegRun />
      <EditorialGallery page="tournaments" />
      <TournamentActionGallery />
      <Podium />
      <ReplayHeadline typeface="condensed" id="tournaments-replay" label="The circuit doctrine" text="Victory belongs to the disciplined rein." tone="dark" defaultMode="words" />
    </>
  );
}
