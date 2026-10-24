"use server";

import { z } from "zod";
import { isIdempotencyKey, sanitizeAttribution } from "@/lib/leads/attribution";
import { consumeRateLimit } from "@/lib/security/rate-limit";
import { verifyTurnstile } from "@/lib/security/turnstile";
import { restHeaders } from "@/lib/supabase/rest";
import { emailConfigured, sendEmail } from "@/lib/email/resend";
import { gateTitle, leadNotification, leadReceipt } from "@/lib/email/templates";
import { forwardToFormspree } from "@/lib/leads/formspree";
import { storeMouDraftForLead } from "@/lib/documents/store";

/**
 * Lead capture for every form on the site (contact gates, hub enquiries, MOU requests).
 *
 * Validation runs here on the server for every gate. Leads are stored in Supabase via the
 * public.submit_lead() RPC when SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY are set. Optionally:
 * set LEAD_WEBHOOK_URL (server-only env var, e.g. a Supabase Edge Function, Zapier/Make hook or CRM
 * endpoint) and each valid submission is POSTed there as JSON, with LEAD_WEBHOOK_SECRET sent as a
 * bearer token if set. Without it nothing is sent anywhere, and the form says so: we never show a
 * success state for a submission that was not delivered. Personal data is never logged.
 *
 * Delivery (23 Oct 2026): Supabase submit_lead_v2 (primary record), Formspree (FORMSPREE_ENDPOINT, inbox/backup), the
 * optional webhook, and a Resend notification e-mail (RESEND_API_KEY + LEAD_NOTIFY_EMAIL). Success means at least one
 * durable channel accepted the enquiry. MOU requests also store the drafted PDF privately (SUPABASE_SECRET_KEY).
 *
 * Since 23 Oct 2026 every submission also needs: explicit consent (checkbox), an idempotency key (a double click or
 * a retry never creates two leads), passes the per-client rate limit, and passes Turnstile when it is configured.
 * Attribution (route, hub, campaign, QR, referrer host, UTM tags) is stored without IP or user agent.
 * The database path uses public.submit_lead_v2 and falls back to the original public.submit_lead when v2 is absent.
 */

export type LeadState =
  | {
      ok: boolean;
      /** "sent" = delivered (or already received); "invalid" = fix fields; "not_configured" = no backend yet;
       *  "failed" = backend error; "rate_limited" = too many attempts, try later; "blocked" = anti-bot check failed */
      status: "sent" | "invalid" | "not_configured" | "failed" | "rate_limited" | "blocked";
      message: string;
      errors?: Record<string, string>;
      /** Echoed back so a failed or unsent form keeps what the person typed. */
      values?: Record<string, string>;
    }
  | null;

const phone = z
  .string()
  .trim()
  .regex(/^\+?[\d\s-]+$/, "Enter a valid phone number (+ allowed)")
  .refine((value) => { const digits = value.replace(/\D/g, "").length; return digits >= 8 && digits <= 16; }, "Enter a phone number with 8–16 digits");
const email = z.string().trim().email("Enter a valid email address").max(160);
const req = (msg: string, max = 160) => z.string().trim().min(2, msg).max(max);
const opt = (max = 2000) => z.string().trim().max(max).optional().or(z.literal(""));

const today = () => new Date(new Date().toISOString().slice(0, 10));
const futureDate = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a date")
  .refine((d) => !Number.isNaN(Date.parse(d)) && new Date(d).toISOString().slice(0, 10) === d && new Date(d) >= today(), "Choose a valid date from today onwards");

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
  mou: z.object({
    name: req("Enter the trustee or principal's name"),
    organisation: req("Enter the institution's name", 240),
    email,
    phone: phone.optional().or(z.literal("")),
    message: req("Describe the campus requirements", 2000),
  }),
};

/** Bump when app/privacy/page.tsx changes; stored with every lead. */
const PRIVACY_NOTICE_VERSION = "2026-10-draft";

const gateSchema = z.enum(["parents", "schools", "audit", "partners", "hub", "mou"]);

/** Idempotency keys already delivered by this instance (webhook-only mode has no database to dedupe for us). */
const deliveredKeys = new Map<string, number>();
const DELIVERED_TTL_MS = 30 * 60 * 1000;
function rememberDelivered(key: string) {
  const now = Date.now();
  for (const [k, at] of deliveredKeys) if (now - at > DELIVERED_TTL_MS) deliveredKeys.delete(k);
  deliveredKeys.set(key, now);
}

