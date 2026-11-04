/**
 * Reel 02 · The Instrument. Hotspot positions are % of the anatomyProfile frame
 * (horse in side profile facing right). Tune them after the final photograph lands.
 */

export type Hotspot = {
  id: string;
  name: string;
  title: string;
  short: string;
  trains: string;
  /** HUD telemetry metric (Directive 04 §2). */
  metric: string;
  x: number;
  y: number;
  layers: { equine: string; rider: string; builds: string; legend: string };
};

export const hotspots: Hotspot[] = [
  {
    id: "ears", name: "Ears", title: "180° of Attention", x: 71, y: 10, metric: "180° Independent Acoustic Swivel",
    short: "The lyre-shaped ears swivel independently toward sound and movement. A horse that is listening is a horse that is paying attention, and its ears show it first.", trains: "Composure & Active Environmental Reading",
    layers: {
      equine: "Lyre-shaped ears turn through 180° and track sound independently.",
      rider: "Your breathing and tension are audible to the horse; they force the cadet into total physical stillness and emotional composure.",
      builds: "Emotional self-governance",
      legend: "Riders trusted the ears to point toward danger in the dark.",
    },
  },
  {
    id: "neck", name: "Neck", title: "The Crest", x: 62, y: 19, metric: "Cervical Biomechanical Lever",
    short: "High-carried and muscularly dense, the neck is a dynamic counterweight across shifting sand, teaching subtle balance shifts over brute force.", trains: "Poise & Dynamic Weight Distribution",
    layers: {
      equine: "High-carried, arching and muscularly dense: a dynamic counterweight engineered for rapid weight shifts across shifting dunes.",
      rider: "A level, soft neck asks for a level rider: head stacked over spine.",
      builds: "Carriage and presence",
      legend: "Stablemen judged a horse's readiness by how it carried its neck.",
    },
  },
  {
    id: "saddle", name: "Saddle", title: "The Moving Floor", x: 47, y: 29, metric: "Pelvic Kinematics: 3D Core Realignment",
    short: "At a walk the horse moves your pelvis in three dimensions, close to the pattern of human walking.", trains: "Core and balance",
    layers: {
      equine: "The back carries the stride straight into the rider's seat.",
      rider: "At a walk, about a hundred rhythmic three-dimensional movements a minute reach the pelvis, close to human walking.",
      builds: "Core strength and balance",
      legend: "Rajput riders trained bareback to build a seat that never moved.",
    },
  },
  {
    id: "flank", name: "Flank", title: "Legs that steer", x: 39, y: 46, metric: "MICRO-PRESSURE STEERING INTERFACE",
    short: "The lightest leg pressure turns the horse. Hands stay free for the lance.", trains: "Precision without force",
    layers: {
      equine: "Sensitive skin and muscle answer the lightest leg pressure.",
      rider: "Steering with the legs needs inner-thigh strength and quiet control.",
      builds: "Precision without force",
      legend: "A rider with a lance in one hand steers with the legs alone.",
    },
  },
  {
    id: "reins", name: "Reins", title: "Ten Grams", x: 74, y: 30, metric: "LIGHT-CONTACT INTERFACE",
    short: "The lightest steady contact is the whole conversation with half a tonne of horse. Shouting does nothing.", trains: "Precise communication",
    layers: {
      equine: "A mouth that answers very light, steady contact.",
      rider: "Hands, seat and legs must agree; both sides of the body coordinate.",
      builds: "Clear, calm communication",
      legend: "Ten grams turn half a tonne.",
    },
  },
  {
    id: "hoof", name: "Hoof", title: "Desert Feet", x: 58, y: 89, metric: "DESERT-BRED SUSPENSION & CADENCE",
    short: "Hard, upright hooves bred to lift clean out of sand.", trains: "Rhythm and timing",
    layers: {
      equine: "The fetlock flexes like a spring; desert hooves are hard and upright.",
      rider: "Heels down, ankles soft: the rider absorbs the stride through the leg.",
      builds: "Rhythm and timing",
      legend: "Marwar's horses crossed soft sand on bare hooves.",
    },
  },
];

export const layerNames = [
  { key: "equine", label: "Equine science" },
  { key: "rider", label: "Rider" },
  { key: "builds", label: "What it builds" },
  { key: "legend", label: "From the legend" },
] as const;

/**
 * The home plate's detail panel: five nodes on the 3D stallion (Reel 02 · The Instrument).
 * `id` matches a `hotspots` id and a region in components/sections/anatomy/Anatomy3DHorse.tsx.
 * Wording follows the claims ledger (Blueprint Part 9): ears, "about a hundred" pelvic moves, one cited trial,
 * "upright, stacked posture", "deep core, back and inner-thigh muscles", "low impact on knees and ankles".
 * Folklore sits only in `legend`, which the panel labels as told. No figures beyond the ledger's (no BPM, no gram tensions).
 */
