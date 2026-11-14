import type { Metadata } from "next";
import Link from "next/link";
import { JourneyFilm } from "@/components/sections/home/JourneyFilm";
import { WORLDS_CREDITS } from "@/lib/content/worlds";

export const metadata: Metadata = {
  alternates: { canonical: "/worlds" },
  title: "The Opening",
  description:
    "One horse, one lineage: a thirty-second film that follows a black Marwari from a Marwar village across the Thar to the citadel gate.",
};

export default function WorldsPage() {
  return (
    <>
      <JourneyFilm id="film" headingAs="h1" />
      <section aria-label="Credits" className="tone-photo bg-night">
        <div className="gutter py-10">
          <Link href="/" className="mb-4 inline-flex min-h-11 items-center border-b border-current text-xs uppercase tracking-[0.12em] text-bone hover:text-gold">
            Return to the academy
          </Link>
          <p className="text-xs leading-relaxed text-dust">{WORLDS_CREDITS}</p>
        </div>
      </section>
    </>
  );
}
