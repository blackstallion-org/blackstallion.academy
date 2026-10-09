"use client";

import { useActionState, useEffect, useState } from "react";
import { submitLead, type LeadState } from "@/app/actions";
import { SealStamp } from "@/components/motion/SealStamp";
import { tiers, type TierId } from "@/lib/content/schools";
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

const blank = (v: string, fallback: string) => (v.trim() ? v : fallback);

/**
 * S-MOU: the form on the left writes a draft MOU on the right as you type.
 * "Print / save as PDF" uses the print stylesheet. Submitting sends the request (mou_proposals later).
 */
export function MouGenerator() {
  const [d, setD] = useState<Draft>({ school: "", city: "Hyderabad", trustee: "", designation: "", email: "", phone: "", land: "", tier: "standard", cadets: "150" });
  const [state, action, pending] = useActionState<LeadState, FormData>(submitLead, null);
  const tier = tiers.find((t) => t.id === d.tier)!;
  const [today, setToday] = useState("");
  useEffect(() => {
    const id = window.requestAnimationFrame(() => setToday(new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })));
    return () => window.cancelAnimationFrame(id);
  }, []);
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
      <form action={action} className="no-print flex min-w-0 flex-col gap-6">
        <input type="hidden" name="gate" value="mou" />
        <input type="hidden" name="name" value={d.trustee} />
        <input type="hidden" name="organisation" value={d.school} />
        <input type="hidden" name="message" value={`Tier ${tier.name}; land ${d.land} acres; ${d.cadets} cadets; ${d.city}`} />
        <div className="grid gap-6 sm:grid-cols-2">
          {fields.map(([k, label, type]) => (
            <div key={k} className="flex flex-col gap-1">
              <label htmlFor={`mou-${k}`} className="label text-dust">
                {label}
              </label>
              <input id={`mou-${k}`} name={k === "email" || k === "phone" ? k : undefined} type={type} value={d[k]} onChange={set(k)} className={cn("field", state?.errors?.[k] && "border-blood")} />
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
            <button type="button" onClick={() => window.print()} className="label border border-brass/45 px-6 py-4 text-bone hover:border-gold hover:text-gold">
              Print / save as PDF
            </button>
            {state && !state.ok && <p className="t-ui w-full text-sm text-blood">{state.message}</p>}
          </div>
        )}
      </form>

      <article aria-label="Draft memorandum of understanding" className="parchment print-doc min-w-0 break-words px-6 py-10 text-[0.95rem] leading-relaxed md:px-12 md:py-14">
        <p className="label text-center text-blood">Draft for discussion · not a binding document</p>
        <h2 className="t-inscribe mt-4 text-center text-2xl text-ink">Memorandum of Understanding</h2>
        <p className="mt-1 text-center text-sm text-[#5a4526]">{today}</p>
        <div className="mt-8 flex flex-col gap-4 text-ink/90">
          <p>
            This memorandum is made between <strong>{blank(d.school, "[School name]")}</strong>, {blank(d.city, "[City]")} (&ldquo;the School&rdquo;), represented by{" "}
            {blank(d.trustee, "[Trustee]")}
            {d.designation ? `, ${d.designation}` : ""}, and The Black Stallion Academy of Horsemanship Pvt Ltd (&ldquo;BSAH&rdquo;), a company of Vicarius Infinitum Holdings Pvt Ltd.
          </p>
          <p>
            <strong>1. Scope.</strong> BSAH will design the equestrian hub, supervise its construction to the <strong>{tier.name}</strong> specification ({tier.includes.join(", ")}) on approximately{" "}
            {blank(d.land, "[ ]")} acres of School land, and operate it.
          </p>
          <p>
            <strong>2. The School.</strong> Funds construction (indicative capital {tier.capexLabel}), provides land, access and utilities, and promotes the programme to its students.
          </p>
          <p>
            <strong>3. BSAH.</strong> Provides stallions, ex-cavalry faculty, veterinary care, group accident insurance for every active cadet, admissions, billing and the parent app.
          </p>
          <p>
            <strong>4. Revenue share.</strong> BSAH pays the School 25–30% of gross tuition each month, for an expected {blank(d.cadets, "[ ]")} cadets at full enrolment.
          </p>
          <p>
            <strong>5. Term and governance.</strong> Five years, renewable (sample term). The hub follows the rules of the School Tent Pegging Council of India and may host STPCI fixtures.
          </p>
        </div>
        <div className="mt-12 grid grid-cols-2 gap-8 text-sm">
          <div className="border-t border-ink/40 pt-2">
            <p className="text-ink">{blank(d.trustee, "For the School")}</p>
            <p className="text-[#5a4526]">{blank(d.school, "School")}</p>
          </div>
          <div className="border-t border-ink/40 pt-2">
            <p className="text-ink">For BSAH</p>
            <p className="text-[#5a4526]">Office of the Executive Chairman</p>
          </div>
        </div>
        <p className="font-mono mt-10 text-center text-[0.65rem] text-[#6b5130]">
          CONTACT · {d.email || "email"} · {d.phone || "phone"}
        </p>
      </article>
    </div>
  );
}
