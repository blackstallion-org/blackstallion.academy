import type { Metadata } from "next";
import Link from "next/link";
import { WORLDS_CREDITS } from "@/lib/content/worlds";

export const metadata: Metadata = {
  alternates: { canonical: "/worlds/credits" },
  title: "Four Worlds credits",
  description: "Credits and licences for the Four Worlds introduction film.",
  robots: { index: false },
};

export default function WorldsCreditsPage() {
  return (
    <section aria-label="Credits" className="tone-photo bg-night">
      <div className="gutter py-32">
        <h1 className="mb-6 text-2xl font-semibold text-bone">Four Worlds credits</h1>
        <p className="max-w-2xl text-sm leading-relaxed text-dust">{WORLDS_CREDITS}</p>
        <p className="mt-8 flex flex-wrap gap-x-8 gap-y-3 text-xs uppercase tracking-[0.12em]">
          <Link href="/?intro" className="inline-flex min-h-11 items-center border-b border-current text-bone hover:text-gold">Play the film again</Link>
          <Link href="/" className="inline-flex min-h-11 items-center border-b border-current text-bone hover:text-gold">Return to the academy</Link>
        </p>
      </div>
    </section>
  );
}
