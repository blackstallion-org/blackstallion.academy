import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Staff console",
  robots: { index: false, follow: false },
  // Private pages: no canonical (the root layout's "/" canonical must not be inherited here).
  alternates: { canonical: null },
};

/**
 * The console renders each page whole, per request, instead of streaming it behind <Suspense> fallbacks: it is
 * private and never cached (proxy.ts sends no-store), so there is no static shell worth prerendering, and streamed
 * content only appears with JavaScript, while the filter and status forms must also work without it. `instant = false`
 * is Next's documented opt-out for routes that are allowed to block; it also lets /admin/leads/[id] build, whose
 * unknown id would otherwise leave the root layout's usePathname() without a prerenderable value.
 */
export const instant = false;

/**
 * Staff console shell. Every page below re-checks the staff role on the server. `data-parallax-skip` keeps the
 * site-wide scroll parallax (components/motion/SiteParallax.tsx) off console headings and images: it would drift
 * section headings onto the rules beneath them.
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <section data-parallax-skip className="gutter min-h-[80svh] bg-night pb-24 pt-28 md:pt-32">{children}</section>;
}
