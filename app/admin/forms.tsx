"use client";

import { useActionState, useState } from "react";
import { resendConfirmation, sendPhoneCode, signInWithGoogle, verifyPhoneCode, type AuthFormState } from "@/app/auth/actions";
import { LEAD_STATUSES } from "@/lib/admin/constants";
import { statusLabel } from "@/lib/admin/present";
import { assignLeadToMe, requestPasswordReset, setLeadStatus, signIn, updatePassword, uploadMedia, type FormState } from "./actions";

const field = "field w-full";

function Message({ state }: { state: FormState }) {
  if (!state) return null;
  if (state.error) return <p role="alert" className="text-sm font-medium text-red-400">{state.error}</p>;
  if (state.notice) return <p role="status" className="text-sm font-medium text-[#E8FF1F]">{state.notice}</p>;
  return null;
}

export function SignInForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(signIn, null);
  const [resent, resend, resending] = useActionState<AuthFormState, FormData>(resendConfirmation, null);
  return (
    <form action={action} className="flex max-w-sm flex-col gap-5" aria-busy={pending}>
      {next && <input type="hidden" name="next" value={next} />}
      <label className="flex flex-col gap-1.5"><span className="text-xs font-semibold uppercase tracking-wider text-white/50">E-mail</span><input className={field} name="email" type="email" autoComplete="username" required /></label>
      <label className="flex flex-col gap-1.5"><span className="text-xs font-semibold uppercase tracking-wider text-white/50">Password</span><input className={field} name="password" type="password" autoComplete="current-password" required minLength={8} /></label>
      <Message state={state} />
      {state?.unconfirmed && (
        <>
          <button formAction={resend} formNoValidate disabled={resending} className="self-start text-xs font-semibold text-[#E8FF1F] hover:underline disabled:opacity-60">{resending ? "Sending…" : "Send the confirmation e-mail again"}</button>
          <Message state={resent} />
        </>
      )}
      <button disabled={pending} className="inline-flex items-center justify-center rounded-xl bg-[#E8FF1F] px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-[#0b0b0c] shadow-md shadow-[#E8FF1F]/20 hover:brightness-105 transition-all disabled:opacity-60">{pending ? "Signing in…" : "Sign in"}</button>
    </form>
  );
}

/** One button for signing in and signing up: the first Google sign-in creates the account. A plain form, so it works without JavaScript. */
export function GoogleButton({ next, label = "Continue with Google" }: { next?: string; label?: string }) {
  return (
    <form action={signInWithGoogle} className="w-full max-w-sm">
      {next && <input type="hidden" name="next" value={next} />}
      <button className="flex w-full items-center justify-center gap-3 rounded-sm border border-[#747775] bg-white px-6 py-3 font-sans text-sm font-medium tracking-[0.01em] text-[#1f1f1f] shadow-sm transition-colors hover:bg-[#f8f9fa] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1a73e8]">
        <svg aria-hidden="true" viewBox="0 0 48 48" className="h-5 w-5 shrink-0"><path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-2.641-.21-5.236-.611-7.743z" /><path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" /><path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" /><path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l6.19 5.238C42.022 35.026 44 30.038 44 24c0-2.641-.21-5.236-.611-7.743z" /></svg>
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
      <label htmlFor={selectId} className={compact ? "sr-only" : "text-xs font-semibold uppercase tracking-wider text-white/50"}>
        {compact ? `Status of the enquiry from ${contactName}` : "Status"}
      </label>
      <div className="flex flex-wrap items-center gap-2">
        <select key={status} id={selectId} name="status" defaultValue={status} className="field w-auto min-w-36 py-2 text-xs font-medium">
          {LEAD_STATUSES.map((s) => <option key={s} value={s}>{statusLabel(s)}</option>)}
        </select>
        <button disabled={pending} className="inline-flex items-center justify-center rounded-xl bg-[#E8FF1F] px-4 py-2 text-xs font-semibold text-[#0b0b0c] shadow-sm hover:brightness-105 active:scale-[0.98] transition-all disabled:opacity-60">
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
      <button disabled={pending} className="inline-flex items-center self-start rounded-xl border border-white/12 bg-white/[0.04] px-3.5 py-2 text-xs font-medium text-white/80 transition-all hover:border-[#E8FF1F]/40 hover:text-[#E8FF1F] hover:bg-white/[0.08] disabled:opacity-60">
        {pending ? "Assigning…" : label}
      </button>
      <Message state={state} />
    </form>
  );
}

export function UploadForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(uploadMedia, null);
  return (
    <form action={action} className="grid max-w-xl gap-5 rounded-[28px] border border-white/10 bg-white/[0.03] p-6 backdrop-blur-xl shadow-2xl relative" aria-busy={pending}>
      <div aria-hidden className="pointer-events-none absolute inset-0 rounded-[28px] shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]" />
      <label className="relative z-10 flex min-w-0 flex-col gap-1.5"><span className="text-xs font-semibold uppercase tracking-wider text-white/50">Image (PNG, JPEG or WebP, up to 4 MB)</span><input className="w-full min-w-0 text-sm text-white/80 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-[#E8FF1F] file:text-[#0b0b0c] hover:file:brightness-105" name="file" type="file" accept="image/png,image/jpeg,image/webp" required /></label>
      <label className="relative z-10 flex flex-col gap-1.5"><span className="text-xs font-semibold uppercase tracking-wider text-white/50">Alt text</span><input className={field} name="alt" required minLength={3} maxLength={300} placeholder="Describe what the image shows" /></label>
      <Message state={state} />
      <button disabled={pending} className="relative z-10 justify-self-start inline-flex items-center rounded-xl bg-[#E8FF1F] px-6 py-3 text-xs font-bold uppercase tracking-wider text-[#0b0b0c] shadow-md shadow-[#E8FF1F]/20 hover:brightness-105 transition-all disabled:opacity-60">{pending ? "Uploading…" : "Upload"}</button>
    </form>
  );
}
