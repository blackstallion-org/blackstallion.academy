import { Suspense } from "react";
import { connection } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { NewPasswordForm, ResetRequestForm } from "../forms";

/** Without a session: request a reset link. With the session from the e-mail link: choose a new password. */
export default function ResetPage() {
  return (
    <div className="max-w-xl">
      <p className="label text-brass">Staff console</p>
      <h1 className="t-voice mt-4 text-[clamp(2rem,5vw,3.5rem)] leading-tight text-bone">Reset password</h1>
      <div className="mt-10">
        <Suspense fallback={<p role="status" className="text-sand">Checking your link…</p>}><ResetStep /></Suspense>
      </div>
    </div>
  );
}

async function ResetStep() {
  await connection();
  const supabase = await createSupabaseServerClient();
  const { data } = supabase ? await supabase.auth.getUser() : { data: { user: null } };
  return data.user ? <NewPasswordForm /> : <ResetRequestForm />;
}
