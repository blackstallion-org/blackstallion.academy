import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { LiveDashboard } from "@/components/sections/admin/dashboard/LiveDashboard";
import { sampleNow } from "@/lib/admin/sample";
import { AdminShell } from "@/app/admin/AdminShell";
import { refreshSample } from "./sample-actions";

/** Like the console layout: rendered whole per request (see app/admin/layout.tsx). */
export const instant = false;

export const metadata: Metadata = { title: "Overview preview (SAMPLE)", robots: { index: false, follow: false }, alternates: { canonical: null } };

/**
 * Development only: the staff overview with invented SAMPLE data and a pretend live feed, for checking the layout, the motion and the
 * phone view without a staff account or a live database. It is rendered on the server and refreshed by a server action, exactly
 * like the real page, so hydration is exercised too. In production this route does not exist (404); it is outside the /admin guard
 * on purpose, because it holds no real data.
 */
export default async function AdminDashboardPreview() {
  if (process.env.NODE_ENV === "production") notFound();
  await connection();
  return (
    <section data-parallax-skip className="gutter min-h-[80svh] bg-night pb-24 pt-28 md:pt-32">
      <AdminShell name="Preview" current="overview">
        <LiveDashboard initial={sampleNow()} refresh={refreshSample} intervalMs={6000} />
      </AdminShell>
    </section>
  );
}
