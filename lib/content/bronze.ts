import type { BeatId } from "@/lib/bronze/choreography";
import type { MediaKey } from "@/lib/content/media";

/**
 * "Bronze and Time" (home, between the first-ride panels and the anatomy plate): the words of its four chapters.
 * Wording follows the claims ledger (docs/BLUEPRINT.md Part 9): selective breeding in Marwar from the 12th century, ears that
 * curve inward and turn through 180 degrees, the field-and-rider saying as a belief, and the digital passport as it exists.
 * Nothing here says a statue exists: the bronze is the academy's own 3D Marwari, and the page says so.
 */

export type Beat = {
  id: BeatId;
  /** Label in the chapter index. */
  nav: string;
  /** Two lines: the first upright, the second the italic line that lands (the site's two voices). */
  title: [string, string];
  body: string[];
  /** The link at the end of the last chapter. */
  links?: { href: string; label: string }[];
};

export const bronze = {
  label: "Bronze and Time",
  /** What the section is, for a screen reader (the canvas itself is decorative). */
  describe: "A bronze Marwari turning slowly under foundry light, in four short chapters: Bronze and Time, Held in Stillness, Fire to Form, Lineage on Record.",
  /** Shown under the stage: the statue is a rendering, not an object in a courtyard. */
  note: "Digital bronze: the academy's own 3D Marwari, cast in light. Not a real statue.",
  /** The still beside chapter two, and the poster when the scene cannot run (reduced motion, no WebGL). */
  image: "legendToday" as MediaKey,
  imageAlt: "A young cadet touching the curled ear of a Marwari stallion at dawn",
  poster: "legendBlack" as MediaKey,
  posterAlt: "A black Marwari stallion in profile",
  beats: [
    {
      id: "bronze",
      nav: "Bronze",
      title: ["Bronze", "and Time"],
      body: [
        "Eight hundred years of selective breeding in Marwar, built around one idea: that a horse should be made to be trusted. Ears that curve inward until the tips touch, and turn through a half circle to listen.",
        "Poured in fire, finished in patience. A breed, like bronze, keeps its shape by being worked slowly, and here it stands still long enough to be seen.",
      ],
    },
    {
      id: "stillness",
      nav: "Stillness",
      title: ["Held in", "Stillness"],
      body: [
        "Marwar's riders tell of a horse that leaves the field only in victory, in death, or carrying its rider. It is a belief, not a record, and it frames everything a cadet learns about the horse beside them.",
      ],
    },
    {
      id: "form",
      nav: "Form",
      title: ["Fire", "to Form"],
      body: [
        "Metal is shaped while it flows and fixed once it cools. A young rider is shaped the same unhurried way: the basics before speed, taught before the canter, one calm repetition at a time.",
      ],
    },
    {
      id: "record",
      nav: "Record",
      title: ["Lineage", "on Record"],
      body: [
        "A statue keeps one moment. A cadet's record keeps many: each credential sits in a digital Sovereign Passport and can be checked against the academy's registry by its code.",
      ],
      links: [
        { href: "/cadets#passport", label: "Open the Sovereign Passport" },
        { href: "/legend", label: "Read the legend" },
      ],
    },
  ] satisfies Beat[],
};

/**
 * Which instant of which clip the statue is cast in. A frozen walk with one foreleg lifted is how equestrian monuments are
 * posed; the numbers are seconds into the clip (the Walk is 0.8 s long).
 */
export const statuePose = { clip: "Walk", time: 0.1 };
