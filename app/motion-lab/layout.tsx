import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Motion Lab",
  description: "Point a camera at a horse: an AI model on your own device finds it, draws its skeleton and measures how it moves.",
  alternates: { canonical: "/motion-lab" },
  // An experimental tool: reachable by link, kept out of search until the owner decides otherwise.
  robots: { index: false, follow: false },
};

export default function MotionLabLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
