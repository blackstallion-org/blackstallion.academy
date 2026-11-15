import type { HistoryPage, Placement, Scene } from "./types";

/**
 * Maharana Pratap and Chetak in the history-scroll format of the Rani Lakshmibai story (12 Nov 2026, owner's request).
 * Plates PRnn-B are composited from the Pratap story's own painted bands and scenery; the subjects PRnn-S are its hero
 * cutouts, rigged as puppets in pratap-rigs.ts. Blueprint Part 9: Chetak at Haldighati is "legend with a historical core",
 * so the horse's deeds are told as told, never as recorded fact.
 */

/** Subject on the side away from the reading area. */
const away = (side: Scene["side"], w: string, b = "6%", m?: Placement): Scene["subject"] => ({
  d: side === "left" ? { r: "6%", b, w } : { x: "6%", b, w },
  m: m ?? { x: "8%", b: "8%", w: "84%" },
});

const L = (n: string) => ({ B: `PR${n}-B`, S: `PR${n}-S`, F: `PR${n}-F` });

const legend = "A legend told across generations, not a recorded event.";

const scenes: Scene[] = [
  {
    id: "PR01",
    anchor: "a-rider-and-his-horse",
    label: "Mewar, the 1570s",
    title: "A rider and his horse",
    body: [
      "Pratap Singh of the Sisodia house became ruler of Mewar, in the Aravalli hills of Rajasthan, in 1572. Where many Rajput rulers had made terms with the Mughal emperor Akbar, he would not. Tradition gives him a horse to match: Chetak, remembered as blue-grey, quick and fearless.",
    ],
    qualification: "Chetak is not named in any source from Pratap's lifetime; the horse comes from later Rajput tradition and bardic poetry.",
    sources: [{ label: "Kaviraj Shyamaldas, Vir Vinod (1886)" }, { label: "James Tod, Annals and Antiquities of Rajasthan (1829–32)" }],
    layers: L("01"),
    side: "right",
    subject: away("right", "34%"),
  },
  {
    id: "PR02",
    anchor: "the-army-of-mewar",
    label: "Mewar, 1576",
    title: "The army of Mewar",
    body: [
      "In 1576 Akbar sent an army into Mewar under Raja Man Singh of Amber. Pratap gathered his horsemen in the hills: Rajput clans, Bhil archers who knew every pass, and an Afghan contingent under Hakim Khan Sur.",
    ],
    sources: [{ label: "Abd al-Qadir Badauni, Muntakhab-ut-Tawarikh, vol. 2" }, { label: "G. N. Sharma, Mewar and the Mughal Emperors (1954)" }],
    layers: L("02"),
    side: "left",
    subject: away("left", "34%"),
  },
  {
    id: "PR03",
    anchor: "the-pass-of-yellow-earth",
    label: "Haldighati, June 1576",
    title: "The pass of yellow earth",
    body: [
      "The armies met near Haldighati, a narrow pass named for its turmeric-yellow soil. The fighting was close and hard, with horsemen, foot soldiers and war elephants in the dust. Badauni, who rode with the Mughal army, left an eyewitness account of the day.",
    ],
    qualification: "The date is usually given as 18 June 1576; some accounts give 21 June.",
    sources: [{ label: "Badauni, Muntakhab-ut-Tawarikh, vol. 2" }, { label: "Abul Fazl, Akbarnama, vol. 3" }],
    layers: L("03"),
    side: "right",
    subject: away("right", "46%", "4%"),
  },
  {
    id: "PR04",
    anchor: "into-the-line",
    label: "Haldighati, June 1576",
    title: "Into the line",
    body: [
      "Tradition says Pratap rode straight for Man Singh, and that Chetak reared and set his forefeet on the commander's elephant. In the clash a blade fixed to the elephant's trunk cut the horse's leg.",
    ],
    qualification: "Told in Rajput tradition and later painting; the Mughal accounts mention neither the charge at the elephant nor the horse.",
    sources: [{ label: "Tod, Annals and Antiquities of Rajasthan" }, { label: "Shyamaldas, Vir Vinod" }],
    layers: L("04"),
    side: "right",
    subject: away("right", "50%", "5%"),
  },
  {
    id: "PR05",
    anchor: "chetak-carries-on",
    label: "After the battle",
    title: "Chetak carries on",
    body: [
      "The Mughal army held the field, but Pratap was not taken. Wounded, he was led out of the fighting. Tradition says the injured Chetak carried him away from the battle, on three good legs.",
    ],
    qualification: "That Pratap escaped is recorded; how Chetak carried him is legend.",
    sources: [{ label: "Abul Fazl, Akbarnama, vol. 3" }, { label: "Tod, Annals and Antiquities of Rajasthan" }],
    layers: L("05"),
    side: "left",
    subject: away("left", "36%"),
  },
  {
    id: "PR06",
    anchor: "one-last-leap",
    label: "Near Haldighati",
    title: "One last leap",
    body: ["On the way, the story goes, a stream lay across their path, and Chetak cleared it in one final leap with his rider low on his back."],
    qualification: legend,
    sources: [{ label: "Tod, Annals and Antiquities of Rajasthan" }, { label: "Shyamaldas, Vir Vinod" }],
    layers: L("06"),
    side: "right",
    subject: away("right", "50%", "14%"),
  },
  {
    id: "PR07",
    anchor: "chetak-rests",
    label: "Balicha, near Haldighati",
    title: "Chetak rests",
    body: ["Once his rider was safe, tradition says, the wounded horse lay down and did not rise again, and Pratap stayed beside him."],
    qualification: legend,
    sources: [{ label: "Tod, Annals and Antiquities of Rajasthan" }],
    layers: L("07"),
    side: "left",
    subject: away("left", "48%", "5%"),
  },
  {
    id: "PR08",
    anchor: "a-bond-remembered",
    label: "Mewar, remembered",
    title: "A bond remembered",
    body: [
      "A memorial to Chetak stands at Balicha, near Haldighati, and is still visited. Pratap fought on for twenty more years from the hills, and by his death at Chavand in 1597 had won back much of Mewar.",
    ],
    sources: [{ label: "Chetak memorial (Chetak Smarak), Balicha, Rajasthan" }, { label: "G. N. Sharma, Mewar and the Mughal Emperors (1954)" }],
    layers: L("08"),
    side: "right",
    subject: away("right", "30%"),
  },
];

