import type { HistoryPage, Scene } from "./types";

const L = (n: string) => ({ B: `IN${n}-B`, S: `IN${n}-S`, F: `IN${n}-F` });
const sub = (side: Scene["side"], w: string, b = "8%"): Scene["subject"] => ({
  d: side === "left" ? { r: "5%", b, w } : { x: "5%", b, w },
  m: { x: "6%", b: "10%", w: "88%" },
});

const scenes: Scene[] = [
  {
    id: "IN01",
    anchor: "the-keepers-of-marwar",
    label: "Marwar, Rajasthan",
    title: "The keepers of Marwar",
    body: [
      "In the dry country around Jodhpur, the Rathore rulers of Marwar and the families who served them bred a horse for the desert: hardy on little water, quick over sand, with ears that curve inward until the tips almost touch. The Marwari carried Rajput cavalry for centuries, and breeders kept its lines by memory and by the stud records of noble houses.",
      "In the twentieth century, as cavalry gave way to machines, the breed came close to disappearing. Since the 1990s breeders and enthusiasts have worked to revive it and to record its bloodlines again. Every BSAH cadet rides one.",
    ],
    qualification: "Stories that the breed descends from horses saved from a shipwreck belong to tradition, not record.",
    sources: [{ label: "BSAH, The Marwari (/legend)" }, { label: "Indigenous Horse Society of India, breed notes" }],
    layers: L("01"),
    side: "left",
    subject: sub("left", "30%"),
    relief: "IN01",
  },
  {
    id: "IN02",
    anchor: "knowledge-passed-through-hands",
    label: "The Shalihotra tradition",
    title: "Knowledge passed through hands",
    body: [
      "Long before veterinary colleges, India had a written science of the horse. Sanskrit treatises attributed to the sage Shalihotra describe how to judge a horse's build and temperament, how to feed and stable it, and how to treat its injuries and illnesses.",
      "The knowledge travelled by copying. Scribes made new manuscripts, teachers added commentaries, and over the centuries the texts were translated into other languages, including Persian. In the stables, it passed the other way too: from an experienced keeper's hands to an apprentice's, one horse at a time.",
    ],
    interpretation: true,
    qualification:
      "Shalihotra's dates and authorship are uncertain; the texts bearing his name were compiled over a long period. The stable scene is an artistic interpretation.",
    sources: [{ label: "Shalihotra Samhita manuscript tradition" }, { label: "G. J. Meulenbeld, A History of Indian Medical Literature" }],
    layers: L("02"),
    side: "right",
    subject: sub("right", "34%"),
  },
  {
    id: "IN03",
    anchor: "shivajis-hill-country",
    label: "The Sahyadri, Maharashtra",
    title: "Shivaji's hill country",
    body: [
      "In the seventeenth century Shivaji Bhonsle built a Maratha state among the steep ridges of the Sahyadri, the Western Ghats. Its strength lay in hill forts such as Rajgad and Raigad, and in light cavalry that could climb narrow ghat roads and move fast between them.",
      "Maratha horsemen were of two kinds: bargirs, who rode horses supplied by the state, and shiledars, who brought their own. Small, sure-footed horses suited the broken country better than heavy chargers. Shivaji was crowned at Raigad in 1674, and the state he founded grew for another century.",
    ],
    sources: [{ label: "Jadunath Sarkar, Shivaji and His Times" }, { label: "Stewart Gordon, The Marathas 1600–1818 (1993)" }],
    layers: L("03"),
    side: "left",
    subject: sub("left", "32%"),
  },
  {
    id: "IN04",
    anchor: "bajiraos-long-roads",
    label: "The Deccan to the north",
    title: "Bajirao's long roads",
    body: [
      "Bajirao I became Peshwa, chief minister of the Maratha state, in 1720, and is remembered for the speed of his campaigns. His cavalry travelled light, lived off the country and covered long distances quickly, appearing where opponents did not expect them.",
      "At Palkhed in 1728 his manoeuvres cut off the Nizam's army from its supplies without a pitched battle. In 1737 he rode north to the outskirts of Delhi. Speed on horseback depended on care for the horse: rest, grazing and water along roads that ran across half of India.",
    ],
    sources: [{ label: "Stewart Gordon, The Marathas 1600–1818 (1993)" }, { label: "G. S. Sardesai, New History of the Marathas" }],
    layers: L("04"),
    side: "right",
    subject: sub("right", "34%"),
  },
  {
    id: "IN05",
    anchor: "ranjit-singhs-stables",
    label: "Lahore, historic Punjab",
    title: "Ranjit Singh's stables",
    body: [
      "Maharaja Ranjit Singh ruled the Sikh Empire from Lahore, in historic Punjab, from 1799 until his death in 1839. Lahore is today in Pakistan. He built one of the strongest armies in Asia, with regular cavalry trained alongside its traditional horsemen.",
      "His love of horses was famous. European visitors to his court described stables of fine horses from Punjab, Central Asia and beyond, shown in trappings of gold, silver and embroidered cloth. He went to great lengths to acquire horses he admired, and visitors wrote that he would talk about them for hours.",
    ],
    sources: [{ label: "Khushwant Singh, Ranjit Singh: Maharaja of the Punjab (1962)" }, { label: "Emily Eden and William Osborne, travel accounts of the 1838 visit" }],
    layers: L("05"),
    side: "left",
    subject: sub("left", "34%"),
  },
  {
    id: "IN06",
    anchor: "manipurs-polo-ponies",
    label: "Imphal, Manipur",
    title: "Manipur's polo ponies",
    body: [
      "In Manipur, in north-east India, people have long played sagol kangjei: polo on the small, quick Manipuri pony. The game was part of court life and festivals, played on open grounds such as Mapal Kangjeibung in Imphal, often described as one of the oldest polo grounds still in use.",
      "British officers in neighbouring Cachar learned the game in the 1850s and founded a club at Silchar in 1859. From there polo spread across India and to Britain, and on to the world. The Manipuri pony itself is now rare, and local breeders work to protect it.",
    ],
    sources: [{ label: "Horace A. Laffaye, The Evolution of Polo (2009)" }, { label: "Government of Manipur, Manipuri pony conservation notes" }],
    layers: L("06"),
    side: "right",
    subject: sub("right", "32%"),
  },
  {
    id: "IN07",
    anchor: "the-riders-who-reached-haifa",
    label: "Haifa, 1918",
    title: "The riders who reached Haifa",
    body: [
      "On 23 September 1918, in the last months of the First World War, the Jodhpur and Mysore Lancers rode against the town of Haifa, then held by Ottoman and German forces. Attacking with lances across difficult ground near the Kishon river, they took the town in a single afternoon.",
      "Major Dalpat Singh of the Jodhpur Lancers was among those killed. The Teen Murti memorial in New Delhi honours the Indian cavalry of the campaign, and the Indian Army marks 23 September as Haifa Day. It is often described as one of the last cavalry charges of its kind.",
    ],
    sources: [{ label: "Official History of the War: Military Operations, Egypt and Palestine, vol. II" }, { label: "Indian Army, Haifa Day commemorations" }],
    layers: L("07"),
    side: "left",
    subject: sub("left", "38%", "6%"),
  },
];

