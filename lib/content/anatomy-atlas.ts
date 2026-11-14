import type { FP, GaitId, LimbId, V } from "@/lib/anatomy/atlas-rig";

/**
 * Copy and layout for the interactive anatomy atlas on /anatomy (components/sections/anatomy/atlas). Anatomical names follow
 * standard veterinary nomenclature (Nomina Anatomica Veterinaria, as used in Budras, Sack & Röck, "Anatomy of the Horse";
 * Sisson & Grossman). Superficial muscles only, lateral view. Gait timing follows the textbook footfall sequences (Back &
 * Clayton, "Equine Locomotion"). Values the atlas animates are idealised for teaching; REVIEW lists what needs expert review.
 */

export type AtlasView = "skeleton" | "muscle" | "rider";

export type Structure = { name: string; kind: "bone" | "muscle" | "ligament" | "rider"; text: string };

export const STRUCTURES: Record<string, Structure> = {
  // skeleton
  skull: { name: "Skull", kind: "bone", text: "A long face carries the cheek teeth. The orbit sits high and far back, which gives the horse its very wide field of view." },
  mandible: { name: "Mandible", kind: "bone", text: "The deep ramus of the lower jaw anchors the masseter, the large chewing muscle that shapes the cheek." },
  "atlas-axis": { name: "Atlas (C1) and axis (C2)", kind: "bone", text: "The poll. The joint between skull and atlas nods the head; the joint between atlas and axis turns it." },
  cervical: { name: "Cervical vertebrae (C1–C7)", kind: "bone", text: "Seven neck vertebrae run low in the neck in a gentle S-curve. The crest you see above them is muscle and the nuchal ligament." },
  withers: { name: "Withers (T2–T9 spines)", kind: "bone", text: "The tall spinous processes of the first thoracic vertebrae, highest around T4–T6. They anchor the nuchal ligament and the muscles that sling the shoulder." },
  thoracic: { name: "Thoracic vertebrae (T1–T18)", kind: "bone", text: "Eighteen vertebrae, each carrying a pair of ribs. The saddle rests over the middle and rear of this section." },
  ribs: { name: "Ribs (18 pairs)", kind: "bone", text: "Eight true ribs reach the sternum; the rest join through cartilage to form the curved costal arch." },
  sternum: { name: "Sternum", kind: "bone", text: "The breastbone, a keel of fused segments between the forelimbs that the true ribs and the pectoral muscles attach to." },
  lumbar: { name: "Lumbar vertebrae (L1–L6)", kind: "bone", text: "Usually six, without ribs. With the muscles above them they form the loin, the bridge that carries the push of the hindquarters forward." },
  sacrum: { name: "Sacrum", kind: "bone", text: "Five fused vertebrae joined to the pelvis at the sacroiliac joints. Just in front, the lumbosacral joint is where the hindquarters tuck under." },
  caudal: { name: "Caudal vertebrae", kind: "bone", text: "About fifteen to twenty-one small vertebrae in the dock of the tail." },
  pelvis: { name: "Pelvis", kind: "bone", text: "Ilium, ischium and pubis. Its landmarks are the point of the hip (tuber coxae) and the point of the buttock (tuber ischii)." },
  scapula: { name: "Scapula", kind: "bone", text: "The horse has no collarbone. The shoulder blade is held to the trunk only by muscle, the thoracic sling, so it can rotate with every stride." },
  humerus: { name: "Humerus", kind: "bone", text: "Angled down and back from the point of the shoulder to the elbow." },
  radius: { name: "Radius and ulna", kind: "bone", text: "Fused in the horse. The olecranon of the ulna forms the point of the elbow, where the triceps attaches." },
  carpus: { name: "Carpus (knee)", kind: "bone", text: "Seven or eight small bones in two rows, the equivalent of the human wrist. It locks straight under weight and folds in the swing." },
  cannon: { name: "Cannon (third metacarpal)", kind: "bone", text: "The main bone of the lower foreleg, with the slender splint bones (second and fourth metacarpals) behind it on either side." },
  fetlock: { name: "Fetlock and sesamoids", kind: "bone", text: "Under load the fetlock sinks as the suspensory apparatus stretches over the sesamoid bones, then springs back, storing and returning energy." },
  pastern: { name: "Pastern (P1 and P2)", kind: "bone", text: "The first and second phalanges, set at an angle close to that of the hoof wall." },
  coffin: { name: "Coffin bone (P3)", kind: "bone", text: "The third phalanx inside the hoof capsule, with the small navicular bone behind it." },
  femur: { name: "Femur", kind: "bone", text: "The thigh bone. In the horse the stifle sits low and forward, at the level of the flank." },
  stifle: { name: "Stifle and patella", kind: "bone", text: "The horse's knee. The patella can lock over the femur, part of the stay apparatus that lets a horse doze standing." },
  tibia: { name: "Tibia", kind: "bone", text: "The bone of the gaskin. The fibula is reduced to a slender splinter on its outer side." },
  hock: { name: "Hock (tarsus)", kind: "bone", text: "The calcaneus forms the point of the hock. Hock and stifle flex and extend together, linked by the reciprocal apparatus." },
  "hind-cannon": { name: "Hind cannon (third metatarsal)", kind: "bone", text: "Longer and rounder than the fore cannon, with splint bones behind it." },
  // muscles
  splenius: { name: "Splenius", kind: "muscle", text: "Raises and extends the head and neck; working on one side, it bends the neck." },
  brachiocephalicus: { name: "Brachiocephalicus", kind: "muscle", text: "Runs from the head and neck to the humerus. It draws the forelimb forward in the swing, or turns the neck when the limb is planted." },
  sternocephalicus: { name: "Sternocephalicus", kind: "muscle", text: "From the sternum to the jaw along the underside of the neck; it flexes the head and neck." },
  nuchal: { name: "Nuchal ligament", kind: "ligament", text: "An elastic band from the poll to the withers that carries much of the weight of the head and neck." },
  trapezius: { name: "Trapezius", kind: "muscle", text: "A thin fan over the withers and shoulder, part of the sling that lifts and steadies the scapula." },
  deltoid: { name: "Deltoideus", kind: "muscle", text: "Flexes the shoulder joint." },
  triceps: { name: "Triceps brachii", kind: "muscle", text: "The large mass behind the shoulder. It extends the elbow so the foreleg can carry weight." },
  latissimus: { name: "Latissimus dorsi", kind: "muscle", text: "From the back to the humerus; it draws the foreleg back during the stance." },
  serratus: { name: "Serratus ventralis", kind: "muscle", text: "The main muscle of the thoracic sling, suspending the trunk between the forelegs." },
  pectoral: { name: "Pectoral muscles", kind: "muscle", text: "Support the chest and draw the foreleg inward and forward." },
  longissimus: { name: "Longissimus dorsi", kind: "muscle", text: "The long back muscle under the saddle. It extends and steadies the back and passes the hindquarters' push forward." },
  oblique: { name: "External abdominal oblique", kind: "muscle", text: "Part of the abdominal wall. With the other abdominals it supports and lifts the back from below." },
  gluteus: { name: "Gluteal muscles", kind: "muscle", text: "The middle gluteal fills the croup: it extends the hip and drives the hindleg back. The superficial gluteal lies below it." },
  tfl: { name: "Tensor fasciae latae", kind: "muscle", text: "In front of the thigh; it flexes the hip and helps extend the stifle." },
  "biceps-femoris": { name: "Biceps femoris", kind: "muscle", text: "A hamstring muscle; it extends the hip and, by its parts, the stifle and hock." },
  semitendinosus: { name: "Semitendinosus", kind: "muscle", text: "The rear hamstring; it extends hip and hock when the hindleg pushes." },
  gastrocnemius: { name: "Gastrocnemius", kind: "muscle", text: "Extends the hock through the common calcaneal tendon to the point of the hock." },
  "hind-ext": { name: "Long digital extensor", kind: "muscle", text: "On the front of the gaskin; it extends the hind digit and flexes the hock." },
  "forearm-ext": { name: "Forearm extensors", kind: "muscle", text: "The extensor carpi radialis and common digital extensor straighten the knee and digit as the leg reaches forward." },
  "forearm-flex": { name: "Forearm flexors", kind: "muscle", text: "Fold the knee and digit in the swing; their tendons run down behind the cannon." },
  "flexor-tendons": { name: "Flexor tendons", kind: "ligament", text: "The superficial and deep digital flexor tendons, with the suspensory ligament, support the fetlock under load." },
  // rider
  "r-skull": { name: "Rider's head", kind: "rider", text: "Head balanced over the shoulders and eyes up: a small change in where the head sits shifts the rider's balance." },
  "r-spine": { name: "Rider's spine", kind: "rider", text: "A tall, relaxed column stacked over the seat: ear, shoulder, hip and heel close to one vertical line." },
  "r-lumbar": { name: "Rider's lower back", kind: "rider", text: "The lumbar spine stays supple so the pelvis can follow the horse's back without the upper body rocking." },
  "r-pelvis": { name: "Rider's pelvis and seat bones", kind: "rider", text: "The seat bones (ischial tuberosities) carry the weight into the saddle; the pelvis swings with the horse's back." },
  "r-femur": { name: "Rider's thigh", kind: "rider", text: "Long and relaxed along the saddle, without gripping." },
  "r-tibia": { name: "Rider's lower leg", kind: "rider", text: "Hangs under the hip, heel a little lower than the toe, the ball of the foot in the stirrup." },
  "r-arm": { name: "Rider's arms", kind: "rider", text: "Elbows bent and elastic, so the hands can follow the horse's head and keep a steady contact." },
};

