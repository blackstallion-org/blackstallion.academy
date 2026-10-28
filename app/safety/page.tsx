import type { Metadata } from "next";
import { EndCard } from "@/components/film/EndCard";
import { SafetyKineticStage } from "@/components/sections/safety/SafetyKineticStage";
import { NumberWall, OrdersOfTheDay, People, SafetyTitle, ShieldColumns } from "@/components/sections/safety/SafetyScenes";
import { PageCurtain } from "@/components/sections/shared/PageCurtain";

export const metadata: Metadata = {
  alternates: { canonical: "/safety" },
  title: "The Shield",
  description: "Ex-cavalry instructors, daily veterinary care and the protocol behind every BSAH session.",
};

export default function SafetyPage() {
  return (
    <>
      <SafetyTitle />
      <ShieldColumns />
      <OrdersOfTheDay />
      <PageCurtain page="safety" />
      <SafetyKineticStage />
      <NumberWall />
      <People />
      <EndCard current={10} />
    </>
  );
}
