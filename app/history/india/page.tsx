import type { Metadata } from "next";
import { AnthologyPage } from "@/components/history-scroll/HistoryPages";
import { india } from "@/lib/content/history/india";

export const metadata: Metadata = {
  alternates: { canonical: india.route },
  title: india.title,
  description: india.description,
};

export default function Page() {
  return <AnthologyPage page={india} />;
}
