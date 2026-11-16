/**
 * Second factor for staff and admissions (security audit S16, 4 Nov 2026; on by default in production since the 17 Nov 2026 audit).
 *
 * With it on, the staff console and the admissions desk accept only a session that has passed an authenticator-app code
 * (Supabase AAL2), whichever way the person signed in (password, Google, phone code); a signed-in staff member without a
 * verified authenticator is sent to /admin/mfa to add one first (nobody is locked out: enrolment needs only the signed-in session).
 *
 * - production (NODE_ENV=production): on, unless STAFF_MFA_REQUIRED=0 is set deliberately
 * - development and tests: off, unless STAFF_MFA_REQUIRED=1
 */
export function staffMfaRequired(): boolean {
  const flag = process.env.STAFF_MFA_REQUIRED;
  if (flag === "1") return true;
  if (flag === "0") return false;
  return process.env.NODE_ENV === "production";
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
