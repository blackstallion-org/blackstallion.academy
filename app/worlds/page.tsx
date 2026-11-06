import type { Metadata } from "next";
import { FourWorlds } from "@/components/worlds/FourWorlds";
import { WORLDS_CREDITS } from "@/lib/content/worlds";

export const metadata: Metadata = {
  alternates: { canonical: "/worlds" },
  title: "Four Worlds",
  description:
    "One horse, four worlds: a scroll-controlled film that follows a black Marwari from the valley above the academy, into the anatomy that moves him, through the cavalry country of Marwar and out to the future.",
};

export default function WorldsPage() {
  return (
    <>
      <FourWorlds />
      <section aria-label="Credits" className="tone-photo bg-night">
        <p className="gutter py-10 text-xs leading-relaxed text-dust">{WORLDS_CREDITS}</p>
      </section>
    </>
  );
}
