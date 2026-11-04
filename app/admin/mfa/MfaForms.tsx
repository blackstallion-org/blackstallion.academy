"use client";

import { useActionState } from "react";
import { startEnrolment, verifyCode, type MfaState } from "./actions";

const field = "field w-full";

function Problem({ state }: { state: MfaState }) {
  return state?.error ? <p role="alert" className="t-ui text-sm text-blood">{state.error}</p> : null;
}

function CodeForm({ factorId, action, pending }: { factorId: string; action: (data: FormData) => void; pending: boolean }) {
  return (
    <form action={action} className="flex max-w-sm flex-col gap-5" aria-busy={pending}>
      <input type="hidden" name="factorId" value={factorId} />
      <label className="flex flex-col gap-1">
        <span className="label text-dust">6-digit code</span>
        <input className={`${field} font-mono tracking-[0.3em]`} name="code" inputMode="numeric" autoComplete="one-time-code" pattern="\d{6}" maxLength={6} required />
      </label>
      <button disabled={pending} className="label bg-gold px-6 py-4 text-night hover:bg-bone disabled:opacity-60">{pending ? "Checking…" : "Confirm"}</button>
    </form>
  );
}

/** The account already has an authenticator: one code upgrades this session. */
export function ChallengeForm({ factorId }: { factorId: string }) {
  const [state, action, pending] = useActionState<MfaState, FormData>(verifyCode, null);
  return (
    <div className="flex flex-col gap-4">
      <CodeForm factorId={factorId} action={action} pending={pending} />
      <Problem state={state} />
    </div>
  );
}

/** No authenticator yet: show a QR code (and the setup key for typing it in), then confirm with the first code. */
export function EnrolForm() {
  const [setup, begin, starting] = useActionState<MfaState, FormData>(startEnrolment, null);
  const [state, action, pending] = useActionState<MfaState, FormData>(verifyCode, null);
  if (!setup?.factorId) {
    return (
      <form action={begin} className="flex max-w-sm flex-col gap-5" aria-busy={starting}>
        <p className="t-ui text-sand">Use an authenticator app (Google Authenticator, Microsoft Authenticator, 1Password and similar).</p>
        <button disabled={starting} className="label self-start bg-gold px-6 py-4 text-night hover:bg-bone disabled:opacity-60">{starting ? "Preparing…" : "Add an authenticator"}</button>
        <Problem state={setup} />
      </form>
    );
  }
  return (
    <div className="flex max-w-sm flex-col gap-6">
      <p className="t-ui text-sand">Scan this code with the app, then type the 6-digit code it shows.</p>
      {/* eslint-disable-next-line @next/next/no-img-element -- a one-off data URI from Supabase Auth, not a site image */}
      <img src={setup.qr} alt="QR code for your authenticator app" width={200} height={200} className="bg-bone p-3" />
      <p className="t-ui text-sm text-dust">Cannot scan? Enter this key in the app: <span className="font-mono break-all text-bone">{setup.secret}</span></p>
      <CodeForm factorId={setup.factorId} action={action} pending={pending} />
      <Problem state={state} />
    </div>
  );
}