export type InstrumentNode = {
  id: string;
  /** Label on the marker and the panel header. */
  name: string;
  /** The named structure, shown beside the name. */
  region?: string;
  title: string;
  /** The part and its anatomy. */
  anatomy: string;
  /** What it teaches the rider (somatic impact). */
  teaches: string;
  /** What it builds. */
  benefit: string;
  /** Folklore, told as such. */
  legend: string;
  /** A cited finding, shown small under the rows. */
  evidence?: { text: string; cite: string };
};

export const instrumentNodes: InstrumentNode[] = [
  {
    id: "ears", name: "Ears", title: "180° of Attention",
    anatomy: "Lyre-shaped ears that curve inward until the tips touch, and rotate through 180°, each one on its own.",
    teaches: "A horse reads its rider's breathing and tension and answers it. The cadet learns to settle their own breath first, because the ears show at once when it has not.",
    benefit: "Composure, and the habit of noticing before reacting.",
    legend: "Marwar riders are said to have watched the ears at night, trusting them to turn toward ambushers in the dark.",
    evidence: {
      text: "In one randomised trial, children in a 12-week horse programme had lower stress-hormone levels than a wait-list group.",
      cite: "Pendry, Smith & Roeter, Human-Animal Interaction Bulletin, 2014",
    },
  },
  {
    id: "neck", name: "Neck", region: "Cervical crest", title: "The Crest",
    anatomy: "The high, arched crest of the neck, carried on the cervical vertebrae. The horse uses it as a counterweight to stay balanced when it turns or changes pace.",
    teaches: "A soft, level neck asks for a level rider: head stacked over the spine, not pushed forward. The cadet learns to shift balance with small movements, not force.",
    benefit: "Trains an upright, stacked posture: head over shoulders over hips, held lightly rather than rigidly.",
    legend: "Stablemen in Marwar are said to have judged a horse's readiness by how it carried its neck.",
  },
  {
    id: "saddle", name: "Saddle spine", region: "Thoracic axis", title: "The Moving Floor",
    anatomy: "The thoracic spine under the saddle: the line of the back that carries each stride from the hindquarters forward into the rider's seat.",
    teaches: "At a walk the horse moves the rider's pelvis in three dimensions about a hundred times a minute, close to the pattern of human walking. The cadet learns to follow it with a soft, stacked spine instead of bracing against it.",
    benefit: "Works the deep core, back and inner-thigh muscles at a steady, moderate effort.",
    legend: "Rajput riders are said to have learned their seat bareback, until it never seemed to move.",
  },
  {
    id: "flank", name: "Flank", title: "Legs that Steer",
    anatomy: "The barrel behind the ribs, where the rider's lower leg rests. The skin and muscle here answer the lightest leg pressure.",
    teaches: "Steering with the legs needs strong, quiet inner thighs and a still pelvis. Squeezing harder only stiffens the horse, so the cadet learns precision in place of force.",
    benefit: "Precision without force, from the deep core and inner-thigh muscles working together.",
    legend: "Marwar horses are said to have been trained to answer thigh pressure, so the rider's hands stayed free for the lance.",
  },
  {
    id: "hoof", name: "Fetlock & hoof", title: "Desert Feet",
    anatomy: "The fetlock joint flexes like a spring above a hard, upright hoof, and together they take each stride into the ground.",
    teaches: "Heels down, ankles soft: the rider absorbs the stride through the leg and keeps time with the horse's rhythm.",
    benefit: "Rhythm and timing, with low impact on knees and ankles.",
    legend: "Stories from Marwar say the horses crossed soft sand with no iron shoes at all.",
  },
];

export const nodeLabels = {
  anatomy: "The part",
  teaches: "What it teaches the rider",
  benefit: "What it builds",
  legend: "Legend, as told",
} as const;

export const breedStandard = [
  { k: "Origin", v: "Marwar, Rajasthan, India" },
  { k: "Height", v: "Stallions average about 150 cm (14.3 hands)" },
  { k: "Ears", v: "Medium, curving inward until the tips touch; turn through 180°" },
  { k: "Gait", v: "A natural ambling gait called the revaal" },
  { k: "Colours", v: "All colours; bay most common, grey most prized" },
  { k: "Temperament", v: "Brave, loyal, alert" },
  { k: "Registry", v: "Marwari Horse Society; government-authorised registration since 2009" },
  { k: "Status", v: "Not at risk" },
];
