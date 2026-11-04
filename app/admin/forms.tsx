"use client";

import { useActionState, useState } from "react";
import { resendConfirmation, sendPhoneCode, signInWithGoogle, verifyPhoneCode, type AuthFormState } from "@/app/auth/actions";
import { LEAD_STATUSES } from "@/lib/admin/constants";
import { statusLabel } from "@/lib/admin/present";
import { assignLeadToMe, requestPasswordReset, setLeadStatus, signIn, updatePassword, uploadMedia, type FormState } from "./actions";

const field = "field w-full";

function Message({ state }: { state: FormState }) {
  if (!state) return null;
  if (state.error) return <p role="alert" className="t-ui text-sm text-blood">{state.error}</p>;
  if (state.notice) return <p role="status" className="t-ui text-sm text-sand">{state.notice}</p>;
  return null;
}

export function SignInForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(signIn, null);
  const [resent, resend, resending] = useActionState<AuthFormState, FormData>(resendConfirmation, null);
  return (
    <form action={action} className="flex max-w-sm flex-col gap-5" aria-busy={pending}>
      {next && <input type="hidden" name="next" value={next} />}
      <label className="flex flex-col gap-1"><span className="label text-dust">E-mail</span><input className={field} name="email" type="email" autoComplete="username" required /></label>
      <label className="flex flex-col gap-1"><span className="label text-dust">Password</span><input className={field} name="password" type="password" autoComplete="current-password" required minLength={8} /></label>
      <Message state={state} />
      {state?.unconfirmed && (
        <>
          <button formAction={resend} formNoValidate disabled={resending} className="label self-start border-b border-line pb-1 text-gold hover:border-gold hover:text-bone disabled:opacity-60">{resending ? "Sending…" : "Send the confirmation e-mail again"}</button>
          <Message state={resent} />
        </>
      )}
      <button disabled={pending} className="label bg-gold px-6 py-4 text-night hover:bg-bone disabled:opacity-60">{pending ? "Signing in…" : "Sign in"}</button>
    </form>
  );
}

const GOOGLE_G = "M21.35 11.1h-9.17v2.73h6.51c-.33 3.81-3.5 5.44-6.5 5.44C8.36 19.27 5 16.25 5 12c0-4.1 3.2-7.27 7.2-7.27 3.09 0 4.9 1.97 4.9 1.97L19 4.72S16.56 2 12.1 2C6.42 2 2.03 6.8 2.03 12c0 5.05 4.13 10 10.22 10 5.35 0 9.25-3.67 9.25-9.09 0-1.15-.15-1.81-.15-1.81z";

/** One button for signing in and signing up: the first Google sign-in creates the account. A plain form, so it works without JavaScript. */
export function GoogleButton({ next, label = "Continue with Google" }: { next?: string; label?: string }) {
  return (
    <form action={signInWithGoogle} className="w-full max-w-sm">
      {next && <input type="hidden" name="next" value={next} />}
      <button className="label flex w-full items-center justify-center gap-3 border border-line px-6 py-4 text-bone hover:border-gold hover:text-gold">
        <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 shrink-0 fill-current"><path d={GOOGLE_G} /></svg>
        {label}
      </button>
    </form>
  );
}

/** Text-message sign-in in two steps: the mobile number, then the 6-digit code. The first successful code creates the account. */
export function PhoneSignIn({ next }: { next?: string }) {
  const [sent, send, sending] = useActionState<AuthFormState, FormData>(sendPhoneCode, null);
  const [checked, verify, verifying] = useActionState<AuthFormState, FormData>(verifyPhoneCode, null);
  const [dismissed, setDismissed] = useState<AuthFormState>(null);
  const onCode = sent?.step === "code" && sent !== dismissed;
  if (!onCode) {
    return (
      <form action={send} className="flex max-w-sm flex-col gap-5" aria-busy={sending}>
        <label className="flex flex-col gap-1">
          <span className="label text-dust">Mobile number</span>
          <input className={field} name="phone" type="tel" inputMode="tel" autoComplete="tel" required maxLength={24} placeholder="98765 43210" aria-describedby="phone-hint" />
          <span id="phone-hint" className="t-ui text-xs text-dust">We text you a 6-digit code. Numbers outside India start with + and the country code.</span>
        </label>
        <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden"><label>Website<input name="website" tabIndex={-1} autoComplete="off" /></label></div>
        <Message state={sent} />
        <button disabled={sending} className="label bg-gold px-6 py-4 text-night hover:bg-bone disabled:opacity-60">{sending ? "Sending…" : "Send the code"}</button>
      </form>
    );
  }
  const phone = checked?.phone ?? sent.phone ?? "";
  return (
    <form action={verify} className="flex max-w-sm flex-col gap-5" aria-busy={verifying}>
      {next && <input type="hidden" name="next" value={next} />}
      <input type="hidden" name="phone" value={phone} />
      <label className="flex flex-col gap-1">
        <span className="label text-dust">6-digit code</span>
        <input className={`${field} font-mono tracking-[0.4em]`} name="token" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9 ]{6,7}" maxLength={7} required autoFocus />
      </label>
      <Message state={checked ?? sent} />
      <button disabled={verifying} className="label bg-gold px-6 py-4 text-night hover:bg-bone disabled:opacity-60">{verifying ? "Checking…" : "Sign in"}</button>
      <div className="flex flex-wrap gap-x-6 gap-y-2">
        <button formAction={send} formNoValidate disabled={sending} className="label border-b border-line pb-1 text-gold hover:border-gold hover:text-bone disabled:opacity-60">{sending ? "Sending…" : "Send a new code"}</button>
        <button type="button" onClick={() => setDismissed(sent)} className="label border-b border-line pb-1 text-sand hover:border-gold hover:text-bone">Use a different number</button>
      </div>
    </form>
  );
}

