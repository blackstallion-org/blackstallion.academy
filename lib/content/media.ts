/**
 * Media manifest. Every image on the site is referenced by key.
 *
 * All files are AI placeholders (Higgsfield Cinema Studio Image 2.5, Oct 2026) until the
 * commissioned shoot replaces them one-for-one (Blueprint Part 8 and 11.4).
 * Local files live in public/media (fetch with `sh scripts/fetch-media.sh` on the Mac and set
 * NEXT_PUBLIC_LOCAL_MEDIA=1). Until then the browser loads the Higgsfield CDN copy (`remote`).
 * `focus` is the CSS object-position that keeps the subject in frame on narrow screens.
 */

const CDN = "https://d8j0ntlcm91z4.cloudfront.net/user_3KHOl32PLtCsaNMEkJTP0HHT06X/";

type Media = { file: string; remote: string | null; alt: string; focus?: string };

const m = (file: string, id: string | null, alt: string, focus?: string): Media => ({
  file: `/media/${file}`,
  remote: id ? `${CDN}${id}` : null,
  alt,
  focus,
});

/** Real cinematic photography (converted to WebP, max 2400px, warm dark-brown toned). */
const cinematic = (webpFile: string, alt: string, focus?: string): Media => ({
  file: `/images/cinematic-images/${webpFile}`,
  remote: `/images/cinematic-images/${webpFile}`,
  alt,
  focus,
});

