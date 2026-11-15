import type { Metadata } from "next";
import { EquipmentCrispHeader } from "@/components/sections/equipment/EquipmentCrispHeader";
import { HorseEquipmentSection } from "@/components/sections/equipment/HorseEquipmentSection";
import { MaterialsEditorial } from "@/components/sections/editorial/ReferencePanels";

export const metadata: Metadata = {
  alternates: { canonical: "/equipment" },
  title: "Horse Shoes & Equipment",
  description: "How the academy fits and checks a horse's tack and shoes, and why the horse has the last word on the fit.",
};

export default function EquipmentPage() {
  return (
    <>
      <EquipmentCrispHeader />
      <div className="pt-10">
        <HorseEquipmentSection />
        <MaterialsEditorial />
      </div>
    </>
  );
}