export const india: HistoryPage = {
  route: "/history/india",
  format: "anthology",
  title: "Seven Roads of the Indian Horse · An Illustrated History",
  description:
    "An illustrated vertical scroll of horsemanship in India: the keepers of Marwar, the Shalihotra tradition, Shivaji's hill country, Bajirao's long roads, Ranjit Singh's stables, Manipur's polo ponies and the riders who reached Haifa.",
  opening: {
    label: "An illustrated history · India",
    inscription: "Seven roads",
    voice: "of the Indian horse.",
    lede: "From the desert of Marwar to the polo grounds of Imphal, horses carried India's history. Seven scenes, painted in the manner of the miniature, each with its sources.",
    asset: "IN00",
  },
  chapters: [{ id: "india-scenes", numeral: "", title: "Seven roads", scenes }],
  related: [
    { href: "/story/rani-lakshmibai", label: "Rani Lakshmibai", blurb: "The queen who would not give up Jhansi. A scroll story in eight scenes." },
    { href: "/story/pratap-chetak", label: "Pratap & Chetak", blurb: "Six painted chapters from Mewar, 1576." },
    { href: "/story/alexander-bucephalus", label: "Alexander & Bucephalus", blurb: "From Macedon to the Hydaspes." },
    { href: "/history/world", label: "Seven roads of the world's horse", blurb: "The companion anthology." },
  ],
};
