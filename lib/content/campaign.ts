import { asset } from "./asset";

/**
 * Trainer, parent and school campaign images (public/images/campaign/trainer-parent/, ASSET_NOTES.md; 14 Nov 2026).
 * 16 Nov 2026: the ring, courtyard and school-ring files are the olive-khaki instructor set (output/imagegen/instructor-uniform-v2,
 * school-campus-v2). 17 Nov 2026 (owner): instructors wear olive only, so the two navy portraits were removed; the campus band
 * is output/imagegen/bsah-2026-masters/schools-02-regulation-arena (a modern school, not a palace).
 * All nine are AI-generated concept illustrations with fictional people and horses. They are never presented as academy
 * staff, families, cadets, facilities or fleet horses, and no face here is an identity photograph.
 */
const c = (name: string) => asset(`/images/campaign/trainer-parent/${name}.webp`);

export const CAMPAIGN_NOTE = "AI-generated illustrations of the academy concept. The people and horses are fictional.";

export type CampaignImage = { src: string; width: number; height: number; alt: string; title?: string; position?: string };

export const RING_BACKGROUND: CampaignImage = {
  src: c("horse-riding-ring-background"), width: 1672, height: 941,
  alt: "Two helmeted cadets ride bay horses around a fenced sand arena on a modern school campus at dusk while an instructor in olive watches from the rail; stables and school buildings stand behind.",
};

export const trainer = {
  label: "The instructor’s uniform",
  inscription: "THE INSTRUCTOR",
  voice: "in olive.",
  lede: "A proposed uniform for the academy’s instructors: olive khaki shirt and trousers, plain epaulettes, a dark belt and an olive beret, with no badges, ranks or medals. Shown in the ring, where the teaching happens.",
  ring: { src: c("trainer-riding-ring-lesson"), width: 1672, height: 941, title: "In the ring", alt: "An instructor in an olive uniform and beret watches two cadets ride at a walk in a floodlit school arena at dusk." } as CampaignImage,
  courtyard: { src: c("trainer-courtyard-lesson"), width: 1672, height: 941, title: "Teaching a small group", alt: "An instructor in an olive uniform and beret leads a black horse and talks with parents and helmeted cadets on a shaded campus walkway." } as CampaignImage,
  note: "Illustrations of a proposed instructor uniform, not photographs of academy staff.",
};

export const parentVisit = {
  label: "From the rail",
  inscription: "WATCH THEM",
  voice: "learn in the ring.",
  lede: "How a visit could look: parents at the fence while their child rides at a walk under an instructor’s eye, then a few minutes at the stable while the horse is prepared.",
  // 14 Nov 2026: the ring-fence still is now the /parents title photo, so this plate shows the courtyard lesson instead of repeating it.
  ring: { src: c("trainer-courtyard-lesson"), width: 1672, height: 941, title: "In the courtyard", alt: "An instructor in an olive uniform and beret leads a black horse and talks with parents and helmeted cadets on a shaded campus walkway." } as CampaignImage,
  stable: { src: c("parent-stable-visit"), width: 1672, height: 941, title: "At the stable", alt: "A mother and her daughter, in helmet and safety vest, stroke a black horse while an instructor in olive holds it beside the stables." } as CampaignImage,
};

export const schoolRing = {
  label: "The programme on your campus",
  inscription: "A RING",
  voice: "on the school grounds.",
  lede: "A fenced sand ring and a stable yard: lessons in small groups, an instructor with every horse, and horse care taught before riding.",
  lesson: { src: c("school-riding-ring-lesson"), width: 1672, height: 941, title: "A lesson in the ring", alt: "A cadet rides a bay horse in a fenced sand arena beside the school buildings while an instructor watches and students walk past." } as CampaignImage,
  care: { src: c("school-horse-care"), width: 1672, height: 941, title: "Horse care first", alt: "An instructor in olive stands in the aisle of a stable block while a horse waits at the wash bay." } as CampaignImage,
};
