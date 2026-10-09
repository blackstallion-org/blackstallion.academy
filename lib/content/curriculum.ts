import type { MediaKey } from "./media";

/** Reel 05 · The Ledger. Blueprint Part 6, R05. */

export type RankId = "squire" | "rider" | "knight" | "lancer";

export const ranks: { id: RankId; numeral: string; name: string; short: string; detail: string; pillars: number[] }[] = [
  { id: "squire", numeral: "I", name: "Cadet Squire", short: "Ground care and trot", detail: "Ground care, grooming, leading, mounting, walk and trot.", pillars: [1, 2, 3] },
  { id: "rider", numeral: "II", name: "Cadet Rider", short: "Independent canter", detail: "Independent canter, terrain transitions, first jumps, settling a spooked horse.", pillars: [4, 5, 6] },
  { id: "knight", numeral: "III", name: "Cadet Knight", short: "Cavalry drills", detail: "Formation riding, riding without reins, recovering after a fall.", pillars: [7, 8, 9] },
  { id: "lancer", numeral: "IV", name: "Sovereign Lancer", short: "National competition", detail: "Tent pegging at speed, composure at the gallop, the STPCI national circuit.", pillars: [10, 11, 12] },
];

export const pillars = [
  { n: 1, name: "Grooming & feeding", drill: "Hands-on stall care, hoof picking, feed prep", trait: "Radical humility & duty", lead: "Serving the team before oneself", body: "Calm, non-verbal empathy" },
  { n: 2, name: "Posture", drill: "Cervical stacking, core holds", trait: "Regal carriage & poise", lead: "Presence in any room", body: "An upright, stacked spine" },
  { n: 3, name: "Breath & calm", drill: "Breath synced to the stride", trait: "Emotional self-governance", lead: "Composure in a crisis", body: "Slower breathing and heart rate" },
  { n: 4, name: "Terrain transitions", drill: "Walk-to-trot, trot-to-canter", trait: "Adaptive agility", lead: "Balance when conditions shift", body: "Balance and spatial sense" },
  { n: 5, name: "Obstacle jumping", drill: "Timing and forward seat", trait: "Calculated risk", lead: "Deciding under pressure", body: "Cardio with low joint impact" },
  { n: 6, name: "De-escalation", drill: "Settling a spooked horse without force", trait: "Diplomatic command", lead: "Resolving conflict with calm intent", body: "Staying calm under adrenaline" },
  { n: 7, name: "Cavalry drills", drill: "Synchronised formation riding", trait: "Collective coordination", lead: "Executing as one team", body: "Rhythm and spatial awareness" },
  { n: 8, name: "Unspoken trust", drill: "Riding without reins, seat cues only", trait: "Deep mutual trust", lead: "Leading by delegation", body: "Coordination of both sides of the body" },
  { n: 9, name: "Setback recovery", drill: "Remounting after a fall, supervised", trait: "Resilience", lead: "Recovering from failure without drama", body: "Confidence after fear" },
  { n: 10, name: "Lance precision", drill: "Piercing 6 cm pegs at speed", trait: "Focal precision", lead: "Focus amid distraction", body: "Hand-eye timing" },
  { n: 11, name: "Composure at speed", drill: "Steady breath at the gallop", trait: "High-pressure serenity", lead: "Calm in high-stakes moments", body: "Breath control under load" },
  { n: 12, name: "Sovereign governance", drill: "Quiet command of a 500 kg stallion", trait: "Unforced authority", lead: "Leading with integrity and clarity", body: "Whole-body poise" },
];

export const classSegments = [
  { from: 0, to: 15, title: "Ground stable care", detail: "Hoof inspection, tack check, grooming, feeding check, settling the heart rate.", mounted: false },
  { from: 15, to: 20, title: "Mounted breath alignment", detail: "Breathing with the stride until horse and rider settle.", mounted: true },
  { from: 20, to: 30, title: "Trot and canter posture drills", detail: "Stacked spine, quiet hands, heels down.", mounted: true },
  { from: 30, to: 40, title: "Lance, archery or barrel runs", detail: "The discipline of the day, at the cadet's rank.", mounted: true },
  { from: 40, to: 45, title: "Cool-down and debrief", detail: "Walk out, untack, grades enter the ledger.", mounted: false },
];

/** SAMPLE timings; confirm per hub. */
export const batches = [
  { name: "Dawn", time: "06:00–06:45", days: "Mon · Wed · Fri", who: "Juniors 8–11" },
  { name: "After school", time: "16:00–16:45", days: "Tue · Thu", who: "Intermediates 12–14" },
  { name: "Weekend", time: "07:00–07:45", days: "Sat · Sun", who: "All ranks" },
  { name: "Lancer squad", time: "15:00–17:00", days: "Sat", who: "Knights & Lancers, competition" },
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
