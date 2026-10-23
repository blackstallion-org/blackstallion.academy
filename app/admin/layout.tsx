import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Staff console",
  robots: { index: false, follow: false },
};

/** Staff console shell. Every page below re-checks the staff role on the server. */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <section className="gutter min-h-[80svh] bg-night pb-24 pt-28 md:pt-32">{children}</section>;
}
