import { verifyWebhookSignature } from "@/lib/payments/core";
import { notify } from "@/lib/registration/notify";
import { readWebhook } from "@/lib/registration/razorpay";
import type { ApplicationKind } from "@/lib/registration/model";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

/**
 * Razorpay webhook (set it in the Razorpay dashboard to https://<site>/api/payments/razorpay with the events payment.captured,
 * order.paid, payment.failed and refund.processed). The signature is checked over the RAW body with RAZORPAY_WEBHOOK_SECRET
 * before anything is read. Each event is applied once by public.ingest_payment_event (keyed by Razorpay's event id), which
 * also checks the amount against the order the server created. This is the only path that can mark an enrolment fee paid.
 */
export async function POST(request: Request) {
  const raw = await request.text();
  if (raw.length > 100_000) return new Response("too large", { status: 413 });
  if (!verifyWebhookSignature(raw, request.headers.get("x-razorpay-signature"), process.env.RAZORPAY_WEBHOOK_SECRET)) {
    return new Response("invalid signature", { status: 401 });
  }
  const eventId = request.headers.get("x-razorpay-event-id") ?? "";
  if (!/^[A-Za-z0-9_-]{4,120}$/.test(eventId)) return new Response("missing event id", { status: 400 });
  let body: unknown;
  try { body = JSON.parse(raw); } catch { return new Response("bad json", { status: 400 }); }
  const facts = readWebhook(body);
  if (!facts) return Response.json({ ok: true, outcome: "ignored" });
  const admin = createSupabaseAdminClient();
  if (!admin) return new Response("not configured", { status: 503 });
  const { data: outcome, error } = await admin.rpc("ingest_payment_event", {
    p_event_id: eventId, p_order_id: facts.orderId, p_event_type: facts.type, p_payment_id: facts.paymentId, p_amount_paise: facts.amountPaise,
  });
  if (error) {
    console.error(JSON.stringify({ event: "payment.ingest_failed", code: error.code }));
    return new Response("retry", { status: 500 }); // Razorpay retries; the event id makes the retry safe
  }
  console.info(JSON.stringify({ event: "payment.ingested", type: facts.type, outcome }));
  if (outcome === "paid") {
    const { data: rec } = await admin.from("payment_records").select("application_id, amount_paise").eq("gateway_order_id", facts.orderId).maybeSingle();
    if (rec?.application_id) {
      const { data: app } = await admin.from("applications").select("id, reference, kind, applicant_id, applicant_email, applicant_name").eq("id", rec.application_id).maybeSingle();
      if (app) {
        await notify("payment_confirmed", { userId: app.applicant_id, email: app.applicant_email ?? "", name: app.applicant_name ?? "" },
          { id: app.id, reference: app.reference, kind: app.kind as ApplicationKind }, { amountPaise: rec.amount_paise ?? undefined });
      }
    }
  }
  return Response.json({ ok: true, outcome });
}
