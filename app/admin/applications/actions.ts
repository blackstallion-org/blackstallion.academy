"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { APPLICATION_STATUSES, type ApplicationKind } from "@/lib/registration/model";
import { notify, type Template } from "@/lib/registration/notify";
import { friendlyDbError, requireAdmissions } from "@/lib/registration/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export type ReviewState = { error?: string; notice?: string } | null;

const uuid = z.string().uuid();
const reviewInput = z.object({ id: uuid, to: z.enum(APPLICATION_STATUSES), note: z.string().trim().max(2000).optional() });

async function load(supabase: Awaited<ReturnType<typeof requireAdmissions>>["supabase"], id: string) {
  const { data } = await supabase.from("applications").select("id, reference, kind, applicant_id, applicant_email, applicant_name").eq("id", id).single();
  return data as { id: string; reference: string; kind: ApplicationKind; applicant_id: string; applicant_email: string | null; applicant_name: string | null } | null;
}
async function tell(app: Awaited<ReturnType<typeof load>>, template: Template) {
  if (!app) return;
  await notify(template, { userId: app.applicant_id, email: app.applicant_email ?? "", name: app.applicant_name ?? "" }, { id: app.id, reference: app.reference, kind: app.kind });
}

/** Moves an application along (ADMISSIONS / SUPER_ADMIN). The database decides whether the move is allowed and writes the history. */
export async function reviewApplication(_prev: ReviewState, data: FormData): Promise<ReviewState> {
  const { supabase } = await requireAdmissions();
  const parsed = reviewInput.safeParse({ id: data.get("id"), to: data.get("to"), note: data.get("note") || undefined });
  if (!parsed.success) return { error: "That request was not understood." };
  const { error } = await supabase.rpc("application_review", { p_application: parsed.data.id, p_to: parsed.data.to, p_note: parsed.data.note ?? null });
  if (error) return { error: friendlyDbError(error) };
  const template: Partial<Record<string, Template>> = { info_required: "info_requested", approved: "application_approved", rejected: "application_rejected" };
  const t = template[parsed.data.to];
  if (t) await tell(await load(supabase, parsed.data.id), t);
  revalidatePath(`/admin/applications/${parsed.data.id}`);
  revalidatePath("/admin/applications");
  return { notice: "Saved." };
}

/** Enrols an approved, paid (or fee-free) cadet application: creates the operations cadet and its passport code. */
export async function enrolApplication(_prev: ReviewState, data: FormData): Promise<ReviewState> {
  const { supabase } = await requireAdmissions();
  const id = uuid.safeParse(data.get("id"));
  if (!id.success) return { error: "That request was not understood." };
  const { error } = await supabase.rpc("application_enrol", { p_application: id.data });
  if (error) return { error: friendlyDbError(error) };
  await tell(await load(supabase, id.data), "enrolment_confirmed");
  revalidatePath(`/admin/applications/${id.data}`);
  return { notice: "Enrolled. The cadet's passport code is now in the parent's dashboard." };
}

const activateInput = z.object({ id: uuid, role: z.enum(["INSTRUCTOR", "GROOM", "SCHOOL_ADMIN"]), hub: uuid.optional() });

/**
 * SUPER_ADMIN only (the database refuses anyone else): gives an approved staff or school applicant their operational role.
 * The role is also written to the account's app metadata (server-side, secret key) so it survives and reaches the field apps.
 */
export async function activateAccount(_prev: ReviewState, data: FormData): Promise<ReviewState> {
  const { supabase } = await requireAdmissions();
  const parsed = activateInput.safeParse({ id: data.get("id"), role: data.get("role"), hub: data.get("hub") || undefined });
  if (!parsed.success) return { error: "Choose a role." };
  const { error } = await supabase.rpc("application_activate_account", { p_application: parsed.data.id, p_role: parsed.data.role, p_hub: parsed.data.hub ?? null });
  if (error) return { error: friendlyDbError(error) };
  const app = await load(supabase, parsed.data.id);
  const admin = createSupabaseAdminClient();
  if (admin && app) {
    const res = await admin.auth.admin.updateUserById(app.applicant_id, { app_metadata: { role: parsed.data.role } });
    if (res.error) console.error(JSON.stringify({ event: "registration.app_metadata_failed", status: res.error.status }));
  }
  revalidatePath(`/admin/applications/${parsed.data.id}`);
  return { notice: `Activated as ${parsed.data.role.replace("_", " ").toLowerCase()}. They see it the next time they sign in.` };
}
