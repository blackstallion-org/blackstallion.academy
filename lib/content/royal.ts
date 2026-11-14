import { asset } from "./asset";

/**
 * The owner's royal Marwari photographs (supplied 14 Nov 2026 as IMG_4263–4279, "real marwari horse images/"), used with the
 * photographers' permission, which the owner confirmed on 14 Nov 2026. Their watermarks stay on the pictures, untouched, and each
 * plate also names the photographer where the mark is legible. The originals are 540–1200 px wide; the files in
 * public/images/royal/ are Lanczos upscales (about 2x) with light sharpening, so they are used no larger than they hold up.
 * Photographs of horses, not of the academy: the captions never say they show BSAH horses, grounds or cadets.
 */
export type RoyalPhoto = { src: string; width: number; height: number; alt: string; credit: string; focus?: string };

const p = (slug: string, width: number, height: number, alt: string, credit: string, focus?: string): RoyalPhoto => ({
  src: asset(`/images/royal/${slug}.webp`),
  width,
  height,
  alt,
  credit,
  focus,
});

export const royal = {
  palaceStanding: p("palace-standing", 2400, 1600, "A dark bay Marwari stallion stands square in a sandy courtyard before a domed sandstone chhatri, lit by a hazy gold evening.", "Hafner Photography", "56% 55%"),
  palaceRearing: p("palace-rearing", 2160, 1440, "A Marwari stallion rears against a gold sunset between two domed palace pavilions.", "Hafner Photography", "45% 45%"),
  desertRider: p("desert-rider", 2400, 994, "A lone rider gallops across a dusty plain below jagged mountains at sunset, cloak streaming.", "Used with permission", "45% 60%"),
  canyonRider: p("canyon-rider", 1080, 1350, "A small rider crosses a vast sand canyon in an orange haze.", "Used with permission", "50% 70%"),
  sunsetRear: p("sunset-rear", 1597, 2400, "The silhouette of a rearing horse against a red sunset.", "Used with permission", "50% 50%"),
  twoHorses: p("two-horses-sunset", 2400, 1547, "Two Marwari horses touch noses in silhouette, the sun setting between them.", "Used with permission", "50% 50%"),
  headAtSunset: p("head-at-sunset", 2400, 1600, "The silhouette of a Marwari head and neck, ears curved inward until the tips touch, against a low yellow sun.", "Edyta Trojańska-Koch, equine-photo.com", "55% 45%"),
  calmSilhouette: p("calm-silhouette", 2115, 1410, "A Marwari stallion stands still on open ground, the sun breaking behind its shoulder in a pale haze.", "Used with permission", "50% 55%"),
  whiteAtWater: p("white-at-water", 1655, 2400, "A white Marwari stands on rocks at the edge of a reedy lake, mountains in the mist behind.", "Used with permission", "55% 45%"),
  hillStallion: p("hill-stallion", 2000, 2400, "A chestnut Marwari stallion stands on a hillside above hazy Aravalli ridges at sunrise, birds overhead.", "Used with permission", "45% 55%"),
  blackRearing: p("black-rearing-sand", 2208, 2208, "A black Marwari stallion with white socks rears on golden sand, dust kicking up beneath it.", "Wojtek Kwiatkowski", "55% 45%"),
} satisfies Record<string, RoyalPhoto>;

export type RoyalKey = keyof typeof royal;

/** One plate: a photograph and a few words. `title`'s first letter is set as a copperplate swash (the owner's reference). */
export type RoyalPlateCopy = { photo: RoyalKey; label: string; title: string; line: string };

export const royalPlates = {
  homeInterlude: { photo: "palaceRearing", label: "The breed", title: "Raised for kings", line: "For centuries the Marwari was the horse of the Rajput courts: proud, alert, and built for the desert." },
  legendRider: { photo: "desertRider", label: "The land", title: "Across the Thar", line: "The breed was shaped by distance, heat and the riders who crossed it." },
  legendRear: { photo: "sunsetRear", label: "The spirit", title: "Still unbroken", line: "Eight centuries on, the same fire stands up in every stride." },
  fleetBlack: { photo: "blackRearing", label: "The stallion", title: "Black as a moonless night", line: "Power you can feel from the rail. In the ring it is met with patience, never force." },
  fleetWhite: { photo: "whiteAtWater", label: "The quiet", title: "Grey and calm", line: "Grey coats are prized in Marwar. A calm horse teaches a young rider more than any lesson plan." },
  curriculumBond: { photo: "twoHorses", label: "The bond", title: "Trust comes first", line: "Before a cadet rides, they learn to be trusted: a soft hand, a steady breath, a quiet approach." },
  parentsCalm: { photo: "calmSilhouette", label: "Patience", title: "Steady as the horse", line: "Calm is contagious. A child who learns to stand beside a horse learns to stand still inside." },
  whyHead: { photo: "headAtSunset", label: "Attention", title: "The ears that listen", line: "The Marwari's curved ears turn toward every sound. Riding asks a child to pay that kind of attention." },
  schoolsHill: { photo: "hillStallion", label: "Your campus", title: "A horse on the hill", line: "Bring the oldest teacher in India to your school grounds." },
} satisfies Record<string, RoyalPlateCopy>;
