import type { Metadata } from "next";
import { CinematicStatueScroll } from "@/components/sections/statue/CinematicStatueScroll";

export const metadata: Metadata = {
  // Same experience as /statue: point search engines at the one canonical address.
  alternates: { canonical: "/statue" },
  title: "Rossbändiger · The 3D Equestrian Monument",
  description:
    "A six-chapter cinematic 3D journey through the Rossbändiger equestrian statue: Origin, The Steed, The Rider, Craft & Stone, Archive, and the 360° Sovereign Orbit.",
};

export default function LithosPage() {
  return <CinematicStatueScroll />;
}
