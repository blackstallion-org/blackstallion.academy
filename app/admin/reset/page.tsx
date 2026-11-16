import { EntryHeader } from "../EntryHeader";
import { Suspense } from "react";
import { connection } from "next/server";
import { sessionAuthenticatedRecently } from "@/lib/auth/recent-auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { NewPasswordForm, ResetRequestForm } from "../forms";

/** Without a session: request a reset link. With the session from the e-mail link: choose a new password. */
export default function ResetPage() {
  return (
    <>
    <div className="gutter pb-24">
    <EntryHeader />
    <div className="max-w-xl">
      <p className="label text-brass">Staff console</p>
      <h1 className="t-voice mt-4 text-[clamp(2rem,5vw,3.5rem)] leading-tight text-bone">Reset password</h1>
      <div className="mt-10">
        <Suspense fallback={<p role="status" className="text-sand">Checking your link…</p>}><ResetStep /></Suspense>
      </div>
    </div>
    </div>
    </>
  );
}

async function ResetStep() {
  await connection();
  const supabase = await createSupabaseServerClient();
  const { data } = supabase ? await supabase.auth.getUser() : { data: { user: null } };
  if (!data.user || !supabase) return <ResetRequestForm />;
  // only a session opened from the reset link (or a sign-in) in the last ten minutes may choose a new password (audit M2)
  if (await sessionAuthenticatedRecently(supabase)) return <NewPasswordForm />;
  return (
    <>
      <p className="t-ui mb-8 text-sm text-sand">For your security, a new password needs a fresh reset link. Request one below; it arrives by e-mail.</p>
      <ResetRequestForm />
    </>
  );
}
