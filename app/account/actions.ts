"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { logAdminError } from "@/lib/admin/server";
import { isMemberKind, parseProfileUpdate, parseSignUp } from "@/lib/accounts/kinds";
import { consumeRateLimit } from "@/lib/security/rate-limit";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type AccountFormState = { error?: string; notice?: string } | null;

async function client() {
  const h = await headers();
  return { ip: (h.get("x-forwarded-for")?.split(",")[0] || h.get("x-real-ip") || "unknown").trim().slice(0, 64), host: h.get("x-forwarded-host") || h.get("host") || "", proto: h.get("x-forwarded-proto") || "https" };
}

const CHECK_MAIL = "Almost there. We sent a link to your e-mail address: open it to confirm the address, then sign in.";

/**
 * Create an account (student, parent, teacher or school). Anyone may call this; it can only ever make a least-privilege
 * member (the database trigger pins the role to 'cadet' and decides the status from the kind). Answers the same way
 * whether or not the address is already registered, so the form cannot be used to find out who has an account.
 */
export async function createAccount(_prev: AccountFormState, data: FormData): Promise<AccountFormState> {
  const { ip, host, proto } = await client();
  if (!(await consumeRateLimit("signup", ip)).allowed) return { error: "Too many accounts from this connection. Please try again in an hour." };
  // A hidden field real visitors never fill: a bot that does gets the same friendly answer and nothing is created.
  if (String(data.get("website") ?? "").trim() !== "") return { notice: CHECK_MAIL };
  const parsed = parseSignUp({
    kind: data.get("kind"), email: data.get("email"), password: data.get("password"), confirm: data.get("confirm"),
    full_name: data.get("full_name"), consent: data.get("consent"),
    ...Object.fromEntries([...data.entries()].filter(([k]) => !["kind", "email", "password", "confirm", "full_name", "consent", "website"].includes(k))),
  });
  if (!parsed.ok) return { error: parsed.error };
  const { value } = parsed;
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { error: "Account creation is not switched on yet. Please check back soon." };
  const origin = process.env.NEXT_PUBLIC_SITE_URL || (host ? `${proto}://${host}` : "");
  const { data: result, error } = await supabase.auth.signUp({
    email: value.email,
    password: value.password,
    options: {
      emailRedirectTo: `${origin}/auth/confirm?next=/account`,
      data: { member_kind: value.kind, full_name: value.full_name, phone: value.phone, organisation: value.organisation, city: value.city, details: value.details },
    },
  });
  if (error) {
    logAdminError("account.sign_up_failed", error);
    if (error.code === "weak_password") return { error: "That password is too easy to guess. Try a longer one with letters and numbers." };
    if (error.code === "over_email_send_rate_limit" || error.status === 429) return { error: "Too many e-mails were sent just now. Please wait a few minutes and try again." };
    return { error: "We could not create that account. If you already have one, sign in or reset your password." };
  }
  // Projects that do not require e-mail confirmation hand back a session straight away.
  if (result.session) redirect("/account");
  return { notice: CHECK_MAIL };
}

/** A member edits their own details. The column grants and RLS in the database are the real lock; this validates first. */
export async function updateMemberProfile(_prev: AccountFormState, data: FormData): Promise<AccountFormState> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { error: "Not configured." };
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/admin/login");
  const own = await supabase.from("member_accounts").select("kind").eq("profile_id", auth.user.id).maybeSingle();
  const kind = (own.data as { kind?: unknown } | null)?.kind;
  if (!isMemberKind(kind)) return { error: "Your account details could not be found." };
  const parsed = parseProfileUpdate(kind, Object.fromEntries(data.entries()));
  if (!parsed.ok) return { error: parsed.error };
  const { data: rows, error } = await supabase.from("member_accounts").update(parsed.value).eq("profile_id", auth.user.id).select("profile_id");
  if (error) {
    logAdminError("account.profile_update_failed", error);
    return { error: "Your details could not be saved. Please try again." };
  }
  if (!rows?.length) return { error: "Nothing was saved: your account is on hold. Please contact the academy." };
  revalidatePath("/account");
  return { notice: "Saved." };
}
