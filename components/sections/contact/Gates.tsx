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

type GateId = "schools" | "parents" | "partners";

const gates: { id: GateId; title: string; line: string; email: string; fields: Field[]; submit: string }[] = [
  {
    id: "schools",
    title: "School boards",
    line: "Book a campus feasibility audit and a 15-minute executive briefing.",
    email: "boards@blackstallion.academy",
    submit: "Request the briefing",
    fields: [
      { name: "name", label: "Your name", required: true, autoComplete: "name" },
      { name: "designation", label: "Designation" },
      { name: "organisation", label: "School", required: true, autoComplete: "organization" },
      { name: "city", label: "City" },
      { name: "email", label: "Email", type: "email", autoComplete: "email" },
      { name: "phone", label: "Phone", type: "tel", autoComplete: "tel" },
      { name: "land", label: "Available land", type: "select", options: ["Under 0.5 acre", "0.5–1 acre", "1–1.5 acres", "1.5 acres or more"] },
      { name: "message", label: "Anything we should know", type: "textarea" },
    ],
  },
  {
    id: "parents",
    title: "Parents",
    line: "Enrolment, uniform sizing and Sovereign Passport support.",
    email: "parents@blackstallion.academy",
    submit: "Start the enquiry",
    fields: [
      { name: "name", label: "Parent's name", required: true, autoComplete: "name" },
      { name: "child", label: "Child's name" },
      { name: "class", label: "Class", type: "select", options: ["Class 3–5", "Class 6–8", "Class 9–10", "Class 11–12"] },
      { name: "organisation", label: "School / hub" },
      { name: "phone", label: "Phone", type: "tel", autoComplete: "tel" },
      { name: "email", label: "Email", type: "email", autoComplete: "email" },
      { name: "message", label: "Questions", type: "textarea" },
    ],
  },
  {
    id: "partners",
    title: "Regional partners",
    line: "PT teachers, sports heads and regional partners.",
    email: "partners@blackstallion.academy",
    submit: "Introduce yourself",
    fields: [
      { name: "name", label: "Your name", required: true, autoComplete: "name" },
      { name: "organisation", label: "Organisation", autoComplete: "organization" },
      { name: "city", label: "City" },
      { name: "email", label: "Email", type: "email", autoComplete: "email" },
      { name: "phone", label: "Phone", type: "tel", autoComplete: "tel" },
      { name: "message", label: "How would you like to work together?", type: "textarea" },
    ],
  },
];

/** §1 · S60 three gates. Signature: choosing an arch lights it and opens its form beneath. */
export function Gates() {
  const [gate, setGate] = useState<GateId>("parents");
  const [audit, setAudit] = useState(false);

  useEffect(() => {
    const g = new URLSearchParams(window.location.search).get("gate");
    const id = window.requestAnimationFrame(() => {
      if (g === "audit") {
        setGate("schools");
        setAudit(true);
      } else if (g === "schools" || g === "parents" || g === "partners") setGate(g);
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
            onClick={() => {
              setGate(x.id);
              setAudit(false);
            }}
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
          <p className="label text-brass">{audit ? "Board audit" : g.title}</p>
          <p className="t-voice mt-2 text-display-3 text-bone">{audit ? "Schedule a board audit." : g.line}</p>
          <p className="t-ui mt-4 text-sm text-dust">
            Or write to{" "}
            <a href={`mailto:${g.email}`} className="text-gold hover:text-bone">
              {g.email}
            </a>
          </p>
        </div>
        <AnimatePresence mode="wait">
          <motion.div key={gate + String(audit)} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.45, ease: ease.citadel }}>
            <LeadForm gate={audit ? "audit" : g.id} fields={g.fields} submitLabel={audit ? "Request the audit" : g.submit} />
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
