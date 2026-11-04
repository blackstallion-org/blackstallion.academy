"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { addChild, saveApplication, startPayment, submitApplication, uploadDocument, type ApplyState, type CheckoutState } from "@/app/enroll/actions";
import { FIELDS, type FieldSpec } from "@/lib/registration/fields";
import { DOC_LABEL, rupees, type ApplicationKind, type DocType } from "@/lib/registration/model";
import { cn } from "@/lib/utils";

const field = "field w-full";
const button = "label inline-flex min-h-12 items-center justify-center bg-gold px-8 py-3 text-night hover:bg-bone focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold disabled:opacity-60";

export function Message({ state }: { state: ApplyState | CheckoutState }) {
  if (!state) return null;
  if (state.error) return <p role="alert" className="t-ui text-sm text-blood">{state.error}</p>;
  if ("notice" in state && state.notice) return <p role="status" className="t-ui text-sm text-gold">{state.notice}</p>;
  return null;
}

/** The steps of an application, with the current one marked for sighted and screen-reader users alike. */
export function Steps({ steps, current }: { steps: readonly string[]; current: number }) {
  return (
    <ol className="flex flex-wrap gap-x-6 gap-y-3" aria-label="Application steps">
      {steps.map((s, i) => (
        <li key={s} aria-current={i === current ? "step" : undefined} className={cn("label flex items-center gap-2", i < current ? "text-brass" : i === current ? "text-gold" : "text-dust")}>
          <span aria-hidden className={cn("grid h-7 w-7 place-items-center rounded-full border font-mono text-xs", i === current ? "border-gold" : "border-line")}>{i < current ? "✓" : i + 1}</span>
          <span>{s}<span className="sr-only">{i < current ? " (done)" : i === current ? " (current step)" : ""}</span></span>
        </li>
      ))}
    </ol>
  );
}

function Input({ spec, defaultValue, invalid }: { spec: FieldSpec; defaultValue?: string; invalid?: boolean }) {
  const id = `f-${spec.name}`;
  const common = { id, name: spec.name, required: spec.required, "aria-invalid": invalid || undefined, "aria-describedby": spec.hint ? `${id}-hint` : undefined };
  if (spec.type === "checkbox") {
    return (
      <label htmlFor={id} className={cn("flex items-start gap-3", spec.wide && "md:col-span-2")}>
        <input {...common} type="checkbox" defaultChecked={defaultValue === "on"} className="mt-1 h-5 w-5 accent-[var(--color-gold)]" />
        <span className="t-ui text-sm text-sand">{spec.label}</span>
      </label>
    );
  }
  return (
    <label htmlFor={id} className={cn("flex flex-col gap-1", spec.wide && "md:col-span-2")}>
      <span className="label text-dust">{spec.label}{spec.required ? <span aria-hidden="true"> *</span> : <span className="normal-case tracking-normal"> (optional)</span>}</span>
      {spec.type === "select" ? (
        <select {...common} defaultValue={defaultValue ?? ""} className={field}>
          <option value="">Choose…</option>
          {spec.options?.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      ) : spec.type === "textarea" ? (
        <textarea {...common} defaultValue={defaultValue} maxLength={spec.max} rows={4} className={cn(field, "resize-y")} />
      ) : (
        <input {...common} type={spec.type} defaultValue={defaultValue} maxLength={spec.max} autoComplete={spec.autoComplete ?? "off"} inputMode={spec.type === "number" ? "decimal" : undefined} className={field} />
      )}
      {spec.hint && <span id={`${id}-hint`} className="t-ui text-xs text-dust">{spec.hint}</span>}
    </label>
  );
}

type Option = { id: string; label: string };

/** Adds a child to the guardian's account (a record, not a login). */
export function AddChildForm() {
  const [state, action, pending] = useActionState<ApplyState, FormData>(addChild, null);
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => { if (state?.notice) formRef.current?.reset(); }, [state]);
  const bad = (n: string) => state?.field === n;
  return (
    <form ref={formRef} action={action} className="grid gap-5 md:grid-cols-2" aria-busy={pending}>
      <label className="flex flex-col gap-1"><span className="label text-dust">First name *</span><input name="first_name" required maxLength={80} aria-invalid={bad("first_name") || undefined} className={field} autoComplete="off" /></label>
      <label className="flex flex-col gap-1"><span className="label text-dust">Last name *</span><input name="last_name" required maxLength={80} aria-invalid={bad("last_name") || undefined} className={field} autoComplete="off" /></label>
      <label className="flex flex-col gap-1"><span className="label text-dust">Date of birth *</span><input name="date_of_birth" type="date" required aria-invalid={bad("date_of_birth") || undefined} className={field} /></label>
      <label className="flex flex-col gap-1"><span className="label text-dust">Riding experience</span>
        <select name="riding_experience" defaultValue="none" className={field}>
          <option value="none">None yet</option><option value="some">A few rides</option><option value="regular">Rides regularly</option><option value="competitive">Competes</option>
        </select>
      </label>
      <label className="flex flex-col gap-1"><span className="label text-dust">Current school (optional)</span><input name="current_school" maxLength={160} className={field} autoComplete="off" /></label>
      <label className="flex flex-col gap-1"><span className="label text-dust">Class / grade (optional)</span><input name="grade" maxLength={20} className={field} autoComplete="off" /></label>
      <label className="flex flex-col gap-1 md:col-span-2"><span className="label text-dust">Medical notes the instructors must know (optional)</span>
        <textarea name="medical_notes" maxLength={1000} rows={2} className={cn(field, "resize-y")} aria-describedby="medical-hint" />
        <span id="medical-hint" className="t-ui text-xs text-dust">Seen only by you and the admissions team. Never sent by e-mail.</span>
      </label>
      <div className="flex flex-wrap items-center gap-4 md:col-span-2">
        <button disabled={pending} className={button}>{pending ? "Saving…" : "Add child"}</button>
        <Message state={state} />
      </div>
    </form>
  );
}

