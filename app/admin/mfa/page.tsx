import type { Metadata } from "next";
import Link from "next/link";
import { requirePrivilegedSession } from "@/lib/auth/mfa-session";
import { staffMfaRequired } from "@/lib/auth/mfa";
import { EntryHeader } from "../EntryHeader";
import { ChallengeForm, EnrolForm } from "./MfaForms";

export const metadata: Metadata = { title: "Authenticator · staff console" };

/**
 * Second factor for staff and admissions accounts (lib/auth/mfa.ts). Adds an authenticator app, or asks for its current
 * code to upgrade this session. Signed-out visitors are redirected by proxy.ts and again by requirePrivilegedSession().
 */
export default async function MfaPage() {
  const { supabase, home } = await requirePrivilegedSession();
  const [{ data: level }, { data: factors }] = await Promise.all([supabase.auth.mfa.getAuthenticatorAssuranceLevel(), supabase.auth.mfa.listFactors()]);
  const verified = (factors?.totp ?? []).filter((f) => f.status === "verified");
  const done = level?.currentLevel === "aal2";
  return (
    <div className="gutter pb-24">
      <EntryHeader />
      <div className="max-w-xl">
        <p className="label text-brass">Staff console</p>
        <h1 className="t-voice mt-4 text-[clamp(2rem,5vw,3.5rem)] leading-tight text-bone">Authenticator</h1>
        <p className="t-ui mt-4 text-sand">
          {staffMfaRequired()
            ? "The console asks for a code from your authenticator app each time you sign in."
            : "Add an authenticator app now: the console will soon ask for its code at every sign-in."}
        </p>
        <div className="mt-10">
          {done ? (
            <p className="t-ui text-bone">This session is protected by your authenticator. <Link href={home} className="label text-gold hover:text-bone">Open the console →</Link></p>
          ) : verified.length ? (
            <ChallengeForm factorId={verified[0].id} />
          ) : (
            <EnrolForm />
          )}
        </div>
      </div>
    </div>
  );
}
