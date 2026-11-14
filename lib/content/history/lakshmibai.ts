import { asset } from "@/lib/content/asset";
import type { HistoryPage, Placement, Scene } from "./types";

/** Subject on the side away from the reading area. */
const away = (side: Scene["side"], w: string, b = "6%", m?: Placement): Scene["subject"] => ({
  d: side === "left" ? { r: "6%", b, w } : { x: "6%", b, w },
  m: m ?? { x: "8%", b: "8%", w: "84%" },
});

const L = (n: string) => ({ B: `JH${n}-B`, S: `JH${n}-S`, F: `JH${n}-F` });

const scenes: Scene[] = [
  {
    id: "JH01",
    anchor: "the-rider-and-the-city",
    label: "Jhansi, Bundelkhand",
    title: "The rider and the city",
    body: [
      "Jhansi stands in Bundelkhand, in central India. Its fort sits on a rocky hill above the town, built in the early seventeenth century. In 1857 and 1858 the woman who ruled from it, Rani Lakshmibai, became one of the most remembered figures of the uprising against the East India Company.",
    ],
    sources: [{ label: "Jhansi Fort, Archaeological Survey of India listing" }, { label: "Tapti Roy, Raj of the Rani (2006)" }],
    layers: L("01"),
    side: "left",
    subject: away("left", "34%"),
    relief: "JH01",
  },
  {
    id: "JH02",
    anchor: "learning-to-ride",
    label: "Bithur, the 1830s",
    title: "Learning to ride",
    body: [
      "She was born Manikarnika Tambe in Varanasi, probably in the late 1820s. Her father served at the court of the former Peshwa at Bithur, near Kanpur. There, accounts say, she learned to ride and to handle a sword, unusual skills for a girl of her time.",
    ],
    qualification: "Her year of birth is debated, and most details of her childhood come from biographies written after her death.",
    sources: [{ label: "Joyce Lebra-Chapman, The Rani of Jhansi (1986)" }, { label: "D. B. Parasnis, Jhansi ki Rani Lakshmibai (Marathi, 1894)" }],
    layers: L("02"),
    side: "right",
    subject: away("right", "36%"),
  },
  {
    id: "JH03",
    anchor: "a-queens-responsibility",
    label: "Jhansi, 1842–1854",
    title: "A queen's responsibility",
    body: [
      "She married Gangadhar Rao, the Raja of Jhansi, in the early 1840s and took the name Lakshmibai. Their son died in infancy. Before the Raja died in 1853 the couple adopted a boy, Damodar Rao. The Company refused to recognise him as heir and annexed Jhansi in 1854.",
    ],
    qualification: "The annexation applied the Company's 'doctrine of lapse'. She petitioned against it, without success.",
    sources: [{ label: "Lord Dalhousie's minutes on Jhansi, 1854" }, { label: "Tapti Roy, Raj of the Rani (2006)" }],
    layers: L("03"),
    side: "left",
    subject: away("left", "30%"),
  },
  {
    id: "JH04",
    anchor: "preparing-jhansi",
    label: "Jhansi, 1857",
    title: "Preparing Jhansi",
    body: [
      "In June 1857 Company soldiers at Jhansi rose in revolt, and Europeans in the town were killed. Lakshmibai then governed Jhansi. Over the following months she raised troops, repaired the walls and had guns made for the fort, as a British force advanced through central India.",
    ],
    qualification: "Historians still debate what part, if any, she played in the events of June 1857.",
    sources: [{ label: "Christopher Hibbert, The Great Mutiny (1978)" }, { label: "Tapti Roy, Raj of the Rani (2006)" }],
    layers: L("04"),
    side: "right",
    subject: away("right", "40%"),
  },
  {
    id: "JH05",
    anchor: "the-siege",
    label: "Jhansi, March–April 1858",
    title: "The siege",
    body: [
      "In March 1858 the Central India Field Force under Sir Hugh Rose surrounded Jhansi. For about two weeks guns fired on the walls and the defenders fired back. A relief army led by Tatya Tope was turned back at the Betwa river, and in early April the town was stormed.",
    ],
    sources: [{ label: "Sir Hugh Rose's dispatches, 1858" }, { label: "Saul David, The Indian Mutiny (2002)" }],
    layers: L("05"),
    side: "left",
    subject: away("left", "44%", "4%"),
  },
  {
    id: "JH06",
    anchor: "leaving-the-fort",
    label: "Jhansi to Kalpi, April 1858",
    title: "Leaving the fort",
    body: [
      "As the town fell, Lakshmibai left Jhansi at night with a small escort and her adopted son, and rode north-east towards Kalpi. Popular tradition says she leapt from the fort wall on horseback with the boy tied to her back. It is the image most people know.",
    ],
    qualification: "The leap is tradition. Contemporary records establish only that she escaped by night and reached Kalpi.",
    sources: [{ label: "Joyce Lebra-Chapman, The Rani of Jhansi (1986)" }, { label: "Harleen Singh, The Rani of Jhansi: Gender, History, and Fable in India (2014)" }],
    layers: L("06"),
    side: "right",
    subject: away("right", "42%", "10%"),
  },
  {
    id: "JH07",
    anchor: "the-road-to-gwalior",
    label: "Gwalior, June 1858",
    title: "The road to Gwalior",
    body: [
      "From Kalpi she joined Tatya Tope and Rao Sahib. In June 1858 their forces took Gwalior. Company troops attacked within weeks, and Lakshmibai was killed in the fighting near Gwalior on 17 or 18 June 1858, still on horseback according to most accounts.",
    ],
    qualification: "Accounts differ on the exact date and on how she died.",
    sources: [{ label: "Sir Hugh Rose's dispatches, 1858" }, { label: "Saul David, The Indian Mutiny (2002)" }],
    layers: L("07"),
    side: "left",
    subject: away("left", "40%"),
  },
  {
    id: "JH08",
    anchor: "what-remains",
    label: "Remembrance",
    title: "What remains",
    body: [
      "Her memorial stands in Gwalior. Subhadra Kumari Chauhan's poem 'Jhansi ki Rani' made her a household name, and statues of her on horseback stand across India. What she is remembered for is not one horse or one leap, but refusing to give up the city she governed.",
    ],
    qualification: "No single horse can be identified through her life. The horses named in later songs and stories belong to legend.",
    sources: [{ label: "Subhadra Kumari Chauhan, 'Jhansi ki Rani' (1930)" }, { label: "Harleen Singh (2014)" }],
    layers: L("08"),
    side: "right",
    subject: away("right", "34%"),
  },
];

