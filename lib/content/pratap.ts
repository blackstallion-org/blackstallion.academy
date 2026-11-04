/**
 * Copy under the Maharana Pratap and Chetak scroll story. Blueprint Part 9: Chetak at Haldighati (1576) is "legend with a
 * historical core": it is told as told, never as recorded fact. The memorial near Haldighati is supported.
 */
import { asset } from "@/lib/content/asset";
export const pratapStatue = {
  src: asset("/images/story/pratap/statue.webp"),
  width: 1536,
  height: 1024,
  alt: "A bronze statue of Maharana Pratap on horseback, one foreleg raised, on a stone plinth against an evening sky",
  caption: "Maharana Pratap on Chetak, in bronze.",
  credit: "Photograph supplied by the academy; credit to be confirmed.",
};

export const pratapSummary = {
  label: "The story, in short",
  inscription: "A rider, a horse,",
  voice: "and the day they stayed.",
  paragraphs: [
    "Maharana Pratap ruled Mewar in the sixteenth century, and his horse Chetak is remembered beside him. In 1576 the Mewar army met a Mughal force at Haldighati, in the Aravalli hills of Rajasthan. Tradition says Pratap rode Chetak into that battle; period sources do not name the horse, and in the retelling it became as much a part of the story as the rider.",
    "Tradition says Chetak was wounded at Haldighati and still carried Pratap out of danger, and that on the way he cleared a stream in one last leap before he fell. A memorial near Haldighati is still visited in his name. The battle itself is part of the record; the details of the leap and of Chetak’s last moments are legend, handed down over generations, and we tell them as told.",
    "For a young rider the lesson is not the war. It is the bond: a horse that stays with its rider when it is hard, and a rider who stays with the horse. That is the habit the academy builds in the saddle, one calm, trusting hour at a time.",
  ],
  links: [
    { label: "Back to the legend", href: "/legend" },
    { label: "Meet the stallions", href: "/fleet" },
  ],
};
