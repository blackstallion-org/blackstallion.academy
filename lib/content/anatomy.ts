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
  x: number;
  y: number;
  layers: { equine: string; rider: string; builds: string; legend: string };
};

export const hotspots: Hotspot[] = [
  {
    id: "ears", name: "Ears", title: "180° of attention", x: 71, y: 10,
    short: "They swivel to track your breathing. Tense up and they flick back.", trains: "Composure",
    layers: {
      equine: "Lyre-shaped ears turn through 180° and track sound independently.",
      rider: "Your breathing and tension are audible to the horse; calm breath settles it.",
      builds: "Emotional self-governance",
      legend: "Riders trusted the ears to point toward danger in the dark.",
    },
  },
  {
    id: "neck", name: "Neck", title: "The crest", x: 62, y: 19,
    short: "A level neck asks for a level rider: chin up, shoulders stacked.", trains: "Carriage",
    layers: {
      equine: "A strong ligament along the crest carries the head.",
      rider: "A level, soft neck asks for a level rider: head stacked over spine.",
      builds: "Carriage and presence",
      legend: "Stablemen judged a horse's readiness by how it carried its neck.",
    },
  },
  {
    id: "saddle", name: "Saddle", title: "The moving floor", x: 47, y: 29,
    short: "At a walk the horse moves your pelvis in three dimensions, close to the pattern of human walking.", trains: "Core and balance",
    layers: {
      equine: "The back carries the stride straight into the rider's seat.",
      rider: "At a walk, about a hundred rhythmic three-dimensional movements a minute reach the pelvis, close to human walking.",
      builds: "Core strength and balance",
      legend: "Rajput riders trained bareback to build a seat that never moved.",
    },
  },
  {
    id: "flank", name: "Flank", title: "Legs that steer", x: 39, y: 46,
    short: "The lightest leg pressure turns the horse. Hands stay free for the lance.", trains: "Precision without force",
    layers: {
      equine: "Sensitive skin and muscle answer the lightest leg pressure.",
      rider: "Steering with the legs needs inner-thigh strength and quiet control.",
      builds: "Precision without force",
      legend: "A rider with a lance in one hand steers with the legs alone.",
    },
  },
  {
    id: "reins", name: "Reins", title: "Ten grams", x: 74, y: 30,
    short: "A few grams of pressure turns half a tonne. Shouting does nothing.", trains: "Precise communication",
    layers: {
      equine: "A mouth that answers a few grams of contact.",
      rider: "Hands, seat and legs must agree; both sides of the body coordinate.",
      builds: "Clear, calm communication",
      legend: "Ten grams turn half a tonne.",
    },
  },
  {
    id: "hoof", name: "Hoof", title: "Desert feet", x: 58, y: 89,
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
