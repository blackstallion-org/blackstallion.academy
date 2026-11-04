import type { MediaKey } from "./media";

/**
 * Reel 01 · The Marwari. Written fresh from the breed history (Blueprint Part 9),
 * revised per Master Refinement §3 (biological & historical origins, no mythology)
 * and §4 (the Traditional Lore of the Bards, isolated with BSAH neutrality insights).
 * Anything marked legend is folklore as told in Marwar.
 */

export const title = {
  inscription: "The land",
  voice: "of death.",
  sub: "Marwar is often translated as “the land of death”. It gave India a horse that would not die easily, and would not leave the field.",
};

/** The museum walk opens the page (chapter 0); the story runs I to X. */
export const chapters = [
  { id: "museum", numeral: "0", name: "The museum" },
  { id: "ocean", numeral: "I", name: "One bloodline" },
  { id: "marwar", numeral: "II", name: "Marwar, 1193" },
  { id: "bred", numeral: "III", name: "Bred by law" },
  { id: "ears", numeral: "IV", name: "The ears" },
  { id: "omens", numeral: "V", name: "The lore of the bards" },
  { id: "reasons", numeral: "VI", name: "Three reasons" },
  { id: "honour", numeral: "VII", name: "Roll of honour" },
  { id: "fall", numeral: "VIII", name: "The fall" },
  { id: "revival", numeral: "IX", name: "The revival" },
  { id: "today", numeral: "X", name: "Every cadet rides one" },
] as const;

export const ocean = {
  inscription: "Eight hundred years",
  voice: "in one bloodline.",
  sub: "Man saw the world from horseback, and the world expanded.",
  body: "For centuries, civilisation was shaped by the partnership between horse and rider, and the world expanded from horseback. The Marwari emerged from a complex historical crucible: native desert stock, infused with influences from Arabian and Central Asian lines, refined through generations of strict selective breeding by the horsemen of Rajasthan. Whatever the exact genetic currents of its origins, the result is an undeniable masterpiece of adaptation. The Thar Desert stripped away weakness; what remained was a sovereign breed unique to Indian soil — compact, fiercely loyal, and structurally engineered for survival, endurance and absolute grace.",
  caption: "A stallion of Marwar. Placeholder image.",
  theories: [
    {
      name: "The shipwreck",
      verdict: "Legend",
      text: "The sixteenth-century chronicle Ain-i-Akbari praises the horses of Kutch and repeats a tale of an Arab ship wrecked on that shore with seven fine Arab horses aboard. The tale belongs to Kutch and Gujarat, the home of the Kathiawari, and breed writers describe the Marwari as showing little Arab influence. We tell it as a legend, not as the Marwari's origin.",
    },
    {
      name: "The steppe",
      verdict: "Historical influence",
      text: "Over several centuries, military campaigns, migrations and trade networks brought Turkoman, Afghan and Central Asian steppe horses — including lines like the Akhal-Teke — into northern and western India. Bred with local mares, these sturdy warhorses infused the native stock with endurance, bone density and a natural capacity to thrive in hostile, arid environments: the raw stamina that desert horsemen needed simply to survive.",
    },
    {
      name: "The native",
      verdict: "A common view",
      text: "A widely held view is that the Marwari is fundamentally an indigenous horse of India, shaped by natural selection in the harsh Thar Desert. Genetic and phenotypic studies describe it as a distinct population, though its precise ancestry is not settled. Its lyre-shaped ears, curving inward until the tips touch, are the breed's most recognisable trait. For over eight centuries this rugged native bloodline was carefully preserved by the Rathore horsemen of Marwar to produce a horse that is, at its heart, an unbreakable product of Indian soil.",
    },
  ],
};

export const marwar = {
  inscription: "Driven into",
  voice: "the desert.",
  body: "Driven from fertile river plains into the arid expanse of the Thar, the horsemen of Marwar survived on terrain, not ideology. Little grew there. Water came by the cupful. The horses that lived were the ones that could march for days, through heat by day and cold by night, on scraps of fodder, and still carry a rider. The desert did not yield to rank, title or rhetoric. It rewarded stamina, efficiency and stillness, and in time it had given the people of Marwar a horse.",
};

export const bred = {
  inscription: "Bred by",
  voice: "law.",
  body: "For centuries the horse-breeders of Marwar bred strictly, keeping only the finest stallions. What they chose for is still in the breed.",
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
    "Each ear turns on its own, toward whatever the horse is listening to.",
    "When the blood is mixed, the curve is the first thing to go. Breeders read the ears as a seal of purity.",
    "That curve is our monogram.",
  ],
};

