"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isStaffRole, requireStaff } from "@/lib/auth/admin";
import { consumeRateLimit } from "@/lib/security/rate-limit";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { objectPath, validateUpload } from "@/lib/storage/validate";

export type FormState = { error?: string; notice?: string } | null;

async function client() {
  const h = await headers();
  return { ip: (h.get("x-forwarded-for")?.split(",")[0] || h.get("x-real-ip") || "unknown").trim().slice(0, 64), host: h.get("x-forwarded-host") || h.get("host") || "", proto: h.get("x-forwarded-proto") || "https" };
}

const credentials = z.object({ email: z.string().trim().email().max(160), password: z.string().min(8).max(200) });

/** Staff sign-in. Generic errors only (no hint whether the e-mail exists). Non-staff accounts are signed out again. */
export async function signIn(_prev: FormState, data: FormData): Promise<FormState> {
  const { ip } = await client();
  if (!(await consumeRateLimit("login", ip)).allowed) return { error: "Too many attempts. Please wait fifteen minutes." };
  const parsed = credentials.safeParse({ email: data.get("email"), password: data.get("password") });
  if (!parsed.success) return { error: "Enter your staff e-mail and password." };
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { error: "Sign-in is not configured yet." };
  const { data: auth, error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error || !auth.user) return { error: "Those details did not match a staff account." };
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", auth.user.id).maybeSingle();
  if (!isStaffRole(profile?.role)) {
    await supabase.auth.signOut();
    return { error: "This account does not have staff access." };
  }
  redirect("/admin");
}

export async function signOut() {
  const supabase = await createSupabaseServerClient();
  await supabase?.auth.signOut();
  redirect("/admin/login");
}

/** Always answers the same way, so the form cannot be used to discover which e-mails have accounts. */
export async function requestPasswordReset(_prev: FormState, data: FormData): Promise<FormState> {
  const { ip, host, proto } = await client();
  if (!(await consumeRateLimit("login", ip)).allowed) return { error: "Too many attempts. Please wait fifteen minutes." };
  const email = z.string().trim().email().max(160).safeParse(data.get("email"));
  if (!email.success) return { error: "Enter a valid e-mail address." };
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { error: "Password reset is not configured yet." };
  const origin = process.env.NEXT_PUBLIC_SITE_URL || (host ? `${proto}://${host}` : "");
  await supabase.auth.resetPasswordForEmail(email.data, { redirectTo: `${origin}/auth/confirm?next=/admin/reset` });
  return { notice: "If that address belongs to a staff account, a reset link is on its way. It expires in one hour." };
}

const strongPassword = z.string().min(12, "Use at least 12 characters.").max(200).refine((p) => /[a-zA-Z]/.test(p) && /\d/.test(p), "Use letters and at least one number.");

export async function updatePassword(_prev: FormState, data: FormData): Promise<FormState> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { error: "Not configured." };
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { error: "Your reset link has expired. Request a new one." };
  const pw = strongPassword.safeParse(data.get("password"));
  if (!pw.success) return { error: pw.error.issues[0]?.message ?? "Choose a stronger password." };
  if (pw.data !== data.get("confirm")) return { error: "The two passwords do not match." };
  const { error } = await supabase.auth.updateUser({ password: pw.data });
  if (error) return { error: "The password could not be changed. Request a new link and try again." };
  redirect("/admin");
}

const statuses = ["new", "reviewing", "contacted", "qualified", "closed", "rejected"] as const;

/** Lead status change: staff only; RLS + column grants allow only status/assignee; the change is audited in the database. */
export async function setLeadStatus(data: FormData) {
  const { supabase } = await requireStaff();
  const id = z.string().uuid().safeParse(data.get("id"));
  const status = z.enum(statuses).safeParse(data.get("status"));
  if (!id.success || !status.success) return;
  await supabase.from("onboarding_leads").update({ status: status.data }).eq("id", id.data);
  revalidatePath("/admin");
}

/** Website image upload to the public `website-assets` bucket (staff only; type sniffed from the bytes). */
export async function uploadMedia(_prev: FormState, data: FormData): Promise<FormState> {
  const { supabase, user } = await requireStaff();
  const file = data.get("file");
  const alt = z.string().trim().min(3, "Describe the image (alt text).").max(300).safeParse(data.get("alt"));
  if (!(file instanceof File)) return { error: "Choose an image." };
  if (!alt.success) return { error: alt.error.issues[0]?.message ?? "Add alt text." };
  const bytes = new Uint8Array(await file.arrayBuffer());
  const check = validateUpload(bytes, "website-assets");
  if (!check.ok) return { error: check.error };
  const path = objectPath("site", check.type.ext);
  const { error: upErr } = await supabase.storage.from("website-assets").upload(path, bytes, { contentType: check.type.mime, upsert: false });
  if (upErr) return { error: "Upload failed. Nothing was saved." };
  const { error: rowErr } = await supabase.from("media_assets").insert({ storage_path: path, alt_text: alt.data, mime_type: check.type.mime, bytes: bytes.length, uploaded_by: user.id });
  if (rowErr) {
    await supabase.storage.from("website-assets").remove([path]);
    return { error: "The image could not be recorded, so it was removed again." };
  }
  revalidatePath("/admin/media");
  return { notice: "Uploaded." };
}

export async function deleteMedia(data: FormData) {
  const { supabase } = await requireStaff();
  const id = z.string().uuid().safeParse(data.get("id"));
  if (!id.success) return;
  const { data: row } = await supabase.from("media_assets").select("storage_path").eq("id", id.data).maybeSingle();
  if (!row) return;
  await supabase.storage.from("website-assets").remove([row.storage_path]);
  await supabase.from("media_assets").delete().eq("id", id.data);
  revalidatePath("/admin/media");
}
