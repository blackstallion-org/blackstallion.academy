/**
 * Resend e-mail delivery (server only). Uses the REST API directly (no SDK dependency).
 *
 * - RESEND_API_KEY        server-only secret.
 * - RESEND_FROM           sender, e.g. "Black Stallion Academy <office@blackstallion.academy>". Until the domain is
 *                         verified in Resend, the default "onboarding@resend.dev" sender can only deliver to the
 *                         Resend account owner's address, so enquirer confirmations stay off.
 * - LEAD_NOTIFY_EMAIL     internal inbox(es) for new-enquiry notifications (comma separated).
 * - RESEND_CONFIRMATIONS  "1" to also send the enquirer a receipt (only after the sending domain is verified).
 *
 * Every send carries an Idempotency-Key so a retried request never sends a duplicate. Logs never include addresses
 * or message content.
 */
export type EmailMessage = { to: string[]; subject: string; html: string; text: string; replyTo?: string; idempotencyKey: string; tag: string };
export type SendResult = { ok: true; id: string } | { ok: false; reason: "not_configured" | "rejected" | "network"; status?: number };

const DEFAULT_FROM = "Black Stallion Academy <onboarding@resend.dev>";

export function emailConfigured() {
  return Boolean(process.env.RESEND_API_KEY);
}

export async function sendEmail(message: EmailMessage, fetchImpl: typeof fetch = fetch): Promise<SendResult> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return { ok: false, reason: "not_configured" };
  const to = message.to.map((a) => a.trim()).filter(Boolean);
  if (!to.length) return { ok: false, reason: "not_configured" };
  try {
    const res = await fetchImpl(process.env.RESEND_API_URL || "https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${key}`,
        "idempotency-key": message.idempotencyKey.slice(0, 256),
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM || DEFAULT_FROM,
        to,
        subject: message.subject,
        html: message.html,
        text: message.text,
        ...(message.replyTo ? { reply_to: message.replyTo } : {}),
        tags: [{ name: "category", value: message.tag.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 256) }],
      }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) {
      console.error(JSON.stringify({ event: "email.rejected", tag: message.tag, status: res.status }));
      return { ok: false, reason: "rejected", status: res.status };
    }
    const body = (await res.json().catch(() => ({}))) as { id?: string };
    console.info(JSON.stringify({ event: "email.sent", tag: message.tag }));
    return { ok: true, id: body.id ?? "" };
  } catch {
    console.error(JSON.stringify({ event: "email.network_error", tag: message.tag }));
    return { ok: false, reason: "network" };
  }
}
