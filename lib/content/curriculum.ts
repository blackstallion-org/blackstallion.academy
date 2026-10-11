import type { MediaKey } from "./media";

/** Reel 05 · The Ledger. Blueprint Part 6, R05; pillars and ranks revised per Directive 04 (the 13-Pillar Sovereign Ledger). */

export type RankId = "squire" | "rider" | "knight" | "lancer";

export const ranks: { id: RankId; numeral: string; name: string; short: string; detail: string; insignia: string; pillars: number[] }[] = [
  {
    id: "squire", numeral: "I", name: "Cadet Squire", short: "Ground care and trot",
    detail: "Stable care, grooming, tack assembly, equine psychology, basic walk and trot.",
    insignia: "Bronze rank pin · soft-bound blue passport logbook",
    pillars: [1, 2, 3],
  },
  {
    id: "rider", numeral: "II", name: "Cadet Rider", short: "Independent canter",
    detail: "Independent canter transitions, 3D pelvic alignment, obstacle trotting.",
    insignia: "Silver rank pin · leather passport sleeve",
    pillars: [4, 5, 6],
  },
  {
    id: "knight", numeral: "III", name: "Cadet Knight", short: "Lance and bow",
    detail: "Advanced equestrian drills, introductory lance grip, mounted archery posture, jump courses.",
    insignia: "Gold rank pin · brass belt buckle · official STPCI registration",
    pillars: [7, 8, 9],
  },
  {
    id: "lancer", numeral: "IV", name: "Sovereign Lancer", short: "National competition",
    detail: "Full-speed tent pegging, mounted archery runs, barrel racing, the national Governor's Cup circuit.",
    insignia: "Sovereign brass epaulettes · sealed brass Sovereign Passport",
    pillars: [10, 11, 12, 13],
  },
];

export type Phase = { numeral: string; name: string; line: string; pillars: number[] };

export const phases: Phase[] = [
  { numeral: "I", name: "The Foundation", line: "Authority is earned on the ground.", pillars: [1, 2, 3] },
  { numeral: "II", name: "The Crucible", line: "Poise is proven in motion.", pillars: [4, 5, 6, 7, 8, 9] },
  { numeral: "III", name: "Sovereign Command", line: "Mastery becomes a discipline.", pillars: [10, 11, 12, 13] },
];

export type Pillar = {
  n: number;
  name: string;
  skill: string;
  trait: string;
  sub: string;
  discipline?: boolean;
};

/** The 13-Pillar Sovereign Ledger (Directive 04 §1). Pillars 10–13 are the BSAH tactical disciplines. */
export const pillars: Pillar[] = [
  {
    n: 1, name: "Grooming & feeding", skill: "Responsibility, attention to detail", trait: "Reliability, conscientiousness",
    sub: "Before a leader commands, they must serve. Cadets learn that authority is earned on the ground through meticulous care and zero ego.",
  },
  {
    n: 2, name: "Mounting & initial handling", skill: "Patience, focus", trait: "Self-control, persistence",
    sub: "Cultivating emotional calm and steady presence during initial engagement with a 500 kg partner.",
  },
  {
    n: 3, name: "Learning commands & cues", skill: "Communication, clarity", trait: "Empathy, emotional awareness",
    sub: "Translating internal intent into clean, readable physical cues that bridge human and equine understanding.",
  },
  {
    n: 4, name: "Riding at different speeds & terrains", skill: "Courage, adaptability", trait: "Confidence, resilience",
    sub: "Maintaining poise and dynamic balance as the environment shifts without warning beneath the saddle.",
  },
  {
    n: 5, name: "Jumping & challenging obstacles", skill: "Risk assessment, problem-solving", trait: "Bravery, critical thinking",
    sub: "Committing eyes and intent beyond obstacles, teaching the mind to execute decisive action under momentum.",
  },
  {
    n: 6, name: "Working with a stubborn / unpredictable horse", skill: "Flexibility, negotiation", trait: "Emotional intelligence, diplomacy",
    sub: "Converting opposition into voluntary cooperation through soft pressure and immediate release.",
  },
  {
    n: 7, name: "Regular practice & training", skill: "Discipline, consistency", trait: "Work ethic, perseverance",
    sub: "Mastering the fundamentals daily to build unshakeable structural and mental competence.",
  },
  {
    n: 8, name: "Building trust with the horse", skill: "Leadership, gentle authority", trait: "Integrity, trustworthiness",
    sub: "Developing non-verbal command and mutual loyalty that earns respect without coercion.",
  },
  {
    n: 9, name: "Dealing with mistakes & falls", skill: "Acceptance, recovery", trait: "Resilience, humility",
    sub: "Analysing errors without panic and getting back in the saddle immediately with renewed focus.",
  },
  {
    n: 10, name: "Skill-at-arms & tent pegging runs", skill: "High-speed spatial convergence, absolute kinetic focus", trait: "Precision under velocity, target execution", discipline: true,
    sub: "Striking a four-inch peg at full gallop permits zero internal chatter: distraction is eliminated to achieve absolute target convergence.",
  },
  {
    n: 11, name: "Mounted archery & bow release", skill: "Dual-task coordination, breath-hold stillness", trait: "Poise under dynamic motion, split-second timing", discipline: true,
    sub: "Maintaining core stability and upper-body stillness while the lower body navigates a moving animal at speed.",
  },
  {
    n: 12, name: "High-velocity barrel racing", skill: "Centrifugal balance, split-second geometric agility", trait: "Calculated risk-taking, razor-sharp reflexes", discipline: true,
    sub: "Executing tight turns at maximum velocity with absolute spatial awareness and dynamic weight distribution.",
  },
  {
    n: 13, name: "Cavalry squad formation & parade command", skill: "Strategic synchronization, collective discipline", trait: "Institutional loyalty, executive leadership presence", discipline: true,
    sub: "Individual mastery unified into squadron discipline: responsibility for the tactical precision and honour of the entire unit.",
  },
];

