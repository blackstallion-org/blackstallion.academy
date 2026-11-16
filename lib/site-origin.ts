/**
 * The origin written into e-mail links (password reset, sign-up confirmation, Google return). Security audit L2 (17 Nov 2026):
 * the request's Host / X-Forwarded-Host headers are only the last resort, for a local server.
 *
 * 1. NEXT_PUBLIC_SITE_URL when set (the canonical address once the domain is live).
 * 2. On Vercel, the addresses the platform itself sets (not the request): the project's production domain for production
 *    deployments, the deployment's own URL for previews. The site is still served on its vercel.app address, so a hard-coded
 *    blackstallion.academy would send reset links to a domain that does not serve it yet.
 * 3. Otherwise (next dev / next start on this machine) the request's host.
 */
export function siteOrigin(host: string, proto: string): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured) return configured.replace(/\/+$/, "");
  const vercel = process.env.VERCEL_ENV === "production" ? process.env.VERCEL_PROJECT_PRODUCTION_URL : process.env.VERCEL_URL;
  if (vercel) return `https://${vercel.replace(/^https?:\/\//, "").replace(/\/+$/, "")}`;
  return host ? `${proto === "http" ? "http" : "https"}://${host}` : "";
}