export type LabelDef = { s: string; at: FP; text: V; align?: "start" | "end"; name?: string };

/**
 * Fixed label positions in drawing units, in the margins around the horse (left column ends at x 100, right column starts at
 * x 880, a row above the back and one below the ground); the leader line follows the animated anatomy.
 */
const L = (s: string, name: string, at: FP, text: V, align: "start" | "end" = "start"): LabelDef => ({ s, name, at, text, align });
export const LABELS: Record<AtlasView, LabelDef[]> = {
  skeleton: [
    L("atlas-axis", "Atlas & axis", ["neck", 262, 284], [290, 104]),
    L("withers", "Withers", ["trunk", 452, 270], [372, 150]),
    L("thoracic", "Thoracic spine", ["trunk", 600, 318], [604, 168]),
    L("lumbar", "Lumbar spine", ["trunk", 668, 322], [660, 214]),
    L("sacrum", "Sacrum", ["trunk", 736, 336], [780, 252]),
    L("skull", "Skull", ["head", 190, 300], [100, 248], "end"),
    L("mandible", "Mandible", ["head", 222, 372], [100, 336], "end"),
    L("cervical", "Neck vertebrae", ["neck", 320, 326], [100, 404], "end"),
    L("scapula", "Scapula", ["LF.scap", 428, 326], [100, 456], "end"),
    L("humerus", "Humerus", ["LF.hum", 380, 420], [100, 496], "end"),
    L("radius", "Radius & ulna", ["LF.rad", 396, 506], [100, 536], "end"),
    L("carpus", "Carpus", ["LF.can", 392, 557], [100, 576], "end"),
    L("cannon", "Cannon", ["LF.can", 394, 594], [100, 616], "end"),
    L("fetlock", "Fetlock", ["LF.pas", 402, 626], [100, 656], "end"),
    L("pelvis", "Pelvis", ["trunk", 790, 384], [880, 322]),
    L("caudal", "Tail vertebrae", ["tail", 808, 430], [880, 366]),
    L("femur", "Femur", ["LH.fem", 728, 430], [880, 446]),
    L("stifle", "Stifle & patella", ["LH.fem", 694, 462], [880, 486]),
    L("tibia", "Tibia", ["LH.tib", 736, 512], [880, 526]),
    L("hock", "Hock", ["LH.can", 786, 534], [880, 566]),
    L("hind-cannon", "Hind cannon", ["LH.can", 760, 594], [880, 606]),
    L("coffin", "Coffin bone", ["LH.hoof", 744, 690], [880, 690]),
    L("ribs", "Ribs", ["trunk", 566, 430], [570, 752]),
    L("sternum", "Sternum", ["trunk", 470, 462], [440, 752]),
  ],
  muscle: [
    L("nuchal", "Nuchal ligament", ["neck", 300, 258], [250, 104]),
    L("splenius", "Splenius", ["neck", 330, 276], [372, 150]),
    L("trapezius", "Trapezius", ["trunk", 450, 290], [470, 186]),
    L("latissimus", "Latissimus dorsi", ["trunk", 560, 320], [604, 168]),
    L("longissimus", "Longissimus dorsi", ["trunk", 650, 304], [660, 214]),
    L("gluteus", "Gluteals", ["trunk", 720, 300], [780, 252]),
    L("brachiocephalicus", "Brachiocephalicus", ["neck", 318, 330], [100, 300], "end"),
    L("sternocephalicus", "Sternocephalicus", ["neck", 300, 362], [100, 380], "end"),
    L("deltoid", "Deltoideus", ["LF.scap", 420, 360], [100, 456], "end"),
    L("triceps", "Triceps", ["LF.hum", 420, 420], [100, 496], "end"),
    L("pectoral", "Pectorals", ["LF.hum", 370, 456], [100, 536], "end"),
    L("forearm-ext", "Forearm extensors", ["LF.rad", 386, 500], [100, 576], "end"),
    L("forearm-flex", "Forearm flexors", ["LF.rad", 408, 506], [100, 616], "end"),
    L("tfl", "Tensor fasciae latae", ["trunk", 684, 330], [880, 322]),
    L("biceps-femoris", "Biceps femoris", ["LH.fem", 790, 400], [880, 406]),
    L("semitendinosus", "Semitendinosus", ["LH.fem", 812, 430], [880, 446]),
    L("gastrocnemius", "Gastrocnemius", ["LH.tib", 780, 500], [880, 526]),
    L("hind-ext", "Digital extensor", ["LH.tib", 726, 500], [880, 566]),
    L("flexor-tendons", "Flexor tendons", ["LH.can", 772, 600], [880, 640]),
    L("oblique", "External oblique", ["trunk", 600, 420], [570, 752]),
    L("serratus", "Serratus ventralis", ["trunk", 476, 418], [400, 752]),
  ],
  rider: [
    L("r-skull", "Head", ["R.head", 536, 124], [640, 104]),
    L("r-spine", "Spine", ["R.thorax", 540, 196], [640, 150]),
    L("r-lumbar", "Lower back", ["R.lumbar", 542, 250], [640, 196]),
    L("r-pelvis", "Pelvis & seat bones", ["R.pelvis", 544, 284], [700, 242]),
    L("r-arm", "Elastic arms", ["R.fore", 520, 250], [380, 150], "end"),
    L("withers", "Withers", ["trunk", 452, 270], [380, 196], "end"),
    L("longissimus", "Longissimus dorsi", ["trunk", 640, 304], [880, 300]),
    L("r-femur", "Thigh", ["R.thigh", 522, 340], [470, 752]),
    L("r-tibia", "Lower leg", ["R.shin", 518, 450], [600, 752]),
  ],
};

