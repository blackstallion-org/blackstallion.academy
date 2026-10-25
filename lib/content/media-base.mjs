/**
 * Where the site's heavy static media (stills, 3D models, video, audio) is loaded from.
 *
 * One plain ES module so that the very same rules run in the application (lib/content/asset.ts), in next.config.mjs
 * (image host allow-list and Content-Security-Policy) and in the tests. No imports, no side effects.
 */

/** Paths under public/ that can be served from the media base. /brand, /draco and /animations stay on this site. */
export const MEDIA_PREFIXES = ["/images/", "/media/", "/models/", "/video/", "/audio/"];

/**
 * Normalises NEXT_PUBLIC_MEDIA_BASE_URL. Returns "" (media served from this site) unless the value is a clean URL:
 * https only (plain http is accepted for a loopback test server), no credentials, query string or fragment.
 * A wrong value therefore never produces broken links; it simply leaves the switch off.
 * Example: "https://<ref>.supabase.co/storage/v1/object/public/website-media/" -> same without the trailing slash.
 *
 * @param {string | null | undefined} raw
 * @returns {string}
 */
export function parseMediaBase(raw) {
  const value = String(raw ?? "").trim();
  if (!value) return "";
  let url;
  try {
    url = new URL(value);
  } catch {
    return "";
  }
  const loopback = url.hostname === "127.0.0.1" || url.hostname === "localhost" || url.hostname === "[::1]";
  const allowed = url.protocol === "https:" || (url.protocol === "http:" && loopback);
  if (!allowed || url.username || url.password || url.search || url.hash) return "";
  return `${url.origin}${url.pathname.replace(/\/+$/, "")}`;
}

/**
 * The URL to request for a site path such as "/images/legend/legend-sand.webp".
 * With no base, or for any path outside MEDIA_PREFIXES (absolute URLs, data: URIs, /brand/...), the input is returned unchanged.
 *
 * @param {string} base  A value already normalised by parseMediaBase ("" = off).
 * @param {string} path
 * @returns {string}
 */
export function assetUrl(base, path) {
  if (!base || typeof path !== "string") return path;
  if (!MEDIA_PREFIXES.some((prefix) => path.startsWith(prefix))) return path;
  return base + encodeURI(path);
}
