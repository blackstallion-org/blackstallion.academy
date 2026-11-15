import type { Metadata } from "next";
import Link from "next/link";
import { FourWorldsScroll } from "@/components/worlds/FourWorldsScroll";
import { WORLDS_CREDITS } from "@/lib/content/worlds";

export const metadata: Metadata = {
  alternates: { canonical: "/worlds" },
  title: "The Opening",
  description:
    "One horse, one lineage: a scroll-controlled film that follows a black Marwari from the valley above the academy into the cavalry country of Marwar, and up into the sky above it.",
};

export default function WorldsPage() {
  return (
    <>
      <FourWorldsScroll />
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
