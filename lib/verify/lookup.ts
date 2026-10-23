import { credentialByCode, type Credential } from "@/lib/content/records";
import { consumeRateLimit } from "@/lib/security/rate-limit";
import { restHeaders } from "@/lib/supabase/rest";

/**
 * Passport credential lookup used by /verify.
 *
 * Order: SAMPLE records (demo codes printed on the site, always labelled as samples) → the live registry
 * (public.verify_passport in Supabase: minimal disclosure, statuses valid / revoked / expired / unknown) → an honest
 * "registry not connected" answer when no database is configured. A lookup never invents a real cadet.
 */
export type LookupResult =
  | { kind: "sample"; record: Credential }
  | { kind: "registry"; status: "valid"; rank: string; credentialType: string; issuedAt: string }
  | { kind: "registry"; status: "revoked" | "expired" | "unknown" }
  | { kind: "unavailable"; reason: "not_configured" | "error" }
  | { kind: "invalid" }
  | { kind: "rate_limited" };

const CODE = /^[A-Za-z0-9-]{8,64}$/;

export async function lookupCredentialCore(rawCode: unknown, clientKey: string, fetchImpl: typeof fetch = fetch): Promise<LookupResult> {
  const code = typeof rawCode === "string" ? rawCode.trim().toUpperCase() : "";
  if (!CODE.test(code)) return { kind: "invalid" };
  if (!(await consumeRateLimit("verify", clientKey)).allowed) return { kind: "rate_limited" };

  const sample = credentialByCode(code);
  if (sample) return { kind: "sample", record: sample };

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return { kind: "unavailable", reason: "not_configured" };
  try {
    const res = await fetchImpl(`${url}/rest/v1/rpc/verify_passport`, {
      method: "POST",
      headers: restHeaders(key),
      body: JSON.stringify({ p_code: code }),
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) return { kind: "unavailable", reason: "error" };
    const body = (await res.json()) as { status?: string; rank?: string; credential_type?: string; issued_at?: string };
    if (body.status === "valid" && body.rank && body.issued_at) {
      return { kind: "registry", status: "valid", rank: body.rank, credentialType: body.credential_type ?? "passport", issuedAt: body.issued_at };
    }
    if (body.status === "revoked" || body.status === "expired") return { kind: "registry", status: body.status };
    // The operations team switched public verification off (site_settings.verify_public = false).
    if (body.status === "unavailable") return { kind: "unavailable", reason: "not_configured" };
    return { kind: "registry", status: "unknown" };
  } catch {
    return { kind: "unavailable", reason: "error" };
  }
}
