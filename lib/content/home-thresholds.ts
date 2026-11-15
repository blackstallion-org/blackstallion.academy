import { asset } from "./asset";

/**
 * Home page · "Five thresholds" (14 Nov 2026, owner: five of the heritage photographs, shown big, in an editorial layout rather
 * than the arches on /schools). The photographs are the ones already published on /schools in public/images/marwari-editorial
 * (schools-01 to 04 and 06). Marked plates 02–04 were replaced with original AI-generated photographs in the 15 Nov 2026 image
 * audit. Remaining third-party photographs keep their attribution below. None shows the academy, its horses or its cadets.
 */
export type Threshold = { src: string; width: number; height: number; title: string; alt: string };

const t = (n: number, width: number, height: number, title: string, alt: string, original = false): Threshold => ({
  src: asset(`/images/marwari-editorial/schools-0${n}${original ? "-original" : ""}.webp`),
  width,
  height,
  title,
  alt,
});

export const thresholds = {
  label: "The thresholds",
  inscription: "Five doors.",
  voice: "One horse at each.",
  lede: "Carved doorways, painted gateways and white stairs in Rajasthan, and a Marwari standing at each.",
  photos: [
    t(1, 922, 1152, "Indigo", "A dark Marwari in jewellery stands before a blue-painted carved doorway."),
    t(2, 1040, 1300, "Marble", "A chestnut Marwari with a blaze stands between white carved marble columns.", true),
    t(3, 1350, 1800, "The gateway", "A black Marwari stands at the top of steps in a carved sandstone gateway.", true),
    t(4, 895, 1300, "Painted haveli", "A black Marwari stands in the painted doorway of a haveli.", true),
    t(6, 1350, 1800, "The steps", "A chestnut Marwari stands at the foot of white steps before a painted arch."),
  ],
  credit: "Photographs of Marwari horses, used with the photographers' permission. Including Ekaterina Druz.",
} as const;
