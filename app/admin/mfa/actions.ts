"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { logAdminError } from "@/lib/admin/server";
import { requirePrivilegedSession } from "@/lib/auth/mfa-session";
import { consumeRateLimit } from "@/lib/security/rate-limit";

export type MfaState = { error?: string; factorId?: string; qr?: string; secret?: string } | null;

/**
 * Starts adding an authenticator app (TOTP) to the signed-in staff or admissions account. Half-finished earlier attempts
 * are removed first, so repeated tries never pile up unverified factors. The QR code and the setup key go to this person
 * only, once; nothing is stored here.
 */
export async function startEnrolment(): Promise<MfaState> {
  const { supabase } = await requirePrivilegedSession();
  const { data: list, error: listError } = await supabase.auth.mfa.listFactors();
  // unknown factors: refuse rather than skip the check below (18 Nov 2026 review)
  if (listError || !list) {
    logAdminError("admin.mfa_list_failed", listError);
    return { error: "Your authenticator settings could not be read. Please try again." };
  }
  // An account that already has a working authenticator adds another only from a session confirmed with it (AAL2); a stolen
  // password alone must not be able to enrol the attacker's own app (18 Nov 2026 audit; Auth enforces this too).
  if (list.all.some((f) => f.status === "verified")) {
    const { data: level } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (level?.currentLevel !== "aal2") return { error: "This account already has an authenticator app: enter a code from it to continue." };
  }
  for (const factor of list.all) {
    if (factor.factor_type === "totp" && factor.status !== "verified") await supabase.auth.mfa.unenroll({ factorId: factor.id });
  }
  const { data, error } = await supabase.auth.mfa.enroll({ factorType: "totp", friendlyName: `BSAH console ${new Date().toISOString().slice(0, 16)}` });
  if (error || !data || data.type !== "totp") {
    logAdminError("admin.mfa_enrol_failed", error);
    return { error: "The authenticator could not be set up. Check that authenticator apps are enabled for this project, then try again." };
  }
  return { factorId: data.id, qr: data.totp.qr_code, secret: data.totp.secret };
}

const codeInput = z.object({ factorId: z.string().uuid(), code: z.string().trim().regex(/^\d{6}$/) });

/** Checks a 6-digit code (first use confirms the new authenticator); a match upgrades this session, then the console opens. */
export async function verifyCode(_prev: MfaState, data: FormData): Promise<MfaState> {
  const { supabase, home } = await requirePrivilegedSession();
  const h = await headers();
  const ip = (h.get("x-forwarded-for")?.split(",")[0] || h.get("x-real-ip") || "unknown").trim().slice(0, 64);
  if (!(await consumeRateLimit("login", ip)).allowed) return { error: "Too many attempts. Please wait fifteen minutes." };
  const parsed = codeInput.safeParse({ factorId: data.get("factorId"), code: data.get("code") });
  if (!parsed.success) return { error: "Enter the 6-digit code from your authenticator app.", factorId: String(data.get("factorId") ?? "") || undefined };
  const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId: parsed.data.factorId, code: parsed.data.code });
  if (error) return { error: "That code did not match. Codes change every 30 seconds: try the current one.", factorId: parsed.data.factorId };
  redirect(home);
}
