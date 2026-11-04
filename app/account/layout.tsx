import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Your account",
  robots: { index: false, follow: false },
  alternates: { canonical: null },
};

/** Private, per-request pages (see app/admin/layout.tsx for why they are not streamed behind Suspense). */
export const instant = false;

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return <section data-parallax-skip className="gutter min-h-[80svh] bg-night pb-24 pt-28 md:pt-32">{children}</section>;
}
