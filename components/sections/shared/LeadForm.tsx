"use client";

import Link from "next/link";
import { useActionState, useEffect, useId, useRef, useState } from "react";
import { submitLead, type LeadState } from "@/app/actions";
import { SealStamp } from "@/components/motion/SealStamp";
import { clearLeadKey, LeadFormExtras } from "@/components/sections/shared/LeadFormExtras";
import { cn } from "@/lib/utils";
import wizardStyles from "./LeadFormWizard.module.css";

export type Field = {
  name: string;
  label: string;
  type?: "text" | "email" | "tel" | "textarea" | "select" | "date";
  options?: string[];
  /** Grouped options for long selects (rendered as <optgroup>). */
  groups?: { label: string; options: string[] }[];
  required?: boolean;
  autoComplete?: string;
  wide?: boolean;
  hint?: string;
};

type Props = {
  gate: "parents" | "schools" | "audit" | "partners" | "hub" | "mou";
  fields: Field[];
  submitLabel?: string;
  hidden?: Record<string, string>;
  /** Address offered when online submission is unavailable. */
  fallbackEmail?: string;
  className?: string;
  steps?: { title: string; description: string; fields: string[] }[];
};

const todayISO = () => new Date().toISOString().slice(0, 10);

/**
 * Every enquiry form on the site. Validated on the server (app/actions.ts) with inline errors.
 * The brass seal appears only when the submission was actually delivered; if online submission is
 * not configured or fails, the form says so plainly, keeps what was typed, and offers email instead.
 */
