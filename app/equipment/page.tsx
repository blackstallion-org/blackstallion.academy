import type { Metadata } from "next";
import { EndCard } from "@/components/film/EndCard";
import { HorseEquipmentSection } from "@/components/sections/equipment/HorseEquipmentSection";

export const metadata: Metadata = {
  title: "Horse Shoes & Equipment",
  description: "Traditional Marwari cavalry saddles, precision stirrup irons, stable halters, and hand-forged horseshoes fitted by hand.",
};

export default function EquipmentPage() {
  return (
    <div className="pt-20">
      <HorseEquipmentSection />
      <EndCard current={2} />
    </div>
  );
}
