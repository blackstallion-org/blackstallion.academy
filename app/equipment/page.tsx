import type { Metadata } from "next";
import { EndCard } from "@/components/film/EndCard";
import { EquipmentCrispHeader } from "@/components/sections/equipment/EquipmentCrispHeader";
import { HorseEquipmentSection } from "@/components/sections/equipment/HorseEquipmentSection";
import { MaterialsEditorial } from "@/components/sections/editorial/ReferencePanels";
import { HorizontalChapter } from "@/components/motion/HorizontalChapter";

export const metadata: Metadata = {
  alternates: { canonical: "/equipment" },
  title: "Horse Shoes & Equipment",
  description: "Traditional Marwari cavalry saddles, precision stirrup irons, stable halters, and hand-forged horseshoes fitted by hand.",
};

export default function EquipmentPage() {
  return (
    <>
      <EquipmentCrispHeader />
      <div className="pt-10">
        <HorseEquipmentSection />
        <HorizontalChapter typeface="condensed" chapter="The rider's tools" text="What touches the horse must earn its place." />
        <MaterialsEditorial />
        <EndCard current={2} />
      </div>
    </>
  );
}
