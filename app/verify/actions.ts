"use server";

import { headers } from "next/headers";
import { lookupCredentialCore, type LookupResult } from "@/lib/verify/lookup";

/** Server-side credential lookup for the /verify forms (rate limited; see lib/verify/lookup.ts). */
export async function lookupCredential(code: string): Promise<LookupResult> {
  const h = await headers();
  const client = (h.get("x-forwarded-for")?.split(",")[0] || h.get("x-real-ip") || "unknown").trim().slice(0, 64);
  return lookupCredentialCore(code, client);
}