export const lakshmibai: HistoryPage = {
  route: "/story/rani-lakshmibai",
  format: "personal",
  title: "Rani Lakshmibai of Jhansi · A Scroll Story",
  description:
    "Eight painted scenes from the life of Rani Lakshmibai: learning to ride at Bithur, the annexation of Jhansi, the siege of 1858, the night she left the fort and the road to Gwalior, with tradition and record told apart.",
  opening: {
    label: "A scroll story · Jhansi, 1828–1858",
    inscription: "Rani Lakshmibai",
    voice: "who would not give up Jhansi.",
    lede: "A queen, a city and the year that made her a legend. Scroll to unroll the painting, or read the story straight through.",
    poster: "JH-POSTER",
  },
  chapters: [
    { id: "chapter-the-rider", numeral: "I", title: "The rider", scenes: scenes.slice(0, 2) },
    { id: "chapter-the-kingdom", numeral: "II", title: "The kingdom", scenes: scenes.slice(2, 4) },
    { id: "chapter-the-siege", numeral: "III", title: "The siege", scenes: scenes.slice(4, 6) },
    { id: "chapter-the-memory", numeral: "IV", title: "The road and the memory", scenes: scenes.slice(6, 8) },
  ],
  statue: {
    src: asset("/images/story/lakshmibai/statue.webp"),
    width: 1200,
    height: 1600,
    alt: "A bronze statue of Rani Lakshmibai on a rearing horse, sword raised, on a stone plinth against a blue sky in Shimla",
    caption: "Rani Lakshmibai, in bronze, at Shimla.",
    credit: "Photograph: Slyronit, CC BY-SA 4.0, via Wikimedia Commons",
    creditHref: "https://commons.wikimedia.org/wiki/File:Rani_Lakshmibai_Statue,_Shimla.jpg",
  },
  afterword: {
    label: "Afterword",
    inscription: "Record",
    voice: "and remembrance.",
    paragraphs: [
      "Lakshmibai's life is known from two kinds of source. The first is the record: East India Company correspondence about the annexation of Jhansi, her own petitions, and the dispatches of the officers who besieged the town and fought at Gwalior. These fix the outline: the adoption of Damodar Rao, the annexation of 1854, the siege of March and April 1858, her escape to Kalpi and her death near Gwalior in June 1858.",
      "The second is remembrance: Marathi and Hindi biographies written decades later, folk songs, and Subhadra Kumari Chauhan's poem of 1930. They give the scenes most people picture, including the leap from the fort wall with her son on her back. These stories matter because they show how India came to remember her, but they are not the same as evidence, and this scroll labels them as tradition.",
      "Historians also disagree about her part in the killing of Europeans at Jhansi in June 1857. Some contemporaries blamed her; others, then and since, argue she had no control over the soldiers involved. The scroll does not settle that argument; it tells you that it exists.",
      "Damodar Rao survived the war and lived until 1906. In 1943 the Indian National Army named its women's regiment after her. For BSAH cadets the lesson is the one in her riding: composure, skill learned early, and the courage to keep going when the road is hard.",
    ],
  },
  related: [
    { href: "/story/pratap-chetak", label: "Pratap & Chetak", blurb: "Six painted chapters from Mewar, 1576." },
    { href: "/story/alexander-bucephalus", label: "Alexander & Bucephalus", blurb: "A horse nobody could settle, and the boy who did." },
    { href: "/history/india", label: "Seven roads of the Indian horse", blurb: "From Marwar to Haifa." },
  ],
};