/** The Traditional Lore of the Bards (Master Refinement §4): oral folklore, isolated from history and science, each item paired with a BSAH neutrality insight. */
export const lore = {
  title: "The Traditional Lore of the Bards",
  inscription: "The Traditional Lore",
  voice: "of the Bards.",
  sub: "The oral histories, markings, and cadence of Marwar.",
  note: "What the bards attributed to fate, and how BSAH reads it today. This is folklore, kept apart from the history and the science; it varies by breeder and region, and a horse's colour or markings do not predict its temperament.",
  items: [
    {
      name: "Kala, the black horse",
      tag: "The omen vs. the vow",
      lore: "Bards and traveling traders historically viewed solid black horses (Kala) with superstition, associating dark coats with night, death and unpredictable temperaments.",
      insight: "We reject superstition in favour of character. To us, the black coat represents the Vow of Absolute Loyalty: in Marwar tradition, a Marwari leaves the battlefield in three ways — in victory, in death, or carrying its wounded rider to safety. The black coat is a visual reminder of unwavering commitment when conditions are at their worst.",
    },
    {
      name: "Hair whorls",
      tag: "Devman vs. Anusudhal",
      lore: "Traditional horsemen read a horse's destiny in the whorls (bhanwar) of its coat. A long whorl running down the neck (Devman) was cherished as a sign of good fortune and divine protection; a whorl beneath the eye (Anusudhal) was viewed as an ill omen, making the horse difficult to sell.",
      insight: "While we honour the rich observational lore of ancient breeders, modern horsemanship looks deeper than coat patterns. Some researchers have explored possible links between whorl position and temperament, but the evidence is limited and no definitive relationship is established. What decides how a horse responds is its handling: a true rider builds trust through consistent pressure-and-release training, regardless of physical whorls.",
    },
    {
      name: "The Nukra lineage",
      tag: "Ceremonial durbars vs. institutional protocol",
      lore: "Pure white horses (Nukra) were reserved for royal durbars, high ceremonial processions and spiritual gatherings, revered as embodiments of light and prestige.",
      insight: "In institutional horsemanship, coat colour is secondary to structural soundness and training. Nukra is not a separate breed, but the revered white-coat lineage of Marwar representing the excellence of ceremony and protocol. It teaches cadets high-presentation standards, meticulous grooming and ceremonial precision — skills that translate directly into professional executive presence.",
    },
    {
      name: "Born to dance",
      tag: "The Nachni heritage",
      lore: "Beyond war, the Marwari was celebrated for its natural cadence during regional celebrations. Certain rare lines, known as Nachni (“born to dance”), were trained to step, prance and rise to music with high knee action.",
      insight: "We view the Nachni tradition through the lens of neuromuscular coordination and collection. The Marwari possesses an innate cadence; certain legendary lines exhibit a natural affinity for rhythmic footfall — a living reminder that physical discipline, core strength and grace can be cultivated in horse and rider alike.",
    },
  ],
  vow: {
    inscription: "They called the black horse an omen.",
    voice: "We call it a vow.",
    text: "The Black Stallion carries the colour the bards feared, as a promise: we will not leave the field.",
  },
};

export const reasons = {
  lead: "In the late sixteenth century the horsemen of Marwar faced the ultimate test of terrain and survival, and fielded a cavalry of more than fifty thousand. They held one belief about their horses: a Marwari leaves the battlefield in only three ways.",
  words: ["Victory.", "Death.", "Or carrying its rider home."],
  tail: "The bards tell of horses rearing to shield a fallen rider, crossing rivers wounded, and leaping walls no horse should clear.",
};

export const honour: { name: string; when: string; text: string; image: MediaKey; legend?: boolean }[] = [
  {
    name: "The stallion at the stream",
    when: "The ballads",
    text: "A blue-grey stallion, wounded in the leg, would not leave the field until his rider turned him, then carried his rider across a stream to safety before he fell. Ballads across Rajasthan tell the story, and the details differ from teller to teller.",
    image: "legendChetak",
  },
  {
    name: "The leap from the wall",
    when: "Folklore",
    text: "In one told story, a horse carried its rider up onto a fortress rampart and leapt from the wall to save him. The horse did not survive the fall. Folklore, not record.",
    image: "legendBahadur",
    legend: true,
  },
  {
    name: "The general's horse",
    when: "Marwar, 17th century",
    text: "Remembered in ballad as the war horse of a Marwar general who guarded a young heir through years of danger.",
    image: "fleetArbudh",
  },
  {
    name: "And the rest",
    when: "The ballads",
    text: "Kesar Kalmi, Udal and many more whose names survive only in song.",
    image: "legendGrey",
  },
];

export const honourClose = "Their courage carried riders home alive. The same quality, calm under pressure, is what the academy teaches.";

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
  /**
   * The revival timeline (R14, checked 2 Nov 2026 against Wikipedia "Marwari horse" and the FEI's "Discover... the Marwari", 2020).
   * Where a source gives no year, the label says so ("first half of the 1900s", "2000s") rather than inventing one.
   */
  milestones: [
    { year: "1900s", icon: "crown", title: "A Maharaja steps in", text: "In the first half of the twentieth century Maharaja Umaid Singh of Jodhpur keeps the breed from disappearing. His grandson, Maharaja Gaj Singh II, carries the work on." },
    { year: "1995", icon: "scroll", title: "Marwari Bloodlines", text: "The British horsewoman Francesca Kelly founds Marwari Bloodlines to bring the breed back to notice." },
    { year: "1999", icon: "seal", title: "A society for India's horses", text: "Kelly and Raghuvendra Singh Dundlod lead the group that founds the Indigenous Horse Society of India." },
    { year: "2000s", icon: "laurel", title: "Proved on the course", text: "Marwaris win endurance races at India's national equestrian games, and the Equestrian Federation of India is persuaded to back shows for indigenous horses." },
    { year: "2009", icon: "brand", title: "A register", text: "Official registration of the breed begins; each registered horse is cold-branded with its registration number." },
    { year: "Today", icon: "ears", title: "No longer at risk", text: "Listed as not at risk (FAO 2007; DAD-IS 2020). Marwaris are ridden in endurance and shows, in ceremonies, weddings and festivals; at the academy, in tent pegging." },
  ] as { year: string; icon: "crown" | "scroll" | "seal" | "laurel" | "brand" | "ears"; title: string; text: string }[],
  sources: "Sources: Wikipedia, “Marwari horse”; FEI, “Discover… the Marwari” (2020). Checked 2 November 2026.",
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
