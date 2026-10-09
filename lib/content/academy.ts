import type { MediaKey } from "./media";

/** Reels 07–09 and the credits page. Blueprint Part 6 (R07 Cadets, R08 Parents, R09 Safety, About). */

/* ------------------------------------------------------------------ R07 · Cadets */

/** SAMPLE spotlights, names from the client docs. */
export const spotlights: { name: string; rank: string; hub: string; hours: number; honour: string; image: MediaKey; code: string }[] = [
  { name: "Zayd Saif Khan", rank: "Cadet Knight", hub: "DPS Hyderabad Campus Hub", hours: 48, honour: "National STPCI qualifier", image: "cadetZayd", code: "BSAH-2026-HYD-042" },
  { name: "Ananya Reddy", rank: "Cadet Knight", hub: "Oakridge International Hub", hours: 36, honour: "Mounted archery champion", image: "cadetAnanya", code: "BSAH-2026-HYD-017" },
  { name: "Rohan Verma", rank: "Cadet Rider", hub: "The Hyderabad Public School Hub", hours: 24, honour: "Perfect canter score", image: "cadetRohan", code: "BSAH-2026-HYD-088" },
];

export const passport = {
  inscription: "The sovereign",
  voice: "passport.",
  body: "Handcrafted leather, stamped with a heavy brass seal at every rank. It goes wherever the cadet rides, and its code opens a public record.",
};

export const day = [
  { time: "06:00", title: "Stoic daily spark", text: "A 30-second audio brief on courage, in the app." },
  { time: "07:30", title: "School", text: "The ordinary day. Posture travels with them." },
  { time: "15:45", title: "The gate", text: "Passport scanned at the stable gate; a parent is alerted." },
  { time: "16:00", title: "Ground care", text: "Grooming, hooves, tack. The horse comes first." },
  { time: "16:15", title: "Mounted session", text: "Breath, posture, then the discipline of the day." },
  { time: "16:45", title: "Log and debrief", text: "Graded on riding, ground and stable. The ledger updates." },
  { time: "17:00", title: "The reel", text: "A ten-second milestone reel goes home." },
  { time: "21:00", title: "Lights out", text: "The stallion's night feed, on camera." },
];

/** Verbatim from docs/legal/cadet-creed.md */
export const creed = [
  "I do not ride to conquer the horse; I command to master myself.",
  "My posture reflects my internal state: unshakable, calm and erect.",
  "A 500-kilogram living partner feels my heart before I speak; therefore, my composure shall be absolute.",
  "Excuses vanish in the arena. Fall nine times, mount the tenth without hesitation or fear.",
  "Leadership is not vocal volume; it is unforced authority, non-verbal empathy and quiet integrity.",
  "I wear the Sovereign Passport with pride, serving my team, my academy and my nation.",
];

export const reels: { title: string; who: string; image: MediaKey }[] = [
  { title: "First canter", who: "Rohan, 13", image: "cadetRohan" },
  { title: "First peg carried", who: "Zayd, 15", image: "currTentpeg" },
  { title: "Archery at the canter", who: "Ananya, 14", image: "currArchery" },
  { title: "Riding without reins", who: "Knight squad", image: "currFormation" },
];

/* ------------------------------------------------------------------ R08 · Parents */

export const phoneSteps = [
  { id: "cam", label: "Stall-cam", title: "Watch Chetak IX at night feed, live.", text: "Every stall has a camera. Open the app and see your child's stallion rest, eat and sleep." },
  { id: "gate", label: "Gate alert", title: "Ananya checked in at 15:52 · DPS Hub.", text: "The moment the passport is scanned at the stable gate, you know your child has arrived." },
  { id: "reel", label: "Milestone reel", title: "Today: first canter without stirrups · 0:10.", text: "After each milestone, a ten-second reel lands on your phone, with a posture overlay." },
  { id: "passport", label: "Passport", title: "Cadet Rider · 24 hrs · next seal at 30 hrs.", text: "Rank, hours and the next seal, the same record a university can verify." },
];

export const admissions = [
  { title: "Enquire", text: "Fill the form, or scan the flyer at your school." },
  { title: "Visit the hub", text: "Meet the instructor and the stallions." },
  { title: "Assessment ride", text: "Twenty minutes to place your child in the right batch." },
  { title: "Onboarding", text: "Passport stamped, uniform sized, welcome box." },
  { title: "First session", text: "Passport scanned at the gate; you get the first alert." },
];

export const fees = [
  { item: "Onboarding (one-time)", detail: "Handcrafted Sovereign Passport, brass seal stamping, uniform badges, welcome box", amount: 2000 },
  { item: "Monthly tuition", detail: "₹8,000 + 18% GST (₹1,440), by UPI Autopay on the 1st", amount: 9440 },
  { item: "Riding safety kit (optional)", detail: "Certified helmet, riding gloves, protective chaps", amount: 3000 },
];

