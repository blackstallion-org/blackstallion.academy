import { redirect } from "next/navigation";
import { connection } from "next/server";
import { requireStaff } from "@/lib/auth/admin";
import { loadOverview } from "@/lib/admin/overview-server";
import { LiveDashboard } from "@/components/sections/admin/dashboard/LiveDashboard";
import { AdminShell } from "./AdminShell";
import { refreshOverview } from "./overview-actions";

/**
 * The staff overview. It used to be the enquiries list: that is `/admin/enquiries` now, and an old link with filters in it
 * (`/admin?status=new`) is passed on there with the same filters. Rendered whole per request, like every console page (see
 * app/admin/layout.tsx); after that the open page keeps itself fresh through `refreshOverview` (a staff-checked server action).
 */
export default async function AdminOverview({ searchParams }: PageProps<"/admin">) {
  await connection();
  const { supabase, profile } = await requireStaff();
  const params = await searchParams;
  const carried = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    const first = Array.isArray(value) ? value[0] : value;
    if (typeof first === "string" && first !== "") carried.set(key, first);
  }
  if (carried.size) redirect(`/admin/enquiries?${carried.toString()}`);

  const initial = await loadOverview(supabase);
  return (
    <AdminShell name={profile.display_name} current="overview">
      <LiveDashboard initial={initial} refresh={refreshOverview} />
    </AdminShell>
  );
}
