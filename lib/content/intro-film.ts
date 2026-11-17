import { asset } from "./asset";

/**
 * The opening film (17 Nov 2026, owner: "add this as the website intro and remove the current one"): "The Lineage", one minute on
 * parchment, built in video/ (video/README.md) from the site's own paintings and headlines, with a Rajasthani folk score and horse
 * sounds. Shown once per session over the home page (components/opening/IntroFilm.tsx). It replaced the 37.5 s "From Marwar to the black
 * stallion, in ink" film (16 Nov), whose files were removed. H.264 + AAC in one file, so sound is always in sync: desktop 1920 x 1080,
 * phones 1280 x 720, faststart. The picture is illustration, and the frame says so (`note`). The same film plays on /film.
 */
export const introFilm = {
  label: "The Lineage",
  desktop: asset("/video/the-lineage.mp4"),
  mobile: asset("/video/the-lineage-mobile.mp4"),
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
