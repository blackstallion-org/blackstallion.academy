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
    { value: "12", label: "pillars of character, drilled in the saddle" },
    { value: "25–30%", label: "of tuition back to partner schools" },
    { value: "24/7", label: "stall-cam for every parent" },
  ],
  /** SAMPLE live figures. */
  ticker: ["BSAH National Command", "Hours logged 1,480", "Canter transitions passed 342", "Active stallions 21", "Hubs live 3", "Next: Governor's Cup · 14 Nov"],
};

export const story = {
  inscription: "Eight hundred years",
  voice: "in one bloodline.",
  frames: [
    { kicker: "Born of the ocean", text: "The old stories tell of a seven-headed white horse rising from the churning sea. Every horse, the bards say, descends from him.", image: "legendOcean" as MediaKey },
    { kicker: "Marwar, 1193", text: "Driven from Kannauj, the Rathores rode into the Thar. Their horses learned to live on a cup of water.", image: "legendExodus" as MediaKey },
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
      who: "Schools", title: "The CapEx Engine", image: "schoolAerial" as MediaKey, href: "/schools", cta: "For schools",
      points: ["A turnkey arena, designed, built and run by BSAH", "25–30% of tuition back to the school", "Ex-cavalry faculty, no burden on your staff"],
    },
  ],
};

export const ledger = {
  inscription: "Four ranks.",
  voice: "Twelve pillars.",
  body: "Every mounted drill maps to a trait a leader needs. Climb from Squire to Lancer and the ledger records each step.",
};

export const studbook = { inscription: "Twenty-one stallions.", voice: "Every one has a name." };

export const schoolsTeaser = {
  inscription: "Your campus",
  voice: "becomes a citadel.",
  body: "You fund the arena. We design, build and run it, and return 25–30% of tuition to the school.",
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
    { big: "₹10 L", line: "Group accident insurance for every active cadet." },
  ],
};

export const command = {
  inscription: "Ask the",
  voice: "command terminal.",
  question: "What is the safety record for Cadet Lancer drills?",
  answer: "BSAH requires certified helmets and vests and an ex-cavalry spotter on every mounted drill. No major injuries logged across 1,480 horsemanship hours. (Sample figure.)",
  chips: ["Payback for 150 cadets", "Insurance cover", "Who are the instructors?"],
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
