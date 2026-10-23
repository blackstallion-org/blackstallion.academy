import { createHmac, timingSafeEqual } from "node:crypto";
import { GST_RATE, price } from "@/lib/content/pricing";

/**
 * Payment core for the future Razorpay integration. STATUS: CODED + UNIT-TESTED, NOT CONNECTED.
 * Nothing in the site calls this yet and no gateway, route or button exists: merchant account, keys, GST registration
 * details and owner approval are BLOCKED_EXTERNAL (docs/IMPLEMENTATION_PROGRESS.md, B03). These pieces are the parts
 * that must be right regardless of the final wiring, so they are written and tested now:
 *   - authoritative server-side pricing in integer paise (never trust a client amount),
 *   - webhook signature verification (HMAC-SHA256 over the raw body) with constant-time comparison,
 *   - checkout signature verification (order_id|payment_id),
 *   - a payment state machine where only a verified webhook can move a payment to "paid".
 * The fuller ledger design (fee schedule, invoices, refunds, event ingestion) lives in bsah-platform/supabase.
 */

export type FeeCode = "core_monthly" | "elite_monthly" | "onboarding_kit";

const BASE_RUPEES: Record<FeeCode, number> = {
  core_monthly: price.core,
  elite_monthly: price.elite,
  onboarding_kit: price.kit,
};

/** Integer paise breakdown. GST is rounded half-up on the paise total, once. */
export function quote(code: FeeCode, quantity = 1): { base: number; gst: number; total: number; currency: "INR" } {
  if (!(code in BASE_RUPEES)) throw new Error("unknown fee");
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 12) throw new Error("invalid quantity");
  const base = BASE_RUPEES[code] * 100 * quantity;
  const gst = Math.round(base * GST_RATE);
  return { base, gst, total: base + gst, currency: "INR" };
}

function safeEqualHex(a: string, b: string) {
  const left = Buffer.from(a, "utf8");
  const right = Buffer.from(b, "utf8");
  return left.length === right.length && timingSafeEqual(left, right);
}

/** Razorpay webhook: X-Razorpay-Signature = hex HMAC-SHA256(rawBody, webhookSecret). Use the RAW body, not re-serialised JSON. */
export function verifyWebhookSignature(rawBody: string, signature: string | null | undefined, secret: string | undefined): boolean {
  if (!secret || !signature || !/^[a-f0-9]{64}$/.test(signature)) return false;
  return safeEqualHex(createHmac("sha256", secret).update(rawBody, "utf8").digest("hex"), signature);
}

/** Checkout callback: razorpay_signature = hex HMAC-SHA256(`${orderId}|${paymentId}`, keySecret). Proves origin only; not payment. */
export function verifyCheckoutSignature(orderId: string, paymentId: string, signature: string, keySecret: string | undefined): boolean {
  if (!keySecret || !/^[a-f0-9]{64}$/.test(signature)) return false;
  return safeEqualHex(createHmac("sha256", keySecret).update(`${orderId}|${paymentId}`, "utf8").digest("hex"), signature);
}

export type PaymentStatus = "created" | "authorized" | "paid" | "failed" | "cancelled" | "refund_pending" | "refunded" | "partially_refunded";
export type PaymentEvent =
  | { type: "authorized"; source: "webhook" | "client" }
  | { type: "captured"; source: "webhook" | "client"; amount: number }
  | { type: "failed"; source: "webhook" | "client" }
  | { type: "cancelled"; source: "client" | "webhook" }
  | { type: "refund_requested" }
  | { type: "refunded"; source: "webhook"; amount: number };

export type PaymentRecord = { status: PaymentStatus; amount: number; refunded: number; processedEventIds: string[] };

/**
 * Applies one event. Rules:
 *  - "paid" only from a verified webhook whose captured amount equals the quoted amount;
 *  - client callbacks can never mark a payment paid or refunded (they may only report cancel/fail on an unpaid order);
 *  - terminal states do not regress (a late "failed" after "paid" is ignored);
 *  - each gateway event id is applied once (replay / duplicate webhook defence).
 */
export function applyPaymentEvent(record: PaymentRecord, event: PaymentEvent, eventId: string): { record: PaymentRecord; changed: boolean; reason?: string } {
  if (record.processedEventIds.includes(eventId)) return { record, changed: false, reason: "duplicate event" };
  const seen = { ...record, processedEventIds: [...record.processedEventIds, eventId] };
  const fromWebhook = "source" in event && event.source === "webhook";
  const s = record.status;
  const done = (status: PaymentStatus, extra: Partial<PaymentRecord> = {}) => ({ record: { ...seen, status, ...extra }, changed: true });
  const ignore = (reason: string) => ({ record: seen, changed: false, reason });

  switch (event.type) {
    case "authorized":
      if (!fromWebhook) return ignore("client cannot authorise");
      return s === "created" ? done("authorized") : ignore(`no transition from ${s}`);
    case "captured":
      if (!fromWebhook) return ignore("client cannot mark paid");
      if (event.amount !== record.amount) return ignore("amount mismatch");
      return s === "created" || s === "authorized" || s === "failed" ? done("paid") : ignore(`no transition from ${s}`);
    case "failed":
      return s === "created" || s === "authorized" ? done("failed") : ignore(`no transition from ${s}`);
    case "cancelled":
      return s === "created" ? done("cancelled") : ignore(`no transition from ${s}`);
    case "refund_requested":
      return s === "paid" || s === "partially_refunded" ? done("refund_pending") : ignore(`no transition from ${s}`);
    case "refunded": {
      if (s !== "refund_pending" && s !== "paid" && s !== "partially_refunded") return ignore(`no transition from ${s}`);
      const refunded = record.refunded + event.amount;
      if (event.amount <= 0 || refunded > record.amount) return ignore("refund exceeds payment");
      return done(refunded === record.amount ? "refunded" : "partially_refunded", { refunded });
    }
  }
}
