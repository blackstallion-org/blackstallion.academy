/** What a browser reports about the connection. Only Chromium-based browsers expose it; elsewhere there is simply no signal. */
type Connection = { saveData?: boolean; effectiveType?: string };

/**
 * True when the visitor turned on Data Saver or is on a 2G link. For them the heavy extras hold back: the autoplaying films
 * stay on their poster, the 3D stage uses its light model and nothing is fetched ahead of need. The page itself is unchanged.
 */
export function isSaveData(connection: Connection | undefined): boolean {
  return connection?.saveData === true || connection?.effectiveType === "slow-2g" || connection?.effectiveType === "2g";
}

/** Browser-side reading of {@link isSaveData}; false while rendering on the server. */
export function saveDataMode(): boolean {
  if (typeof navigator === "undefined") return false;
  return isSaveData((navigator as Navigator & { connection?: Connection }).connection);
}
