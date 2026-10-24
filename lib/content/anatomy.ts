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
