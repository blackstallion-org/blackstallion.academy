"use client";

import { OsmoLoopingSelector, type LoopingItem } from "@/components/sections/shared/OsmoLoopingSelector";

const BREED_ITEMS: LoopingItem[] = [
  {
    id: "purebred-marwari",
    num: "01",
    title: "Purebred Marwari",
    subtitle: "Ancestral inward lyre ears · 800-year battleline composure",
    badge: "ISO 11784",
    detail: "Bred by Rathore Rajputs in the Thar Desert. Celebrated for unwavering battlefield courage, intuitive homing sense, and inward-curving ear tips that touch.",
    meta: "ORIGIN: MARWAR, 1193 AD",
  },
  {
    id: "kathiawari-cavalry",
    num: "02",
    title: "Kathiawari Charger",
    subtitle: "The revaal pace gait · Lightning tent-pegging precision",
    badge: "CAVALRY LINE",
    detail: "Compact, intensely nimble charger from the Kathiawar peninsula. Famous for the rapid lateral pace (revaal) that maintains absolute saddle stability at 45 km/h.",
    meta: "GAIT: LATERAL REVAAL",
  },
  {
    id: "marwari-ablak",
    num: "03",
    title: "Marwari Ablak",
    subtitle: "Rare skewbald warrior pattern · Silver parade harness",
    badge: "WARRIOR ABLAK",
    detail: "Distinguished by striking dual-tone piebald or skewbald markings. Traditionally chosen for squadron commanders to remain instantly recognizable through desert dust.",
    meta: "PATTERN: CEREMONIAL PIEBALD",
  },
  {
    id: "sindhi-heritage",
    num: "04",
    title: "Sindhi Heritage",
    subtitle: "High-heat desert endurance · Deep thoracic stamina",
    badge: "DESERT PROVEN",
    detail: "Forged in the extreme climate of the lower Indus basin. Exceptional lung volume and dense cannon bones that resist fatigue over endless sand terrain.",
    meta: "ENDURANCE: 60+ KM/DAY",
  },
];

const COAT_ITEMS: LoopingItem[] = [
  {
    id: "coat-bhanwar",
    num: "01",
    title: "Bhanwar Bay",
    subtitle: "Deep mahogany body with jet-black points",
    badge: "HEX #2A1D15",
    detail: "The foundational working coat of the Marwar studbook. Grounded endurance, sun-resistant pigmentation, and dense hooves.",
    meta: "OFFICIAL REGISTRY 01",
  },
  {
    id: "coat-kala",
    num: "02",
    title: "Kala Obsidian",
    subtitle: "Rare midnight black sheen with white star blaze",
    badge: "HEX #0F0E0D",
    detail: "The sovereign vow of fidelity. Pure obsidian hide that glistens blue-black in the morning sun, revered in bardic lore for protective loyalty.",
    meta: "OFFICIAL REGISTRY 02",
  },
  {
    id: "coat-surang",
    num: "03",
    title: "Surang Copper",
    subtitle: "Rich chestnut-red tones of a Thar Desert sunset",
    badge: "HEX #593822",
    detail: "Warm coppery gleam across the flanks. Fast-twitch muscle fibre responsiveness and spirited agility in tournament barrel circuits.",
    meta: "OFFICIAL REGISTRY 03",
  },
  {
    id: "coat-shwet",
    num: "04",
    title: "Shwet Dappled",
    subtitle: "Silver and iron roan maturing into radiant grey",
    badge: "HEX #8C8882",
    detail: "Iron-grey in early youth, transitioning into lustrous silver-white with age. The preferred steed of historic parade marshals.",
    meta: "OFFICIAL REGISTRY 04",
  },
  {
    id: "coat-nukra",
    num: "05",
    title: "Nukra Pure White",
    subtitle: "Pure ceremonial porcelain white coat and pink skin",
    badge: "HEX #D9D5CD",
    detail: "The ceremonial sovereign standard. Reserved for ceremonial durbar processions and high-ranking formal protocol.",
    meta: "OFFICIAL REGISTRY 05",
  },
  {
    id: "coat-ablak",
    num: "06",
    title: "Ablak Skewbald",
    subtitle: "High-contrast two-tone coat of individuality",
    badge: "DUAL PATTERN",
    detail: "Bold patches of white and deep brown or black. No two Ablak coats share the same geometry, celebrated as living emblems of singular identity.",
    meta: "OFFICIAL REGISTRY 06",
  },
];

