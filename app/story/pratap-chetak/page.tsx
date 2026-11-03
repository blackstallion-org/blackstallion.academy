import type { Metadata } from "next";
import { PratapStory } from "@/components/sections/pratap-story/PratapStory";

export const metadata: Metadata = {
  alternates: { canonical: "/story/pratap-chetak" },
  title: "Maharana Pratap and Chetak · A Scroll Story",
  description:
    "Nine scenes of courage and companionship: Maharana Pratap and his horse Chetak, from the Aravalli hills to the Battle of Haldighati in 1576, told over a painted Rajasthani sky.",
};

export default function PratapChetakStoryPage() {
  return <PratapStory />;
}
