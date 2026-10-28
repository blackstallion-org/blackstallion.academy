import type { Metadata } from "next";
import { StrideExperience } from "@/components/stride/StrideExperience";

export const metadata: Metadata = {
  alternates: { canonical: "/stride" },
  title: "The Science of the Stride",
  description:
    "How a horse's walk moves the rider: four beats, one moving back, a seat that follows. A 3D movement laboratory with a play control, frame-by-frame scrubbing and a graph read from the animation.",
};

export default function StridePage() {
  return <StrideExperience />;
}
