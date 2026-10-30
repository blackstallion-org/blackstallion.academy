"use server";

import { loadOverview } from "@/lib/admin/overview-server";
import type { OverviewSnapshot } from "@/lib/admin/overview";
import { requireStaff } from "@/lib/auth/admin";

/**
 * The dashboard's live refresh. Every few seconds the open dashboard calls this; like every console action it re-checks the staff
 * role on the server first (a signed-out or non-staff caller is redirected and gets nothing), then reads as that user under RLS.
 * It returns a plain, serialisable snapshot of counts and names only.
 */
export async function refreshOverview(): Promise<OverviewSnapshot> {
  const { supabase } = await requireStaff();
  return loadOverview(supabase);
}
