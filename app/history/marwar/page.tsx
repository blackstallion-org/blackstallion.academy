import type { Metadata } from "next";
import { MarwarStory } from "@/components/sections/marwar-history/MarwarStory";
import { page } from "@/lib/content/history/marwar";

export const metadata: Metadata = {
  alternates: { canonical: page.route },
  title: page.title,
  description: page.description,
};

/** Reel 24 · Marwar: the horse, the crown & the empire. Painted reconstructions beside genuine archive photographs. */
export default function Page() {
  return <MarwarStory />;
}
