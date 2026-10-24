import type { SupabaseClient } from "@supabase/supabase-js";
import { signedUrlsByPath } from "@/lib/admin/present";

/**
 * Server-side helpers for the staff console. They take the caller's Supabase client (already authorised by
 * requireStaff()), so Row Level Security still decides what comes back.
 */

/** Private-document links live for five minutes; the page mints fresh ones on every load. */
export const SIGNED_URL_SECONDS = 300;

/**
 * Structured error log with no personal data and no raw database message (messages and details can quote values):
 * only the event name and the error's code or HTTP status.
 */
export function logAdminError(event: string, error: unknown): void {
  const e = (typeof error === "object" && error !== null ? error : {}) as { code?: unknown; status?: unknown; statusCode?: unknown };
  const code = typeof e.code === "string" ? e.code.slice(0, 32) : undefined;
  const status = typeof e.status === "number" ? e.status : typeof e.statusCode === "string" ? e.statusCode.slice(0, 8) : undefined;
  console.error(JSON.stringify({ event, ...(code ? { code } : {}), ...(status !== undefined ? { status } : {}) }));
}

/** Five-minute signed links for objects in the private-documents bucket, keyed by storage path. */
export async function signDocumentPaths(supabase: SupabaseClient, paths: readonly string[]): Promise<{ urls: Map<string, string>; failed: boolean }> {
  const unique = [...new Set(paths)];
  if (!unique.length) return { urls: new Map(), failed: false };
  const { data, error } = await supabase.storage.from("private-documents").createSignedUrls(unique, SIGNED_URL_SECONDS);
  if (error) {
    logAdminError("admin.documents_sign_failed", error);
    return { urls: new Map(), failed: true };
  }
  const urls = signedUrlsByPath(data);
  return { urls, failed: urls.size < unique.length };
}

/**
 * Display names for staff ids (assignees, audit actors). Live project: public.users (SUPER_ADMIN may read every row);
 * website-only schema: public.profiles. Best effort: on failure the console shows a short id instead.
 */
export async function staffNames(supabase: SupabaseClient, ids: readonly (string | null | undefined)[]): Promise<Map<string, string>> {
  const unique = [...new Set(ids.filter((id): id is string => typeof id === "string" && id.length > 0))];
  const names = new Map<string, string>();
  if (!unique.length) return names;
  const live = await supabase.from("users").select("id, full_name").in("id", unique);
  if (!live.error) {
    for (const row of (live.data ?? []) as { id: string; full_name: string | null }[]) if (row.full_name) names.set(row.id, row.full_name);
    return names;
  }
  const site = await supabase.from("profiles").select("id, display_name").in("id", unique);
  if (!site.error) {
    for (const row of (site.data ?? []) as { id: string; display_name: string | null }[]) if (row.display_name) names.set(row.id, row.display_name);
  } else {
    logAdminError("admin.staff_names_failed", site.error);
  }
  return names;
}
