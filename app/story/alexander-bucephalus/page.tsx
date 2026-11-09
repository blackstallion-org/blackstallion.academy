import type { Metadata } from "next";
import { PersonalStoryPage } from "@/components/history-scroll/HistoryPages";
import { alexander } from "@/lib/content/history/alexander";

export const metadata: Metadata = {
  alternates: { canonical: alexander.route },
  title: alexander.title,
  description: alexander.description,
};

export default function Page() {
  return <PersonalStoryPage page={alexander} />;
}
