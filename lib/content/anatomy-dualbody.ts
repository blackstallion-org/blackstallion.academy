/**
 * "One conversation. Two bodies." — the rider ↔ horse connections shown on the 3D dual-body stage
 * (components/sections/anatomy/DualBody.tsx). Copy only; the engine owns geometry and camera framing.
 * Claims: anatomical names only, no physiological numbers (Blueprint Part 9). Muscle notes corrected 24 Oct 2026
 * (hip extensors, thoracic sling, splenius attachments); have an equine vet or anatomist sign them off before launch.
 */

export type MuscleRegion = "poll_cervical" | "withers_thorax" | "thoracolumbar" | "lumbosacral_pelvis";
export type ViewMode = "coat" | "bone" | "muscle" | "posture";
export type GaitKey = "walk" | "trot" | "canter";

export type DualBodyConnection = {
  id: "cervical" | "core" | "lumbar";
  number: string;
  title: string;
  /** The rider's half of the conversation. */
  rider: string;
  /** The horse's half. */
  horse: string;
  /** One idea, one short paragraph. */
  lesson: string;
  /** Short caps labels for the two pins on the stage. */
  pinRider: string;
  pinHorse: string;
  /** Muscle groups lit in Muscle view. */
  regions: MuscleRegion[];
};

export const dualBodyIntro = {
  label: "Rider and horse",
  inscription: "One conversation.",
  voice: "two bodies.",
  body: "What the rider's body does, the horse's body feels. Choose a connection to see where it starts and where it lands.",
  canvasNote: "Drag to turn the horse. Choose a connection to move closer.",
};

export const dualBodyConnections: DualBodyConnection[] = [
  {
    id: "cervical",
    number: "01",
    title: "Cervical alignment",
    rider: "Head over shoulders, eyes ahead, soft elbows",
    horse: "Poll, cervical arch and lyre ears",
    lesson:
      "A cadet who looks ahead and keeps the elbows soft leaves the horse's neck free to lift. Drop the eyes and the hands follow. The horse feels it at the poll.",
    pinRider: "Cadet · head and neck",
    pinHorse: "Marwari · poll",
    regions: ["poll_cervical"],
  },
  {
    id: "core",
    number: "02",
    title: "Core posture",
    rider: "Ribcage stacked over the seat bones",
    horse: "Withers, scapula and longissimus dorsi",
    lesson:
      "Ribcage over seat bones puts the rider's weight where the horse can carry it. Collapse forward and the horse tends to hollow its back under the saddle.",
    pinRider: "Cadet · core and seat",
    pinHorse: "Marwari · withers",
    regions: ["withers_thorax", "thoracolumbar"],
  },
  {
    id: "lumbar",
    number: "03",
    title: "Lumbar balance",
    rider: "A supple lower back and a following pelvis",
    horse: "Lumbosacral junction, pelvis and gluteals",
    lesson:
      "The push starts in the hindquarters and travels through the horse's back into the saddle. A lower back that follows lets it through. A stiff one blocks it.",
    pinRider: "Cadet · lower back",
    pinHorse: "Marwari · lumbosacral junction",
    regions: ["lumbosacral_pelvis"],
  },
];

export const muscleGroups: Record<MuscleRegion, { title: string; note: string }> = {
  poll_cervical: {
    title: "Splenius and brachiocephalicus",
    note: "The splenius runs from the poll to the withers, the brachiocephalicus from the poll to the upper foreleg. They raise and turn the head and neck; the brachiocephalicus also draws the foreleg forward.",
  },
  withers_thorax: {
    title: "Trapezius, deltoideus and triceps",
    note: "Over and behind the shoulder blade. They steady the blade and swing the foreleg; beneath them, the serratus ventralis and the pectorals hold the chest in a sling that lifts the withers.",
  },
  thoracolumbar: {
    title: "Longissimus dorsi",
    note: "The long back muscle under the saddle. It steadies and extends the back, the bridge the push from behind crosses on its way forward.",
  },
  lumbosacral_pelvis: {
    title: "Gluteus medius and biceps femoris",
    note: "The hindquarter engine. They straighten the hip and help straighten the hock: that extension drives the horse forward.",
  },
};

export const viewModes: { id: ViewMode; label: string; note: string }[] = [
  { id: "coat", label: "Coat", note: "The horse as the rider sees it." },
  { id: "bone", label: "Bone", note: "The frame: spine, ribs, shoulder and pelvis." },
  { id: "muscle", label: "Muscle", note: "The groups that answer the rider." },
  { id: "posture", label: "Posture", note: "Two lines: the rider's spine and the horse's back, moving together." },
];

export const gaits: { id: GaitKey; label: string; beat: string }[] = [
  { id: "walk", label: "Walk", beat: "Four beats" },
  { id: "trot", label: "Trot", beat: "Two beats, diagonal pairs" },
  { id: "canter", label: "Canter", beat: "Three beats" },
];
