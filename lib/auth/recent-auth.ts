/**
 * "Did this person prove who they are just now?" for sensitive changes such as a new password (security audit M2, 17 Nov 2026).
 * A session that is merely still signed in (a laptop left open, a stolen cookie) is not enough to replace the password; the
 * person must have signed in, opened a reset link, or passed a second-factor check within the last few minutes.
 *
 * Supabase access tokens carry `amr`: one entry per method used in this session, each with the time it was used (seconds). The
 * newest identity-proving entry is the last real proof of identity. Entries without times (the plain RFC 8176 string form)
 * prove nothing about recency and count as "not recent".
 */
export const RECENT_AUTH_SECONDS = 10 * 60;

type AmrEntry = { method?: unknown; timestamp?: unknown } | string;

/**
 * Methods that prove who the person is. Anything else does not count: a token refresh (some Auth versions record one), an
 * anonymous sign-in, or a method this list does not know yet (fail closed: the person opens a reset link instead).
 */
const PROOF_METHODS = new Set([
  "password", "otp", "recovery", "magiclink", "invite", "email/signup", "email_change", "oauth", "sso/saml", "web3",
  "totp", "mfa/totp", "mfa/phone", "mfa/webauthn", "mfa/recovery_code",
]);

export function lastAuthenticatedAt(amr: unknown): number | null {
  if (!Array.isArray(amr)) return null;
  let newest: number | null = null;
  for (const entry of amr as AmrEntry[]) {
    if (typeof entry !== "object" || entry === null) continue;
    if (typeof entry.method !== "string" || !PROOF_METHODS.has(entry.method)) continue;
    const t = entry.timestamp;
    if (typeof t === "number" && Number.isFinite(t) && (newest === null || t > newest)) newest = t;
  }
  return newest;
}

export function authenticatedRecently(amr: unknown, nowSeconds = Math.floor(Date.now() / 1000), windowSeconds = RECENT_AUTH_SECONDS): boolean {
  const at = lastAuthenticatedAt(amr);
  if (at === null) return false;
  // a little allowance for clock skew between the Auth server and this server; a time far in the future is not trusted
  return at <= nowSeconds + 60 && nowSeconds - at <= windowSeconds;
}

export type ClaimsClient = {
  auth: { getClaims: () => PromiseLike<{ data: { claims: { amr?: unknown } } | null; error: unknown }> };
};

/** Reads the verified token claims of the current session; any error counts as "not recent". */
export async function sessionAuthenticatedRecently(supabase: ClaimsClient): Promise<boolean> {
  try {
    const { data, error } = await supabase.auth.getClaims();
    if (error || !data) return false;
    return authenticatedRecently(data.claims.amr);
  } catch {
    return false;
  }
}