const STALLION_ITEMS: LoopingItem[] = [
  {
    id: "stallion-chetak",
    num: "01",
    title: "Chetak IX",
    subtitle: "Flagship purebred Marwari · The Calm Sovereign",
    badge: "CHIP #0104",
    detail: "A fortress of composure. Grounds anxious first-time cadets with rhythmically measured breathing and patient rein acceptance.",
    meta: "HEIGHT: 15.2 HANDS · AGE: 7",
  },
  {
    id: "stallion-veer",
    num: "02",
    title: "Veer Charger",
    subtitle: "Kathiawari cavalry line · The High-Velocity Lancer",
    badge: "CHIP #0108",
    detail: "Relentless momentum under the tent-pegging lance. Answers ten grams of rein pressure and executes knife-edge turns around the peg.",
    meta: "HEIGHT: 15.0 HANDS · AGE: 6",
  },
  {
    id: "stallion-kesar",
    num: "03",
    title: "Kesar Archer",
    subtitle: "Rare skewbald warrior · Mounted Archery Lead",
    badge: "CHIP #0112",
    detail: "Steps lightly, tracks straight without rein tension during the arrow draw, and thrives before applauding tournament crowds.",
    meta: "HEIGHT: 14.3 HANDS · AGE: 8",
  },
  {
    id: "stallion-arbudh",
    num: "04",
    title: "Arbudh Pillar",
    subtitle: "Light bay with four white socks · Desert Endurance",
    badge: "CHIP #0119",
    detail: "Never the fastest on the short sprint; never the first to tire on the twenty-kilometre circuit. A patient teacher of rhythm.",
    meta: "HEIGHT: 15.0 HANDS · AGE: 10",
  },
  {
    id: "stallion-zilzal",
    num: "05",
    title: "Zilzal Sovereign",
    subtitle: "Jet-black purebred Marwari · Squadron Leader",
    badge: "CHIP #0124",
    detail: "Commanding physical presence, unflinching poise in close cavalry formation charges, and instantaneous sensitivity to rider balance.",
    meta: "HEIGHT: 15.3 HANDS · AGE: 8",
  },
  {
    id: "stallion-tofan",
    num: "06",
    title: "Tofan Tempest",
    subtitle: "Dappled grey lancer stallion · High-Sensitivity Mount",
    badge: "CHIP #0131",
    detail: "Demands stillness in the saddle. Rewards composed cadets with breathtaking speed through tournament obstacle runs.",
    meta: "HEIGHT: 15.1 HANDS · AGE: 9",
  },
];

const STUDBOOK_CATEGORIES = [
  { id: "breeds", label: "Horse Breeds", items: BREED_ITEMS },
  { id: "coats", label: "Coat Colours", items: COAT_ITEMS },
  { id: "stallions", label: "Fleet Stallions", items: STALLION_ITEMS },
];

export function StudbookSelectorDrum() {
  return (
    <OsmoLoopingSelector
      id="studbook-selector-drum"
      label="REEL 06C · SOVEREIGN SELECTION DRUM"
      headlineInscription="The Sovereign"
      headlineVoice="Studbook Selector."
      caption="Continuous kinetic drum rotation. Tap any breed, sacred coat colour, or registered fleet stallion to lock the precision brass corner brackets."
      items={BREED_ITEMS}
      categories={STUDBOOK_CATEGORIES}
      tone="dark"
    />
  );
}
