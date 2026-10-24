import { restHeaders } from "@/lib/supabase/rest";

/**
 * Health checks for uptime monitors (GET /api/health).
 *
 * Shallow (default): proves the site's server function runs. Deep (?deep=1): also proves the database answers, with
 * the read-only `public.verify_passport` called for a code that cannot exist (nothing is read back and nothing is
 * written). It reports how long that call took from this server's region, which is how the function-region choice
 * is measured (the database is in Seoul). A deep result is reused for 15 s per server instance, so a monitor, or
 * anyone else, cannot turn this route into database load. Nothing returned here is secret: no versions, no error
 * text, no keys.
 *
 * A project on Supabase's Free plan is paused after a week without activity; a monitor calling `?deep=1` is also
 * the keep-alive that prevents it.
 */

export type DbState = "up" | "down" | "not_configured";
export type Health = { ok: boolean; service: "bsah-web"; time: string; region: string | null; db?: DbState; dbMs?: number };

export const DEEP_TTL_MS = 15_000;
/** 8–64 characters of letters, digits and dashes: accepted by the function's input check, never a real passport. */
const SENTINEL_CODE = "HEALTHCHECK-NO-SUCH-CODE";

type Env = Record<string, string | undefined>;
let cached: { at: number; db: DbState; dbMs: number } | null = null;

/** Test helper: forget the cached deep result. */
export function resetHealthCache() {
  cached = null;
}

async function probeDatabase(env: Env, fetchImpl: typeof fetch): Promise<{ db: DbState; dbMs: number }> {
  const url = env.SUPABASE_URL;
  const key = env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return { db: "not_configured", dbMs: 0 };
  const started = performance.now();
  try {
    const res = await fetchImpl(`${url.replace(/\/+$/, "")}/rest/v1/rpc/verify_passport`, {
      method: "POST",
      headers: restHeaders(key),
      body: JSON.stringify({ p_code: SENTINEL_CODE }),
      signal: AbortSignal.timeout(4000),
      cache: "no-store",
    });
    return { db: res.ok ? "up" : "down", dbMs: Math.round(performance.now() - started) };
  } catch {
    return { db: "down", dbMs: Math.round(performance.now() - started) };
  }
}

export async function checkHealth(opts: { deep?: boolean; now?: number; env?: Env; fetchImpl?: typeof fetch } = {}): Promise<Health> {
  const { deep = false, now = Date.now(), env = process.env, fetchImpl = fetch } = opts;
  const base = { service: "bsah-web" as const, time: new Date(now).toISOString(), region: env.VERCEL_REGION ?? null };
  if (!deep) return { ok: true, ...base };
  if (!cached || now - cached.at > DEEP_TTL_MS) cached = { at: now, ...(await probeDatabase(env, fetchImpl)) };
  return { ok: cached.db !== "down", ...base, db: cached.db, dbMs: cached.dbMs };
}
