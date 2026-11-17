import { asset } from "./asset";

/**
 * Editorial photography galleries (14 Nov 2026, owner's brief): photographs of Marwari horses from the owner's folder
 * "real marwari horse images" (123 files, used with the photographers' permission as confirmed by the owner), audited and
 * distributed by theme across ten pages, one composition per page (the /legend strip was removed on 14 Nov 2026 at the owner's request), no photograph used twice.
 *
 * Audit, by environment and subject:
 * - palaces, havelis and carved doors (Rajasthan architecture): home, about (the /schools arcade was removed on 16 Nov 2026;
 *   its files stay because the home page's HomeThresholds still shows five of them)
 * - studio portraits on carpets and painted backdrops: fleet
 * - movement: gallop, trot, rearing in dust: science (the body at work), tournaments (speed)
 * - training ground, horses on the lead in fields: curriculum
 * - stable, tack and saddlery: safety
 * - quiet pairs, mare and foal, the elder and his horse: formerly legend (removed 17 Nov 2026, owner)
 * - adornment and the horsemen of Marwar: about
 * Left out: three collages, two screen captures with app icons, one exact duplicate, and frames already close to a chosen one.
 *
 * Files: public/images/marwari-editorial/<page>-NN.webp. Marked photographs found in the 15 Nov 2026 image audit were replaced
 * by original AI-generated editorial plates with the same published dimensions; their names end in `-original`. Remaining
 * third-party photographs retain the existing gallery attribution line and the full list in `photographers` below.
 * None of these photographs shows the academy, its horses, staff or cadets, and no caption says so.
 */
export type EditorialPhoto = { src: string; width: number; height: number; alt: string; title: string; note?: string; focus?: string };

export type EditorialLayout = "folio" | "studbook" | "anatomy" | "ledger" | "band" | "cascade" | "pair" | "plate";

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
      f("home-01-original", 1300, 867, "Before the chhatri", "A dark bay Marwari stands square in a sandy courtyard before a domed sandstone pavilion in golden haze."),
      f("home-03", 922, 1152, "The jharokha", "A black Marwari in gold coin jewellery stands before a carved stone lattice window."),
      f("home-04", 1350, 1800, "At the haveli door", "A black Marwari waits in the carved doorway of a painted haveli."),
      f("home-02-original", 1300, 949, "The carved gate", "A black Marwari with a jewelled neckband stands before a richly carved wooden door."),
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
      f("science-01-original", 1300, 1300, "Lift", "A Marwari springs up out of a cloud of golden dust, forelegs folded."),
      f("science-03", 1350, 1800, "The eye", "A close view of a black Marwari's eye beside a silver bridle."),
      f("science-02", 1300, 1300, "Extension", "A black Marwari trots out in full extension past a pink wall."),
      f("science-04", 1300, 1300, "Drive", "A black Marwari comes straight at the camera through drifting dust."),
      f("science-05-original", 1300, 1300, "Turn", "A black Marwari spins on its haunches on a dusty track before green trees."),
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
      /* 17 Nov 2026 (owner): Marwaris in plain working tack on a modern stable yard replace the third-party show-tack photographs
         (output/imagegen/bsah-2026-masters/safety-01..05). */
      f("safety-bsah-01", 1254, 1254, "The stall at dusk", "A bay Marwari in plain leather tack looks out of an open stall on a modern stable yard at dusk."),
      f("safety-bsah-02", 1086, 1448, "The saddle cloth", "A close view of a plain brown leather saddle on a quilted dark saddle pad, girth and stirrup on a bay Marwari."),
      f("safety-bsah-03", 1254, 1254, "Over the door", "A bay Marwari with inward-curving ears looks over its stable half-door on a modern stable yard."),
      f("safety-bsah-04", 1086, 1448, "The bridle", "A bay Marwari with a white star wears a plain brown snaffle bridle with a cavesson noseband."),
      f("safety-bsah-05", 1086, 1448, "Tacked up", "A bay Marwari stands saddled and bridled while a groom in olive checks the girth."),
    ],
    credit: "Generated studies of Marwari horses in working tack, not photographs of BSAH stock.",
  },
  /* /tournaments "Ground covered at a gallop" (speed band) removed 17 Nov 2026 (owner). Two of its photographs now open the /about desert plate. */
  curriculum: {
    id: "training-ground",
    layout: "cascade",
    label: "The training ground",
    inscription: "Lesson",
    voice: "by lesson.",
    lede: "Ground work comes before the saddle: standing square, walking on the lead, waiting. Patience is the first rank.",
    photos: [
      f("curriculum-01-original", 1290, 1290, "On the lead", "A black Marwari walks on a lead rope across sandy ground under a pale sky."),
      f("curriculum-03", 1144, 1525, "Waiting", "A black Marwari with a blaze stands on a lead beside a river, ears pricked."),
      f("curriculum-05", 1300, 1300, "Square", "A black Marwari stands square in dry scrub, head high."),
      f("curriculum-02-original", 1285, 1285, "In the field", "A bay Marwari stands in an open field on a hazy morning."),
      f("curriculum-04", 1353, 1800, "Presented", "A black Marwari with white socks stands on green grass."),
      f("curriculum-06", 1066, 1421, "Attention", "A dark Marwari with a white blaze looks toward the camera, ears touching at the tips."),
    ],
    credit: PERMISSION,
  },
  /* /legend "Trust · Gentle by nature" (the quiet pairs: mare and foal, nose to nose, an old friend, stillness, evening) removed
     17 Nov 2026 (owner). Its five files, public/images/marwari-editorial/parents-01..05, stay on disk, unused. */
  /* 17 Nov 2026 (owner: "wedding horse, put the desert horse images; this text doesn't suit here, make it light"): the jewellery
     and wedding-finery photographs are gone; the plate is now the Marwari in its own country, the Thar, in plain words. */
  about: {
    id: "desert-plate",
    layout: "plate",
    label: "The Thar",
    inscription: "Born",
    voice: "of the desert.",
    lede: "The Marwari comes from the sand country of Rajasthan. Heat and distance shaped a light-footed, hardy horse.",
    photos: [
      f("legend-07-original", 1300, 867, "Dust at dusk", "A dark Marwari plunges forward through a cloud of golden dust at sunset."),
      f("tournaments-02", 1350, 1800, "Through the haze", "A bay Marwari gallops across a dusty field, light behind it."),
      f("about-desert-03", 1024, 688, "The dunes", "A bay Marwari walks along a dune crest in the Thar at sunset."),
      f("about-desert-04", 1350, 896, "Evening", "A bay Marwari stands in desert scrub, the sun low behind it."),
      f("about-05-original", 1099, 1300, "A keeper of the breed", "A man in a saffron turban holds a black Marwari on a red rope halter in the desert at dusk."),
    ],
    credit: "I, II and V are photographs of Marwari horses, used with the photographers' permission; III and IV are generated studies.",
  },
} satisfies Record<string, EditorialGallery>;

export type EditorialPage = keyof typeof editorialGalleries;
