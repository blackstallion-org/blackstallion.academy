import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { buildMouPdf, mouDraftSchema } from "@/lib/documents/mou-pdf";
import { objectPath } from "@/lib/storage/validate";

/**
 * After an MOU request is received, store the exact draft the trustee prepared as a private PDF for the office
 * (bucket private-documents, admins only; downloadable through 5-minute signed links in /admin/documents).
 * Best effort: a storage failure never turns a received enquiry into a failure. Needs SUPABASE_SECRET_KEY.
 */
export async function storeMouDraftForLead(raw: Record<string, string>, reference: string): Promise<{ stored: boolean; reason?: string }> {
  const admin = createSupabaseAdminClient();
  if (!admin) return { stored: false, reason: "not_configured" };
  const parsed = mouDraftSchema.safeParse({
    school: raw.organisation, city: raw.mou_city ?? "", trustee: raw.name, designation: raw.mou_designation ?? "",
    email: raw.email ?? "", phone: raw.phone ?? "", land: raw.mou_land ?? "", tier: raw.mou_tier || "standard", cadets: raw.mou_cadets ?? "",
  });
  if (!parsed.success) return { stored: false, reason: "invalid_draft" };
  try {
    const bytes = await buildMouPdf(parsed.data, { generatedAt: new Date(), reference });
    const path = objectPath("mou", "pdf");
    const up = await admin.storage.from("private-documents").upload(path, bytes, { contentType: "application/pdf", upsert: false });
    if (up.error) throw new Error("upload");
    const row = await admin.from("generated_documents").insert({ kind: "mou_draft", title: `MOU draft · ${parsed.data.school}`.slice(0, 200), storage_path: path, lead_reference: reference });
    if (row.error) {
      await admin.storage.from("private-documents").remove([path]);
      throw new Error("record");
    }
    console.info(JSON.stringify({ event: "document.stored", kind: "mou_draft" }));
    return { stored: true };
  } catch (e) {
    console.error(JSON.stringify({ event: "document.store_failed", kind: "mou_draft", step: e instanceof Error ? e.message : "unknown" }));
    return { stored: false, reason: "error" };
  }
}
