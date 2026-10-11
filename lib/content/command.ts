import { priceLabel } from "./pricing";
import { tiers } from "./schools";

/**
 * Reel 13 · Command AI. Scripted answers today (keyword match); a live model
 * replaces `answer()` when Supabase and the AI route land. Logged questions go to command_ai_logs.
 * The first four entries are the quick-action query matrix (Directive 04 §3).
 */

export type Entry = { id: string; ask: string; /** The full question a quick-action chip submits. */ query?: string; keywords: string[]; answer: string };

export const knowledge: Entry[] = [
  {
    id: "capex",
    ask: "CapEx & revenue share",
    query: "What is the financial model for partner school boards?",
    keywords: ["roi", "payback", "return", "revenue", "share", "earn", "income", "capex", "financial", "model", "fund"],
    answer:
      "Proposed model: BSAH funds, constructs and operates a turnkey arena with ex-cavalry faculty at zero capital expenditure to the school board, and 25% to 30% of cadet tuition is returned to the partner institution, settled quarterly. This is an offer, not an existing arrangement: it applies only under a signed agreement, and the MOU sets the final terms. See the model at /schools.",
  },
  {
    id: "insurance",
    ask: "Insurance & safety record",
    query: "What is the safety record for Cadet Lancer drills?",
    keywords: ["insurance", "insured", "cover", "accident", "liability", "safety", "safe", "injury", "injuries", "helmet", "fall", "record", "lancer"],
    answer:
      "BSAH describes certified helmets for every mounted minute, impact-reduction vests for jumping and lance work, and an ex-cavalry supervisor on every mounted drill. Training-hour totals, injury records and insurance cover are not published yet: the figures and the policy documents are being confirmed, and nothing is shown until they are.",
  },
  {
    id: "stpci",
    ask: "STPCI accreditation",
    query: "Is this program officially recognized for competitions?",
    keywords: ["stpci", "accredit", "recognised", "recognized", "sanction", "official", "council", "federation", "efi"],
    answer:
      "The School Tent Pegging Council of India (STPCI) is the governing council in the BSAH structure. The intended process: every session's milestones are logged in the cadet's Sovereign Passport, and that record is what the council reviews for registration and competition eligibility. Official recognition, registration terms and Governor's Cup eligibility are being confirmed and will be published with documentation; passport logging is planned, not yet live.",
  },
  {
    id: "timings",
    ask: "Curriculum & class timings",
    query: "How do riding sessions fit into academic schedules?",
    keywords: ["timing", "timings", "schedule", "academic", "class", "clash", "school hours", "batch", "batches", "when"],
    answer:
      "Sessions are planned for non-academic buffer windows using the 45-minute military session protocol (10 minutes ground protocol and tack inspection, 15 minutes core riding and biomechanical alignment, 10 minutes skill-at-arms, 10 minutes dismount, care and digital logging): Dawn Patrol at 06:15 AM, Twilight Batch at 03:45 PM and Sunset Command at 04:45 PM, with the Weekend Circuit on Saturday and Sunday mornings. Final batch times are set against each campus's own timetable before launch.",
  },
  {
    id: "faculty",
    ask: "Who are the instructors?",
    keywords: ["instructor", "faculty", "coach", "teacher", "army", "rvc", "ncc", "cavalry", "61st"],
    answer:
      "BSAH's faculty recruitment pipeline targets retired Indian Army Remount & Veterinary Corps (RVC) personnel, 61st Cavalry JCOs and NCOs, NCC Equestrian Wings and regional equestrian federations across Rajasthan, Punjab, Haryana and Telangana. These are recruitment sources, not confirmed affiliations; no individual is named until appointed. The planned staffing per hub is a chief instructor and a stable master, with daily rounds by an equine veterinarian.",
  },
  {
    id: "fees",
    ask: "What does it cost a parent?",
    keywords: ["fee", "fees", "cost", "price", "tuition", "pay", "gst", "upi", "elite", "kit"],
    answer:
      `Core Cadets: ${priceLabel.core} a month, two sessions a week. Sovereign Elite: ${priceLabel.elite} a month, three sessions a week plus skill-at-arms, STPCI registration and the 24/7 stall-cam. The one-time onboarding kit is ${priceLabel.kit} (tunic, helmet, boots, Sovereign Passport). UPI Autopay on the 1st.`,
  },
  {
    id: "tiers",
    ask: "What do the three hub tiers include?",
    keywords: ["tier", "tiers", "standard", "signature", "royal", "pavilion", "stables", "acre", "land", "build"],
    answer: tiers.map((t) => `${t.name}: ${t.includes.join(", ")}, ${t.acres}, ${t.cadets} cadets, BSAH-funded (${t.capexLabel} invested).`).join(" "),
  },
  {
    id: "curriculum",
    ask: "How does the curriculum work?",
    keywords: ["curriculum", "rank", "ranks", "pillar", "pillars", "squire", "rider", "knight", "session"],
    answer:
      "Four ranks (Cadet Squire, Cadet Rider, Cadet Knight, Sovereign Lancer) and the 13-Pillar Sovereign Ledger: nine foundations of horsemanship and four BSAH tactical disciplines. A session is 45 minutes — ground protocol, core riding, a tactical skill-at-arms module, then care and digital logging — and every session is graded and entered in the ledger the same day.",
  },
  {
    id: "horses",
    ask: "Which horses do cadets ride?",
    keywords: ["horse", "horses", "marwari", "kathiawari", "stallion", "fleet", "breed"],
    answer:
      "The planned fleet: indigenous Marwari and Kathiawari stallions, each microchipped (ISO 11784), vet-checked daily and on a 24/7 stall camera, with each cadet assigned a stallion for the long term. Fleet numbers on the site are sample figures.",
  },
  {
    id: "tournaments",
    ask: "How do schools compete?",
    keywords: ["tournament", "compete", "competition", "cup", "governor", "league", "circuit", "tent pegging"],
    answer:
      "Hubs compete on the STPCI interscholastic circuit in tent pegging, barrel racing and mounted archery, with standings kept by regional zone. The Sovereign Governor's Cup fixture shown on the site is a sample, pending confirmation. Royal Pavilion hubs are designed to host finals.",
  },
  {
    id: "verify",
    ask: "How can a university verify a cadet?",
    keywords: ["verify", "verification", "passport", "credential", "university", "admissions", "diploma"],
    answer:
      "Every cadet's passport carries a code like BSAH-2026-HYD-042. Entering it at /verify shows the sealed record: rank, riding hours, hub, EFI registration and milestones. Nothing private is shown.",
  },
  {
    id: "age",
    ask: "What age can a child start?",
    keywords: ["age", "old", "start", "join", "enrol", "enroll", "admission", "beginner"],
    answer:
      "From 8, in the Junior batch (minimum age to be confirmed per hub). Every cadet starts as a Cadet Squire on the ground, with or without riding experience.",
  },
];

export const fallback =
  "This demo has no scripted answer for that question, and questions are not saved. Try one of the suggested questions, or email the Office of the Chairman.";

export function answer(query: string): Entry | null {
  const q = query.toLowerCase();
  let best: { e: Entry; score: number } | null = null;
  for (const e of knowledge) {
    const score = e.keywords.reduce((s, k) => (q.includes(k) ? s + k.length : s), 0);
    if (score > 0 && (!best || score > best.score)) best = { e, score };
  }
  return best?.e ?? null;
}