/** the three connections of the earlier exhibit, kept: each focuses the drawing and lights the structures that work together */
export const CONNECTIONS = [
  {
    id: "poll_cervical",
    number: "01",
    system: "Brain",
    title: "Cervical alignment",
    subtitle: "Ears & attention",
    text: "A balanced head and a soft neck keep the rider's hands quiet, and leave the horse's poll and ears free to listen.",
    rider: "Head over shoulders, soft rein contact",
    horse: "Poll (C1–C2), the cervical arch, splenius and brachiocephalicus",
    focus: [70, 80, 520, 380] as [number, number, number, number],
    lights: ["atlas-axis", "cervical", "skull", "splenius", "brachiocephalicus", "nuchal", "r-skull", "r-arm"],
  },
  {
    id: "withers_thorax",
    number: "02",
    system: "Heart",
    title: "Core posture",
    subtitle: "Withers & seat",
    text: "Ribcage stacked over the seat bones: the horse's back can lift under the saddle instead of hollowing away from the weight.",
    rider: "Thoracic core and a balanced seat",
    horse: "Withers (T2–T9), scapula and the thoracic sling",
    focus: [330, 60, 440, 320] as [number, number, number, number],
    lights: ["withers", "thoracic", "scapula", "trapezius", "triceps", "serratus", "r-spine", "r-pelvis"],
  },
  {
    id: "lumbosacral_pelvis",
    number: "03",
    system: "Spine",
    title: "Lumbar balance",
    subtitle: "Reins & contact",
    text: "A supple lower back follows the horse's back as it rises and swings. At the walk it moves the rider's pelvis about a hundred times a minute, much like walking.",
    rider: "Supple lumbar spine and a following pelvis",
    horse: "The lumbosacral junction, pelvis, gluteals and hamstrings",
    focus: [500, 130, 460, 330] as [number, number, number, number],
    lights: ["lumbar", "sacrum", "pelvis", "gluteus", "biceps-femoris", "longissimus", "r-lumbar", "r-pelvis"],
  },
] as const;

