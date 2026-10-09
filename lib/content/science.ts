/** Reel 03 · The Matrix and Reel 04 · Crisis & Cure. Claims follow the ledger in Blueprint Part 9. */

export type Evidence = "Supported" | "Emerging" | "Not yet published";

export const statusColor: Record<Evidence, string> = { Supported: "text-gold", Emerging: "text-sand", "Not yet published": "text-blood" };

export const systems = [
  {
    id: "brain",
    name: "Brain & nerves",
    short: "Brain",
    points: [
      "Reading a moving animal at speed means constant small decisions.",
      "Slow breathing settles the horse, so the rider is rewarded for self-control.",
      "Hands and legs give different signals at once, coordinating both sides of the body.",
    ],
    evidence: [
      { status: "Supported" as Evidence, text: "Lower stress-hormone levels after a 12-week horse programme (randomised trial, Pendry et al., 2014)." },
      { status: "Emerging" as Evidence, text: "Bilateral coordination benefits." },
    ],
  },
  {
    id: "spine",
    name: "Spine & posture",
    short: "Spine",
    points: [
      "Balance on a horse needs head, shoulders and hips on one axis.",
      "The walk moves the pelvis the way human walking does, without feet striking a hard floor.",
      "The inner-ear balance system works every stride.",
    ],
    evidence: [{ status: "Supported" as Evidence, text: "Hippotherapy gait research (American Hippotherapy Association)." }],
  },
  {
    id: "muscle",
    name: "Muscles",
    short: "Muscle",
    points: ["Deep spinal stabilisers and the abdominal wall work continuously.", "Inner thighs and glutes hold the seat.", "Grip and fine hand control steer."],
    evidence: [{ status: "Supported" as Evidence, text: "Rider biomechanics literature." }],
  },
  {
    id: "heart",
    name: "Heart & lungs",
    short: "Heart",
    points: [
      "Trot and canter raise the heart rate into a training zone.",
      "Breath must stay slow and deep or the horse gets anxious.",
      "Low impact on knees and ankles: the horse takes the ground.",
    ],
    evidence: [{ status: "Emerging" as Evidence, text: "BSAH is collecting session heart-rate data." }],
  },
] as const;

export const comparison = {
  cols: ["20-min BSAH session", "40-min court sport"],
  rows: [
    { k: "Stress", a: "Calm is required for the horse to cooperate", b: "Adrenaline spikes; calm isn't required" },
    { k: "Posture", a: "Upright, stacked spine for the whole session", b: "Repeated forward hunching and twisting" },
    { k: "Core", a: "Deep stabilisers work continuously", b: "Major limb muscles; deep core less engaged" },
    { k: "Joints", a: "Low impact; the horse absorbs the ground", b: "Repeated hard landings on court surfaces" },
    { k: "Empathy", a: "A living partner to read and care for", b: "Fast reflexes, no partner to read" },
  ],
  note: "This compares what each activity demands, not measured outcomes. BSAH is collecting session data to measure outcomes.",
};

export const claims: { claim: string; status: Evidence; source: string; href?: string }[] = [
  { claim: "Horse programmes can lower children's stress hormones", status: "Supported", source: "Pendry, Smith & Roeter, Human-Animal Interaction Bulletin, 2014 (randomised, 12 weeks, grades 5–8)", href: "https://www.sciencedaily.com/releases/2014/04/140424170556.htm" },
  { claim: "A horse's walk moves the rider's pelvis about a hundred times a minute, like human gait", status: "Supported", source: "American Hippotherapy Association", href: "https://www.americanhippotherapyassociation.org/" },
  { claim: "Riding demands an upright, stacked posture and continuous core work", status: "Supported", source: "Rider biomechanics literature" },
  { claim: "Riding is low impact on knees and ankles compared with court sports", status: "Emerging", source: "Activity comparison; BSAH data collection under way" },
  { claim: "Heart rate reaches a training zone during trot and canter", status: "Emerging", source: "BSAH session heart-rate logging (in progress)" },
  { claim: "Precise percentage drops in cortisol or counts of muscles activated", status: "Not yet published", source: "No source we can stand behind yet; not used on this site" },
];

export const why = {
  title: { inscription: "Digital fragility", voice: "is a choice.", sub: "Character is forged in the arena." },
  glass: {
    inscription: "The glass",
    voice: "that folds a child.",
    body: "Hours bent over a screen round the shoulders, push the head forward and train attention to jump every few seconds. None of it asks a child to be calm, brave or present.",
    notifications: ["12 new messages", "You've been on for 3 hrs", "Streak lost", "4 new videos", "Battery 9%", "Are you still watching?", "Someone mentioned you", "Your daily summary is ready"],
  },
  slider: {
    inscription: "Drag from",
    voice: "crisis to cure.",
    table: [
      { k: "Physical", a: "Tech-neck slouch", b: "Regal spinal posture" },
      { k: "Focus", a: "Dopamine burnout", b: "Stoic composure" },
      { k: "Connection", a: "Screen isolation", b: "Equine bond" },
      { k: "Credentials", a: "A generic app log", b: "An EFI/STPCI-verified passport" },
    ],
  },
  sanctuary: [
    "A horse does not care about your title, your marks or your family name. It cannot be bought or flattered. It answers only the truth of how you feel.",
    "To command the horse, the cadet must first command themselves.",
  ],
  train: {
    inscription: "What we",
    voice: "train for.",
    items: [
      "Standing tall without being told",
      "Breathing slowly when something goes wrong",
      "Getting back on after a fall",
      "Caring for an animal before themselves",
      "Speaking clearly and quietly",
      "Showing up at six because a horse is waiting",
    ],
  },
};
