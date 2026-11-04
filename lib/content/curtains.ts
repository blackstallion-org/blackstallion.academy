import type { MediaKey } from "@/lib/content/media";

/**
 * The full-screen scroll curtain (components/motion/fx/CurtainChapters.tsx, first used on /parents) on the home page and the seven
 * reels: four photographs that draw up over one another as the page scrolls, one curtain per page. Every image is an existing
 * media key (AI placeholders until the shoot) and every line describes what the picture shows or what the page already says;
 * no figures, no health claims (Blueprint Part 9). The home curtain uses the four stills no other page uses (28 Oct 2026, owner's request:
 * no /legend photographs on the home page); two of them are atmospheric dust frames until the shoot supplies more. `time` is the small mono kicker on each frame.
 */
export type CurtainChapter = { image: MediaKey; time: string; title: string; line: string };
export type CurtainSet = { label: string; chapters: CurtainChapter[] };

export const curtains = {
  home: {
    label: "The academy in four frames",
    chapters: [
      { image: "heroDust", time: "I", title: "Out of the dust.", line: "A Marwari stallion breaks out of a cloud of desert dust: the breed the academy is built around." },
      { image: "riderLance", time: "II", title: "A lance at dusk.", line: "A young rider lowers a tent-pegging lance at the gallop: the skill the curriculum builds toward." },
      { image: "dustWall", time: "III", title: "Where the dust lifts.", line: "When a session ends, the track dust rises off the sand and the next cadets ride in." },
      { image: "dustPlume", time: "IV", title: "Then it settles.", line: "A last plume of dust thins out. The lineage is handed on, one cadet at a time." },
    ],
  },
  legend: {
    label: "The Marwari, in four frames",
    chapters: [
      { image: "legendSand", time: "I", title: "Born in the Thar.", line: "A Marwari's hooves lift out of deep desert sand." },
      { image: "legendEars", time: "II", title: "Ears that meet.", line: "The lyre-shaped ears curve inward until the tips touch: the breed's best-known mark." },
      { image: "legendNachni", time: "III", title: "Danced at weddings.", line: "In Rajasthan the Marwari danced at night in wedding processions." },
      { image: "legendBahadur", time: "IV", title: "Still on the ridge.", line: "A lone stallion on the dune at sunset: the lineage did not end." },
    ],
  },
  curriculum: {
    label: "The curriculum, in four frames",
    chapters: [
      { image: "currGroundcare", time: "I", title: "Hooves before hands.", line: "Every session begins in the stable: groundcare before the saddle." },
      { image: "currBarrel", time: "II", title: "Turns that teach balance.", line: "A tight turn around the barrel asks for a quiet seat and clear aids." },
      { image: "currArchery", time: "III", title: "Focus at the canter.", line: "A cadet draws a bow while the horse moves under her." },
      { image: "currTentpeg", time: "IV", title: "The peg.", line: "Tent pegging closes the progression: a lance, a gallop, a wooden peg." },
    ],
  },
  schools: {
    label: "A campus, in four frames",
    chapters: [
      { image: "schoolAerial", time: "I", title: "A campus, ready.", line: "A new riding arena beside the school grounds, seen from above at dusk." },
      { image: "schoolArenaNight", time: "II", title: "Under floodlights.", line: "A floodlit arena for the evening session." },
      { image: "bgPavilion", time: "III", title: "Beside the arena.", line: "A sandstone pavilion where families can watch." },
      { image: "tournPodium", time: "IV", title: "On the circuit.", line: "Three cadets on a podium receiving medals." },
    ],
  },
  cadets: {
    label: "The cadets, in four frames",
    chapters: [
      { image: "dayTack", time: "I", title: "Tack up first.", line: "Every cadet saddles their own horse, and an instructor checks the girth." },
      { image: "cadetRohan", time: "II", title: "Find the canter.", line: "A young cadet on a bay Marwari, rhythm before speed." },
      { image: "cadetAnanya", time: "III", title: "Hold the bow.", line: "A recurve in the hands of a teenage cadet: still, then released." },
      { image: "cadetZayd", time: "IV", title: "Lift the lance.", line: "A cadet holds a tent-pegging lance at dusk." },
    ],
  },
  science: {
    label: "The saddle, in four frames",
    chapters: [
      { image: "whyCrisis", time: "I", title: "The slouch.", line: "Hours over a screen teach the body to fold forward." },
      { image: "whyCure", time: "II", title: "The stack.", line: "In the saddle the spine stacks: head over shoulders over hips." },
      { image: "anatomyProfile", time: "III", title: "The horse's side.", line: "A horse in side profile: the back the rider's hips follow." },
      { image: "journalReins", time: "IV", title: "Quiet hands.", line: "Reins held lightly; the horse answers small signals." },
    ],
  },
  safety: {
    label: "Safety, in four frames",
    chapters: [
      { image: "safetyKit", time: "I", title: "Kit first.", line: "A helmet, gloves, vest and chaps, laid out before anyone mounts." },
      { image: "safetyInstructor", time: "II", title: "Checked by an instructor.", line: "A former cavalry instructor fastens a cadet's helmet." },
      { image: "safetyVet", time: "III", title: "A vet's eye.", line: "A veterinarian examines a Marwari's hoof." },
      { image: "fleetStallcam", time: "IV", title: "Watched at night.", line: "A night-vision view of a horse resting in its stall." },
    ],
  },
  fleet: {
    label: "The stable, in four frames",
    chapters: [
      { image: "fleetChetak", time: "I", title: "Chetak IX.", line: "A dark bay Marwari with a white blaze." },
      { image: "fleetVeer", time: "II", title: "Veer.", line: "A chestnut-gold Kathiawari stallion." },
      { image: "fleetKesar", time: "III", title: "Kesar.", line: "A skewbald Marwari stallion." },
      { image: "fleetArbudh", time: "IV", title: "Arbudh.", line: "A light bay Marwari with four white socks." },
    ],
  },
} satisfies Record<string, CurtainSet>;

export type CurtainKey = keyof typeof curtains;