export function ResetRequestForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(requestPasswordReset, null);
  return (
    <form action={action} className="flex max-w-sm flex-col gap-5" aria-busy={pending}>
      <label className="flex flex-col gap-1"><span className="label text-dust">E-mail</span><input className={field} name="email" type="email" autoComplete="username" required /></label>
      <Message state={state} />
      <button disabled={pending} className="label border border-line px-6 py-4 text-bone hover:border-gold hover:text-gold disabled:opacity-60">{pending ? "Sending…" : "Send reset link"}</button>
    </form>
  );
}

export function NewPasswordForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(updatePassword, null);
  return (
    <form action={action} className="flex max-w-sm flex-col gap-5" aria-busy={pending}>
      <label className="flex flex-col gap-1"><span className="label text-dust">New password</span><input className={field} name="password" type="password" autoComplete="new-password" required minLength={12} /></label>
      <label className="flex flex-col gap-1"><span className="label text-dust">Repeat password</span><input className={field} name="confirm" type="password" autoComplete="new-password" required minLength={12} /></label>
      <p className="t-ui text-xs text-dust">At least 12 characters, with letters and a number.</p>
      <Message state={state} />
      <button disabled={pending} className="label bg-gold px-6 py-4 text-night hover:bg-bone disabled:opacity-60">{pending ? "Saving…" : "Set password"}</button>
    </form>
  );
}

/**
 * Enquiry status. The select is keyed by the saved status: React resets a form after its action, and an uncontrolled
 * select would otherwise snap back to the value it was first rendered with, hiding the change that was just saved.
 */
export function LeadStatusForm({ id, status, contactName, compact = false }: { id: string; status: string; contactName: string; compact?: boolean }) {
  const [state, action, pending] = useActionState<FormState, FormData>(setLeadStatus, null);
  const selectId = `status-${id}`;
  return (
    <form action={action} className="flex flex-col gap-2" aria-busy={pending}>
      <input type="hidden" name="id" value={id} />
      <label htmlFor={selectId} className={compact ? "sr-only" : "label text-dust"}>
        {compact ? `Status of the enquiry from ${contactName}` : "Status"}
      </label>
      <div className="flex flex-wrap items-center gap-2">
        <select key={status} id={selectId} name="status" defaultValue={status} className="field w-auto min-w-36 py-2 text-sm">
          {LEAD_STATUSES.map((s) => <option key={s} value={s}>{statusLabel(s)}</option>)}
        </select>
        <button disabled={pending} className="label border border-line px-3 py-2 text-bone hover:border-gold hover:text-gold disabled:opacity-60">
          {pending ? "Saving…" : "Save"}
          {compact && <span className="sr-only"> status for {contactName}</span>}
        </button>
      </div>
      <Message state={state} />
    </form>
  );
}

/** Assigns the enquiry to the signed-in staff member (the server takes the id from the session, not from here). */
export function AssignToMeForm({ id, label = "Assign to me" }: { id: string; label?: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(assignLeadToMe, null);
  return (
    <form action={action} className="flex flex-col gap-2" aria-busy={pending}>
      <input type="hidden" name="id" value={id} />
      <button disabled={pending} className="label self-start border border-line px-4 py-2 text-bone hover:border-gold hover:text-gold disabled:opacity-60">
        {pending ? "Assigning…" : label}
      </button>
      <Message state={state} />
    </form>
  );
}

export function UploadForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(uploadMedia, null);
  return (
    <form action={action} className="grid max-w-xl gap-5" aria-busy={pending}>
      <label className="flex min-w-0 flex-col gap-1"><span className="label text-dust">Image (PNG, JPEG or WebP, up to 4 MB)</span><input className="t-ui w-full min-w-0 text-sm text-sand" name="file" type="file" accept="image/png,image/jpeg,image/webp" required /></label>
      <label className="flex flex-col gap-1"><span className="label text-dust">Alt text</span><input className={field} name="alt" required minLength={3} maxLength={300} placeholder="Describe what the image shows" /></label>
      <Message state={state} />
      <button disabled={pending} className="label justify-self-start bg-gold px-6 py-4 text-night hover:bg-bone disabled:opacity-60">{pending ? "Uploading…" : "Upload"}</button>
    </form>
  );
}