export const ZOOMS = [
  { id: "all", label: "Whole horse", box: [-120, 50, 1200, 790] as [number, number, number, number] },
  { id: "fore", label: "Foreleg", box: [250, 320, 330, 390] as [number, number, number, number] },
  { id: "hind", label: "Hindleg", box: [600, 270, 340, 440] as [number, number, number, number] },
];

export const GAIT_INFO: Record<GaitId, { label: string; beats: string; sequence: string; note: string }> = {
  halt: { label: "Halt", beats: "Square", sequence: "All four hooves down", note: "Weight is shared unevenly: the forehand carries roughly 55–60% of the horse's weight at rest." },
  walk: { label: "Walk", beats: "Four-beat lateral", sequence: "LH · LF · RH · RF", note: "Two or three hooves are always on the ground. The back swings and the head nods twice in each stride." },
  trot: { label: "Trot", beats: "Two-beat diagonal", sequence: "LF + RH · RF + LH", note: "Diagonal pairs land together, with a moment of suspension between them. The head stays steady; the back rises and falls twice a stride." },
  canter: { label: "Canter", beats: "Three-beat", sequence: "LH · RH + LF · RF (right lead)", note: "The leading foreleg lands last, then all four hooves leave the ground. The horse rocks from the hindquarters to the forehand once a stride." },
};

export const LIMB_ORDER: LimbId[] = ["LH", "LF", "RH", "RF"];
export const LIMB_NAMES: Record<LimbId, string> = { LH: "Left hind", LF: "Left fore", RH: "Right hind", RF: "Right fore" };

/** shown on the page: what the drawing simplifies and what an expert should check */
export const REVIEW = [
  "Proportions are an idealised 150 cm Marwari, not a measured individual; the rider is a generic young cadet.",
  "Joint-angle curves and limb arcs are smooth approximations of published gait kinematics, slowed for study. They are not motion-capture data and should be checked by an equine biomechanist.",
  "Muscles are simplified superficial groups in lateral view; deep muscles, fascia and fibre direction are left out.",
  "The centre-of-gravity markers and the weight split at halt are commonly cited approximations, not measurements of this horse and rider.",
  "The vertebral formula shown (C7, T18, L6, S5) is the usual one; individual horses vary, especially in the lumbar and tail sections.",
];
