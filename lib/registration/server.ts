import { redirect } from "next/navigation";
import { needsSecondFactor } from "@/lib/auth/mfa";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/** Roles that review applications (public.users.role on the live project). */
export const ADMISSIONS_ROLES: readonly string[] = ["SUPER_ADMIN", "ADMISSIONS"];
export const isAdmissionsRole = (role: unknown): role is string => typeof role === "string" && ADMISSIONS_ROLES.includes(role);

export type Account = { id: string; full_name: string; email: string; role: string; email_confirmed: boolean };

/**
 * The signed-in person and their operations account row (read under RLS: a user sees only their own row). `getUser()`
 * re-validates the session with Supabase Auth on every call, so a forged or expired cookie counts as signed out.
 */
export async function currentAccount() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { supabase: null, account: null } as const;
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { supabase, account: null } as const;
  const { data } = await supabase.from("users").select("id, full_name, email, role").eq("id", auth.user.id).maybeSingle();
  const account: Account = {
    id: auth.user.id,
    full_name: String(data?.full_name ?? auth.user.user_metadata?.full_name ?? "Member"),
    email: String(data?.email ?? auth.user.email ?? ""),
    role: String(data?.role ?? "PARENT"),
    email_confirmed: Boolean(auth.user.email_confirmed_at),
  };
  return { supabase, account } as const;
}

/** A signed-in account, or a redirect to the sign-in page that comes back to `next` afterwards. */
export async function requireAccount(next: string) {
  const { supabase, account } = await currentAccount();
  if (!supabase) redirect("/admin/login?e=unconfigured");
  if (!account) redirect(`/login?next=${encodeURIComponent(next)}`);
  return { supabase, account };
}

/** ADMISSIONS or SUPER_ADMIN, or a redirect. The database checks the role again in every function and policy. */
export async function requireAdmissions() {
  const { supabase, account } = await currentAccount();
  if (!supabase) redirect("/admin/login?e=unconfigured");
  if (!account) redirect("/admin/login");
  if (!isAdmissionsRole(account.role)) redirect("/admin/login?e=forbidden");
  if (await needsSecondFactor(supabase)) redirect("/admin/mfa"); // STAFF_MFA_REQUIRED=1 (lib/auth/mfa.ts)
  return { supabase, account, profile: { display_name: account.full_name, role: account.role } };
}

/** Maps a database error to one sentence for the person (never the raw message for permission errors). */
export function friendlyDbError(error: { code?: string; message?: string } | null | undefined): string {
  if (!error) return "Something went wrong. Please try again.";
  switch (error.code) {
    case "42501": return error.message && /confirm your e-mail/i.test(error.message) ? "Confirm your e-mail address first: open the link we sent you." : "Your account cannot do that.";
    case "P0002": return "That application could not be found.";
    case "23505": return "There is already an open application for this. Continue it from your dashboard instead.";
    case "22023": return (error.message ?? "That step is not possible now.").replace(/^[a-z]/, (c) => c.toUpperCase()).replace(/([^.])$/, "$1.");
    case "23514": return "One of the answers is outside what we accept. Check the form.";
    default: return "The change was not saved. Please try again.";
  }
}
