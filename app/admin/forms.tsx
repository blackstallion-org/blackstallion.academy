"use client";

import { useActionState } from "react";
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

export function SignInForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(signIn, null);
  return (
    <form action={action} className="flex max-w-sm flex-col gap-5" aria-busy={pending}>
      <label className="flex flex-col gap-1"><span className="label text-dust">E-mail</span><input className={field} name="email" type="email" autoComplete="username" required /></label>
      <label className="flex flex-col gap-1"><span className="label text-dust">Password</span><input className={field} name="password" type="password" autoComplete="current-password" required minLength={8} /></label>
      <Message state={state} />
      <button disabled={pending} className="label bg-gold px-6 py-4 text-night hover:bg-bone disabled:opacity-60">{pending ? "Signing in…" : "Sign in"}</button>
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
