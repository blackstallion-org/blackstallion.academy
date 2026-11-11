import type { Metadata } from "next";
import { EndCard } from "@/components/film/EndCard";
import { AlexanderExhibition } from "@/components/sections/story/AlexanderExhibition";
import { alexander } from "@/lib/content/history/alexander";
import { exhibition, rooms } from "@/lib/content/history/alexander-exhibition";

/** Reel 23 (since 12 Nov 2026): Alexander and Bucephalus as a twelve-room mosaic exhibition. */
export const metadata: Metadata = {
  alternates: { canonical: exhibition.route },
  title: exhibition.title,
  description: exhibition.description,
};

export default function Page() {
  return (
    <>
      <AlexanderExhibition reel={{ n: 23, act: "ledger" }} intro={exhibition} rooms={rooms} related={alexander.related} />
      <EndCard current={23} />
    </>
  );
}
