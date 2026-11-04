import type { MediaKey } from "./media";

/**
 * The art of the peg: one run in four stages (Tournaments, S63 Peg run).
 * Checked 4 Nov 2026 against the ITPF Tent Pegging Rules (2019): lance 2.2 to 2.75 m (up to 9 ft), peg 30 cm long and 2.5 cm thick, 6 / 4 / 2.5 cm wide by stage,
 * 80 m from start to finish line. No speed is quoted: the rules give a time allowed, not a speed. All distances indicative. No timing claims.
 */
export type PegStage = { n: string; key: string; name: string; at: string; image: MediaKey; text: string; mark: number };

export const pegStages: PegStage[] = [
  {
    n: "01",
    key: "approach",
    name: "Approach",
    at: "0–60 m",
    image: "pegApproach",
    text: "The horse settles into the gallop down the lane. The lance stays upright at the shoulder; the eyes find the peg and do not leave it.",
    mark: 0.22,
  },
  {
    n: "02",
    key: "align",
    name: "Align",
    at: "60–90 m",
    image: "pegAlign",
    text: "The lance comes down in one smooth arc and points at the peg. Seat still, hand quiet, horse straight.",
    mark: 0.68,
  },
  {
    n: "03",
    key: "lift",
    name: "Lift",
    at: "The peg",
    image: "pegLift",
    text: "At the gallop the point meets a peg only a few centimetres wide. The rider aims; the horse's speed does the lifting.",
    mark: 0.88,
  },
  {
    n: "04",
    key: "carry",
    name: "Carry",
    at: "Past the line",
    image: "pegCarry",
    text: "Carry the peg on the lance well past the peg for full points. Drop it early and the score drops with it.",
    mark: 0.97,
  },
];

export const pegIntro = {
  label: "The discipline",
  inscription: "The art of",
  voice: "the peg.",
  body: "Tent pegging is an old cavalry skill. Tradition says cavalry riders galloped at an enemy camp and lifted its tent pegs on the point of a lance; reliable accounts of this are few. It is an old mounted skill of the Indian subcontinent and today a sport of nerve and timing.",
  note: "Lance up to 9 ft · peg a few cm wide · about 80 m from start to finish line. Distances indicative.",
};

export const pegVirtues = ["Speed · Timing · Control · Precision", "Seat · Eye · Hand · Nerve"];

/**
 * A cadet's morning in four chapters (Parents, S68 Curtain day). Times are SAMPLE, laid on the published Dawn Patrol
 * batch (06:15–07:00, 45-minute session protocol in lib/content/curriculum.ts); each hub sets its own.
 */
export const academyDay = [
  { image: "dayTack" as MediaKey, time: "06:15", title: "Tack up before the sun.", line: "Every cadet saddles their own horse. Girth, stirrups, bridle: checked twice, then checked by an instructor." },
  { image: "dayWalk" as MediaKey, time: "06:20", title: "Walk them in.", line: "Horses are led to the arena, never hurried. The walk is where the horse and the rider settle." },
  { image: "dayBrief" as MediaKey, time: "06:25", title: "Hear the plan.", line: "A former cavalry instructor sets the drill and the one thing to fix today. Then the cadets mount." },
  { image: "dayGroom" as MediaKey, time: "06:50", title: "Thank the horse.", line: "The session ends where it began, in the stable. Brush, water, a hand on the neck." },
];

/** The academy in frames (About, S69 Depth ribbon). */
export const academyFrames: { image: MediaKey; caption: string; code: string }[] = [
  { image: "dayWalk", caption: "Walking in at first light", code: "F.01" },
  { image: "currGroundcare", caption: "Hooves before hands", code: "F.02" },
  { image: "dayBrief", caption: "The drill, set by an instructor", code: "F.03" },
  { image: "currFormation", caption: "Riding a straight line together", code: "F.04" },
  { image: "pegLift", caption: "The peg, lifted", code: "F.05" },
  { image: "dayGroom", caption: "The quiet after", code: "F.06" },
];
