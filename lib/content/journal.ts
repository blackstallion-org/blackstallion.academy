import type { MediaKey } from "./media";

/**
 * Reel 14 · The Chronicle. Original articles written from the breed history in
 * Blueprint Part 9. Folklore is labelled as such in the text.
 */

export type Block = { t: "p" | "h" | "quote" | "note"; text: string };

export type Post = {
  slug: string;
  title: [string, string];
  category: "Legend" | "Academy" | "Circuit";
  dek: string;
  minutes: number;
  date: string;
  cover: MediaKey;
  body: Block[];
};

export const posts: Post[] = [
  {
    slug: "the-horse-that-would-not-leave-the-field",
    title: ["The horse that", "would not leave the field."],
    category: "Legend",
    dek: "Victory, death, or the wounded rider: the vow behind the Marwari, and the stallion at the stream.",
    minutes: 5,
    date: "2026-10-01",
    cover: "legendChetak",
    body: [
      { t: "p", text: "The horsemen of Marwar held a simple belief about their horses. A Marwari, they said, leaves a battlefield in only three ways: in victory, in death, or carrying its wounded rider to safety. It is the kind of line that sounds like poetry until you read how often the old ballads put it to the test." },
      { t: "p", text: "Their horses had been shaped by centuries of desert life and strict breeding: slim, hard-legged, enduring, and famous for a courage that bordered on stubbornness. The bards tell of Marwaris rearing over fallen riders, crossing rivers wounded, and refusing to turn until a hand on the rein told them to." },
      { t: "h", text: "The stallion at the stream" },
      { t: "p", text: "One ballad, told in many versions, is of a blue-grey stallion wounded in the leg in the middle of a fight. He would not leave the field until his rider turned him." },
      { t: "p", text: "Then he carried his rider away and across a stream before he collapsed. The tellers disagree on the stream's width and the wound's depth. They agree on the horse." },
      { t: "quote", text: "A Marwari leaves the field in victory, in death, or carrying its rider home." },
      { t: "p", text: "Folklorists argue over the details. What nobody argues over is why the story survived: it is a story about loyalty under pressure, and about an animal that would not abandon the person who trusted it." },
      { t: "h", text: "Why it matters in an arena" },
      { t: "p", text: "Nobody asks a cadet to ride into battle. But every cadet meets a smaller version of that stallion's choice. A horse spooks. A jump goes wrong. A lance misses its peg in front of the whole school. The easy response is to leave the field. The Marwari's answer, and the academy's, is to stay, settle, and ride again." },
      { t: "p", text: "That is why the vow sits at the heart of the Black Stallion Academy. We do not tell children the legend so they will admire a horse. We tell it so they will recognise the choice when it arrives, and make the braver one." },
      { t: "note", text: "This is oral tradition, retold without reference to any one conflict, clan or faith; details vary between tellers." },
    ],
  },
  {
    slug: "why-the-ears-curl",
    title: ["Why the", "ears curl."],
    category: "Legend",
    dek: "The lyre-shaped ears that turn 180 degrees, and why breeders read them as a seal of purity.",
    minutes: 4,
    date: "2026-09-24",
    cover: "legendEars",
    body: [
      { t: "p", text: "You can pick out a Marwari across a crowded fairground by its ears. They rise, curve inward, and meet at the tips, like the two arms of a lyre or a pair of hands about to touch. Only one other breed in the world shares the shape: its neighbour, the Kathiawari of Gujarat." },
      { t: "h", text: "A hundred and eighty degrees" },
      { t: "p", text: "The ears are not decoration. A Marwari can turn each ear through 180 degrees, independently, and the breed is known for unusually sharp hearing. Desert riders relied on it. In the dark, the ears would swing toward a sound long before a rider heard anything at all." },
      { t: "p", text: "In the arena the same ears read the rider. Tense shoulders, held breath and a racing heart all change how a rider sits and moves, and a sensitive horse answers with flicking, pinned or swivelling ears. Instructors at the academy teach cadets to watch them: they are the most honest feedback a young rider will ever get." },
      { t: "quote", text: "The ears are the first thing to vanish when the blood is mixed." },
      { t: "h", text: "A seal of purity" },
      { t: "p", text: "Breeders in Marwar have a saying that the ears are the first trait to disappear when a Marwari is crossed with another breed. Straighten the curve and you have lost the horse. So the ears became a kind of certificate, read by eye at every horse fair in Rajasthan long before there was a studbook to check." },
      { t: "p", text: "Today the Marwari Horse Society keeps that studbook, with official registration since 2009. The ears are still the first thing anyone looks at." },
      { t: "h", text: "Our monogram" },
      { t: "p", text: "When we designed the academy's mark, there was only one place to start. The monogram is two curling ears and a blaze between them. It stands for the same thing the ears have always stood for in Marwar: you can tell what something is made of by what it pays attention to." },
    ],
  },
  {
    slug: "omens-of-the-stable",
    title: ["Omens", "of the stable."],
    category: "Legend",
    dek: "Greys, blazes, devman whorls and the black horse: how Marwar read a horse's future in its coat.",
    minutes: 4,
    date: "2026-09-17",
    cover: "legendGrey",
    body: [
      { t: "p", text: "In old Marwar, buying a horse was part horsemanship and part astrology. Breeders read a horse's colour and the whorls in its coat as a forecast of the luck it would bring its rider, and much of that folklore is still alive in Rajasthan's stables today." },
      { t: "h", text: "The favoured colours" },
      { t: "p", text: "Grey is the most prized colour of all, and grey horses fetch the highest prices. Piebald and skewbald coats, patched with white, come next. A white blaze down the face together with four white socks is considered a lucky set of markings." },
      { t: "p", text: "Pure white is a different matter. A white horse cannot be registered as a Marwari; some call it Nukra and treat it as a type of its own." },
      { t: "h", text: "Reading the whorls" },
      { t: "p", text: "Whorls, the small swirls where the hair changes direction, carry their own meanings. A long whorl running down the neck, called a devman, is a sign of good fortune. A whorl beneath the eye, called an anusudhal, is unpopular with buyers and thought to be unlucky for the rider. Whorls on the fetlocks are said to bring victory." },
      { t: "quote", text: "They called the black horse an omen. We call it a vow." },
      { t: "h", text: "The black horse" },
      { t: "p", text: "Then there is black. In Marwar folklore a black horse stands for night and death, and has long been considered unlucky. Which raises an obvious question for an academy called the Black Stallion." },
      { t: "p", text: "We chose the colour deliberately. The bards feared the black horse because it was the colour of the end. We carry it as a promise about endings: we will not be the ones who leave the field. Every cadet who earns a seal is keeping that promise." },
      { t: "note", text: "Colour and whorl beliefs vary between breeders and regions; these are the most widely reported." },
    ],
  },
  {
    slug: "from-royalty-to-cart-horse-and-back",
    title: ["From royalty to cart horse,", "and back."],
    category: "Legend",
    dek: "How the Marwari nearly vanished after 1947, and the people who brought it back.",
    minutes: 6,
    date: "2026-09-10",
    cover: "legendRevival",
    body: [
      { t: "p", text: "For most of its history the Marwari was a royal horse in the most literal sense. Only royal and Rajput warrior families could own one, and the old saying held that a Marwari stood above a prince. Its fall, when it came, was fast." },
      { t: "h", text: "The colonial years" },
      { t: "p", text: "The British preferred their own Thoroughbreds and had little use for the native breeds. Through the colonial period the Marwari was sent to fewer battles and bred with less care, and by the 1930s the quality and numbers of the stock were in decline. Marwar's lancers still rode for Sir Pratap Singh in the First World War, close to the end of the age of cavalry. Maharaja Umaid Singh of Jodhpur stepped in during the first half of the twentieth century to keep the breed from disappearing." },
      { t: "h", text: "Independence, and the empty stables" },
      { t: "p", text: "After 1947 the princely states joined the new republic, and in the land reforms of the 1950s many nobles lost their estates. The great stables had nowhere to go. Thousands of horses were sold as pack animals, castrated or shot. To many people the Marwari had become a symbol of the old order, and few were sorry to see it go." },
      { t: "p", text: "Crossed with other breeds and worked as cart horses, the pure line thinned. By the turn of the century only a few thousand purebred Marwaris were thought to remain." },
      { t: "quote", text: "The line refused to end." },
      { t: "h", text: "The revival" },
      { t: "p", text: "The comeback was led by a handful of people. Maharaja Gaj Singh II of Jodhpur continued his grandfather's work. In 1995 a British horsewoman, Francesca Kelly, founded Marwari Bloodlines to promote the breed, and a breed society formed in India the same year. In 1999 Kelly and Raghuvendra Singh Dundlod led the founding of the Indigenous Horse Society of India." },
      { t: "p", text: "Kelly and Dundlod rode Marwaris to endurance wins at the national games, which helped persuade the Equestrian Federation of India to sanction shows for indigenous horses. Official registration began in 2009. Today the breed is no longer considered at risk." },
      { t: "h", text: "The stallion that stayed" },
      { t: "p", text: "One story from the revival is told often in Marwar. When Maharaja Gaj Singh II visited the thikana of Badgaon to choose a colt sired by its celebrated stallion Vangalia, he asked to see the sire himself. The thakur, afraid of losing his best horse, led Vangalia out. The Maharaja admired him and left him where he stood: the stallion served the breed best where the mares of south Marwar could reach him. He chose a colt and rode home." },
      { t: "p", text: "It is a small story about a big idea. A breed survives when the people who love it think about the next generation, not their own stable. That is the work every BSAH hub now continues, one cadet at a time." },
    ],
  },
  {
    slug: "the-dancing-horses-of-marwar",
    title: ["The dancing horses", "of Marwar."],
    category: "Legend",
    dek: "Nachni, the revaal, and the wedding processions where the warhorse becomes a dancer.",
    minutes: 3,
    date: "2026-09-03",
    cover: "legendNachni",
    body: [
      { t: "p", text: "For a horse remembered for war, the Marwari has a surprisingly gentle second life. Walk through a Rajasthani town during wedding season and you may see one at the head of a procession, decked in mirror-work and tassels, stepping in time to the drums." },
      { t: "h", text: "Nachni: born to dance" },
      { t: "p", text: "Some Marwari lines are said to carry a strain called nachni, which simply means born to dance. With a skilled handler, these horses lift their feet, step sideways and rise to the music in a performance that crowds gather to watch. Many breeders believe the true nachni line has almost faded. Glimpses of it remain at weddings and festivals across the state." },
      { t: "quote", text: "The same animal that charged elephants will dance at a wedding." },
      { t: "h", text: "The revaal" },
      { t: "p", text: "Even without music, many Marwaris move differently from other breeds. They often have a natural ambling gait, close to a pace, known as the revaal. It is smooth and easy for a rider to sit for hours, which made it valuable on long desert journeys and makes it comfortable for young riders today." },
      { t: "p", text: "There is a lesson in the contrast. Strength and grace are not opposites. The same horse that would not leave a battlefield can be calm enough, and responsive enough, to dance. We look for both in a cadet." },
    ],
  },
  {
    slug: "ten-grams-of-rein",
    title: ["Ten grams", "of rein."],
    category: "Academy",
    dek: "What a child learns when shouting does nothing and the lightest touch turns half a tonne.",
    minutes: 4,
    date: "2026-08-27",
    cover: "journalReins",
    body: [
      { t: "p", text: "Every new cadet tries it once. The horse wanders toward the gate, and the child pulls harder on the reins. The horse braces, lifts its head and keeps going. Then an instructor says something that sounds impossible: let go a little, and ask again." },
      { t: "h", text: "Force fails, clarity works" },
      { t: "p", text: "A well-schooled horse answers a few grams of pressure on the rein, together with the rider's seat and legs. Hard, sudden pulling does the opposite of what the rider wants: it causes discomfort and resistance. The horse is not being stubborn. It is answering exactly what it was told." },
      { t: "p", text: "Children learn this in their hands before they can explain it. Quiet, consistent signals get results; loud, inconsistent ones do not. Hands, seat and legs have to agree. Both sides of the body have to coordinate. And none of it works if the rider is tense, because a horse can feel tension long before it feels a rein." },
      { t: "quote", text: "You cannot shout a horse into trusting you." },
      { t: "h", text: "The lesson outside the arena" },
      { t: "p", text: "It is a skill that travels. Getting a response from someone by being calm and precise rather than loud works at home, in a classroom and on a team, and it is much easier to learn from a horse, which never pretends to be convinced." },
      { t: "p", text: "That is why reins sit beside the ears and the saddle on our anatomy plate. Each part of the horse teaches something. The reins teach the oldest lesson of leadership: authority is quiet, and the lightest touch, given clearly, can move half a tonne." },
    ],
  },
];

export const postBySlug = (slug: string) => posts.find((p) => p.slug === slug);
