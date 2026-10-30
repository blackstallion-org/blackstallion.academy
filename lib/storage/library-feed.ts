import { cacheLife, cacheTag } from "next/cache";
import { LIBRARY_BUCKET, toLibraryItem, type LibraryItem } from "@/lib/storage/library";
import { restHeaders, supabaseConfig } from "@/lib/supabase/rest";

/** Cache tag of the public media library; the admin upload and delete actions expire it. */
export const LIBRARY_TAG = "bsah-media";

/**
 * The media library for the public /gallery page: every file recorded in media_assets for the bsah-media bucket, newest first.
 * Read with the publishable key (the rows are public by policy). Cached, and expired by the admin actions the moment a file is
 * added or removed. Anything that goes wrong (Supabase not configured, the library migration not applied yet, a network error)
 * gives an empty list rather than an error, so the page always renders.
 */
export async function getLibraryItems(): Promise<LibraryItem[]> {
  "use cache";
  cacheTag(LIBRARY_TAG);
  cacheLife("minutes");
  const config = supabaseConfig();
  if (!config) return [];
  try {
    const url = `${config.url}/rest/v1/media_assets?bucket=eq.${LIBRARY_BUCKET}&select=id,storage_path,alt_text,mime_type,bytes,created_at&order=created_at.desc&limit=120`;
    const res = await fetch(url, { headers: restHeaders(config.publishable), signal: AbortSignal.timeout(6000) });
    if (!res.ok) return [];
    const rows: unknown = await res.json();
    if (!Array.isArray(rows)) return [];
    return rows.map((row) => toLibraryItem(row as Record<string, unknown>, config.url)).filter((item): item is LibraryItem => item !== null);
  } catch {
    return [];
  }
}
