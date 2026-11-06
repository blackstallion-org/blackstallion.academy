/**
 * One switch, read when the site is built (NEXT_PUBLIC_*, so a redeploy applies it):
 *
 *   NEXT_PUBLIC_LOADER_HORSE=pixel   the earlier pixel horse in the loader, instead of the running-rider GIF
 *
 * The horse-zoom opening that used to follow the loader was removed (7 Nov 2026): the first-visit opening is now the Four Worlds
 * intro film (lib/opening/intro-boot.ts, components/worlds/WorldsIntro.tsx). See docs/OPENING.md.
 */
export type LoaderHorse = "silhouette" | "pixel";

export const LOADER_HORSE: LoaderHorse = process.env.NEXT_PUBLIC_LOADER_HORSE === "pixel" ? "pixel" : "silhouette";

/** The running rider shown by the loader (R31, 2 Nov 2026): the supplied gallop silhouettes, one fixed Marwari-coat fill, transparent. */
export const LOADER_IMAGE = "/opening/loader-marwari.webp";

/**
 * The paintings that play inside the horse's silhouette, in story order (origins, royal breeding, Rajput cavalry...), one per
 * LOADER_STORY_STEP seconds, looping. Small WebPs (about 720 px wide); add more here and the sequence lengthens by itself.
 */
export const LOADER_STORY = [
  "/opening/story-origins.webp",
  "/opening/story-breeding.webp",
  "/opening/story-cavalry.webp",
  "/opening/story-battle.webp",
  "/opening/story-heritage.webp",
  "/opening/story-academy.webp",
];
export const LOADER_STORY_STEP = 0.3;
