"use server";

import { z } from "zod";

/**
 * Lead capture for every form on the site (contact gates, hub enquiries, MOU requests).
 * Validates on the server. Persistence lands with Supabase (`leads` and `mou_proposals` tables);
 * until then submissions are NOT stored and the confirmation says so. Never log personal data.
 */

export type LeadState = { ok: boolean; message: string; errors?: Record<string, string> } | null;

const phone = z
  .string()
  .trim()
  .regex(/^[+\d][\d\s-]{6,16}$/, "Enter a valid phone number");

const base = z.object({
  gate: z.enum(["parents", "schools", "audit", "partners", "hub", "mou"]),
  name: z.string().trim().min(2, "Please enter your name").max(120),
  email: z.string().trim().email("Enter a valid email").max(160).optional().or(z.literal("")),
  phone: phone.optional().or(z.literal("")),
  organisation: z.string().trim().max(160).optional(),
  message: z.string().trim().max(2000).optional(),
});

export async function submitLead(_prev: LeadState, formData: FormData): Promise<LeadState> {
  const raw = Object.fromEntries(formData.entries());
  const parsed = base.safeParse(raw);
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const issue of parsed.error.issues) errors[String(issue.path[0])] = issue.message;
    return { ok: false, message: "Please check the highlighted fields.", errors };
  }
  if (!parsed.data.email && !parsed.data.phone) {
    return { ok: false, message: "Leave an email or a phone number so we can reply.", errors: { email: "Email or phone required", phone: "Email or phone required" } };
  }
  // TODO(supabase): insert into public.leads (gate, payload) with RLS "anonymous insert only".
  await new Promise((r) => setTimeout(r, 400));
  return { ok: true, message: "Thank you. This form is still in preview and your details were not saved. To be sure we hear you, please email the address shown on this page." };
}