export function LeadForm({ gate, fields, submitLabel = "Send", hidden, fallbackEmail, className, steps }: Props) {
  const id = useId();
  const [state, action, pending] = useActionState<LeadState, FormData>(submitLead, null);
  const formRef = useRef<HTMLFormElement>(null);
  const submitLock = useRef(false);
  const [step, setStep] = useState(0);
  const [review, setReview] = useState<Record<string, string>>({});
  const currentStep = steps?.[step];
  const lastStep = !steps || step === steps.length - 1;
  useEffect(() => { submitLock.current = false; }, [state]);
  useEffect(() => { if (state?.ok) clearLeadKey(gate); }, [state, gate]);
  useEffect(() => {
    if (!steps) return;
    const firstError = formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]');
    if (state?.status === "invalid" && firstError) firstError.focus({ preventScroll: true });
    else if (step > 0) formRef.current?.querySelector<HTMLElement>("h3")?.focus({ preventScroll: true });
  }, [step, steps, state]);

  useEffect(() => {
    if (!steps || state?.status !== "invalid" || !state.errors) return;
    const firstError = Object.keys(state.errors)[0];
    const next = steps.findIndex((item) => item.fields.includes(firstError));
    const frame = requestAnimationFrame(() => {
      if (next >= 0) setStep(next);
      setReview(state.values ?? {});
    });
    return () => cancelAnimationFrame(frame);
  }, [state, steps]);

  const advance = () => {
    const form = formRef.current;
    if (!form || !steps || lastStep) return;
    for (const name of currentStep?.fields ?? []) {
      const input = form.elements.namedItem(name);
      if ((input instanceof HTMLInputElement || input instanceof HTMLSelectElement || input instanceof HTMLTextAreaElement) && !input.reportValidity()) return;
    }
    setReview(Object.fromEntries(Array.from(new FormData(form).entries()).map(([name, value]) => [name, String(value)])));
    setStep((value) => Math.min(value + 1, steps.length - 1));
  };

  if (state?.ok && state.status === "sent") {
    return (
      <div className={cn("flex flex-col items-start gap-6", className)} role="status">
        <SealStamp label="RECEIVED" trigger="manual" play className="h-28 w-28" />
        <p className="t-story text-bone">{state.message}</p>
      </div>
    );
  }

  const v = state?.values ?? {};
  const unsent = state && (state.status === "not_configured" || state.status === "failed" || state.status === "rate_limited" || state.status === "blocked");

  return (
    <form
      // remount after each response so every field (selects included) is re-seeded with what was typed
      key={state ? `${state.status}:${JSON.stringify(v)}` : "fresh"}
      action={action}
      ref={formRef}
      onSubmit={(event) => {
        if (!lastStep) { event.preventDefault(); advance(); return; }
        if (submitLock.current || pending) { event.preventDefault(); return; }
        submitLock.current = true;
      }}
      className={cn("grid gap-x-8 gap-y-6 sm:grid-cols-2", steps && wizardStyles.form, className)}
      noValidate
      aria-describedby={`${id}-privacy`}
      aria-busy={pending}
    >
      <input type="hidden" name="gate" value={gate} />
      {steps && currentStep && <div className={wizardStyles.heading}>
        <div className={wizardStyles.progress}><span>Step {String(step + 1).padStart(2, "0")} / {String(steps.length).padStart(2, "0")}</span>
          <ol aria-label="Application progress">{steps.map((item, index) => <li key={item.title} aria-current={index === step ? "step" : undefined} data-complete={index <= step}><span className="sr-only">{item.title}</span></li>)}</ol>
        </div>
        <h3 tabIndex={-1}>{currentStep.title}</h3><p>{currentStep.description}</p>
      </div>}
      {/* honeypot: hidden from people and assistive tech */}
      <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />
      {hidden && Object.entries(hidden).map(([k, val]) => <input key={k} type="hidden" name={k} value={val} />)}

      {unsent && (
        <div role="alert" className="border border-blood/60 bg-night p-4 sm:col-span-2">
          <p className="label text-blood">{state.status === "not_configured" ? "Not sent · online submission not connected" : state.status === "rate_limited" ? "Not sent · too many attempts" : "Not sent"}</p>
          <p className="mt-2 text-sm text-sand">{state.message}</p>
          {fallbackEmail && (
            <a href={`mailto:${fallbackEmail}`} className="label mt-3 inline-block text-gold hover:text-bone">
              Email {fallbackEmail} →
            </a>
          )}
        </div>
      )}

      {fields.map((f) => {
        const fid = `${id}-${f.name}`;
        const err = state?.errors?.[f.name];
        const common = {
          id: fid,
          name: f.name,
          required: f.required,
          autoComplete: f.autoComplete ?? (f.type === "email" ? "email" : f.type === "tel" ? "tel" : undefined),
          defaultValue: v[f.name] ?? "",
          "aria-required": f.required || undefined,
          "aria-invalid": err ? true : undefined,
          "aria-describedby": err ? `${fid}-err` : f.hint ? `${fid}-hint` : undefined,
          className: cn("field", err && "border-blood"),
        };
        return (
          <div key={f.name} data-lead-field={f.name} hidden={Boolean(steps && !currentStep?.fields.includes(f.name))} className={cn("flex flex-col gap-1", (f.wide || f.type === "textarea") && "sm:col-span-2")}>
            <label htmlFor={fid} className="label text-dust">
              {f.label}
              {f.required && (
                <span className="ml-1 text-brass" aria-hidden>
                  *
                </span>
              )}
            </label>
            {f.type === "textarea" ? (
              <textarea {...common} rows={4} />
            ) : f.type === "select" ? (
              <select {...common}>
                <option value="" disabled>
                  Choose…
                </option>
                {f.options?.map((o) => (
                  <option key={o}>{o}</option>
                ))}
                {f.groups?.map((g) => (
                  <optgroup key={g.label} label={g.label}>
                    {g.options.map((o) => (
                      <option key={o}>{o}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            ) : f.type === "date" ? (
              <input {...common} type="date" min={todayISO()} />
            ) : (
              <input {...common} type={f.type ?? "text"} inputMode={f.type === "tel" ? "tel" : f.type === "email" ? "email" : undefined} />
            )}
            {f.hint && !err && (
              <p id={`${fid}-hint`} className="t-ui text-xs text-dust">
                {f.hint}
              </p>
            )}
            {err && (
              <p id={`${fid}-err`} className="t-ui text-xs text-blood">
                {err}
              </p>
            )}
          </div>
        );
      })}
      <div hidden={!lastStep} className="sm:col-span-2"><LeadFormExtras gate={gate} hub={hidden?.hub} error={state?.errors?.consent} /></div>
      {steps && lastStep && <dl className={wizardStyles.review} aria-label="Application review">{fields.map((field) => <div key={field.name}><dt>{field.label}</dt><dd>{review[field.name] || "Not provided"}</dd></div>)}</dl>}
      <div className="flex flex-col gap-3 sm:col-span-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="t-ui text-xs text-dust" aria-live="polite">
          {state?.status === "invalid" ? <span className="text-blood">{state.message}</span> : <span>Fields marked * are required.</span>}
          <p id={`${id}-privacy`} className="mt-1">
            Privacy: these details are used only to reply to this enquiry and are never sold or shared. Do not include medical or payment information.{" "}
            <Link href="/privacy" className="underline decoration-line underline-offset-2 hover:text-bone">
              Privacy notice
            </Link>
          </p>
        </div>
        {steps && step > 0 && <button type="button" onClick={() => setStep((value) => value - 1)} disabled={pending} className={wizardStyles.back}>Back</button>}
        {!lastStep ? <button key="advance" type="button" onClick={(event) => { event.preventDefault(); advance(); }} className={wizardStyles.continue}>Continue <span aria-hidden>→</span></button> : <button key="submit" type="submit" disabled={pending} aria-disabled={pending} className="label shrink-0 bg-gold px-6 py-4 uppercase text-night transition-colors hover:bg-bone disabled:opacity-60">
          {pending && <span aria-hidden className="mr-2 inline-block h-3 w-3 animate-spin rounded-full border border-current border-t-transparent" />}
          {pending ? "Sending…" : submitLabel}
        </button>}
      </div>
    </form>
  );
}
