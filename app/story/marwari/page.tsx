import type { Metadata } from "next";
import { MarwariStory } from "@/components/sections/marwari-story/MarwariStory";

export const metadata: Metadata = {
  alternates: { canonical: "/story/marwari" },
  title: "The Marwari Cavalry · A Scroll Story",
  description:
    "Eighteen pages in four chapters, Origin, Cavalry, Warfare and Legacy, told over a Rajasthani miniature. The Marwari horse is the same rigged model used across the site.",
};

export default function MarwariStoryPage() {
  return <MarwariStory />;
}
