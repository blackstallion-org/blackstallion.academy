"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { KINDS, MEMBER_KINDS, type FieldSpec, type MemberKind } from "@/lib/accounts/kinds";
import { createAccount, updateMemberProfile, type AccountFormState } from "./actions";

const field = "field w-full";

function Message({ state }: { state: AccountFormState }) {
  if (!state) return null;
  if (state.error) return <p role="alert" className="t-ui text-sm text-blood">{state.error}</p>;
  if (state.notice) return <p role="status" className="t-ui text-sm text-gold">{state.notice}</p>;
  return null;
}

function Field({ spec, defaultValue }: { spec: FieldSpec; defaultValue?: string }) {
  const id = `f-${spec.name}`;
  const label = (
    <span className="label text-dust">
      {spec.label}
      {spec.required ? <span aria-hidden="true"> *</span> : <span className="normal-case tracking-normal"> (optional)</span>}
    </span>
  );
  const common = { id, name: spec.name, required: spec.required, maxLength: spec.max, defaultValue, "aria-describedby": spec.hint ? `${id}-hint` : undefined } as const;
  return (
    <label htmlFor={id} className="flex flex-col gap-1">
      {label}
      {spec.type === "select" ? (
        <select {...common} className={field}>
          <option value="">Choose…</option>
          {spec.options?.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : spec.type === "textarea" ? (
        <textarea {...common} rows={2} className={`${field} resize-none`} placeholder={spec.placeholder} />
      ) : (
        <input {...common} type={spec.type} autoComplete={spec.type === "tel" ? "tel" : spec.name === "city" ? "address-level2" : spec.name === "organisation" ? "organization" : "off"} className={field} placeholder={spec.placeholder} />
      )}
      {spec.hint && <span id={`${id}-hint`} className="t-ui text-xs text-dust">{spec.hint}</span>}
    </label>
  );
}

/** Create an account: pick who you are, then only the questions that apply. Works with the keyboard and a screen reader. */
export function SignUpForm({ initialKind = "student" }: { initialKind?: MemberKind }) {
  const [state, action, pending] = useActionState<AccountFormState, FormData>(createAccount, null);
  const [kind, setKind] = useState<MemberKind>(initialKind);
  const info = KINDS[kind];
  return (
    <form action={action} className="flex flex-col gap-6" aria-busy={pending}>
      <fieldset className="flex flex-col gap-3">
        <legend className="label mb-2 text-dust">I am a…</legend>
        <div className="grid grid-cols-2 gap-3">
          {MEMBER_KINDS.map((k) => (
            <label key={k} className="group relative flex cursor-pointer flex-col gap-1 border border-line p-4 transition-colors has-[:checked]:border-gold has-[:checked]:bg-gold/10 hover:border-brass has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-gold">
              <input type="radio" name="kind" value={k} checked={kind === k} onChange={() => setKind(k)} className="sr-only" />
              <span className="label text-bone group-has-[:checked]:text-gold">{KINDS[k].label}</span>
              <span className="t-ui text-xs leading-snug text-dust">{KINDS[k].blurb}</span>
            </label>
          ))}
        </div>
        {info.reviewed && <p className="t-ui text-xs text-sand">{info.label} accounts are checked by the academy team before they are switched on. You can sign in while you wait.</p>}
      </fieldset>

      {/* A different kind asks different questions, so its inputs start fresh. */}
      <div key={kind} className="flex flex-col gap-5">
        <label className="flex flex-col gap-1">
          <span className="label text-dust">{info.nameLabel} <span aria-hidden="true">*</span></span>
          <input className={field} name="full_name" required minLength={2} maxLength={120} autoComplete="name" />
        </label>
        {info.fields.map((f) => <Field key={f.name} spec={f} />)}
      </div>

      <label className="flex flex-col gap-1">
        <span className="label text-dust">E-mail <span aria-hidden="true">*</span></span>
        <input className={field} name="email" type="email" autoComplete="email" required maxLength={160} />
      </label>
      <label className="flex flex-col gap-1">
        <span className="label text-dust">Password <span aria-hidden="true">*</span></span>
        <input className={field} name="password" type="password" autoComplete="new-password" required minLength={12} maxLength={200} aria-describedby="pw-hint" />
        <span id="pw-hint" className="t-ui text-xs text-dust">At least 12 characters, with letters and a number.</span>
      </label>
      <label className="flex flex-col gap-1">
        <span className="label text-dust">Repeat password <span aria-hidden="true">*</span></span>
        <input className={field} name="confirm" type="password" autoComplete="new-password" required minLength={12} maxLength={200} />
      </label>

      {/* Honeypot: hidden from people and from assistive tech; bots fill it. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>Website<input name="website" tabIndex={-1} autoComplete="off" /></label>
      </div>

      <label className="flex items-start gap-3">
        <input type="checkbox" name="consent" value="yes" required className="mt-1 h-4 w-4 shrink-0 accent-[var(--color-gold)]" />
        <span className="t-ui text-xs leading-relaxed text-sand">
          I agree that the academy may store these details to run my account, as described in the{" "}
          <Link href="/privacy" className="text-gold underline underline-offset-2 hover:text-bone">privacy notice</Link>.
          {kind === "student" && " If I am under 18, a parent or guardian has agreed."}
        </span>
      </label>

      <Message state={state} />
      <button disabled={pending} className="label bg-gold px-6 py-4 text-night hover:bg-bone disabled:opacity-60">{pending ? "Creating your account…" : `Create ${info.label.toLowerCase()} account`}</button>
    </form>
  );
}

/** A member's own details. Kind, e-mail and status are shown by the page, never editable here. */
export function ProfileForm({ kind, values }: { kind: MemberKind; values: { full_name: string; phone: string | null; organisation: string | null; city: string | null; details: Record<string, string> } }) {
  const [state, action, pending] = useActionState<AccountFormState, FormData>(updateMemberProfile, null);
  const info = KINDS[kind];
  const valueOf = (name: string) => (name === "phone" ? values.phone : name === "organisation" ? values.organisation : name === "city" ? values.city : values.details[name]) ?? "";
  return (
    <form action={action} className="flex max-w-xl flex-col gap-5" aria-busy={pending}>
      <label className="flex flex-col gap-1">
        <span className="label text-dust">{info.nameLabel} <span aria-hidden="true">*</span></span>
        <input className={field} name="full_name" required minLength={2} maxLength={120} autoComplete="name" defaultValue={values.full_name} />
      </label>
      {info.fields.map((f) => <Field key={f.name} spec={f} defaultValue={valueOf(f.name)} />)}
      <Message state={state} />
      <button disabled={pending} className="label self-start border border-line px-6 py-4 text-bone hover:border-gold hover:text-gold disabled:opacity-60">{pending ? "Saving…" : "Save details"}</button>
    </form>
  );
}
