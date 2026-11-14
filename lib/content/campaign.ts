import { asset } from "./asset";

/**
 * Trainer, parent and school campaign images (public/images/campaign/trainer-parent/, ASSET_NOTES.md; 14 Nov 2026).
 * All nine are AI-generated concept illustrations with fictional people and horses. They are never presented as academy
 * staff, families, cadets, facilities or fleet horses, and no face here is an identity photograph.
 */
const c = (name: string) => asset(`/images/campaign/trainer-parent/${name}.webp`);

export const CAMPAIGN_NOTE = "AI-generated illustrations of the academy concept. The people and horses are fictional.";

export type CampaignImage = { src: string; width: number; height: number; alt: string; title?: string; position?: string };

export const RING_BACKGROUND: CampaignImage = {
  src: c("horse-riding-ring-background"), width: 1774, height: 887,
  alt: "A wide sand riding ring with a timber fence at golden hour, sandstone academy buildings and one horse in the distance.",
};

export const trainer = {
  label: "The instructor’s uniform",
  inscription: "THE INSTRUCTOR",
  voice: "in the same navy.",
  lede: "A proposed uniform for the academy’s instructors: the cadets’ midnight navy, a longer tunic with restrained gold trim, cream breeches and tall black boots. Shown in the ring, where the teaching happens.",
  portraits: [
    { src: c("trainer-standing-with-horse"), width: 1084, height: 1451, title: "Full length", alt: "An adult instructor in a proposed navy and gold tunic, cream breeches and black boots stands beside a black horse under a sandstone arch.", position: "50% 30%" },
    { src: c("trainer-uniform-detail"), width: 1024, height: 1536, title: "Tailoring and boots", alt: "An adult instructor leaning on the ring fence shows the proposed tunic's gold-trimmed collar, buttons, breeches and tall boots.", position: "50% 25%" },
  ] as CampaignImage[],
  ring: { src: c("trainer-riding-ring-lesson"), width: 1672, height: 941, title: "In the ring", alt: "An adult instructor guides a cadet riding a walking black horse in a fenced sand arena at golden hour." } as CampaignImage,
  courtyard: { src: c("trainer-courtyard-lesson"), width: 1672, height: 941, title: "Teaching a small group", alt: "An adult instructor leads a black horse and teaches a small group of cadets in a sandstone courtyard." } as CampaignImage,
  note: "Illustrations of a proposed instructor uniform, not photographs of academy staff. This is a photo series, not a 3D model.",
};

export const parentVisit = {
  label: "From the rail",
  inscription: "WATCH THEM",
  voice: "learn in the ring.",
  lede: "How a visit could look: parents at the fence while their child rides at a walk under an instructor’s eye, then a few minutes at the stable while the horse is prepared.",
  // 14 Nov 2026: the ring-fence still is now the /parents title photo, so this plate shows the courtyard lesson instead of repeating it.
  ring: { src: c("trainer-courtyard-lesson"), width: 1672, height: 941, title: "In the courtyard", alt: "An adult instructor leads a black horse and teaches a small group of cadets in a sandstone courtyard." } as CampaignImage,
  stable: { src: c("parent-stable-visit"), width: 1752, height: 897, title: "At the stable", alt: "Parents watch their daughter in riding uniform stroke a black horse's nose in a stable courtyard while an instructor holds it." } as CampaignImage,
};

export const schoolRing = {
  label: "The programme on your campus",
  inscription: "A RING",
  voice: "on the school grounds.",
  lede: "A fenced sand ring and a stable yard: lessons in small groups, an instructor with every horse, and horse care taught before riding.",
  lesson: { src: c("school-riding-ring-lesson"), width: 1672, height: 941, title: "A lesson in the ring", alt: "Cadets in navy stand in a fenced riding field around an instructor who holds a black horse, sandstone pavilions behind." } as CampaignImage,
  care: { src: c("school-horse-care"), width: 1752, height: 897, title: "Horse care first", alt: "Cadets groom a black horse in a sandstone courtyard while an adult instructor explains." } as CampaignImage,
};
