/**
 * Two switches, read when the site is built (NEXT_PUBLIC_*, so a redeploy applies them); neither touches any other part of the site:
 *
 *   NEXT_PUBLIC_OPENING=off          the first visit to the home page ends like every other page change (a plain fade), with no zoom
 *   NEXT_PUBLIC_LOADER_HORSE=pixel   the earlier pixel horse in the loader, instead of the running-rider GIF
 *
 * Remove the variables and both come back. To see the opening again during a visit, add ?opening to the home page address.
 * To undo the whole change in code: `git revert` its commits (see docs/OPENING.md).
 */
export type LoaderHorse = "silhouette" | "pixel";

export const OPENING_ENABLED: boolean = process.env.NEXT_PUBLIC_OPENING !== "off";
export const LOADER_HORSE: LoaderHorse = process.env.NEXT_PUBLIC_LOADER_HORSE === "pixel" ? "pixel" : "silhouette";