/** First forwarded address, used only as an input to a salted hash for rate limiting. Never stored or logged. */
async function clientKey(): Promise<string> {
  try {
    const { headers } = await import("next/headers");
    const h = await headers();
    return (h.get("x-forwarded-for")?.split(",")[0] || h.get("x-real-ip") || "").trim().slice(0, 64) || "unknown";
  } catch {
    return "unknown";
  }
}

const RECEIVED = "Received. The Office of the Executive Chairman will reply within two working days.";

export async function submitLead(_prev: LeadState, formData: FormData): Promise<LeadState> {
  const raw = Object.fromEntries([...formData.entries()].map(([k, v]) => [k, typeof v === "string" ? v : ""]));
  const gate = gateSchema.safeParse(raw.gate);
  if (!gate.success) return { ok: false, status: "invalid", message: "Unknown form." };
  if (raw.website) return { ok: false, status: "invalid", message: "Submission rejected." }; // honeypot
  // Echo only what the person typed back to the form (not the bookkeeping fields).
  const values = Object.fromEntries(Object.entries(raw).filter(([k]) => !k.startsWith("attr_") && !["idem", "cf-turnstile-response", "website"].includes(k)));

  const schema = gate.data === "parents" ? schemas.parents : gate.data === "schools" || gate.data === "partners" ? schemas.schools : gate.data === "audit" ? schemas.audit : gate.data === "mou" ? schemas.mou : schemas.generic;
  const parsed = schema.safeParse(raw);
  const errors: Record<string, string> = {};
  if (!parsed.success) for (const issue of parsed.error.issues) errors[String(issue.path[0])] ??= issue.message;
  if (raw.consent !== "yes") errors.consent = "Please confirm consent so we can use these details to reply";
  if (!parsed.success || Object.keys(errors).length) {
    return { ok: false, status: "invalid", message: "Please check the highlighted fields.", errors, values };
  }

  const ip = await clientKey();
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_PUBLISHABLE_KEY;
  const hook = process.env.LEAD_WEBHOOK_URL;
  const formspree = process.env.FORMSPREE_ENDPOINT;
  const mail = emailConfigured() && Boolean(process.env.LEAD_NOTIFY_EMAIL);
  if (!(supabaseUrl && supabaseKey) && !hook && !formspree && !mail) {
    return {
      ok: false,
      status: "not_configured",
      message:
        "Your details are valid but were NOT sent: online submissions are not connected yet. Nothing has been stored. Please email us using the address beside this form.",
      values,
    };
  }

  const limit = await consumeRateLimit("lead", ip);
  if (!limit.allowed) {
    return { ok: false, status: "rate_limited", message: "Too many attempts from this connection. Nothing new was sent. Please wait ten minutes or email us directly.", values };
  }
  const human = await verifyTurnstile(raw["cf-turnstile-response"], ip === "unknown" ? undefined : ip);
  if (!human.ok) {
    return { ok: false, status: "blocked", message: "We could not confirm this submission came from a person. Nothing was sent. Please try again or email us.", values };
  }

  // A missing or malformed key still works, it just cannot be de-duplicated.
  const idem = isIdempotencyKey(raw.idem) ? raw.idem : `srv_${crypto.randomUUID().replace(/-/g, "")}`;
  if (deliveredKeys.has(idem)) return { ok: true, status: "sent", message: "Already received. We have this enquiry on file; there is no need to send it again." };
  const attribution = sanitizeAttribution(raw);

  const fields = parsed.data as Record<string, string | undefined>;
  const failed: LeadState = {
    ok: false,
    status: "failed",
    message: "Delivery could not be confirmed. Please contact us directly before sending again so we can check whether your request arrived.",
    values,
  };

  // Delivery channels. A lead counts as received when at least one durable channel accepted it:
  // Supabase (primary record), Formspree (inbox/backup), the optional webhook, or, when nothing else is configured,
  // the internal notification e-mail. A database failure is logged and the other channels still run.
  const delivered: string[] = [];
  let duplicate = false;
  if (supabaseUrl && supabaseKey) {
    const leadType = gate.data === "parents" || gate.data === "hub" ? "cadet" : gate.data === "audit" ? "board_audit" : "school";
    const { name, email, phone, ...rest } = fields;
    const payload = Object.fromEntries(Object.entries({ ...rest, gate: gate.data } as Record<string, string | undefined>).filter(([, v]) => v !== undefined && v !== ""));
    const headers = restHeaders(supabaseKey);
    const common = { p_type: leadType, p_name: name ?? "", p_email: email || null, p_phone: phone || null, p_payload: payload, p_privacy_version: PRIVACY_NOTICE_VERSION };
    try {
      let res = await fetch(`${supabaseUrl}/rest/v1/rpc/submit_lead_v2`, {
        method: "POST",
        headers,
        body: JSON.stringify({ ...common, p_gate: gate.data, p_consent: true, p_attribution: attribution, p_idempotency_key: idem }),
        signal: AbortSignal.timeout(8000),
      });
      if (res.status === 404) {
        // Database without the 20261023 migration: original function (no dedupe, attribution kept in the payload).
        res = await fetch(`${supabaseUrl}/rest/v1/rpc/submit_lead`, {
          method: "POST",
          headers,
          body: JSON.stringify({ ...common, p_payload: { ...payload, consent: "yes", attribution } }),
          signal: AbortSignal.timeout(8000),
        });
      }
      if (res.ok) {
        const body = (await res.json().catch(() => null)) as { status?: string } | null;
        duplicate = body?.status === "duplicate";
        delivered.push("database");
      } else {
        console.error(JSON.stringify({ event: "lead.db_rejected", gate: gate.data, status: res.status }));
      }
    } catch {
      console.error(JSON.stringify({ event: "lead.db_unreachable", gate: gate.data }));
    }
  }

  if (!duplicate && formspree) {
    const flatAttr = Object.fromEntries(Object.entries(attribution).map(([k, v]) => [`source_${k}`, v]));
    const res = await forwardToFormspree({ _subject: `${gateTitle(gate.data)} · BSAH website`, form: gate.data, reference: idem, consent: "yes", privacy_notice: PRIVACY_NOTICE_VERSION, ...fields, ...flatAttr });
    if (res.ok) delivered.push("formspree");
  }

  // Optional notification hook (e-mail/CRM). The idempotency key travels with it so the receiver can drop repeats.
  if (hook && !duplicate) {
    try {
      const res = await fetch(hook, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "idempotency-key": idem,
          ...(process.env.LEAD_WEBHOOK_SECRET ? { authorization: `Bearer ${process.env.LEAD_WEBHOOK_SECRET}` } : {}),
        },
        body: JSON.stringify({ gate: gate.data, submittedAt: new Date().toISOString(), privacyNotice: PRIVACY_NOTICE_VERSION, consent: true, idempotencyKey: idem, attribution, fields }),
        signal: AbortSignal.timeout(8000),
      });
      if (res.ok) delivered.push("webhook");
      else console.error(JSON.stringify({ event: "lead.webhook_rejected", gate: gate.data, status: res.status }));
    } catch {
      console.error(JSON.stringify({ event: "lead.webhook_unreachable", gate: gate.data }));
    }
  }

  // Internal notification and (optionally) a receipt. Idempotency keys stop duplicates on retries.
  if (mail && !duplicate) {
    const note = leadNotification(gate.data, fields, { reference: idem, attribution: attribution as Record<string, string> });
    const sent = await sendEmail({ to: (process.env.LEAD_NOTIFY_EMAIL || "").split(","), subject: note.subject, html: note.html, text: note.text, replyTo: fields.email || undefined, idempotencyKey: `lead-notify/${idem}`, tag: `lead_${gate.data}` });
    if (sent.ok && !delivered.length) delivered.push("email");
    if (process.env.RESEND_CONFIRMATIONS === "1" && fields.email && delivered.length) {
      const receipt = leadReceipt(gate.data, fields.name);
      await sendEmail({ to: [fields.email], subject: receipt.subject, html: receipt.html, text: receipt.text, idempotencyKey: `lead-receipt/${idem}`, tag: "lead_receipt" });
    }
  }

  if (!duplicate && !delivered.length) return failed;
  // MOU requests: keep the exact draft the trustee prepared as a private PDF for the office (best effort).
  if (!duplicate && gate.data === "mou" && delivered.includes("database")) await storeMouDraftForLead(raw, idem);
  console.info(JSON.stringify({ event: duplicate ? "lead.duplicate" : "lead.received", gate: gate.data, channels: delivered }));
  rememberDelivered(idem);
  if (duplicate) return { ok: true, status: "sent", message: "Already received. We have this enquiry on file; there is no need to send it again." };
  return { ok: true, status: "sent", message: RECEIVED };
}
