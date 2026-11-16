import { entity } from "./site";

/**
 * The Director page (/director, 16 Nov 2026, owner's request). Built ONLY from what the project's own documents say about him:
 *  - name and title: "Saef Ullah Khan, Founder & Executive Chairman" (docs/reference/prd/*.md, instructions/BSAH_Combined_Documents.pdf,
 *    ALL_WEBSITE_DATA.md "Executive Leadership", the diploma signature in app/verify/[code]/page.tsx);
 *  - his role across the house: Vicarius Infinitum Holdings (parent) → BSAH (operator) → STPCI (council) (lib/content/academy.ts `house`);
 *  - his vision: the founder's letter in lib/content/academy.ts `letter`, still marked as a draft for his approval, shown as such;
 *  - his signature on every cadet diploma.
 * No biography, dates, career history or photograph exist in the project, so none is shown: the portrait frame waits for one.
 * Spelling "Saef" follows every project document (owner confirmed, 16 Nov 2026).
 */
export const director = {
  name: "Saef Ullah Khan",
  title: "Founder & Executive Chairman",
  intro:
    "Founder and Executive Chairman of the Black Stallion Academy of Horsemanship and of Vicarius Infinitum Holdings, the house it belongs to.",
  roles: [
    { org: entity.parent, role: "Founder & Executive Chairman", line: "The parent house. He leads its executive team." },
    { org: entity.operator, role: "Founder & Executive Chairman", line: "The academy: horsemanship and character for school-age cadets." },
  ],
  leadership: [
    { n: "01", title: "He leads the house", line: "As Founder & Executive Chairman of Vicarius Infinitum Holdings, he leads the executive team behind the academy." },
    { n: "02", title: "The mandate is his letter", line: "The academy's mandate is written as his letter to parents, below, still a draft awaiting his approval." },
    { n: "03", title: "He signs the diploma", line: "Every cadet's diploma carries his signature beside the Chief Cavalry Instructor's." },
  ],
  portraitNote: "Portrait to follow",
} as const;
