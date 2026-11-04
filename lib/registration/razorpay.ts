/**
 * Razorpay over its REST API (no SDK). Server only.
 *   RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET  create orders (Basic auth); the key id is also given to Checkout in the browser.
 *   RAZORPAY_WEBHOOK_SECRET              verifies webhook signatures (lib/payments/core.ts verifyWebhookSignature).
 * Nothing here can mark a payment paid: only the verified webhook does (app/api/payments/razorpay/route.ts).
 */
export function razorpayConfigured(): boolean {
  return Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET && process.env.RAZORPAY_WEBHOOK_SECRET);
}

export type RazorpayOrder = { id: string; amount: number; currency: string; receipt?: string };

export async function createRazorpayOrder(
  input: { amountPaise: number; receipt: string; notes: Record<string, string> },
  fetchImpl: typeof fetch = fetch,
): Promise<{ ok: true; order: RazorpayOrder } | { ok: false; reason: "not_configured" | "rejected" | "network" }> {
  const id = process.env.RAZORPAY_KEY_ID;
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!id || !secret) return { ok: false, reason: "not_configured" };
  if (!Number.isInteger(input.amountPaise) || input.amountPaise < 100) return { ok: false, reason: "rejected" };
  try {
    const res = await fetchImpl(process.env.RAZORPAY_API_URL || "https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Basic ${Buffer.from(`${id}:${secret}`).toString("base64")}` },
      body: JSON.stringify({ amount: input.amountPaise, currency: "INR", receipt: input.receipt.slice(0, 40), notes: input.notes }),
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) {
      console.error(JSON.stringify({ event: "razorpay.order_rejected", status: res.status }));
      return { ok: false, reason: "rejected" };
    }
    const order = (await res.json()) as RazorpayOrder;
    if (typeof order.id !== "string" || order.amount !== input.amountPaise) return { ok: false, reason: "rejected" };
    return { ok: true, order };
  } catch {
    console.error(JSON.stringify({ event: "razorpay.network_error" }));
    return { ok: false, reason: "network" };
  }
}

export type WebhookFacts = { type: string; orderId: string; paymentId: string | null; amountPaise: number };

/**
 * The facts the ledger needs from a Razorpay webhook body (already signature-verified). Returns null for events it does
 * not handle or bodies without an order id. Refunds carry the refunded amount; payments the captured amount.
 */
export function readWebhook(body: unknown): WebhookFacts | null {
  if (typeof body !== "object" || body === null) return null;
  const b = body as { event?: unknown; payload?: Record<string, { entity?: Record<string, unknown> }> };
  const type = typeof b.event === "string" ? b.event : "";
  if (!["payment.captured", "order.paid", "payment.failed", "refund.processed"].includes(type)) return null;
  const payment = b.payload?.payment?.entity ?? {};
  const refund = b.payload?.refund?.entity ?? {};
  const order = b.payload?.order?.entity ?? {};
  const orderId = String(payment.order_id ?? order.id ?? "");
  if (!/^order_[A-Za-z0-9]{6,40}$/.test(orderId)) return null;
  const amount = Number(type === "refund.processed" ? refund.amount : (payment.amount ?? order.amount_paid ?? order.amount));
  if (!Number.isInteger(amount) || amount < 0) return null;
  const paymentId = typeof payment.id === "string" ? payment.id : typeof refund.payment_id === "string" ? refund.payment_id : null;
  return { type, orderId, paymentId, amountPaise: amount };
}