export const phaseOf = (n: number): Phase => phases.find((p) => p.pillars.includes(n))!;

/** The 45-minute military session protocol (Master Refinement §9.2). */
export const classSegments = [
  { from: 0, to: 10, title: "Ground protocol & tack inspection", detail: "The cadet arrives in uniform, inspects hooves, adjusts the girth, checks reins and settles the heart rate alongside the assigned stallion.", mounted: false },
  { from: 10, to: 25, title: "Core riding & biomechanical alignment", detail: "Mount up. Five minutes of breath alignment at the walk, then trot and canter posture drills on pelvic kinematics and core engagement.", mounted: true },
  { from: 25, to: 35, title: "Tactical skill-at-arms module", detail: "Progressive rotation: ground targets and vaulting-buck drills for Ranks I–II; mounted lance runs, archery releases or barrel patterns for Ranks III–IV.", mounted: true },
  { from: 35, to: 45, title: "Dismount, care & digital logging", detail: "Wash down and reward the stallion, log the session grades, scan the QR seal into the Sovereign Passport.", mounted: false },
];

/** Campus operating schedule (Master Refinement §9.1). Published timings, subject to confirmation per hub. */
export const batches = [
  { name: "Dawn Patrol", time: "06:15 AM–07:00 AM", days: "Mon · Wed · Fri", who: "High School / Senior Squad", focus: "High-intensity drills, zero class conflict" },
  { name: "Twilight Batch", time: "03:45 PM–04:30 PM", days: "Tue · Thu · Fri", who: "Primary & Middle School", focus: "Post-school transition before bus departures" },
  { name: "Sunset Command", time: "04:45 PM–05:30 PM", days: "Mon–Thu", who: "Advanced Lancer Squad", focus: "Skill-at-arms, lance runs, barrel racing" },
  { name: "Weekend Circuit", time: "07:00 AM–07:45 AM · 08:00 AM–08:45 AM", days: "Sat & Sun", who: "Open / Parent-Cadet Batches", focus: "Skill-at-arms, family attendance, monthly trials" },
];

export const assessment = [
  { name: "Riding", detail: "Seat, hands, transitions and the discipline of the day." },
  { name: "Ground", detail: "Leading, handling, safety around the horse." },
  { name: "Stable", detail: "Grooming, tack, feed and the care log." },
];

export const disciplines: { name: string; line: string; image: MediaKey }[] = [
  { name: "Tent pegging", line: "Lance and sword at the gallop: speed, focus, hand-eye timing.", image: "currTentpeg" },
  { name: "Barrel racing", line: "Tight turns at speed: seat control and acceleration.", image: "currBarrel" },
  { name: "Mounted archery", line: "Reins released at the canter to draw and loose.", image: "currArchery" },
  { name: "Formation", line: "Riding as one: rhythm, spacing and trust in the line.", image: "currFormation" },
];
