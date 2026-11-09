import type { HistoryPage, Scene } from "./types";

const L = (n: string) => ({ B: `WO${n}-B`, S: `WO${n}-S`, F: `WO${n}-F` });
const sub = (side: Scene["side"], w: string, b = "8%"): Scene["subject"] => ({
  d: side === "left" ? { r: "5%", b, w } : { x: "5%", b, w },
  m: { x: "6%", b: "10%", w: "88%" },
});

const scenes: Scene[] = [
  {
    id: "WO01",
    anchor: "xenophon-understanding-the-horse",
    label: "Athens, 4th century BC",
    title: "Xenophon: understanding the horse",
    body: [
      "Xenophon was an Athenian soldier and writer who lived from about 430 to 354 BC. His short book On Horsemanship is one of the oldest complete works on the subject to survive anywhere.",
      "Much of it still reads as good advice. Choose a horse by looking first at its feet. Never handle a horse in anger, he warns, because anger acts without forethought. Teach by reward rather than force, and lead a nervous horse calmly toward what frightens it until it learns there is nothing to fear. The first rule at BSAH is the same.",
    ],
    sources: [{ label: "Xenophon, On Horsemanship (Peri Hippikes)" }],
    layers: L("01"),
    side: "left",
    subject: sub("left", "32%"),
  },
  {
    id: "WO02",
    anchor: "horses-along-the-silk-roads",
    label: "The Silk Roads",
    title: "Horses along the Silk Roads",
    body: [
      "The Silk Roads were not one road but many routes linking China, Central Asia, Persia and the Mediterranean. Silk moved west; horses were among the most valued goods moving east.",
      "In the second century BC the Han emperor Wudi sent armies across the mountains to Ferghana, in Central Asia, to obtain its famous 'heavenly horses'. For centuries after, Chinese states traded silk and later tea for horses from the steppe and the high passes. Caravans crossed mountain routes such as those of the Pamirs, and the horse was both cargo and companion.",
    ],
    sources: [{ label: "Sima Qian, Records of the Grand Historian, ch. 123" }, { label: "Valerie Hansen, The Silk Road: A New History (2012)" }],
    layers: L("02"),
    side: "right",
    subject: sub("right", "30%"),
    relief: "WO02",
  },
  {
    id: "WO03",
    anchor: "the-relay-across-the-steppe",
    label: "The Mongol Empire, 13th century",
    title: "The relay across the steppe",
    body: [
      "The Mongol Empire stretched from Korea to eastern Europe. To hold it together the Mongols built the yam, a relay system of stations along the main routes where official riders could find food, shelter and fresh horses.",
      "A messenger carrying the right tablet of authority could change horses at each station and keep moving, so news crossed the empire far faster than any single horse could carry it. Marco Polo described the stations with amazement. The system depended on the herds kept at every post, and on the people who looked after them.",
    ],
    qualification: "Marco Polo's figures for the number of stations and horses are not reliable and are not repeated here.",
    sources: [{ label: "Marco Polo, The Travels, book II" }, { label: "Adam J. Silverstein, Postal Systems in the Pre-Modern Islamic World (2007)" }],
    layers: L("03"),
    side: "left",
    subject: sub("left", "36%"),
  },
  {
    id: "WO04",
    anchor: "the-horse-beside-the-tent",
    label: "Arabia",
    title: "The horse beside the tent",
    body: [
      "Among the Bedouin of Arabia, a good mare was one of a family's most precious possessions. Accounts from the nineteenth century describe mares kept close to the tent, sharing water and shade with the household, handled from foalhood by children and adults alike.",
      "Bloodlines were remembered and recited rather than written, traced through the mother's line into named strains. Horses bred this way, carried west by traders and travellers, became the foundation of the Arabian breed and influenced many others, including the Thoroughbred. Closeness and calm handling were part of the breeding.",
    ],
    interpretation: true,
    qualification: "The tent scene is an artistic interpretation drawn from nineteenth-century travellers' accounts.",
    sources: [{ label: "Lady Anne Blunt, Bedouin Tribes of the Euphrates (1879)" }, { label: "Peter Upton, The Classic Arab Horse" }],
    layers: L("04"),
    side: "right",
    subject: sub("right", "34%"),
  },
  {
    id: "WO05",
    anchor: "the-mounted-archer",
    label: "The steppe",
    title: "The mounted archer",
    body: [
      "For more than two thousand years, peoples of the Eurasian steppe, from the Scythians and Parthians to the Huns and Mongols, fought and hunted as mounted archers. They used short composite bows of wood, horn and sinew, powerful enough to shoot from the saddle.",
      "The skill was learned in childhood. A rider had to guide the horse with legs and balance alone, leaving both hands for the bow, and shoot to the side or even behind while moving. Today horseback archery is practised again as a sport in Mongolia, Korea, Hungary and beyond.",
    ],
    sources: [{ label: "Herodotus, Histories 4" }, { label: "Christopher I. Beckwith, Empires of the Silk Road (2009)" }],
    layers: L("05"),
    side: "left",
    subject: sub("left", "36%"),
  },
  {
    id: "WO06",
    anchor: "napoleon-and-marengo",
    label: "France, 1800–1815",
    title: "Napoleon and Marengo",
    body: [
      "Marengo was a small grey Arab stallion, said to have come from Egypt after the French campaign of 1798–99 and named after Napoleon's victory at Marengo in 1800. He is remembered as one of the horses Napoleon rode in many campaigns.",
      "After Waterloo in 1815 he was taken to England, where he lived until 1831. His skeleton is now at the National Army Museum in London. Jacques-Louis David painted Napoleon crossing the Alps on a rearing horse; in fact he crossed on a sure-footed mule, as a later painter showed.",
    ],
    qualification: "Much of Marengo's story, including his age and service record, rests on tradition and has been questioned by historians.",
    sources: [{ label: "National Army Museum, London: Marengo" }, { label: "Paul Delaroche, Bonaparte Crossing the Alps (1850)" }],
    layers: L("06"),
    side: "right",
    subject: sub("right", "30%"),
  },
  {
    id: "WO07",
    anchor: "behind-the-lines",
    label: "The First World War, 1914–1918",
    title: "Behind the lines",
    body: [
      "Horses and mules were essential in the First World War. They hauled guns, ambulances and supplies through mud that stopped motor lorries. Millions served, on every front.",
      "Behind the lines, veterinary hospitals treated wounds, exhaustion, mange and lameness, and returned many animals to work. Army veterinary corps, among them the British Army Veterinary Corps and Indian veterinary staff, ran hospitals, convalescent depots and mobile sections. After the war Dorothy Brooke found former war horses working in Cairo and in 1934 founded the hospital that became the charity Brooke.",
    ],
    sources: [{ label: "Royal Army Veterinary Corps Museum" }, { label: "Brooke, history of the charity" }],
    layers: L("07"),
    side: "left",
    subject: sub("left", "36%"),
  },
];

