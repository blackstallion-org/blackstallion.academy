import { formatINR, simulate, tiers } from "./schools";

/**
 * Reel 13 · Command AI. Scripted answers today (keyword match); a live model
 * replaces `answer()` when Supabase and the AI route land. Logged questions go to command_ai_logs.
 */

export type Entry = { id: string; ask: string; keywords: string[]; answer: string };

const roi150 = simulate(150, 25, tiers[0].capexLakh);

export const knowledge: Entry[] = [
  {
    id: "roi",
    ask: "Payback for 150 cadets",
    keywords: ["roi", "payback", "return", "revenue", "share", "earn", "income", "150"],
    answer: `On a Standard Hub (${tiers[0].capexLabel}) with 150 cadets at ₹8,000 a month before GST, annual tuition is ${formatINR(
      roi150.annualTuition,
    )}. At a 25% share the school receives ${formatINR(roi150.schoolYear)} a year, about ${formatINR(
      roi150.schoolMonth,
    )} a month, so the arena pays back in roughly ${roi150.paybackMonths.toFixed(1)} months at full enrolment. Enrolment ramps up over the first terms; the MOU sets final terms. Try the simulator at /schools.`,
  },
  {
    id: "insurance",
    ask: "Insurance cover",
    keywords: ["insurance", "insured", "cover", "accident", "liability"],
    answer: "Every active cadet is covered by ₹10 lakh comprehensive group accident insurance, arranged and paid by BSAH. The school carries no equestrian liability for sessions BSAH runs.",
  },
  {
    id: "faculty",
    ask: "Who are the instructors?",
    keywords: ["instructor", "faculty", "coach", "teacher", "army", "rvc", "ncc", "cavalry"],
    answer: "Instructors are drawn from Indian Army Remount and Veterinary Corps (RVC) and NCC cavalry units. Each hub has a chief instructor and a stable master; an equine veterinarian makes daily rounds.",
  },
  {
    id: "safety",
    ask: "What is the safety record for Cadet Lancer drills?",
    keywords: ["safety", "safe", "injury", "injuries", "helmet", "fall", "record", "lancer"],
    answer: "Certified helmets for every mounted minute, vests for jumping and lance work, and an ex-cavalry spotter on every mounted drill. Cadets learn to fall before they canter. No major injuries logged across 1,480 horsemanship hours (sample figure; live data follows).",
  },
  {
    id: "fees",
    ask: "What does it cost a parent?",
    keywords: ["fee", "fees", "cost", "price", "tuition", "pay", "gst", "upi"],
    answer: "Onboarding ₹2,000 once (passport, seal stamping, badges, welcome box). Tuition ₹8,000 a month plus 18% GST, ₹9,440 in total, by UPI Autopay on the 1st. The riding safety kit is an optional ₹3,000.",
  },
  {
    id: "tiers",
    ask: "What do the three hub tiers include?",
    keywords: ["tier", "tiers", "standard", "signature", "royal", "pavilion", "stables", "acre", "land", "build", "capex"],
    answer: tiers.map((t) => `${t.name}: ${t.includes.join(", ")}, ${t.acres}, ${t.cadets} cadets, ${t.capexLabel}.`).join(" "),
  },
  {
    id: "curriculum",
    ask: "How does the curriculum work?",
    keywords: ["curriculum", "rank", "ranks", "pillar", "pillars", "squire", "rider", "knight", "class", "session"],
    answer: "Four ranks (Cadet Squire, Cadet Rider, Cadet Knight, Sovereign Lancer) and twelve pillars of character. A session is 45 minutes: 15 minutes of ground and stable care, 30 mounted. Every session is graded on riding, ground and stable work and entered in the ledger the same day.",
  },
  {
    id: "horses",
    ask: "Which horses do cadets ride?",
    keywords: ["horse", "horses", "marwari", "kathiawari", "stallion", "fleet", "breed"],
    answer: "Indigenous Marwari and Kathiawari stallions, 21 across the hubs, each microchipped (ISO 11784), vet-checked daily and on a 24/7 stall camera. Each cadet is assigned a stallion for the long term.",
  },
  {
    id: "tournaments",
    ask: "How do schools compete?",
    keywords: ["tournament", "compete", "competition", "stpci", "cup", "governor", "league", "circuit", "tent pegging"],
    answer: "Hubs compete on the STPCI interscholastic circuit in tent pegging, barrel racing and mounted archery. The 2026 Sovereign Governor's Cup runs on 14 November at DPS Hyderabad. Royal Pavilion hubs can host finals.",
  },
  {
    id: "verify",
    ask: "How can a university verify a cadet?",
    keywords: ["verify", "verification", "passport", "credential", "university", "admissions", "diploma", "efi"],
    answer: "Every cadet's passport carries a code like BSAH-2026-HYD-042. Entering it at /verify shows the sealed record: rank, riding hours, hub, EFI registration and milestones. Nothing private is shown.",
  },
  {
    id: "age",
    ask: "What age can a child start?",
    keywords: ["age", "old", "start", "join", "enrol", "enroll", "admission", "beginner"],
    answer: "From 8, in the Junior batch (minimum age to be confirmed per hub). Every cadet starts as a Cadet Squire on the ground, with or without riding experience.",
  },
];

export const fallback =
  "Logged for the Office of the Chairman. A person will reply within one working day. Meanwhile, try one of the suggested questions.";

export function answer(query: string): Entry | null {
  const q = query.toLowerCase();
  let best: { e: Entry; score: number } | null = null;
  for (const e of knowledge) {
    const score = e.keywords.reduce((s, k) => (q.includes(k) ? s + k.length : s), 0);
    if (score > 0 && (!best || score > best.score)) best = { e, score };
  }
  return best?.e ?? null;
}
