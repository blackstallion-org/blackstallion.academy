import type { Metadata } from "next";
import { AnthologyPage } from "@/components/history-scroll/HistoryPages";
import { world } from "@/lib/content/history/world";

export const metadata: Metadata = {
  alternates: { canonical: world.route },
  title: world.title,
  description: world.description,
};

export default function Page() {
  return <AnthologyPage page={world} />;
}
