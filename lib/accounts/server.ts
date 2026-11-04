import { redirect } from "next/navigation";
import { fetchStaffProfile, isStaffRole } from "@/lib/auth/admin";
import { isMemberKind, type MemberKind, type MemberStatus } from "@/lib/accounts/kinds";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type Member = {
  profile_id: string;
  kind: MemberKind;
  status: MemberStatus;
  full_name: string;
  email: string | null;
  phone: string | null;
  organisation: string | null;
  city: string | null;
  details: Record<string, string>;
  created_at: string;
};

export const MEMBER_COLUMNS = "profile_id, kind, status, full_name, email, phone, organisation, city, details, created_at";

/** Narrows a database row to a Member; anything unexpected becomes null rather than a guess. */
export function toMember(row: unknown): Member | null {
  if (typeof row !== "object" || row === null) return null;
  const r = row as Record<string, unknown>;
  if (!isMemberKind(r.kind) || typeof r.profile_id !== "string" || typeof r.full_name !== "string") return null;
  const status = r.status === "active" || r.status === "pending" || r.status === "suspended" ? r.status : "pending";
  const details: Record<string, string> = {};
  if (typeof r.details === "object" && r.details !== null) {
    for (const [k, v] of Object.entries(r.details as Record<string, unknown>)) if (typeof v === "string") details[k] = v;
  }
  const str = (v: unknown) => (typeof v === "string" && v ? v : null);
  return { profile_id: r.profile_id, kind: r.kind, status, full_name: r.full_name, email: str(r.email), phone: str(r.phone), organisation: str(r.organisation), city: str(r.city), details, created_at: String(r.created_at ?? "") };
}

/**
 * The signed-in member and their own row (read under RLS: the policy returns only the caller's row). Signed-out
 * visitors go to the login page; staff without a member row go to the console. `member` is null for a signed-in
 * account that never chose a kind (for example an older cadet profile).
 */
export async function requireMember() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) redirect("/admin/login?e=unconfigured");
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/admin/login");
  const { data } = await supabase.from("member_accounts").select(MEMBER_COLUMNS).eq("profile_id", auth.user.id).maybeSingle();
  const member = toMember(data);
  if (!member) {
    const staff = await fetchStaffProfile(supabase as unknown as Parameters<typeof fetchStaffProfile>[0], auth.user.id);
    if (isStaffRole(staff?.role)) redirect("/admin");
  }
  return { supabase, user: auth.user, member };
}