export const faq = [
  { q: "What age can my child start?", a: "From 8, in the Junior batch. Everyone starts at Cadet Squire, on the ground. (Minimum age to be confirmed per hub.)" },
  { q: "Does my child need riding experience?", a: "No. Experience moves a cadet faster, never past the rules." },
  { q: "Is it safe?", a: "Safety is the first promise: ex-cavalry instructors, a spotter on every mounted drill, certified helmets and vests, daily vet checks and ₹10 lakh accident cover. See the Shield for the full protocol." },
  { q: "Will it clash with school?", a: "Sessions run on your child's own campus, before or after school hours." },
  { q: "What if my child falls?", a: "Falls are part of riding. Cadets wear certified helmets and vests, learn how to fall before they canter, and are covered by ₹10 lakh group accident insurance." },
  { q: "Can I watch?", a: "From the rail during sessions, and any time on the stall-cam." },
  { q: "How do I pay?", a: "Monthly UPI Autopay on the 1st. Onboarding and the kit are paid once." },
  { q: "Can we pause?", a: "Yes, with 30 days' notice. (Sample policy; final terms at enrolment.)" },
];

/* ------------------------------------------------------------------ R09 · Safety */

export const kitLabels = [
  { n: "01", name: "Certified helmet", x: 30, y: 38 },
  { n: "02", name: "Riding gloves", x: 52, y: 62 },
  { n: "03", name: "Body protector", x: 66, y: 36 },
  { n: "04", name: "Leather chaps", x: 80, y: 66 },
];

export const shields = [
  { big: "Ex-military", title: "Instructors", line: "Sourced from Indian Army RVC and NCC cavalry units." },
  { big: "Daily", title: "Veterinary & livestock care", line: "On-campus equine vet protocols; strict hydration and feeding logs." },
  { big: "₹10 L", title: "Comprehensive insurance", line: "Group accident cover for every active cadet." },
];

export const orders = [
  "Helmet on before the stable door.",
  "Vests for jumping and lance work.",
  "A spotter on every mounted drill.",
  "The fall is taught before the canter.",
  "Horses are checked before cadets: hooves, temperature, tack.",
  "Heat protocol: sessions move to cooler hours; water every session.",
  "Every stallion gets rest days.",
  "Incidents are logged the same day and reported to parents.",
];

/** SAMPLE until live data. */
export const record = [
  { value: 1480, suffix: "", label: "horsemanship hours logged", sample: true },
  { value: 0, suffix: "", label: "major injuries", sample: true },
  { value: 21, suffix: "", label: "stallions vet-checked daily", sample: false },
  { value: 10, prefix: "₹", suffix: " L", label: "accident cover per cadet", sample: false },
];

export const people: { role: string; line: string; image: MediaKey }[] = [
  { role: "Chief Cavalry Instructor", line: "Ex-Army RVC. Teaches the fall before the canter. (Role shown; name to follow.)", image: "safetyInstructor" },
  { role: "Equine veterinarian", line: "Daily rounds: temperatures, eyes, gait, hooves.", image: "safetyVet" },
];

/* ------------------------------------------------------------------ About */

export const letter = {
  note: "Draft for the Chairman's approval",
  body: [
    "We did not set out to build a riding school. We set out to answer a question every parent asks quietly: how do I raise a child who stands tall when no one is watching?",
    "Our answer is five hundred kilograms of honesty. A Marwari stallion cannot be flattered, bribed or rushed. It asks a child to be calm, clear and brave, and it asks every single day.",
    "We bring that horse, and the men who served in India's cavalry, inside the school gate, and we write down every hour so the progress is never a promise. That is the mandate.",
  ],
  sign: "Saef Ullah Khan",
  title: "Founder & Executive Chairman",
};

export const truths = [
  "A horse cannot be fooled.",
  "Posture is character made visible.",
  "Lineage gives discipline a reason.",
  "Progress is proof, not promise.",
  "Safety before speed.",
  "The campus becomes the citadel.",
];

export const house = {
  parent: "Vicarius Infinitum Holdings Pvt Ltd",
  children: [
    { name: "The Black Stallion Academy of Horsemanship Pvt Ltd", line: "Operating arm · interscholastic leadership and cavalry sport", status: "Active" },
    { name: "The Black Stallion Order", line: "Private member society for equestrian connoisseurs", status: "Invitation only · in development" },
    { name: "Stallion Black Coffee", line: "Micro-lot coffee for focus and endurance", status: "Coming soon" },
  ],
  council: { name: "School Tent Pegging Council of India", line: "Governs the interscholastic circuit" },
};
