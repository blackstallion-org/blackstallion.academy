"use server";

import { randomUUID } from "node:crypto";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { consumeRateLimit } from "@/lib/security/rate-limit";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  APPLICATION_KINDS, CONSENT_VERSION, DOC_TYPES, KIND_INFO, checkDocument, childSchema, feeWithGst, isEditable, parsePayload,
  type ApplicationKind, type ApplicationStatus,
} from "@/lib/registration/model";
import { notify } from "@/lib/registration/notify";
import { createRazorpayOrder, razorpayConfigured } from "@/lib/registration/razorpay";
import { friendlyDbError, requireAccount } from "@/lib/registration/server";

export type ApplyState = { error?: string; notice?: string; field?: string } | null;

const uuid = z.string().uuid();
async function ip() {
  const h = await headers();
  return (h.get("x-forwarded-for")?.split(",")[0] || h.get("x-real-ip") || "unknown").trim().slice(0, 64);
}
async function limited() {
  return !(await consumeRateLimit("application", await ip())).allowed;
}
const formObject = (data: FormData) => Object.fromEntries([...data.entries()].filter(([, v]) => typeof v === "string"));

/** Adds a child to the guardian's account. Children never get a login of their own. */
export async function addChild(_prev: ApplyState, data: FormData): Promise<ApplyState> {
  const { supabase } = await requireAccount("/enroll");
  if (await limited()) return { error: "Too many changes in a short time. Please wait a few minutes." };
  const parsed = childSchema.safeParse(formObject(data));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the child's details.", field: String(parsed.error.issues[0]?.path[0] ?? "") };
  const { error } = await supabase.from("guardian_children").insert(parsed.data);
  if (error) return { error: friendlyDbError(error) };
  revalidatePath("/enroll");
  return { notice: `${parsed.data.first_name} is on your account.` };
}

/**
 * Starts (or updates) a draft application of any kind. The fields each kind needs are validated here and again by the
 * database's checks; the applicant, the status and every decision are set by the database, never by this request.
 */
export async function saveApplication(_prev: ApplyState, data: FormData): Promise<ApplyState> {
  const kindRaw = String(data.get("kind") ?? "");
  if (!(APPLICATION_KINDS as readonly string[]).includes(kindRaw)) return { error: "That form was not understood." };
  const kind = kindRaw as ApplicationKind;
  const { supabase, account } = await requireAccount(KIND_INFO[kind].route);
  if (await limited()) return { error: "Too many changes in a short time. Please wait a few minutes." };
  if (String(data.get("website") ?? "").trim() !== "") return { notice: "Saved." }; // honeypot: bots get a friendly nothing

  const payload = parsePayload(kind, formObject(data));
  if (!payload.ok) return { error: payload.error, field: payload.field };
  const row: Record<string, unknown> = { kind, payload: payload.value };
  if (kind === "cadet") {
    const child = uuid.safeParse(data.get("child_id"));
    const program = uuid.safeParse(data.get("program_id"));
    if (!child.success) return { error: "Choose the child you are enrolling.", field: "child_id" };
    if (!program.success) return { error: "Choose a programme.", field: "program_id" };
    row.child_id = child.data;
    row.program_id = program.data;
    const hub = uuid.safeParse(data.get("hub_id"));
    row.hub_id = hub.success ? hub.data : null;
  }

  const existing = uuid.safeParse(data.get("application_id"));
  let id: string;
  if (existing.success) {
    const { data: rows, error } = await supabase.from("applications").update(row).eq("id", existing.data).eq("applicant_id", account.id).select("id");
    if (error) return { error: friendlyDbError(error) };
    if (!rows?.length) return { error: "This application can no longer be edited." };
    id = existing.data;
  } else {
    const { data: created, error } = await supabase.from("applications").insert(row).select("id").single();
    if (error) return { error: friendlyDbError(error) };
    id = created.id as string;
  }
  revalidatePath("/enroll/status");
  redirect(`/enroll/status/${id}`);
}

/** Uploads one document into the applicant's own folder of the private bucket, then records it. */
export async function uploadDocument(_prev: ApplyState, data: FormData): Promise<ApplyState> {
  const { supabase, account } = await requireAccount("/enroll/status");
  if (await limited()) return { error: "Too many uploads in a short time. Please wait a few minutes." };
  const appId = uuid.safeParse(data.get("application_id"));
  const docType = z.enum(DOC_TYPES).safeParse(data.get("doc_type"));
  const file = data.get("file");
  if (!appId.success || !docType.success) return { error: "Choose what kind of document this is." };
  if (!(file instanceof File) || file.size === 0) return { error: "Choose a file to upload." };
  const { data: app } = await supabase.from("applications").select("id, status").eq("id", appId.data).maybeSingle();
  if (!app || !isEditable(app.status as ApplicationStatus)) return { error: "Documents can only be added while the application is being prepared." };
  const head = new Uint8Array(await file.slice(0, 16).arrayBuffer());
  const checked = checkDocument(file, head);
  if (!checked.ok) return { error: checked.error };
  const path = `${account.id}/${appId.data}/${randomUUID().slice(0, 8)}-${checked.safeName}`;
  const up = await supabase.storage.from("application-documents").upload(path, file, { contentType: file.type, upsert: false });
  if (up.error) return { error: "The file could not be stored. Please try again." };
  const { error } = await supabase.from("application_documents").insert({
    application_id: appId.data, doc_type: docType.data, storage_path: path, file_name: file.name.slice(0, 160), mime_type: file.type, size_bytes: file.size,
  });
  if (error) {
    await supabase.storage.from("application-documents").remove([path]);
    return { error: friendlyDbError(error) };
  }
  revalidatePath(`/enroll/status/${appId.data}`);
  return { notice: "Uploaded." };
}

