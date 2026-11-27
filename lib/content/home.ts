import type { MediaKey } from "./media";

/** R00 · The Trailer. Copy from Blueprint Part 6 (home). */

export const hero = {
  badge: "Governed by the School Tent Pegging Council of India",
  frames: [
    { inscription: "We do not teach", voice: "children to ride." },
    { inscription: "We forge them", voice: "to lead." },
  ],
  /** The doctrine as one statement (two sentences, read together). */
  statement: ["We do not teach children to ride.", "We forge them to lead."],
  /** The line over the doctrine (owner's hero copy, 27 Nov 2026). */
  quote: "Five hundred kilograms of living power teaches what no classroom can: stillness commands strength.",
  sub: "A structured, syllabus-driven equestrian and character academy for premier schools—combining horsemanship, ex-cavalry discipline, and STPCI/EFI competitive pathways.",
  /** The second paragraph under the doctrine. */
  audience: "Built for ambitious young cadets, reassuring for safety-first parents, and engineered as a turnkey leadership and sporting asset for partner schools—where every session turns nervous energy into calm authority.",
  ctas: [
    { label: "Watch the Legend", href: "/legend" },
    { label: "Find Your Campus", href: "/schools#hubs" },
  ],
  stats: [
    { value: "13", label: "pillars of character, drilled in the saddle" },
    { value: "25–30%", label: "of tuition back to partner schools" },
    { value: "Same day", label: "session notes shared with parents in the BSAH app" },
  ],
  /** The three pillars under the buttons (owner's hero copy, 27 Nov 2026). `stats` above stays for the figures on other pages. */
  pillars: [
    { n: "01", title: "The Horse", text: "Trained school-masters, Marwari heritage, and ethical welfare at every step." },
    { n: "02", title: "The Riding", text: "Four progressive cadet ranks from first balance to interscholastic tent pegging." },
    { n: "03", title: "The Self", text: "Composure under pressure, breath control, and accountability that carry beyond the arena." },
  ],
  /** One line for each of the three audiences. */
  forWhom: [
    { who: "For cadets", text: "Earn your rank, master your balance, and carry a calm head into every arena." },
    { who: "For parents", text: "Certified safety gear, trained school mounts, ex-cavalry supervision, and clear progress tracking." },
    { who: "For schools", text: "A prestigious on-campus leadership program with zero operational headache and competitive STPCI/EFI pathways." },
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
  inscription: "Several hundred kilograms",
  voice: "that read you first.",
  body: "Every part of the Marwari teaches the rider something. Choose a point on the plate.",
  points: ["ears", "neck", "saddle", "flank", "hoof"],
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
      points: ["Every session written up in the BSAH app the same day", "An alert when their passport is scanned at the gate (planned)", "Progress, attendance and milestones in one place"],
    },
    {
      who: "Cadets", title: "The Hall of Valour", image: "cadetZayd" as MediaKey, href: "/cadets", cta: "For cadets",
      points: ["A leather Sovereign Passport, sealed in brass", "Your own Marwari, for years", "The STPCI national circuit"],
    },
    {
      who: "Schools", title: "The Campus Partnership", image: "schoolAerial" as MediaKey, href: "/schools", cta: "For schools",
      points: ["The school builds the arena; BSAH runs the programme", "25–30% of tuition back to the school, settled quarterly", "Ex-cavalry training and programme management by BSAH"],
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
  body: "The school finances and builds the arena; BSAH brings the programme, the training and the management, and returns 25–30% of tuition to the school.",
};

export const verifier = {
  inscription: "Every hour",
  voice: "sealed in brass.",
  body: "Admissions officers and federations can check a cadet's rank, hours and EFI registration in seconds.",
};

export const circuit = { inscription: "Lances down.", voice: "Zones on the circuit.", cup: { name: "Sovereign Governor's Cup", date: "2026-11-14T09:00:00+05:30", place: "Hyderabad" } };

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

export const chronicle = { inscription: "The traditional", voice: "lore." };

export const finale = {
  inscription: "The arena is open.",
  voice: "Your cadet's legacy begins today.",
  ctas: [
    { label: "Enrol a cadet", href: "/contact?gate=parents" },
    { label: "Partner your campus", href: "/contact?gate=schools" },
    { label: "Schedule a board audit", href: "/contact?gate=audit" },
  ],
};

/** Atelier moodboard: the academy's materials and colours (art direction, not a claim). */
export const atelier = {
  label: "The house palette",
  inscription: "Leather, brass,",
  voice: "and the horse.",
  body: "Every colour on this site comes from the stable: ivory linen, parchment, saddle leather, chestnut coats and the charcoal of a stall at night.",
  tiles: [
    { key: "journalReins" as MediaKey, slot: "a" },
    { key: "eye" as MediaKey, slot: "b" },
    { key: "legendChetak" as MediaKey, slot: "c" },
    { key: "rearing" as MediaKey, slot: "d" },
    { key: "cadetRohan" as MediaKey, slot: "e" },
  ],
  /** Brand colours (tokens in app/globals.css). */
  swatches: [
    { name: "Ivory", className: "bg-ivory" },
    { name: "Leather", className: "bg-leather" },
    { name: "Charcoal", className: "bg-charcoal" },
    { name: "Chestnut", className: "bg-chestnut" },
    { name: "Caramel", className: "bg-caramel" },
  ],
};

/** Replaces the public colour-palette moodboard (2 Nov 2026): one photograph and a short story. */
export const horseFirst = {
  label: "The first lesson",
  inscription: "Before the saddle,",
  voice: "the horse.",
  body: "In Marwar a horseman's first lesson is to stand beside his horse until it is at ease with him. Every cadet begins the same way: grooming, leading, listening. Riding comes after.",
  cta: { label: "Meet the stallions", href: "/fleet" },
};
