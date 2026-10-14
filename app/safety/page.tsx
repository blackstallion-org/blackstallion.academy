import type { Metadata } from "next";
import { EndCard } from "@/components/film/EndCard";
import { HorseEquipmentSection } from "@/components/sections/equipment/HorseEquipmentSection";
import { NumberWall, OrdersOfTheDay, People, SafetyTitle, ShieldColumns } from "@/components/sections/safety/SafetyScenes";

export const metadata: Metadata = {
  title: "The Shield",
  description: "Ex-cavalry instructors, daily veterinary care and the protocol behind every BSAH session.",
};

export default function SafetyPage() {
  return (
    <>
      <SafetyTitle />
      <ShieldColumns />
      <OrdersOfTheDay />
      <HorseEquipmentSection />
      <NumberWall />
      <People />
      <EndCard current={9} />
    </>
  );
}
