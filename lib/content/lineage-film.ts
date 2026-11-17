import { asset } from "./asset";
import { navMenus, numberedPage } from "./site";

/**
 * "The Lineage", the one-minute intro film of the whole website (built in video/, see video/README.md), shown on /film.
 * Every scene is the site's own artwork and headline, so each chapter links to the page it comes from. Page titles are looked
 * up from site.ts (never typed here), so the film's chapter list always matches the menus.
 */
export const lineageFilm = {
  label: "The Lineage",
  poster: asset("/video/the-lineage-poster.jpg"),
  posterMobile: asset("/video/the-lineage-poster-mobile.jpg"),
  desktop: asset("/video/the-lineage.mp4"),
  mobile: asset("/video/the-lineage-mobile.mp4"),
  posterAlt: "Maharana Pratap on Chetak leads the charge at Haldighati, painted in the miniature style, with the title A bond through the storm",
  duration: 60,
};

type Chapter = { at: number; place: string; scene: string; href?: string };

const chapterList: Chapter[] = [
  { at: 0, place: "The academy", scene: "The crest inks into parchment." },
  { at: 4, place: "Marwar, Rajasthan", scene: "A rider on a black Marwari crosses the Thar below the fort.", href: "/history/marwar" },
  { at: 11, place: "The Shalihotra tradition · Mughal India", scene: "A healer at the stable arcade; a groom leads a horse.", href: "/history/india" },
  { at: 16, place: "Haldighati, June 1576", scene: "Pratap on Chetak leads the charge.", href: "/story/pratap-chetak" },
  { at: 24, place: "Jhansi to Kalpi, April 1858", scene: "Rani Lakshmibai rides out of the fort at night.", href: "/story/rani-lakshmibai" },
  { at: 30, place: "Macedon", scene: "Alexander turns Bucephalus toward the sun.", href: "/story/alexander-bucephalus" },
  { at: 35, place: "The Silk Roads · The steppe", scene: "A caravan and a mounted archer on the road west.", href: "/history/world" },
  { at: 41, place: "The lineage", scene: "Every scene, joined on one map.", href: "/legend" },
  { at: 48, place: "Today", scene: "A cadet and a horse: eight hundred years, handed to your child.", href: "/cadets" },
  { at: 55, place: "The academy", scene: "Dominus sui, dominus equi.", href: "/about" },
];

/** An unnumbered page's label as the menus show it. */
function menuLabel(href: string) {
  for (const m of navMenus) for (const col of m.columns) for (const l of col.links) if (l.href === href) return l.label;
  return undefined;
}

/** The chapters with the title of the page each one opens (from site.ts, or the label of an unnumbered page). */
export const lineageChapters = chapterList.map((c) => ({
  ...c,
  pageTitle: c.href ? (numberedPage(c.href)?.title ?? menuLabel(c.href)) : undefined,
}));

export const lineageCredits =
  "The Lineage: an intro film made for the academy from the website's own paintings (generated imagery in the miniature style) " +
  "and one photograph. Music: \"Desert Rajasthan Folk Music\", alex-morgan (Pixabay Content License). Horse sounds: Freesound " +
  "contributors swiftoid and craigsmith (CC0), Pixabay and Mixkit (free licences).";
