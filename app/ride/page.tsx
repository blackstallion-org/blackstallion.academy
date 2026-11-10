import type { Metadata } from "next";
import { RideRunway } from "@/components/sections/ride/RideRunway";

export const metadata: Metadata = {
  title: "Ride Wild",
  description: "A Marwari stallion at full sprint, drawn as a white grid: scroll to push down the runway past the record, the instruments, the controls and the glass.",
  alternates: { canonical: "/ride" },
};

/** A working 3D page beside the reels (lib/content/site.ts → tools): no reel mark, no end card. */
export default function RidePage() {
  return <RideRunway />;
}
