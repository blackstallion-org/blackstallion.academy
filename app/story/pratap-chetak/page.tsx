import type { Metadata } from "next";
import { PersonalStoryPage } from "@/components/history-scroll/HistoryPages";
import { pratapChetak } from "@/lib/content/history/pratap-chetak";

export const metadata: Metadata = {
  alternates: { canonical: pratapChetak.route },
  title: pratapChetak.title,
  description: pratapChetak.description,
};

export default function Page() {
  return <PersonalStoryPage page={pratapChetak} />;
}
