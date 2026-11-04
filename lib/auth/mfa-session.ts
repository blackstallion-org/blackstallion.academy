import { redirect } from "next/navigation";
import { fetchStaffProfile, isStaffRole } from "@/lib/auth/admin";
import { isAdmissionsRole } from "@/lib/registration/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * The signed-in staff or admissions account for /admin/mfa, WITHOUT the second-factor check (that page is where the second
 * factor is added and passed). Anyone else goes to the sign-in page. The role is read from the database under RLS.
 */
export async function requirePrivilegedSession() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) redirect("/admin/login?e=unconfigured");
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/admin/login");
  const profile = await fetchStaffProfile(supabase as unknown as Parameters<typeof fetchStaffProfile>[0], auth.user.id);
  const role = profile?.role;
  if (!isStaffRole(role) && !isAdmissionsRole(role)) redirect("/admin/login?e=forbidden");
  return { supabase, user: auth.user, home: isStaffRole(role) ? "/admin" : "/admin/applications" };
}
