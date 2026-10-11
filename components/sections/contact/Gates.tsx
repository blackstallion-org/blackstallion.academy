"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { FilmImage } from "@/components/film/FilmImage";
import { Headline } from "@/components/film/Headline";
import { ReelMark } from "@/components/film/Marks";
import { LeadForm, type Field } from "@/components/sections/shared/LeadForm";
import { ease } from "@/lib/motion/tokens";
import { cn } from "@/lib/utils";

/** Title card · T16 gate. Signature: two gate halves part to reveal the page. */
export function GateTitle() {
  return (
    <section aria-labelledby="gate-h" className="relative min-h-[92svh] overflow-hidden">
      <FilmImage name="contactGate" priority />
      <div aria-hidden className="absolute inset-0 shade-b" />
      <motion.div aria-hidden className="absolute inset-y-0 left-0 w-1/2 border-r border-brass/40 bg-[linear-gradient(90deg,#140d07,#2a1d12)]" initial={{ x: "0%" }} animate={{ x: "-100%" }} transition={{ duration: 1.8, ease: ease.inOut, delay: 0.3 }} />
      <motion.div aria-hidden className="absolute inset-y-0 right-0 w-1/2 border-l border-brass/40 bg-[linear-gradient(270deg,#140d07,#2a1d12)]" initial={{ x: "0%" }} animate={{ x: "100%" }} transition={{ duration: 1.8, ease: ease.inOut, delay: 0.3 }} />
      <div className="gutter relative flex min-h-[92svh] flex-col justify-end pb-[10vh]">
        <ReelMark n={15} act="ledger" />
        <Headline id="gate-h" as="h1" size="poster" animate="mount" delay={1.2} className="mt-6" inscription="The arena" voice="is open." />
        <p className="t-story mt-6 text-sand">Three corridors. Choose yours.</p>
      </div>
    </section>
  );
}

type GateId = "parents" | "schools" | "audit";

const zoneOptions = [
  "Zone 01 · Telangana & AP (Hyderabad)",
  "Zone 02 · NCR (Gurugram / Noida / Delhi)",
  "Zone 03 · Maharashtra & West (Mumbai / Pune)",
  "Zone 04 · Karnataka & South (Bengaluru / hills)",
  "Zone 05 · Northern heritage & boarding corridor",
  "Zone 06 · East & Centre (Kolkata / Indore / Bhopal)",
];

/** Onboarding gate logic per Directive 04 §4. */
const gates: { id: GateId; title: string; line: string; note?: string; email: string; fields: Field[]; submit: string }[] = [
  {
    id: "parents",
    title: "Enrol a cadet",
    line: "The Sovereign Character Academy: enrolment for parents and guardians.",
    note: "One-time onboarding kit ₹5,000 + GST (tunic, helmet, boots, Sovereign Passport).",
    email: "parents@blackstallion.academy",
    submit: "Submit cadet application",
    fields: [
      { name: "name", label: "Parent / guardian name", required: true, autoComplete: "name" },
      { name: "student", label: "Student name" },
      { name: "age", label: "Student age", type: "select", options: ["8–10", "11–13", "14–16", "17–18"] },
      { name: "zone", label: "Target regional zone", type: "select", options: zoneOptions, wide: true },
      { name: "tier", label: "Preferred tier", type: "select", options: ["Core Cadets · ₹8,500 + GST / month", "Sovereign Elite · ₹12,500 + GST / month"], wide: true },
      { name: "phone", label: "Phone", type: "tel", autoComplete: "tel" },
      { name: "email", label: "Email", type: "email", autoComplete: "email" },
      { name: "message", label: "Questions", type: "textarea" },
    ],
  },
  {
    id: "schools",
    title: "Partner your campus",
    line: "Zero-CapEx infrastructure: BSAH funds, builds and operates; your school earns 25–30%.",
    email: "boards@blackstallion.academy",
    submit: "Request campus blueprint",
    fields: [
      { name: "name", label: "Trustee / principal name", required: true, autoComplete: "name" },
      { name: "organisation", label: "Institution name", required: true, autoComplete: "organization" },
      { name: "city", label: "Institution location" },
      { name: "acreage", label: "Available acreage", type: "select", options: ["0.5 acre", "1.0 acre", "1.5+ acres"] },
      { name: "capacity", label: "Student capacity", type: "select", options: ["100–150", "200–300", "300+"] },
      { name: "email", label: "Official email", type: "email", autoComplete: "email" },
      { name: "phone", label: "Phone", type: "tel", autoComplete: "tel" },
      { name: "message", label: "Anything we should know", type: "textarea" },
    ],
  },
  {
    id: "audit",
    title: "Schedule a board audit",
    line: "A formal institutional presentation to your board, on your campus or ours.",
    email: "boards@blackstallion.academy",
    submit: "Confirm board audit",
    fields: [
      { name: "name", label: "Board member name", required: true, autoComplete: "name" },
      { name: "designation", label: "Designation" },
      { name: "organisation", label: "Target campus / circuit", autoComplete: "organization" },
      { name: "date", label: "Proposed audit date" },
      { name: "slot", label: "Preferred slot", type: "select", options: ["Morning · 09:00–12:00", "Afternoon · 14:00–17:00"] },
      { name: "email", label: "Email", type: "email", autoComplete: "email" },
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
            onClick={() => setGate(x.id)}
            className={cn(
              "group relative flex min-h-[16rem] flex-col justify-end overflow-hidden rounded-t-[999px] border p-6 pt-24 text-left transition-colors duration-500 md:min-h-[22rem]",
              gate === x.id ? "border-gold bg-gradient-to-b from-ember/40 to-ember/90" : "border-brass/25 hover:border-brass/60",
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
          <p className="t-voice mt-2 text-display-3 text-bone">{g.line}</p>
          {g.note && <p className="t-ui mt-4 text-sm text-sand">{g.note}</p>}
          <p className="t-ui mt-4 text-sm text-dust">
            Or write to{" "}
            <a href={`mailto:${g.email}`} className="text-gold hover:text-bone">
              {g.email}
            </a>
          </p>
        </div>
        <AnimatePresence mode="wait">
          <motion.div key={gate} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.45, ease: ease.citadel }}>
            <LeadForm gate={g.id} fields={g.fields} submitLabel={g.submit} />
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
