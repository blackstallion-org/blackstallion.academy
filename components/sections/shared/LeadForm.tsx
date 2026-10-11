"use client";

import { useActionState, useId } from "react";
import { submitLead, type LeadState } from "@/app/actions";
import { SealStamp } from "@/components/motion/SealStamp";
import { cn } from "@/lib/utils";

export type Field = {
  name: string;
  label: string;
  type?: "text" | "email" | "tel" | "textarea" | "select";
  options?: string[];
  required?: boolean;
  autoComplete?: string;
  wide?: boolean;
};

type Props = {
  gate: "parents" | "schools" | "audit" | "partners" | "hub" | "mou";
  fields: Field[];
  submitLabel?: string;
  hidden?: Record<string, string>;
  className?: string;
};

/**
 * Every enquiry form on the site. Server-validated (app/actions.ts); success stamps the brass seal.
 * Fields named name/email/phone/organisation/message are validated; others travel along as context.
 */
export function LeadForm({ gate, fields, submitLabel = "Send", hidden, className }: Props) {
  const id = useId();
  const [state, action, pending] = useActionState<LeadState, FormData>(submitLead, null);

  if (state?.ok) {
    return (
      <div className={cn("flex flex-col items-start gap-6", className)} role="status">
        <SealStamp label="PREVIEW" trigger="manual" play className="h-28 w-28" />
        <p className="t-story text-bone">{state.message}</p>
      </div>
    );
  }

  return (
    <form action={action} className={cn("grid gap-x-8 gap-y-6 sm:grid-cols-2", className)} noValidate>
      <input type="hidden" name="gate" value={gate} />
      {hidden && Object.entries(hidden).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
      {fields.map((f) => {
        const fid = `${id}-${f.name}`;
        const err = state?.errors?.[f.name];
        const common = {
          id: fid,
          name: f.name,
          required: f.required,
          autoComplete: f.autoComplete,
          "aria-invalid": err ? true : undefined,
          "aria-describedby": err ? `${fid}-err` : undefined,
          className: cn("field", err && "border-blood"),
        };
        return (
          <div key={f.name} className={cn("flex flex-col gap-1", (f.wide || f.type === "textarea") && "sm:col-span-2")}>
            <label htmlFor={fid} className="label text-dust">
              {f.label}
              {f.required && <span className="ml-1 text-dust">*</span>}
            </label>
            {f.type === "textarea" ? (
              <textarea {...common} rows={4} />
            ) : f.type === "select" ? (
              <select {...common} defaultValue="">
                <option value="" disabled>
                  Choose…
                </option>
                {f.options?.map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </select>
            ) : (
              <input {...common} type={f.type ?? "text"} />
            )}
            {err && (
              <p id={`${fid}-err`} className="t-ui text-xs text-white">
                {err}
              </p>
            )}
          </div>
        );
      })}
      <div className="flex flex-col gap-3 sm:col-span-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="t-ui text-xs text-dust" aria-live="polite">
          {state && !state.ok ? <span className="text-white">{state.message}</span> : "Preview form: submissions are not saved yet. Please also email us directly."}
        </p>
        <button type="submit" disabled={pending} className="label bg-gold px-6 py-4 text-night transition-colors hover:bg-bone disabled:opacity-60">
          {pending ? "Sealing…" : submitLabel}
        </button>
      </div>
    </form>
  );
}
