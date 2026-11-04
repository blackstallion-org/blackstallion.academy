/**
 * Minimal Supabase REST helpers shared by server code (no SDK needed for RPC calls).
 *
 * Key formats: the new `sb_publishable_…` / `sb_secret_…` keys are NOT JWTs and must be sent only in the `apikey`
 * header; legacy JWT keys (`eyJ…`) are also sent as `Authorization: Bearer`. A user's session JWT, when present,
 * always goes in Authorization so Row Level Security applies to that user.
 */
export type SupabaseKeys = { url: string; publishable: string; secret?: string };

export function supabaseConfig(): SupabaseKeys | null {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishable = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !publishable) return null;
  return { url: url.replace(/\/+$/, ""), publishable, secret: process.env.SUPABASE_SECRET_KEY || undefined };
}

/**
 * Options for the Supabase session cookies (security audit F-07, 4 Nov 2026). The library default is readable by page
 * scripts and has no Secure flag. This site has no browser Supabase client (sessions are read only on the server: the proxy,
 * server components and actions), so the cookies are HttpOnly; Secure outside development; SameSite=Lax so e-mail links
 * still arrive signed in. The library keeps its own lifetime.
 */
export const AUTH_COOKIE_OPTIONS = { path: "/", sameSite: "lax", httpOnly: true, secure: process.env.NODE_ENV === "production" } as const;

export function restHeaders(apiKey: string, userJwt?: string): Record<string, string> {
  const headers: Record<string, string> = { "content-type": "application/json", apikey: apiKey };
  if (userJwt) headers.authorization = `Bearer ${userJwt}`;
  else if (apiKey.startsWith("eyJ")) headers.authorization = `Bearer ${apiKey}`;
  return headers;
}
