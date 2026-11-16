/**
 * /legend opening (16 Nov 2026, owner's brief): how the Marwari was made, built around the film "The Marwari Horse, Pride of
 * India" (Absurd & Fantastical, YouTube krzoNYH1Xbk, 2020, 11 min). The film's transcript is the primary reference; every
 * claim below was checked against the record before it was written, and where the film and the record differ the record wins:
 *  - Rathores driven from Kannauj in 1193 into the Thar; strict selective breeding from the 12th century; origins otherwise
 *    obscure (Rajput warhorses, later Turkoman influence; little Arab influence): Wikipedia "Marwari horse" (citing Hendricks,
 *    International Encyclopedia of Horse Breeds; Gupta et al.; Bennett).
 *  - Inward-curving ears whose tips meet, able to turn through 180°; the natural ambling gait (revaal): Wikipedia, as above.
 *  - Colour lore (black unlucky; blaze and four socks lucky; grey auspicious; white not registered): Wikipedia, as above,
 *    and the film; presented as tradition, never as fact about temperament.
 *  - Chetak at Haldighati, 1576: legend, presented as legend (the film; /story/pratap-chetak).
 *  - Decline under British rule and after independence; saved by Maharaja Umaid Singh in the first half of the 20th century,
 *    continued by Maharaja Gaj Singh II; Francesca Kelly (a British horsewoman, not American as the film says) founded
 *    Marwari Bloodlines in 1995; with Raghuvendra Singh Dundlod she founded the Indigenous Horse Society of India in 1999
 *    (the film says 1990): Wikipedia, as above.
 *  - Status today: "not at risk" (FAO 2007; DAD-IS 2020). The film's "only five thousand remain" is not repeated.
 * Not used: "national horse of India" (not an official designation), the film's "50,000 horsemen" figure, exact heights.
 */
export const film = {
  id: "krzoNYH1Xbk",
  title: "The Marwari Horse, Pride of India",
  channel: "Absurd & Fantastical",
  year: 2020,
  minutes: 11,
  url: "https://www.youtube.com/watch?v=krzoNYH1Xbk",
};

export const origins = {
  label: "Reel 01 · Act I · The Legend",
  inscription: "The Marwari",
  voice: "made by the desert.",
  lede: "Eight centuries, from a lost kingdom on the Ganges to the dunes of the Thar: how Rajasthan bred the horse with the curving ears.",
  filmIntro:
    "The film retells the breed's story, from its legends to its revival. Below, the same story in five moments, checked against the historical record. Where the bards speak, we say so.",
  beats: [
    {
      when: "1193",
      inscription: "Out of Kannauj,",
      voice: "into the Thar.",
      body: "The Rathores, a Rajput clan, were driven from their kingdom of Kannauj in 1193 and withdrew into the deserts of Marwar. There water came by the cup and the sand ran for days. A horse that could not endure did not survive; the Rathores, and their horses, did.",
      tag: "History",
    },
    {
      when: "12th century",
      inscription: "Bred for",
      voice: "the sand.",
      body: "From the twelfth century the Rathores bred with discipline, keeping only the finest stallions. What they selected is still seen today: a hardy, easy-keeping horse, a high-carried neck, and ears that curve inward until the tips meet and can turn through half a circle. Its deeper origins are debated: Rajput warhorses, later horses of Turkoman type, and little Arab blood.",
      tag: "History",
      marks: [
        { name: "The ear", text: "Lyre-shaped, curving in until the tips touch." },
        { name: "The bearing", text: "Neck high, legs hard, bred for the desert." },
        { name: "The gait", text: "A natural, smooth amble, the revaal." },
      ],
    },
    {
      when: "1576",
      inscription: "The horse that",
      voice: "would not leave the field.",
      body: "Tradition holds that a Marwari left the battlefield only in victory, in death, or carrying its wounded rider home. The best-loved telling is Chetak, Maharana Pratap's horse at Haldighati in 1576, who is said to have carried his king clear of the field. These are legends, and they are kept as legends.",
      tag: "Legend",
      link: { href: "/story/pratap-chetak", label: "Pratap & Chetak" },
    },
    {
      when: "1947",
      inscription: "Nearly",
      voice: "lost.",
      body: "British officers preferred Thoroughbreds and polo ponies, and the Marwari lost its standing. After independence, as the princely states dissolved, many of their horses were sold as pack animals, gelded or killed. A breed eight hundred years in the making came close to disappearing.",
      tag: "History",
    },
    {
      when: "1995 · 1999",
      inscription: "Brought",
      voice: "back.",
      body: "Maharaja Umaid Singh had begun to save the breed in the first half of the twentieth century, and his grandson, Maharaja Gaj Singh II, carried the work on. In 1995 Francesca Kelly founded Marwari Bloodlines; in 1999, with Raghuvendra Singh Dundlod, she founded the Indigenous Horse Society of India. Today the breed is recorded as not at risk.",
      tag: "History",
    },
  ],
  closing: {
    inscription: "Eight hundred years,",
    voice: "handed to your child.",
    body: "The Black Stallion Academy of Horsemanship exists to carry this forward: to keep the Marwari's heritage alive and honestly told, to raise riders with the discipline the breed was bred to answer, and to bring India's equestrian legacy inside the school gate.",
    commitments: ["Preserve the Marwari's heritage", "Develop disciplined riders", "Carry India's equestrian legacy forward"],
  },
  sources:
    "Sources: the film above; Wikipedia, “Marwari horse” (FAO 2007 and DAD-IS 2020 conservation status). Where the film and the record differ, the record is used.",
};
