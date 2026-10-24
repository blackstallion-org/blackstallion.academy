import { tiers, type TierId } from "@/lib/content/schools";

/**
 * The draft MOU text, used by BOTH the on-page live draft and the downloadable PDF so they can never differ.
 * This is the published discussion draft; no clauses, figures or signatures are added beyond it.
 */
export type MouDraftInput = { school: string; city: string; trustee: string; designation: string; email: string; phone: string; land: string; tier: TierId; cadets: string };
export type MouParagraph = { lead?: string; text: string; strong?: string[] };

const blank = (v: string, fallback: string) => (v.trim() ? v.trim() : fallback);

export function mouDraft(d: MouDraftInput) {
  const tier = tiers.find((t) => t.id === d.tier) ?? tiers[0];
  const school = blank(d.school, "[School name]");
  return {
    banner: "Draft for discussion · not a binding document",
    title: "Memorandum of Understanding",
    tierName: tier.name,
    paragraphs: [
      {
        text: `This memorandum is made between ${school}, ${blank(d.city, "[City]")} (“the School”), represented by ${blank(d.trustee, "[Trustee]")}${d.designation.trim() ? `, ${d.designation.trim()}` : ""}, and The Black Stallion Academy of Horsemanship Pvt Ltd (“BSAH”), a company of Vicarius Infinitum Holdings Pvt Ltd.`,
        strong: [school],
      },
      { lead: "1. Scope.", text: `BSAH will design the equestrian hub, supervise its construction to the ${tier.name} specification (${tier.includes.join(", ")}) on approximately ${blank(d.land, "[ ]")} acres of School land, and operate it.`, strong: [tier.name] },
      { lead: "2. The School.", text: `Provides land, access and utilities, and promotes the programme to its students. Construction is funded by BSAH (indicative capital ${tier.capexLabel}) at zero capital expenditure to the School.` },
      { lead: "3. BSAH.", text: "Provides stallions, ex-cavalry faculty, veterinary care, group accident insurance for every active cadet, admissions, billing and the parent app." },
      { lead: "4. Revenue share.", text: `BSAH pays the School 25–30% of gross tuition each month, for an expected ${blank(d.cadets, "[ ]")} cadets at full enrolment.` },
      { lead: "5. Term and governance.", text: "Five years, renewable (sample term). The hub follows the rules of the School Tent Pegging Council of India and may host STPCI fixtures." },
    ] as MouParagraph[],
    signatories: [
      { name: blank(d.trustee, "For the School"), org: blank(d.school, "School") },
      { name: "For BSAH", org: "Office of the Executive Chairman" },
    ],
    contact: `CONTACT · ${d.email.trim() || "email"} · ${d.phone.trim() || "phone"}`,
  };
}
