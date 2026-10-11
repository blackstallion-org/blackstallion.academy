"use client";

import { useActionState, useId } from "react";
import { submitLead, type LeadState } from "@/app/actions";
import { SealStamp } from "@/components/motion/SealStamp";
import { cn } from "@/lib/utils";

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
};

const todayISO = () => new Date().toISOString().slice(0, 10);

/**
 * Every enquiry form on the site. Validated on the server (app/actions.ts) with inline errors.
 * The brass seal appears only when the submission was actually delivered; if online submission is
 * not configured or fails, the form says so plainly, keeps what was typed, and offers email instead.
 */
export function LeadForm({ gate, fields, submitLabel = "Send", hidden, fallbackEmail, className }: Props) {
  const id = useId();
  const [state, action, pending] = useActionState<LeadState, FormData>(submitLead, null);

  if (state?.ok && state.status === "sent") {
    return (
      <div className={cn("flex flex-col items-start gap-6", className)} role="status">
        <SealStamp label="RECEIVED" trigger="manual" play className="h-28 w-28" />
        <p className="t-story text-bone">{state.message}</p>
      </div>
    );
  }

  const v = state?.values ?? {};
  const unsent = state && (state.status === "not_configured" || state.status === "failed");

  return (
    <form
      // remount after each response so every field (selects included) is re-seeded with what was typed
      key={state ? `${state.status}:${JSON.stringify(v)}` : "fresh"}
      action={action}
      className={cn("grid gap-x-8 gap-y-6 sm:grid-cols-2", className)}
      noValidate
      aria-describedby={`${id}-privacy`}
    >
      <input type="hidden" name="gate" value={gate} />
      {/* honeypot: hidden from people and assistive tech */}
      <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />
      {hidden && Object.entries(hidden).map(([k, val]) => <input key={k} type="hidden" name={k} value={val} />)}

      {unsent && (
        <div role="alert" className="border border-blood/60 bg-night p-4 sm:col-span-2">
          <p className="label text-blood">{state.status === "failed" ? "Not sent" : "Not sent · online submission not connected"}</p>
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
          autoComplete: f.autoComplete,
          defaultValue: v[f.name] ?? "",
          "aria-required": f.required || undefined,
          "aria-invalid": err ? true : undefined,
          "aria-describedby": err ? `${fid}-err` : f.hint ? `${fid}-hint` : undefined,
          className: cn("field", err && "border-blood"),
        };
        return (
          <div key={f.name} className={cn("flex flex-col gap-1", (f.wide || f.type === "textarea") && "sm:col-span-2")}>
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
              <input {...common} type={f.type ?? "text"} inputMode={f.type === "tel" ? "tel" : undefined} />
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
      <div className="flex flex-col gap-3 sm:col-span-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="t-ui text-xs text-dust" aria-live="polite">
          {state?.status === "invalid" ? <span className="text-blood">{state.message}</span> : <span>Fields marked * are required.</span>}
          <p id={`${id}-privacy`} className="mt-1">
            Privacy: these details are used only to reply to this enquiry and are never sold or shared. Do not include medical or payment information.
          </p>
        </div>
        <button type="submit" disabled={pending} aria-disabled={pending} className="label shrink-0 bg-gold px-6 py-4 uppercase text-night transition-colors hover:bg-bone disabled:opacity-60">
          {pending ? "Sending…" : submitLabel}
        </button>
      </div>
    </form>
  );
}
