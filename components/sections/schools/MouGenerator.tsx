"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { submitLead, type LeadState } from "@/app/actions";
import { clearLeadKey, LeadFormExtras } from "@/components/sections/shared/LeadFormExtras";
import { SealStamp } from "@/components/motion/SealStamp";
import { tiers, type TierId } from "@/lib/content/schools";
import { mouDraft } from "@/lib/content/mou";
import { downloadMouPdf } from "@/app/schools/mou/actions";
import { cn } from "@/lib/utils";

type Draft = {
  school: string;
  city: string;
  trustee: string;
  designation: string;
  email: string;
  phone: string;
  land: string;
  tier: TierId;
  cadets: string;
};


/**
 * S-MOU: the form on the left writes a draft MOU on the right as you type.
 * "Print / save as PDF" uses the print stylesheet. Submitting sends the request (mou_proposals later).
 */
export function MouGenerator() {
  const [d, setD] = useState<Draft>({ school: "", city: "Hyderabad", trustee: "", designation: "", email: "", phone: "", land: "", tier: "standard", cadets: "150" });
  const [state, action, pending] = useActionState<LeadState, FormData>(submitLead, null);
  useEffect(() => { if (state?.ok) clearLeadKey("mou"); }, [state]);
  const tier = tiers.find((t) => t.id === d.tier)!;
  const [today, setToday] = useState("");
  useEffect(() => {
    const id = window.requestAnimationFrame(() => setToday(new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })));
    return () => window.cancelAnimationFrame(id);
  }, []);
  const [pdfPending, startPdf] = useTransition();
  const [pdfError, setPdfError] = useState<string | null>(null);
  const draft = mouDraft(d);
  const downloadPdf = () =>
    startPdf(async () => {
      setPdfError(null);
      const res = await downloadMouPdf(d);
      if (!res.ok) { setPdfError(res.error); return; }
      const bin = atob(res.base64);
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      const url = URL.createObjectURL(new Blob([bytes], { type: "application/pdf" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = res.filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 10_000);
    });
  const set = (k: keyof Draft) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setD({ ...d, [k]: e.target.value });

  const fields: [keyof Draft, string, string?][] = [
    ["school", "School name", "text"],
    ["city", "City", "text"],
    ["trustee", "Trustee / principal", "text"],
    ["designation", "Designation", "text"],
    ["email", "Email", "email"],
    ["phone", "Phone", "tel"],
    ["land", "Available land (acres)", "text"],
    ["cadets", "Expected cadets", "text"],
  ];

  return (
    <div className="grid gap-12 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
      <form action={action} aria-busy={pending} className="no-print flex min-w-0 flex-col gap-6">
        <input type="hidden" name="gate" value="mou" />
        <input type="hidden" name="name" value={d.trustee} />
        <input type="hidden" name="organisation" value={d.school} />
        <input type="hidden" name="message" value={`Tier ${tier.name}; land ${d.land} acres; ${d.cadets} cadets; ${d.city}`} />
        {/* The structured draft travels with the request so the office receives the same PDF the trustee saw. */}
        <input type="hidden" name="mou_city" value={d.city} />
        <input type="hidden" name="mou_designation" value={d.designation} />
        <input type="hidden" name="mou_land" value={d.land} />
        <input type="hidden" name="mou_tier" value={d.tier} />
        <input type="hidden" name="mou_cadets" value={d.cadets} />
        <div className="grid gap-6 sm:grid-cols-2">
          {fields.map(([k, label, type]) => (
            <div key={k} className="flex flex-col gap-1">
              <label htmlFor={`mou-${k}`} className="label text-dust">
                {label}
              </label>
              <input id={`mou-${k}`} name={k === "email" || k === "phone" ? k : undefined} type={type} required={k === "school" || k === "trustee" || k === "email"} autoComplete={k === "email" ? "email" : k === "phone" ? "tel" : k === "trustee" ? "name" : k === "school" ? "organization" : undefined} inputMode={k === "cadets" ? "numeric" : k === "land" ? "decimal" : undefined} value={d[k]} onChange={set(k)} aria-invalid={Boolean(state?.errors?.[k === "trustee" ? "name" : k === "school" ? "organisation" : k])} className={cn("field", state?.errors?.[k] && "border-blood")} />
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="mou-tier" className="label text-dust">
            Tier
          </label>
          <select id="mou-tier" value={d.tier} onChange={set("tier")} className="field">
            {tiers.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} · {t.capexLabel}
              </option>
            ))}
          </select>
        </div>
        {!state?.ok && <LeadFormExtras gate="mou" error={state?.errors?.consent} />}
        {state?.ok ? (
          <div className="flex items-center gap-6" role="status">
            <SealStamp label="RECEIVED" trigger="manual" play className="h-24 w-24" />
            <p className="text-bone">{state.message}</p>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-3">
            <button type="submit" disabled={pending} className="label bg-gold px-6 py-4 text-night hover:bg-bone disabled:opacity-60">
              {pending ? "Sealing…" : "Send to the BSAH board office"}
            </button>
            <button type="button" onClick={downloadPdf} disabled={pdfPending} className="label border border-line/45 px-6 py-4 text-bone hover:border-gold hover:text-gold disabled:opacity-60">
              {pdfPending ? "Preparing PDF…" : "Download PDF"}
            </button>
            <button type="button" onClick={() => window.print()} className="label px-2 py-4 text-sand underline decoration-line underline-offset-4 hover:text-gold">
              Print
            </button>
            {pdfError && <p role="alert" className="t-ui w-full text-sm text-blood">{pdfError}</p>}
            {state && !state.ok && <div role="alert" className="t-ui w-full text-sm text-blood"><p>{state.message}</p>{state.errors && <ul className="mt-2">{Object.values(state.errors).map((error) => <li key={error}>{error}</li>)}</ul>}<a className="mt-3 inline-block underline" href="mailto:boards@blackstallion.academy">Email the board office</a></div>}
          </div>
        )}
      </form>

      <article aria-label="Draft memorandum of understanding" className="parchment print-doc min-w-0 break-words px-6 py-10 text-[0.95rem] leading-relaxed md:px-12 md:py-14">
        <p className="label text-center text-blood">{draft.banner}</p>
        <h2 className="t-inscribe mt-4 text-center text-2xl text-ink">{draft.title}</h2>
        <p className="mt-1 text-center text-sm text-[#5a4526]">{today}</p>
        <div className="mt-8 flex flex-col gap-4 text-ink/90">
          {draft.paragraphs.map((p, i) => (
            <p key={i}>
              {p.lead && <><strong>{p.lead}</strong> </>}
              {p.strong?.length ? emphasise(p.text, p.strong) : p.text}
            </p>
          ))}
        </div>
        <div className="mt-12 grid grid-cols-2 gap-8 text-sm">
          {draft.signatories.map((s) => (
            <div key={s.name + s.org} className="border-t border-ink/40 pt-2">
              <p className="text-ink">{s.name}</p>
              <p className="text-[#5a4526]">{s.org}</p>
            </div>
          ))}
        </div>
        <p className="font-mono mt-10 text-center text-[0.65rem] text-[#6b5130]">{draft.contact}</p>
      </article>
    </div>
  );
}

/** Bold the given phrases inside a paragraph (school and tier names), as in the printed draft. */
function emphasise(text: string, phrases: string[]) {
  const parts: (string | React.ReactElement)[] = [];
  let rest = text;
  let key = 0;
  for (const phrase of phrases) {
    const at = rest.indexOf(phrase);
    if (at < 0) continue;
    parts.push(rest.slice(0, at), <strong key={key++}>{phrase}</strong>);
    rest = rest.slice(at + phrase.length);
  }
  parts.push(rest);
  return parts;
}