export const world: HistoryPage = {
  route: "/history/world",
  format: "anthology",
  title: "Seven Roads of the World's Horse · An Illustrated History",
  description:
    "An illustrated vertical scroll of horsemanship across the world: Xenophon, the Silk Roads, the Mongol relay, the Bedouin mare, the mounted archer, Napoleon's Marengo and the veterinary lines of the First World War.",
  opening: {
    label: "An illustrated history · The world",
    inscription: "Seven roads",
    voice: "of the world's horse.",
    lede: "Across three thousand years and four continents, people learned what horses need. Seven scenes, painted in the manner of the miniature, each with its sources.",
    asset: "WO00",
  },
  chapters: [{ id: "world-scenes", numeral: "", title: "Seven roads", scenes }],
  related: [
    { href: "/story/alexander-bucephalus", label: "Alexander & Bucephalus", blurb: "A horse nobody could settle. A scroll story in eight scenes." },
    { href: "/story/rani-lakshmibai", label: "Rani Lakshmibai", blurb: "The queen who would not give up Jhansi." },
    { href: "/story/pratap-chetak", label: "Pratap & Chetak", blurb: "Six painted chapters from Mewar, 1576." },
    { href: "/history/india", label: "Seven roads of the Indian horse", blurb: "The companion anthology." },
  ],
};
