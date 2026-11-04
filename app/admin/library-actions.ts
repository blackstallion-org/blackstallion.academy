"use server";

import { revalidatePath, updateTag } from "next/cache";
import { z } from "zod";
import { logAdminError } from "@/lib/admin/server";
import { requireStaff } from "@/lib/auth/admin";
import { LIBRARY_BUCKET, publicObjectUrl, readObjectHead } from "@/lib/storage/library";
import { LIBRARY_TAG } from "@/lib/storage/library-feed";
import { checkDeclared, LIBRARY_PATH, libraryPath, verifyLibraryObject, type MediaKind } from "@/lib/storage/validate";
import { supabaseConfig } from "@/lib/supabase/rest";

/**
 * Media library (bucket bsah-media): images, video and 3D models, staff only.
 *
 * Videos and 3D models are too big for a server action (Vercel caps a request body at about 4.5 MB), so the file goes from the
 * browser straight to Storage in three steps:
 *   1. prepareLibraryUpload: checks the signed-in staff member and the declared name and size, then asks Storage for a one-time
 *      upload link for a fresh random path (Storage's own policy checks staff again),
 *   2. the browser uploads to that link,
 *   3. recordLibraryUpload: reads the first bytes of what is now stored, checks they really are the type the name promises,
 *      and only then records the file so the website shows it. A file that fails is removed again.
 */
export type PrepareResult = { ok: true; path: string; token: string; mime: string; kind: MediaKind } | { ok: false; error: string };
export type RecordResult = { ok: true; notice: string } | { ok: false; error: string };

const prepareInput = z.object({ name: z.string().min(1).max(255), size: z.number().int().positive() });
const recordInput = z.object({ path: z.string().max(200), alt: z.string().trim().min(3, "Describe the file (alt text).").max(300) });

function refresh() {
  updateTag(LIBRARY_TAG); // the public /gallery shows the change on its next view
  revalidatePath("/admin/media");
}

export async function prepareLibraryUpload(input: unknown): Promise<PrepareResult> {
  const { supabase } = await requireStaff();
  const parsed = prepareInput.safeParse(input);
  if (!parsed.success) return { ok: false, error: "That file could not be read." };
  const declared = checkDeclared(parsed.data.name, parsed.data.size);
  if (!declared.ok) return declared;
  const path = libraryPath(declared.kind, declared.ext);
  const { data, error } = await supabase.storage.from(LIBRARY_BUCKET).createSignedUploadUrl(path);
  if (error || !data) {
    logAdminError("admin.library_prepare_failed", error);
    return { ok: false, error: "The upload could not be started. Check that the bsah-media policies have been applied." };
  }
  return { ok: true, path, token: data.token, mime: declared.mime, kind: declared.kind };
}

export async function recordLibraryUpload(input: unknown): Promise<RecordResult> {
  const { supabase, user } = await requireStaff();
  const parsed = recordInput.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Add a description." };
  const { path, alt } = parsed.data;
  if (!LIBRARY_PATH.test(path)) return { ok: false, error: "That file is not one this library issued." };
  const config = supabaseConfig();
  if (!config) return { ok: false, error: "Storage is not configured." };

  const discard = async () => { await supabase.storage.from(LIBRARY_BUCKET).remove([path]); };
  const head = await readObjectHead(publicObjectUrl(config.url, LIBRARY_BUCKET, path));
  if (!head.ok) { await discard(); return { ok: false, error: head.error }; }
  const check = verifyLibraryObject(path, head.head, head.total);
  if (!check.ok) { await discard(); return { ok: false, error: check.error }; }

  const { error } = await supabase.from("media_assets").insert({
    storage_path: path, alt_text: alt, mime_type: check.type.mime, bytes: head.total, uploaded_by: user.id, bucket: LIBRARY_BUCKET, kind: check.kind,
  });
  if (error) {
    logAdminError("admin.library_record_failed", error);
    await discard();
    return { ok: false, error: "The file could not be recorded, so it was removed again. Check that the media library migration has been applied." };
  }
  refresh();
  return { ok: true, notice: "Uploaded. It is now on the gallery page." };
}

/** Removes the file from Storage first, then its record; if Storage refuses, the record stays so the delete can be tried again. */
export async function deleteLibraryItem(data: FormData): Promise<void> {
  const { supabase } = await requireStaff();
  const id = z.string().uuid().safeParse(data.get("id"));
  if (!id.success) return;
  const { data: row } = await supabase.from("media_assets").select("storage_path").eq("id", id.data).eq("bucket", LIBRARY_BUCKET).maybeSingle();
  if (!row || !LIBRARY_PATH.test(row.storage_path)) return;
  const { error } = await supabase.storage.from(LIBRARY_BUCKET).remove([row.storage_path]);
  if (error) {
    logAdminError("admin.library_delete_failed", error);
    return;
  }
  await supabase.from("media_assets").delete().eq("id", id.data);
  refresh();
}
