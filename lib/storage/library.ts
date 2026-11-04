import { kindOf, type MediaKind } from "@/lib/storage/validate";

/** The public Supabase Storage bucket the media library lives in (images, video and 3D models). */
export const LIBRARY_BUCKET = "bsah-media";

/** A file of the media library, as the website shows it. */
export type LibraryItem = { id: string; path: string; alt: string; mime: string; kind: MediaKind; bytes: number; createdAt: string; url: string };

/** The permanent public address of an object in a public bucket (no policy and no signature needed to read it). */
export function publicObjectUrl(supabaseUrl: string, bucket: string, path: string): string {
  const origin = supabaseUrl.replace(/\/+$/, "");
  return `${origin}/storage/v1/object/public/${bucket}/${path.split("/").map(encodeURIComponent).join("/")}`;
}

type Row = { id?: unknown; storage_path?: unknown; alt_text?: unknown; mime_type?: unknown; bytes?: unknown; created_at?: unknown };

/** A media_assets row as a library item, or null if it is not a well-formed library row (a bad row never breaks the page). */
export function toLibraryItem(row: Row, supabaseUrl: string): LibraryItem | null {
  const { id, storage_path: path, alt_text: alt, mime_type: mime, bytes, created_at: createdAt } = row;
  if (typeof id !== "string" || typeof path !== "string" || typeof alt !== "string" || typeof mime !== "string") return null;
  const kind = kindOf(mime);
  if (!kind || typeof bytes !== "number" || typeof createdAt !== "string") return null;
  return { id, path, alt, mime, kind, bytes, createdAt, url: publicObjectUrl(supabaseUrl, LIBRARY_BUCKET, path) };
}

export type ObjectHead = { ok: true; head: Uint8Array; total: number } | { ok: false; error: string };

const HEAD_BYTES = 64;

/**
 * The first bytes of a public object and its total size, with one ranged request. The rest of the file is never
 * downloaded: a 50 MB video would otherwise pass through the server just to be checked.
 */
export async function readObjectHead(url: string, fetchImpl: typeof fetch = fetch): Promise<ObjectHead> {
  let res: Response;
  try {
    res = await fetchImpl(url, { headers: { range: `bytes=0-${HEAD_BYTES - 1}` }, cache: "no-store", signal: AbortSignal.timeout(10_000) });
  } catch {
    return { ok: false, error: "The uploaded file could not be read back." };
  }
  if (res.status !== 206 && res.status !== 200) return { ok: false, error: "The uploaded file could not be found in storage." };
  // 206: "bytes 0-63/12345". 200 (range ignored): the length of the whole body.
  const range = /^bytes \d+-\d+\/(\d+)$/.exec(res.headers.get("content-range") ?? "");
  const total = res.status === 206 ? Number(range?.[1]) : Number(res.headers.get("content-length"));
  if (!Number.isFinite(total) || total <= 0) return { ok: false, error: "The size of the uploaded file could not be read." };
  const reader = res.body?.getReader();
  if (!reader) return { ok: false, error: "The uploaded file could not be read back." };
  const chunks: Uint8Array[] = [];
  let have = 0;
  while (have < HEAD_BYTES) {
    const { done, value } = await reader.read();
    if (done || !value) break;
    chunks.push(value);
    have += value.length;
  }
  await reader.cancel().catch(() => {});
  const head = new Uint8Array(Math.min(have, HEAD_BYTES));
  let at = 0;
  for (const chunk of chunks) {
    const take = Math.min(chunk.length, head.length - at);
    head.set(chunk.subarray(0, take), at);
    at += take;
    if (at >= head.length) break;
  }
  return { ok: true, head, total };
}
