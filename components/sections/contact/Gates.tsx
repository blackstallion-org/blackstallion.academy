"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { FilmImage } from "@/components/film/FilmImage";
import { Headline } from "@/components/film/Headline";
import { ReelMark } from "@/components/film/Marks";
import { LeadForm, type Field } from "@/components/sections/shared/LeadForm";
import { ease } from "@/lib/motion/tokens";
import { cn } from "@/lib/utils";
import { priceLabel } from "@/lib/content/pricing";
import { network } from "@/lib/content/schools";

/** Title card · T16 gate. Signature: two gate halves part to reveal the page. */
export function GateTitle() {
  return (
    <section aria-labelledby="gate-h" className="relative min-h-[92svh] overflow-hidden">
      <FilmImage name="contactGate" priority />
      <div aria-hidden className="absolute inset-0 shade-b" />
      <motion.div aria-hidden className="absolute inset-y-0 left-0 w-1/2 border-r border-line bg-[linear-gradient(90deg,#0F0E0D,#1A1A18)]" initial={{ x: "0%" }} animate={{ x: "-100%" }} transition={{ duration: 1.8, ease: ease.inOut, delay: 0.3 }} />
      <motion.div aria-hidden className="absolute inset-y-0 right-0 w-1/2 border-l border-line bg-[linear-gradient(270deg,#0F0E0D,#1A1A18)]" initial={{ x: "0%" }} animate={{ x: "100%" }} transition={{ duration: 1.8, ease: ease.inOut, delay: 0.3 }} />
      <div className="gutter relative flex min-h-[92svh] flex-col justify-end pb-[10vh]">
        <ReelMark n={15} act="ledger" />
        <Headline id="gate-h" as="h1" size="poster" animate="mount" delay={1.2} className="mt-6" inscription="The arena" voice="is open." />
        <p className="t-story mt-6 text-sand">Three corridors. Choose yours.</p>
      </div>
    </section>
  );
}

type GateId = "parents" | "schools" | "audit";

/** Target regional zones (Pan-India Directive): all 17 corridor codes, grouped by circuit. Proposed corridors, not operating campuses. */
const zoneGroups = network.map((z) => ({
  label: `Zone ${z.code} · ${z.name}`,
  options: z.subzones.map((s) => `${s.code} · ${s.name}`),
}));

/** Onboarding gate logic (Directive 04 §4 / Master Directive Layer 16). Headers, fields and buttons as specified. */
const gates: { id: GateId; title: string; header: string; sub: string; line: string; pricing?: string[]; email: string; fields: Field[]; submit: string }[] = [
  {
    id: "parents",
    title: "Enrol a cadet",
    header: "Enrol a Cadet",
    sub: "Sovereign Character Academy",
    line: "Cadet enrolment portal for parents and guardians.",
    pricing: [`Core Cadets: ${priceLabel.core} per month`, `Sovereign Elite: ${priceLabel.elite} per month`, `One-Time Kit: ${priceLabel.kit}`],
    email: "parents@blackstallion.academy",
    submit: "SUBMIT CADET APPLICATION",
    fields: [
      { name: "name", label: "Parent / Guardian Name", required: true, autoComplete: "name" },
      { name: "student", label: "Student Name & Age", required: true, hint: "e.g. Aarav, 11" },
      { name: "zone", label: "Target Regional Zone", type: "select", groups: zoneGroups, required: true, wide: true },
      { name: "tier", label: "Preferred Tier", type: "select", required: true, wide: true, options: [`Core Cadets · ${priceLabel.core} / month`, `Sovereign Elite · ${priceLabel.elite} / month`] },
      { name: "email", label: "Email", type: "email", autoComplete: "email", hint: "Email or phone required" },
      { name: "phone", label: "Phone", type: "tel", autoComplete: "tel" },
      { name: "message", label: "Questions", type: "textarea" },
    ],
  },
  {
    id: "schools",
    title: "Partner your campus",
    header: "Partner Your Campus",
    sub: "Zero CapEx Infrastructure",
    line: "Campus partnership portal. Proposed model: BSAH funds, builds and operates; the school earns 25–30% under a signed agreement.",
    email: "boards@blackstallion.academy",
    submit: "REQUEST CAMPUS BLUEPRINT",
    fields: [
      { name: "name", label: "Trustee / Principal Name", required: true, autoComplete: "name" },
      { name: "organisation", label: "Institution Name & Location", required: true, autoComplete: "organization", wide: true },
      { name: "acreage", label: "Acreage", type: "select", required: true, options: ["0.5 Acres", "1.0 Acres", "1.5+ Acres"] },
      { name: "capacity", label: "Student Capacity", type: "select", required: true, options: ["100–150", "200–300", "300+"] },
      { name: "email", label: "Official Email", type: "email", required: true, autoComplete: "email" },
      { name: "phone", label: "Official Phone", type: "tel", required: true, autoComplete: "tel" },
      { name: "message", label: "Anything we should know", type: "textarea" },
    ],
  },
  {
    id: "audit",
    title: "Schedule a board audit",
    header: "Schedule a Board Audit",
    sub: "Formal Institutional Presentation",
    line: "Executive board audit: a formal institutional presentation to your board, on your campus or ours.",
    email: "boards@blackstallion.academy",
    submit: "CONFIRM BOARD AUDIT",
    fields: [
      { name: "name", label: "Board Member Name", required: true, autoComplete: "name" },
      { name: "designation", label: "Designation", required: true },
      { name: "organisation", label: "Target Campus / Circuit", required: true, autoComplete: "organization", wide: true },
      { name: "date", label: "Proposed Audit Date", type: "date", required: true },
      { name: "slot", label: "Proposed Audit Slot", type: "select", required: true, options: ["Morning · 09:00 AM–12:00 PM", "Afternoon · 02:00 PM–05:00 PM"] },
      { name: "email", label: "Email", type: "email", required: true, autoComplete: "email" },
      { name: "phone", label: "Phone", type: "tel", autoComplete: "tel" },
    ],
  },
];

