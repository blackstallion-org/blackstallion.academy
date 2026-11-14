import { asset } from "./asset";

/**
 * Editorial photography galleries (14 Nov 2026, owner's brief): photographs of Marwari horses from the owner's folder
 * "real marwari horse images" (123 files, used with the photographers' permission as confirmed by the owner), audited and
 * distributed by theme across ten pages, one composition per page (the /legend strip was removed on 14 Nov 2026 at the owner's request), no photograph used twice.
 *
 * Audit, by environment and subject:
 * - palaces, havelis and carved doors (Rajasthan architecture): home, schools, about
 * - studio portraits on carpets and painted backdrops: fleet
 * - movement: gallop, trot, rearing in dust: science (the body at work), tournaments (speed)
 * - training ground, horses on the lead in fields: curriculum
 * - stable, tack and saddlery: safety
 * - quiet pairs, mare and foal, the elder and his horse: parents
 * - black-and-white head studies, the curved ears: why
 * - adornment and the horsemen of Marwar: about
 * Left out: three collages, two screen captures with app icons, one exact duplicate, and frames already close to a chosen one.
 *
 * Files: public/images/marwari-editorial/<page>-NN.webp, made from the originals with white screen-capture borders trimmed,
 * long edge 1300 to 1800 px (small originals enlarged with Lanczos and light sharpening), WebP q82. Proportions are the
 * originals'. The photographers' own marks are left in the pictures. Per-picture credit lines are not shown; each gallery
 * carries one attribution line (`credit`), and the full list is in `photographers` below.
 * None of these photographs shows the academy, its horses, staff or cadets, and no caption says so.
 */
export type EditorialPhoto = { src: string; width: number; height: number; alt: string; title: string; note?: string; focus?: string };

export type EditorialLayout = "folio" | "studbook" | "anatomy" | "ledger" | "band" | "cascade" | "pair" | "arcade" | "contact" | "plate";

export type EditorialGallery = {
  id: string;
  layout: EditorialLayout;
  label: string;
  inscription: string;
  voice: string;
  lede: string;
  photos: EditorialPhoto[];
  credit: string;
};

const f = (name: string, width: number, height: number, title: string, alt: string, note?: string, focus?: string): EditorialPhoto => ({
  src: asset(`/images/marwari-editorial/${name}.webp`),
  width,
  height,
  title,
  alt,
  note,
  focus,
});

const PERMISSION = "Photographs of Marwari horses, used with the photographers' permission.";

export const photographers = [
  "Ekaterina Druz (equine-photo.net)",
  "Edyta Trojańska-Koch (equine-photo.com)",
  "Wojtek Kwiatkowski",
  "Hafner Photography",
  "van Alderen",
  "Gill Photography",
  "and other photographers in Rajasthan and Gujarat",
];

