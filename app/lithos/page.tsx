import type { Metadata } from "next";
import { LithosHero } from "@/components/sections/lithos/LithosHero";

export const metadata: Metadata = {
  title: "Lithos · Layers hold tales of time",
  description:
    "Every layer of sediment records a chapter of our planet. Explore our interactive geology spotlight maps.",
};

export default function LithosPage() {
  return <LithosHero />;
}
