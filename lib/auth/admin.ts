import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Staff roles allowed into /admin.
 * - Live operations project (supabase/live): public.users.role = 'SUPER_ADMIN'.
 * - Website-only schema (supabase/migrations, used when the website has its own project): public.profiles.role
 *   'operations' or 'executive_admin'.
 * School admins, instructors, grooms and parents never reach the console.
 */
export const STAFF_ROLES: readonly string[] = ["SUPER_ADMIN", "operations", "executive_admin"];
export type StaffProfile = { display_name: string; role: string };

/** True only for roles that may use the admin console. Roles are read fresh from the database on every request. */
export function isStaffRole(role: unknown): role is string {
  return typeof role === "string" && STAFF_ROLES.includes(role);
}

type RowQuery = {
  from: (table: string) => {
    select: (cols: string) => { eq: (col: string, v: string) => { maybeSingle: () => PromiseLike<{ data: Record<string, unknown> | null; error: unknown }> } };
  };
};

/**
 * Reads the signed-in user's own role row under RLS (the policies only ever return the caller's own row).
 * Tries the live operations table first, then the website-only profile table; anything else means "no staff role".
 */
export async function fetchStaffProfile(supabase: RowQuery, userId: string): Promise<StaffProfile | null> {
  const live = await supabase.from("users").select("full_name, role").eq("id", userId).maybeSingle();
  if (!live.error && live.data) return { display_name: String(live.data.full_name ?? "Staff"), role: String(live.data.role ?? "") };
  const site = await supabase.from("profiles").select("display_name, role").eq("id", userId).maybeSingle();
  if (!site.error && site.data) return { display_name: String(site.data.display_name ?? "Staff"), role: String(site.data.role ?? "") };
  return null;
}

/**
 * Resolve the signed-in staff member, or redirect. `getUser()` re-validates the session with Supabase Auth on every
 * call (a forged or expired cookie fails). The role comes from the database under RLS, never from the client.
 */
export async function requireStaff() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) redirect("/admin/login?e=unconfigured");
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/admin/login");
  const profile = await fetchStaffProfile(supabase as unknown as RowQuery, auth.user.id);
  if (!profile || !isStaffRole(profile.role)) redirect("/admin/login?e=forbidden");
  return { supabase, user: auth.user, profile };
}
