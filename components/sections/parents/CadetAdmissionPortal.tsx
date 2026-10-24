"use client";

import { useId, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowRight, CheckCircle2, ShieldCheck } from "lucide-react";
import { LeadForm, type Field } from "@/components/sections/shared/LeadForm";
import { priceLabel } from "@/lib/content/pricing";
import { network } from "@/lib/content/schools";
import { ease } from "@/lib/motion/tokens";
import { Label } from "@/components/film/Marks";

const zoneGroups = network.map((z) => ({
  label: `Zone ${z.code} · ${z.name}`,
  options: z.subzones.map((s) => `${s.code} · ${s.name}`),
}));

const cadetFields: Field[] = [
  { name: "name", label: "Parent / Guardian Name", required: true, autoComplete: "name" },
  { name: "student", label: "Student Name & Age", required: true, hint: "e.g. Aarav, 11" },
  { name: "zone", label: "Target Regional Zone", type: "select", groups: zoneGroups, required: true, wide: true },
  {
    name: "tier",
    label: "Preferred Tier",
    type: "select",
    required: true,
    wide: true,
    options: [
      `Core Cadets · ${priceLabel.core} / month`,
      `Sovereign Elite · ${priceLabel.elite} / month`,
    ],
  },
  { name: "email", label: "Email", type: "email", autoComplete: "email", hint: "Email or phone required" },
  { name: "phone", label: "Phone", type: "tel", autoComplete: "tel" },
  { name: "message", label: "Questions / Notes", type: "textarea" },
];

const cadetSteps = [
  {
    title: "Tell us about your cadet.",
    description: "Help us understand your child and find the right starting point.",
    fields: ["name", "student", "email", "phone"],
  },
  {
    title: "Find your starting point.",
    description: "Choose your preferred programme and target regional zone.",
    fields: ["zone", "tier", "message"],
  },
  {
    title: "Review your application.",
    description: "Check your details before sending your enquiry to the academy.",
    fields: [],
  },
];

export function CadetAdmissionPortal() {
  const [isOpen, setIsOpen] = useState(false);
  const portalId = useId();

  return (
    <section
      id="cadet-admissions"
      aria-labelledby="cadet-adm-h"
      className="gutter relative py-[clamp(5rem,10vh,8rem)]"
    >
      <div className="mx-auto max-w-4xl rounded-2xl border border-line bg-gradient-to-b from-umber/30 to-night p-6 md:p-10 lg:p-12">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Label>Admission Portal</Label>
              <span className="font-mono text-[0.65rem] tracking-wider text-gold uppercase">
                Active Enrolment
              </span>
            </div>
            <h3
              id="cadet-adm-h"
              className="t-voice mt-3 text-3xl text-bone md:text-4xl"
            >
              Cadet Application Form
            </h3>
            <p className="mt-2 max-w-xl text-sm text-sand">
              Begin your child’s journey in the Sovereign Character Academy. Submit
              your application in three simple steps.
            </p>
          </div>

          {!isOpen && (
            <button
              type="button"
              onClick={() => setIsOpen(true)}
              className="group inline-flex items-center gap-3 shrink-0 rounded-sm bg-gold px-6 py-3.5 text-xs font-mono font-medium tracking-wider uppercase text-night transition-all hover:bg-bone hover:shadow-[0_0_24px_rgba(201,166,107,0.3)]"
            >
              <span>Begin Application</span>
              <ArrowRight
                size={16}
                className="transition-transform group-hover:translate-x-1"
                aria-hidden
              />
            </button>
          )}
        </div>

        {/* Benefits bar */}
        <div className="mt-8 grid grid-cols-1 gap-3 border-t border-line/60 pt-6 sm:grid-cols-3">
          <div className="flex items-center gap-3 text-xs text-sand">
            <CheckCircle2 size={16} className="text-gold shrink-0" aria-hidden />
            <span>Core Cadets: {priceLabel.core} / mo</span>
          </div>
          <div className="flex items-center gap-3 text-xs text-sand">
            <CheckCircle2 size={16} className="text-gold shrink-0" aria-hidden />
            <span>Sovereign Elite: {priceLabel.elite} / mo</span>
          </div>
          <div className="flex items-center gap-3 text-xs text-sand">
            <ShieldCheck size={16} className="text-gold shrink-0" aria-hidden />
            <span>One-Time Onboarding Kit: {priceLabel.kit}</span>
          </div>
        </div>

        {/* Interactive Form Panel */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              id={portalId}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.5, ease: ease.citadel }}
              className="overflow-hidden"
            >
              <div className="mt-8 border-t border-line pt-8">
                <LeadForm
                  gate="parents"
                  fields={cadetFields}
                  steps={cadetSteps}
                  submitLabel="SUBMIT CADET APPLICATION"
                  fallbackEmail="parents@blackstallion.academy"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
