import { asset } from "./asset";

/**
 * "One conversation. Two bodies." The horse-and-rider study on /anatomy (components/sections/anatomy/HorseRiderStudy.tsx).
 *
 * Three registered plates of the same side-profile Marwari and cadet, each 1376 × 768 px, so one set of coordinates fits
 * all three and the horse never moves when the view changes. Hotspot x/y are percentages of that full frame (measured on
 * the plates, 16 Nov 2026); the component converts them to whichever crop is showing. Notes are condensed from the
 * earlier exhibit (public/anatomy/dual-body.html) and checked term by term: the horse's "knee" is the carpus (the human
 * wrist), the hock is the tarsus (the human ankle), the stifle matches the human knee, and the withers are the tall
 * spines of the front thoracic vertebrae.
 */

export type StudyViewId = "coat" | "muscle" | "skeleton";

export type StudyHotspot = {
  id: string;
  title: string;
  /** Percent of the full 1376 × 768 frame, from the left. */
  x: number;
  /** Percent of the full 1376 × 768 frame, from the top. */
  y: number;
  /** One or two sentences, shown only when the point is chosen. */
  note: string;
};

export type StudyView = {
  id: StudyViewId;
  label: string;
  src: string;
  alt: string;
  hotspots: StudyHotspot[];
};

/** Size of each plate in pixels. */
export const STUDY_FRAME = { width: 1376, height: 768 } as const;

/**
 * The part of the plate the stage shows, in plate pixels. The art (horse, rider, printed labels and the muscle key) spans
 * x 284–1071, y 45–740. "tight" is used below 1024 px, where width is scarce; "wide" fills a desktop row while keeping the
 * stage inside one screen height. Both keep every printed label whole and leave a margin above the helmet and below the
 * hooves for the edge fade.
 */
export const STUDY_CROPS = {
  tight: { x: 262, y: 6, w: 832, h: 756 },
  wide: { x: 88, y: 6, w: 1200, h: 756 },
} as const;

/** Plate pixels → percent of the frame (two decimals). */
const at = (px: number, py: number) => ({
  x: Math.round((px / STUDY_FRAME.width) * 10000) / 100,
  y: Math.round((py / STUDY_FRAME.height) * 10000) / 100,
});

