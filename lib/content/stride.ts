import type { HotspotId } from "@/lib/stride/store";

/**
 * Copy for /stride ("The Science of the Stride"). Claims follow Blueprint Part 9: the only health-adjacent figure is "about a
 * hundred" movements a minute (supported, hippotherapy literature); the rest describes what the animation shows. Numbers that
 * come from the animation are filled in on the page from the data, never typed here. "No" rows of the ledger are not used.
 */
export const strideCopy = {
  headline: { inscription: "A hundred steps.", voice: "A minute." },
  lede: "At the walk, a horse's back moves the rider's pelvis about a hundred times a minute, much like a person walking. The rider's job is to move with it. This is how the two bodies keep time.",
  scrollCue: "Scroll to follow one stride",
  honestNote:
    "The horse is the academy's 3D Marwari. Its walk is an authored animation, built from published stride data and not captured from a living horse, so every curve on this page is illustrative.",
};

export const chapters = [
  {
    id: "beats",
    number: "I",
    title: "Four beats, four hooves.",
    body: "At the walk each hoof lands on its own, always in the same order: left hind, left fore, right hind, right fore. Between two landings there is a quarter of a stride, and at every moment at least two hooves are on the ground. That even rhythm is what a rider feels as a steady swing.",
  },
  {
    id: "back",
    number: "II",
    title: "The back carries the saddle.",
    body: "Each hind leg steps under the body and the pelvis tilts and turns with it. The movement travels forward along the spine to the saddle, so the rider's seat is never still: it rises and falls a little, sways from side to side, and rocks forward and back, all within the same stride.",
  },
  {
    id: "seat",
    number: "III",
    title: "A seat that follows.",
    body: "A rider who sits upright and soft lets the pelvis follow the saddle instead of fighting it. The pelvis moves a little behind the horse's back, the chest steadies, and the head barely moves. The rider never moves on their own: every motion you see here answers the horse.",
  },
] as const;

export type HotspotCopy = {
  id: HotspotId;
  label: string;
  title: string;
  /** Plain-language explanation, ledger-safe. */
  body: string;
  /** What to look for in the animation. */
  watch: string;
};

export const hotspotCopy: HotspotCopy[] = [
  {
    id: "spine",
    label: "Horse spine",
    title: "The back is not a plank.",
    body: "Between the withers and the croup the spine bends a little with every stride, and the saddle sits on this moving line. The bend is small and rhythmic, which is why a good saddle fit and a quiet seat matter.",
    watch: "Switch on the skeleton and watch the loin and the back swing in time with the hind legs.",
  },
  {
    id: "pelvis",
    label: "Horse pelvis",
    title: "The engine sits behind the saddle.",
    body: "The horse's pelvis turns and tilts as each hind leg reaches under the body. This is the movement the rider's own pelvis answers: it arrives at the saddle a fraction later.",
    watch: "From behind, the croup rocks from side to side once in every stride.",
  },
  {
    id: "shoulder",
    label: "Shoulder",
    title: "The forelimb swings from the shoulder.",
    body: "The foreleg swings forward and back from the shoulder, and the head and neck move in rhythm with it. The neck is the horse's balancing pole: it lets the shoulder swing without the body lurching.",
    watch: "The shoulder, elbow and knee fold in turn as each fore hoof is carried forward.",
  },
  {
    id: "hindquarters",
    label: "Hindquarters",
    title: "The hind leg folds, then pushes.",
    body: "The hind leg is carried forward with the stifle and hock folded, set down, and then pushes the body forward over the stance. The hock opens almost fully straight at the end of the push.",
    watch: "The hock angle falls as the leg is lifted and opens again as the hoof is set down and pushed back.",
  },
  {
    id: "rider-pelvis",
    label: "Rider pelvis",
    title: "The pelvis answers the saddle.",
    body: "The rider's pelvis follows the horse's back in all three directions: up and down, side to side, and a gentle forward and backward tilt. A soft seat means the pelvis is carried by the movement rather than bounced by it.",
    watch: "Compare the two curves in the graph: the rider's line follows the horse's, slightly later.",
  },
  {
    id: "hoof",
    label: "Hoof and ground",
    title: "Each hoof is planted, then lifted.",
    body: "While a hoof carries weight it should stay where it landed, because the ground does not move under it. The gold rings mark where each hoof landed; the ground slides past, and the hoof stays on its ring until it lifts.",
    watch: "Count the landings: left hind, left fore, right hind, right fore, a quarter of a stride apart.",
  },
];

export const notes = {
  title: "What this shows, and what it does not.",
  items: [
    {
      head: "The horse",
      body: "The Marwari is the academy's rigged 3D model. Its Walk is an authored animation made with inverse kinematics from published stride data. It is not motion capture, so nothing on this page is a measurement of a living horse.",
    },
    {
      head: "The curves",
      body: "Every curve is read from the transforms of the animation while it plays: the saddle's seat frame on the horse's back, and the pelvis bone of the rider. They are labelled illustrative: derived from the animation, not measured.",
    },
    {
      head: "The tempo",
      body: "The clip was authored at 75 strides a minute. It is played here at 50, so that the seat's up-and-down, fore-and-aft and tilt movements come round about a hundred times a minute, the figure quoted in hippotherapy literature (American Hippotherapy Association). The side-to-side sway comes round once a stride.",
    },
    {
      head: "The rider",
      body: "The rider is a stylised cadet figure on a five-bone rig. It sits on four points of the horse's back and follows them through a soft-seat model (second order, 5 Hz, damping 0.7). That model is a choice, not a measurement.",
    },
    {
      head: "The feet",
      body: "As authored, the clip lets a planted hoof slide several centimetres across the ground. A small inverse-kinematics correction holds each planted hoof where it landed, from just after touchdown to just before lift-off, and leaves the swing and the hoof’s own roll alone. The laboratory shows the distance a planted hoof still moves, with and without the correction.",
    },
  ],
};
