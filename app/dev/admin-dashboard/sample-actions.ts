"use server";

import type { OverviewSnapshot } from "@/lib/admin/overview";
import { sampleSnapshot, simulateArrival } from "@/lib/admin/sample";

/**
 * Development only: stands in for `refreshOverview` in the preview, so the preview takes the same road as the real page (a server
 * render, then a server action every few seconds) with SAMPLE data and one pretend new enquiry per call. It does not exist in
 * production.
 */
export async function refreshSample(): Promise<OverviewSnapshot> {
  if (process.env.NODE_ENV === "production") throw new Error("Not found");
  const now = Date.now();
  return simulateArrival(sampleSnapshot(now), now);
}
