import type { MediaKey } from "./media";

/** R00 · The Trailer. Copy from Blueprint Part 6 (home). */

export const hero = {
  badge: "Governed by the School Tent Pegging Council of India",
  frames: [
    { inscription: "We do not teach", voice: "children to ride." },
    { inscription: "We forge them", voice: "to lead." },
  ],
  sub: "The interscholastic equestrian leadership academy and national tent pegging circuit for India's schools. Indigenous Marwari stallions, ex-cavalry instructors and a ledger of every hour, on your child's own campus.",
  ctas: [
    { label: "Watch the legend", href: "/legend" },
    { label: "Find your campus", href: "/schools#hubs" },
  ],
  stats: [
    { value: "13", label: "pillars of character, drilled in the saddle" },
    { value: "25–30%", label: "of tuition back to partner schools" },
    { value: "24/7", label: "stall-cam for every parent" },
  ],
  /** SAMPLE live figures. */
  ticker: ["BSAH National Command (demo data)", "Hours logged 14,800 (sample)", "Canter transitions passed 342 (sample)", "Active stallions 21 (sample)", "Hubs live 3 (sample)", "Next: Governor's Cup · 14 Nov"],
};

export const story = {
  inscription: "Eight hundred years",
  voice: "in one bloodline.",
  frames: [
    { kicker: "One bloodline", text: "For centuries, civilisation was shaped by the partnership between horse and rider. In the Thar Desert that partnership bred a horse unlike any other.", image: "legendSand" as MediaKey },
    { kicker: "Marwar, the Thar", text: "Driven onto the arid plains of the Thar, the horsemen of Marwar survived on terrain, not ideology. Their horses learned to live on a cup of water.", image: "bgFort" as MediaKey },
    { kicker: "The vow", text: "A Marwari left the battlefield three ways: in victory, in death, or carrying its wounded rider home.", image: "legendCavalry" as MediaKey },
    { kicker: "Nearly lost", text: "After 1947 the royal stables emptied. Horses were sold, castrated, shot. A few people refused to let the line end.", image: "legendRevival" as MediaKey },
  ],
  closing: "Their ears curl inward until the tips touch. That is how you know the blood is pure.",
};

export const instrument = {
  inscription: "Five hundred kilograms",
  voice: "that read you first.",
  body: "Every part of the Marwari teaches the rider something. Choose a point on the plate.",
  points: ["ears", "neck", "saddle", "reins", "hoof"],
};

export const matrix = {
  inscription: "What twenty minutes",
  voice: "does to a child.",
  systems: [
    { id: "brain", name: "Brain", text: "Steering a living animal means reading, deciding and correcting every second, with calm hands and clear intent.", evidence: "Supported", note: "In a randomised trial, children in a 12-week horse programme had lower stress-hormone levels than a wait-list group (Pendry et al., 2014)." },
    { id: "spine", name: "Spine", text: "To stay balanced the rider stacks head over shoulders over hips. Slouch, and the horse feels it.", evidence: "Supported", note: "Riding-posture biomechanics." },
    { id: "muscle", name: "Muscle", text: "Deep core, back and inner-thigh muscles work the whole session to absorb the stride.", evidence: "Supported", note: "Hippotherapy research on the horse's walk and the rider's trunk." },
    { id: "heart", name: "Heart", text: "Trot and canter raise the heart rate into a training zone without the pounding of court sports.", evidence: "Emerging", note: "BSAH is collecting session heart-rate data." },
  ],
};

export const crisis = {
  inscription: "Digital fragility",
  voice: "is a choice.",
  body: "Screens fold a child's spine and scatter attention. A horse asks for the opposite: presence, poise and a quiet mind.",
  pairs: [
    ["Tech-neck slouch", "Regal carriage"],
    ["The endless scroll", "Stoic composure"],
    ["Alone behind glass", "A living partner"],
    ["App badges", "A sealed passport"],
  ],
};

export const doors = {
  inscription: "Three ways",
  voice: "through the gate.",
  items: [
    {
      who: "Parents", title: "The Guardian", image: "parentsRail" as MediaKey, href: "/parents", cta: "For parents",
      points: ["Watch your child's stallion on a 24/7 stall-cam", "An alert the second their passport is scanned at the gate", "A 10-second milestone reel after every session"],
    },
    {
      who: "Cadets", title: "The Hall of Valour", image: "cadetZayd" as MediaKey, href: "/cadets", cta: "For cadets",
      points: ["A leather Sovereign Passport, sealed in brass", "Your own Marwari, for years", "The STPCI national circuit"],
    },
    {
      who: "Schools", title: "The Zero-CapEx Engine", image: "schoolAerial" as MediaKey, href: "/schools", cta: "For schools",
      points: ["A turnkey arena, funded, built and run by BSAH", "25–30% of tuition back to the school, settled quarterly", "Ex-cavalry faculty, no burden on your staff"],
    },
  ],
};

export const ledger = {
  inscription: "Four ranks.",
  voice: "Thirteen pillars.",
  body: "Nine foundations of horsemanship, four BSAH tactical disciplines. Every drill maps to a trait a leader needs, and the ledger records each step from Squire to Sovereign Lancer.",
};

export const studbook = { inscription: "Twenty-one stallions.", voice: "Every one has a name." };

export const schoolsTeaser = {
  inscription: "Your campus",
  voice: "becomes a citadel.",
  body: "Zero capital expenditure to the school board. BSAH funds, builds and operates the arena, and returns 25–30% of tuition to the school.",
};

export const verifier = {
  inscription: "Every hour",
  voice: "sealed in brass.",
  body: "Admissions officers and federations can check a cadet's rank, hours and EFI registration in seconds.",
};

export const circuit = { inscription: "Lances down.", voice: "Schools at war.", cup: { name: "Sovereign Governor's Cup", date: "2026-11-14T09:00:00+05:30", place: "Hyderabad" } };

export const shield = {
  inscription: "Safety",
  voice: "before speed.",
  columns: [
    { big: "Ex-cavalry", line: "Instructors from Indian Army RVC and NCC cavalry units." },
    { big: "Daily", line: "Hoof, feed and hydration checks for every stallion, every day." },
    { big: "Cover", line: "Accident-insurance terms are being confirmed and will be published here." },
  ],
};

export const command = {
  inscription: "Ask the",
  voice: "command terminal.",
  question: "What is the safety record for Cadet Lancer drills?",
  answer: "BSAH describes certified helmets for every mounted minute, impact-reduction vests for jumping and lance work, and an ex-cavalry supervisor on every mounted drill. Injury records and insurance cover are not published yet: they are being confirmed, and no figures are shown until they are.",
  chips: ["CapEx & revenue share", "STPCI accreditation", "Curriculum & class timings"],
};

export const chronicle = { inscription: "Stories", voice: "from the stable." };

export const finale = {
  inscription: "The arena is open.",
  voice: "Your cadet's legacy begins today.",
  ctas: [
    { label: "Enrol a cadet", href: "/contact?gate=parents" },
    { label: "Partner your campus", href: "/contact?gate=schools" },
    { label: "Schedule a board audit", href: "/contact?gate=audit" },
  ],
};
