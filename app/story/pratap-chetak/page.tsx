import type { Metadata } from "next";
import { PratapAfterword } from "@/components/sections/pratap-story/PratapAfterword";
import { PratapStory } from "@/components/sections/pratap-story/PratapStory";

export const metadata: Metadata = {
  alternates: { canonical: "/story/pratap-chetak" },
  title: "Maharana Pratap and Chetak · A Scroll Story",
  description:
    "Six painted chapters of courage and companionship: Maharana Pratap and his horse Chetak, from the bond and the Battle of Haldighati in 1576 to the legend of the escape and the remembrance, told over a painted Rajasthani sky, with the story in short beneath.",
};

export default function PratapChetakStoryPage() {
  return (
    <>
      <PratapStory />
      <PratapAfterword />
    </>
  );
}
