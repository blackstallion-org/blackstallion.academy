import { asset } from "./asset";

/**
 * The opening film (17 Nov 2026, owner: "add this as the website intro and remove the current one"): "The Lineage", one minute on
 * parchment, built in video/ (video/README.md) from the site's own paintings and headlines, with a Rajasthani folk score and horse
 * sounds. Shown once per session over the home page (components/opening/IntroFilm.tsx). It replaced the 37.5 s "From Marwar to the black
 * stallion, in ink" film (16 Nov), which moved to /about. H.264 + AAC in one file, so sound is always in sync: desktop 1920 x 1080,
 * phones 1280 x 720, faststart. The picture is illustration, and the frame says so (`note`). The same film plays on /film. The film it replaced as the opening plays on /about (`illustratedFilm` below).
 */
export const introFilm = {
  label: "The Lineage",
  desktop: asset("/video/the-lineage-2611.mp4"),
  mobile: asset("/video/the-lineage-2611-mobile.mp4"),
  /** the film's first frame (plain parchment), so the picture does not jump when the video starts */
  poster: asset("/video/the-lineage-intro-poster.webp"),
  /** running time in seconds (the film's own end hands over to the page) */
  length: 60,
  note: "Illustrated film",
  music: { title: "Desert Rajasthan Folk Music", credit: "alex-morgan, Pixabay Content License" },
  /** what the film shows, for screen readers */
  description:
    "An illustrated film on parchment: the academy's crest inks in; a rider on a black Marwari crosses the Thar below Marwar's fort; " +
    "the Mughal stables; Maharana Pratap on Chetak at Haldighati; Rani Lakshmibai rides out of Jhansi at night; Alexander and Bucephalus; " +
    "a caravan and an archer on the Silk Roads; every scene joined on one map; a cadet beside a horse today; and the academy's crest and motto.",
} as const;

/**
 * The illustrated film (16 Nov 2026, owner's brief), the website's first opening film until 17 Nov 2026, now shown on /about
 * (owner, 17 Nov: keep it, the Lineage is the opening). 37.5 s, one continuous historical journey cut from three generated parchment
 * animations and set to the owner's score: Marwar on the map → Rajput horsemen → British-era Jodhpur → the Jodhpur Lancers → the royal
 * stables → the lone black stallion. Built by scripts/build-intro-film.mjs. H.264 + AAC, desktop 1920 × 1080, phones 1280 × 720, faststart.
 */
export const illustratedFilm = {
  label: "From Marwar to the black stallion, in ink",
  desktop: asset("/video/intro-film.mp4"),
  mobile: asset("/video/intro-film-mobile.mp4"),
  poster: asset("/video/intro-film-poster.webp"),
  length: 37.5,
  note: "Illustrated film",
  music: { title: "Sovereign of the Marwar", credit: "original score" },
  description:
    "An illustrated film on parchment: the map of Marwar draws itself in ink and rises into Rajput horsemen before their forts; " +
    "British-era Jodhpur; the Jodhpur Lancers charge across the desert; the Maharaja among his Marwari horses; and a lone black " +
    "stallion standing on the map of the world.",
} as const;

/**
 * The black-horse film that opens the intro (owner, 22 Nov 2026: "put back the old horse, 10 seconds, black, and cut it fast so it won't
 * be like a fade animation"). The 10 s clip of a black Marwari stallion in a dark studio that used to be chapter 07 of /history/marwar
 * (removed 17 Nov 2026), cropped to 1120 x 720 to drop the generator's corner mark, silent. It plays first on a black stage and the intro
 * cuts straight to "The Lineage" (`introFilm`) the instant it ends, with no fade. AI-generated, and labelled so.
 */
export const openingHorse = {
  label: "A black Marwari stallion, in a dark studio",
  desktop: asset("/video/intro-horse.mp4"),
  mobile: asset("/video/intro-horse-mobile.mp4"),
  poster: asset("/video/intro-horse-poster.webp"),
  /** running time in seconds */
  length: 10,
  note: "AI-generated film",
  description: "A black Marwari stallion stands in a dark studio, turning its head; its inward-curving ears catch the light.",
} as const;
