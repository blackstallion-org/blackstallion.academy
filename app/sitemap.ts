import type { MetadataRoute } from "next";
import { posts } from "@/lib/content/journal";
import { tournaments } from "@/lib/content/records";
import { hubs } from "@/lib/content/schools";

const BASE = "https://blackstallion.academy";

/**
 * Public, indexable pages only. Excluded on purpose: /schools/access (private, noindex) and /verify/<code> (sample
 * records, noindex). Hub and tournament pages are included because they are public, but they carry SAMPLE data.
 */
const STATIC_ROUTES = [
  "/", "/legend", "/lore", "/anatomy", "/statue", "/lithos", "/science", "/why", "/curriculum", "/fleet", "/cadets",
  "/parents", "/safety", "/equipment", "/schools", "/schools/mou", "/verify", "/tournaments", "/command", "/journal",
  "/about", "/contact", "/privacy",
];

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    ...STATIC_ROUTES.map((path) => ({ url: `${BASE}${path === "/" ? "" : path}`, changeFrequency: "monthly" as const, priority: path === "/" ? 1 : 0.7 })),
    ...posts.map((p) => ({ url: `${BASE}/journal/${p.slug}`, changeFrequency: "yearly" as const, priority: 0.5 })),
    ...hubs.map((h) => ({ url: `${BASE}/schools/${h.slug}`, changeFrequency: "monthly" as const, priority: 0.5 })),
    ...tournaments.map((t) => ({ url: `${BASE}/tournaments/${t.slug}`, changeFrequency: "monthly" as const, priority: 0.4 })),
  ];
}