/** §1 · S60 three gates. Signature: choosing an arch lights it and opens its form beneath. */
export function Gates() {
  const [gate, setGate] = useState<GateId>("parents");

  useEffect(() => {
    const g = new URLSearchParams(window.location.search).get("gate");
    const id = window.requestAnimationFrame(() => {
      if (g === "parents" || g === "schools" || g === "audit") setGate(g);
      else if (g === "partners") setGate("schools");
    });
    return () => window.cancelAnimationFrame(id);
  }, []);

  const g = gates.find((x) => x.id === gate)!;

  const choose = (next: GateId) => {
    setGate(next);
    try {
      const url = new URL(window.location.href);
      url.searchParams.set("gate", next);
      window.history.replaceState(window.history.state, "", url);
    } catch {
      /* ignore */
    }
  };

  return (
    <section aria-labelledby="gates-h" className="gutter relative py-[clamp(6rem,14vh,12rem)]">
      <h2 id="gates-h" className="sr-only">
        Choose a corridor
      </h2>
      <div className="grid gap-4 md:grid-cols-3" role="radiogroup" aria-label="Corridor">
        {gates.map((x, i) => (
          <button
            key={x.id}
            type="button"
            role="radio"
            aria-checked={gate === x.id}
            onClick={() => choose(x.id)}
            className={cn(
              "group relative flex min-h-[16rem] flex-col justify-end overflow-hidden rounded-t-[999px] border p-6 pt-24 text-left transition-colors duration-500 md:min-h-[22rem]",
              gate === x.id ? "border-gold bg-gradient-to-b from-ember/40 to-ember/90" : "border-line hover:border-line/60",
            )}
          >
            <span className="font-mono absolute left-1/2 top-10 -translate-x-1/2 text-xs text-dust">0{i + 1}</span>
            <span className={cn("t-voice text-3xl transition-colors", gate === x.id ? "text-gold" : "text-bone")}>{x.title}</span>
            <span className="mt-3 text-sand">{x.line}</span>
            <span className="t-ui mt-4 text-xs text-dust">{x.email}</span>
          </button>
        ))}
      </div>

      <div className="mt-14 grid gap-12 lg:grid-cols-[minmax(0,0.6fr)_minmax(0,1.4fr)]">
        <div>
          <p className="label text-brass">Gate 0{gates.findIndex((x) => x.id === gate) + 1}</p>
          <h3 className="t-voice mt-2 text-display-3 text-bone">
            {g.header} <span className="text-dust">|</span> <span className="text-gold">{g.sub}</span>
          </h3>
          <p className="t-ui mt-4 text-sm text-sand">{g.line}</p>
          {g.pricing && (
            <ul className="mt-6 border-t border-line">
              {g.pricing.map((p) => (
                <li key={p} className="font-mono border-b border-line py-2 text-sm text-sand">
                  {p}
                </li>
              ))}
              <li className="t-ui py-2 text-xs text-dust">Published prices, subject to confirmation at enrolment.</li>
            </ul>
          )}
          <p className="t-ui mt-4 text-sm text-dust">
            Or write to{" "}
            <a href={`mailto:${g.email}`} className="text-gold hover:text-bone">
              {g.email}
            </a>
          </p>
        </div>
        <AnimatePresence mode="wait">
          <motion.div key={gate} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.45, ease: ease.citadel }}>
            <LeadForm gate={g.id} fields={g.fields} submitLabel={g.submit} fallbackEmail={g.email} />
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
