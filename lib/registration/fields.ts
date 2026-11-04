import type { ApplicationKind } from "./model";

/**
 * The questions each application kind asks, in order, as data: one form component renders them all, and the server's Zod
 * schemas (model.ts) check the same names. Only what admissions needs is asked; nothing about a child goes in a payload.
 */
export type FieldSpec = {
  name: string;
  label: string;
  type: "text" | "email" | "tel" | "number" | "url" | "select" | "textarea" | "checkbox";
  required?: boolean;
  options?: readonly { value: string; label: string }[];
  hint?: string;
  max?: number;
  autoComplete?: string;
  wide?: boolean;
};

const opts = (pairs: readonly (readonly [string, string])[]) => pairs.map(([value, label]) => ({ value, label }));

export const FIELDS: Record<ApplicationKind, readonly FieldSpec[]> = {
  cadet: [
    { name: "relationship", label: "Your relationship to the child", type: "select", required: true, options: opts([["mother", "Mother"], ["father", "Father"], ["legal_guardian", "Legal guardian"], ["other", "Other"]]) },
    { name: "preferred_days", label: "Preferred training days", type: "select", required: true, options: opts([["weekdays", "Weekdays"], ["weekends", "Weekends"], ["either", "Either"]]) },
    { name: "emergency_contact_name", label: "Emergency contact name", type: "text", required: true, max: 120, autoComplete: "name" },
    { name: "emergency_contact_phone", label: "Emergency contact phone", type: "tel", required: true, max: 20, autoComplete: "tel" },
    { name: "how_heard", label: "How did you hear about us?", type: "text", max: 120, wide: true },
  ],
  school: [
    { name: "institution_name", label: "Institution name", type: "text", required: true, max: 160, autoComplete: "organization", wide: true },
    { name: "board", label: "Board", type: "select", required: true, options: opts([["CBSE", "CBSE"], ["ICSE", "ICSE"], ["IB", "IB"], ["Cambridge", "Cambridge"], ["State", "State board"], ["Other", "Other"]]) },
    { name: "student_strength", label: "Students on roll", type: "number", required: true },
    { name: "city", label: "City", type: "text", required: true, max: 80, autoComplete: "address-level2" },
    { name: "state", label: "State", type: "text", required: true, max: 80, autoComplete: "address-level1" },
    { name: "campus_area_acres", label: "Open campus area (acres)", type: "number", required: true, hint: "An approximate figure is fine." },
    { name: "representative_designation", label: "Your designation", type: "text", required: true, max: 100, autoComplete: "organization-title" },
    { name: "representative_phone", label: "Your phone", type: "tel", required: true, max: 20, autoComplete: "tel" },
    { name: "official_email", label: "Official school e-mail", type: "email", required: true, max: 160, hint: "We confirm the school through this address." },
    { name: "requirements", label: "Programme requirements or questions", type: "textarea", max: 1500, wide: true },
    { name: "authorised", label: "I am authorised to apply on behalf of this institution.", type: "checkbox", required: true, wide: true },
  ],
  staff: [
    { name: "position", label: "Position", type: "select", required: true, options: opts([["riding_instructor", "Riding instructor"], ["groom", "Groom"], ["stable_manager", "Stable manager"], ["operations", "Operations"], ["other", "Other"]]) },
    { name: "years_experience", label: "Years of relevant experience", type: "number", required: true },
    { name: "phone", label: "Phone", type: "tel", required: true, max: 20, autoComplete: "tel" },
    { name: "city", label: "City", type: "text", required: true, max: 80, autoComplete: "address-level2" },
    { name: "ex_service", label: "Have you served in the armed forces or the mounted police?", type: "select", required: true, options: opts([["no", "No"], ["yes", "Yes"]]) },
    { name: "availability", label: "When could you start?", type: "select", required: true, options: opts([["immediate", "Immediately"], ["one_month", "Within a month"], ["three_months", "Within three months"]]) },
    { name: "certifications", label: "Certifications (EFI, BHS, first aid…)", type: "text", max: 500, wide: true },
    { name: "statement", label: "Why you want to teach or work here", type: "textarea", required: true, max: 1500, wide: true },
  ],
  partner: [
    { name: "organisation", label: "Organisation", type: "text", required: true, max: 160, autoComplete: "organization", wide: true },
    { name: "category", label: "Kind of partnership", type: "select", required: true, options: opts([["corporate_sponsor", "Corporate sponsorship"], ["csr", "CSR programme"], ["equipment", "Equipment or tack"], ["media", "Media"], ["venue", "Venue or event"], ["academic", "Academic or research"], ["other", "Other"]]) },
    { name: "website", label: "Website", type: "url", max: 200, autoComplete: "url" },
    { name: "contact_designation", label: "Your designation", type: "text", required: true, max: 100, autoComplete: "organization-title" },
    { name: "contact_phone", label: "Your phone", type: "tel", required: true, max: 20, autoComplete: "tel" },
    { name: "proposal", label: "What you propose", type: "textarea", required: true, max: 2000, wide: true },
  ],
};

/** Labels for a stored payload, for the staff console and the applicant's own summary. */
export function describePayload(kind: ApplicationKind, payload: Record<string, unknown>): { label: string; value: string }[] {
  return FIELDS[kind]
    .filter((f) => payload[f.name] !== undefined && payload[f.name] !== "")
    .map((f) => {
      const raw = payload[f.name];
      const option = f.options?.find((o) => o.value === raw);
      return { label: f.label, value: f.type === "checkbox" ? "Yes" : option ? option.label : String(raw) };
    });
}