/** The application form for any kind. A draft is saved first; documents and submission follow on the application's page. */
export function ApplicationForm({ kind, childOptions, programs, hubs, initial, applicationId }: {
  kind: ApplicationKind; childOptions?: Option[]; programs?: Option[]; hubs?: Option[];
  initial?: Record<string, string>; applicationId?: string;
}) {
  const [state, action, pending] = useActionState<ApplyState, FormData>(saveApplication, null);
  return (
    <form action={action} className="grid gap-5 md:grid-cols-2" aria-busy={pending} noValidate={false}>
      <input type="hidden" name="kind" value={kind} />
      {applicationId && <input type="hidden" name="application_id" value={applicationId} />}
      <div aria-hidden="true" className="hidden"><label>Website<input name="website" tabIndex={-1} autoComplete="off" /></label></div>
      {kind === "cadet" && (
        <>
          <label className="flex flex-col gap-1"><span className="label text-dust">Child *</span>
            <select name="child_id" required defaultValue={initial?.child_id ?? ""} aria-invalid={state?.field === "child_id" || undefined} className={field}>
              <option value="">Choose…</option>
              {childOptions?.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
          </label>
          <label className="flex flex-col gap-1"><span className="label text-dust">Programme *</span>
            <select name="program_id" required defaultValue={initial?.program_id ?? programs?.[0]?.id ?? ""} aria-invalid={state?.field === "program_id" || undefined} className={field}>
              <option value="">Choose…</option>
              {programs?.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
            </select>
          </label>
          <label className="flex flex-col gap-1 md:col-span-2"><span className="label text-dust">Preferred campus (optional)</span>
            <select name="hub_id" defaultValue={initial?.hub_id ?? ""} className={field}>
              <option value="">No preference yet</option>
              {hubs?.map((h) => <option key={h.id} value={h.id}>{h.label}</option>)}
            </select>
          </label>
        </>
      )}
      {FIELDS[kind].map((spec) => <Input key={spec.name} spec={spec} defaultValue={initial?.[spec.name]} invalid={state?.field === spec.name} />)}
      <div className="flex flex-wrap items-center gap-4 md:col-span-2">
        <button disabled={pending} className={button}>{pending ? "Saving…" : applicationId ? "Save changes" : "Save and continue"}</button>
        <Message state={state} />
      </div>
    </form>
  );
}

export function DocumentUpload({ applicationId, types }: { applicationId: string; types: readonly DocType[] }) {
  const [state, action, pending] = useActionState<ApplyState, FormData>(uploadDocument, null);
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => { if (state?.notice) formRef.current?.reset(); }, [state]);
  return (
    <form ref={formRef} action={action} className="flex flex-col gap-4" aria-busy={pending}>
      <input type="hidden" name="application_id" value={applicationId} />
      <label className="flex flex-col gap-1"><span className="label text-dust">Document</span>
        <select name="doc_type" required className={field} defaultValue={types[0]}>
          {types.map((t) => <option key={t} value={t}>{DOC_LABEL[t]}</option>)}
        </select>
      </label>
      <label className="flex flex-col gap-1"><span className="label text-dust">File (PDF, JPEG, PNG or WebP, up to 10 MB)</span>
        <input name="file" type="file" required accept="application/pdf,image/jpeg,image/png,image/webp" className="t-ui text-sm text-sand file:label file:mr-4 file:border file:border-line file:bg-transparent file:px-4 file:py-2 file:text-bone" />
      </label>
      <div className="flex flex-wrap items-center gap-4">
        <button disabled={pending} className={button}>{pending ? "Uploading…" : "Upload"}</button>
        <Message state={state} />
      </div>
    </form>
  );
}

export function SubmitForm({ applicationId, kind }: { applicationId: string; kind: ApplicationKind }) {
  const [state, action, pending] = useActionState<ApplyState, FormData>(submitApplication, null);
  const consent = kind === "cadet"
    ? "I am the child's parent or legal guardian. I consent to the academy processing the details and documents in this application to assess the enrolment, to contact me about it, and to keep them for as long as the application or enrolment needs. I can withdraw this consent by writing to the academy."
    : "I consent to the academy processing the details and documents in this application to assess it and to contact me about it, and to keep them for as long as the application needs. I can withdraw this consent by writing to the academy.";
  return (
    <form action={action} className="flex flex-col gap-4" aria-busy={pending}>
      <input type="hidden" name="application_id" value={applicationId} />
      <label className="flex items-start gap-3">
        <input type="checkbox" name="consent" required className="mt-1 h-5 w-5 shrink-0 accent-[var(--color-gold)]" />
        <span className="t-ui text-sm leading-relaxed text-sand">{consent} <a href="/privacy" className="text-gold underline underline-offset-4">Privacy notice</a>.</span>
      </label>
      <div className="flex flex-wrap items-center gap-4">
        <button disabled={pending} className={button}>{pending ? "Submitting…" : "Submit application"}</button>
        <Message state={state} />
      </div>
    </form>
  );
}

type RazorpayCtor = new (opts: Record<string, unknown>) => { open: () => void };

/** Pays the enrolment fee through Razorpay Checkout. Success here only shows a message; the webhook records the payment. */
export function PayButton({ applicationId, amountPaise }: { applicationId: string; amountPaise: number }) {
  const [state, action, pending] = useActionState<CheckoutState, FormData>(startPayment, null);
  const [note, setNote] = useState<string | null>(null);
  useEffect(() => {
    const order = state?.order;
    if (!order) return;
    const open = () => {
      const Razorpay = (window as unknown as { Razorpay?: RazorpayCtor }).Razorpay;
      if (!Razorpay) { setNote("The payment window could not load. Please try again."); return; }
      new Razorpay({
        key: order.keyId, order_id: order.id, amount: order.amount, currency: "INR", name: "Black Stallion Academy",
        description: `Enrolment fee · ${order.reference}`, prefill: { name: order.name, email: order.email },
        theme: { color: "#78472F" },
        handler: () => setNote("Thank you. Your payment is being confirmed; this page will show it as paid within a minute or two."),
        modal: { ondismiss: () => setNote("The payment window was closed. Nothing was charged.") },
      }).open();
    };
    if ((window as unknown as { Razorpay?: unknown }).Razorpay) { open(); return; }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = open;
    script.onerror = () => setNote("The payment window could not load. Please try again.");
    document.body.appendChild(script);
  }, [state]);
  return (
    <form action={action} className="flex flex-col gap-3" aria-busy={pending}>
      <input type="hidden" name="application_id" value={applicationId} />
      <div className="flex flex-wrap items-center gap-4">
        <button disabled={pending} className={button}>{pending ? "Preparing…" : `Pay ${rupees(amountPaise)}`}</button>
        <Message state={state} />
      </div>
      {note && <p role="status" className="t-ui text-sm text-gold">{note}</p>}
    </form>
  );
}
