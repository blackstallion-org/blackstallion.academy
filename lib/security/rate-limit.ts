import { createHash, randomBytes } from "node:crypto";
import { restHeaders } from "@/lib/supabase/rest";

/**
 * Server-side rate limiting for public endpoints (lead forms, trustee unlock, credential lookups).
 *
 * Two layers:
 *  1. An in-process fixed-window counter. Always on. On serverless hosting each instance keeps its own counts, so
 *     this alone is a speed bump, not a guarantee.
 *  2. The database limiter `public.consume_rate_limit` (supabase/migrations/20261023000700_website_intake.sql),
 *     shared by every instance, used whenever Supabase is configured. If that call fails the in-process limit
 *     still applies; the request is never silently waved through on layer 1's behalf.
 *
 * The client key (usually the forwarded IP) is hashed with a server-only salt before it leaves this module, so the
 * raw address is never stored and a visitor cannot target someone else's bucket.
 */

export type RateKind = "lead" | "trustee" | "verify" | "login" | "document";
export type RateRule = { limit: number; windowSeconds: number };

export const RATE_RULES: Record<RateKind, RateRule> = {
  lead: { limit: 5, windowSeconds: 600 },
  trustee: { limit: 8, windowSeconds: 900 },
  verify: { limit: 30, windowSeconds: 600 },
  login: { limit: 8, windowSeconds: 900 },
  document: { limit: 12, windowSeconds: 600 },
};

const processSalt = randomBytes(32).toString("hex");
const memory = new Map<string, { windowStart: number; hits: number }>();
const MAX_BUCKETS = 10_000;

function salt() {
  return process.env.RATE_LIMIT_SALT || process.env.TRUSTEE_SESSION_SECRET || processSalt;
}

/** Opaque bucket id: "<kind>:<40 hex>". */
export function bucketFor(kind: RateKind, clientKey: string): string {
  const digest = createHash("sha256").update(`${salt()}:${kind}:${clientKey || "unknown"}`).digest("hex");
  return `${kind}:${digest.slice(0, 40)}`;
}

/** In-process fixed window. Returns true while under the limit. */
export function consumeMemory(bucket: string, rule: RateRule, now = Date.now()): boolean {
  const windowMs = rule.windowSeconds * 1000;
  const windowStart = Math.floor(now / windowMs) * windowMs;
  const entry = memory.get(bucket);
  if (!entry || entry.windowStart !== windowStart) {
    if (memory.size >= MAX_BUCKETS) {
      for (const [key, value] of memory) if (value.windowStart < windowStart) memory.delete(key);
      if (memory.size >= MAX_BUCKETS) memory.clear();
    }
    memory.set(bucket, { windowStart, hits: 1 });
    return rule.limit >= 1;
  }
  entry.hits += 1;
  return entry.hits <= rule.limit;
}

/** Test helper: forget all in-process counts. */
export function resetMemoryLimiter() {
  memory.clear();
}

type DbConfig = { url?: string; key?: string; fetchImpl?: typeof fetch };

/**
 * Consume one hit for `kind` and `clientKey`. Resolves to { allowed, layer } where layer says which limiter decided.
 */
export async function consumeRateLimit(kind: RateKind, clientKey: string, db: DbConfig = {}): Promise<{ allowed: boolean; layer: "memory" | "database" }> {
  const rule = RATE_RULES[kind];
  const bucket = bucketFor(kind, clientKey);
  if (!consumeMemory(bucket, rule)) return { allowed: false, layer: "memory" };
  const url = db.url ?? process.env.SUPABASE_URL;
  const key = db.key ?? process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return { allowed: true, layer: "memory" };
  try {
    const res = await (db.fetchImpl ?? fetch)(`${url}/rest/v1/rpc/consume_rate_limit`, {
      method: "POST",
      headers: restHeaders(key),
      body: JSON.stringify({ p_bucket: bucket, p_limit: rule.limit, p_window_seconds: rule.windowSeconds }),
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) return { allowed: true, layer: "memory" };
    const body: unknown = await res.json().catch(() => null);
    return body === false ? { allowed: false, layer: "database" } : { allowed: true, layer: "database" };
  } catch {
    return { allowed: true, layer: "memory" };
  }
}
