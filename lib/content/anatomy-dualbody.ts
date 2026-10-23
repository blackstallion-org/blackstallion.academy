/**
 * "One conversation. Two bodies." — the rider ↔ horse connections shown on the 3D dual-body stage
 * (components/sections/anatomy/DualBody.tsx). Copy only; the engine owns geometry and camera framing.
 * Claims: anatomical names only, no physiological numbers (Blueprint Part 9).
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
  body: "Every change in the rider's body arrives in the horse's body. Choose a connection to see where it starts and where it lands.",
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
      "Ribcage over seat bones puts the rider's weight where the horse can carry it. Collapse forward and the back hollows under the saddle.",
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
    note: "Run from the poll down the neck to the shoulder. They lift and lengthen the neck when the hand allows it.",
  },
  withers_thorax: {
    title: "Trapezius, deltoideus and triceps",
    note: "Hold the shoulder blade in a sling and lift the base of the neck and the withers.",
  },
  thoracolumbar: {
    title: "Longissimus dorsi",
    note: "The long back muscle under the saddle. It carries the push from behind forward to the neck.",
  },
  lumbosacral_pelvis: {
    title: "Gluteus medius and biceps femoris",
    note: "The hindquarter engine. They flex the hip, stifle and hock and push the horse forward.",
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
