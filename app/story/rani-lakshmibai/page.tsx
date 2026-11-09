import type { Metadata } from "next";
import { PersonalStoryPage } from "@/components/history-scroll/HistoryPages";
import { lakshmibai } from "@/lib/content/history/lakshmibai";

export const metadata: Metadata = {
  alternates: { canonical: lakshmibai.route },
  title: lakshmibai.title,
  description: lakshmibai.description,
};

export default function Page() {
  return <PersonalStoryPage page={lakshmibai} />;
}
