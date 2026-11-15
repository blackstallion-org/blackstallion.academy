import type { Metadata } from "next";
import { MovementLab } from "@/components/sections/stride/MovementLab";

export const metadata: Metadata = {
  alternates: { canonical: "/stride" },
  title: "The Science of the Stride",
  description:
    "How a horse's walk moves the rider: four beats, one moving back, a seat that follows. A movement laboratory over film of a horse and rider walking: play, slow, step frame by frame, and read the stride.",
};

export default function StridePage() {
  return <MovementLab headingAs="h1" />;
}