export async function removeDocument(data: FormData) {
  const { supabase } = await requireAccount("/enroll/status");
  const id = uuid.safeParse(data.get("document_id"));
  if (!id.success) return;
  const { data: doc } = await supabase.from("application_documents").select("storage_path, application_id").eq("id", id.data).maybeSingle();
  if (!doc) return;
  const { error } = await supabase.from("application_documents").delete().eq("id", id.data);
  if (!error) await supabase.storage.from("application-documents").remove([doc.storage_path as string]);
  revalidatePath(`/enroll/status/${doc.application_id}`);
}

/** Submits the application with the guardian's / applicant's consent. The database checks documents, ages and ownership. */
export async function submitApplication(_prev: ApplyState, data: FormData): Promise<ApplyState> {
  const { supabase, account } = await requireAccount("/enroll/status");
  if (await limited()) return { error: "Too many attempts in a short time. Please wait a few minutes." };
  const id = uuid.safeParse(data.get("application_id"));
  if (!id.success) return { error: "That application was not understood." };
  if (data.get("consent") !== "on") return { error: "Tick the consent box to submit.", field: "consent" };
  const { error } = await supabase.rpc("application_submit", { p_application: id.data, p_consent_version: CONSENT_VERSION });
  if (error) return { error: friendlyDbError(error) };
  const { data: app } = await supabase.from("applications").select("id, reference, kind").eq("id", id.data).single();
  if (app) await notify("application_received", { userId: account.id, email: account.email, name: account.full_name }, { id: app.id, reference: app.reference, kind: app.kind });
  revalidatePath(`/enroll/status/${id.data}`);
  revalidatePath("/sovereign");
  return { notice: "Submitted. We have sent a receipt to your e-mail address." };
}

export async function withdrawApplication(data: FormData) {
  const { supabase } = await requireAccount("/enroll/status");
  const id = uuid.safeParse(data.get("application_id"));
  if (!id.success) return;
  await supabase.rpc("application_withdraw", { p_application: id.data });
  revalidatePath(`/enroll/status/${id.data}`);
  revalidatePath("/sovereign");
}

export type CheckoutState = { error?: string; order?: { id: string; amount: number; keyId: string; reference: string; name: string; email: string } } | null;

/**
 * Starts the enrolment-fee payment for an approved cadet application. The amount comes from the database (the fee fixed at
 * approval plus the programme's GST), never from the browser. One pending order is reused rather than creating a second.
 * Checkout's own success callback does NOT mark anything paid: only the verified webhook does.
 */
export async function startPayment(_prev: CheckoutState, data: FormData): Promise<CheckoutState> {
  const { supabase, account } = await requireAccount("/enroll/status");
  if (await limited()) return { error: "Too many attempts in a short time. Please wait a few minutes." };
  if (!razorpayConfigured()) return { error: "Online payment is not switched on yet. The academy will contact you about the fee." };
  const admin = createSupabaseAdminClient();
  if (!admin) return { error: "Online payment is not switched on yet. The academy will contact you about the fee." };
  const id = uuid.safeParse(data.get("application_id"));
  if (!id.success) return { error: "That application was not understood." };
  const { data: app } = await supabase.from("applications").select("id, reference, kind, status, fee_paise, payment_status, program_id, applicant_id").eq("id", id.data).maybeSingle();
  if (!app || app.applicant_id !== account.id) return { error: "That application could not be found." };
  if (app.kind !== "cadet" || app.status !== "approved" || app.payment_status !== "pending" || !app.fee_paise) return { error: "There is no fee to pay on this application." };
  const { data: program } = await supabase.from("programs").select("gst_rate").eq("id", app.program_id).single();
  const money = feeWithGst(app.fee_paise as number, Number(program?.gst_rate ?? 0.18));

  const open = await admin.from("payment_records").select("gateway_order_id, amount_paise").eq("application_id", app.id).eq("status", "PENDING").maybeSingle();
  let orderId = open.data?.gateway_order_id as string | undefined;
  if (!orderId || open.data?.amount_paise !== money.total) {
    const order = await createRazorpayOrder({ amountPaise: money.total, receipt: app.reference, notes: { application: app.reference } });
    if (!order.ok) return { error: "The payment could not be started. Please try again in a few minutes." };
    orderId = order.order.id;
    const { error } = await admin.from("payment_records").insert({
      parent_id: account.id, application_id: app.id, gateway_order_id: orderId, amount_paise: money.total,
      amount_paid: money.total / 100, gst_amount: money.gst / 100, payment_type: "ONBOARDING", status: "PENDING",
    });
    if (error) return { error: "The payment could not be started. Please try again in a few minutes." };
  }
  return { order: { id: orderId, amount: money.total, keyId: process.env.RAZORPAY_KEY_ID as string, reference: app.reference, name: account.full_name, email: account.email } };
}