export const editorialGalleries = {
  home: {
    id: "royal-folio",
    layout: "folio",
    label: "The royal folio",
    inscription: "Bred for",
    voice: "the courts of Rajasthan.",
    lede: "For centuries the Marwari stood at palace gates and carved doors: proud, alert and impossibly elegant. A few portraits of the breed at home.",
    photos: [
      f("home-01", 1300, 867, "Before the chhatri", "A dark bay Marwari stands square in a sandy courtyard before a domed sandstone pavilion in golden haze."),
      f("home-03", 922, 1152, "The jharokha", "A black Marwari in gold coin jewellery stands before a carved stone lattice window."),
      f("home-04", 1350, 1800, "At the haveli door", "A black Marwari waits in the carved doorway of a painted haveli."),
      f("home-02", 1300, 949, "The carved gate", "A black Marwari with a jewelled neckband stands before a richly carved wooden door."),
      f("home-05", 1152, 1152, "Ochre and gold", "A black Marwari steps out against an ochre wall, a silver and gold collar at its throat."),
    ],
    credit: `${PERMISSION} Including Hafner Photography.`,
  },
  fleet: {
    id: "studbook-portraits",
    layout: "studbook",
    label: "Portraits of the breed",
    inscription: "Every one",
    voice: "a face you remember.",
    lede: "Studio portraits made on old carpets: the blaze, the lyre ears, the bright, wary eye. Photographs of the breed, not of the academy's own stallions.",
    photos: [
      f("fleet-01", 1080, 1346, "Tassels of red", "A black Marwari with a wide blaze wears a red-tasselled silver necklace against a patterned carpet."),
      f("fleet-02", 1080, 1346, "Night and day", "A black and a white Marwari stand side by side against a woven carpet."),
      f("fleet-03", 1080, 1346, "Turquoise", "A white Marwari with turquoise tassels turns its head against a carpet."),
      f("fleet-04", 1080, 1346, "The long blaze", "A dark bay Marwari with a long white blaze, close against a gold carpet."),
      f("fleet-05", 1080, 1346, "Piebald", "A black-and-white Marwari tosses its mane against a patterned carpet."),
      f("fleet-06", 1080, 1346, "In white", "A white Marwari faces the camera, ears curved inward, against a carpet."),
      f("fleet-07", 1300, 1138, "On green", "A black Marwari with a blaze turns, mane flying, against a mottled green backdrop."),
    ],
    credit: PERMISSION,
  },
  science: {
    id: "body-in-motion",
    layout: "anatomy",
    label: "The body at work",
    inscription: "Every stride",
    voice: "is an engine.",
    lede: "Muscle, bone and breath in motion: the same mechanics a cadet learns to feel through the saddle.",
    photos: [
      f("science-01", 1300, 1300, "Lift", "A Marwari springs up out of a cloud of golden dust, forelegs folded."),
      f("science-03", 1350, 1800, "The eye", "A close view of a black Marwari's eye beside a silver bridle."),
      f("science-02", 1300, 1300, "Extension", "A black Marwari trots out in full extension past a pink wall."),
      f("science-04", 1300, 1300, "Drive", "A black Marwari comes straight at the camera through drifting dust."),
      f("science-05", 1300, 1300, "Turn", "A black Marwari spins on its haunches on a dusty track before green trees."),
    ],
    credit: PERMISSION,
  },
  safety: {
    id: "stable-and-tack",
    layout: "ledger",
    label: "The stable",
    inscription: "Care",
    voice: "before every ride.",
    lede: "Safety is a habit kept in quiet places: a clean stall, a checked girth, a fitted bridle, a horse that knows the hand that leads it.",
    photos: [
      f("safety-01", 1300, 1300, "The stall at dusk", "A black Marwari in a leaf-pattern necklace looks out of a dark stable."),
      f("safety-03", 1350, 1800, "The saddle cloth", "A close view of an embroidered black and gold saddle cloth with a fringed edge."),
      f("safety-02", 1300, 1300, "Over the door", "A chestnut Marwari with a blaze leans its head over a stable half-door."),
      f("safety-04", 1350, 1800, "The bridle", "A black Marwari in a silver-studded bridle faces the camera against white."),
      f("safety-05", 1350, 1800, "Tacked up", "A black Marwari stands saddled and bridled on a carpet against a white studio wall."),
    ],
    credit: `${PERMISSION} Including Gill Photography.`,
  },
  tournaments: {
    id: "speed-band",
    layout: "band",
    label: "Speed",
    inscription: "Ground",
    voice: "covered at a gallop.",
    lede: "Tent pegging asks for the gallop at its truest: balanced, straight and unafraid. The breed was made for it.",
    photos: [
      f("legend-07", 1300, 867, "Dust at dusk", "A dark Marwari plunges forward through a cloud of golden dust.", undefined, "50% 45%"),
      f("tournaments-02", 1350, 1800, "Full stride", "A bay Marwari gallops across a dusty field, light behind it."),
      f("tournaments-03", 1350, 1800, "Spotted", "A spotted Marwari gallops across a green field."),
      f("tournaments-04", 1350, 1800, "Through the mustard", "A black Marwari bounds through yellow flowers."),
      f("tournaments-05", 1350, 1800, "White at speed", "A white Marwari canters across a field, mane up."),
    ],
    credit: PERMISSION,
  },
  curriculum: {
    id: "training-ground",
    layout: "cascade",
    label: "The training ground",
    inscription: "Lesson",
    voice: "by lesson.",
    lede: "Ground work comes before the saddle: standing square, walking on the lead, waiting. Patience is the first rank.",
    photos: [
      f("curriculum-01", 1290, 1290, "On the lead", "A black Marwari walks on a lead rope across sandy ground under a pale sky."),
      f("curriculum-03", 1144, 1525, "Waiting", "A black Marwari with a blaze stands on a lead beside a river, ears pricked."),
      f("curriculum-05", 1300, 1300, "Square", "A black Marwari stands square in dry scrub, head high."),
      f("curriculum-02", 1285, 1285, "In the field", "A bay Marwari stands in an open field on a hazy morning."),
      f("curriculum-04", 1353, 1800, "Presented", "A black Marwari with white socks stands on green grass."),
      f("curriculum-06", 1066, 1421, "Attention", "A dark Marwari with a white blaze looks toward the camera, ears touching at the tips."),
    ],
    credit: PERMISSION,
  },
  parents: {
    id: "quiet-pairs",
    layout: "pair",
    label: "Trust",
    inscription: "Gentle",
    voice: "by nature.",
    lede: "The Marwari is spirited, and gentle with the people it knows. Trust is what a child brings home.",
    photos: [
      f("parents-01", 1440, 1788, "Mare and foal", "A black Marwari mare and her foal stand together in a sandstone courtyard."),
      f("parents-02", 1300, 838, "Nose to nose", "Two Marwari horses touch noses in silhouette, the sun setting between them."),
      f("parents-04", 1300, 1300, "An old friend", "An elderly man in a pink turban rests his cheek against his black Marwari."),
      f("parents-03", 896, 1300, "Stillness", "A white Marwari stands on rocks at the edge of a misty lake."),
      f("parents-05", 1269, 846, "Evening", "A Marwari stands still on open ground, the sun breaking behind its shoulder."),
    ],
    credit: PERMISSION,
  },
  schools: {
    id: "heritage-arcade",
    layout: "arcade",
    label: "Heritage",
    inscription: "Arches",
    voice: "and open doors.",
    lede: "The breed belongs to Rajasthan's courtyards and gateways. A school that brings it home brings that heritage with it.",
    photos: [
      f("schools-01", 922, 1152, "Indigo", "A dark Marwari in jewellery stands before a blue-painted carved doorway."),
      f("schools-02", 1040, 1300, "Marble", "A chestnut Marwari with a blaze stands between white carved marble columns."),
      f("schools-03", 1350, 1800, "The gateway", "A black Marwari stands at the top of steps in a carved sandstone gateway."),
      f("schools-04", 895, 1300, "Painted haveli", "A black Marwari stands in the painted doorway of a haveli."),
      f("schools-05", 913, 1300, "Bougainvillea", "A dark Marwari stands beneath bougainvillea at an old doorway."),
      f("schools-06", 1350, 1800, "The steps", "A chestnut Marwari stands at the foot of white steps before a painted arch."),
    ],
    credit: `${PERMISSION} Including Ekaterina Druz.`,
  },
  why: {
    id: "ears-contact",
    layout: "contact",
    label: "Attention",
    inscription: "Ears that",
    voice: "never stop listening.",
    lede: "A Marwari's curved ears turn toward every sound. Riding asks a child for that same attention, with no screen to hide behind.",
    photos: [
      f("why-01", 1320, 1760, "Listening", "A black-and-white portrait of a Marwari head, ears curved to touch."),
      f("why-02", 975, 1300, "White", "A black-and-white portrait of a white Marwari against black."),
      f("why-03", 1320, 1760, "Alert", "A black-and-white portrait of a dark Marwari by a fence."),
      f("why-04", 1350, 1800, "Grey", "A black-and-white portrait of a grey Marwari in a bridle before a building."),
      f("why-05", 1066, 1421, "Forward", "A dark Marwari with a white blaze faces the camera, ears meeting at the tips."),
      f("why-06", 1144, 1525, "Turned", "A dark Marwari with a white blaze on a lead turns toward a sound."),
    ],
    credit: PERMISSION,
  },
  about: {
    id: "adornment-plate",
    layout: "plate",
    label: "The keepers",
    inscription: "Dressed",
    voice: "like a prince.",
    lede: "In Marwar a good horse wears silver: coin necklaces, tasselled bridles, embroidered cloths. The men who keep the breed alive keep that craft too.",
    photos: [
      f("about-01", 1300, 1040, "Coin necklace", "A black Marwari in a gold coin necklace and red tassels arches its neck before a fresco."),
      f("about-02", 1350, 1800, "Silver and red", "A close view of a Marwari's chest hung with layered silver coin ornaments and red cord."),
      f("about-03", 1112, 1300, "The headpiece", "A close view of a Marwari's head in a silver and red jewelled headpiece."),
      f("about-04", 1350, 1800, "Bridle work", "A dark Marwari in a beaded leather bridle, a field of yellow mustard behind."),
      f("about-05", 1099, 1300, "A keeper of the breed", "A man in a saffron turban holds a black Marwari in a colourful halter."),
    ],
    credit: `${PERMISSION} Including Ekaterina Druz.`,
  },
} satisfies Record<string, EditorialGallery>;

export type EditorialPage = keyof typeof editorialGalleries;
