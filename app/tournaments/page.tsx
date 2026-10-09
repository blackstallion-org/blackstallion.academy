import type { Metadata } from "next";
import { EndCard } from "@/components/film/EndCard";
import { CircuitTitle, CourseDiagram, FixtureBoard, Podium, StandingsLanes } from "@/components/sections/tournaments/TournamentScenes";

export const metadata: Metadata = {
  title: "The Circuit",
  description: "STPCI interscholastic standings, the Sovereign Governor's Cup and the art of tent pegging.",
};

export default function TournamentsPage() {
  return (
    <>
      <CircuitTitle />
      <StandingsLanes />
      <FixtureBoard />
      <CourseDiagram />
      <Podium />
      <EndCard current={12} />
    </>
  );
}
