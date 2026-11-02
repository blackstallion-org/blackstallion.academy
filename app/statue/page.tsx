import type { Metadata } from "next";
import { CinematicStatueScroll } from "@/components/sections/statue/CinematicStatueScroll";

export const metadata: Metadata = {
  alternates: { canonical: "/statue" },
  title: "The Cadet and the Marwari · The 3D Equestrian Monument",
  description:
    "A six-chapter 3D journey around the academy's bronze of a cadet and a Marwari: Origin, The Steed, The Rider, Craft & Stone, Archive, and a full orbit.",
};

export default function StatuePage() {
  return <CinematicStatueScroll editorial />;
}
