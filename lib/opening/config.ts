/**
 * Two switches for the ink-horse opening and the running-horse loader. Both are read when the site is built (NEXT_PUBLIC_*),
 * so a redeploy applies them, and neither touches any other part of the site:
 *
 *   NEXT_PUBLIC_OPENING=off          no opening film on the home page
 *   NEXT_PUBLIC_LOADER_HORSE=pixel   the earlier pixel horse in the loader, instead of the running silhouette
 *
 * Remove the variables and both come back. To see the opening again during a visit, add ?opening to the home page address.
 * To undo the whole change in code: `git revert` its single commit (see docs/OPENING.md).
 */
export type LoaderHorse = "silhouette" | "pixel";

export const OPENING_ENABLED: boolean = process.env.NEXT_PUBLIC_OPENING !== "off";
export const LOADER_HORSE: LoaderHorse = process.env.NEXT_PUBLIC_LOADER_HORSE === "pixel" ? "pixel" : "silhouette";
