"use server";

import { headers } from "next/headers";
import { buildMouPdf, mouDraftSchema } from "@/lib/documents/mou-pdf";
import { consumeRateLimit } from "@/lib/security/rate-limit";

export type MouPdfResult = { ok: true; filename: string; base64: string } | { ok: false; error: string; errors?: Record<string, string> };

/** Builds the draft MOU PDF for download (nothing is stored). Rate limited per client. */
export async function downloadMouPdf(draft: Record<string, string>): Promise<MouPdfResult> {
  const h = await headers();
  const client = (h.get("x-forwarded-for")?.split(",")[0] || h.get("x-real-ip") || "unknown").trim().slice(0, 64);
  if (!(await consumeRateLimit("document", client)).allowed) return { ok: false, error: "Too many downloads. Please wait a few minutes." };
  const parsed = mouDraftSchema.safeParse(draft);
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const issue of parsed.error.issues) errors[String(issue.path[0])] ??= issue.message;
    return { ok: false, error: "Fill in the school name and trustee first.", errors };
  }
  const bytes = await buildMouPdf(parsed.data, { generatedAt: new Date() });
  const slug = parsed.data.school.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "school";
  return { ok: true, filename: `bsah-mou-draft-${slug}.pdf`, base64: Buffer.from(bytes).toString("base64") };
}
