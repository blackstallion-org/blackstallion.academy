import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type StaffRole = "operations" | "executive_admin";
export const STAFF_ROLES: readonly string[] = ["operations", "executive_admin"];

/** True only for roles that may use the admin console. Roles are read fresh from the database on every request. */
export function isStaffRole(role: unknown): role is StaffRole {
  return typeof role === "string" && STAFF_ROLES.includes(role);
}

/**
 * Resolve the signed-in staff member, or redirect. `getUser()` re-validates the session with Supabase Auth on every
 * call (a forged or expired cookie fails). The role comes from public.profiles under RLS, never from the client.
 */
export async function requireStaff() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) redirect("/admin/login?e=unconfigured");
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/admin/login");
  const { data: profile } = await supabase.from("profiles").select("display_name, role").eq("id", auth.user.id).maybeSingle();
  if (!isStaffRole(profile?.role)) redirect("/admin/login?e=forbidden");
  return { supabase, user: auth.user, profile: profile as { display_name: string; role: StaffRole } };
}
