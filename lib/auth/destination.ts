import { fetchStaffProfile, isStaffRole } from "@/lib/auth/admin";
import { safeNext } from "@/lib/registration/model";
import { isAdmissionsRole } from "@/lib/registration/server";
import type { createSupabaseServerClient } from "@/lib/supabase/server";

type Supabase = NonNullable<Awaited<ReturnType<typeof createSupabaseServerClient>>>;

/**
 * Where a freshly signed-in person goes, whichever method they used (password, Google, phone code). One rule for all:
 * staff and admissions go to their console, members to their account (or the safe `next` they came from), and anyone
 * with only an operations profile (a PARENT created by the database trigger) to the registration portal. Roles are
 * read from the database under RLS, never from the sign-in method or the client. Returns null when the account has no
 * profile row at all (the caller signs it out again).
 */
export async function destinationAfterSignIn(supabase: Supabase, userId: string, next: unknown): Promise<string | null> {
  const profile = await fetchStaffProfile(supabase as unknown as Parameters<typeof fetchStaffProfile>[0], userId);
  if (isStaffRole(profile?.role)) return "/admin";
  if (isAdmissionsRole(profile?.role)) return "/admin/applications";
  const member = await supabase.from("member_accounts").select("profile_id").eq("profile_id", userId).maybeSingle();
  if (member.data) return safeNext(next, "/account");
  // The live project has no member_accounts table: every account there has an operations row (public.users), which the
  // registration routes and the parent dashboard use.
  if (profile) return safeNext(next, "/sovereign");
  return null;
}