export const media = {
  /* ---------------------------------------------------- first set (9 Oct 2026) */
  // [AI Backup] heroDust: m("hero-dust.png", "hf_20261009_002316_a9ac0234-9080-4a64-8d92-cf0705055f6b.png", "A Marwari stallion emerging from a towering cloud of golden dust", "62% 45%"),
  heroDust: cinematic("pexels-zeynep-sude-emek-193601188-26770601.webp", "A majestic Marwari stallion rearing against sky"),
  // [AI Backup] rearing: m("rearing.png", "hf_20261009_002317_1504aa62-05a7-47df-9bf5-fbb2b0c78ecc.png", "A Marwari stallion rearing against a molten gold sky"),
  rearing: cinematic("pexels-zeynep-sude-emek-193601188-26705077.webp", "A Marwari stallion galloping at sunset"),
  // [AI Backup] gallop: m("gallop.png", "hf_20261009_002435_48940254-f4cb-49fe-9236-d84b15570955.png", "A Marwari stallion at full gallop across desert sand"),
  gallop: cinematic("pexels-zeynep-sude-emek-193601188-26770593.webp", "A Marwari stallion galloping at twilight"),
  // [AI Backup] eye: m("eye.png", "hf_20261009_002317_26761800-94f0-40d6-a6b2-a35941ddc7e0.png", "Close-up of a Marwari's eye and inward-curving ear"),
  eye: cinematic("michelle-tresemer.webp", "Close-up of a Marwari's eye and inward-curving ear"),
  // [AI Backup] riderLance: m("rider-lance.png", "hf_20261009_002435_480a7609-4bd8-46c6-83b4-8c740f8aaf4b.png", "A young rider lowering a tent-pegging lance at a gallop at dusk"),
  riderLance: cinematic("pexels-furkanelveren-26651204.webp", "A young rider lowering a lance at a gallop through desert dust"),
  // [AI Backup] duneSilhouette: m("dune-silhouette.png", "hf_20261009_002317_0f749476-7e8d-47bf-b57a-9adcb7b21741.png", "A lone Marwari silhouetted on a dune at dusk"),
  duneSilhouette: cinematic("yavuz-pancareken.webp", "A lone Marwari silhouetted on a dune at dusk"),
  // [AI Backup] bgFort: m("bg-fort.png", "hf_20261009_002435_531c9a37-9fa8-4152-ad47-e0d3d35105a4.png", "Ruins of a sandstone Rajput fort above the Thar at dusk"),
  bgFort: cinematic("patrick-boucher.webp", "Ruins of a sandstone Rajput fort above the Thar at dusk"),
  bgArena: m("bg-arena.png", "hf_20261009_002435_e0aa5fef-e93d-4950-a155-e4c8a2883ae4.png", "An empty riding arena at dusk with tent-pegging pegs and a lance"),
  // [AI Backup] bgStable: m("bg-stable.png", "hf_20261009_002640_d9a4c4d4-d61a-4660-a63c-857a874f56aa.png", "A lantern-lit stable corridor"),
  bgStable: cinematic("pexels-joel-zar-307187367-13712779.webp", "A lantern-lit stable corridor"),
  bgPavilion: m("bg-pavilion.png", "hf_20261009_002640_8d4143ab-a4d7-479b-86d6-aaa3edfc9947.png", "A sandstone pavilion beside a riding arena at dusk"),
  bgPassport: m("bg-passport.png", "hf_20261009_002640_5e132524-4ec5-4185-8dc4-76b49caab8e4.png", "A leather passport and a brass seal on dark wood"),
  // [AI Backup] bgCharge: m("bg-charge.png", "hf_20261009_002640_5b5f28cc-654a-499d-8b0e-35093d96acb5.png", "Three riders charging with lances lowered through dust"),
  bgCharge: cinematic("pexels-furkanelveren-26651204.webp", "Three riders charging with lances lowered through golden desert dust"),
  dustPlume: m("dust-plume.png", "hf_20261009_002905_56886768-0acc-459c-ae40-a8356254a871.png", ""),
  dustWall: m("dust-wall.png", "hf_20261009_002905_226a4699-2319-45c7-ac8d-3d48708a5a42.png", ""),

  /* Neutrality pass 11 Oct 2026: legendCavalry, legendChetak and legendBahadur were regenerated as banner-free, non-sectarian imagery (Directive §2). Keys kept to avoid churn. */
  /* ---------------------------------------------------- second set (Blueprint 8.2) */
  // [AI Backup] legendSand: m("legend-sand.png", "hf_20261009_133620_b9556c78-8c2d-482f-97cc-c5dc976e7787.png", "A Marwari's hooves lifting out of deep desert sand"),
  legendSand: cinematic("pexels-furkanelveren-26651204.webp", "A Marwari's hooves lifting out of deep desert sand"),
  // [AI Backup] legendEars: m("legend-ears.png", "hf_20261009_133621_5a3cedb7-3682-4992-9f09-58666b26f286.png", "A Marwari's lyre-shaped ears curving inward until the tips touch"),
  legendEars: cinematic("michelle-tresemer.webp", "A Marwari's lyre-shaped ears curving inward until the tips touch"),
  // [AI Backup] legendGrey: m("legend-grey.png", "hf_20261009_134207_2579fc71-30ad-44d5-9a75-48d29801a99c.png", "A dappled grey Marwari stallion with a silver bridle by lantern light"),
  legendGrey: cinematic("kyle-hanson.webp", "A dappled grey Marwari stallion grazing peacefully"),
  // [AI Backup] legendBlack: m("legend-black.png", "hf_20261009_134210_875318e8-ba4f-4012-86bd-3a472486c8a1.png", "A black Marwari stallion traced by a thin line of gold light"),
  legendBlack: cinematic("fethi-benattallah-HJH065nf_Mc-unsplash.webp", "A black Marwari stallion standing solitary in morning mist"),
  // [AI Backup] legendCavalry: m("legend-cavalry.png", "hf_20261011_125701_03894133-4ebe-4853-bbf3-fb8b894c5b42.png", "Marwari horsemen as dark silhouettes riding through a plume of golden desert dust"),
  legendCavalry: cinematic("furkanelveren-26700308.webp", "Marwari horsemen as dark silhouettes riding through a plume of golden desert dust"),
  // [AI Backup] legendChetak: m("legend-chetak.png", "hf_20261011_123831_2b8dbd56-ff58-4874-94f2-9f3582efc329.png", "Weathered leather tack and oxidized bronze stirrups on dark stone, wind-blown sand"),
  legendChetak: cinematic("pexels-cristian-rojas-8064265.webp", "Weathered leather tack and oxidized bronze stirrups on dark stone"),
  // [AI Backup] legendBahadur: m("legend-bahadur.png", "hf_20261011_125701_e77bf110-1d6e-4276-b777-a60ccce661b9.png", "A lone Marwari stallion silhouetted on a desert dune ridge at sunset"),
  legendBahadur: cinematic("5b42ebb6-b222-40d1-a49e-173c638eb525.webp", "A lone Marwari stallion silhouetted under solar halo"),
  /* Lore reel (11 Oct 2026): original studio portraits; replace with commissioned photography. */
  // [AI Backup] kalaPortrait: m("lore-kala.png", "hf_20261011_142335_cc424b5d-501a-4bc6-9af2-edce6dba169a.png", "Black-and-white portrait of a black Marwari stallion with lyre-shaped ears and a white blaze", "60% 35%"),
  kalaPortrait: cinematic("yavuz-pancareken.webp", "Black-and-white portrait of a black Marwari stallion with lyre-shaped ears", "50% 50%"),
  // [AI Backup] nukraPortrait: m("lore-nukra.png", "hf_20261011_142423_18de8c55-e9b9-4415-970e-a1d04f0176ce.png", "A pure white Marwari horse in a dark stone courtyard at dusk", "40% 40%"),
  nukraPortrait: cinematic("patrick-boucher.webp", "A pure white Marwari horse in a dark stone courtyard at dusk", "50% 50%"),
  // [AI Backup] legendNachni: m("legend-nachni.png", "hf_20261009_133621_81837c50-d744-4170-a4c4-28e23c303420.png", "A Marwari dancing at a night wedding procession in Rajasthan"),
  legendNachni: cinematic("pexels-zeynep-sude-emek-193601188-26770593.webp", "A Marwari dancing at twilight in Rajasthan"),
  // [AI Backup] legendFall: m("legend-fall.png", "hf_20261009_134450_fded19b4-ef5f-47e2-ad72-61dfcc13a8d8.png", "A thin Marwari harnessed to a village cart, 1950s"),
  legendFall: cinematic("pexels-thecactusena-18168930.webp", "A Marwari stallion in dramatic shadows"),
  // [AI Backup] legendRevival: m("legend-revival.png", "hf_20261009_134452_071b671c-3a71-467c-b01b-41fdd53c797c.png", "A herd of Marwari horses galloping across Rajasthan at golden hour"),
  legendRevival: cinematic("tahir-osman.webp", "A herd of Marwari horses galloping across Rajasthan at golden hour"),
  // [AI Backup] legendToday: m("legend-today.png", "hf_20261009_134451_6575fc93-f93a-4d03-91fc-2a48c3788c1e.png", "A young cadet touching the curled ear of a Marwari stallion at dawn"),
  legendToday: cinematic("pexels-diandra-aranksta-caldore-89806788-14386424.webp", "A young cadet touching the curled ear of a Marwari stallion at dawn"),
  // [AI Backup] anatomyProfile: m("anatomy-profile.png", "hf_20261009_134210_77871ace-c329-40a8-947a-e2738b908277.png", "A dark bay Marwari stallion in full side profile on black, outlined in gold light", "50% 50%"),
  anatomyProfile: cinematic("michelle-tresemer.webp", "High-contrast monochrome macro close-up of a horse head, focused on the eye and inward-curving ear", "50% 50%"),
  // [AI Backup] scienceRider: m("science-rider.png", "hf_20261009_134843_2997d278-9f94-43e0-854d-6c3eb7a2a9dc.png", "A young rider at sitting trot with an upright, stacked spine"),
  scienceRider: cinematic("pexels-diandra-aranksta-caldore-89806788-14386424.webp", "A young rider at sitting trot with an upright, stacked spine"),
  whyCrisis: m("why-crisis.png", "hf_20261009_134843_16f45299-ccbc-40e7-96ca-4e98043950f5.png", "A boy hunched over a glowing phone in a dark room"),
  // [AI Backup] whyCure: m("why-cure.png", "hf_20261009_134844_7b2cb2d5-6500-480c-adde-9f8228400906.png", "A boy in cadet uniform sitting tall on a Marwari at golden hour"),
  whyCure: cinematic("5b42ebb6-b222-40d1-a49e-173c638eb525.webp", "A boy in cadet uniform sitting tall on a Marwari at golden hour"),
  currLedger: m("curr-ledger.png", "hf_20261009_134844_7b97867f-70f4-4951-ab67-431ea34426e0.png", "An open leather ledger with brass seals and a dip pen"),
  currGroundcare: m("curr-groundcare.png", "hf_20261009_135529_e66154c5-95fe-4ef1-a9a1-3151e8922bfb.png", "A cadet picking a horse's hoof in a sunlit stable"),
  // [AI Backup] currFormation: m("curr-formation.png", "hf_20261009_135529_792c3856-967f-476f-9088-628cdedcb613.png", "Cadets riding in line formation across an arena at dusk"),
  currFormation: cinematic("tahir-osman.webp", "Cadets riding in line formation across an arena at dusk"),
  // [AI Backup] currArchery: m("curr-archery.png", "hf_20261009_135529_82e3b89c-dc84-460f-8a19-492bdde28650.png", "A girl cadet drawing a bow at the canter"),
  currArchery: cinematic("pexels-zeynep-sude-emek-193601188-26705077.webp", "A girl cadet drawing a bow at the canter"),
  // [AI Backup] currBarrel: m("curr-barrel.png", "hf_20261009_135529_999194db-d45f-44f3-92b9-14705f8a541b.png", "A rider turning tightly around a barrel in spraying sand"),
  currBarrel: cinematic("pexels-wolfgang-weiser-467045605-18498504.webp", "A rider turning tightly around a barrel in spraying sand"),
  // [AI Backup] currTentpeg: m("curr-tentpeg.png", "hf_20261009_135919_5cdba949-174d-44b4-a0e3-8711c8804e35.png", "A lance tip piercing a wooden peg at full gallop"),
  currTentpeg: cinematic("furkanelveren-26700308.webp", "A lance tip piercing a wooden peg at full gallop"),
  // [AI Backup] currBatch: m("curr-batch.png", "hf_20261009_135918_ea6a7908-2bc9-4820-b462-887cf11ddfc2.png", "A batch of cadets standing with their horses at dusk"),
  currBatch: cinematic("pexels-arthousestudio-4573477.webp", "A batch of cadets standing with their horses at dusk"),
  // [AI Backup] fleetChetak: m("fleet-chetak.png", "hf_20261009_135918_8c0e7aab-156d-44e1-a197-f7562ec9938a.png", "Chetak IX, a dark bay Marwari with a white blaze"),
  fleetChetak: cinematic("pexels-zeynep-sude-emek-193601188-26617847.webp", "Chetak IX, a dark bay Marwari with a white blaze"),
  // [AI Backup] fleetVeer: m("fleet-veer.png", "hf_20261009_135918_2230edd8-75d6-4133-9449-ca7c6e1b1fee.png", "Veer, a chestnut-gold Kathiawari stallion"),
  fleetVeer: cinematic("pexels-daijonj-28538727.webp", "Veer, a chestnut-gold Kathiawari stallion"),
  // [AI Backup] fleetKesar: m("fleet-kesar.png", "hf_20261009_140621_aeee0f2d-2fd4-4714-867f-a68aaf3e58c1.png", "Kesar, a skewbald Marwari stallion"),
  fleetKesar: cinematic("kyle-hanson.webp", "Kesar, a skewbald Marwari stallion"),
  // [AI Backup] fleetArbudh: m("fleet-arbudh.png", "hf_20261009_140620_a883058c-4b10-47ea-a035-0d79c6a905fc.png", "Arbudh, a light bay Marwari with four white socks"),
  fleetArbudh: cinematic("tahir-osman.webp", "Arbudh, a light bay Marwari with four white socks"),
  // [AI Backup] fleetStallcam: m("fleet-stallcam.png", "hf_20261009_140621_67cfc158-a653-43d8-9256-4947c0d8f059.png", "Night-vision view of a horse resting in its stall"),
  fleetStallcam: cinematic("pexels-joel-zar-307187367-13712779.webp", "Night-vision view of a horse resting in its stall"),
  // [AI Backup] cadetZayd: m("cadet-zayd.png", "hf_20261009_140621_9304b554-87e1-40ee-ba27-2a2c0b351aac.png", "A teenage cadet holding a tent-pegging lance at dusk", "50% 30%"),
  cadetZayd: cinematic("fakhri98.webp", "A teenage cadet in uniform at dusk", "50% 30%"),
  // [AI Backup] cadetAnanya: m("cadet-ananya.png", "hf_20261009_141028_766382f0-05ba-42d5-957b-b8622aa7aae8.png", "A teenage girl cadet holding a recurve bow", "50% 30%"),
  cadetAnanya: cinematic("76907938.webp", "A cadet portrait in the arena", "50% 30%"),
  // [AI Backup] cadetRohan: m("cadet-rohan.png", "hf_20261009_141028_3f4df039-307f-4ce9-a666-0190a88bd61d.png", "A young cadet cantering a bay Marwari"),
  cadetRohan: cinematic("pexels-arthousestudio-4573477.webp", "A young cadet cantering a bay Marwari"),
  // [AI Backup] parentsRail: m("parents-rail.png", "hf_20261009_141028_a5ee9a0d-cae2-46a3-a5d5-f9de6fb56dde.png", "Parents at an arena rail watching their child ride at dusk"),
  parentsRail: cinematic("76907938.webp", "Parents at an arena rail watching their child ride at dusk"),
  // [AI Backup] safetyKit: m("safety-kit.png", "hf_20261009_141027_b1ce5c16-1801-4553-acc9-4f1ae667c666.png", "A riding helmet, gloves, vest and chaps on a wooden bench"),
  safetyKit: cinematic("pexels-cristian-rojas-8064265.webp", "A riding helmet, gloves, vest and chaps on a wooden bench"),
  // [AI Backup] safetyInstructor: m("safety-instructor.png", "hf_20261009_141351_e69b0e16-1d9e-4dd5-85b0-15829cb72991.png", "A former cavalry instructor fastening a cadet's helmet"),
  safetyInstructor: cinematic("kubrarkan.webp", "A former cavalry instructor supervising in the arena"),
  // [AI Backup] safetyVet: m("safety-vet.png", "hf_20261009_141351_8460100f-8409-461f-83f6-b3cd555c58f1.png", "A veterinarian examining a Marwari's hoof"),
  safetyVet: cinematic("v-marin.webp", "A veterinarian examining a Marwari horse"),
  schoolAerial: m("school-aerial.png", "hf_20261009_141351_105fa634-2dcd-4313-902c-4720f60297d8.png", "Aerial view of a school campus with a new riding arena at dusk"),
  schoolArenaNight: m("school-arena-night.png", "hf_20261009_141352_f3f0129a-4d73-4510-b78f-5eaef0041c8b.png", "A floodlit school riding arena at night"),
  // [AI Backup] tournCup: m("tourn-cup.png", "hf_20261009_141653_3ffd5740-6fa9-4d99-890c-edc64312a25c.png", "A silver and brass trophy with crossed lances beside gold medals"),
  tournCup: cinematic("pexels-cristian-rojas-8064265.webp", "Equestrian tack and silver trophy medals"),
  // [AI Backup] tournCrowd: m("tourn-crowd.png", "hf_20261011_143142_68fdcc65-e301-4366-83a1-d74042dff88d.png", "A rider at full gallop with lance lowered before a school crowd"),
  tournCrowd: cinematic("pexels-wolfgang-weiser-467045605-18498504.webp", "A rider at full gallop with lance lowered before a school crowd"),
  // [AI Backup] tournPodium: m("tourn-podium.png", "hf_20261009_141652_b40d5bb5-0add-4dbe-98fa-804b08055fa9.png", "Three cadets on a podium receiving medals"),
  tournPodium: cinematic("pexels-zeynep-sude-emek-193601188-26770601.webp", "A rearing stallion at the winners podium"),
  journalReins: m("journal-reins.png", "hf_20261009_141653_ed15a453-da1c-4f1a-9507-25f09b028615.png", "Gloved hands holding leather reins lightly"),
  contactGate: m("contact-gate.png", "hf_20261009_142018_b4e92a4f-3602-4c04-85ce-1c80dfda6af5.png", "A studded Rajput fort gate at night between two lanterns"),
} satisfies Record<string, Media>;

export type MediaKey = keyof typeof media;

export const heroVideo = { file: "/media/hero-loop.mp4", remote: `${CDN}hf_20261009_002919_571f23fa-14a9-4d0b-bbe3-19f4311054d8.mp4` };

export const LOCAL_MEDIA = process.env.NEXT_PUBLIC_LOCAL_MEDIA === "1";

/** The URL the browser should load for a key, or null if nothing exists yet. */
export function mediaSrc(key: MediaKey): string | null {
  const item: Media = media[key];
  if (LOCAL_MEDIA) return item.file;
  return item.remote;
}
