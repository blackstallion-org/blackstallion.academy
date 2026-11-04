/**
 * Second factor for staff and admissions (security audit S16, 4 Nov 2026).
 *
 * Off until STAFF_MFA_REQUIRED=1. With it on, the staff console and the admissions desk accept only a session that has
 * passed an authenticator-app code (Supabase AAL2), whichever way the person signed in (password, Google, phone code); a
 * signed-in staff member without a verified authenticator is sent to /admin/mfa to add one. Switch it on only after
 * every staff account has enrolled there, or those accounts cannot open the console until they do.
 */
export function staffMfaRequired(): boolean {
  return process.env.STAFF_MFA_REQUIRED === "1";
}

export type AssuranceClient = {
  auth: { mfa: { getAuthenticatorAssuranceLevel: () => PromiseLike<{ data: { currentLevel: string | null } | null; error: unknown }> } };
};

/** True when this session has to pass /admin/mfa before the console opens. An unreadable level counts as "not yet". */
export async function needsSecondFactor(supabase: AssuranceClient): Promise<boolean> {
  if (!staffMfaRequired()) return false;
  const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  return Boolean(error) || data?.currentLevel !== "aal2";
}
