import type { MediaKey } from "./media";

/**
 * Reel 01 · The Marwari. Written fresh from the breed history (Blueprint Part 9).
 * Anything marked legend is folklore as told in Marwar.
 */

export const title = {
  inscription: "The land",
  voice: "of death.",
  sub: "Marwar is often translated as “the land of death”. It gave India a horse that would not die easily, and would not leave the field.",
};

export const chapters = [
  { id: "ocean", numeral: "I", name: "Born of the ocean" },
  { id: "marwar", numeral: "II", name: "Marwar, 1193" },
  { id: "bred", numeral: "III", name: "Bred by law" },
  { id: "ears", numeral: "IV", name: "The ears" },
  { id: "omens", numeral: "V", name: "Omens" },
  { id: "reasons", numeral: "VI", name: "Three reasons" },
  { id: "honour", numeral: "VII", name: "Roll of honour" },
  { id: "dance", numeral: "VIII", name: "Born to dance" },
  { id: "fall", numeral: "IX", name: "The fall" },
  { id: "revival", numeral: "X", name: "The revival" },
  { id: "today", numeral: "XI", name: "Every cadet rides one" },
] as const;

export const ocean = {
  inscription: "Before history,",
  voice: "a horse king.",
  body: "Hindu scripture tells of the churning of the cosmic ocean, when gods and demons pulled a great serpent around a mountain until the sea gave up its treasures. Among them rose Uchchaihshravas: a white horse with seven heads, so radiant the gods made him king of horses. Every horse in India, the old stories say, descends from him: the hill ponies of Manipur, the Spiti and Zanskari of the high passes, the Kathiawari of Gujarat, and the Marwari of the Thar.",
  caption: "Uchchaihshravas rises from the churning of the ocean. Placeholder plate in the Marwar style.",
  theories: [
    { name: "The shipwreck", verdict: "Legend", text: "The Ain-i-Akbari, a sixteenth-century chronicle, tells of an Arab ship wrecked off Kutch, its seven horses swimming ashore to found a line." },
    { name: "The steppe", verdict: "Some influence", text: "Turkoman and Mongol horses arrived with invading armies and mixed with local mares." },
    { name: "The native", verdict: "Most accepted", text: "The Marwari shows little Arabian influence. At heart it is a horse of India." },
  ],
};

export const marwar = {
  inscription: "Driven into",
  voice: "the desert.",
  body: "In 1193 the Rathore clan lost Kannauj and rode west into the Thar, to the dry plains of Marwar. Little grew there. Water came by the cupful. The horses that lived were the ones that could march for days, through heat by day and cold by night, on scraps of fodder, and still carry a rider into a fight. The horses survived, and so did the Rathores. In time the clan grew strong again, and the desert had given it a horse.",
};

export const bred = {
  inscription: "Bred by",
  voice: "law.",
  body: "From the twelfth century the Rathores bred their horses strictly, keeping only the finest stallions. What they chose for is still in the breed.",
  traits: [
    { name: "Upright shoulder", text: "Lifts the hoof clean out of soft sand." },
    { name: "Slim, hard legs", text: "Built for distance, not the sprint." },
    { name: "Fine, silky coat", text: "Sheds desert heat." },
    { name: "Endurance", text: "Not the fastest horse alive. One of the hardest to tire." },
    { name: "The homing sense", text: "Lost in the desert, the saying goes, trust your horse to find the way home." },
    { name: "The revaal", text: "A smooth natural ambling gait, easy on a rider over long distances." },
  ],
};

export const ears = {
  inscription: "The tips",
  voice: "touch.",
  beats: [
    "A Marwari's ears curve inward until the tips meet, like the arms of a lyre.",
    "They can turn through 180 degrees, and the horse's hearing is famously sharp.",
    "When the blood is mixed, the curve is the first thing to go. Breeders read the ears as a seal of purity.",
    "That curve is our monogram.",
  ],
};

export const omens = {
  inscription: "Read the",
  voice: "horse.",
  body: "Old Marwar read a horse's colour and the whorls of its coat as a forecast. Breeders still listen.",
  tiles: [
    { name: "Grey", text: "Favoured above all; the most prized colour.", tone: "luck", swatch: "#b9b4ac" },
    { name: "Piebald & skewbald", text: "Close behind the greys.", tone: "luck", swatch: "split" },
    { name: "Blaze & four socks", text: "A white blaze and four white socks bring luck.", tone: "luck", swatch: "#6b4a2e" },
    { name: "Devman", text: "A long whorl down the neck: good fortune.", tone: "luck", swatch: "whorl" },
    { name: "Anusudhal", text: "A whorl beneath the eye: unwelcome to a rider.", tone: "ill", swatch: "whorl" },
    { name: "Black", text: "The colour of night and death, long thought unlucky.", tone: "ill", swatch: "#0d0b09" },
    { name: "White", text: "Pure white is not registered as Marwari; some call it Nukra, a type of its own.", tone: "apart", swatch: "#e9e4da" },
  ] as const,
  vow: {
    inscription: "They called the black horse an omen.",
    voice: "We call it a vow.",
    text: "The Black Stallion carries the colour the bards feared, as a promise: we will not leave the field.",
  },
};

