"use server";

import { z } from "zod";

/**
 * Lead capture for every form on the site (contact gates, hub enquiries, MOU requests).
 *
 * Validation runs here on the server for every gate. Delivery uses one integration boundary:
 * set LEAD_WEBHOOK_URL (server-only env var, e.g. a Supabase Edge Function, Zapier/Make hook or CRM
 * endpoint) and each valid submission is POSTed there as JSON, with LEAD_WEBHOOK_SECRET sent as a
 * bearer token if set. Without it nothing is sent anywhere, and the form says so: we never show a
 * success state for a submission that was not delivered. Personal data is never logged.
 */

export type LeadState =
  | {
      ok: boolean;
      /** "sent" = delivered; "invalid" = fix fields; "not_configured" = no backend yet; "failed" = backend error */
      status: "sent" | "invalid" | "not_configured" | "failed";
      message: string;
      errors?: Record<string, string>;
      /** Echoed back so a failed or unsent form keeps what the person typed. */
      values?: Record<string, string>;
    }
  | null;

const phone = z
  .string()
  .trim()
  .regex(/^\+?[\d\s-]{8,16}$/, "Enter a valid phone number (8–16 digits, + allowed)");
const email = z.string().trim().email("Enter a valid email address").max(160);
const req = (msg: string, max = 160) => z.string().trim().min(2, msg).max(max);
const opt = (max = 2000) => z.string().trim().max(max).optional().or(z.literal(""));

const today = () => new Date(new Date().toISOString().slice(0, 10));
const futureDate = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a date")
  .refine((d) => !Number.isNaN(Date.parse(d)) && new Date(d) >= today(), "Choose a date from today onwards");

const schemas = {
  parents: z
    .object({
      name: req("Enter the parent or guardian's name"),
      student: req("Enter the student's name and age"),
      zone: req("Choose a target regional zone"),
      tier: req("Choose a preferred tier"),
      email: email.optional().or(z.literal("")),
      phone: phone.optional().or(z.literal("")),
      message: opt(),
    })
    .refine((d) => d.email || d.phone, { message: "Leave an email or a phone number so we can reply", path: ["email"] }),
  schools: z.object({
    name: req("Enter the trustee or principal's name"),
    organisation: req("Enter the institution's name and location", 240),
    acreage: req("Choose the available acreage"),
    capacity: req("Choose the student capacity"),
    email,
    phone,
    message: opt(),
  }),
  audit: z.object({
    name: req("Enter the board member's name"),
    designation: req("Enter a designation"),
    organisation: req("Enter the target campus or circuit", 240),
    date: futureDate,
    slot: req("Choose a slot"),
    email,
    phone: phone.optional().or(z.literal("")),
  }),
  generic: z
    .object({
      name: req("Please enter your name", 120),
      email: email.optional().or(z.literal("")),
      phone: phone.optional().or(z.literal("")),
      organisation: opt(160),
      message: opt(),
    })
    .refine((d) => d.email || d.phone, { message: "Leave an email or a phone number so we can reply", path: ["email"] }),
};

const gateSchema = z.enum(["parents", "schools", "audit", "partners", "hub", "mou"]);

export async function submitLead(_prev: LeadState, formData: FormData): Promise<LeadState> {
  const raw = Object.fromEntries([...formData.entries()].map(([k, v]) => [k, typeof v === "string" ? v : ""]));
  const gate = gateSchema.safeParse(raw.gate);
  if (!gate.success) return { ok: false, status: "invalid", message: "Unknown form." };
  if (raw.website) return { ok: false, status: "invalid", message: "Submission rejected." }; // honeypot

  const schema = gate.data === "parents" ? schemas.parents : gate.data === "schools" || gate.data === "partners" ? schemas.schools : gate.data === "audit" ? schemas.audit : schemas.generic;
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const issue of parsed.error.issues) errors[String(issue.path[0])] ??= issue.message;
    return { ok: false, status: "invalid", message: "Please check the highlighted fields.", errors, values: raw };
  }

  const url = process.env.LEAD_WEBHOOK_URL;
  if (!url) {
    return {
      ok: false,
      status: "not_configured",
      message:
        "Your details are valid but were NOT sent: online submissions are not connected yet. Nothing has been stored. Please email us using the address beside this form.",
      values: raw,
    };
  }

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(process.env.LEAD_WEBHOOK_SECRET ? { authorization: `Bearer ${process.env.LEAD_WEBHOOK_SECRET}` } : {}),
      },
      body: JSON.stringify({ gate: gate.data, submittedAt: new Date().toISOString(), privacyNotice: "2026-10", fields: parsed.data }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) throw new Error(String(res.status));
  } catch {
    return { ok: false, status: "failed", message: "We could not send your details just now and nothing was saved. Please try again, or email us directly.", values: raw };
  }
  return { ok: true, status: "sent", message: "Received. The Office of the Executive Chairman will reply within two working days." };
}