export const pratapChetak: HistoryPage = {
  route: "/story/pratap-chetak",
  format: "personal",
  title: "Maharana Pratap and Chetak · A Scroll Story",
  description:
    "Eight painted scenes of Maharana Pratap and his horse Chetak: Mewar's refusal, the army in the hills, the Battle of Haldighati in 1576, and the legend of the horse that carried its rider out, told from the Mughal histories and Rajput tradition.",
  opening: {
    label: "A scroll story · Mewar, 1572–1597",
    inscription: "Maharana Pratap and Chetak",
    voice: "a bond through the storm.",
    lede: "A ruler of the hills, his horse, and the day at Haldighati that made them a legend. Scroll to unroll the painting, or read the story straight through.",
    poster: "PR-POSTER",
  },
  chapters: [
    { id: "chapter-the-bond", numeral: "I", title: "The bond", scenes: scenes.slice(0, 1) },
    { id: "chapter-preparing-for-battle", numeral: "II", title: "Preparing for battle", scenes: scenes.slice(1, 2) },
    { id: "chapter-haldighati", numeral: "III", title: "Haldighati", scenes: scenes.slice(2, 3) },
    { id: "chapter-courage", numeral: "IV", title: "Courage", scenes: scenes.slice(3, 4) },
    { id: "chapter-the-legendary-escape", numeral: "V", title: "The legendary escape", scenes: scenes.slice(4, 7) },
    { id: "chapter-remembrance", numeral: "VI", title: "Remembrance", scenes: scenes.slice(7, 8) },
  ],
  afterword: {
    label: "Afterword",
    inscription: "How we know",
    voice: "what we know.",
    paragraphs: [
      "The battle of Haldighati is well recorded. Abul Fazl's Akbarnama gives the Mughal court's account, and Badauni, who fought on the Mughal side, wrote what he saw. Both record that Pratap left the field alive. Neither names his horse.",
      "Chetak belongs to Rajput tradition: bardic poetry, later chronicles and painting. James Tod carried the story to English readers in 1829, and Kaviraj Shyamaldas gathered Mewar's own record in Vir Vinod in 1886. The charge at the elephant, the leap and the horse's last moments are legend, and this scroll tells them as told.",
      "For a young rider the lesson is not the war. It is the bond: a horse that stays with its rider when it is hard, and a rider who stays with the horse. That is the habit the academy builds in the saddle, one calm, trusting hour at a time.",
    ],
  },
  related: [
    { href: "/story/rani-lakshmibai", label: "Rani Lakshmibai", blurb: "The queen who would not give up Jhansi." },
    { href: "/story/alexander-bucephalus", label: "Alexander & Bucephalus", blurb: "Twelve mosaic rooms, from Pella to the Hydaspes." },
    { href: "/history/india", label: "Horses of India", blurb: "From Shalihotra to Haifa: the horses that carried a subcontinent." },
  ],
};
