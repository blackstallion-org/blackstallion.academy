import type { MetadataRoute } from "next";

/**
 * Indexing rules. Set NEXT_PUBLIC_ALLOW_INDEXING=1 only on the approved production deployment; every preview, staging
 * or local build is kept out of search engines so draft content and sample data are never indexed by accident.
 */
export default function robots(): MetadataRoute.Robots {
  if (process.env.NEXT_PUBLIC_ALLOW_INDEXING !== "1") {
    return { rules: [{ userAgent: "*", disallow: "/" }] };
  }
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/schools/access", "/verify/", "/admin", "/auth/"] }],
    sitemap: "https://blackstallion.academy/sitemap.xml",
    host: "https://blackstallion.academy",
  };
}