export const studyViews: StudyView[] = [
  {
    id: "coat",
    label: "Coat",
    src: asset("/images/anatomy/study-coat.webp"),
    alt: "A black Marwari stallion standing square in side profile, ridden by a cadet in helmet, black jacket and tall boots, drawn as a study plate with labels for the ears and poll, neck, withers, back, ribcage and fetlock.",
    hotspots: [
      {
        id: "coat-ears-poll",
        title: "Ears & poll",
        ...at(436, 143),
        note: "The inward-curving Marwari ears turn on their own toward what holds the horse's attention, the rider's voice included. Just behind them, the poll is where the head flexes on the neck; a supple poll answers soft hands.",
      },
      {
        id: "coat-neck",
        title: "Neck & crest",
        ...at(548, 222),
        note: "The long, arched neck and its muscular crest carry the head in self-carriage. That carriage shapes the rein contact, from the bit to the cadet's hands.",
      },
      {
        id: "coat-withers",
        title: "Withers & saddle zone",
        ...at(622, 276),
        note: "The withers, the high point between the shoulder blades, sit under the front of the saddle. A saddle that clears them leaves the shoulders free and lets the rider sit in balance.",
      },
      {
        id: "coat-back",
        title: "Back & loin",
        ...at(830, 300),
        note: "The short, strong Marwari loin carries the push of the hindquarters forward into the back. A supple rider's pelvis absorbs that movement instead of blocking it.",
      },
      {
        id: "coat-ribcage",
        title: "Ribcage & flank",
        ...at(748, 432),
        note: "The deep barrel holds the heart and lungs. Just behind the girth it takes the cadet's lower-leg aids for bend and forward movement.",
      },
      {
        id: "coat-fetlock",
        title: "Fetlock & hoof",
        ...at(884, 684),
        note: "On every stride the fetlock sinks and springs back, held by the suspensory apparatus, while the dense hoof capsule meets the ground. Together they absorb the shock of each footfall.",
      },
    ],
  },
  {
    id: "muscle",
    label: "Muscle",
    src: asset("/images/anatomy/study-muscle.webp"),
    alt: "The same horse and rider with the horse's muscle groups coloured in: poll and neck, shoulder and chest, back, barrel and flank, hindquarters, and legs, with a colour key.",
    hotspots: [
      {
        id: "muscle-neck",
        title: "Poll & neck muscles",
        ...at(529, 238),
        note: "The splenius raises the head and neck, the brachiocephalicus draws the foreleg forward and the trapezius lifts the shoulder blade. Calm attention and soft hands let them work freely.",
      },
      {
        id: "muscle-shoulder",
        title: "Shoulder & chest",
        ...at(548, 395),
        note: "The serratus ventralis and the pectorals form the thoracic sling that carries the chest and lifts the withers between the forelegs. The triceps extends the elbow.",
      },
      {
        id: "muscle-back",
        title: "Back: longissimus dorsi",
        ...at(796, 311),
        note: "The longissimus dorsi runs along the spine from the pelvis to the base of the neck. It steadies the back under the saddle and works best in rhythm, contracting and releasing rather than bracing.",
      },
      {
        id: "muscle-barrel",
        title: "Barrel & flank",
        ...at(753, 448),
        note: "The obliques and the rectus abdominis lift the back from below, toward the rider's seat. They also support the rhythm of the horse's breathing.",
      },
      {
        id: "muscle-hindquarters",
        title: "Hindquarters",
        ...at(916, 350),
        note: "The gluteus medius and the hamstrings (biceps femoris, semitendinosus, semimembranosus) extend the hip and hock. This is the engine that drives the horse forward and lets it carry more weight behind.",
      },
      {
        id: "muscle-legs",
        title: "Forelegs & hind legs",
        ...at(572, 525),
        note: "The digital flexor and extensor muscles sit above the knee and hock; below them the leg is moved by long tendons. Those tendons stretch and recoil with every stride, storing and returning energy.",
      },
    ],
  },
  {
    id: "skeleton",
    label: "Skeleton",
    src: asset("/images/anatomy/study-skeleton.webp"),
    alt: "The same horse and rider drawn with their skeletons showing: skull, neck vertebrae, ribs, spine, pelvis and leg bones, with the horse's spine traced in gold from poll to tail.",
    hotspots: [
      {
        id: "skeleton-skull-neck",
        title: "Skull & neck vertebrae",
        ...at(486, 190),
        note: "The skull meets the neck at the atlas (C1) and axis (C2), the joints that let the head nod and turn. Five more vertebrae, C3 to C7, complete the S-curved neck.",
      },
      {
        id: "skeleton-withers",
        title: "Withers",
        ...at(603, 284),
        note: "The tall spinous processes of the front thoracic vertebrae (about T3 to T8) form the withers and anchor the nuchal ligament. The front of the saddle must clear them.",
      },
      {
        id: "skeleton-ribs",
        title: "Ribs & thoracic spine",
        ...at(770, 395),
        note: "Usually 18 thoracic vertebrae and 18 pairs of ribs, joined below at the sternum, form the cage under the rider's seat and legs. It guards the heart and lungs and moves with every breath.",
      },
      {
        id: "skeleton-lumbar",
        title: "Lumbar spine & sacrum",
        ...at(812, 310),
        note: "Usually six lumbar vertebrae link the ribcage to the sacrum, five vertebrae fused into one bone. This short span carries the drive of the hind legs forward into the back.",
      },
      {
        id: "skeleton-pelvis",
        title: "Pelvis, femur & stifle",
        ...at(893, 335),
        note: "The pelvis, femur and stifle form the lever of the hind leg; the stifle, with its patella, matches the human knee. When the lumbosacral joint flexes, the pelvis tilts and the hind legs step further under the body.",
      },
      {
        id: "skeleton-foreleg",
        title: "Foreleg: the knee is a wrist",
        ...at(578, 590),
        note: "Scapula, humerus, radius and ulna lead down to the carpus, which riders call the knee but which matches the human wrist. Below it come the cannon bone and the three bones of the pastern and hoof, P1 to P3.",
      },
      {
        id: "skeleton-hindleg",
        title: "Hind leg: the hock is an ankle",
        ...at(900, 573),
        note: "The hock is the tarsus, the joint that matches the human ankle, and its point is the heel bone. Below it the cannon bone leads to the pastern and hoof.",
      },
    ],
  },
];
