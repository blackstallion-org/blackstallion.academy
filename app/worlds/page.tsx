import type { Metadata } from "next";
import { WorldsReplay } from "@/components/worlds/WorldsReplay";

export const metadata: Metadata = {
  alternates: { canonical: "/worlds" },
  title: "Four Worlds",
  description:
    "One horse, four worlds: a short film that plays by itself, from the valley above the academy, into the anatomy that moves him, through the cavalry country of Marwar and out to the future.",
};

export default function WorldsPage() {
  return <WorldsReplay />;
}