export const reasons = {
  lead: "In the late sixteenth century the Rajputs of Marwar fielded a cavalry of more than fifty thousand. The Rathores held one belief about their horses: a Marwari leaves the battlefield in only three ways.",
  words: ["Victory.", "Death.", "Or carrying its rider home."],
  tail: "The bards tell of horses charging war elephants, rearing to shield a fallen rider, and leaping walls no horse should clear.",
};

export const honour: { name: string; when: string; text: string; image: MediaKey; legend?: boolean }[] = [
  {
    name: "Chetak",
    when: "Haldighati, 1576",
    text: "Maharana Pratap's blue-grey stallion reared against a war elephant so his rider could strike. A blade on the elephant's tusk tore his leg. He would not leave until Pratap turned him, then carried his king across a stream and away from the field before he fell. A memorial stands near Haldighati.",
    image: "legendChetak",
  },
  {
    name: "Bahadur",
    when: "Agra Fort, 1644",
    text: "After Amar Singh Rathore struck down Salabat Khan inside the fort, the story goes, his horse carried him onto the ramparts and leapt from the wall. The horse did not survive the fall.",
    image: "legendBahadur",
    legend: true,
  },
  {
    name: "Arbudh",
    when: "Marwar, 17th century",
    text: "Remembered as the war horse of Veer Durgadas Rathore, the general who kept Marwar's infant heir from the Mughals.",
    image: "fleetArbudh",
  },
  {
    name: "And the rest",
    when: "The ballads",
    text: "Kesar Kalmi, Udal and many more whose names survive only in song.",
    image: "legendGrey",
  },
];

export const honourClose = "Their courage kept kings and generals alive to fight again. India's history might have turned differently without them.";

export const dance = {
  inscription: "Born to",
  voice: "dance.",
  body: "Beyond war, the Marwari is a horse of celebration. Some lines carry a strain called nachni, “born to dance”, and with a skilled handler they step and rise to music at weddings and festivals. Many believe the true nachni line has almost faded. Glimpses remain.",
};

export const fall = {
  inscription: "From royalty",
  voice: "to the cart.",
  lines: [
    "For centuries only royal and Rajput warrior families could own these horses. A Marwari, it was said, stood above a prince.",
    "The British preferred their Thoroughbreds. Through the colonial years the Marwari went to fewer battles and was bred with less care; by the 1930s the stock was thinning.",
    "Marwar's lancers still rode for Sir Pratap Singh in the First World War, near the end of the age of cavalry.",
    "Then came independence. The princes gave up their states and, in the land reforms that followed, their estates.",
    "The stables had nowhere to go. Thousands of horses were sold as pack animals, castrated or shot. To many, the horse had become a symbol of the old order.",
    "Crossed with other breeds, the pure line began to disappear.",
  ],
};

export const revival = {
  inscription: "The line",
  voice: "that refused to end.",
  milestones: [
    { year: "Early 1900s", text: "Maharaja Umaid Singh of Jodhpur steps in to save the breed; his grandson, Maharaja Gaj Singh II, carries the work on." },
    { year: "1995", text: "British horsewoman Francesca Kelly founds Marwari Bloodlines; a breed society forms in India." },
    { year: "1999", text: "Kelly and Raghuvendra Singh Dundlod lead the founding of the Indigenous Horse Society of India." },
    { year: "2000s", text: "Endurance wins at the national games persuade the Equestrian Federation of India to sanction shows for indigenous horses." },
    { year: "2009", text: "Official registration begins; registered Marwaris are cold-branded." },
    { year: "Today", text: "The breed is no longer at risk, working in endurance, tent pegging, weddings and festivals." },
  ],
  vignette: {
    title: "The stallion that stayed",
    note: "As told in Marwar",
    text: "When Maharaja Gaj Singh II visited the thikana of Badgaon to choose a colt sired by its famous stallion Vangalia, he asked to see the sire himself. The thakur, afraid of losing his best horse, led Vangalia out. The Maharaja admired him and left him where he stood: the stallion served the breed best where the mares of south Marwar could reach him. He chose a colt and rode home.",
  },
};

export const today = {
  inscription: "Every cadet",
  voice: "rides one.",
  body: "The Marwari survived the desert, the wars and the years when India almost forgot it. At BSAH it does what it was bred for: it carries the next generation, and asks them to be worthy of the ride.",
  sources: "Breed history from the Marwari horse literature and breed-society records (see the claims ledger in the site blueprint). Stories marked legend are folklore as told in Marwar; details vary between sources.",
};
