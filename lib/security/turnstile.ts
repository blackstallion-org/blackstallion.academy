/**
 * Cloudflare Turnstile server-side check. Turned on only when TURNSTILE_SECRET_KEY is set (and the matching
 * NEXT_PUBLIC_TURNSTILE_SITE_KEY renders the widget). Until the BSAH account is provisioned this is skipped and the
 * honeypot + rate limits remain the anti-bot controls. Status: BLOCKED_EXTERNAL (keys), code ready.
 */
export type TurnstileResult = { ok: boolean; skipped: boolean };

export function turnstileEnabled() {
  return Boolean(process.env.TURNSTILE_SECRET_KEY);
}

export async function verifyTurnstile(token: string | undefined, remoteIp?: string, fetchImpl: typeof fetch = fetch): Promise<TurnstileResult> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return { ok: true, skipped: true };
  if (!token || token.length > 2048) return { ok: false, skipped: false };
  try {
    const body = new URLSearchParams({ secret, response: token });
    if (remoteIp) body.set("remoteip", remoteIp);
    const res = await fetchImpl("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body,
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return { ok: false, skipped: false };
    const data = (await res.json()) as { success?: boolean };
    return { ok: data.success === true, skipped: false };
  } catch {
    return { ok: false, skipped: false };
  }
}
