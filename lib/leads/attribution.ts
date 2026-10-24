/**
 * Privacy-conscious lead attribution. Only these keys are kept; values are short strings.
 * No IP address, user agent, device fingerprint or full referrer URL is ever stored: the referrer is reduced to its host.
 * The database applies the same allow-list (public.submit_lead_v2).
 */
export const ATTRIBUTION_KEYS = ["path", "hub", "campaign", "qr", "referrer", "utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"] as const;
export type AttributionKey = (typeof ATTRIBUTION_KEYS)[number];
export type Attribution = Partial<Record<AttributionKey, string>>;

const SAFE = /^[\p{L}\p{N} ._~:/@+-]*$/u;

export function sanitizeAttribution(raw: Record<string, unknown>): Attribution {
  const out: Attribution = {};
  for (const key of ATTRIBUTION_KEYS) {
    // Only the dedicated hidden inputs count; ordinary form fields (e.g. a "hub" model select) are never attribution.
    const value = raw[`attr_${key}`];
    if (typeof value !== "string") continue;
    let v = value.trim().slice(0, 200);
    if (!v) continue;
    if (key === "path") {
      if (!v.startsWith("/") || v.startsWith("//")) continue;
      v = v.split(/[?#]/)[0];
    }
    if (key === "referrer") {
      try {
        v = new URL(v).host;
      } catch {
        if (!/^[a-z0-9.-]+$/i.test(v)) continue;
      }
    }
    if (!SAFE.test(v)) continue;
    out[key] = v;
  }
  return out;
}

/** Client idempotency keys: 16–64 URL-safe characters. */
export function isIdempotencyKey(value: unknown): value is string {
  return typeof value === "string" && /^[A-Za-z0-9_-]{16,64}$/.test(value);
}
