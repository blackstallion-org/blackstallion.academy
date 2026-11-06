import type { Metadata } from "next";
import Link from "next/link";
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
